const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8081/api"

class CommentService {
  getAuthHeaders() {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const headers = {
      "Content-Type": "application/json",
    }
    if (user.token) {
      headers.Authorization = `Bearer ${user.token}`
    }
    return headers
  }

  async createComment(postId, utilisateurId, contenu) {
    try {
      const commentRequest = { postId, utilisateurId, contenu }
      console.log("Sending createComment request:", commentRequest)

      const response = await fetch(`${API_BASE_URL}/commentaires`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erreur createComment:", error)
      throw error
    }
  }

  async getCommentsByPost(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/commentaires/post/${postId}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const text = await response.text()
      if (!text.trim()) {
        return []
      }

      try {
        return JSON.parse(text)
      } catch (jsonError) {
        console.error("Erreur parsing JSON (getCommentsByPost):", text.substring(0, 200) + "...")
        return []
      }
    } catch (error) {
      console.error("Erreur getCommentsByPost:", error)
      return []
    }
  }

  async updateComment(commentId, contenu) {
    try {
      const commentRequest = { contenu }
      console.log("Sending updateComment request:", commentRequest)

      const response = await fetch(`${API_BASE_URL}/commentaires/${commentId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erreur updateComment:", error)
      throw error
    }
  }

  async deleteComment(commentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/commentaires/${commentId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Erreur deleteComment:", error)
      throw error
    }
  }
}

export default new CommentService()
