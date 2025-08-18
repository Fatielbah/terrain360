const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8081/api"

class PostService {
  getAuthHeaders() {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const headers = {
      "Content-Type": "application/json",
    }
    if (user.token) {
      headers.Authorization = `Bearer ${user.token}`
    }
    return headers
  }

  // Headers pour FormData (pas de Content-Type automatique)
  getAuthHeadersForFormData() {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const headers = {}
    if (user.token) {
      headers.Authorization = `Bearer ${user.token}`
    }
    return headers
  }

  async createPost(postData, currentUser, medias = []) {
    // Ajout de 'medias' en paramètre
    try {
      if (!currentUser || !currentUser.id) {
        throw new Error("Utilisateur non connecté ou invalide")
      }

      console.log("=== DEBUG CREATION POST ===")
      console.log("Utilisateur connecté:", currentUser)
      console.log("Données post:", postData)
      console.log("Médias à uploader:", medias)

      // CHANGEMENT: Le backend attend un PostDTO avec auteurId directement
      const postPayload = {
        contenu: postData.contenu,
        date: new Date().toISOString(),
        auteurId: currentUser.id, // Envoyer l'ID de l'auteur directement
      }

      const formData = new FormData()
      // CHANGEMENT: Le nom de la partie JSON doit être "postDTO" pour correspondre à @RequestPart PostDTO postDTO
      formData.append("postDTO", new Blob([JSON.stringify(postPayload)], { type: "application/json" }))

      // Ajout des médias au FormData
      if (medias && medias.length > 0) {
        medias.forEach((file) => {
          formData.append("medias", file) // Le nom du champ doit correspondre à @RequestPart("medias")
        })
      }

      console.log("Payload FormData envoyé au backend (Post):", postPayload)

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: this.getAuthHeadersForFormData(), // Utiliser les headers sans Content-Type
        body: formData,
      })

      console.log("Statut réponse (Post):", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur réponse serveur (Post):", errorText)
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("Post créé avec succès:", result)
      return result
    } catch (error) {
      console.error("Erreur createPost:", error)
      throw error
    }
  }

  async getAllPosts() {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()

      if (!text.trim()) {
        return []
      }

      try {
        const data = JSON.parse(text)
        return Array.isArray(data) ? data : []
      } catch (jsonError) {
        console.error("Erreur parsing JSON (getAllPosts):", text.substring(0, 200) + "...")
        return []
      }
    } catch (error) {
      console.error("Erreur getAllPosts:", error)
      return []
    }
  }

  async getPostById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()

      if (!text.trim()) {
        throw new Error("Réponse vide du serveur (getPostById)")
      }

      try {
        return JSON.parse(text)
      } catch (jsonError) {
        console.error("Erreur parsing JSON (getPostById):", text.substring(0, 200) + "...")
        throw new Error("Réponse JSON invalide du serveur (getPostById)")
      }
    } catch (error) {
      console.error("Erreur getPostById:", error)
      throw error
    }
  }

  async updatePost(id, postData) {
    try {
      console.log("=== DEBUG MODIFICATION POST ===")
      console.log("ID post:", id)
      console.log("Données reçues (Post):", postData)

      const updatePayload = {
        contenu: postData.contenu,
        // L'auteur n'est généralement pas modifié lors d'une mise à jour de contenu
        // Si vous avez besoin de mettre à jour d'autres champs, ajoutez-les ici
      }

      console.log("Payload envoyé pour modification (Post):", JSON.stringify(updatePayload, null, 2))

      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updatePayload),
      })

      console.log("Statut réponse modification (Post):", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur réponse serveur (modification Post):", errorText)
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("Post modifié avec succès:", result)
      return result
    } catch (error) {
      console.error("Erreur updatePost:", error)
      throw error
    }
  }

  async deletePost(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Erreur deletePost:", error)
      throw error
    }
  }

  transformPostForDisplay(post) {
    if (!post) return null

    return {
      id: post.id,
      contenu: post.contenu,
      date: post.date,
      auteurId: post.auteur?.id,
      likes: post.likes ? post.likes.length : 0,
      comments: post.commentaires ? post.commentaires.length : 0,
      views: post.vues ? post.vues.length : 0,
      // Construire l'URL complète pour chaque média
      medias: post.medias
        ? post.medias.map((media) => ({
            id: media.id,
            name: media.name,
            type: media.type,
            url: `${API_BASE_URL}/posts/api/files/${media.id}`, // Construire l'URL ici
          }))
        : [],
    }
  }
}

export default new PostService()
