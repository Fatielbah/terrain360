// MaterialService.jsx - Service for handling API calls related to materials management
import { UserService } from "./user-service"

const API_BASE_URL = "http://localhost:8081/api" // Adjust this to match your API base URL

export const MaterialService = {
  // Material endpoints
  getAllMaterials: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels`)
      if (!response.ok) throw new Error("Failed to fetch materials")
      return await response.json()
    } catch (error) {
      console.error("Error fetching materials:", error)
      throw error
    }
  },

  // Get available materials (not assigned)
  getAllMaterialsDisponibles: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels/disponibles`)
      if (!response.ok) throw new Error("Failed to fetch available materials")
      return await response.json()
    } catch (error) {
      console.error("Error fetching available materials:", error)
      throw error
    }
  },

  // Get assigned materials with enriched user data
  getAllMaterialsAffectes: async () => {
    try {
      // 1. Get active affectations first
      const affectations = await MaterialService.getAllActiveAffectations()
      console.log("Active affectations:", affectations)

      if (!affectations || affectations.length === 0) {
        console.log("No active affectations found")
        return []
      }

      // 2. Get material and user data for each affectation
      const enrichedMaterials = await Promise.all(
        affectations.map(async (affectation) => {
          try {
            // Get material data
            const material = await MaterialService.getMaterialById(affectation.materielId)

            // Get user data
            const user = await UserService.getUserById(affectation.utilisateurId)

            return {
              ...material,
              utilisateurActuel: user,
              affectationId: affectation.id,
              dateAffectation: affectation.dateDebut,
              motifAffectation: affectation.motif,
              utilisateurId: affectation.utilisateurId,
            }
          } catch (error) {
            console.error(`Error enriching affectation ${affectation.id}:`, error)
            return null
          }
        }),
      )

      // Filter out null results
      const validMaterials = enrichedMaterials.filter((material) => material !== null)
      console.log("Enriched assigned materials:", validMaterials)

      return validMaterials
    } catch (error) {
      console.error("Error fetching assigned materials:", error)
      throw error
    }
  },

  getMaterialById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels/${id}`)
      if (!response.ok) throw new Error(`Failed to fetch material with id ${id}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error)
      throw error
    }
  },

  createMaterial: async (materialDTO) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materialDTO),
      })
      if (!response.ok) throw new Error("Failed to create material")
      return await response.json()
    } catch (error) {
      console.error("Error creating material:", error)
      throw error
    }
  },

  updateMaterial: async (id, materialDTO) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materialDTO),
      })
      if (!response.ok) throw new Error(`Failed to update material with id ${id}`)
      return await response.json()
    } catch (error) {
      console.error(`Error updating material ${id}:`, error)
      throw error
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(`Failed to delete material with id ${id}`)
      return true
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error)
      throw error
    }
  },

  updateMaterialState: async (id, newState) => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels/${id}/etat?nouvelEtat=${newState}`, {
        method: "PATCH",
      })
      if (!response.ok) throw new Error(`Failed to update material state for id ${id}`)
      return await response.json()
    } catch (error) {
      console.error(`Error updating material state ${id}:`, error)
      throw error
    }
  },

  getMaterialStatistics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiels/stat`)
      if (!response.ok) throw new Error("Failed to fetch material statistics")
      return await response.json()
    } catch (error) {
      console.error("Error fetching material statistics:", error)
      throw error
    }
  },

  // Ticket endpoints
  getAllTickets: async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets`)
    if (!response.ok) throw new Error("Failed to fetch tickets")
    const tickets = await response.json()
    console.log("Raw tickets from API:", tickets)

    // Enrich tickets with material and user data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        try {
          // Ensure ticket has an ID property
          const ticketWithId = {
            ...ticket,
            // If id is missing, try to use other possible ID fields or generate a temporary one
            id:
              ticket.id ||
              ticket.ticketId ||
              ticket.numeroTicket ||
              `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }

          // Get material data
          let materiel = null
          if (ticket.materielId) {
            try {
              materiel = await MaterialService.getMaterialById(ticket.materielId)
            } catch (error) {
              console.error(`Error fetching material ${ticket.materielId}:`, error)
            }
          }

          // Get declarant (reporter) data
          let declarant = null
          if (ticket.declarantId) {
            try {
              declarant = await UserService.getUserById(ticket.declarantId)
            } catch (error) {
              console.error(`Error fetching user ${ticket.declarantId}:`, error)
            }
          }

          // Get technicien data if exists
          let technicien = null
          if (ticket.technicienId) {
            try {
              technicien = await UserService.getUserById(ticket.technicienId)
            } catch (error) {
              console.error(`Error fetching technician ${ticket.technicienId}:`, error)
            }
          }

          return {
            ...ticketWithId,
            materiel,
            declarant,
            technicien,
          }
        } catch (error) {
          console.error(`Error enriching ticket:`, error)
          return {
            ...ticket,
            id:
              ticket.id ||
              ticket.ticketId ||
              ticket.numeroTicket ||
              `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            materiel: null,
            declarant: null,
            technicien: null,
          }
        }
      }),
    )

    console.log("Enriched tickets:", enrichedTickets)
    return enrichedTickets
  } catch (error) {
    console.error("Error fetching tickets:", error)
    throw error
  }
},

 createTicket: async (ticketDTO) => {
  try {
    console.log("Creating ticket with data:", ticketDTO)
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketDTO),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Backend error:", errorData)
      throw new Error(`Failed to create ticket: ${errorData}`)
    }

    const createdTicket = await response.json()
    console.log("Created ticket response:", createdTicket)
    return createdTicket
  } catch (error) {
    console.error("Error creating ticket:", error)
    throw error
  }
},
  updateTicket: async (id, ticketDTO) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketDTO),
      })
      if (!response.ok) throw new Error(`Failed to update ticket with id ${id}`)
      return await response.json()
    } catch (error) {
      console.error(`Error updating ticket ${id}:`, error)
      throw error
    }
  },

 deleteTicket: async (id) => {
  try {
    console.log("Attempting to delete ticket with ID:", id)

    if (!id || id === undefined) {
      throw new Error("Ticket ID is undefined or null")
    }

    // Si l'ID commence par "temp-", c'est un ID temporaire généré côté client
    if (typeof id === "string" && id.startsWith("temp-")) {
      console.warn("Tentative de suppression d'un ticket avec ID temporaire:", id)
      return true // Simuler une suppression réussie pour les IDs temporaires
    }

    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Server error when deleting ticket ${id}:`, errorText)
      throw new Error(`Failed to delete ticket with id ${id}: ${errorText}`)
    }

    return true
  } catch (error) {
    console.error(`Error deleting ticket ${id}:`, error)
    throw error
  }
},

  // Affectation endpoints
createAffectation: async (materielId, utilisateurId, technicienId, dateDebut, motif) => {
  try {
    const params = new URLSearchParams({
      materielId,
      utilisateurId,
      technicienId,  
      dateDebut: dateDebut.format ? dateDebut.format("YYYY-MM-DD") : dateDebut.toISOString().split("T")[0],
      motif,
    });

    const response = await fetch(`${API_BASE_URL}/affectations?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) throw new Error("Failed to create affectation");
    return await response.json();
  } catch (error) {
    console.error("Error creating affectation:", error);
    throw error;
  }
},

terminateAffectation: async (affectationId, technicienId, dateFin, commentaire) => {
  try {
    const params = new URLSearchParams({
      technicienId,  
      dateFin: dateFin.format ? dateFin.format("YYYY-MM-DD") : dateFin,
      commentaire: commentaire || "Affectation terminée",
    });

    const response = await fetch(`${API_BASE_URL}/affectations/${affectationId}/terminer?${params.toString()}`, {
      method: "PUT",
    });

    if (!response.ok) throw new Error(`Failed to terminate affectation with id ${affectationId}`);
    return true;
  } catch (error) {
    console.error(`Error terminating affectation ${affectationId}:`, error);
    throw error;
  }
},


  // Get all active assignments
  getAllActiveAffectations: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/affectations/actives`)
      if (!response.ok) throw new Error("Failed to fetch active affectations")
      return await response.json()
    } catch (error) {
      console.error("Error fetching active affectations:", error)
      throw error
    }
  },

  // Get all affectations (active and inactive)
  getAllAffectations: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/affectations`)
      if (!response.ok) throw new Error("Failed to fetch all affectations")
      return await response.json()
    } catch (error) {
      console.error("Error fetching all affectations:", error)
      throw error
    }
  },

  // Get affectation history for a material
  getMaterialHistory: async (materielId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/historique-affectations/materiel/${materielId}`)
      if (!response.ok) throw new Error(`Failed to fetch history for material ${materielId}`)
      const history = await response.json()

      console.log("Raw history data:", history) // Debug log

      // Enrich history with user data
      const enrichedHistory = await Promise.all(
        history.map(async (item) => {
          try {
            // Check for utilisateurId field (correct field name)
            if (item.utilisateurId) {
              const userData = await UserService.getUserById(item.utilisateurId)
              return {
                ...item,
                utilisateur: userData, // Add user data as 'utilisateur' for display
              }
            }

            // If utilisateur field exists and is an ID, fetch user data
            if (item.utilisateur && typeof item.utilisateur === "number") {
              const userData = await UserService.getUserById(item.utilisateur)
              return {
                ...item,
                utilisateur: userData,
              }
            }

            return item
          } catch (error) {
            console.error(`Error fetching user data for history item ${item.id}:`, error)
            return {
              ...item,
              utilisateur: {
                id: item.utilisateurId || item.utilisateur,
                nom: "Utilisateur",
                prenom: "Inconnu",
                nomDeUtilisateur: `user_${item.utilisateurId || item.utilisateur}`,
              },
            }
          }
        }),
      )

      console.log("Enriched history:", enrichedHistory) // Debug log
      return enrichedHistory
    } catch (error) {
      console.error(`Error fetching material history ${materielId}:`, error)
      throw error
    }
  },

  // Get affectations by user ID
  getAffectationsByUtilisateur: async (utilisateurId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/affectations/utilisateur/${utilisateurId}`)
      if (!response.ok) throw new Error(`Failed to fetch affectations for user ${utilisateurId}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching affectations for user ${utilisateurId}:`, error)
      throw error
    }
  },
  assignTechnicienToTicket: async (ticketId, technicienId) => {
  try {
    console.log(`Assigning technician ${technicienId} to ticket ${ticketId}`)

    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assigner?technicienId=${technicienId}`, {
      method: "PATCH",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Server error when assigning technician to ticket ${ticketId}:`, errorText)
      throw new Error(`Failed to assign technician to ticket ${ticketId}: ${errorText}`)
    }

    const updatedTicket = await response.json()
    console.log("Ticket updated with technician:", updatedTicket)
    return updatedTicket
  } catch (error) {
    console.error(`Error assigning technician to ticket ${ticketId}:`, error)
    throw error
  }
},
updateTicketWithResolution: async (id, ticketDTO) => {
  try {
    console.log(`Updating ticket ${id} with resolution data:`, ticketDTO)

    const dataToSend = {
      ...ticketDTO,
      statut: "RESOLU",
      dateResolution: new Date().toISOString(),
    }

    console.log("Data being sent to API:", dataToSend)

    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Server error when updating ticket ${id}:`, errorText)
      throw new Error(`Failed to update ticket with id ${id}: ${errorText}`)
    }

    const updatedTicket = await response.json()
    console.log("Ticket updated with resolution:", updatedTicket)
    return updatedTicket
  } catch (error) {
    console.error(`Error updating ticket ${id}:`, error)
    throw error
  }
},
resolveTicket: async (ticketId, technicienId) => {
  try {
    console.log(`Resolving ticket ${ticketId} with technician ${technicienId}`)

    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/resoudre?technicienId=${technicienId}`,
      {
        method: "PUT",
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Server error when resolving ticket ${ticketId}:`, errorText)
      throw new Error(`Failed to resolve ticket ${ticketId}: ${errorText}`)
    }

    const resolvedTicket = await response.json()
    console.log("Ticket resolved successfully:", resolvedTicket)
    return resolvedTicket
  } catch (error) {
    console.error(`Error resolving ticket ${ticketId}:`, error)
    throw error
  }
},
getTicketsOuvertsOuEnCoursCount: async () => {
  try {
    console.log("Fetching count of open or in-progress tickets...")

    const response = await fetch(`${API_BASE_URL}/tickets/statut/ouvert-ou-encours/count`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Server error when fetching tickets count:", errorText)
      throw new Error(`Failed to fetch tickets count: ${errorText}`)
    }

    const count = await response.json()
    console.log("Tickets count (open/in-progress):", count)
    return count
  } catch (error) {
    console.error("Error fetching tickets count:", error)
    throw error
  }
},
checkMaterialHasOpenTicket: async (materielId) => {
  try {
    console.log(`Checking if material ${materielId} has open tickets...`)

    // Récupérer tous les tickets
    const allTickets = await MaterialService.getAllTickets()

    // Filtrer les tickets pour ce matériel qui sont ouverts ou en cours
    const openTicketsForMaterial = allTickets.filter(
      (ticket) => ticket.materielId === materielId && (ticket.statut === "OUVERT" || ticket.statut === "EN_COURS"),
    )

    console.log(`Found ${openTicketsForMaterial.length} open tickets for material ${materielId}`)
    return openTicketsForMaterial.length > 0
  } catch (error) {
    console.error(`Error checking open tickets for material ${materielId}:`, error)
    throw error
  }
},
generateMaterialReport: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rapport/materiel/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate report for material ${id}: ${errorText}`);
      }
      // Return the blob directly, as it's a PDF file
      return await response.blob();
    } catch (error) {
      console.error(`Error generating report for material ${id}:`, error);
      throw error;
    }
  }
}



