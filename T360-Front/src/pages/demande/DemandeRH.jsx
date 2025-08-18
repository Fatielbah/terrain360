

import { useState, useEffect } from "react"
import {
  Layout,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  DatePicker,
  Modal,
  Form,
  Input,
  message,
  Avatar,
  Spin,
  Alert,
  Descriptions,
  Tabs,
  Timeline,
  Tooltip,
  Badge,
} from "antd"
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SendOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  HistoryOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  PictureOutlined,
  InboxOutlined,
} from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { demandeService } from "../../services/demandeService"
import dayjs from "dayjs"
import { UserService } from "../../services/user-service"

const API_BASE_URL = "http://localhost:8081/api" // Declare API_BASE_URL here
const { Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input
const { TabPane } = Tabs

// Déclaration des fonctions manquantes
const getTypeLabel = (demande) => demande.type || "Type non défini"
const formatDateDemandee = (demande) =>
  demande.dateDemande ? dayjs(demande.dateDemande).format("DD/MM/YYYY") : "Date non définie"
const getStatutLabel = (statut) => statut || "Statut non défini"
const getAvatarFromName = (nom) => nom.charAt(0).toUpperCase()

// Modifier la fonction getTypeCongeLabel pour gérer le cas AUTRE avec autretype
// Fonction pour obtenir le label du type de congé
const getTypeCongeLabel = (type, autretype = null) => {
  const typeLabels = {
    CONGE_ANNUEL: "Congés annuels",
    CONGE_EXCEPTIONNEL: "Congé exceptionnel",
    CONGE_MALADIE: "Congé maladie",
    CONGE_MATERNITE_PATERNITE: "Congé maternité/paternité",
    CONGE_SANS_SOLDE: "Congé sans solde",
    ABSENCE_PERSONNELLE: "Absence personnelle",
    ABSENCE_MEDICALE: "Absence médicale",
    ABSENCE_EXCEPTIONNELLE: "Absence exceptionnelle",
    ATTESTATION_TRAVAIL: "Attestation de travail",
    ATTESTATION_SALAIRE: "Attestation de salaire",
    AUTRE: autretype || "Autre type",
  }
  return typeLabels[type] || type
}

export default function RHDashboard() {
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [actionType, setActionType] = useState("")
  const [form] = Form.useForm()
  const { isLightMode } = useTheme()
  const { user, isAuthenticated } = useAuth()

  // États séparés pour chaque type de demande
  const [demandesConge, setDemandesConge] = useState([])
  const [demandesAbsence, setDemandesAbsence] = useState([])
  const [demandesDocument, setDemandesDocument] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("conge")

  // Vérifier les permissions RH - SEULEMENT pour RH
  const isRH = user?.role === "RH"

  // Charger les demandes au montage du composant
  useEffect(() => {
    if (isAuthenticated && isRH) {
      loadAllDemandes()
    }
  }, [isAuthenticated, isRH])

  const loadAllDemandes = async () => {
    setLoading(true)
    try {
      // Charger tous les types de demandes en parallèle
      const [conges, absences, documents] = await Promise.all([
        demandeService.getAllDemandeConges(user),
        demandeService.getAllDemandeAbsences(user),
        demandeService.getAllDemandeDocuments(user),
      ])

      // Enrichir chaque type avec les informations utilisateur
      const enrichedConges = await enrichirAvecUtilisateurs(conges)
      const enrichedAbsences = await enrichirAvecUtilisateurs(absences)
      const enrichedDocuments = await enrichirAvecUtilisateurs(documents)

      setDemandesConge(enrichedConges)
      setDemandesAbsence(enrichedAbsences)
      setDemandesDocument(enrichedDocuments)
    } catch (error) {
      message.error("Erreur lors du chargement des demandes")
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const enrichirAvecUtilisateurs = async (demandes) => {
    return Promise.all(
      demandes.map(async (demande) => {
        try {
          const utilisateur = await UserService.getUserById(demande.utilisateur?.id || demande.utilisateurId)
          const demandeEnrichie = {
            ...demande,
            utilisateur: {
              ...demande.utilisateur,
              nom: utilisateur.nom,
              prenom: utilisateur.prenom,
              service: utilisateur.service || "Non défini",
              email: utilisateur.email,
              telephone: utilisateur.telephone,
            },
          }
          return mapDemandeAvecUtilisateur(demandeEnrichie)
        } catch (error) {
          console.error(`Erreur lors du chargement de l'utilisateur ${demande.utilisateur?.id}:`, error)
          return mapDemandeAvecUtilisateur(demande)
        }
      }),
    )
  }

  // Fonction pour obtenir le label du type de congé
  // Fonction pour obtenir l'icône du fichier
  const getFileIcon = (fileName) => {
    if (!fileName) return <InboxOutlined />
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FilePdfOutlined style={{ color: "#ff4d4f" }} />
      case "doc":
      case "docx":
        return <FileWordOutlined style={{ color: "#1890ff" }} />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "webp":
        return <PictureOutlined style={{ color: "#52c41a" }} />
      default:
        return <FileTextOutlined />
    }
  }

  // Fonction pour télécharger un fichier
  const downloadFile = async (demandeId, fileName) => {
    try {
      message.loading("Téléchargement en cours...", 0.5)
      const response = await fetch(`${API_BASE_URL}/demandes/${demandeId}/justification`, {
        method: "GET",
        headers: {
          "X-User-Id": user?.id?.toString(),
          ...(user?.token && { Authorization: `Bearer ${user.token}` }),
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName || "justification"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      message.success(`Fichier "${fileName}" téléchargé avec succès`)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      message.error("Erreur lors du téléchargement du fichier")
    }
  }

  // Colonnes pour les demandes de congé
  const getCongeColumns = () => [
    {
      title: "Employé",
      dataIndex: "employe",
      key: "employe",
      width: 200,
      fixed: "left",
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: "#4880FF" }}>{record.avatar}</Avatar>
          <div>
            <div style={{ fontWeight: "500" }}>{text}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.service}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Type de congé",
      dataIndex: "originalData",
      key: "typeDetaille",
      width: 180,
      render: (originalData) => {
        const typeLabel = getTypeCongeLabel(originalData?.type, originalData?.autretype)
        const colors = {
          "Congés annuels": "#52c41a",
          "Congé exceptionnel": "#1890ff",
          "Congé maladie": "#fa8c16",
          "Congé maternité/paternité": "#eb2f96",
          "Congé sans solde": "#722ed1",
        }
        return <Tag color={colors[typeLabel] || "#764ba2"}>{typeLabel}</Tag>
      },
    },
    {
      title: "Période demandée",
      dataIndex: "originalData",
      key: "periode",
      width: 200,
      render: (originalData) => {
        if (originalData?.dateDebut && originalData?.dateFin) {
          const debut = dayjs(originalData.dateDebut).format("DD/MM/YYYY")
          const fin = dayjs(originalData.dateFin).format("DD/MM/YYYY")
          const nbJours = dayjs(originalData.dateFin).diff(dayjs(originalData.dateDebut), "days") + 1
          if (debut === fin) {
            return (
              <div>
                <div>
                  <CalendarOutlined /> {debut}
                </div>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  1 jour
                </Text>
              </div>
            )
          }
          return (
            <div>
              <div>
                <CalendarOutlined /> {debut} - {fin}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {nbJours} jours
              </Text>
            </div>
          )
        }
        return <Text type="secondary">Non définie</Text>
      },
    },
    {
      title: "Fichier joint",
      dataIndex: "originalData",
      key: "fichier",
      width: 150,
      render: (originalData) => {
        if (originalData?.justification) {
          return (
            <Tooltip title={`Télécharger ${originalData.justification.name}`}>
              <Button
                type="link"
                size="small"
                icon={getFileIcon(originalData.justification.name)}
                onClick={() => downloadFile(originalData.id, originalData.justification.name)}
              >
                {originalData.justification.name?.length > 15
                  ? `${originalData.justification.name.substring(0, 15)}...`
                  : originalData.justification.name}
              </Button>
            </Tooltip>
          )
        }
        return <Text type="secondary">Aucun fichier</Text>
      },
    },
    {
      title: "Date de demande",
      dataIndex: "originalData",
      key: "dateDemande",
      width: 120,
      render: (originalData) => {
        if (originalData?.dateDemande) {
          return dayjs(originalData.dateDemande).format("DD/MM/YYYY")
        }
        return <Text type="secondary">Non définie</Text>
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 150,
      render: (statut, record) => {
        const statusConfig = {
          EN_ATTENTE: { color: "orange", text: "En attente" },
          VALIDEE_RH: { color: "blue", text: "Validé RH" },
          TRANSMISE_DIRECTION: { color: "purple", text: "Transmis Direction" },
          VALIDEE_DIRECTION: { color: "green", text: "Validé Direction" },
          REFUSEE_RH: { color: "red", text: "Refusé RH" },
          REFUSEE_DIRECTION: { color: "red", text: "Refusé Direction" },
          ANNULEE: { color: "gray", text: "Annulé" },
        }
        const config = statusConfig[statut] || { color: "default", text: statut }
        return (
          <Space>
            <Tag color={config.color}>{config.text}</Tag>
            {record.originalData?.commentaireValidation && (
              <Tooltip title="Historique de validation disponible">
                <HistoryOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => {
        const isEnAttente = record.statut === "EN_ATTENTE"
        return (
          <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleVoirDetails(record)}>
              Examiner
            </Button>
            {isEnAttente && (
              <>
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  style={{ color: "#52c41a" }}
                  onClick={() => handleAction(record, "valider")}
                >
                  Valider
                </Button>
                <Button
                  type="link"
                  icon={<SendOutlined />}
                  style={{ color: "#1890ff" }}
                  onClick={() => handleAction(record, "transmettre")}
                >
                  Transmettre
                </Button>
                <Button type="link" icon={<CloseOutlined />} danger onClick={() => handleAction(record, "refuser")}>
                  Refuser
                </Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  // Colonnes pour les demandes d'absence
  const getAbsenceColumns = () => [
    {
      title: "Employé",
      dataIndex: "employe",
      key: "employe",
      width: 200,
      fixed: "left",
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: "#4880FF" }}>{record.avatar}</Avatar>
          <div>
            <div style={{ fontWeight: "500" }}>{text}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.service}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Motif d'absence",
      dataIndex: "originalData",
      key: "typeDetaille",
      width: 180,
      render: (originalData) => {
        const typeLabel = getTypeCongeLabel(originalData?.type, originalData?.autretype)
        const colors = {
          "Absence personnelle": "#13c2c2",
          "Absence médicale": "#fa541c",
          "Absence exceptionnelle": "#f5222d",
        }
        return <Tag color={colors[typeLabel] || "#764ba2"}>{typeLabel}</Tag>
      },
    },
    {
      title: "Horaires",
      dataIndex: "originalData",
      key: "horaires",
      width: 200,
      render: (originalData) => {
        if (originalData?.heureDebut && originalData?.heureFin) {
          const date = originalData.dateDebut ? dayjs(originalData.dateDebut).format("DD/MM/YYYY") : "Date inconnue"
          const heureDebut = originalData.heureDebut
          const heureFin = originalData.heureFin
          return (
            <div>
              <div>
                <CalendarOutlined /> {date}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {heureDebut} - {heureFin}
              </Text>
            </div>
          )
        }
        return <Text type="secondary">Non définie</Text>
      },
    },
    {
      title: "Fichier joint",
      dataIndex: "originalData",
      key: "fichier",
      width: 150,
      render: (originalData) => {
        if (originalData?.justification) {
          return (
            <Tooltip title={`Télécharger ${originalData.justification.name}`}>
              <Button
                type="link"
                size="small"
                icon={getFileIcon(originalData.justification.name)}
                onClick={() => downloadFile(originalData.id, originalData.justification.name)}
              >
                {originalData.justification.name?.length > 15
                  ? `${originalData.justification.name.substring(0, 15)}...`
                  : originalData.justification.name}
              </Button>
            </Tooltip>
          )
        }
        return <Text type="secondary">Aucun fichier</Text>
      },
    },
    {
      title: "Date de demande",
      dataIndex: "originalData",
      key: "dateDemande",
      width: 120,
      render: (originalData) => {
        if (originalData?.dateDemande) {
          return dayjs(originalData.dateDemande).format("DD/MM/YYYY")
        }
        return <Text type="secondary">Non définie</Text>
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 150,
      render: (statut, record) => {
        const statusConfig = {
          EN_ATTENTE: { color: "orange", text: "En attente" },
          VALIDEE_RH: { color: "blue", text: "Validé RH" },
          TRANSMISE_DIRECTION: { color: "purple", text: "Transmis Direction" },
          VALIDEE_DIRECTION: { color: "green", text: "Validé Direction" },
          REFUSEE_RH: { color: "red", text: "Refusé RH" },
          REFUSEE_DIRECTION: { color: "red", text: "Refusé Direction" },
          ANNULEE: { color: "gray", text: "Annulé" },
        }
        const config = statusConfig[statut] || { color: "default", text: statut }
        return (
          <Space>
            <Tag color={config.color}>{config.text}</Tag>
            {record.originalData?.commentaireValidation && (
              <Tooltip title="Historique de validation disponible">
                <HistoryOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => {
        const isEnAttente = record.statut === "EN_ATTENTE"
        return (
          <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleVoirDetails(record)}>
              Examiner
            </Button>
            {isEnAttente && (
              <>
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  style={{ color: "#52c41a" }}
                  onClick={() => handleAction(record, "valider")}
                >
                  Valider
                </Button>
                <Button
                  type="link"
                  icon={<SendOutlined />}
                  style={{ color: "#1890ff" }}
                  onClick={() => handleAction(record, "transmettre")}
                >
                  Transmettre
                </Button>
                <Button type="link" icon={<CloseOutlined />} danger onClick={() => handleAction(record, "refuser")}>
                  Refuser
                </Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  // Colonnes pour les demandes de documents
  const getDocumentColumns = () => [
    {
      title: "Employé",
      dataIndex: "employe",
      key: "employe",
      width: 200,
      fixed: "left",
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: "#4880FF" }}>{record.avatar}</Avatar>
          <div>
            <div style={{ fontWeight: "500" }}>{text}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.service}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Type de document",
      dataIndex: "originalData",
      key: "typeDetaille",
      width: 180,
      render: (originalData) => {
        const typeLabel = getTypeCongeLabel(originalData?.type, originalData?.autretype)
        const colors = {
          "Attestation de travail": "#52c41a",
          "Attestation de salaire": "#1890ff",
        }
        // Si c'est un type personnalisé (autretype), utiliser une couleur spéciale
        const color = originalData?.autretype ? "#722ed1" : colors[typeLabel] || "#764ba2"
        return <Tag color={color}>{typeLabel}</Tag>
      },
    },
    {
      title: "Date de demande",
      dataIndex: "originalData",
      key: "dateDemande",
      width: 150,
      render: (originalData) => {
        if (originalData?.dateDemande) {
          return dayjs(originalData.dateDemande).format("DD/MM/YYYY")
        }
        return <Text type="secondary">Non définie</Text>
      },
    },
    {
      title: "Motif",
      dataIndex: "originalData",
      key: "motif",
      width: 250,
      render: (originalData) => {
        const motif = originalData?.commentaire
        if (motif && motif.length > 50) {
          return (
            <div>
              <div>{motif.substring(0, 50)}...</div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <FileTextOutlined /> Voir détails
              </Text>
            </div>
          )
        }
        return motif || <Text type="secondary">Aucun motif</Text>
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 150,
      render: (statut, record) => {
        const statusConfig = {
          EN_ATTENTE: { color: "orange", text: "En attente" },
          VALIDEE_RH: { color: "blue", text: "Validé RH" },
          TRANSMISE_DIRECTION: { color: "purple", text: "Transmis Direction" },
          VALIDEE_DIRECTION: { color: "green", text: "Validé Direction" },
          REFUSEE_RH: { color: "red", text: "Refusé RH" },
          REFUSEE_DIRECTION: { color: "red", text: "Refusé Direction" },
          ANNULEE: { color: "gray", text: "Annulé" },
        }
        const config = statusConfig[statut] || { color: "default", text: statut }
        return (
          <Space>
            <Tag color={config.color}>{config.text}</Tag>
            {record.originalData?.commentaireValidation && (
              <Tooltip title="Historique de validation disponible">
                <HistoryOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => {
        const isEnAttente = record.statut === "EN_ATTENTE"
        return (
          <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleVoirDetails(record)}>
              Examiner
            </Button>
            {isEnAttente && (
              <>
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  style={{ color: "#52c41a" }}
                  onClick={() => handleAction(record, "valider")}
                >
                  Valider
                </Button>
                <Button
                  type="link"
                  icon={<SendOutlined />}
                  style={{ color: "#1890ff" }}
                  onClick={() => handleAction(record, "transmettre")}
                >
                  Transmettre
                </Button>
                <Button type="link" icon={<CloseOutlined />} danger onClick={() => handleAction(record, "refuser")}>
                  Refuser
                </Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  const handleVoirDetails = async (record) => {
    try {
      const details = await demandeService.getDemandeDetails(record.id, user)
      setSelectedDemande({ ...record, ...details })
      setActionType("")
      setModalVisible(true)
    } catch (error) {
      message.error("Erreur lors du chargement des détails")
    }
  }

  const handleAction = (record, action) => {
    setSelectedDemande(record)
    setActionType(action)
    setModalVisible(true)
  }

  const handleSubmitAction = async (values) => {
    setActionLoading(true)
    try {
      const commentaire = values.commentaire || ""
      // Utiliser la nouvelle API selon l'action
      switch (actionType) {
        case "valider":
          await demandeService.traiterDemandeRH(selectedDemande.id, "VALIDER", commentaire, user)
          message.success("Demande validée avec succès!")
          break
        case "transmettre":
          await demandeService.traiterDemandeRH(selectedDemande.id, "TRANSMETTRE", commentaire, user)
          message.success("Demande transmise à la Direction avec succès!")
          break
        case "refuser":
          await demandeService.traiterDemandeRH(selectedDemande.id, "REFUSER", commentaire, user)
          message.success("Demande refusée avec succès!")
          break
        default:
          throw new Error("Action non reconnue")
      }

      setModalVisible(false)
      form.resetFields()
      setActionType("")
      loadAllDemandes() // Recharger les données
    } catch (error) {
      console.error("Erreur lors de l'action:", error)
      message.error(`Erreur lors de l'action: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Vérification d'authentification et de permissions
  if (!isAuthenticated) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <Card className={isLightMode ? "card-light" : "card-dark"}>
            <Alert
              message="Accès non autorisé"
              description="Vous devez être connecté pour accéder à cette page."
              type="warning"
              showIcon
            />
          </Card>
        </Content>
      </Layout>
    )
  }

  if (!isRH) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <Card className={isLightMode ? "card-light" : "card-dark"}>
            <Alert
              message="Permissions insuffisantes"
              description="Vous n'avez pas les permissions nécessaires pour accéder aux fonctions RH."
              type="error"
              showIcon
            />
          </Card>
        </Content>
      </Layout>
    )
  }

  // Fonction locale pour mapper les demandes avec informations utilisateur complètes
  const mapDemandeAvecUtilisateur = (demande) => ({
    id: demande.id,
    type: getTypeLabel(demande),
    employe:
      demande.utilisateur?.nom && demande.utilisateur?.prenom
        ? `${demande.utilisateur.prenom} ${demande.utilisateur.nom}`
        : demande.utilisateur?.nom || "Utilisateur inconnu",
    service: demande.utilisateur?.service || "Service non défini",
    email: demande.utilisateur?.email || "Email non défini",
    telephone: demande.utilisateur?.telephone || "Téléphone non défini",
    dateCreation: demande.dateDemande,
    dateDemandee: formatDateDemandee(demande),
    statut: getStatutLabel(demande.statut),
    priorite: demande.estUrgente ? "Urgente" : "Normale",
    details: demande.commentaire || "Aucun détail",
    avatar: getAvatarFromName(demande.utilisateur?.nom || "U"),
    manager: demande.utilisateur?.manager || "Manager non défini",
    originalData: demande, // Garder les données originales
  })

  // Fonction pour obtenir le titre de l'action
  const getActionTitle = (action) => {
    switch (action) {
      case "valider":
        return "Valider la demande"
      case "transmettre":
        return "Transmettre à la Direction"
      case "refuser":
        return "Refuser la demande"
      default:
        return "Action sur la demande"
    }
  }

  // Fonction pour obtenir la couleur du bouton
  const getActionButtonColor = (action) => {
    switch (action) {
      case "valider":
        return "#52c41a"
      case "transmettre":
        return "#1890ff"
      case "refuser":
        return "#ff4d4f"
      default:
        return "#1890ff"
    }
  }

  // Fonction pour créer l'historique de validation
  const renderHistoriqueValidation = (demande) => {
    const items = []

    // Demande initiale
    items.push({
      color: "blue",
      children: (
        <div>
          <Text strong>Demande créée</Text>
          <br />
          <Text type="secondary">
            {demande.dateDemande ? dayjs(demande.dateDemande).format("DD/MM/YYYY HH:mm") : "Date inconnue"}
          </Text>
          <br />
          <Text type="secondary">Par: {demande.utilisateur?.nom || "Utilisateur"}</Text>
        </div>
      ),
    })

    // Validation RH
    if (demande.dateValidationRH || demande.commentaireRH) {
      items.push({
        color: demande.statut === "REFUSEE_RH" ? "red" : "green",
        children: (
          <div>
            <Text strong>
              {demande.statut === "REFUSEE_RH"
                ? "Refusé par RH"
                : demande.statut === "TRANSMISE_DIRECTION"
                  ? "Transmis à la Direction"
                  : "Validé par RH"}
            </Text>
            <br />
            <Text type="secondary">
              {demande.dateValidationRH ? dayjs(demande.dateValidationRH).format("DD/MM/YYYY HH:mm") : "Date inconnue"}
            </Text>
            <br />
            <Text type="secondary">Par: {demande.validateurRH?.nom || "RH"}</Text>
            {demande.commentaireRH && (
              <>
                <br />
                <Text>Commentaire: {demande.commentaireRH}</Text>
              </>
            )}
          </div>
        ),
      })
    }

    // Validation Direction
    if (demande.dateValidationDirection || demande.commentaireDirection) {
      items.push({
        color: demande.statut === "REFUSEE_DIRECTION" ? "red" : "green",
        children: (
          <div>
            <Text strong>
              {demande.statut === "REFUSEE_DIRECTION" ? "Refusé par la Direction" : "Validé par la Direction"}
            </Text>
            <br />
            <Text type="secondary">
              {demande.dateValidationDirection
                ? dayjs(demande.dateValidationDirection).format("DD/MM/YYYY HH:mm")
                : "Date inconnue"}
            </Text>
            <br />
            <Text type="secondary">Par: {demande.validateurDirection?.nom || "Direction"}</Text>
            {demande.commentaireDirection && (
              <>
                <br />
                <Text>Commentaire: {demande.commentaireDirection}</Text>
              </>
            )}
          </div>
        ),
      })
    }

    return <Timeline items={items} />
  }

  // Compter les demandes en attente pour chaque onglet
  const getTabTitle = (title, count) => (
    <Space>
      {title}
      <Badge count={count} size="small" />
    </Space>
  )

  const congesEnAttente = demandesConge.filter((d) => d.statut === "EN_ATTENTE").length
  const absencesEnAttente = demandesAbsence.filter((d) => d.statut === "EN_ATTENTE").length
  const documentsEnAttente = demandesDocument.filter((d) => d.statut === "EN_ATTENTE").length

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={
            <Space>
              <span className={isLightMode ? "card-title-light" : "card-title-dark"}>
                Gestion des Demandes
              </span>
              
            </Space>
          }
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadAllDemandes} loading={loading}>
              Actualiser tout
            </Button>
          }
          className={isLightMode ? "card-light" : "card-dark"}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={getTabTitle("Demandes de Congé", congesEnAttente)} key="conge">
              <Spin spinning={loading}>
                <Table
                  columns={getCongeColumns()}
                  dataSource={demandesConge}
                  rowKey="id"
                  scroll={{ x: 1600, y: 500 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} demandes`,
                  }}
                  locale={{
                    emptyText: "Aucune demande de congé",
                  }}
                />
              </Spin>
            </TabPane>

            <TabPane tab={getTabTitle("Demandes d'Absence", absencesEnAttente)} key="absence">
              <Spin spinning={loading}>
                <Table
                  columns={getAbsenceColumns()}
                  dataSource={demandesAbsence}
                  rowKey="id"
                  scroll={{ x: 1600, y: 500 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} demandes`,
                  }}
                  locale={{
                    emptyText: "Aucune demande d'absence",
                  }}
                />
              </Spin>
            </TabPane>

            <TabPane tab={getTabTitle("Demandes de Documents", documentsEnAttente)} key="document">
              <Spin spinning={loading}>
                <Table
                  columns={getDocumentColumns()}
                  dataSource={demandesDocument}
                  rowKey="id"
                  scroll={{ x: 1400, y: 500 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} demandes`,
                  }}
                  locale={{
                    emptyText: "Aucune demande de document",
                  }}
                />
              </Spin>
            </TabPane>
          </Tabs>
        </Card>

        {/* Modal pour voir les détails et actions */}
        <Modal
          title={
            <Space>
              {actionType ? (
                <>
                  <ExclamationCircleOutlined style={{ color: getActionButtonColor(actionType) }} />
                  {getActionTitle(actionType)}
                </>
              ) : (
                <>
                  <EyeOutlined />
                  Détails de la demande
                </>
              )}
            </Space>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
            setActionType("")
          }}
          footer={
            actionType ? (
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false)
                    form.resetFields()
                    setActionType("")
                  }}
                  disabled={actionLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  loading={actionLoading}
                  style={{
                    backgroundColor: getActionButtonColor(actionType),
                    borderColor: getActionButtonColor(actionType),
                  }}
                >
                  {actionType === "valider" ? "Valider" : actionType === "transmettre" ? "Transmettre" : "Refuser"}
                </Button>
              </Space>
            ) : (
              <Button type="primary" onClick={() => setModalVisible(false)}>
                Fermer
              </Button>
            )
          }
          width={800}
          className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
        >
          {selectedDemande && (
            <div>
              <Tabs defaultActiveKey="details">
                <TabPane tab="Détails" key="details">
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Employé" span={2}>
                      <Space>
                        <Avatar style={{ backgroundColor: "#4880FF" }}>{selectedDemande.avatar}</Avatar>
                        <div>
                          <div style={{ fontWeight: "500" }}>{selectedDemande.employe}</div>
                          <Text type="secondary">{selectedDemande.service}</Text>
                        </div>
                      </Space>
                    </Descriptions.Item>

                    <Descriptions.Item label="Type de demande">
                      <Tag color="#764ba2">
                        {getTypeCongeLabel(selectedDemande.originalData?.type, selectedDemande.originalData?.autretype)}
                      </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Priorité">
                      <Tag color={selectedDemande.priorite === "Urgente" ? "red" : "default"}>
                        {selectedDemande.priorite}
                      </Tag>
                    </Descriptions.Item>

                    {selectedDemande.originalData?.dateDebut && (
                      <Descriptions.Item label="Date de début">
                        {dayjs(selectedDemande.originalData.dateDebut).format("DD/MM/YYYY")}
                      </Descriptions.Item>
                    )}

                    {selectedDemande.originalData?.dateFin && (
                      <Descriptions.Item label="Date de fin">
                        {dayjs(selectedDemande.originalData.dateFin).format("DD/MM/YYYY")}
                      </Descriptions.Item>
                    )}

                    {selectedDemande.originalData?.dateDebut && selectedDemande.originalData?.dateFin && (
                      <Descriptions.Item label="Nombre de jours" span={2}>
                        {dayjs(selectedDemande.originalData.dateFin).diff(
                          dayjs(selectedDemande.originalData.dateDebut),
                          "days",
                        ) + 1}{" "}
                        jours
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item label="Date de demande">
                      {selectedDemande.originalData?.dateDemande
                        ? dayjs(selectedDemande.originalData.dateDemande).format("DD/MM/YYYY")
                        : "Non définie"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Statut">
                      <Tag color="orange">{selectedDemande.statut}</Tag>
                    </Descriptions.Item>

                    {selectedDemande.originalData?.commentaire && (
                      <Descriptions.Item label="Motif/Commentaire" span={2}>
                        <div
                          style={{
                            padding: "8px",
                            backgroundColor: isLightMode ? "#f5f5f5" : "#273142",
                            borderRadius: "4px",
                            border: "1px solid #d9d9d9",
                          }}
                        >
                          {selectedDemande.originalData.commentaire}
                        </div>
                      </Descriptions.Item>
                    )}

                    {selectedDemande.originalData?.justification && (
                      <Descriptions.Item label="Justification" span={2}>
                        <Space>
                          {getFileIcon(selectedDemande.originalData.justification.name)}
                          <Text>{selectedDemande.originalData.justification.name}</Text>
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() =>
                              downloadFile(selectedDemande.id, selectedDemande.originalData.justification.name)
                            }
                          >
                            Télécharger
                          </Button>
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </TabPane>

                <TabPane
                  tab={
                    <Space>
                      <HistoryOutlined />
                      Historique
                    </Space>
                  }
                  key="historique"
                >
                  <div style={{ padding: "16px 0" }}>
                    <Title level={5}>Historique de validation</Title>
                    {renderHistoriqueValidation(selectedDemande.originalData)}
                  </div>
                </TabPane>
              </Tabs>

              {actionType && (
                <Form form={form} onFinish={handleSubmitAction} style={{ marginTop: "24px" }}>
                  <Form.Item
                    name="commentaire"
                    label={`Commentaire RH (${user?.nom || "Utilisateur"})`}
                    rules={[{ required: true, message: "Veuillez ajouter un commentaire" }]}
                  >
                    <TextArea
                      rows={4}
                      style={{backgroundColor: isLightMode ? "#f5f5f5" : "#273142"}}
                      placeholder={`Commentaire pour ${
                        actionType === "valider"
                          ? "la validation"
                          : actionType === "transmettre"
                            ? "la transmission"
                            : "le refus"
                      }...`}
                    />
                  </Form.Item>

                  {!actionType.includes("refuser") && (
                    <Alert
                      message={
                        actionType === "valider"
                          ? "Cette demande sera validée définitivement par RH"
                          : "Cette demande sera transmise à la Direction pour validation finale"
                      }
                      type={actionType.includes("valider") ? "success" : "info"}
                      showIcon
                      style={{ marginTop: "16px" }}
                    />
                  )}

                  {actionType.includes("refuser") && (
                    <Alert
                      message="Cette demande sera refusée définitivement"
                      type="error"
                      showIcon
                      style={{ marginTop: "16px" }}
                    />
                  )}
                </Form>
              )}
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  )
}
