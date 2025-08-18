const API_BASE_URL = "http://localhost:8081/api/retards"

export const RetardService = {
  // Méthode principale - envoie le superviseur dans l'objet Retard
  createRetard: async (retardData, superviseurId) => {
    try {
      const retardPayload = {
        date: retardData.date,
        heureArrivee: retardData.heureArrivee,
        justifie: retardData.justifie || false,
        remarque: retardData.remarque || "",
        utilisateur: {
          id: retardData.utilisateurId,
        },
        superviseur: superviseurId
          ? {
              id: superviseurId,
            }
          : null,
      }

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
        body: JSON.stringify(retardPayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Erreur lors de la création du retard:", error)
      throw new Error(`Erreur lors de la création du retard: ${error.message}`)
    }
  },

  // Méthode alternative - utilise l'endpoint avec paramètre superviseurId
  createRetardWithSuperviseurParam: async (retardData, superviseurId) => {
    try {
      const retardPayload = {
        date: retardData.date,
        heureArrivee: retardData.heureArrivee,
        justifie: retardData.justifie || false,
        remarque: retardData.remarque || "",
        utilisateur: {
          id: retardData.utilisateurId,
        },
      }

      const response = await fetch(`${API_BASE_URL}/with-superviseur?superviseurId=${superviseurId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
        body: JSON.stringify(retardPayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Erreur:", error)
      throw new Error(`Erreur lors de la création du retard: ${error.message}`)
    }
  },

  // Mettre à jour seulement la justification
  updateRetardJustification: async (retardId, justifie, remarque) => {
    try {
      const params = new URLSearchParams({
        justifie: justifie.toString(),
      })
      if (remarque) {
        params.append("remarque", remarque)
      }

      const response = await fetch(`${API_BASE_URL}/${retardId}/justification?${params}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }
  },

  // Récupérer tous les retards
  getAllRetards: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération de tous les retards:", error)
      throw new Error(`Erreur lors de la récupération des retards: ${error.message}`)
    }
  },

  // Récupérer toutes les alertes
  getAllAlertes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alertes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("Erreur lors de la récupération des alertes:", error)
      throw new Error(`Erreur lors de la récupération des alertes: ${error.message}`)
    }
  },

  // Supprimer un retard
  deleteRetard: async (retardId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${retardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Vous n'avez pas l'autorisation de supprimer ce retard")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }
  },
}
