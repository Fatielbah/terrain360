export const apiService = {
  // Configuration de base
  baseURL: "http://localhost:8081/api",

  // Headers par défaut
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Ajoutez le token d'authentification si disponible
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  },

  // Headers pour les fichiers
  getFileHeaders() {
    const headers = {}

    // Ajoutez le token d'authentification si disponible
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  },

  // Méthode pour gérer les erreurs
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`

      switch (response.status) {
        case 401:
          throw new Error("Non autorisé - Veuillez vous connecter")
        case 403:
          throw new Error("Accès interdit - Permissions insuffisantes")
        case 404:
          throw new Error("Ressource non trouvée")
        case 405:
          throw new Error("Méthode HTTP non autorisée pour cet endpoint")
        case 500:
          throw new Error("Erreur serveur interne")
        default:
          throw new Error(errorMessage)
      }
    }
    return response.json()
  },

  // FicheDePoste endpoints
  async getFichesDePoste() {
    try {
      const response = await fetch(`${this.baseURL}/fiches`, {
        method: "GET",
        headers: this.getHeaders(),
        mode: "cors",
      })
      const data = await this.handleResponse(response)
      console.log("Données fiches brutes:", data)

      // Extraire le tableau fiches de la réponse si nécessaire
      if (data && data.fiches && Array.isArray(data.fiches)) {
        return data.fiches
      } else if (Array.isArray(data)) {
        return data
      } else {
        console.warn("Structure de données inattendue pour les fiches:", data)
        return []
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des fiches:", error)
      throw error
    }
  },

  async createFicheDePoste(fiche) {
    try {
      console.log("Envoi des données:", fiche)
      const response = await fetch(`${this.baseURL}/fiches`, {
        method: "POST",
        headers: this.getHeaders(),
        mode: "cors",
        body: JSON.stringify(fiche),
      })
      return await this.handleResponse(response)
    } catch (error) {
      console.error("Erreur lors de la création de la fiche:", error)
      throw error
    }
  },

  async updateFicheDePoste(id, fiche) {
    try {
      console.log(`Mise à jour de la fiche ${id} avec:`, fiche)
      const response = await fetch(`${this.baseURL}/fiches/${id}`, {
        method: "PUT",
        headers: this.getHeaders(),
        mode: "cors",
        body: JSON.stringify(fiche),
      })
      return await this.handleResponse(response)
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la fiche:", error)
      throw error
    }
  },

  async getFicheDePosteById(id) {
    try {
      const response = await fetch(`${this.baseURL}/fiches/${id}`, {
        method: "GET",
        headers: this.getHeaders(),
        mode: "cors",
      })
      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  },

  async deleteFicheDePoste(id) {
    try {
      const response = await fetch(`${this.baseURL}/fiches/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        mode: "cors",
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la fiche:", error)
      throw error
    }
  },

  // Candidature endpoints
  async getCandidatures() {
    try {
      console.log("Récupération des candidatures depuis:", `${this.baseURL}/candidatures`)
      const response = await fetch(`${this.baseURL}/candidatures`, {
        method: "GET",
        headers: this.getHeaders(),
        mode: "cors",
      })

      console.log("Réponse candidatures:", response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Données candidatures brutes:", data)

      // Extraire le tableau candidatures de la réponse
      if (data && data.candidatures && Array.isArray(data.candidatures)) {
        console.log("Candidatures extraites:", data.candidatures)
        return data.candidatures
      } else if (Array.isArray(data)) {
        // Si la réponse est directement un tableau
        return data
      } else {
        console.warn("Structure de données inattendue:", data)
        return []
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures:", error)
      return [] // Retourner un tableau vide au lieu de throw
    }
  },

  async updateCandidatureStatus(id, statut) {
    try {
      // Utiliser l'endpoint correct avec le paramètre statut
      const response = await fetch(`${this.baseURL}/candidatures/${id}/statut?statut=${statut}`, {
        method: "PUT",
        headers: this.getHeaders(),
        mode: "cors",
      })
      return await this.handleResponse(response)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      throw error
    }
  },

  // Nouvelle méthode pour supprimer une candidature
  async deleteCandidature(id) {
    try {
      const response = await fetch(`${this.baseURL}/candidatures/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        mode: "cors",
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la candidature:", error)
      throw error
    }
  },

  async analyserCV(candidatureId) {
    try {
      const response = await fetch(`${this.baseURL}/score/${candidatureId}`, {
        method: "GET",
        headers: this.getHeaders(),
        mode: "cors",
      })
      return await this.handleResponse(response)
    } catch (error) {
      console.error("Erreur lors de l'analyse du CV:", error)
      throw error
    }
  },

  async getCandidaturesByFiche(ficheId) {
    try {
      const response = await fetch(`${this.baseURL}/fiches-de-poste/${ficheId}/candidatures`, {
        method: "GET",
        headers: this.getHeaders(),
        mode: "cors",
      })
      const data = await this.handleResponse(response)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures par fiche:", error)
      throw error
    }
  },

  // File endpoints - Téléchargement uniquement
  async downloadCV(candidatureId) {
    try {
      console.log(`Téléchargement CV pour candidature ${candidatureId}`)
      const response = await fetch(`${this.baseURL}/candidatures/${candidatureId}/cv`, {
        method: "GET",
        headers: this.getFileHeaders(),
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.blob()
    } catch (error) {
      console.error("Erreur lors du téléchargement du CV:", error)
      throw error
    }
  },

  async downloadLettreMotivation(candidatureId) {
    try {
      console.log(`Téléchargement lettre de motivation pour candidature ${candidatureId}`)
      const response = await fetch(`${this.baseURL}/candidatures/${candidatureId}/lettre-motivation`, {
        method: "GET",
        headers: this.getFileHeaders(),
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.blob()
    } catch (error) {
      console.error("Erreur lors du téléchargement de la lettre de motivation:", error)
      throw error
    }
  },

  // Méthode générique pour télécharger un fichier
  async downloadFile(candidatureId, fileType) {
    if (fileType === "cv") {
      return this.downloadCV(candidatureId)
    } else if (fileType === "lettreMotivation") {
      return this.downloadLettreMotivation(candidatureId)
    } else {
      throw new Error("Type de fichier non supporté")
    }
  },
}
