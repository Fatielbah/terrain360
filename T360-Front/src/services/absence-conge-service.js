const API_BASE_URL = "http://localhost:8081/api/utilisateurs"

export const AbsenceCongeService = {
  // Récupérer les absences et congés d'un utilisateur
  getAbsencesEtConges: async (utilisateurId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${utilisateurId}/absences-conges`, {
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
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
      }

      const data = await response.json()
      return data || { absences: [], conges: [] }
    } catch (error) {
      console.error(`Erreur lors de la récupération des absences/congés pour l'utilisateur ${utilisateurId}:`, error)
      throw new Error(`Erreur lors de la récupération des absences/congés: ${error.message}`)
    }
  },
}
