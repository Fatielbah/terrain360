
import { useState, useEffect } from "react"
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Typography,
  message,
  Row,
  Col,
  Calendar,
  Badge,
  Alert,
  Card,
  List,
  Popconfirm,
  Tag,
  Space,
  Modal,
  Descriptions,
  TimePicker,
  Upload,
} from "antd"
import {
  SendOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  StopOutlined,
  EyeOutlined,
  ReloadOutlined,
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { demandeService } from "../../services/demandeService"
import "./calendar.css" // Import du fichier CSS du calendrier

const API_BASE_URL = "http://localhost:8081/api"
const { Title, Text } = Typography
const { TextArea } = Input
const { Dragger } = Upload

export default function DemandeAbsenceForm() {
  const [form] = Form.useForm()
  const [typeAbsence, setTypeAbsence] = useState("JOURNEE")
  const [loading, setLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState(null)
  const [existingAbsences, setExistingAbsences] = useState([])
  const [loadingAbsences, setLoadingAbsences] = useState(false)
  const [canSubmit, setCanSubmit] = useState(true)
  const [detailsModal, setDetailsModal] = useState({ visible: false, demande: null })
  const [fileList, setFileList] = useState([])
  const { isLightMode } = useTheme()
  const { user } = useAuth()
  const [fileError, setFileError] = useState(null)

  // Types d'absence selon l'enum backend
  const typesAbsence = [
    { value: "JOURNEE", label: "Journée complète" },
    { value: "DEMI_JOURNEE", label: "Demi-journée" },
    { value: "HEURE", label: "Quelques heures" },
  ]

  // Options de priorité
  const prioriteOptions = [
    { value: "normale", label: "Normale" },
    { value: "urgente", label: "Urgente" },
  ]

  // Fonction pour vérifier si une demande peut être annulée
  const canCancelDemande = (demande) => {
    // Vérifier seulement si le statut permet l'annulation (seulement EN_ATTENTE)
    return demande?.statut === "EN_ATTENTE"
  }

  // Fonction pour calculer la durée en heures
  const calculateHoursDuration = (heureDebut, heureFin) => {
    if (!heureDebut || !heureFin) return null
    const debut = dayjs(heureDebut, "HH:mm")
    const fin = dayjs(heureFin, "HH:mm")
    // Si l'heure de fin est le lendemain (ex: 23:00 à 02:00)
    if (fin.isBefore(debut)) {
      return fin.add(1, "day").diff(debut, "hour", true)
    }
    return fin.diff(debut, "hour", true)
  }

  // Fonction pour télécharger un fichier joint - UTILISE LES VRAIES INFOS DE L'API
  const downloadFile = async (demandeId, demande = null) => {
    // Vérifications de sécurité null
    if (!demandeId) {
      message.error("ID de demande manquant")
      return
    }
    if (!user) {
      message.error("Utilisateur non connecté")
      return
    }
    try {
      message.loading("Téléchargement en cours...", 0.5)
      // Utiliser les informations du fichier depuis la demande si disponibles
      let fileName = "justification"
      let fileType = "application/octet-stream"
      if (demande?.justification) {
        fileName = demande.justification.name || "justification"
        fileType = demande.justification.type || "application/octet-stream"
        console.log("Utilisation des infos de la demande:", {
          name: fileName,
          type: fileType,
        })
      } else {
        // Sinon, utiliser la méthode qui récupère les détails
        const fileData = await demandeService.downloadJustification(demandeId, user)
        fileName = fileData.fileName
        fileType = fileData.contentType
        console.log("Récupération via API:", {
          name: fileName,
          type: fileType,
        })
      }

      // Télécharger le fichier
      const response = await fetch(`${API_BASE_URL}/demandes/${demandeId}/justification`, {
        method: "GET",
        headers: {
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()

      // S'assurer que le fichier a une extension
      if (!fileName.includes(".")) {
        const extension = getExtensionFromContentType(fileType)
        if (extension) {
          fileName += extension
        } else {
          fileName += ".bin" // Extension par défaut
        }
      }

      console.log("Téléchargement final:", {
        fileName,
        fileType,
        blobSize: blob.size,
      })

      // Créer l'URL pour le téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      // Ajouter temporairement le lien au DOM et cliquer dessus
      document.body.appendChild(link)
      link.click()
      // Nettoyer
      link.remove()
      window.URL.revokeObjectURL(url)

      message.success(`Fichier "${fileName}" téléchargé avec succès`)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      let errorMessage = "Erreur lors du téléchargement du fichier"

      if (error.message.includes("404")) {
        errorMessage = "Fichier non trouvé"
      } else if (error.message.includes("403")) {
        errorMessage = "Vous n'avez pas les permissions pour télécharger ce fichier"
      } else if (error.message.includes("500")) {
        errorMessage = "Erreur serveur lors du téléchargement"
      }

      message.error(errorMessage)
    }
  }

  // Fonction pour obtenir l'extension selon le Content-Type
  const getExtensionFromContentType = (contentType) => {
    const typeMap = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/webp": ".webp",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
      "text/plain": ".txt",
      "text/csv": ".csv",
      "application/zip": ".zip",
      "application/x-rar-compressed": ".rar",
      "application/x-7z-compressed": ".7z",
    }
    // Nettoyer le content-type (enlever charset, etc.)
    const cleanContentType = contentType?.split(";")[0]?.trim()?.toLowerCase()
    return typeMap[cleanContentType] || ""
  }

  // Fonction pour vérifier les permissions utilisateur
  const checkUserPermissions = () => {
    if (!user) {
      setErrorDetails({
        type: "error",
        message: "Vous devez être connecté pour soumettre une demande d'absence.",
      })
      setCanSubmit(false)
      return false
    }
    if (!user.id) {
      setErrorDetails({
        type: "error",
        message: "Informations utilisateur incomplètes. Veuillez vous reconnecter.",
      })
      setCanSubmit(false)
      return false
    }
    return true
  }

  // Fonction pour vérifier s'il y a des demandes en cours
  const checkPendingRequests = () => {
    const pendingRequests = existingAbsences.filter(
      (absence) => absence?.statut === "EN_ATTENTE" || absence?.statut === "VALIDEE_RH",
    )
    if (pendingRequests.length > 0) {
      setErrorDetails({
        type: "error",
        message: `Vous avez déjà ${pendingRequests.length} demande(s) d'absence en cours de traitement. Vous ne pouvez pas soumettre une nouvelle demande tant que les précédentes ne sont pas validées ou refusées.`,
      })
      setCanSubmit(false)
      return false
    }
    return true
  }

  // Fonction pour récupérer les absences existantes de l'utilisateur
  const fetchExistingAbsences = async () => {
    if (!user?.id) return
    setLoadingAbsences(true)
    try {
      const absences = await demandeService.getDemandesByUser(user.id, user)
      console.log("Absences récupérées:", absences)
      // Filtrer seulement les demandes d'absence avec vérification de null
      const absenceRequests =
        absences?.filter(
          (demande) =>
            demande?.type === "HEURE" ||
            demande?.type === "DEMI_JOURNEE" ||
            demande?.type === "JOURNEE" ||
            demande?.type === "ABSENCE_MEDICALE" ||
            demande?.type === "ABSENCE_PERSONNELLE" ||
            demande?.type === "ABSENCE_EXCEPTIONNELLE",
        ) || []
      setExistingAbsences(absenceRequests)
    } catch (error) {
      console.error("Erreur lors du chargement des absences:", error)
      if (error?.status === 403) {
        setErrorDetails({
          type: "warning",
          message: "Vous n'avez pas les permissions pour consulter vos demandes.",
        })
      }
    } finally {
      setLoadingAbsences(false)
    }
  }

  // Fonction pour voir les détails d'une demande
  const handleViewDemande = async (demandeId) => {
    if (!demandeId) {
      message.error("ID de demande manquant")
      return
    }
    try {
      const demande = await demandeService.getDemandeDetails(demandeId, user)
      console.log("Détails de la demande:", demande)
      setDetailsModal({ visible: true, demande })
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      message.error("Impossible de charger les détails de la demande")
    }
  }

  // Fonction pour annuler une demande
  const handleCancelDemande = async (demandeId) => {
    if (!demandeId) {
      message.error("ID de demande manquant")
      return
    }
    try {
      setLoadingAbsences(true)
      await demandeService.cancelDemande(demandeId, user)
      message.success("Demande annulée avec succès")
      await fetchExistingAbsences()
    } catch (error) {
      console.error("Erreur:", error)
      if (error?.status === 403) {
        message.error("Vous n'avez pas les permissions pour annuler cette demande")
      } else {
        message.error("Erreur lors de l'annulation de la demande")
      }
    } finally {
      setLoadingAbsences(false)
    }
  }

  // Fonction pour supprimer une demande
  const handleDeleteDemande = async (demandeId) => {
    if (!demandeId) {
      message.error("ID de demande manquant")
      return
    }
    try {
      setLoadingAbsences(true)
      await demandeService.deleteDemande(demandeId, user)
      message.success("Demande supprimée avec succès")
      await fetchExistingAbsences()
    } catch (error) {
      console.error("Erreur:", error)
      if (error?.status === 403) {
        message.error("Vous n'avez pas les permissions pour supprimer cette demande")
      } else {
        message.error("Erreur lors de la suppression de la demande")
      }
    } finally {
      setLoadingAbsences(false)
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    if (checkUserPermissions()) {
      fetchExistingAbsences()
    }
  }, [user?.id])

  // Vérifier les demandes en cours après chargement
  useEffect(() => {
    if (existingAbsences.length >= 0) {
      checkPendingRequests()
    }
  }, [existingAbsences])

  const handleSubmit = async (values) => {
    // Vérification des permissions avant envoi
    if (!checkUserPermissions()) {
      return
    }

    // Vérifier les demandes en cours
    if (!checkPendingRequests()) {
      return
    }

    if (!canSubmit) {
      message.error("Impossible d'envoyer la demande. Vérifiez les erreurs affichées.")
      return
    }

    setLoading(true)
    setErrorDetails(null)

    try {
      // Validation côté client plus stricte
      if (!values.type_absence) {
        throw new Error("Veuillez sélectionner un type d'absence")
      }
      if (!values.date) {
        throw new Error("Veuillez sélectionner une date")
      }
      if (!values.description?.trim()) {
        throw new Error("Veuillez saisir une description")
      }

      // Validation spécifique pour le type HEURE
      if (values.type_absence === "HEURE") {
        if (!values.heure_debut || !values.heure_fin) {
          throw new Error("Les heures de début et fin sont requises pour une absence de quelques heures")
        }
        if (values.heure_debut.isAfter(values.heure_fin)) {
          throw new Error("L'heure de fin doit être postérieure à l'heure de début")
        }
      }

      // Préparer les données selon l'entité DemandeAbsence
      const demandeData = {
        type: values.type_absence,
        dateDebut: values.date.format("YYYY-MM-DD"),
        dateFin: values.date.format("YYYY-MM-DD"),
        commentaire: values.description.trim(),
        estUrgente: values.priorite === "urgente",
      }

      // Ajouter les heures si c'est un type "HEURE"
      if (values.type_absence === "HEURE" && values.heure_debut && values.heure_fin) {
        demandeData.heureDebut = values.heure_debut.format("HH:mm")
        demandeData.heureFin = values.heure_fin.format("HH:mm")
      }

      // Ajouter le fichier de justification si disponible
      if (fileList.length > 0) {
        demandeData.justificationFile = fileList[0]
      }

      console.log("Données préparées côté client:", demandeData)

      await demandeService.createDemandeAbsence(demandeData, user)

      message.success({
        content: "Votre demande d'absence a été envoyée avec succès!",
        duration: 5,
        icon: <ExclamationCircleOutlined style={{ color: "#52c41a" }} />,
      })

      form.resetFields()
      setTypeAbsence("JOURNEE")
      setFileList([])
      setErrorDetails(null)

      // Recharger les données
      fetchExistingAbsences()
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error)
      let errorMessage = "Une erreur inattendue s'est produite"

      if (error?.response) {
        if (error.status === 403) {
          errorMessage = "Vous n'avez pas les permissions nécessaires pour soumettre des demandes d'absence."
        } else if (error.status === 400) {
          errorMessage = "Données de demande invalides. Vérifiez tous les champs."
        }
      } else if (error?.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Erreur de connexion. Vérifiez votre connexion internet et réessayez."
      } else {
        errorMessage = error?.message || errorMessage
      }

      setErrorDetails({
        type: "error",
        message: errorMessage,
      })

      message.error({
        content: errorMessage,
        duration: 8,
      })
    } finally {
      setLoading(false)
    }
  }

  const onTypeAbsenceChange = (value) => {
    setTypeAbsence(value)
    setErrorDetails(null)
    setCanSubmit(true)
    // Reset des champs spécifiques aux heures
    if (value !== "HEURE") {
      form.setFieldsValue({
        heure_debut: undefined,
        heure_fin: undefined,
      })
    }
    // Re-vérifier les demandes en cours
    checkPendingRequests()
  }

  const onDateChange = (date) => {
    setErrorDetails(null)
    setCanSubmit(true)
    if (date && date.isBefore(dayjs().startOf("day"))) {
      setErrorDetails({
        type: "error",
        message: "La date d'absence ne peut pas être dans le passé",
      })
      setCanSubmit(false)
      return
    }

    // Re-vérifier les demandes en cours
    checkPendingRequests()
  }

  const onTimeChange = () => {
    const heureDebut = form.getFieldValue("heure_debut")
    const heureFin = form.getFieldValue("heure_fin")
    if (heureDebut && heureFin && heureDebut.isAfter(heureFin)) {
      setErrorDetails({
        type: "error",
        message: "L'heure de fin doit être postérieure à l'heure de début",
      })
      setCanSubmit(false)
    } else {
      setErrorDetails(null)
      setCanSubmit(true)
      // Re-vérifier les demandes en cours
      checkPendingRequests()
    }
  }

  // Configuration pour l'upload de fichiers (justification optionnelle)
  const uploadProps = {
    name: "file",
    multiple: false,
    fileList: fileList,
    beforeUpload: (file) => {
      console.log("Fichier sélectionné:", file.name, "Type:", file.type)
      // Types de fichiers acceptés : PDF, images, Word
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "image/jpeg" ||
        file.type === "image/jpg" ||
        file.type === "image/png" ||
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

      // Vérification supplémentaire par extension si le type MIME n'est pas détecté
      const fileName = file.name.toLowerCase()
      const hasValidExtension =
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".docx")

      if (!isValidType && !hasValidExtension) {
        setFileError(`Type de fichier non autorisé: "${file.name}". Formats acceptés: PDF, JPG, PNG, DOC, DOCX`)
        return false
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        setFileError(
          `Le fichier "${file.name}" est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Taille maximum: 10MB`,
        )
        return false
      }

      setFileError(null) // Réinitialiser l'erreur si le fichier est valide
      console.log("Fichier validé:", file.name)
      setFileList([file])
      return false
    },
    onRemove: () => {
      console.log("Fichier supprimé")
      setFileList([])
      setFileError(null) // Réinitialiser l'erreur lors de la suppression
    },
  }

  // Fonction pour obtenir les données du calendrier
  const getListData = (value) => {
    const listData = []
    existingAbsences.forEach((absence) => {
      if (absence?.dateDebut && absence?.statut !== "REFUSEE" && absence?.statut !== "ANNULEE") {
        const absenceDate = dayjs(absence.dateDebut)
        if (value.isSame(absenceDate, "day")) {
          let badgeType = "default"
          switch (absence.statut) {
            case "EN_ATTENTE":
              badgeType = "warning"
              break
            case "VALIDEE_RH":
              badgeType = "processing"
              break
            case "VALIDEE_DIRECTION":
              badgeType = "success"
              break
            default:
              badgeType = "default"
          }
          listData.push({ type: badgeType })
        }
      }
    })
    return listData
  }

  // Rendu du calendrier
  const dateCellRender = (value) => {
    const listData = getListData(value)
    return (
      <div style={{ minHeight: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {listData.map((item, index) => (
          <Badge key={index} status={item.type} style={{ margin: "0 2px" }} />
        ))}
      </div>
    )
  }

  // Fonction pour obtenir le statut d'une demande
  const getStatutTag = (statut) => {
    const statusConfig = {
      EN_ATTENTE: { color: "orange", text: "En attente" },
      VALIDEE_RH: { color: "blue", text: "Validé RH" },
      VALIDEE_DIRECTION: { color: "green", text: "Validé" },
      REFUSEE_RH: { color: "red", text: "Refusé" },
      REFUSEE_DIRECTION: { color: "red", text: "Refusé" },
      ANNULEE: { color: "gray", text: "Annulé" },
    }
    const config = statusConfig[statut] || { color: "default", text: statut }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // Fonction pour obtenir le libellé du type d'absence
  const getTypeAbsenceLabel = (type) => {
    const typeLabels = {
      JOURNEE: "Journée complète",
      DEMI_JOURNEE: "Demi-journée",
      HEURE: "Quelques heures",
      ABSENCE_MEDICALE: "Absence médicale",
      ABSENCE_PERSONNELLE: "Absence personnelle",
      ABSENCE_EXCEPTIONNELLE: "Absence exceptionnelle",
    }
    return typeLabels[type] || type
  }

  // Vérifier s'il y a des demandes en cours pour afficher un avertissement
  const pendingRequestsCount = existingAbsences.filter(
    (absence) => absence?.statut === "EN_ATTENTE" || absence?.statut === "VALIDEE_RH",
  ).length

  // Dans le rendu de la liste des demandes, corriger les boutons de téléchargement
  const renderDownloadButton = (demande) => {
    if (!demande?.justification) return null
    return (
      <Button
        key="download"
        type="link"
        icon={<DownloadOutlined />}
        onClick={() => downloadFile(demande.id, demande)} // Passer l'objet demande complet
        disabled={!demande.id}
        title={`Télécharger ${demande.justification.name}`}
      >
        Télécharger
      </Button>
    )
  }

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <Text type="secondary" style={{ color: isLightMode ? "#666" : "#ccc" }}>
          Signalez votre absence en remplissant ce formulaire
        </Text>
      </div>

      {/* Alerte pour les demandes en cours */}
      {pendingRequestsCount > 0 && (
        <Alert
          message={`Attention: Vous avez ${pendingRequestsCount} demande(s) d'absence en cours de traitement`}
          description="Vous ne pouvez pas soumettre une nouvelle demande tant que les précédentes ne sont pas validées ou refusées."
          type="warning"
          showIcon
          style={{ marginBottom: "24px" }}
        />
      )}

      {/* Afficher les détails d'erreur s'il y en a */}
      {errorDetails && (
        <Alert
          message={errorDetails.message}
          type={errorDetails.type}
          showIcon
          style={{ marginBottom: "24px" }}
        />
      )}

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="type_absence"
              label="Type d'absence"
              rules={[{ required: true, message: "Veuillez sélectionner le type" }]}
            >
              <Select
                className={isLightMode ? "select-light" : "select-dark"}
                dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                placeholder="Sélectionnez le type d'absence"
                size="large"
                options={typesAbsence}
                onChange={onTypeAbsenceChange}
                disabled={pendingRequestsCount > 0}
              />
            </Form.Item>

            <Form.Item
              name="date"
              label="Date d'absence"
              rules={[{ required: true, message: "Veuillez sélectionner la date" }]}
            >
              <DatePicker
                style={{
                  width: "100%",
                  backgroundColor: isLightMode ? "#f5f5f5" : "#2c3e50",
                  color: isLightMode ? "#000" : "#fff",
                }}
                size="large"
                format="DD/MM/YYYY"
                placeholder="Sélectionnez la date"
                onChange={onDateChange}
                disabledDate={(current) => current && current < dayjs().add(7, "days").startOf("day")}
                disabled={pendingRequestsCount > 0}
              />
            </Form.Item>

            {/* Champs d'heure pour le type "HEURE" */}
            {typeAbsence === "HEURE" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="heure_debut"
                    label="Heure de début"
                    rules={[{ required: true, message: "Heure de début requise" }]}
                  >
                    <TimePicker
                      style={{
                        width: "100%",
                        backgroundColor: isLightMode ? "#f5f5f5" : "#2c3e50",
                        color: isLightMode ? "#000" : "#fff",
                      }}
                      size="large"
                      format="HH:mm"
                      placeholder="Début"
                      onChange={onTimeChange}
                      disabled={pendingRequestsCount > 0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="heure_fin"
                    label="Heure de fin"
                    rules={[{ required: true, message: "Heure de fin requise" }]}
                  >
                    <TimePicker
                      style={{
                        width: "100%",
                        backgroundColor: isLightMode ? "#f5f5f5" : "#2c3e50",
                        color: isLightMode ? "#000" : "#fff",
                      }}
                      size="large"
                      format="HH:mm"
                      placeholder="Fin"
                      onChange={onTimeChange}
                      disabled={pendingRequestsCount > 0}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Form.Item
              name="description"
              label="Description détaillée"
              rules={[{ required: true, message: "Veuillez décrire votre absence" }]}
            >
              <TextArea
                rows={4}
                placeholder="Décrivez brièvement la raison de votre absence..."
                maxLength={500}
                disabled={pendingRequestsCount > 0}
                style={{ backgroundColor: isLightMode ? "#f5f5f5" : "#2c3e50" }}
              />
            </Form.Item>

            {/* Justification optionnelle */}
            <Form.Item label="Justification (optionnelle)">
              <Dragger {...uploadProps} disabled={pendingRequestsCount > 0}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Cliquez ou glissez votre justification ici</p>
                <p className="ant-upload-hint">
                  <strong>Formats acceptés:</strong> PDF, JPG, PNG, DOC, DOCX
                  <br />
                  <strong>Taille maximum:</strong> 10MB - <em>Facultatif</em>
                </p>
              </Dragger>
              {fileList.length > 0 && (
                <div style={{ marginTop: "8px", color: "#52c41a" }}>✓ Fichier sélectionné: {fileList[0]?.name}</div>
              )}
              {fileError && <div style={{ color: "#ff4d4f", marginTop: 8 }}>{fileError}</div>}
            </Form.Item>

            <Form.Item name="priorite" label="Niveau de priorité">
              <Select
                className={isLightMode ? "select-light" : "select-dark"}
                dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                placeholder="Sélectionnez la priorité"
                size="large"
                defaultValue="normale"
                options={prioriteOptions}
                disabled={pendingRequestsCount > 0}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SendOutlined />}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                block
                loading={loading}
                disabled={!canSubmit || (!!errorDetails && errorDetails.type === "error") || pendingRequestsCount > 0}
              >
                {loading ? "Envoi en cours..." : "Envoyer la demande"}
              </Button>
            </Form.Item>
          </Form>
        </Col>

        <Col xs={24} lg={12}>
          <div>
            <Title level={4} style={{ marginBottom: "16px", color: isLightMode ? "#333" : "#fff" }}>
              Calendrier des absences
            </Title>
            <div className={`calendar-container ${isLightMode ? 'calendar-light' : 'calendar-dark'}`}>
              <Calendar
                fullscreen={false}
                dateCellRender={dateCellRender}
              />
            </div>
            {/* Légende en bas du calendrier */}
            <div className={`calendar-legend ${isLightMode ? 'calendar-light' : 'calendar-dark'}`}>
              <Text strong className="calendar-legend-title">
                Légende :
              </Text>
              <div className="calendar-legend-items">
                <div className="calendar-legend-item">
                  <Badge status="warning" />
                  <Text type="secondary" className="calendar-legend-text">
                    En attente
                  </Text>
                </div>
                <div className="calendar-legend-item">
                  <Badge status="processing" />
                  <Text type="secondary" className="calendar-legend-text">
                    Validé RH
                  </Text>
                </div>
                <div className="calendar-legend-item">
                  <Badge status="success" />
                  <Text type="secondary" className="calendar-legend-text">
                    Validé
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Section des demandes existantes avec actions */}
      <Row style={{ marginTop: "32px" }}>
        <Col span={24}>
          <Card
            className={isLightMode ? "card-light" : "card-dark"}
            title="Mes demandes d'absence"
            extra={
              <Button onClick={fetchExistingAbsences} loading={loadingAbsences} icon={<ReloadOutlined />}>
                Actualiser
              </Button>
            }
          >
            <List
              dataSource={existingAbsences}
              loading={loadingAbsences}
              locale={{ emptyText: "Aucune demande d'absence" }}
              renderItem={(demande) => (
                <List.Item
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDemande(demande?.id)}
                      disabled={!demande?.id}
                    >
                      Voir
                    </Button>,
                    // Bouton de téléchargement corrigé avec les vraies infos
                    ...(demande?.justification ? [renderDownloadButton(demande)] : []),
                    ...(canCancelDemande(demande)
                      ? [
                          <Popconfirm
                            key="cancel"
                            title="Êtes-vous sûr de vouloir annuler cette demande ?"
                            onConfirm={() => handleCancelDemande(demande?.id)}
                            okText="Oui"
                            cancelText="Non"
                            disabled={!demande?.id}
                          >
                            <Button type="link" icon={<StopOutlined />} danger disabled={!demande?.id}>
                              Annuler
                            </Button>
                          </Popconfirm>,
                        ]
                      : []),
                    ...(demande?.statut === "REFUSEE" || demande?.statut === "ANNULEE"
                      ? [
                          <Popconfirm
                            key="delete"
                            title="Êtes-vous sûr de vouloir supprimer cette demande ?"
                            onConfirm={() => handleDeleteDemande(demande?.id)}
                            okText="Oui"
                            cancelText="Non"
                            disabled={!demande?.id}
                          >
                            <Button type="link" icon={<DeleteOutlined />} danger disabled={!demande?.id}>
                              Supprimer
                            </Button>
                          </Popconfirm>,
                        ]
                      : []),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{getTypeAbsenceLabel(demande?.type) || "Absence"}</Text>
                        {getStatutTag(demande?.statut)}
                        {demande?.estUrgente && <Tag color="red">Urgente</Tag>}
                        {/* Afficher le nom du fichier s'il existe */}
                        {demande?.justification && (
                          <Tag color="blue" icon={<DownloadOutlined />}>
                            {demande.justification.name}
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          Le {demande?.dateDebut ? dayjs(demande.dateDebut).format("DD/MM/YYYY") : "Date inconnue"}
                        </Text>
                        {demande?.type === "HEURE" && demande?.heureDebut && demande?.heureFin && (
                          <>
                            <br />
                            <Text type="secondary">
                              De {demande.heureDebut} à {demande.heureFin} (
                              {calculateHoursDuration(demande.heureDebut, demande.heureFin)?.toFixed(1)} heures)
                            </Text>
                          </>
                        )}
                        <br />
                        <Text type="secondary">
                          Demandé le{" "}
                          {demande?.dateDemande ? dayjs(demande.dateDemande).format("DD/MM/YYYY") : "Date inconnue"}
                        </Text>
                        {demande?.commentaire && (
                          <>
                            <br />
                            <Text type="secondary">Description: {demande.commentaire}</Text>
                          </>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal pour voir les détails d'une demande */}
      <Modal
        title="Détails de la demande d'absence"
        open={detailsModal.visible}
        onCancel={() => setDetailsModal({ visible: false, demande: null })}
        className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
        footer={[
          <Button key="close" onClick={() => setDetailsModal({ visible: false, demande: null })}>
            Fermer
          </Button>,
        ]}
        width={600}
      >
        {detailsModal.demande && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Type d'absence">
              {getTypeAbsenceLabel(detailsModal.demande.type)}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">{getStatutTag(detailsModal.demande.statut)}</Descriptions.Item>
            <Descriptions.Item label="Date">
              {detailsModal.demande.dateDebut
                ? dayjs(detailsModal.demande.dateDebut).format("DD/MM/YYYY")
                : "Date inconnue"}
            </Descriptions.Item>
            {detailsModal.demande.type === "HEURE" &&
              detailsModal.demande.heureDebut &&
              detailsModal.demande.heureFin && (
                <>
                  <Descriptions.Item label="Horaires">
                    De {detailsModal.demande.heureDebut} à {detailsModal.demande.heureFin}
                  </Descriptions.Item>
                  <Descriptions.Item label="Durée">
                    {calculateHoursDuration(detailsModal.demande.heureDebut, detailsModal.demande.heureFin)?.toFixed(1)}{" "}
                    heures
                  </Descriptions.Item>
                </>
              )}
            <Descriptions.Item label="Date de demande">
              {detailsModal.demande.dateDemande
                ? dayjs(detailsModal.demande.dateDemande).format("DD/MM/YYYY")
                : "Date inconnue"}
            </Descriptions.Item>
            <Descriptions.Item label="Priorité">
              {detailsModal.demande.estUrgente ? <Tag color="red">Urgente</Tag> : <Tag color="green">Normale</Tag>}
            </Descriptions.Item>
            {detailsModal.demande.commentaire && (
              <Descriptions.Item label="Description">{detailsModal.demande.commentaire}</Descriptions.Item>
            )}
            {detailsModal.demande.justification && (
              <Descriptions.Item label="Justification">
                <Space>
                  <Text type="secondary">
                    Fichier: {detailsModal.demande.justification.name} ({detailsModal.demande.justification.type})
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadFile(detailsModal.demande.id, detailsModal.demande)}
                    disabled={!detailsModal.demande.id}
                  >
                    Télécharger
                  </Button>
                </Space>
              </Descriptions.Item>
            )}
            {detailsModal.demande.commentaireRH && (
              <Descriptions.Item label="Commentaire RH">{detailsModal.demande.commentaireRH}</Descriptions.Item>
            )}
            {detailsModal.demande.commentaireDirection && (
              <Descriptions.Item label="Commentaire Direction">
                {detailsModal.demande.commentaireDirection}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
