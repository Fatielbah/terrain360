
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
  Upload,
  Card,
  Statistic,
  List,
  Popconfirm,
  Tag,
  Space,
  Modal,
  Descriptions,
  Image,
} from "antd"
import {
  SendOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  DeleteOutlined,
  StopOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PictureOutlined,
  FileWordOutlined,
  FilePdfOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { demandeService } from "../../services/demandeService"
import "./calendar.css" // Import du fichier CSS du calendrier

const API_BASE_URL = "http://localhost:8081/api"
const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Dragger } = Upload

export default function DemandeCongeForm() {
  const [form] = Form.useForm()
  const [selectedDates, setSelectedDates] = useState([])
  const [loading, setLoading] = useState(false)
  const [existingConges, setExistingConges] = useState([])
  const [loadingConges, setLoadingConges] = useState(false)
  const [soldeConge, setSoldeConge] = useState(null)
  const [loadingSolde, setLoadingSolde] = useState(false)
  const [selectedTypeConge, setSelectedTypeConge] = useState(null)
  const [fileList, setFileList] = useState([])
  const [detailsModal, setDetailsModal] = useState({ visible: false, demande: null })
  const [filePreview, setFilePreview] = useState(null)
  const [fileError, setFileError] = useState(null)
  const { isLightMode } = useTheme()
  const { user } = useAuth()

  const typesConge = [
    { value: "CONGE_ANNUEL", label: "Congés annuels" },
    { value: "CONGE_EXCEPTIONNEL", label: "Congé exceptionnel" },
    { value: "CONGE_MALADIE", label: "Congé maladie" },
    { value: "CONGE_MATERNITE_PATERNITE", label: "Congé maternité/paternité" },
    { value: "CONGE_SANS_SOLDE", label: "Congé sans solde" },
  ]

  // Types de fichiers acceptés pour le certificat médical
  const acceptedFileTypes = {
    pdf: ["application/pdf"],
    word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp"],
  }

  // Fonction pour vérifier si une demande peut être annulée - SEULEMENT STATUT EN_ATTENTE
  const canCancelDemande = (demande) => {
    // Vérifier seulement si le statut permet l'annulation (seulement EN_ATTENTE)
    return demande?.statut === "EN_ATTENTE"
  }

  // Fonction pour détecter le type de fichier
  const getFileType = (file) => {
    if (acceptedFileTypes.pdf.includes(file.type)) return "pdf"
    if (acceptedFileTypes.word.includes(file.type)) return "word"
    if (acceptedFileTypes.image.includes(file.type)) return "image"
    return null
  }

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "pdf":
        return <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: "24px" }} />
      case "word":
        return <FileWordOutlined style={{ color: "#1890ff", fontSize: "24px" }} />
      case "image":
        return <PictureOutlined style={{ color: "#52c41a", fontSize: "24px" }} />
      default:
        return <InboxOutlined style={{ fontSize: "24px" }} />
    }
  }

  // Fonction pour télécharger un fichier joint
  const downloadFile = async (demandeId, demande = null) => {
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
      let fileName = "justification"
      let fileType = "application/octet-stream"

      if (demande?.justification) {
        fileName = demande.justification.name || "justification"
        fileType = demande.justification.type || "application/octet-stream"
      } else {
        const fileData = await demandeService.downloadJustification(demandeId, user)
        fileName = fileData.fileName
        fileType = fileData.contentType
      }

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

      if (!fileName.includes(".")) {
        const extension = getExtensionFromContentType(fileType)
        if (extension) {
          fileName += extension
        } else {
          fileName += ".bin"
        }
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
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
      "text/plain": ".txt",
    }
    const cleanContentType = contentType?.split(";")[0]?.trim()?.toLowerCase()
    return typeMap[cleanContentType] || ""
  }

  // Fonction pour récupérer le solde de congé
  const fetchSoldeConge = async () => {
    if (!user?.id) return
    setLoadingSolde(true)
    try {
      const solde = await demandeService.getSoldeConge(user)
      console.log("Solde récupéré:", solde)
      if (typeof solde === "number") {
        setSoldeConge({
          joursRestants: solde,
          joursAcquis: null,
          joursConsommes: null,
        })
      } else {
        setSoldeConge(solde)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du solde:", error)
    } finally {
      setLoadingSolde(false)
    }
  }

  // Fonction pour récupérer les congés existants
  const fetchExistingConges = async () => {
    if (!user?.id) return
    setLoadingConges(true)
    try {
      const conges = await demandeService.getCongesByUser(user.id, user)
      console.log("Congés récupérés:", conges)
      setExistingConges(conges)
    } catch (error) {
      console.error("Erreur lors du chargement des congés:", error)
    } finally {
      setLoadingConges(false)
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
      setLoadingConges(true)
      await demandeService.cancelDemande(demandeId, user)
      message.success("Demande annulée avec succès")
      await fetchExistingConges()
      await fetchSoldeConge()
    } catch (error) {
      console.error("Erreur:", error)
      if (error?.status === 403) {
        message.error("Vous n'avez pas les permissions pour annuler cette demande")
      } else {
        message.error("Erreur lors de l'annulation de la demande")
      }
    } finally {
      setLoadingConges(false)
    }
  }

  // Fonction pour supprimer une demande
  const handleDeleteDemande = async (demandeId) => {
    if (!demandeId) {
      message.error("ID de demande manquant")
      return
    }
    try {
      setLoadingConges(true)
      await demandeService.deleteDemande(demandeId, user)
      message.success("Demande supprimée avec succès")
      await fetchExistingConges()
      await fetchSoldeConge()
    } catch (error) {
      console.error("Erreur:", error)
      if (error?.status === 403) {
        message.error("Vous n'avez pas les permissions pour supprimer cette demande")
      } else {
        message.error("Erreur lors de la suppression de la demande")
      }
    } finally {
      setLoadingConges(false)
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    if (user?.id) {
      fetchExistingConges()
      fetchSoldeConge()
    }
  }, [user?.id])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      

      if (values.type_conge === "CONGE_MALADIE" && fileList.length === 0) {
        throw new Error("Un certificat médical est requis pour un congé maladie")
      }

      console.log("=== VÉRIFICATION FICHIER ===")
      console.log("Type de congé:", values.type_conge)
      console.log("FileList length:", fileList.length)
      console.log("FileList:", fileList)

      if (values.type_conge === "CONGE_MALADIE") {
        if (fileList.length === 0 || !fileList[0]) {
          throw new Error("Le fichier justificatif est requis pour un congé maladie")
        }
        console.log("Fichier présent:", fileList[0].name, fileList[0].size, "bytes")
      }

      const demandeData = {
        ...values,
        justification: fileList.length > 0 ? fileList[0] : null,
      }

      console.log("Données à envoyer:", demandeData)

      await demandeService.createDemandeConge(demandeData, user)

      message.success({
        content: "Votre demande de congé a été envoyée avec succès!",
        duration: 5,
        icon: <ExclamationCircleOutlined style={{ color: "#52c41a" }} />,
      })

      form.resetFields()
      setSelectedDates([])
      setFileList([])
      setFilePreview(null)
      setSelectedTypeConge(null)
      fetchExistingConges()
      fetchSoldeConge()
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error)
      let errorMessage = error?.message || "Une erreur inattendue s'est produite"

      // Gestion spécifique des erreurs backend
      if (error?.response) {
        try {
          const errorData = await error.response.json()
          if (errorData.code === "JUSTIFICATIF_MANQUANT") {
            errorMessage = "Un certificat médical est requis pour un congé maladie. Veuillez joindre un fichier."
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          console.error("Erreur parsing response:", parseError)
        }
      }

      message.error({
        content: errorMessage,
        duration: 8,
      })
    } finally {
      setLoading(false)
    }
  }

  const onDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setSelectedDates(dates)
      form.setFieldsValue({ dates: dates })

      let nbJours = dates[1].diff(dates[0], "days") + 1

      if (selectedTypeConge === "CONGE_MATERNITE_PATERNITE") {
        if (user?.genre === "FEMME") {
          nbJours = 98
          const newEndDate = dates[0].add(97, "days")
          setSelectedDates([dates[0], newEndDate])
          form.setFieldsValue({
            dates: [dates[0], newEndDate],
            nb_jours: 98,
          })
          message.info("Durée automatiquement définie à 98 jours pour le congé maternité")
          return
        } else if (user?.genre === "HOMME") {
          nbJours = 3
          const newEndDate = dates[0].add(2, "days")
          setSelectedDates([dates[0], newEndDate])
          form.setFieldsValue({
            dates: [dates[0], newEndDate],
            nb_jours: 3,
          })
          message.info("Durée automatiquement définie à 3 jours pour le congé paternité")
          return
        }
      }

      form.setFieldsValue({ nb_jours: nbJours })
    }
  }

  const onTypeCongeChange = (value) => {
    setSelectedTypeConge(value)
    if (value !== "CONGE_MALADIE") {
      setFileList([])
      setFilePreview(null)
      setFileError(null)
    }
    if (value === "CONGE_MATERNITE_PATERNITE") {
      form.setFieldsValue({ dates: null, nb_jours: null })
      setSelectedDates([])
    }

    const dates = form.getFieldValue("dates")
    if (dates && dates.length === 2) {
      onDateChange(dates)
    }
  }

  // Validation personnalisée pour les dates - SANS vérification des 7 jours
const validateDates = (_, value) => {
  if (!value || value.length !== 2) {
    return Promise.reject(new Error("Veuillez sélectionner les dates"))
  }
  if (value[0].isAfter(value[1])) {
    return Promise.reject(new Error("La date de fin doit être postérieure à la date de début"))
  }
  if (value[0].isBefore(dayjs().startOf("day"))) {
    return Promise.reject(new Error("La date de début ne peut pas être dans le passé"))
  }

  const nbJours = value[1].diff(value[0], "days") + 1

  if (selectedTypeConge === "CONGE_EXCEPTIONNEL" && nbJours > 4) {
    return Promise.reject(new Error("Le congé exceptionnel est limité à 4 jours maximum"))
  }

  if (
    selectedTypeConge === "CONGE_ANNUEL" &&
    soldeConge &&
    nbJours > (typeof soldeConge === "number" ? soldeConge : soldeConge?.joursRestants)
  ) {
    const joursDisponibles = typeof soldeConge === "number" ? soldeConge : soldeConge?.joursRestants
    return Promise.reject(
      new Error(`Solde insuffisant. Vous avez ${joursDisponibles} jours disponibles mais demandez ${nbJours} jours.`),
    )
  }

  return Promise.resolve()
}

  // Validation personnalisée pour le fichier
  const validateFile = () => {
    if (selectedTypeConge === "CONGE_MALADIE" && fileList.length === 0) {
      return Promise.reject(new Error("Un certificat médical est requis"))
    }
    return Promise.resolve()
  }

  // Configuration pour l'upload de fichiers - accepte PDF, Word et Images
  const uploadProps = {
    name: "file",
    multiple: false,
    fileList: fileList,
    beforeUpload: (file) => {
      // Vérifier si le type de fichier est accepté
      const fileType = getFileType(file)
      if (!fileType) {
        setFileError("Type de fichier non supporté! Veuillez sélectionner un fichier PDF, Word ou Image.")
        return false
      }

      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error("Le fichier doit faire moins de 5MB!")
        return false
      }

      // Effacer l'erreur précédente
      setFileError(null)

      // Créer un aperçu pour les images
      if (fileType === "image") {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }

      setFileList([file])
      message.success(`Fichier ${fileType.toUpperCase()} sélectionné avec succès!`)

      // Déclencher la validation du champ
      form.validateFields(["certificat"])
      return false
    },
    onRemove: () => {
      setFileList([])
      setFilePreview(null)
      setFileError(null)
      // Déclencher la validation du champ
      form.validateFields(["certificat"])
    },
  }

  // Fonction pour obtenir les données du calendrier
  const getListData = (value) => {
    const listData = []
    if (selectedDates.length === 2) {
      const startDate = selectedDates[0]
      const endDate = selectedDates[1]
      if (
        value.isSame(startDate, "day") ||
        value.isSame(endDate, "day") ||
        (value.isAfter(startDate, "day") && value.isBefore(endDate, "day"))
      ) {
        listData.push({ type: "processing" })
      }
    }

    existingConges.forEach((conge) => {
      if (conge?.dateDebut && conge?.dateFin && conge?.statut !== "REFUSEE" && conge?.statut !== "ANNULEE") {
        const startDate = dayjs(conge.dateDebut)
        const endDate = dayjs(conge.dateFin)
        if (
          value.isSame(startDate, "day") ||
          value.isSame(endDate, "day") ||
          (value.isAfter(startDate, "day") && value.isBefore(endDate, "day"))
        ) {
          let badgeType = "default"
          switch (conge.statut) {
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

  const getTypeCongeLabel = (type) => {
    const typeLabels = {
      CONGE_ANNUEL: "Congés annuels",
      CONGE_EXCEPTIONNEL: "Congé exceptionnel",
      CONGE_MALADIE: "Congé maladie",
      CONGE_MATERNITE_PATERNITE: "Congé maternité/paternité",
      CONGE_SANS_SOLDE: "Congé sans solde",
    }
    return typeLabels[type] || type
  }

  const pendingRequestsCount = existingConges.filter(
    (conge) => conge?.statut === "EN_ATTENTE" || conge?.statut === "VALIDEE_RH",
  ).length

  const renderDownloadButton = (demande) => {
    if (!demande?.justification) return null
    return (
      <Button
        key="download"
        type="link"
        icon={<DownloadOutlined />}
        onClick={() => downloadFile(demande.id, demande)}
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
          Remplissez le formulaire ci-dessous pour soumettre votre demande de congé
        </Text>
      </div>

      {/* Alerte pour les demandes en cours */}
      {pendingRequestsCount > 0 && (
        <Alert
          message="Attention"
          description={`Vous avez ${pendingRequestsCount} demande(s) en cours de traitement. Vous ne pouvez pas soumettre une nouvelle demande tant que les précédentes ne sont pas finalisées.`}
          type="warning"
          showIcon
          style={{ marginBottom: "24px" }}
        />
      )}

      {/* REMETTRE l'alerte pour le délai de 7 jours */}
      <Alert
        message="Information importante"
        description="Les demandes de congé doivent être faites au moins 7 jours avant le début du congé."
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      {selectedTypeConge === "CONGE_ANNUEL" && (
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col span={24}>
            <Card className={isLightMode ? "card-light" : "card-dark"}>
              <Statistic
                title="Solde de congés annuels disponible"
                value={
                  loadingSolde ? "..." : typeof soldeConge === "number" ? soldeConge : soldeConge?.joursRestants || 0
                }
                suffix="jours"
                valueStyle={{
                  color: (() => {
                    const jours = typeof soldeConge === "number" ? soldeConge : soldeConge?.joursRestants || 0
                    return jours > 10 ? "#3f8600" : jours > 5 ? "#faad14" : "#cf1322"
                  })(),
                }}
              />
              {soldeConge && typeof soldeConge === "object" && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  <Text type="secondary">
                    Total acquis: {soldeConge.joursAcquis || 0} jours | Consommés: {soldeConge.joursConsommes || 0}{" "}
                    jours
                  </Text>
                </div>
              )}
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={fetchSoldeConge}
                loading={loadingSolde}
                style={{ padding: 0, marginTop: "8px" }}
              >
                Actualiser le solde
              </Button>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="type_conge"
              label="Type de congé"
              rules={[{ required: true, message: "Veuillez sélectionner le type de congé" }]}
            >
              <Select
                className={isLightMode ? "select-light" : "select-dark"}
                dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                placeholder="Sélectionnez le type de congé"
                size="large"
                options={typesConge}
                onChange={onTypeCongeChange}
                disabled={pendingRequestsCount > 0}
              />
            </Form.Item>

            {selectedTypeConge === "CONGE_EXCEPTIONNEL" && (
              <Alert
                message="Congé exceptionnel limité à 4 jours maximum"
                type="info"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            {selectedTypeConge === "CONGE_MATERNITE_PATERNITE" && (
              <>
                <Alert
                  message={`Durée automatique: ${user?.genre === "FEMME" ? "98 jours (maternité)" : user?.genre === "HOMME" ? "3 jours (paternité)" : "98 jours (maternité) ou 3 jours (paternité)"}`}
                  type="info"
                  showIcon
                  style={{ marginBottom: "16px" }}
                />
              </>
            )}

            
          <Form.Item
            name="dates"
            label="Période de congé"
            rules={[{ validator: validateDates }]}
            validateTrigger={["onChange", "onBlur"]}
          >
            <RangePicker
              size="large"
              style={{ 
                width: "100%",
                backgroundColor: isLightMode ? "#f5f5f5" : "#2c3e50",
                color: isLightMode ? "#000" : "#fff"
              }}
              format="DD/MM/YYYY"
              placeholder={["Date de début", "Date de fin"]}
              onChange={onDateChange}
              disabledDate={(current) => current && current < dayjs().add(7, "days").startOf("day")}
              disabled={pendingRequestsCount > 0}
            />
          </Form.Item>
            <Form.Item
              name="nb_jours"
              label="Nombre de jours"
              rules={[{ required: true, message: "Veuillez indiquer le nombre de jours" }]}
            >
              <Input size="large" type="number" placeholder="Nombre de jours de congé" min={1} readOnly 
              style={{backgroundColor: isLightMode? "white" : "#2c3e50"}}/>
            </Form.Item>

            {/* Upload de certificat médical simplifié */}
            {selectedTypeConge === "CONGE_MALADIE" && (
              <Form.Item
                name="certificat"
                label="Certificat médical (obligatoire)"
                rules={[{ validator: validateFile }]}
                validateTrigger={["onChange"]}
              >
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Cliquez ou glissez votre certificat médical ici</p>
                  <p className="ant-upload-hint">
                    Formats acceptés: PDF, Word (.doc, .docx) ou Images (JPG, PNG, GIF) - Max 5MB
                  </p>
                </Dragger>

                {/* Aperçu de l'image */}
                {filePreview && (
                  <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <Text strong>Aperçu de l'image :</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Image
                        src={filePreview || "/placeholder.svg"}
                        alt="Aperçu du certificat médical"
                        style={{ maxWidth: "300px", maxHeight: "200px" }}
                        preview={{
                          mask: <div>Cliquer pour agrandir</div>,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Informations sur le fichier uploadé */}
                {fileList.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <Alert
                      message={
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {getFileIcon(getFileType(fileList[0]))}
                          <span>Fichier sélectionné: {fileList[0].name}</span>
                        </div>
                      }
                      description={`Taille: ${(fileList[0].size / 1024 / 1024).toFixed(2)} MB | Type: ${getFileType(fileList[0])?.toUpperCase()}`}
                      type="success"
                      showIcon
                      closable
                      onClose={() => {
                        setFileList([])
                        setFilePreview(null)
                        form.validateFields(["certificat"])
                      }}
                    />
                  </div>
                )}

                {fileError && (
                  <Alert
                    message={fileError}
                    type="error"
                    showIcon
                    style={{ marginTop: "16px" }}
                    closable
                    onClose={() => setFileError(null)}
                  />
                )}
              </Form.Item>
            )}

            <Form.Item name="motif" label="Motif (optionnel)">
              <TextArea
                style={{ backgroundColor: isLightMode ? "#f5f5f5" : "#2c3e50" }}
                rows={4}
                placeholder="Précisez le motif de votre demande si nécessaire..."
                maxLength={500}
                disabled={pendingRequestsCount > 0}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SendOutlined />}
                style={{ backgroundColor: "#764ba2", borderColor: "#764ba2" }}
                block
                loading={loading}
                disabled={pendingRequestsCount > 0}
              >
                {loading ? "Envoi en cours..." : "Envoyer la demande"}
              </Button>
            </Form.Item>
          </Form>
        </Col>

        <Col xs={24} lg={12}>
          <div>
            <Title level={4} style={{ marginBottom: "16px", color: isLightMode ? "#333" : "#fff" }}>
              Calendrier des congés
            </Title>
            <div className={`calendar-container ${isLightMode ? 'calendar-light' : 'calendar-dark'}`}>
              <Calendar 
                fullscreen={false} 
                dateCellRender={dateCellRender}
              />
            </div>
            <div className={`calendar-legend ${isLightMode ? 'calendar-light' : 'calendar-dark'}`}>
              <Text strong className="calendar-legend-title">
                Légende :
              </Text>
              <div className="calendar-legend-items">
                <div className="calendar-legend-item">
                  <Badge status="processing" />
                  <Text type="secondary" className="calendar-legend-text">
                    Congé demandé
                  </Text>
                </div>
                <div className="calendar-legend-item">
                  <Badge status="warning" />
                  <Text type="secondary" className="calendar-legend-text">
                    En attente
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

      {/* Section des demandes existantes */}
      <Row style={{ marginTop: "32px" }}>
        <Col span={24}>
          <Card
            title="Mes demandes de congé"
            className={isLightMode ? "card-light" : "card-dark"}
            extra={
              <Button onClick={fetchExistingConges} loading={loadingConges} icon={<ReloadOutlined />}>
                Actualiser
              </Button>
            }
          >
            <List
              dataSource={existingConges}
              loading={loadingConges}
              locale={{ emptyText: "Aucune demande de congé" }}
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
                        <Text strong>{getTypeCongeLabel(demande?.type) || "Congé"}</Text>
                        {getStatutTag(demande?.statut)}
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
                          Du {demande?.dateDebut ? dayjs(demande.dateDebut).format("DD/MM/YYYY") : "Date inconnue"} au{" "}
                          {demande?.dateFin ? dayjs(demande.dateFin).format("DD/MM/YYYY") : "Date inconnue"}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Demandé le{" "}
                          {demande?.dateDemande ? dayjs(demande.dateDemande).format("DD/MM/YYYY") : "Date inconnue"}
                        </Text>
                        {demande?.commentaire && (
                          <>
                            <br />
                            <Text type="secondary">Motif: {demande.commentaire}</Text>
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
        title="Détails de la demande"
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
            <Descriptions.Item label="Type de congé">{getTypeCongeLabel(detailsModal.demande.type)}</Descriptions.Item>
            <Descriptions.Item label="Statut">{getStatutTag(detailsModal.demande.statut)}</Descriptions.Item>
            <Descriptions.Item label="Date de début">
              {detailsModal.demande.dateDebut
                ? dayjs(detailsModal.demande.dateDebut).format("DD/MM/YYYY")
                : "Date inconnue"}
            </Descriptions.Item>
            <Descriptions.Item label="Date de fin">
              {detailsModal.demande.dateFin
                ? dayjs(detailsModal.demande.dateFin).format("DD/MM/YYYY")
                : "Date inconnue"}
            </Descriptions.Item>
            <Descriptions.Item label="Nombre de jours">
              {detailsModal.demande.dateDebut && detailsModal.demande.dateFin
                ? dayjs(detailsModal.demande.dateFin).diff(dayjs(detailsModal.demande.dateDebut), "days") + 1
                : "Inconnu"}{" "}
              jours
            </Descriptions.Item>
            <Descriptions.Item label="Date de demande">
              {detailsModal.demande.dateDemande
                ? dayjs(detailsModal.demande.dateDemande).format("DD/MM/YYYY")
                : "Date inconnue"}
            </Descriptions.Item>
            {detailsModal.demande.commentaire && (
              <Descriptions.Item label="Motif">{detailsModal.demande.commentaire}</Descriptions.Item>
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
