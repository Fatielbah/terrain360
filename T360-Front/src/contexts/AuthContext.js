

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        console.log("Utilisateur restauré depuis localStorage:", userData)
      } catch (error) {
        console.error("Erreur parsing user data:", error)
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    console.log("Connexion utilisateur:", userData)
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    console.log("Déconnexion utilisateur")
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
  }

  // Nouvelle fonction pour mettre à jour les données utilisateur
  const updateUser = (updatedUserData) => {
    console.log("Mise à jour utilisateur:", updatedUserData)
    const newUserData = { ...user, ...updatedUserData }
    setUser(newUserData)
    localStorage.setItem("user", JSON.stringify(newUserData))
  }

  // Fonction pour forcer le rechargement de l'image de profil
  const refreshProfileImage = () => {
    // Trigger un re-render en mettant à jour un timestamp
    const updatedUser = { ...user, profileImageTimestamp: Date.now() }
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    refreshProfileImage,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
