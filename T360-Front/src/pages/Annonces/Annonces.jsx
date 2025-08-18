"use client"

import { useState, useEffect, useRef } from "react"
import {
  Layout,
  Card,
  Input,
  Button,
  Avatar,
  Space,
  Divider,
  Typography,
  message,
  Tooltip,
  Dropdown,
  Modal,
  Progress,
  Spin,
  Upload,
} from "antd"
import {
  SendOutlined,
  LikeOutlined,
  CommentOutlined,
  EyeOutlined,
  MoreOutlined,
  HeartOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  PlusOutlined,
  CloseOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PaperClipOutlined,
} from "@ant-design/icons"
import SondageService from "../../services/sondage-service"
import PostService from "../../services/post-service"
import { UserService } from "../../services/user-service"
import { useAuth } from "../../contexts/AuthContext" // Chemin mis à jour
import LikeService from "../../services/like-service"
import CommentService from "../../services/comment-service"
import { useTheme } from "../../contexts/ThemeContext" // Importation du ThemeContext
import "./Annonces.css"

const { Content } = Layout
const { TextArea } = Input
const { Text, Title } = Typography

const AnnoncesPage = () => {
  const { isLightMode } = useTheme() // Utilisation du hook useTheme
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [editingPost, setEditingPost] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [editingPollOptions, setEditingPollOptions] = useState([])
  const avatarUrlsRef = useRef({})

  const [showPollCreator, setShowPollCreator] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState(["", ""])
  const [publishingPoll, setPublishingPoll] = useState(false)
  const [publishingPost, setPublishingPost] = useState(false)

  const [selectedMediaFiles, setSelectedMediaFiles] = useState([])

  const [commentInput, setCommentInput] = useState({})
  const [showCommentsForPost, setShowCommentsForPost] = useState({})

  // Nouveaux états pour la modification de commentaire
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentModalVisible, setEditCommentModalVisible] = useState(false)
  const [editCommentContent, setEditCommentContent] = useState("")

  const { user, isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    return () => {
      for (const url of Object.values(avatarUrlsRef.current)) {
        URL.revokeObjectURL(url)
      }
      avatarUrlsRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      loadAllAnnouncements()
    }
  }, [authLoading])

  const loadAllAnnouncements = async () => {
    setLoading(true)
    for (const url of Object.values(avatarUrlsRef.current)) {
      URL.revokeObjectURL(url)
    }
    avatarUrlsRef.current = {}

    try {
      const [sondages, regularPosts] = await Promise.all([SondageService.getAllSondages(), PostService.getAllPosts()])

      const safeSondages = Array.isArray(sondages) ? sondages : []
      const safeRegularPosts = Array.isArray(regularPosts) ? regularPosts : []

      const allRawItems = [...safeSondages, ...safeRegularPosts]

      console.log("Raw items received from API:", allRawItems)

      const uniqueUserIds = new Set()
      const allPostLikesPromises = []
      const allPostCommentsPromises = []

      allRawItems.forEach((item) => {
        if (typeof item !== "object" || item === null) {
          console.warn("Skipping non-object or null item in allRawItems:", item)
          return
        }
        const authorId = item.auteur?.id || item.auteurId
        if (authorId) {
          uniqueUserIds.add(authorId)
        }

        if (item.contenu && item.id) {
          allPostLikesPromises.push(
            LikeService.getLikesByPost(item.id)
              .then((likes) => {
                likes.forEach((like) => {
                  if (like.utilisateurId) {
                    uniqueUserIds.add(like.utilisateurId)
                  }
                })
                return { postId: item.id, likes: likes }
              })
              .catch((error) => {
                console.warn(`Error fetching likes for post ${item.id}:`, error)
                return { postId: item.id, likes: [] }
              }),
          )
          allPostCommentsPromises.push(
            CommentService.getCommentsByPost(item.id)
              .then((comments) => {
                comments.forEach((comment) => {
                  if (comment.utilisateurId) {
                    uniqueUserIds.add(comment.utilisateurId)
                  }
                })
                return { postId: item.id, comments: comments }
              })
              .catch((error) => {
                console.warn(`Error fetching comments for post ${item.id}:`, error)
                return { postId: item.id, comments: [] }
              }),
          )
        }
      })

      const allPostLikesResults = await Promise.all(allPostLikesPromises)
      const postLikesMap = new Map(allPostLikesResults.map((res) => [res.postId, res.likes]))

      const allPostCommentsResults = await Promise.all(allPostCommentsPromises)
      const postCommentsMap = new Map(allPostCommentsResults.map((res) => [res.postId, res.comments]))

      const usersData = {}
      const allUserIdsArray = [...uniqueUserIds]
      if (allUserIdsArray.length > 0) {
        const fetchedUsers = await UserService.getUsersByIds(allUserIdsArray)
        for (const id in fetchedUsers) {
          usersData[id] = fetchedUsers[id]
          try {
            const imageBlob = await UserService.getProfileImage(id)
            if (imageBlob) {
              const imageUrl = URL.createObjectURL(imageBlob)
              avatarUrlsRef.current[id] = imageUrl
              usersData[id].avatarUrl = imageUrl
            } else {
              usersData[id].avatarUrl = "/placeholder.svg?height=40&width=40"
            }
          } catch (error) {
            console.warn(`Impossible de charger l'image de profil pour l'utilisateur ${id}:`, error)
            usersData[id].avatarUrl = "/placeholder.svg?height=40&width=40"
          }
        }
      }

      const transformedItems = allRawItems
        .map((item) => {
          const auteurId = item.auteur?.id || item.auteurId
          const auteur = usersData[auteurId] || {
            nom: "Utilisateur",
            prenom: "",
            avatarUrl: "/placeholder.svg?height=40&width=40",
          }

          const itemDate = item.date ? new Date(item.date) : new Date()

          if (item.question) {
            const transformedSondage = SondageService.transformSondageForDisplay(item)
            let userVote = null
            if (isAuthenticated && user && item.options) {
              for (const option of item.options) {
                const votes = option.votes || option.votesDetails || []
                if (votes && votes.some((vote) => vote.utilisateurId === user.id || vote.utilisateur?.id === user.id)) {
                  userVote = option.id
                  break
                }
              }
            }

            return {
              id: item.id.toString(),
              author: {
                name: `${auteur.prenom || ""} ${auteur.nom || "Utilisateur"}`.trim(),
                avatar: auteur.avatarUrl,
              },
              content: item.question,
              timestamp: itemDate,
              likes: 0,
              comments: 0,
              views: 0,
              type: "poll",
              poll: {
                question: item.question,
                options: transformedSondage.options.map((option) => ({
                  id: option.id,
                  text: option.texte,
                  votes: option.votes,
                })),
                totalVotes: transformedSondage.totalVotes,
                userVote,
              },
              apiId: item.id,
              auteurId: auteurId,
            }
          } else if (item.contenu) {
            const transformedPost = PostService.transformPostForDisplay(item)
            const postLikes = postLikesMap.get(item.id) || []
            const likedByCurrentUser =
              isAuthenticated && user && postLikes.some((like) => like.utilisateurId === user.id)

            const likers = postLikes.map((like) => {
              const likerUser = usersData[like.utilisateurId] || {
                nom: "Utilisateur",
                prenom: "",
                avatarUrl: "/placeholder.svg?height=40&width=40",
              }
              return {
                id: like.utilisateurId,
                name: `${likerUser.prenom || ""} ${likerUser.nom || "Utilisateur"}`.trim(),
                avatar: likerUser.avatarUrl,
              }
            })

            const postComments = postCommentsMap.get(item.id) || []
            const comments = postComments.map((comment) => {
              const commentAuthor = usersData[comment.utilisateurId] || {
                nom: "Utilisateur",
                prenom: "",
                avatarUrl: "/placeholder.svg?height=40&width=40",
              }
              return {
                id: comment.id,
                content: comment.contenu,
                date: new Date(comment.date),
                author: {
                  id: comment.utilisateurId,
                  name: `${commentAuthor.prenom || ""} ${commentAuthor.nom || "Utilisateur"}`.trim(),
                  avatar: commentAuthor.avatarUrl,
                },
              }
            })

            const postObject = {
              id: item.id.toString(),
              author: {
                name: `${auteur.prenom || ""} ${auteur.nom || "Utilisateur"}`.trim(),
                avatar: auteur.avatarUrl,
              },
              content: item.contenu,
              timestamp: itemDate,
              likes: postLikes.length,
              comments: comments.length,
              views: transformedPost.views,
              type: "post",
              apiId: item.id,
              auteurId: auteurId,
              medias: transformedPost.medias.map((media) => ({
                id: media.id,
                url: media.url,
                type: media.type,
                name: media.name,
              })),
              userLiked: likedByCurrentUser,
              likers: likers,
              commentsData: comments,
            }
            return postObject
          }
          return null
        })
        .filter(Boolean)

      const resolvedTransformedItems = await Promise.all(transformedItems)

      resolvedTransformedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      setPosts(resolvedTransformedItems)
    } catch (error) {
      console.error("Erreur lors du chargement des annonces:", error)
      message.error("Erreur lors du chargement des annonces")
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date passed to formatTimeAgo:", date)
      return "Date invalide"
    }

    const now = new Date()
    const diffInMilliseconds = now.getTime() - date.getTime()
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInSeconds < 10) {
      return `à l'instant`
    } else if (diffInSeconds < 60) {
      return `il y a ${diffInSeconds} sec`
    } else if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `il y a ${diffInHours}h`
    } else if (diffInDays < 30) {
      return `il y a ${diffInDays}j`
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    }
  }

  const validateOptionsUniqueness = (options) => {
    const texts = options.map((opt) => (typeof opt === "string" ? opt : opt.texte).trim().toLowerCase()).filter(Boolean)
    const uniqueTexts = new Set(texts)
    return texts.length === uniqueTexts.size
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""])
    } else {
      message.warning("Maximum 6 options autorisées")
    }
  }

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index)
      setPollOptions(newOptions)
    } else {
      message.warning("Minimum 2 options requises")
    }
  }

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const addPollOptionInModal = () => {
    if (editingPollOptions.length < 6) {
      setEditingPollOptions([...editingPollOptions, { id: null, texte: "" }])
    } else {
      message.warning("Maximum 6 options autorisées")
    }
  }

  const removePollOptionInModal = (index) => {
    if (editingPollOptions.length > 2) {
      const newOptions = editingPollOptions.filter((_, i) => i !== index)
      setEditingPollOptions(newOptions)
    } else {
      message.warning("Minimum 2 options requises")
    }
  }

  const updatePollOptionInModal = (index, value) => {
    const newOptions = [...editingPollOptions]
    newOptions[index] = { ...newOptions[index], texte: value }
    setEditingPollOptions(newOptions)
  }

  const handlePublishPoll = async () => {
    if (!isAuthenticated || !user) {
      message.error("Vous devez être connecté pour créer un sondage")
      return
    }

    if (!user.id) {
      message.error("Erreur: ID utilisateur manquant")
      console.error("Utilisateur sans ID:", user)
      return
    }

    if (!pollQuestion.trim()) {
      message.warning("Veuillez ajouter une question au sondage")
      return
    }

    const validOptions = pollOptions.filter((option) => option.trim() !== "")
    if (validOptions.length < 2) {
      message.warning("Veuillez ajouter au moins 2 options au sondage")
      return
    }
    if (!validateOptionsUniqueness(validOptions)) {
      message.warning("Les options de sondage ne doivent pas être dupliquées.")
      return
    }

    setPublishingPoll(true)
    try {
      const sondageData = {
        question: pollQuestion,
        options: validOptions.map((option, index) => ({
          texte: option,
          ordre: index + 1,
        })),
      }

      console.log("=== TENTATIVE CREATION SONDAGE ===")
      console.log("Utilisateur:", user)
      console.log("Données sondage:", sondageData)

      await SondageService.createSondage(sondageData, user)

      await loadAllAnnouncements()
      setPollQuestion("")
      setPollOptions(["", ""])
      setShowPollCreator(false)
      message.success("Sondage publié avec succès !")
    } catch (error) {
      console.error("Erreur lors de la publication du sondage:", error)
      message.error(`Erreur lors de la publication du sondage: ${error.message}`)
    } finally {
      setPublishingPoll(false)
    }
  }

  const handleMediaChange = ({ fileList }) => {
    // Store the fileList directly, as it contains UploadFile objects with uid
    setSelectedMediaFiles(fileList)
  }

  const handlePublishPost = async () => {
    if (!isAuthenticated || !user) {
      message.error("Vous devez être connecté pour publier")
      return
    }

    if (!newPostContent.trim() && selectedMediaFiles.length === 0) {
      message.warning("Veuillez ajouter du contenu ou des médias à votre publication")
      return
    }

    setPublishingPost(true)
    try {
      // If no text content but media files are present, send a non-empty string (e.g., a space)
      // to satisfy potential backend/DB constraints that disallow null or empty strings.
      // This ensures that posts with only media can be created.
      let contentToSend = newPostContent.trim()
      if (contentToSend === "" && selectedMediaFiles.length > 0) {
        contentToSend = " " // Send a single space as placeholder
      }

      const postData = {
        contenu: contentToSend,
      }

      console.log("=== TENTATIVE CREATION POST ===")
      console.log("Utilisateur:", user)
      console.log("Données post:", postData)
      console.log("Fichiers médias:", selectedMediaFiles)

      await PostService.createPost(
        postData,
        user,
        selectedMediaFiles.map((file) => file.originFileObj), // Map to originFileObj for the service call
      )

      await loadAllAnnouncements()
      setNewPostContent("")
      setSelectedMediaFiles([])
      message.success("Publication partagée avec succès !")
    } catch (error) {
      console.error("Erreur lors de la publication du post:", error)
      message.error(`Erreur lors de la publication du post: ${error.message}`)
    } finally {
      setPublishingPost(false)
    }
  }

  const handlePublish = () => {
    if (showPollCreator) {
      handlePublishPoll()
    } else {
      handlePublishPost()
    }
  }

  const handleVote = async (postId, optionId) => {
    if (!isAuthenticated || !user) {
      message.error("Vous devez être connecté pour voter")
      return
    }

    const postIndex = posts.findIndex((p) => p.id === postId)
    if (postIndex === -1 || !posts[postIndex].apiId) {
      message.error("Erreur: sondage non trouvé")
      return
    }

    const currentPost = posts[postIndex]
    const currentPoll = currentPost.poll || {} // Assurez-vous que currentPoll est au moins un objet vide
    const updatedPoll = { ...currentPoll, options: currentPoll.options || [] } // Assurez-vous que options est un tableau

    try {
      const voteResult = await SondageService.voterOption(optionId, user)

      const updatedPosts = [...posts]
      const updatedPost = { ...currentPost }
      const updatedPoll = { ...currentPoll }

      if (voteResult.type === "cancelled") {
        message.success("Vote annulé !")
        updatedPoll.options = updatedPoll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes - 1 } : opt,
        )
        updatedPoll.totalVotes -= 1
        updatedPoll.userVote = null
      } else if (voteResult.type === "voted") {
        message.success("Vote enregistré !")
        updatedPoll.options = updatedPoll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt,
        )
        updatedPoll.totalVotes += 1
        updatedPoll.userVote = optionId
      } else if (voteResult.type === "changed") {
        message.success("Vote modifié !")
        const oldOptionId = currentPoll.userVote
        if (oldOptionId) {
          updatedPoll.options = updatedPoll.options.map((opt) =>
            opt.id === oldOptionId ? { ...opt, votes: opt.votes - 1 } : opt,
          )
        }
        updatedPoll.options = updatedPoll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt,
        )
        updatedPoll.userVote = optionId
      }

      updatedPost.poll = updatedPoll
      updatedPosts[postIndex] = updatedPost
      setPosts(updatedPosts)
      await loadAllAnnouncements()
    } catch (error) {
      console.error("Erreur lors du vote:", error)
      message.error(`Erreur lors du vote: ${error.message}`)
    }
  }

  const handleLike = async (postId) => {
    if (!isAuthenticated || !user || !user.id) {
      message.error("Vous devez être connecté pour aimer une publication")
      return
    }

    const postIndex = posts.findIndex((p) => p.id === postId)
    if (postIndex === -1 || posts[postIndex].type !== "post") {
      message.error("Publication introuvable ou non éligible aux likes")
      return
    }

    const currentPost = posts[postIndex]
    const isCurrentlyLiked = currentPost.userLiked

    try {
      let updatedLikesCount = currentPost.likes
      const updatedUserLiked = !isCurrentlyLiked
      let updatedLikers = [...currentPost.likers]

      if (isCurrentlyLiked) {
        await LikeService.removeLike(currentPost.apiId, user.id)
        updatedLikesCount -= 1
        updatedLikers = updatedLikers.filter((liker) => liker.id !== user.id)
        message.success("J'aime retiré !")
      } else {
        await LikeService.addLike(currentPost.apiId, user.id)
        updatedLikesCount += 1
        updatedLikers.push({
          id: user.id,
          name: `${user.prenom} ${user.nom}`.trim(),
          avatar: user.avatarUrl || "/placeholder.svg?height=40&width=40",
        })
        message.success("J'aime ajouté !")
      }

      const updatedPosts = [...posts]
      updatedPosts[postIndex] = {
        ...currentPost,
        likes: updatedLikesCount,
        userLiked: updatedUserLiked,
        likers: updatedLikers,
      }
      setPosts(updatedPosts)
    } catch (error) {
      console.error("Erreur lors de la gestion du like:", error)
      message.error(`Erreur lors de la gestion du like: ${error.message}`)
      loadAllAnnouncements()
    }
  }

  const handleCommentChange = (postId, value) => {
    setCommentInput((prev) => ({ ...prev, [postId]: value }))
  }

  const handlePostComment = async (postId) => {
    if (!isAuthenticated || !user || !user.id) {
      message.error("Vous devez être connecté pour commenter")
      return
    }

    const commentContent = commentInput[postId]?.trim()
    if (!commentContent) {
      message.warning("Veuillez écrire un commentaire")
      return
    }

    const postIndex = posts.findIndex((p) => p.id === postId)
    if (postIndex === -1 || posts[postIndex].type !== "post") {
      message.error("Publication introuvable ou non éligible aux commentaires")
      return
    }

    const currentPost = posts[postIndex]

    try {
      const newComment = await CommentService.createComment(currentPost.apiId, user.id, commentContent)

      const enrichedComment = {
        id: newComment.id,
        content: newComment.contenu,
        date: new Date(newComment.date),
        author: {
          id: user.id,
          name: `${user.prenom} ${user.nom}`.trim(),
          avatar: user.avatarUrl || "/placeholder.svg?height=40&width=40",
        },
      }

      const updatedPosts = [...posts]
      updatedPosts[postIndex] = {
        ...currentPost,
        comments: currentPost.comments + 1,
        commentsData: [...(currentPost.commentsData || []), enrichedComment],
      }
      setPosts(updatedPosts)
      setCommentInput((prev) => ({ ...prev, [postId]: "" }))
      message.success("Commentaire ajouté !")
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error)
      message.error(`Erreur lors de l'ajout du commentaire: ${error.message}`)
    }
  }

  const toggleCommentsVisibility = (postId) => {
    setShowCommentsForPost((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }))
  }

  const handleView = (postId) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, views: post.views + 1 } : post)))
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setEditContent(post.content)
    if (post.type === "poll" && post.poll?.options) {
      setEditingPollOptions(post.poll.options.map((opt) => ({ id: opt.id, texte: opt.text })))
    } else {
      setEditingPollOptions([])
    }
    setEditModalVisible(true)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      message.warning("Le contenu ne peut pas être vide")
      return
    }

    try {
      if (editingPost.type === "poll" && editingPost.apiId) {
        const validEditingOptions = editingPollOptions.filter((option) => option.texte.trim() !== "")
        if (validEditingOptions.length < 2) {
          message.warning("Veuillez ajouter au moins 2 options au sondage")
          return
        }
        if (!validateOptionsUniqueness(validEditingOptions)) {
          message.warning("Les options de sondage ne doivent pas être dupliquées.")
          return
        }

        const updatedSondage = {
          question: editContent,
          options: validEditingOptions.map((option) => ({
            id: option.id,
            texte: option.texte,
          })),
        }

        console.log("Modification sondage:", updatedSondage)
        await SondageService.updateSondage(editingPost.apiId, updatedSondage)

        setPosts(
          posts.map((p) =>
            p.id === editingPost.id
              ? {
                  ...p,
                  content: editContent,
                  timestamp: new Date(),
                  poll:
                    p.type === "poll"
                      ? {
                          ...p.poll,
                          question: editContent,
                          options: validEditingOptions.map((opt) => ({
                            id: opt.id,
                            text: opt.texte,
                            votes: p.poll.options.find((o) => o.id === opt.id)?.votes || 0,
                          })),
                        }
                      : p.poll,
                }
              : p,
          ),
        )
      } else if (editingPost.type === "post" && editingPost.apiId) {
        const updatedPostData = {
          contenu: editContent,
        }
        await PostService.updatePost(editingPost.apiId, updatedPostData)

        setPosts(
          posts.map((p) => (p.id === editingPost.id ? { ...p, content: editContent, timestamp: new Date() } : p)),
        )
      }

      setEditModalVisible(false)
      setEditingPost(null)
      setEditContent("")
      setEditingPollOptions([])
      message.success("Publication modifiée avec succès !")
    } catch (error) {
      console.error("Erreur lors de la modification:", error)
      message.error(`Erreur lors de la modification: ${error.message}`)
    }
  }

  const handleDeletePost = async (postId) => {
    const post = posts.find((p) => p.id === postId)
    if (post && post.auteurId && post.auteurId !== user?.id) {
      message.error("Vous ne pouvez supprimer que vos propres publications")
      return
    }

   Modal.confirm({
  title: "Supprimer la publication",
  content: "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
  okText: "Supprimer",
  okType: "danger",
  cancelText: "Annuler",
  className: isLightMode ? 'modal-light' : 'modal-dark', // Ajoutez cette ligne
  onOk: async () => {
    try {
      if (post && post.type === "poll" && post.apiId) {
        await SondageService.deleteSondage(post.apiId)
      } else if (post && post.type === "post" && post.apiId) {
        await PostService.deletePost(post.apiId)
      }
      setPosts(posts.filter((p) => p.id !== postId))
      await loadAllAnnouncements()
      message.success("Publication supprimée !")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      message.error("Erreur lors de la suppression")
    }
  },
})
  }

  const handleEditComment = (comment) => {
    setEditingComment(comment)
    setEditCommentContent(comment.content)
    setEditCommentModalVisible(true)
  }

  const handleSaveCommentEdit = async () => {
    if (!editCommentContent.trim()) {
      message.warning("Le contenu du commentaire ne peut pas être vide")
      return
    }
    if (!editingComment || !editingComment.id) {
      message.error("Commentaire à modifier introuvable.")
      return
    }

    try {
      await CommentService.updateComment(editingComment.id, editCommentContent)

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.type === "post" && post.commentsData) {
            return {
              ...post,
              commentsData: post.commentsData.map((comment) =>
                comment.id === editingComment.id ? { ...comment, content: editCommentContent } : comment,
              ),
            }
          }
          return post
        }),
      )
      message.success("Commentaire modifié avec succès !")
      setEditCommentModalVisible(false)
      setEditingComment(null)
      setEditCommentContent("")
    } catch (error) {
      console.error("Erreur lors de la modification du commentaire:", error)
      message.error(`Erreur lors de la modification du commentaire: ${error.message}`)
    }
  }

  const handleDeleteComment = async (postId, commentId) => {
    const post = posts.find((p) => p.id === postId)
    const comment = post?.commentsData?.find((c) => c.id === commentId)

    if (!comment || comment.author.id !== user?.id) {
      message.error("Vous ne pouvez supprimer que vos propres commentaires.")
      return
    }

    Modal.confirm({
      title: "Supprimer le commentaire",
      content: "Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.",
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await CommentService.deleteComment(commentId)

          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if (p.id === postId && p.type === "post") {
                return {
                  ...p,
                  comments: p.comments - 1,
                  commentsData: (p.commentsData || []).filter((c) => c.id !== commentId),
                }
              }
              return p
            }),
          )
          message.success("Commentaire supprimé !")
        } catch (error) {
          console.error("Erreur lors de la suppression du commentaire:", error)
          message.error(`Erreur lors de la suppression du commentaire: ${error.message}`)
        }
      },
    })
  }

const getPostMenu = (post) => {
  const canEdit = post.auteurId === user?.id;
  if (!canEdit) return null;

  return {
    className: isLightMode ? 'menu-light' : 'menu-dark', // Ajout de la classe conditionnelle
    items: [
      {
        key: "edit",
        label: (
          <span
            style={{
              color: isLightMode ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            <EditOutlined style={{ 
              marginRight: 8,
              color: isLightMode ? "#000" : "#fff" 
            }} />
            Modifier
          </span>
        ),
        onClick: () => handleEditPost(post),
      },
      {
        key: "delete",
        label: (
          <span
            style={{
              color: "#ff4d4f", // Garde la couleur rouge pour la suppression
              display: "flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            <DeleteOutlined style={{ 
              marginRight: 8,
              color: "#ff4d4f" 
            }} />
            Supprimer
          </span>
        ),
        onClick: () => handleDeletePost(post.id),
      },
    ],
    style: {
      backgroundColor: isLightMode ? '#fff' : '#1f1f1f',
      border: isLightMode ? '1px solid #d9d9d9' : '1px solid #434343',
      borderRadius: '8px',
      boxShadow: isLightMode 
        ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
        : '0 3px 6px -4px rgba(0, 0, 0, 0.48), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.2)'
    }
  };
};


  const getCommentMenu = (postId, comment) => {
    const canEdit = comment.author.id === user?.id
    if (!canEdit) {
      return null
    }

    return {
      items: [
        {
          key: "edit",
          label: (
            <span>
              <EditOutlined style={{ marginRight: 8 }} />
              Modifier
            </span>
          ),
          onClick: () => handleEditComment(comment),
        },
        {
          key: "delete",
          label: (
            <span style={{ color: "#ff4d4f" }}>
              <DeleteOutlined style={{ marginRight: 8 }} />
              Supprimer
            </span>
          ),
          onClick: () => handleDeleteComment(postId, comment.id),
        },
      ],
    }
  }

  const getVotePercentage = (votes, totalVotes) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
  }

  if (authLoading) {
    return (
      <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        <Content style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <div style={{ marginTop: "20px" }}>
              <Text>Chargement...</Text>
            </div>
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
        className={isLightMode ? "card-light" : "card-dark"}
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={isLightMode ? "card-title-light" : "card-title-dark"}>Espace Annonces</span>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={loadAllAnnouncements}
                loading={loading}
                style={{ color: "#1890ff" }}
              >
                Actualiser
              </Button>
            </div>
          }
          bordered={false}
          style={{ marginBottom: "20px" }}
        >
          {isAuthenticated && user ? (
            <Card 
            className={isLightMode ? "card-light" : "card-dark"}
            style={{ marginBottom: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <Avatar
                  size={50}
                  icon={<UserOutlined />}
                  src={user.avatarUrl || "/placeholder.svg?height=40&width=40"}
                />
                <div style={{ flex: 1 }}>
                  
                  {!showPollCreator ? (
                    <>
                      <div style={{ position: "relative" }}>
                        {" "}
                        {/* AJOUT DU CONTENEUR RELATIF */}
                        <TextArea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="Que voulez-vous partager aujourd'hui ?"
                          autoSize={{ minRows: 3, maxRows: 6 }}
                          bordered={false}
                          style={{
                            fontSize: "16px",
                            backgroundColor: isLightMode? "#f8f9fa": "#273142",
                            borderRadius: "20px",
                            padding: "12px 16px",
                            paddingRight: "40px", // pour ne pas que le texte touche l'icône
                            resize: "none",
                          }}
                        />
                        <Upload
                          beforeUpload={() => false}
                          showUploadList={false}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          onChange={handleMediaChange}
                        >
                          <PaperClipOutlined
                            style={{
                              position: "absolute",
                              right: "12px",
                              bottom: "12px",
                              fontSize: "18px",
                              color: "#999",
                              cursor: "pointer",
                            }}
                          />
                        </Upload>
                      </div>
                      {/* Affichage des fichiers sélectionnés en dessous du TextArea */}
                      {selectedMediaFiles.length > 0 && (
                        <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {selectedMediaFiles.map((file) => (
                            <div
                              key={file.uid}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#e6f7ff",
                                border: "1px solid #91d5ff",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                fontSize: "13px",
                                gap: "8px",
                              }}
                            >
                              {file.type && file.type.startsWith("image/") ? (
                                <img
                                  src={file.originFileObj ? URL.createObjectURL(file.originFileObj) : file.url}
                                  alt={file.name}
                                  style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "4px" }}
                                />
                              ) : (
                                <FileTextOutlined style={{ color: "#1890ff" }} />
                              )}
                              <span>{file.name}</span>
                              <CloseOutlined
                                style={{ cursor: "pointer", color: "#1890ff" }}
                                onClick={() =>
                                  setSelectedMediaFiles(selectedMediaFiles.filter((f) => f.uid !== file.uid))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ backgroundColor: isLightMode? "#f8f9fa": "#273142", borderRadius: "12px", padding: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                          backgroundColor: isLightMode? "#f8f9fa": "#273142"
                        }}
                      >
                        <Title level={5} style={{ margin: 0, color: "#1890ff" }}>
                          <BarChartOutlined style={{ marginRight: 8 }} />
                          Créer un sondage
                        </Title>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            setShowPollCreator(false)
                            setPollQuestion("")
                            setPollOptions(["", ""])
                          }}
                          style={{ color: "#8c8c8c" }}
                        />
                      </div>
                      <Input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Posez votre question..."
                        style={{ marginBottom: "16px", fontSize: "16px", padding: "8px 12px" ,backgroundColor: isLightMode? "#f8f9fa": "#273142"}}
                      />
                      <div style={{ marginBottom: "12px" }}>
                        <Text strong style={{ color: "#595959" }}>
                          Options de réponse :
                        </Text>
                      </div>
                      {pollOptions.map((option, index) => (
                        <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                          <Input
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            style={{ flex: 1 ,backgroundColor: isLightMode? "#f8f9fa": "#273142"}}
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              type="text"
                              icon={<CloseOutlined />}
                              onClick={() => removePollOption(index)}
                              style={{ color: "#ff4d4f" }}
                            />
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 6 && (
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={addPollOption}
                          style={{ width: "100%", marginTop: "8px" }}
                        >
                          Ajouter une option
                        </Button>
                      )}
                    </div>
                  )}
                  <Divider style={{ margin: "16px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space size="large">
                      <Button
                        type="text"
                        icon={<FileTextOutlined />}
                        onClick={() => setShowPollCreator(false)}
                        style={{
                          color: !showPollCreator ? "#1890ff" : "#722ed1",
                          fontWeight: "500",
                          backgroundColor: !showPollCreator ? "#e6f7ff" : "transparent",
                        }}
                        size="large"
                      >
                        Publication
                      </Button>
                      <Button
                        type="text"
                        icon={<BarChartOutlined />}
                        onClick={() => setShowPollCreator(true)}
                        style={{
                          color: showPollCreator ? "#1890ff" : "#722ed1",
                          fontWeight: "500",
                          backgroundColor: showPollCreator ? "#e6f7ff" : "transparent",
                        }}
                        size="large"
                      >
                        Sondage
                      </Button>
                    </Space>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handlePublish}
                      loading={showPollCreator ? publishingPoll : publishingPost}
                      size="large"
                      style={{
                        borderRadius: "20px",
                        fontWeight: "600",
                        minWidth: "100px",
                      }}
                      disabled={
                        showPollCreator
                          ? !pollQuestion.trim() || pollOptions.filter((opt) => opt.trim()).length < 2
                          : !newPostContent.trim() && selectedMediaFiles.length === 0
                      }
                    >
                      {showPollCreator ? "Publier le sondage" : "Publier"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card style={{ marginBottom: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Text type="secondary">Connectez-vous pour créer des publications et participer aux sondages</Text>
              </div>
            </Card>
          )}

          <Spin spinning={loading}>
            {posts.map((post) => (
              <Card
                key={post.id}
                style={{
                  marginBottom: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: "1px solid #e8e8e8",
                }}
                className={isLightMode ? "card-light" : "card-dark"}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Avatar size={50} src={post.author.avatar} />
                    <div>
                      <Title level={5} style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#262626" }}>
                        {post.author.name}
                        {post.type === "poll" && (
                          <span style={{ marginLeft: "8px", fontSize: "12px", color: "#722ed1" }}>📊 Sondage</span>
                        )}
                        {post.type === "post" && (
                          <span style={{ marginLeft: "8px", fontSize: "12px", color: "#1890ff" }}>📝 Publication</span>
                        )}
                      </Title>
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        {formatTimeAgo(post.timestamp)} {/* Supprimé le "0 J'aimes" hardcodé */}
                      </Text>
                    </div>
                  </div>
                  {post.auteurId === user?.id && (
                    <Dropdown
  menu={getPostMenu(post)}
  trigger={["click"]}
  placement="bottomRight"
  overlayStyle={{
    backgroundColor: isLightMode ? "#f8f9fa" : "#273142",
    borderRadius: "8px",
    padding: "8px",
  }}
>
  <Button
    type="text"
    icon={<MoreOutlined />}
    style={{ color: "#8c8c8c" ,backgroundColor: isLightMode ? "#f8f9fa" : "#273142"}}
  />
</Dropdown>

                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <Text style={{ fontSize: "15px", lineHeight: "1.5", color: "#262626" }}>{post.content}</Text>
                </div>

                {post.type === "post" && post.medias && post.medias.length > 0 && (
                  <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {post.medias.map((media) =>
                      media.type && media.type.startsWith("image/") ? (
                        <img
                          key={media.id}
                          src={media.url || "/placeholder.svg"}
                          alt="Post media"
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            objectFit: "cover",
                            maxHeight: "300px",
                          }}
                        />
                      ) : (
                        <Button
                          key={media.id}
                          type="default"
                          icon={<FileTextOutlined />}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            borderColor: "#d9d9d9",
                            color: "#595959",
                            fontWeight: "500",
                          }}
                        >
                          {media.name || "Document"}
                        </Button>
                      ),
                    )}
                  </div>
                )}

                {post.type === "poll" && post.poll && (
                  <div
                    style={{ marginBottom: "16px", backgroundColor: isLightMode? "#f8f9fa": "#273142", borderRadius: "8px", padding: "16px" }}
                  >
                    <div style={{ marginBottom: "16px" ,backgroundColor: isLightMode? "#f8f9fa": "#273142"}}>
                      {post.poll.options.map((option) => {
                        const percentage = getVotePercentage(option.votes, post.poll.totalVotes)
                        const isUserVote = post.poll.userVote === option.id

                        return (
                          <div
                            key={option.id}
                            style={{
                              marginBottom: "12px",
                              cursor: isAuthenticated && user ? "pointer" : "not-allowed",
                              border: isUserVote ? "2px solid #1877f2" : "1px solid #d9d9d9",
                              borderRadius: "8px",
                              padding: "12px",
                              backgroundColor: isUserVote ? "#e6f7ff" : "white",
                              transition: "all 0.3s ease",
                              backgroundColor: isLightMode? "#f8f9fa": "#273142"
                            }}
                            onClick={() => isAuthenticated && user && handleVote(post.id, option.id)}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "8px",
                              }}
                            >
                              <Text style={{ fontWeight: isUserVote ? "600" : "normal" }}>
                                {option.text}
                                {isUserVote && <span style={{ color: "#1877f2", marginLeft: "8px" }}>✓</span>}
                              </Text>
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                {option.votes} votes ({percentage}%)
                              </Text>
                            </div>
                            <Progress
                              percent={percentage}
                              showInfo={false}
                              strokeColor={isUserVote ? "#1877f2" : "#d9d9d9"}
                              trailColor="#f0f0f0"
                              size="small"
                            />
                          </div>
                        )
                      })}
                    </div>
                    <Text type="secondary" style={{ fontSize: "13px" }}>
                      {post.poll.totalVotes} vote{post.poll.totalVotes !== 1 ? "s" : ""} au total
                    </Text>
                  </div>
                )}

                {/* Section des compteurs de likes/commentaires (uniquement pour les posts) */}
                {post.type === "post" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 4px",
                      borderBottom: "1px solid #f0f0f0",
                      marginBottom: "8px",
                    }}
                  >
                    <Space>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "#1877f2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <HeartOutlined style={{ color: "white", fontSize: "10px" }} />
                        </div>
                        {post.likes > 0 ? (
                          <Tooltip
                            title={
                              <div>
                                {(post.likers || []).map((liker) => (
                                  <div
                                    key={liker.id}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}
                                  >
                                    <Avatar size="small" src={liker.avatar} icon={<UserOutlined />} />
                                    <span>{liker.name}</span>
                                  </div>
                                ))}
                              </div>
                            }
                          >
                            <Text type="secondary" style={{ fontSize: "13px", cursor: "pointer" }}>
                              {post.likes} {post.likes === 1 ? "J'aime" : "J'aimes"}
                            </Text>
                          </Tooltip>
                        ) : (
                          <Text type="secondary" style={{ fontSize: "13px" }}>
                            {post.likes} {post.likes === 1 ? "J'aime" : "J'aimes"}
                          </Text>
                        )}
                      </div>
                    </Space>
                    <Space size="large">
                      <Text
                        type="secondary"
                        style={{ fontSize: "13px", cursor: "pointer" }}
                        onClick={() => toggleCommentsVisibility(post.id)}
                      >
                        {post.comments} commentaire{post.comments !== 1 ? "s" : ""}
                      </Text>
                      
                    </Space>
                  </div>
                )}

                {/* Section des boutons d'action (uniquement pour les posts) */}
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  {post.type === "post" && (
                    <>
                      <Tooltip title={post.userLiked ? "Je n'aime plus" : "J'aime cette publication"}>
                        <Button
                          type="text"
                          icon={<LikeOutlined style={{ color: post.userLiked ? "#1877f2" : "#65676b" }} />}
                          onClick={() => handleLike(post.id)}
                          style={{
                            flex: 1,
                            height: "40px",
                            fontWeight: "500",
                            color: post.userLiked ? "#1877f2" : "#65676b",
                             backgroundColor: isLightMode? "#f8f9fa": "#273142"
                          }}
                        >
                          J'aime
                        </Button>
                      </Tooltip>
                      <Tooltip title="Commenter cette publication">
                        <Button
                          type="text"
                          icon={<CommentOutlined />}
                          onClick={() => toggleCommentsVisibility(post.id)}
                          style={{
                            flex: 1,
                            height: "40px",
                            fontWeight: "500",
                            color: "#65676b",
                             backgroundColor: isLightMode? "#f8f9fa": "#273142"
                          }}
                        >
                          Commenter
                        </Button>
                      </Tooltip>
                    </>
                  )}
                  
                </div>

                {/* Section des commentaires */}
                {post.type === "post" && showCommentsForPost[post.id] && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
                    <div style={{ marginBottom: "12px" }}>
                      <Text strong style={{ fontSize: "16px" }}>
                        Commentaires ({post.comments})
                      </Text>
                    </div>
                    {isAuthenticated && user && (
                      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        <Avatar size="default" src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} />
                        <TextArea
                          value={commentInput[post.id] || ""}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          placeholder="Écrivez un commentaire..."
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          style={{ flex: 1, borderRadius: "16px", padding: "8px 12px" ,backgroundColor: isLightMode ? "#f8f9fa" : "#273142",}}
                        />
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={() => handlePostComment(post.id)}
                          disabled={!commentInput[post.id]?.trim()}
                          style={{ borderRadius: "16px" }}
                        />
                      </div>
                    )}

                    {(post.commentsData || []).length > 0 ? (
                      <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "8px" ,}}>
                        {(post.commentsData || []).map((comment) => (
                          <div
                            key={comment.id}
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginBottom: "12px",
                              alignItems: "flex-start", // Align items to the top
                              
                            }}
                          >
                            <Avatar size="small" src={comment.author.avatar} icon={<UserOutlined />} />
                            <div
                              style={{
                                backgroundColor: "#f0f2f5",
                                borderRadius: "12px",
                                padding: "8px 12px",
                                flex: 1,
                                backgroundColor: isLightMode ? "#f8f9fa" : "#273142",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Text strong style={{ fontSize: "13px" }}>
                                  {comment.author.name}
                                </Text>
                                {comment.author.id === user?.id && (
                                  <Dropdown
                                    menu={getCommentMenu(post.id, comment)}
                                    trigger={["click"]}
                                    placement="bottomRight"
                                  >
                                    <Button type="text" icon={<MoreOutlined />} size="small" />
                                  </Dropdown>
                                )}
                              </div>
                              <Text style={{ fontSize: "14px", display: "block" }}>{comment.content}</Text>
                              <Text type="secondary" style={{ fontSize: "11px" }}>
                                {formatTimeAgo(comment.date)}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary" style={{ fontSize: "13px", textAlign: "center", display: "block" }}>
                        Aucun commentaire pour l'instant.
                      </Text>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </Spin>
          {!loading && posts.length === 0 && (
            <Card
              style={{
                textAlign: "center",
                padding: "50px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              className={isLightMode ? "card-light" : "card-dark"}
            >
              <Title level={4} type="secondary">
                Aucune publication ou sondage à afficher pour le moment.
              </Title>
              <Text type="secondary">Soyez le premier à partager quelque chose !</Text>
              <div style={{ marginTop: "20px" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    // Optionally scroll to the top or focus on the creation area
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  Créer une publication
                </Button>
              </div>
            </Card>
          )}
        </Card>
      </Content>

      <Modal
      style={{
                top: 10
                  }}
        title="Modifier la publication"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingPost(null)
          setEditContent("")
          setEditingPollOptions([])
        }}
        okText="Sauvegarder"
        cancelText="Annuler"
        width={600}

        className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
      >
        <TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Modifiez votre publication..."
          autoSize={{ minRows: 4, maxRows: 8 }}
          style={{
            fontSize: "15px",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: editingPost?.type === "poll" ? "16px" : "0",
            backgroundColor: isLightMode ? "#f8f9fa" : "#273142",
          }}
        />

        {editingPost?.type === "poll" && (
          <div style={{ backgroundColor: isLightMode ? "#f8f9fa" : "#273142", borderRadius: "12px", padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <Text strong style={{ color: "#595959" ,}}>
                Options de réponse :
              </Text>
            </div>
            {editingPollOptions.map((option, index) => (
              <div
                key={option.id || `new-option-${index}`}
                style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
              >
                <Input
                  value={option.texte}
                  onChange={(e) => updatePollOptionInModal(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={{ flex: 1,backgroundColor: isLightMode ? "#f8f9fa" : "#273142", }}
                />
                {editingPollOptions.length > 2 && (
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => removePollOptionInModal(index)}
                    style={{ color: "#ff4d4f" }}
                  />
                )}
              </div>
            ))}
            {editingPollOptions.length < 6 && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addPollOptionInModal}
                style={{ width: "100%", marginTop: "8px" ,backgroundColor: isLightMode ? "#f8f9fa" : "#273142",}}
              >
                Ajouter une option
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Modal pour la modification de commentaire */}
      <Modal
        title="Modifier le commentaire"
        open={editCommentModalVisible}
        onOk={handleSaveCommentEdit}
        onCancel={() => {
          setEditCommentModalVisible(false)
          setEditingComment(null)
          setEditCommentContent("")
        }}
        okText="Sauvegarder"
        cancelText="Annuler"
        width={500}
      >
        <TextArea
          value={editCommentContent}
          onChange={(e) => setEditCommentContent(e.target.value)}
          placeholder="Modifiez votre commentaire..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{
            fontSize: "15px",
            borderRadius: "8px",
            padding: "12px",
          }}
        />
      </Modal>
    </Layout>
  )
}

export default AnnoncesPage
