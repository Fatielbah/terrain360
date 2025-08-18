import SockJS from "sockjs-client"
import { Stomp } from "@stomp/stompjs"

class NotificationWebSocketService {
  constructor() {
    this.stompClient = null
    this.isConnected = false
    this.subscribers = []
    this.userId = null
    this.username = null
    this.baseUrl = "http://localhost:8081"
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(userId, username) {
    console.log("=== CONNEXION WEBSOCKET ===")
    console.log("User ID:", userId)
    console.log("Username:", username)

    this.userId = userId
    this.username = username || `user_${userId}`

    if (this.isConnected) {
      console.log("WebSocket déjà connecté")
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const socketUrl = `${this.baseUrl}/ws`
        console.log("URL de connexion:", socketUrl)

        const socket = new SockJS(socketUrl)
        this.stompClient = Stomp.over(socket)

        // Configuration des headers de connexion
        const connectHeaders = {
          username: this.username,
        }

        // Activer les logs de debug
        this.stompClient.debug = (str) => {
          console.log("STOMP Debug:", str)
        }

        // Connexion avec headers
        this.stompClient.connect(
          connectHeaders,
          (frame) => {
            console.log("✅ WebSocket connecté avec succès:", frame)
            this.isConnected = true
            this.reconnectAttempts = 0

            // S'abonner aux notifications utilisateur
            const subscription = this.stompClient.subscribe("/user/queue/notifications", (message) => {
              console.log("📨 Message reçu:", message)
              try {
                const notification = JSON.parse(message.body)
                console.log("✅ Notification reçue:", notification)
                this.notifySubscribers(notification)
              } catch (error) {
                console.error("❌ Erreur parsing notification:", error)
              }
            })

            console.log("✅ Abonnement créé:", subscription.id)
            resolve()
          },
          (error) => {
            console.error("❌ Erreur connexion WebSocket:", error)
            this.isConnected = false
            this.handleReconnect()
            reject(error)
          },
        )

        // Gérer la déconnexion
        socket.onclose = () => {
          console.log("🔌 Connexion WebSocket fermée")
          this.isConnected = false
          this.handleReconnect()
        }
      } catch (error) {
        console.error("❌ Erreur lors de la création de la connexion:", error)
        reject(error)
      }
    })
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

      setTimeout(() => {
        this.connect(this.userId, this.username)
      }, 2000 * this.reconnectAttempts)
    } else {
      console.error("❌ Nombre maximum de tentatives de reconnexion atteint")
    }
  }

  subscribe(callback) {
    console.log("📝 Nouvel abonné ajouté")
    this.subscribers.push(callback)

    return () => {
      console.log("📝 Abonné supprimé")
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
    }
  }

  notifySubscribers(notification) {
    console.log("📢 Notification des abonnés:", this.subscribers.length, "abonnés")
    this.subscribers.forEach((callback) => {
      try {
        callback(notification)
      } catch (error) {
        console.error("❌ Erreur dans callback:", error)
      }
    })
  }

  disconnect() {
    console.log("🔌 Déconnexion WebSocket")
    if (this.stompClient && this.isConnected) {
      this.stompClient.disconnect()
      this.isConnected = false
      this.reconnectAttempts = 0
    }
  }

  isConnectionActive() {
    return this.isConnected && this.stompClient && this.stompClient.connected
  }

  testConnection() {
    console.log("🧪 Test de connexion WebSocket")
    console.log("- Connecté:", this.isConnected)
    console.log("- User ID:", this.userId)
    console.log("- Username:", this.username)
    console.log("- Nombre d'abonnés:", this.subscribers.length)
    console.log("- Client STOMP:", this.stompClient ? "Initialisé" : "Non initialisé")
    console.log("- Connexion active:", this.isConnectionActive())
  }
}

const notificationWebSocketService = new NotificationWebSocketService()

// Exposer pour debug dans la console
if (typeof window !== "undefined") {
  window.notificationWebSocketService = notificationWebSocketService
}

export default notificationWebSocketService
