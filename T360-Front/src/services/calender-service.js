// api.js
import axios from "axios"

const API_BASE_URL = "http://localhost:8081/api" // Remplacez par votre URL de base

// Services API
export const fetchServices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Services`)
    return response.data
  } catch (error) {
    console.error("Error fetching services:", error)
    throw error
  }
}

export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/utilisateurs`)
    return response.data
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

export const fetchAllUsersExceptOne = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/utilisateurs/exclude/${id}`)
    return response.data
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

export const createEvent = async (eventData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/evenements/${eventData.utilisateurId}`, eventData)
    return response.data
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/evenements/${eventId}`, eventData)
    return response.data
  } catch (error) {
    console.error("Error updating event:", error)
    throw error
  }
}

export const deleteEvent = async (eventId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/evenements/${eventId}`)
    return response.data
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}

// NOUVELLE FONCTION : Récupérer un événement par ID
export const getEventById = async (eventId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/evenements/${eventId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching event by ID:", error)
    throw error
  }
}

export const getUsersByService = async (serviceId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/utilisateurs/by-service/${serviceId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching users by service:", error)
    throw error
  }
}

// ===== FONCTIONS POUR LES INVITATIONS =====

// Envoyer une invitation à un utilisateur spécifique (pour la création)
export const sendUserInvitation = async (evenementId, utilisateurId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/invitations/utilisateur/${evenementId}/${utilisateurId}`)
    return response.data
  } catch (error) {
    console.error("Error sending user invitation:", error)
    throw error
  }
}

// Récupérer les invitations d'un événement
export const getInvitationsByEvent = async (evenementId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/invitations/evenement/${evenementId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching event invitations:", error)
    throw error
  }
}

// Récupérer les invitations d'un utilisateur
export const getInvitationsByUser = async (utilisateurId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/invitations/utilisateur/${utilisateurId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching user invitations:", error)
    throw error
  }
}

// Répondre à une invitation
export const respondToInvitation = async (invitationId, accepte) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/invitations/reponse/${invitationId}?accepte=${accepte}`)
    return response.data
  } catch (error) {
    console.error("Error responding to invitation:", error)
    throw error
  }
}

// ===== NOUVELLES FONCTIONS POUR GÉRER LES INVITATIONS =====

// Supprimer une invitation spécifique
export const deleteInvitation = async (invitationId) => {
  try {
    console.log(`🗑️ [API] Suppression de l'invitation ${invitationId}`)
    const response = await axios.delete(`${API_BASE_URL}/invitations/${invitationId}`)
    console.log(`✅ [API] Invitation ${invitationId} supprimée avec succès`)
    return response.data
  } catch (error) {
    console.error(`❌ [API] Erreur suppression invitation ${invitationId}:`, error)
    throw error
  }
}

// Supprimer plusieurs invitations par IDs d'invitations
export const deleteMultipleInvitations = async (invitationIds) => {
  try {
    console.log(`🗑️ [API] Suppression de ${invitationIds.length} invitations`)
    const results = []

    for (const invitationId of invitationIds) {
      try {
        await deleteInvitation(invitationId)
        results.push({ id: invitationId, success: true })
      } catch (error) {
        console.error(`❌ [API] Erreur suppression invitation ${invitationId}:`, error)
        results.push({ id: invitationId, success: false, error })
      }
    }

    const successCount = results.filter((r) => r.success).length
    console.log(`📊 [API] ${successCount}/${invitationIds.length} invitations supprimées`)
    return results
  } catch (error) {
    console.error("❌ [API] Erreur suppression multiple invitations:", error)
    throw error
  }
}

// NOUVELLE FONCTION : Supprimer des invités par utilisateur IDs (utilise votre endpoint backend)
export const removeInvitesFromEvent = async (evenementId, utilisateursIds) => {
  try {
    console.log(`🗑️ [API] Suppression de ${utilisateursIds.length} invités de l'événement ${evenementId}`)
    const response = await axios.delete(`${API_BASE_URL}/invitations/${evenementId}/invites/supprimer`, {
      data: utilisateursIds,
    })
    console.log(`✅ [API] Invités supprimés avec succès de l'événement ${evenementId}`)
    return response.data
  } catch (error) {
    console.error(`❌ [API] Erreur suppression invités événement ${evenementId}:`, error)
    throw error
  }
}

// Ajouter des invités à un événement existant
export const addInvitesToEvent = async (evenementId, userIds) => {
  try {
    console.log(`🔄 [API] Ajout de ${userIds.length} invités à l'événement ${evenementId}`)
    const results = []

    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        try {
          console.log(`📤 [API] Ajout invitation à l'utilisateur ${userId}`)
          const result = await sendUserInvitation(evenementId, userId)
          results.push(result)
          console.log(`✅ [API] Invitation ajoutée à l'utilisateur ${userId}`)
        } catch (error) {
          console.error(`❌ [API] Erreur ajout invitation utilisateur ${userId}:`, error)
        }
      }
    }

    console.log(`📊 [API] Résultats finaux: ${results.length}/${userIds.length} invitations ajoutées`)
    return results
  } catch (error) {
    console.error("❌ [API] Error adding invites to event:", error)
    throw error
  }
}

// ===== FONCTIONS POUR LES RAPPELS =====

// Créer un rappel pour un événement
export const createReminder = async (evenementId, rappelData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rappels/evenement/${evenementId}`, rappelData)
    return response.data
  } catch (error) {
    console.error("Error creating reminder:", error)
    throw error
  }
}

// Récupérer le rappel d'un événement
export const getReminderByEvent = async (evenementId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rappels/evenement/${evenementId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching reminder:", error)
    throw error
  }
}

// Envoyer un rappel
export const sendReminder = async (evenementId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rappels/envoyer/${evenementId}`)
    return response.data
  } catch (error) {
    console.error("Error sending reminder:", error)
    throw error
  }
}

// Fonctions pour la gestion des rappels en mode édition
export const updateReminder = async (reminderId, rappelData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/rappels/${reminderId}`, rappelData)
    return response.data
  } catch (error) {
    console.error("Error updating reminder:", error)
    throw error
  }
}

export const deleteReminder = async (reminderId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/rappels/${reminderId}`)
    return response.data
  } catch (error) {
    console.error("Error deleting reminder:", error)
    throw error
  }
}

// Fonction helper pour envoyer plusieurs invitations (pour la création)
export const sendMultipleInvitations = async (evenementId, userIds) => {
  try {
    console.log(`🔄 [API] Envoi de ${userIds.length} invitations pour l'événement ${evenementId}`)
    const results = []

    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        try {
          console.log(`📤 [API] Envoi invitation à l'utilisateur ${userId}`)
          const result = await sendUserInvitation(evenementId, userId)
          results.push(result)
          console.log(`✅ [API] Invitation envoyée à l'utilisateur ${userId}`)
        } catch (error) {
          console.error(`❌ [API] Erreur invitation utilisateur ${userId}:`, error)
        }
      }
    }

    console.log(`📊 [API] Résultats finaux: ${results.length}/${userIds.length} invitations envoyées`)
    return results
  } catch (error) {
    console.error("❌ [API] Error sending multiple invitations:", error)
    throw error
  }
}

// ===== FONCTIONS POUR LES NOTIFICATIONS =====

// Créer une notification
export const createNotification = async (notificationData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/notifications`, notificationData)
    return response.data
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Notifier la modification d'un événement
export const notifyEventUpdate = async (eventId, organizerId, eventTitle = null) => {
  try {
    console.log(`📢 [NOTIFICATION] Notification modification événement ${eventId}`)

    // Si le titre n'est pas fourni, récupérer l'événement depuis la base de données
    let finalEventTitle = eventTitle
    if (!finalEventTitle) {
      try {
        console.log(`🔍 [NOTIFICATION] Récupération des détails de l'événement ${eventId}`)
        const eventDetails = await getEventById(eventId)
        finalEventTitle = eventDetails?.titre || "Événement sans titre"
        console.log(`📋 [NOTIFICATION] Titre récupéré: "${finalEventTitle}"`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur récupération événement ${eventId}:`, error)
        finalEventTitle = "Événement sans titre"
      }
    }

    console.log(`📢 [NOTIFICATION] Titre final utilisé: "${finalEventTitle}"`)

    // Récupérer tous les invités de l'événement
    const invitations = await getInvitationsByEvent(eventId)

    // Créer une notification pour chaque invité
    const notifications = []
    for (const invitation of invitations) {
      if (invitation.utilisateur && invitation.utilisateur.id !== organizerId) {
        const notificationData = {
          expediteurId: organizerId,
          destinataireId: invitation.utilisateur.id,
          titre: "Événement modifié",
          message: `L'événement "${finalEventTitle}" a été modifié par l'organisateur.`,
          type: "MODIFICATION_EVENEMENT",
          evenementId: eventId,
          invitationId: invitation.id,
        }

        try {
          const notification = await createNotification(notificationData)
          notifications.push(notification)
          console.log(`✅ [NOTIFICATION] Notification envoyée à ${invitation.utilisateur.nom}`)
        } catch (error) {
          console.error(`❌ [NOTIFICATION] Erreur notification pour ${invitation.utilisateur.id}:`, error)
        }
      }
    }

    console.log(`📊 [NOTIFICATION] ${notifications.length} notifications de modification envoyées`)
    return notifications
  } catch (error) {
    console.error("❌ [NOTIFICATION] Erreur notification modification:", error)
    throw error
  }
}

// Notifier la suppression d'un événement
export const notifyEventDeletion = async (eventId, organizerId, eventTitle = null) => {
  try {
    console.log(`📢 [NOTIFICATION] Notification suppression événement ${eventId}`)

    // Si le titre n'est pas fourni, récupérer l'événement depuis la base de données
    let finalEventTitle = eventTitle
    if (!finalEventTitle) {
      try {
        console.log(`🔍 [NOTIFICATION] Récupération des détails de l'événement ${eventId}`)
        const eventDetails = await getEventById(eventId)
        finalEventTitle = eventDetails?.titre || "Événement sans titre"
        console.log(`📋 [NOTIFICATION] Titre récupéré: "${finalEventTitle}"`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur récupération événement ${eventId}:`, error)
        finalEventTitle = "Événement sans titre"
      }
    }

    console.log(`📢 [NOTIFICATION] Titre final utilisé: "${finalEventTitle}"`)

    // Récupérer tous les invités de l'événement AVANT la suppression
    const invitations = await getInvitationsByEvent(eventId)

    // Créer une notification pour chaque invité
    const notifications = []
    for (const invitation of invitations) {
      if (invitation.utilisateur && invitation.utilisateur.id !== organizerId) {
        const notificationData = {
          expediteurId: organizerId,
          destinataireId: invitation.utilisateur.id,
          titre: "Événement annulé",
          message: `L'événement "${finalEventTitle}" a été annulé par l'organisateur.`,
          type: "SUPPRESSION_EVENEMENT",
          evenementId: eventId,
          invitationId: invitation.id,
        }

        try {
          const notification = await createNotification(notificationData)
          notifications.push(notification)
          console.log(`✅ [NOTIFICATION] Notification d'annulation envoyée à ${invitation.utilisateur.nom}`)
        } catch (error) {
          console.error(`❌ [NOTIFICATION] Erreur notification pour ${invitation.utilisateur.id}:`, error)
        }
      }
    }

    console.log(`📊 [NOTIFICATION] ${notifications.length} notifications d'annulation envoyées`)
    return notifications
  } catch (error) {
    console.error("❌ [NOTIFICATION] Erreur notification suppression:", error)
    throw error
  }
}

// Notifier le déplacement d'un événement (drag & drop)
export const notifyEventMove = async (eventId, organizerId, eventTitle = null, newDate) => {
  try {
    console.log(`📢 [NOTIFICATION] Notification déplacement événement ${eventId}`)

    // Si le titre n'est pas fourni, récupérer l'événement depuis la base de données
    let finalEventTitle = eventTitle
    if (!finalEventTitle) {
      try {
        console.log(`🔍 [NOTIFICATION] Récupération des détails de l'événement ${eventId}`)
        const eventDetails = await getEventById(eventId)
        finalEventTitle = eventDetails?.titre || "Événement sans titre"
        console.log(`📋 [NOTIFICATION] Titre récupéré: "${finalEventTitle}"`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur récupération événement ${eventId}:`, error)
        finalEventTitle = "Événement sans titre"
      }
    }

    console.log(`📢 [NOTIFICATION] Titre final utilisé: "${finalEventTitle}"`)

    // Récupérer tous les invités de l'événement
    const invitations = await getInvitationsByEvent(eventId)

    // Créer une notification pour chaque invité
    const notifications = []
    for (const invitation of invitations) {
      if (invitation.utilisateur && invitation.utilisateur.id !== organizerId) {
        const notificationData = {
          expediteurId: organizerId,
          destinataireId: invitation.utilisateur.id,
          titre: "Événement déplacé",
          message: `L'événement "${finalEventTitle}" a été déplacé au ${newDate}.`,
          type: "DEPLACEMENT_EVENEMENT",
          evenementId: eventId,
          invitationId: invitation.id,
        }

        try {
          const notification = await createNotification(notificationData)
          notifications.push(notification)
          console.log(`✅ [NOTIFICATION] Notification de déplacement envoyée à ${invitation.utilisateur.nom}`)
        } catch (error) {
          console.error(`❌ [NOTIFICATION] Erreur notification pour ${invitation.utilisateur.id}:`, error)
        }
      }
    }

    console.log(`📊 [NOTIFICATION] ${notifications.length} notifications de déplacement envoyées`)
    return notifications
  } catch (error) {
    console.error("❌ [NOTIFICATION] Erreur notification déplacement:", error)
    throw error
  }
}

// ===== NOUVELLES NOTIFICATIONS POUR LES INVITATIONS =====

// Notifier la suppression d'invités
export const notifyInvitationRemoval = async (eventId, organizerId, eventTitle = null, removedUsers) => {
  try {
    console.log(`📢 [NOTIFICATION] Notification suppression d'invités pour l'événement ${eventId}`)

    // Si le titre n'est pas fourni, récupérer l'événement depuis la base de données
    let finalEventTitle = eventTitle
    if (!finalEventTitle) {
      try {
        console.log(`🔍 [NOTIFICATION] Récupération des détails de l'événement ${eventId}`)
        const eventDetails = await getEventById(eventId)
        finalEventTitle = eventDetails?.titre || "Événement sans titre"
        console.log(`📋 [NOTIFICATION] Titre récupéré: "${finalEventTitle}"`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur récupération événement ${eventId}:`, error)
        finalEventTitle = "Événement sans titre"
      }
    }

    console.log(`📢 [NOTIFICATION] Titre final utilisé: "${finalEventTitle}"`)

    const notifications = []
    for (const user of removedUsers) {
      const notificationData = {
        expediteurId: organizerId,
        destinataireId: user.id,
        titre: "Invitation retirée",
        message: `Votre invitation à l'événement "${finalEventTitle}" a été retirée par l'organisateur.`,
        type: "SUPPRESSION_INVITATION",
        evenementId: eventId,
      }

      try {
        const notification = await createNotification(notificationData)
        notifications.push(notification)
        console.log(`✅ [NOTIFICATION] Notification de suppression d'invitation envoyée à ${user.nom}`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur notification pour ${user.id}:`, error)
      }
    }

    console.log(`📊 [NOTIFICATION] ${notifications.length} notifications de suppression d'invitation envoyées`)
    return notifications
  } catch (error) {
    console.error("❌ [NOTIFICATION] Erreur notification suppression invitation:", error)
    throw error
  }
}

// Notifier l'ajout de nouveaux invités
export const notifyNewInvitations = async (eventId, organizerId, eventTitle = null, newUsers) => {
  try {
    console.log(`📢 [NOTIFICATION] Notification nouveaux invités pour l'événement ${eventId}`)

    // Si le titre n'est pas fourni, récupérer l'événement depuis la base de données
    let finalEventTitle = eventTitle
    if (!finalEventTitle) {
      try {
        console.log(`🔍 [NOTIFICATION] Récupération des détails de l'événement ${eventId}`)
        const eventDetails = await getEventById(eventId)
        finalEventTitle = eventDetails?.titre || "Événement sans titre"
        console.log(`📋 [NOTIFICATION] Titre récupéré: "${finalEventTitle}"`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur récupération événement ${eventId}:`, error)
        finalEventTitle = "Événement sans titre"
      }
    }

    console.log(`📢 [NOTIFICATION] Titre final utilisé: "${finalEventTitle}"`)

    const notifications = []
    for (const user of newUsers) {
      const notificationData = {
        expediteurId: organizerId,
        destinataireId: user.id,
        titre: "Nouvelle invitation",
        message: `Vous avez été invité(e) à l'événement "${finalEventTitle}".`,
        type: "INVITATION_EVENEMENT",
        evenementId: eventId,
      }

      try {
        const notification = await createNotification(notificationData)
        notifications.push(notification)
        console.log(`✅ [NOTIFICATION] Notification d'invitation envoyée à ${user.nom}`)
      } catch (error) {
        console.error(`❌ [NOTIFICATION] Erreur notification pour ${user.id}:`, error)
      }
    }

    console.log(`📊 [NOTIFICATION] ${notifications.length} notifications d'invitation envoyées`)
    return notifications
  } catch (error) {
    console.error("❌ [NOTIFICATION] Erreur notification nouvelle invitation:", error)
    throw error
  }
}
