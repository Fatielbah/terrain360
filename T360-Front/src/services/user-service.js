const API_BASE_URL = "http://localhost:8081/api/utilisateurs"

export const UserService = {
  // Connexion utilisateur
  signIn: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/signIn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Échec de l'authentification")
    }

    return response.json()
  },

  // Inscription utilisateur
   signUp: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nomDeUtilisateur: userData.username,
        motDePasse: userData.password,
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        telephone: userData.telephone,
        adresse: userData.adresse,
        dateNaissance: userData.dateNaissance,
        genre: userData.genre,
        nationalite: userData.nationalite,
        cin: userData.cin, // Added CIN
        situationFamiliale: userData.situationFamiliale, // Added Situation Familiale
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de l'inscription")
    }
    return response.json()
  },

  // Obtenir utilisateur par ID
  getUserById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Utilisateur introuvable")
    }

    return response.json()
  },
  // Obtenir plusieurs utilisateurs par leurs IDs (optimisation)
  getUsersByIds: async (ids) => {
    try {
      const uniqueIds = [...new Set(ids.filter((id) => id))]
      if (uniqueIds.length === 0) return {}

      const promises = uniqueIds.map(async (id) => {
        try {
          return await UserService.getUserById(id)
        } catch (error) {
          console.warn(`Erreur lors de la récupération de l'utilisateur ${id}:`, error)
          return { id, nom: "Utilisateur", prenom: "", email: "" }
        }
      })

      const users = await Promise.all(promises)
      const usersMap = {}
      users.forEach((user) => {
        usersMap[user.id] = user
      })

      return usersMap
    } catch (error) {
      console.error("Erreur getUsersByIds:", error)
      return {}
    }
  },

  // Mettre à jour utilisateur
  updateUser: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la mise à jour")
    }

    return response.json()
  },

  // Upload image de profil
  uploadProfileImage: async (id, imageFile) => {
    const formData = new FormData()
    formData.append("image", imageFile)

    const response = await fetch(`${API_BASE_URL}/${id}/upload-image`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de l'upload de l'image")
    }

    return response.json()
  },

  // Obtenir image de profil
  getProfileImage: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}/image`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // Pas d'image
      }
      throw new Error("Erreur lors de la récupération de l'image")
    }

    return response.blob()
  },

  // Supprimer image de profil
  deleteProfileImage: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}/image`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la suppression de l'image")
    }

    return response.json()
  },

  // Changer mot de passe
  changePassword: async (id, passwordData) => {
    const response = await fetch(`${API_BASE_URL}/${id}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors du changement de mot de passe")
    }

    return response.json()
  },
   getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Ajouter le token d'authentification si nécessaire
          // "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Endpoint getAllUsers not found - check backend")
          return []
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Users loaded successfully:", data.length, "users")
      return data || []
    } catch (error) {
      console.error("Error in getAllUsers:", error)
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`)
    }
  },
  getAllEnqueteurs: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/enqueteur`, {
        // Utilise l'endpoint spécifique
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Endpoint /api/utilisateurs/enqueteur not found - check backend")
          return []
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      // Le backend est censé déjà filtrer par rôle "ENQUETEUR"
      console.log("Enquêteurs loaded successfully:", data.length, "enquêteurs")
      return data || []
    } catch (error) {
      console.error("Error in getAllEnqueteurs:", error)
      throw new Error(`Erreur lors de la récupération des enquêteurs: ${error.message}`)
    }
  },
}
