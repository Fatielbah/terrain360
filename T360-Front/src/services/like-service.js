const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8081/api"

class LikeService {
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

  async addLike(postId, utilisateurId) {
    try {
      const likeRequest = { postId, utilisateurId } // Créer l'objet LikeRequestDTO
      console.log("Sending addLike request:", likeRequest)

      const response = await fetch(`${API_BASE_URL}/likes`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(likeRequest), // Envoyer l'objet JSON
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erreur addLike:", error)
      throw error
    }
  }

  async removeLike(postId, utilisateurId) {
    try {
      const likeRequest = { postId, utilisateurId } // Créer l'objet LikeRequestDTO
      console.log("Sending removeLike request:", likeRequest)

      const response = await fetch(`${API_BASE_URL}/likes`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(likeRequest), // Envoyer l'objet JSON
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      return true // Indiquer le succès
    } catch (error) {
      console.error("Erreur removeLike:", error)
      throw error
    }
  }

  async getLikesByPost(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/likes/post/${postId}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const text = await response.text()
      if (!text.trim()) {
        return []
      }

      try {
        return JSON.parse(text)
      } catch (jsonError) {
        console.error("Erreur parsing JSON (getLikesByPost):", text.substring(0, 200) + "...")
        return []
      }
    } catch (error) {
      console.error("Erreur getLikesByPost:", error)
      return []
    }
  }
}

export default new LikeService()
