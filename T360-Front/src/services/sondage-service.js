const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8081/api"

class SondageService {
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

  async createSondage(sondageData, currentUser) {
    try {
      if (!currentUser || !currentUser.id) {
        throw new Error("Utilisateur non connecté ou invalide")
      }

      console.log("=== DEBUG CREATION SONDAGE ===")
      console.log("Utilisateur connecté:", currentUser)
      console.log("Données sondage:", sondageData)

      const sondageWithAuthor = {
        question: sondageData.question,
        date: new Date().toISOString(),
        auteur: {
          id: currentUser.id,
        },
        options: sondageData.options.map((option) => ({
          texte: option.texte || option.text,
          votes: [],
        })),
      }

      console.log("Payload envoyé au backend:", JSON.stringify(sondageWithAuthor, null, 2))

      const response = await fetch(`${API_BASE_URL}/sondages`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(sondageWithAuthor),
      })

      console.log("Statut réponse:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur réponse serveur:", errorText)
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("Sondage créé avec succès:", result)
      return result
    } catch (error) {
      console.error("Erreur createSondage:", error)
      throw error
    }
  }

  async getAllSondages() {
    try {
      const response = await fetch(`${API_BASE_URL}/sondages`, {
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
        console.error("Erreur parsing JSON:", text.substring(0, 200) + "...")
        return []
      }
    } catch (error) {
      console.error("Erreur getAllSondages:", error)
      return []
    }
  }

  async getSondageById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/sondages/${id}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()

      if (!text.trim()) {
        throw new Error("Réponse vide du serveur")
      }

      try {
        return JSON.parse(text)
      } catch (jsonError) {
        console.error("Erreur parsing JSON getSondageById:", text.substring(0, 200) + "...")
        throw new Error("Réponse JSON invalide du serveur")
      }
    } catch (error) {
      console.error("Erreur getSondageById:", error)
      throw error
    }
  }

  async updateSondage(id, sondageData) {
    try {
      console.log("=== DEBUG MODIFICATION SONDAGE ===")
      console.log("ID sondage:", id)
      console.log("Données reçues:", sondageData)

      const updatePayload = {
        question: sondageData.question,
        options:
          sondageData.options?.map((option) => ({
            id: option.id,
            texte: option.texte || option.text || option,
          })) || [],
      }

      console.log("Payload envoyé pour modification:", JSON.stringify(updatePayload, null, 2))

      const response = await fetch(`${API_BASE_URL}/sondages/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updatePayload),
      })

      console.log("Statut réponse modification:", response.status)

      if (response.status === 204) {
        // No Content, successful update without a body
        console.log("Sondage modifié avec succès (No Content).")
        return { success: true } // Return a success indicator
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur réponse serveur (modification):", errorText)
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const text = await response.text()
      if (!text.trim()) {
        console.warn("Réponse vide pour une modification réussie (mais non 204).")
        return { success: true } // Treat as success if no content
      }

      try {
        const result = JSON.parse(text)
        console.log("Sondage modifié avec succès:", result)
        return result
      } catch (jsonError) {
        console.error("Erreur parsing JSON (modification sondage):", jsonError)
        console.error("Réponse brute du serveur (modification sondage):", text) // Log the full raw text
        throw new Error("Réponse JSON invalide du serveur pour la modification du sondage")
      }
    } catch (error) {
      console.error("Erreur updateSondage:", error)
      throw error
    }
  }

  async deleteSondage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/sondages/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Erreur deleteSondage:", error)
      throw error
    }
  }

  // Mise à jour de la fonction voterOption pour gérer les 3 cas du backend
  async voterOption(optionId, currentUser) {
    try {
      if (!currentUser || !currentUser.id) {
        throw new Error("Utilisateur non connecté")
      }

      console.log(`Tentative de vote pour l'option ${optionId} par l'utilisateur ${currentUser.id}`)

      const response = await fetch(
        `${API_BASE_URL}/sondages/options/${optionId}/vote?utilisateurId=${currentUser.id}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
        },
      )

      console.log("Statut réponse vote:", response.status)

      if (response.status === 204) {
        // Cas 1: Vote annulé (No Content)
        console.log("Vote annulé avec succès.")
        return { type: "cancelled" }
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur réponse serveur (vote):", errorText)
        throw new Error(errorText || `Erreur ${response.status}`)
      }

      const text = await response.text()
      if (!text.trim()) {
        // Cela ne devrait pas arriver si le backend renvoie un vote pour les cas 2 et 3
        console.warn("Réponse vide pour un vote non annulé.")
        return { type: "success" }
      }

      try {
        const voteResult = JSON.parse(text)
        console.log("Résultat du vote:", voteResult)
        // Le backend renvoie l'objet Vote, nous pouvons l'utiliser pour déterminer le type
        // Si l'ID de l'option dans le vote correspond à l'optionId, c'est un nouveau vote ou une modification
        if (voteResult.option && voteResult.option.id === optionId) {
          return { type: "voted", vote: voteResult }
        } else {
          // Ce cas est pour une modification où l'option.id dans le voteResult est différente de l'optionId envoyée
          // Cela signifie que le vote a été modifié vers une autre option.
          // Pour le frontend, nous devons recharger le sondage pour obtenir l'état correct.
          return { type: "changed", vote: voteResult }
        }
      } catch (jsonError) {
        console.error("Erreur parsing JSON (vote):", text.substring(0, 200) + "...")
        throw new Error("Réponse JSON invalide du serveur pour le vote")
      }
    } catch (error) {
      console.error("Erreur voterOption:", error)
      throw error
    }
  }

  // checkUserVote peut être simplifié si le backend renvoie toujours l'état complet du sondage
  // ou si nous rechargeons le sondage après chaque vote.
  // Pour l'instant, nous le gardons pour la cohérence, mais il pourrait être optimisé.
  async checkUserVote(sondageId, currentUser) {
    try {
      if (!currentUser || !currentUser.id) {
        return null
      }

      const sondage = await this.getSondageById(sondageId)
      if (sondage && sondage.options) {
        for (const option of sondage.options) {
          const votes = option.votes || option.votesDetails || []
          if (
            votes &&
            votes.some((vote) => vote.utilisateurId === currentUser.id || vote.utilisateur?.id === currentUser.id)
          ) {
            return { optionId: option.id }
          }
        }
      }

      return null
    } catch (error) {
      console.error("Erreur checkUserVote:", error)
      return null
    }
  }

  transformSondageForDisplay(sondage) {
    if (!sondage) return null

    const totalVotes =
      sondage.options?.reduce((sum, option) => {
        const votes = option.votes || option.votesDetails || []
        return sum + (votes ? votes.length : 0)
      }, 0) || 0

    return {
      id: sondage.id,
      question: sondage.question,
      date: sondage.date,
      auteurId: sondage.auteur?.id || sondage.auteurId,
      options:
        sondage.options?.map((option) => ({
          id: option.id,
          texte: option.texte,
          votes: option.votes ? option.votes.length : option.votesDetails ? option.votesDetails.length : 0,
          votants: option.votes || option.votesDetails || [],
        })) || [],
      totalVotes,
    }
  }

  calculateVotePercentage(votes, totalVotes) {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
  }
}

export default new SondageService()
