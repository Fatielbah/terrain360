const API_BASE_URL = "http://localhost:8081/api"

export const RoleService = {
  // Récupérer tous les utilisateurs avec leurs rôles
  getAllUsersWithRoles: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Ajouter le token d'authentification si nécessaire
        // "Authorization": `Bearer ${token}`
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la récupération des utilisateurs")
    }

    return response.json()
  },

  // Assigner un rôle à un utilisateur
  assignRole: async (userId, newRole) => {
    const response = await fetch(`${API_BASE_URL}/admin/roles/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        newRole: newRole,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de l'assignation du rôle")
    }

    return response.json()
  },

  // Supprimer le rôle d'un utilisateur
  removeRole: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/roles/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la suppression du rôle")
    }

    return response.json()
  },

  // Mettre à jour le rôle d'un utilisateur
  updateRole: async (userId, newRole) => {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        newRole: newRole,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erreur lors de la mise à jour du rôle")
    }

    return response.json()
  },
}
