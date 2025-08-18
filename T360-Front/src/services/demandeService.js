const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api"

// Configuration des headers par défaut
const getHeaders = (userId, token) => {
  const headers = {
    "Content-Type": "application/json",
  }

  if (userId) {
    headers["X-User-Id"] = userId.toString()
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Fonction utilitaire pour gérer les erreurs HTTP
const handleApiError = async (response) => {
  if (!response.ok) {
    let errorData
    try {
      const text = await response.text()
      errorData = text ? JSON.parse(text) : {}
    } catch {
      errorData = { message: "Erreur de communication avec le serveur" }
    }

    const error = new Error(errorData.message || `Erreur HTTP ${response.status}`)
    error.status = response.status
    error.code = errorData.code || errorData.error || getErrorCodeFromStatus(response.status)
    error.response = response
    error.details = errorData.details
    throw error
  }
  return response
}

// Fonction pour mapper les codes de statut HTTP vers des codes d'erreur
const getErrorCodeFromStatus = (status) => {
  switch (status) {
    case 400:
      return "INVALID_DATA"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 409:
      return "CONFLICT"
    case 500:
      return "SERVER_ERROR"
    default:
      return "UNKNOWN_ERROR"
  }
}

// Service pour les demandes
export const demandeService = {
    createDemandeConge: async (demandeData, user) => {
    try {
      console.log("=== DÉBUT createDemandeConge ===")
      console.log("Données reçues:", demandeData)
      console.log("Utilisateur:", user)

      // Validation des données requises
      if (!demandeData.type_conge) {
        throw new Error("Le type de congé est requis")
      }

      if (!demandeData.dates || demandeData.dates.length !== 2) {
        throw new Error("Les dates de début et fin sont requises")
      }

      // Validation pour congé maladie - justificatif requis
      if (demandeData.type_conge === "CONGE_MALADIE" && !demandeData.justification) {
        throw new Error("Un certificat médical est requis pour un congé maladie")
      }

      // Créer FormData pour l'envoi multipart
      const formData = new FormData()

      // Préparer l'objet DTO selon DemandeCongeDTO
      const demandeDto = {
        type: demandeData.type_conge,
        dateDebut: demandeData.dates[0].format("YYYY-MM-DD"),
        dateFin: demandeData.dates[1].format("YYYY-MM-DD"),
        commentaire: demandeData.motif || "",
      }

      console.log("DTO préparé:", demandeDto)

      // Ajouter la demande comme JSON Blob (pour @RequestPart)
      const demandeBlob = new Blob([JSON.stringify(demandeDto)], {
        type: "application/json",
      })
      formData.append("demande", demandeBlob)

      // Ajouter le fichier si présent
      if (demandeData.justification) {
        console.log("Ajout du fichier:", demandeData.justification.name, demandeData.justification.type)
        formData.append("file", demandeData.justification)
      } else {
        console.log("Aucun fichier de justification")
      }

      // Afficher le contenu du FormData pour debug
      console.log("=== CONTENU FORMDATA ===")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, ":", "FILE -", value.name, value.type, value.size, "bytes")
        } else if (value instanceof Blob) {
          console.log(key, ":", "BLOB -", value.type, value.size, "bytes")
        } else {
          console.log(key, ":", value)
        }
      }

      // Headers pour FormData avec X-User-Id (ne pas inclure Content-Type)
      const headers = {
        "X-User-Id": user?.id?.toString(),
      }

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`
      }

      console.log("Headers:", headers)
      console.log("URL:", `${API_BASE_URL}/demandes/conge`)

      const response = await fetch(`${API_BASE_URL}/demandes/conge`, {
        method: "POST",
        headers: headers,
        body: formData,
        mode: "cors",
      })

      console.log("Réponse du serveur:", response.status, response.statusText)

      if (!response.ok) {
        // Lire le contenu de la réponse d'erreur
        let errorData
        try {
          const errorText = await response.text()
          console.log("=== ERREUR BACKEND ===")
          console.log("Status:", response.status)
          console.log("Contenu brut:", errorText)

          errorData = errorText ? JSON.parse(errorText) : {}
          console.log("Erreur parsée:", errorData)
        } catch (parseError) {
          console.error("Erreur lors du parsing de la réponse d'erreur:", parseError)
          errorData = { message: "Erreur de communication avec le serveur" }
        }

        const error = new Error(errorData.message || `Erreur HTTP ${response.status}`)
        error.status = response.status
        error.code = errorData.code || errorData.error || getErrorCodeFromStatus(response.status)
        error.response = response
        error.details = errorData.details || errorData

        console.error("=== ERREUR FINALE ===", error)
        throw error
      }

      const result = await response.json()
      console.log("=== SUCCÈS ===")
      console.log("Demande de congé créée avec succès:", result)
      return result
    } catch (error) {
      console.error("=== ERREUR DANS createDemandeConge ===", error)

      // Ajouter des messages d'erreur plus spécifiques pour le 400
      if (error.status === 400) {
        if (error.details) {
          console.error("Détails de l'erreur 400:", error.details)
        }

        // Messages d'erreur plus spécifiques selon le contenu
        if (error.message?.includes("type")) {
          throw new Error("Type de congé invalide. Vérifiez que le type sélectionné est correct.")
        } else if (error.message?.includes("date")) {
          throw new Error("Format de date invalide. Vérifiez les dates saisies.")
        } else if (error.message?.includes("solde")) {
          throw new Error("Solde de congés insuffisant. Vérifiez votre solde disponible.")
        } else {
          throw new Error(`Données invalides: ${error.message || "Vérifiez tous les champs du formulaire"}`)
        }
      }

      throw error
    }
  },

  // Méthode pour récupérer les demandes de congé d'un utilisateur
  getCongesByUser: async (userId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/user/${userId}`, {
        method: "GET",
        headers: {
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const allDemandes = await response.json()

      // Filtrer seulement les demandes de congé
      const conges =
        allDemandes?.filter(
          (demande) =>
            demande?.type === "CONGE_ANNUEL" ||
            demande?.type === "CONGE_EXCEPTIONNEL" ||
            demande?.type === "CONGE_MALADIE" ||
            demande?.type === "CONGE_MATERNITE_PATERNITE" ||
            demande?.type === "CONGE_SANS_SOLDE",
        ) || []

      console.log("Congés filtrés:", conges)
      return conges
    } catch (error) {
      console.error("Erreur lors du chargement des congés:", error)
      throw error
    }
  },
  // Créer une demande de congé
 

  // Annuler une demande
  cancelDemande: async (demandeId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/${demandeId}/cancel?userId=${user?.id}`, {
        method: "PUT", // Changé de POST à PUT
        headers: getHeaders(user?.id, user?.token),
      })

      await handleApiError(response)
    } catch (error) {
      console.error("Erreur cancelDemande:", error)
      throw error
    }
  },

  // Supprimer une demande
  deleteDemande: async (demandeId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/${demandeId}?userId=${user?.id}`, {
        method: "DELETE",
        headers: getHeaders(user?.id, user?.token),
      })

      await handleApiError(response)
    } catch (error) {
      console.error("Erreur deleteDemande:", error)
      throw error
    }
  },

  // Créer une demande d'absence
  createDemandeAbsence: async (demande, user) => {
    try {
      console.log("=== DÉBUT DEBUG createDemandeAbsence ===")
      console.log("Données reçues:", demande)
      console.log("Utilisateur:", user)

      // Validation des données requises
      if (!demande.type) {
        throw new Error("Le type d'absence est requis")
      }

      if (!demande.dateDebut) {
        throw new Error("La date de début est requise")
      }

      if (!demande.commentaire) {
        throw new Error("La description est requise")
      }

      // Utiliser FormData pour envoyer selon la structure backend
      const formData = new FormData()

      // Créer l'objet DTO selon la structure attendue par le backend
      const demandeAbsenceDTO = {
        type: demande.type, // String pour l'enum TypeAbsence
        dateDebut: demande.dateDebut, // Format YYYY-MM-DD
        dateFin: demande.dateFin || demande.dateDebut,
        commentaire: demande.commentaire,
        estUrgente: Boolean(demande.estUrgente),
      }

      // Ajouter les heures si disponibles et si le type est HEURE
      if (demande.type === "HEURE") {
        if (demande.heureDebut && demande.heureFin) {
          // Envoyer les heures comme String (le backend les convertira)
          demandeAbsenceDTO.heureDebut = demande.heureDebut // Format "HH:mm"
          demandeAbsenceDTO.heureFin = demande.heureFin // Format "HH:mm"
        } else {
          throw new Error("Les heures de début et fin sont requises pour une absence de type HEURE")
        }
      }

      console.log("DTO préparé:", demandeAbsenceDTO)

      // Ajouter le DTO comme JSON Blob (pour @RequestPart)
      const demandeBlob = new Blob([JSON.stringify(demandeAbsenceDTO)], {
        type: "application/json",
      })
      formData.append("demande", demandeBlob)

      // Ajouter le fichier si disponible (nom "file" selon le backend)
      if (demande.justificationFile) {
        console.log("Ajout du fichier:", demande.justificationFile.name, demande.justificationFile.type)
        formData.append("file", demande.justificationFile)
      } else {
        console.log("Aucun fichier de justification")
      }

      // Afficher le contenu du FormData pour debug
      console.log("=== CONTENU FORMDATA ===")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, ":", "FILE -", value.name, value.type, value.size, "bytes")
        } else if (value instanceof Blob) {
          console.log(key, ":", "BLOB -", value.type, value.size, "bytes")
        } else {
          console.log(key, ":", value)
        }
      }

      // Headers pour FormData avec X-User-Id
      const headers = {
        "X-User-Id": user.id.toString(),
      }

      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`
      }

      console.log("Headers:", headers)
      console.log("URL:", `${API_BASE_URL}/demandes/absence`)

      const response = await fetch(`${API_BASE_URL}/demandes/absence`, {
        method: "POST",
        headers: headers,
        body: formData,
      })

      console.log("Réponse du serveur:", response.status, response.statusText)

      if (!response.ok) {
        // Lire le contenu de la réponse d'erreur
        let errorData
        try {
          const errorText = await response.text()
          console.log("=== ERREUR BACKEND ===")
          console.log("Status:", response.status)
          console.log("Contenu brut:", errorText)

          errorData = errorText ? JSON.parse(errorText) : {}
          console.log("Erreur parsée:", errorData)
        } catch (parseError) {
          console.error("Erreur lors du parsing de la réponse d'erreur:", parseError)
          errorData = { message: "Erreur de communication avec le serveur" }
        }

        const error = new Error(errorData.message || `Erreur HTTP ${response.status}`)
        error.status = response.status
        error.code = errorData.code || errorData.error || getErrorCodeFromStatus(response.status)
        error.response = response
        error.details = errorData.details || errorData

        console.error("=== ERREUR FINALE ===", error)
        throw error
      }

      const result = await response.json()
      console.log("=== SUCCÈS ===")
      console.log("Demande d'absence créée avec succès:", result)
      return result
    } catch (error) {
      console.error("=== ERREUR DANS createDemandeAbsence ===", error)

      // Ajouter des messages d'erreur plus spécifiques pour le 400
      if (error.status === 400) {
        if (error.details) {
          console.error("Détails de l'erreur 400:", error.details)
        }

        // Messages d'erreur plus spécifiques selon le contenu
        if (error.message?.includes("type")) {
          throw new Error("Type d'absence invalide. Vérifiez que le type sélectionné est correct.")
        } else if (error.message?.includes("date")) {
          throw new Error("Format de date invalide. Vérifiez les dates saisies.")
        } else if (error.message?.includes("heure")) {
          throw new Error("Format d'heure invalide. Vérifiez les heures saisies.")
        } else {
          throw new Error(`Données invalides: ${error.message || "Vérifiez tous les champs du formulaire"}`)
        }
      }

      throw error
    }
  },

  // Créer une demande de document
  createDemandeDocument: async (demande, user) => {
    try {
      console.log("=== DÉBUT createDemandeDocument ===")
      console.log("Type envoyé:", demande.type)
      console.log("Commentaire:", demande.commentaire)
      console.log("User ID:", user?.id)

      const requestBody = {
        type: demande.type, // TypeDocument enum
        commentaire: demande.commentaire || "",
        autretype: demande.autretype || null,
      }

      console.log("Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${API_BASE_URL}/demandes/document`, {
        method: "POST",
        headers: getHeaders(user?.id, user?.token),
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)

        // Essayer de parser l'erreur JSON
        let errorData = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText || `Erreur HTTP ${response.status}` }
        }

        throw new Error(errorData.message || `Erreur ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("=== SUCCÈS ===", result)
      return result
    } catch (error) {
      console.error("=== ERREUR createDemandeDocument ===", error)
      throw error
    }
  },

  // Valider une demande
  validateDemande: async (id, user, commentaire) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/demandes/${id}/validate?commentaire=${encodeURIComponent(commentaire)}`,
        {
          method: "POST",
          headers: getHeaders(user?.id, user?.token),
        },
      )

      await handleApiError(response)
    } catch (error) {
      console.error("Erreur validateDemande:", error)
      throw error
    }
  },

  // Refuser une demande
  rejectDemande: async (id, user, commentaire) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/demandes/${id}/reject?commentaire=${encodeURIComponent(commentaire)}`,
        {
          method: "POST",
          headers: getHeaders(user?.id, user?.token),
        },
      )

      await handleApiError(response)
    } catch (error) {
      console.error("Erreur rejectDemande:", error)
      throw error
    }
  },

  // Récupérer les demandes par utilisateur
  getDemandesByUser: async (userId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/user/${userId}`, {
        headers: getHeaders(user?.id, user?.token),
      })

      await handleApiError(response)
      return response.json()
    } catch (error) {
      console.error("Erreur getDemandesByUser:", error)
      throw error
    }
  },

  getDemandesDocumentByUser: async (userId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/DemandeDocument/${userId}`, {
        headers: getHeaders(user?.id, user?.token),
      })

      await handleApiError(response)
      return response.json()
    } catch (error) {
      console.error("Erreur getDemandesByUser:", error)
      throw error
    }
  },

  // Récupérer les demandes par statut
  getDemandesByStatus: async (statut, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/statut/${statut}`, {
        headers: getHeaders(user?.id, user?.token),
      })

      await handleApiError(response)
      return response.json()
    } catch (error) {
      console.error("Erreur getDemandesByStatus:", error)
      throw error
    }
  },

  // Récupérer les détails d'une demande
  getDemandeDetails: async (id, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/${id}`, {
        headers: getHeaders(user?.id, user?.token),
      })

      await handleApiError(response)
      return response.json()
    } catch (error) {
      console.error("Erreur getDemandeDetails:", error)
      throw error
    }
  },

  // Récupérer toutes les demandes (pour admin/RH)
  getAllDemandes: async (user) => {
    try {
      // Récupérer toutes les demandes par statut
      const [enAttente, valideeRH, valideeDirection, refusee] = await Promise.all([
        demandeService.getDemandesByStatus("EN_ATTENTE", user),
        demandeService.getDemandesByStatus("VALIDEE_RH", user),
        demandeService.getDemandesByStatus("VALIDEE_DIRECTION", user),
        demandeService.getDemandesByStatus("REFUSEE", user),
      ])

      return [...enAttente, ...valideeRH, ...valideeDirection, ...refusee]
    } catch (error) {
      console.error("Erreur lors de la récupération de toutes les demandes:", error)
      return []
    }
  },

  // Récupérer le solde de congé d'un utilisateur
  getSoldeConge: async (user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/utilisateurs/conge/solde`, {
        method: "GET",
        headers: {
          accept: "*/*",
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
      })

      await handleApiError(response)
      return response.json()
    } catch (error) {
      console.error("Erreur getSoldeConge:", error)
      throw error
    }
  },

  // Télécharger la justification d'une demande
   // Méthode pour récupérer les détails d'une demande (utilisée pour obtenir les infos du fichier)
  getDemandeDetails: async (demandeId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/${demandeId}`, {
        method: "GET",
        headers: {
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      throw error
    }
  },

  downloadJustification: async (demandeId, user) => {
    try {
      // D'abord, récupérer les détails de la demande pour obtenir le nom et type du fichier
      const demandeDetails = await demandeService.getDemandeDetails(demandeId, user)

      console.log("Détails de la demande:", demandeDetails)

      // Extraire les informations du fichier depuis les détails de la demande
      let fileName = "justification"
      let fileType = "application/octet-stream"

      if (demandeDetails?.justification) {
        fileName = demandeDetails.justification.name || "justification"
        fileType = demandeDetails.justification.type || "application/octet-stream"

        console.log("Informations fichier depuis API:", {
          name: fileName,
          type: fileType,
        })
      }

      // Maintenant télécharger le fichier
      const response = await fetch(`${API_BASE_URL}/demandes/${demandeId}/justification`, {
        method: "GET",
        headers: {
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()

      // Retourner un objet avec le blob et les informations du fichier
      return {
        blob,
        fileName,
        contentType: fileType,
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement de la justification:", error)
      throw error
    }
  },

  // Méthode simplifiée pour la compatibilité
  async downloadFile(demandeId, user) {
    const result = await this.downloadJustification(demandeId, user)
    return result.blob // Retourner seulement le blob pour la compatibilité
  },

  // Méthode pour récupérer les demandes d'un utilisateur
  getDemandesByUser: async (userId, user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/demandes/user/${userId}`, {
        method: "GET",
        headers: {
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      throw error
    }
  },
// ✅ NOUVEAU: Traiter une demande par RH
  traiterDemandeRH: async (demandeId, action, commentaire, user) => {
    const formData = new FormData()
    formData.append("demandeId", demandeId.toString())
    formData.append("validateurId", user.id.toString())
    formData.append("commentaire", commentaire || "")
    formData.append("action", action) // VALIDER, TRANSMETTRE, REFUSER

    const response = await fetch(`${API_BASE_URL}/demandes/rh`, {
      method: "POST",
      headers: {
        "X-User-Id": user?.id?.toString(),
        ...(user?.token && { Authorization: `Bearer ${user.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return response.text() // Retourne void du backend
  },

  // ✅ NOUVEAU: Traiter une demande par la Direction
  traiterDemandeDirection: async (demandeId, estValidee, commentaire, user) => {
    const formData = new FormData()
    formData.append("demandeId", demandeId.toString())
    formData.append("validateurId", user.id.toString())
    formData.append("commentaire", commentaire || "")
    formData.append("estValidee", estValidee.toString())

    const response = await fetch(`${API_BASE_URL}/demandes/direction`, {
      method: "POST",
      headers: {
        "X-User-Id": user?.id?.toString(),
        ...(user?.token && { Authorization: `Bearer ${user.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return response.text() // Retourne void du backend
  },
  // ✅ NOUVEAU: Récupérer toutes les demandes de congé
  getAllDemandeConges: async (user) => {
    const response = await fetch(`${API_BASE_URL}/demandes/demandeConge`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user?.id?.toString(),
        ...(user?.token && { Authorization: `Bearer ${user.token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  // ✅ NOUVEAU: Récupérer toutes les demandes d'absence
  getAllDemandeAbsences: async (user) => {
    const response = await fetch(`${API_BASE_URL}/demandes/demandeabsence`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user?.id?.toString(),
        ...(user?.token && { Authorization: `Bearer ${user.token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  // ✅ NOUVEAU: Récupérer toutes les demandes de documents
  getAllDemandeDocuments: async (user) => {
    const response = await fetch(`${API_BASE_URL}/demandes/demandeDocument`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user?.id?.toString(),
        ...(user?.token && { Authorization: `Bearer ${user.token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },
  // ... autres méthodes (createDemandeAbsence, cancelDemande, deleteDemande, etc.)
}

// Fonction utilitaire pour obtenir l'extension selon le Content-Type
function getExtensionFromContentType(contentType) {
  const typeMap = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/webp": ".webp",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
  }

  // Nettoyer le content-type (enlever charset, etc.)
  const cleanContentType = contentType?.split(";")[0]?.trim()?.toLowerCase()

  return typeMap[cleanContentType] || ""
}
// Utilitaires pour mapper les données
export const mapDemandeFromAPI = (demande) => ({
  id: demande.id,
  type: getTypeLabel(demande),
  employe: demande.utilisateur?.nom || "Utilisateur",
  service: demande.utilisateur?.service || "Non défini",
  dateCreation: demande.dateDemande,
  dateDemandee: formatDateDemandee(demande),
  statut: getStatutLabel(demande.statut),
  priorite: demande.estUrgente ? "Urgente" : "Normale",
  details: demande.commentaire || "Aucun détail",
  avatar: getAvatarFromName(demande.utilisateur?.nom || "U"),
  manager: demande.utilisateur?.manager || "Non défini",
  originalData: demande, // Garder les données originales
})

const getTypeLabel = (demande) => {
  if (demande.type) {
    switch (demande.type) {
      case "CONGE_ANNUEL":
      case "CONGE_EXCEPTIONNEL":
      case "CONGE_MALADIE":
      case "CONGE_MATERNITE_PATERNITE":
      case "CONGE_SANS_SOLDE":
        return "Congé"
      case "ABSENCE_PERSONNELLE":
      case "ABSENCE_MEDICALE":
      case "ABSENCE_EXCEPTIONNELLE":
        return "Absence"
      case "ATTESTATION_TRAVAIL":
      case "ATTESTATION_SALAIRE":
        return "Document"
      default:
        return "Demande"
    }
  }
  return "Demande"
}

const getStatutLabel = (statut) => {
  switch (statut) {
    case "EN_ATTENTE":
      return "En attente RH"
    case "VALIDEE_RH":
      return "Validé RH"
    case "VALIDEE_DIRECTION":
      return "Validé"
    case "REFUSEE":
      return "Refusé"
    case "ANNULEE":
      return "Annulé"
    default:
      return statut
  }
}
export const getTypeDocumentLabel = (type) => {
  switch (type) {
    case "ATTESTATION_TRAVAIL":
      return "Attestation de travail"
    case "ATTESTATION_SALAIRE":
      return "Attestation de salaire"
    case "AUTRE":
      return "Autre document"
    default:
      return type
  }}
const formatDateDemandee = (demande) => {
  if (demande.dateDebut && demande.dateFin) {
    if (demande.dateDebut === demande.dateFin) {
      return demande.dateDebut
    }
    return `${demande.dateDebut} - ${demande.dateFin}`
  }
  return demande.dateDebut || "Non définie"
}

const getAvatarFromName = (name) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// Fonction pour mapper le motif vers le type d'absence backend
// const getAbsenceTypeFromMotif = (motif) => {
//   const typeMapping = {
//     maladie: "ABSENCE_MEDICALE",
//     formation: "ABSENCE_PERSONNELLE",
//     rendez_vous_medical: "ABSENCE_MEDICALE",
//     urgence_familiale: "ABSENCE_EXCEPTIONNELLE",
//     demarche_administrative: "ABSENCE_PERSONNELLE",
//     autre: "ABSENCE_PERSONNELLE",
//   }
//   return typeMapping[motif] || "ABSENCE_PERSONNELLE"
// }
