

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useAuth } from "./AuthContext"
import notificationWebSocketService from "../services/NotificationWebSocketService"

const NotificationContext = createContext(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications doit être utilisé dans NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const { user } = useAuth()
  const baseUrl = "http://localhost:8081"

  const userId = user?.id
  const username = user?.nomDeUtilisateur || user?.username || `user_${userId}`

  // Initialiser WebSocket au chargement
  useEffect(() => {
    if (userId && username) {
      console.log("Initialisation WebSocket pour utilisateur:", userId, username)

      const connectWebSocket = async () => {
        try {
          await notificationWebSocketService.connect(userId, username)
          setIsWebSocketConnected(true)
          console.log("✅ WebSocket connecté avec succès")
        } catch (error) {
          console.error("❌ Erreur connexion WebSocket:", error)
          setIsWebSocketConnected(false)
        }
      }

      connectWebSocket()

      return () => {
        notificationWebSocketService.disconnect()
        setIsWebSocketConnected(false)
      }
    }
  }, [userId, username])

  // Charger les notifications depuis l'API
  const loadNotifications = useCallback(
    async (userId) => {
      if (!userId) return

      setIsLoading(true)
      try {
        const response = await fetch(`${baseUrl}/api/notifications/utilisateur/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setNotifications(data)
          setUnreadCount(data.filter((n) => !n.lue).length)
          console.log("✅ Notifications chargées:", data.length)
        } else {
          console.error("❌ Erreur HTTP:", response.status, response.statusText)
        }
      } catch (error) {
        console.error("❌ Erreur chargement notifications:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [baseUrl],
  )

  // Charger les notifications au démarrage
  useEffect(() => {
    if (userId) {
      loadNotifications(userId)
    }
  }, [userId, loadNotifications])

  // S'abonner aux notifications WebSocket
  useEffect(() => {
    if (userId && isWebSocketConnected) {
      console.log("📡 Abonnement aux notifications WebSocket")

      const unsubscribe = notificationWebSocketService.subscribe((notification) => {
        console.log("🔔 Nouvelle notification reçue:", notification)

        // Ajouter à la liste (en première position)
        setNotifications((prev) => {
          // Vérifier si la notification existe déjà
          const exists = prev.some((n) => n.id === notification.id)
          if (exists) {
            console.log("⚠️ Notification déjà présente, ignorée")
            return prev
          }
          return [notification, ...prev]
        })

        // Incrémenter le compteur si non lue
        if (!notification.lue) {
          setUnreadCount((prev) => prev + 1)
        }

        // Supprimer cette partie pour ne plus afficher la popup
        // antNotification.info({
        //   message: notification.titre,
        //   description: notification.message,
        //   placement: "topRight",
        //   duration: 4.5,
        // })
      })

      return () => {
        console.log("📡 Désabonnement des notifications WebSocket")
        if (unsubscribe) unsubscribe()
      }
    }
  }, [userId, isWebSocketConnected])

  // Marquer comme lue
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/lue`, {
          method: "PUT",
        })

        if (response.ok) {
          setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, lue: true } : n)))
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (error) {
        console.error("❌ Erreur marquage lecture:", error)
      }
    },
    [baseUrl],
  )

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.lue)

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`${baseUrl}/api/notifications/${n.id}/lue`, {
            method: "PUT",
          }),
        ),
      )

      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("❌ Erreur marquage toutes lues:", error)
    }
  }, [notifications, baseUrl])

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        const response = await fetch(`${baseUrl}/api/notifications/${notificationId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
          setUnreadCount((prev) => {
            const notification = notifications.find((n) => n.id === notificationId)
            return notification && !notification.lue ? Math.max(0, prev - 1) : prev
          })
        }
      } catch (error) {
        console.error("❌ Erreur suppression notification:", error)
      }
    },
    [baseUrl, notifications],
  )

  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/notifications/utilisateur/${userId}/toutes`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("❌ Erreur suppression toutes notifications:", error)
    }
  }, [baseUrl, userId])

// Dans NotificationProvider
const createNotification = useCallback(
  async (notificationData) => {
    if (!userId) {
      console.error("❌ Impossible de créer une notification: utilisateur non connecté")
      return null
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${baseUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Ajoutez votre token d'authentification si nécessaire
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...notificationData,
          expediteurId: userId, // L'expéditeur est l'utilisateur courant
        }),
      })

      if (response.ok) {
        const newNotification = await response.json()
        console.log("✅ Notification créée:", newNotification)
        return newNotification
      } else {
        console.error("❌ Erreur création notification:", await response.text())
        return null
      }
    } catch (error) {
      console.error("❌ Erreur création notification:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  },
  [baseUrl, userId]
)
  const value = {
    notifications,
    unreadCount,
    isLoading,
    isWebSocketConnected,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
