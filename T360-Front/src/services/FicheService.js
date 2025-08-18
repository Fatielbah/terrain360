const API_BASE_URL = "http://localhost:8081/api/fiches"

export const FicheService = {
  // Upload fiche de paie
  uploadFichePaie: async (idUtilisateur, fichier) => {
    const formData = new FormData()
    formData.append("fichier", fichier)

    const response = await fetch(`${API_BASE_URL}/paie/upload/${idUtilisateur}`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(errorData || "Erreur lors de l'upload de la fiche de paie")
    }

    return response.text()
  },

  // Upload fiche de prime
  uploadFichePrime: async (idUtilisateur, fichier) => {
    const formData = new FormData()
    formData.append("fichier", fichier)

    const response = await fetch(`${API_BASE_URL}/prime/upload/${idUtilisateur}`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(errorData || "Erreur lors de l'upload de la fiche de prime")
    }

    return response.text()
  },

  // Récupérer fiches de paie d'un utilisateur
  getFichesPaieByUser: async (idUtilisateur) => {
    const response = await fetch(`${API_BASE_URL}/paie/${idUtilisateur}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Erreur lors de la récupération des fiches de paie")
    }

    return response.json()
  },

  // Récupérer fiches de prime d'un utilisateur
  getFichesPrimeByUser: async (idUtilisateur) => {
    const response = await fetch(`${API_BASE_URL}/prime/${idUtilisateur}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Erreur lors de la récupération des fiches de prime")
    }

    return response.json()
  },

  // Récupérer toutes les fiches de paie (pour RH)
  getAllFichesPaie: async () => {
    const response = await fetch(`${API_BASE_URL}/paie`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Erreur lors de la récupération des fiches de paie")
    }

    return response.json()
  },

  // Récupérer toutes les fiches de prime (pour RH)
  getAllFichesPrime: async () => {
    const response = await fetch(`${API_BASE_URL}/prime`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Erreur lors de la récupération des fiches de prime")
    }

    return response.json()
  },

  // Télécharger une fiche de paie
  downloadFichePaie: async (ficheId, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/paie/download/${ficheId}`, {
        method: "GET",
      })

      if (!response.ok) {
        // Tente de lire le message d'erreur du backend si disponible
        const errorText = await response.text()
        console.error(
          `Erreur HTTP ${response.status} lors du téléchargement de la fiche de paie ${ficheId}:`,
          errorText,
        )
        throw new Error(errorText || "Erreur lors du téléchargement de la fiche de paie")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur dans downloadFichePaie:", error)
      throw new Error(`Erreur lors du téléchargement de la fiche de paie: ${error.message}`)
    }
  },

  // Télécharger une fiche de prime
  downloadFichePrime: async (ficheId, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prime/download/${ficheId}`, {
        method: "GET",
      })

      if (!response.ok) {
        // Tente de lire le message d'erreur du backend si disponible
        const errorText = await response.text()
        console.error(
          `Erreur HTTP ${response.status} lors du téléchargement de la fiche de prime ${ficheId}:`,
          errorText,
        )
        throw new Error(errorText || "Erreur lors du téléchargement de la fiche de prime")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur dans downloadFichePrime:", error)
      throw new Error(`Erreur lors du téléchargement de la fiche de prime: ${error.message}`)
    }
  },

  // Visualiser une fiche de paie
  viewFichePaie: (ficheId) => {
    const fileUrl = `${API_BASE_URL}/paie/download/${ficheId}` // L'endpoint de téléchargement sert aussi pour la visualisation
    window.open(fileUrl, "_blank")
  },

  // Visualiser une fiche de prime
  viewFichePrime: (ficheId) => {
    const fileUrl = `${API_BASE_URL}/prime/download/${ficheId}` // L'endpoint de téléchargement sert aussi pour la visualisation
    window.open(fileUrl, "_blank")
  },
}
