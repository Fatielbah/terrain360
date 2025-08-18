

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  Table,
  message,
  Tag,
  Space,
  Tooltip,
  Layout,
  Tabs,
  Empty,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  HistoryOutlined,
  ToolOutlined,
  SearchOutlined,
  DesktopOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  StopOutlined,
  ClockCircleOutlined,
  FilePdfOutlined
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "../../contexts/ThemeContext"
import { MaterialService } from "../../services/material-service"
import { UserService } from "../../services/user-service"
import "./materials.css"
import { useAuth } from "../../contexts/AuthContext"

const { Content } = Layout
const { Option } = Select
const { TabPane } = Tabs

// Composant StatCard intégré directement dans le fichier
function StatCard({ title, value, trend, type, icon }) {
  const getIcon = () => {
    const iconMap = {
      total: <DesktopOutlined />,
      functional: <CheckCircleOutlined />,
      broken: <WarningOutlined />,
      repair: <ToolOutlined />,
      tickets: <ExclamationCircleOutlined />,
    }
    return icon || iconMap[type] || <UserOutlined />
  }

  const getIconColor = () => {
    const colorMap = {
      total: "#6366f1",
      functional: "#10b981",
      broken: "#ef4444",
      repair: "#f59e0b",
      tickets: "#8b5cf6",
    }
    return colorMap[type] || "#6366f1"
  }

  return (
    <Card className="stat-card-modern" bordered={false}>
      <div className="stat-card-content">
        <div className="stat-card-header">
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-icon" style={{ backgroundColor: `${getIconColor()}20` }}>
            <span style={{ color: getIconColor() }}>{getIcon()}</span>
          </div>
        </div>
        <div className="stat-card-value">{value.toLocaleString()}</div>
      </div>
    </Card>
  )
}

export default function MaterialsPage() {
  const { isLightMode } = useTheme()
  const [materials, setMaterials] = useState([])
  const [assignedMaterials, setAssignedMaterials] = useState([])
  const [tickets, setTickets] = useState([])
  const [resolvedTickets, setResolvedTickets] = useState([])
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(false)
  const [assignedLoading, setAssignedLoading] = useState(false)
  const [users, setUsers] = useState([])
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("disponibles")
  const [activeTicketTab, setActiveTicketTab] = useState("actifs")
  const [stats, setStats] = useState({
    total: 0,
    fonctionnel: 0,
    enPanne: 0,
    enReparation: 0,
    ticketsOuverts: 0,
  })

  // Modals state
  const [materialModalVisible, setMaterialModalVisible] = useState(false)
  const [ticketModalVisible, setTicketModalVisible] = useState(false)
  const [historiqueModalVisible, setHistoriqueModalVisible] = useState(false)
  const [affectationModalVisible, setAffectationModalVisible] = useState(false)

  // Add state for termination modal
  const [terminationModalVisible, setTerminationModalVisible] = useState(false)
  const [selectedAffectation, setSelectedAffectation] = useState(null)

  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [materialForm] = Form.useForm()
  const [ticketForm] = Form.useForm()
  const [affectationForm] = Form.useForm()
  const [terminationForm] = Form.useForm()

  // Fixed rowClassName function with proper null checks
  const getRowClassName = (record) => {
    if (!record || !record.etat) {
      return "table-row"
    }
    return `table-row ${record.etat.toLowerCase()}`
  }

  // Fonction pour mettre à jour les statistiques automatiquement
  const updateStats = useCallback(async () => {
    try {
      const data = await MaterialService.getMaterialStatistics()

      // Utiliser la nouvelle API pour les tickets ouverts/en cours
      let ticketsOuverts = 0
      try {
        ticketsOuverts = await MaterialService.getTicketsOuvertsOuEnCoursCount()
      } catch (error) {
        console.error("Erreur lors du chargement du nombre de tickets:", error)
        // Fallback: calculer à partir des tickets chargés
        ticketsOuverts = tickets.filter((t) => t.statut === "OUVERT" || t.statut === "EN_COURS").length
      }

      // Map backend response to frontend state
      setStats({
        total: data.totalMateriels || 0,
        fonctionnel: data.materielsEnPanne
          ? data.totalMateriels - data.materielsEnPanne - data.materielsEnReparation
          : 0,
        enPanne: data.materielsEnPanne || 0,
        enReparation: data.materielsEnReparation || 0,
        ticketsOuverts: ticketsOuverts,
      })
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
      // Calculate stats from materials data instead
      calculateStatsFromData(materials)
    }
  }, [materials, tickets])

  // Charger les matériels depuis l'API
  useEffect(() => {
    const loadData = async () => {
      await loadUsers() // Load users first
      await loadMaterials()
      await loadAssignedMaterials()
      await loadTickets()
      await updateStats()
    }

    loadData()
  }, [])

  // Mettre à jour les stats quand les données changent
  useEffect(() => {
    updateStats()
  }, [materials, assignedMaterials, tickets, updateStats])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      const data = await MaterialService.getAllMaterialsDisponibles()
      setMaterials(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des matériels:", error)
      message.error("Erreur lors du chargement des matériels")
      setMaterials([]) // No fallback data
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedMaterials = async () => {
    try {
      setAssignedLoading(true)
      console.log("Loading assigned materials...")

      const data = await MaterialService.getAllMaterialsAffectes()
      console.log("Assigned materials loaded:", data)

      setAssignedMaterials(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des matériels affectés:", error)
      message.error("Erreur lors du chargement des matériels affectés")
      setAssignedMaterials([])
    } finally {
      setAssignedLoading(false)
    }
  }

  const calculateStatsFromData = (materialsData) => {
    const allMaterials = [...materialsData, ...assignedMaterials]
    setStats({
      total: allMaterials.length,
      fonctionnel: allMaterials.filter((m) => m.etat === "FONCTIONNEL").length,
      enPanne: allMaterials.filter((m) => m.etat === "EN_PANNE").length,
      enReparation: allMaterials.filter((m) => m.etat === "EN_REPARATION").length,
      ticketsOuverts: tickets.filter((t) => t.statut === "OUVERT" || t.statut === "EN_COURS").length,
    })
  }

  const validateSerialNumber = async (rule, value) => {
    if (!value) return Promise.resolve()

    // Check if serial number already exists (excluding current material if editing)
    const allMaterials = [...materials, ...assignedMaterials]
    const existingMaterial = allMaterials.find(
      (m) => m.numeroSerie === value && (!selectedMaterial || m.id !== selectedMaterial.id),
    )

    if (existingMaterial) {
      return Promise.reject(new Error("Ce numéro de série existe déjà"))
    }

    return Promise.resolve()
  }

  const validatePurchaseDate = (rule, value) => {
    if (!value) return Promise.resolve()

    const today = dayjs()
    if (value.isAfter(today)) {
      return Promise.reject(new Error("La date d'achat ne peut pas être dans le futur"))
    }

    return Promise.resolve()
  }

  const validateWarrantyDuration = (rule, value) => {
    if (!value) return Promise.resolve()

    const duration = Number.parseInt(value)
    if (isNaN(duration) || duration < 0 || duration > 120) {
      return Promise.reject(new Error("La durée de garantie doit être entre 0 et 120 mois"))
    }

    return Promise.resolve()
  }

  // Update the loadUsers function to add better error handling and logging
  const loadUsers = async () => {
    try {
      console.log("Loading users...") // Debug log
      const data = await UserService.getAllUsers()
      console.log("Users loaded:", data) // Debug log
      setUsers(data)

      if (data.length === 0) {
        console.warn("No users found or API returned empty array")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
      message.error("Erreur lors du chargement des utilisateurs")
      setUsers([])
    }
  }

  const loadTickets = async () => {
    try {
      const data = await MaterialService.getAllTickets()
      console.log("Tickets loaded from API:", data)

      // Vérifier que chaque ticket a un ID valide
      const validTickets = data.filter((ticket) => {
        const hasValidId = ticket && (ticket.id || ticket.ticketId || ticket.numeroTicket)
        if (!hasValidId) {
          console.warn("Ticket sans ID valide trouvé:", ticket)
        }
        return hasValidId
      })

      // Séparer les tickets actifs et résolus
      const activeTickets = validTickets.filter((ticket) => ticket.statut !== "RESOLU")
      const resolvedTickets = validTickets.filter((ticket) => ticket.statut === "RESOLU")

      setTickets(activeTickets)
      setResolvedTickets(resolvedTickets)
    } catch (error) {
      console.error("Erreur lors du chargement des tickets:", error)
      setTickets([])
      setResolvedTickets([])
    }
  }

  // Fonction pour vérifier si un matériel peut être affecté
  const canAssignMaterial = (material) => {
    return material.etat === "FONCTIONNEL"
  }

  // Colonnes pour le tableau des matériels disponibles
  const materialColumns = [
    {
      title: "N° Série",
      dataIndex: "numeroSerie",
      key: "numeroSerie",
      width: 150,
      render: (text) => <code className="serial-number">{text}</code>,
    },
    {
      title: "Marque",
      dataIndex: "marque",
      key: "marque",
      width: 120,
      render: (text) => <strong className="material-reference">{text}</strong>,
    },
    {
      title: "Modèle",
      dataIndex: "modele",
      key: "modele",
      width: 150,
      render: (text) => <span className="material-name">{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (text) => <span className="material-type">{text}</span>,
    },
    {
      title: "État",
      dataIndex: "etat",
      key: "etat",
      width: 120,
      render: (etat) => {
        const colors = {
          FONCTIONNEL: "green",
          EN_PANNE: "red",
          EN_REPARATION: "orange",
          HORS_SERVICE: "gray",
        }
        return (
          <Tag color={colors[etat]} className="status-tag">
            {etat}
          </Tag>
        )
      },
    },
    {
      title: "Date d'achat",
      dataIndex: "dateAchat",
      key: "dateAchat",
      width: 120,
      render: (date) => <span className="ticket-date">{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: "Garantie",
      dataIndex: "dureeGarantie",
      key: "dureeGarantie",
      width: 100,
      render: (duree, record) => {
        if (!duree) return <Tag color="default">-</Tag>
        const dateAchat = new Date(record.dateAchat)
        const dateExpiration = new Date(dateAchat.getTime())
        dateExpiration.setMonth(dateExpiration.getMonth() + duree)
        const isExpired = dateExpiration < new Date()
        return (
          <Tag color={isExpired ? "red" : "green"} className="warranty-tag">
            {duree} mois
          </Tag>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space size={2} className="action-buttons">
          <Tooltip title="Modifier">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditMaterial(record)}
              className="action-btn edit-btn"
            />
          </Tooltip>
          <Tooltip title="Historique">
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleShowHistorique(record)}
              className="action-btn history-btn"
            />
          </Tooltip>
          <Tooltip title="Déclarer une panne">
            <Button
              type="link"
              size="small"
              icon={<ToolOutlined />}
              onClick={() => handleDeclarerPanne(record)}
              className="action-btn issue-btn"
            />
          </Tooltip>
          <Tooltip
            title={canAssignMaterial(record) ? "Affecter" : "Impossible d'affecter (matériel en panne/réparation)"}
          >
            <Button
              type="link"
              size="small"
              icon={<UserOutlined />}
              onClick={() => handleAffecterMaterial(record)}
              className={`action-btn assign-btn ${!canAssignMaterial(record) ? "disabled" : ""}`}
              disabled={!canAssignMaterial(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMaterial(record)}
              className="action-btn delete-btn"
              danger
            />
          </Tooltip>
          <Tooltip title="Générer Rapport PDF">
            <Button
              type="link"
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => handleGenerateReport(record)}
              className="action-btn report-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Colonnes pour le tableau des matériels affectés (sans bouton déclarer panne)
  const assignedMaterialColumns = [
    {
      title: "N° Série",
      dataIndex: "numeroSerie",
      key: "numeroSerie",
      width: 150,
      render: (text) => <code className="serial-number">{text}</code>,
    },
    {
      title: "Marque",
      dataIndex: "marque",
      key: "marque",
      width: 120,
      render: (text) => <strong className="material-reference">{text}</strong>,
    },
    {
      title: "Modèle",
      dataIndex: "modele",
      key: "modele",
      width: 150,
      render: (text) => <span className="material-name">{text}</span>,
    },
    {
      title: "Utilisateur",
      dataIndex: "utilisateurActuel",
      key: "utilisateurActuel",
      width: 150,
      render: (utilisateur, record) => {
        console.log(`Utilisateur for material ${record.id}:`, utilisateur)

        if (!utilisateur) {
          return <span className="assigned-user">-</span>
        }

        // Handle the correct structure from your backend
        const nom = utilisateur.nom || ""
        const prenom = utilisateur.prenom || ""
        const nomUtilisateur = utilisateur.nomDeUtilisateur || ""

        return (
          <span className="assigned-user">
            {prenom && nom ? `${prenom} ${nom}` : nomUtilisateur || "Utilisateur inconnu"}
          </span>
        )
      },
    },
    {
      title: "Date d'affectation",
      dataIndex: "dateAffectation",
      key: "dateAffectation",
      width: 130,
      render: (date) => <span className="assignment-date">{date ? new Date(date).toLocaleDateString() : "-"}</span>,
    },
    {
      title: "Motif",
      dataIndex: "motifAffectation",
      key: "motifAffectation",
      width: 200,
      render: (motif) => (
        <Tooltip title={motif}>
          <span className="assignment-reason">
            {motif && motif.length > 30 ? `${motif.substring(0, 30)}...` : motif || "-"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "État",
      dataIndex: "etat",
      key: "etat",
      width: 120,
      render: (etat) => {
        const colors = {
          FONCTIONNEL: "green",
          EN_PANNE: "red",
          EN_REPARATION: "orange",
          HORS_SERVICE: "gray",
        }
        return (
          <Tag color={colors[etat]} className="status-tag">
            {etat}
          </Tag>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size={2} className="action-buttons">
          <Tooltip title="Historique">
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleShowHistorique(record)}
              className="action-btn history-btn"
            />
          </Tooltip>

          <Tooltip title="Terminer l'affectation">
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleTerminateAssignment(record)}
              className="action-btn terminate-btn"
              danger
            />
          </Tooltip>
           <Tooltip title="Générer Rapport PDF">
            <Button
              type="link"
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => handleGenerateReport(record)}
              className="action-btn report-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Colonnes pour les tickets actifs
  const activeTicketColumns = [
    {
      title: "Matériel",
      dataIndex: "materiel",
      key: "materiel",
      width: 200,
      render: (materiel) => (
        <span className="ticket-material">{materiel ? `${materiel.marque} ${materiel.modele}` : "N/A"}</span>
      ),
    },
    {
      title: "Déclarant",
      dataIndex: "declarant",
      key: "declarant",
      width: 150,
      render: (declarant) => (
        <span className="ticket-user">{declarant ? `${declarant.prenom} ${declarant.nom}` : "N/A"}</span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (text) => (
        <Tooltip title={text}>
          <span className="ticket-description">{text && text.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Priorité",
      dataIndex: "priorite",
      key: "priorite",
      width: 100,
      render: (priorite) => {
        const colors = {
          BASSE: "green",
          MOYENNE: "orange",
          HAUTE: "red",
        }
        return (
          <Tag color={colors[priorite]} className="priority-tag">
            {priorite}
          </Tag>
        )
      },
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      render: (statut, record) => {
        const colors = {
          OUVERT: "red",
          EN_COURS: "orange",
        }

        // Si le statut est OUVERT, afficher un bouton cliquable avec animation
        if (statut === "OUVERT") {
          return (
            <Button
              type="primary"
              size="small"
              danger
              onClick={() => handleAssignTicket(record)}
              className="status-button status-button-open"
              icon={<ClockCircleOutlined />}
            >
              OUVERT
            </Button>
          )
        }

        // Sinon, afficher le tag normal
        return (
          <Tag color={colors[statut]} className="ticket-status">
            {statut}
          </Tag>
        )
      },
    },
    {
      title: "Date création",
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 120,
      render: (date) => <span className="ticket-date">{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: "Technicien",
      dataIndex: "technicien",
      key: "technicien",
      width: 140,
      render: (technicien) => (
        <span className="ticket-tech">{technicien ? `${technicien.prenom} ${technicien.nom}` : "-"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Tooltip title="Résoudre">
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolveTicket(record)}
              className="action-btn resolve-btn"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTicket(record)}
              className="action-btn delete-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Colonnes pour les tickets résolus
  const resolvedTicketColumns = [
    {
      title: "Matériel",
      dataIndex: "materiel",
      key: "materiel",
      width: 200,
      render: (materiel) => (
        <span className="ticket-material">{materiel ? `${materiel.marque} ${materiel.modele}` : "N/A"}</span>
      ),
    },
    {
      title: "Déclarant",
      dataIndex: "declarant",
      key: "declarant",
      width: 150,
      render: (declarant) => (
        <span className="ticket-user">{declarant ? `${declarant.prenom} ${declarant.nom}` : "N/A"}</span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (text) => (
        <Tooltip title={text}>
          <span className="ticket-description">{text && text.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Priorité",
      dataIndex: "priorite",
      key: "priorite",
      width: 100,
      render: (priorite) => {
        const colors = {
          BASSE: "green",
          MOYENNE: "orange",
          HAUTE: "red",
        }
        return (
          <Tag color={colors[priorite]} className="priority-tag">
            {priorite}
          </Tag>
        )
      },
    },
    {
      title: "Date création",
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 120,
      render: (date) => <span className="ticket-date">{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: "Date résolution",
      dataIndex: "dateResolution",
      key: "dateResolution",
      width: 130,
      render: (date) => {
        return <span className="ticket-date">{date ? new Date(date).toLocaleDateString() : "-"}</span>
      },
    },
    {
      title: "Technicien",
      dataIndex: "technicien",
      key: "technicien",
      width: 140,
      render: (technicien) => (
        <span className="ticket-tech">{technicien ? `${technicien.prenom} ${technicien.nom}` : "-"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Tooltip title="Supprimer">
            <Button
              type="link"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTicket(record)}
              className="action-btn delete-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Fonctions de gestion des matériels
  const handleAddMaterial = () => {
    setSelectedMaterial(null)
    materialForm.resetFields()
    setMaterialModalVisible(true)
  }
 const handleGenerateReport = async (material) => {
    try {
      message.loading("Génération du rapport PDF...", 0);
      const pdfBlob = await MaterialService.generateMaterialReport(material.id);
      message.destroy(); // Hide loading message

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_materiel_${material.numeroSerie}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success("Rapport PDF généré et téléchargé avec succès !");
    } catch (error) {
      message.destroy(); // Hide loading message
      console.error("Erreur lors de la génération du rapport PDF:", error);
      message.error("Erreur lors de la génération du rapport PDF.");
    }
  };
  const handleEditMaterial = (material) => {
    setSelectedMaterial(material)
    materialForm.setFieldsValue({
      ...material,
      dateAchat: material.dateAchat ? dayjs(material.dateAchat) : null,
    })
    setMaterialModalVisible(true)
  }

  const handleDeleteMaterial = (material) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: `Êtes-vous sûr de vouloir supprimer le matériel ${material.marque} ${material.modele} ?`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      className: isLightMode ? 'modal-light' : 'modal-dark',
      onOk: async () => {
        try {
          await MaterialService.deleteMaterial(material.id)
          message.success("Matériel supprimé avec succès")
          await loadMaterials()
          await loadAssignedMaterials()
          await updateStats()
        } catch (error) {
          message.error("Erreur lors de la suppression")
        }
      },
    })
  }

  // Update handleTerminateAssignment function
  const handleTerminateAssignment = (material) => {
    setSelectedMaterial(material)
    setSelectedAffectation(material)

    // Get user info for display
    let userInfo = "Utilisateur inconnu"
    if (material.utilisateurActuel) {
      const nom = material.utilisateurActuel.nom || ""
      const prenom = material.utilisateurActuel.prenom || ""
      const nomUtilisateur = material.utilisateurActuel.nomDeUtilisateur || ""

      userInfo = prenom && nom ? `${prenom} ${nom}` : nomUtilisateur || "Utilisateur inconnu"
    }

    terminationForm.resetFields()
    terminationForm.setFieldsValue({
      materielInfo: `${material.marque} ${material.modele}`,
      utilisateurInfo: userInfo,
      dateFin: dayjs(), // Default to today
    })
    setTerminationModalVisible(true)
  }

  const handleDeclarerPanne = async (material) => {
    try {
      // Vérifier si le matériel a déjà un ticket ouvert
      const hasOpenTicket = await MaterialService.checkMaterialHasOpenTicket(material.id)

      if (hasOpenTicket) {
        Modal.warning({
          title: "Ticket déjà existant",
          content: `Ce matériel a déjà un ticket de panne ouvert ou en cours. Vous ne pouvez pas créer un nouveau ticket tant que le précédent n'est pas résolu.`,
          okText: "Compris",
          className: isLightMode ? 'modal-light' : 'modal-dark',
        })
        return
      }

      // Si pas de ticket ouvert, procéder normalement
      setSelectedMaterial(material)
      ticketForm.resetFields()
      ticketForm.setFieldsValue({
        materielInfo: `${material.marque} ${material.modele}`,
        // Remove materielId from form - it will be passed separately
        // declarantId will be set automatically to current user
      })
      setTicketModalVisible(true)
    } catch (error) {
      console.error("Erreur lors de la vérification des tickets:", error)
      message.error("Erreur lors de la vérification des tickets existants")
    }
  }

  const handleAffecterMaterial = (material) => {
    // Vérifier si le matériel peut être affecté
    if (!canAssignMaterial(material)) {
      Modal.warning({
        title: "Affectation impossible",
        content: `Ce matériel ne peut pas être affecté car il est actuellement ${material.etat === "EN_PANNE" ? "en panne" : "en réparation"}. Veuillez d'abord résoudre les problèmes techniques.`,
        okText: "Compris",
        className: isLightMode ? 'modal-light' : 'modal-dark',
      })
      return
    }

    setSelectedMaterial(material)
    affectationForm.resetFields()
    affectationForm.setFieldsValue({
      materielId: material.id,
      materielInfo: `${material.marque} ${material.modele}`,
    })
    setAffectationModalVisible(true)
  }

  const handleShowHistorique = async (material) => {
    setSelectedMaterial(material)
    try {
      const history = await MaterialService.getMaterialHistory(material.id)
      setHistorique(history)
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
      setHistorique([])
    }
    setHistoriqueModalVisible(true)
  }

  // Fonctions de gestion des tickets
  const handleResolveTicket = (ticket) => {
    console.log("Ticket object for resolution:", ticket)
    const ticketId = ticket.id || ticket.ticketId || ticket.numeroTicket

    // Utiliser l'utilisateur connecté comme technicien
    const technicienId = currentUser?.id // Changement ici

    if (!ticketId) {
      message.error("Impossible de résoudre : ID du ticket introuvable")
      return
    }

    if (!technicienId) {
      message.error("Utilisateur non connecté") // Message d'erreur modifié
      return
    }

    Modal.confirm({
      title: "Résoudre le ticket",
      content: `Marquer le ticket #${ticketId} comme résolu ?`,
      okText: "Résoudre",
      cancelText: "Annuler",
      className: isLightMode ? 'modal-light' : 'modal-dark',
      onOk: async () => {
        try {
          // 1. Résolution du ticket avec l'ID de l'utilisateur connecté
          await MaterialService.resolveTicket(ticketId, technicienId)

          // 2. Mise à jour de l'état du matériel
          if (ticket.materiel && ticket.materiel.id) {
            await MaterialService.updateMaterialState(ticket.materiel.id, "FONCTIONNEL")
          }

          message.success("Ticket résolu avec succès - Matériel remis en service")

          // 3. Rafraîchir les données
          await loadTickets()
          await loadMaterials()
          await loadAssignedMaterials()
          await updateStats()
        } catch (error) {
          message.error("Erreur lors de la résolution du ticket")
          console.error("Resolve error:", error)
        }
      },
      bodyStyle: {
      backgroundColor: isLightMode ? '#fff' : '#273142',
      color: isLightMode ? '#000' : '#fff'
    }
    })
  }
  const handleDeleteTicket = (ticket) => {
    console.log("Ticket object for deletion:", ticket) // Debug log
    console.log("Ticket ID:", ticket.id) // Debug log

    // Check if ticket has id property, if not, try other possible ID fields
    const ticketId = ticket.id || ticket.ticketId || ticket.numeroTicket

    if (!ticketId) {
      message.error("Impossible de supprimer : ID du ticket introuvable")
      return
    }

    Modal.confirm({
      title: "Confirmer la suppression",
      content: `Êtes-vous sûr de vouloir supprimer le ticket #${ticketId} ?`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      className: isLightMode ? 'modal-light' : 'modal-dark',
      onOk: async () => {
        try {
          await MaterialService.deleteTicket(ticketId)
          message.success("Ticket supprimé avec succès")
          await loadTickets()
          await updateStats()
        } catch (error) {
          message.error("Erreur lors de la suppression")
          console.error("Delete error:", error)
        }
      },
      bodyStyle: {
      backgroundColor: isLightMode ? '#fff' : '#273142',
      color: isLightMode ? '#000' : '#fff'
    }
    })
  }

  const handleAssignTicket = async (ticket) => {
    console.log("Assigning ticket to current user:", ticket)

    const ticketId = ticket.id || ticket.ticketId || ticket.numeroTicket

    if (!ticketId) {
      message.error("Impossible d'assigner : ID du ticket introuvable")
      return
    }

    if (!currentUser || !currentUser.id) {
      message.error("Utilisateur non connecté")
      return
    }

    Modal.confirm({
      title: "Prendre en charge le ticket",
      content: `Voulez-vous prendre en charge le ticket #${ticketId} ?`,
      okText: "Prendre en charge",
      cancelText: "Annuler",
      className: isLightMode ? 'modal-light' : 'modal-dark',
      onOk: async () => {
        try {
          // 1. Assigner le technicien au ticket (change le statut à EN_COURS)
          await MaterialService.assignTechnicienToTicket(ticketId, currentUser.id)

          // 2. Changer l'état du matériel à EN_REPARATION
          if (ticket.materiel && ticket.materiel.id) {
            await MaterialService.updateMaterialState(ticket.materiel.id, "EN_REPARATION")
          }

          message.success("Ticket pris en charge avec succès - Matériel mis en réparation")

          // Recharger toutes les données
          await loadTickets()
          await loadMaterials()
          await loadAssignedMaterials()
          await updateStats()
        } catch (error) {
          message.error("Erreur lors de la prise en charge du ticket")
          console.error("Assign error:", error)
        }
      },
      bodyStyle: {
      backgroundColor: isLightMode ? '#fff' : '#273142',
      color: isLightMode ? '#000' : '#fff'
    }
    })
  }

  const handleSaveMaterial = async (values) => {
    try {
      const materialData = {
        ...values,
        dateAchat: values.dateAchat ? values.dateAchat.format("YYYY-MM-DD") : null,
      }

      if (selectedMaterial) {
        await MaterialService.updateMaterial(selectedMaterial.id, materialData)
        message.success("Matériel modifié avec succès")
      } else {
        await MaterialService.createMaterial(materialData)
        message.success("Matériel ajouté avec succès")
      }

      setMaterialModalVisible(false)
      materialForm.resetFields()
      await loadMaterials()
      await loadAssignedMaterials()
      await updateStats()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      message.error("Erreur lors de la sauvegarde")
    }
  }

  const handleSaveTicket = async (values) => {
    try {
      const ticketData = {
        description: values.description,
        priorite: values.priorite,
        statut: selectedTicket ? values.statut : "OUVERT",
        materielId: selectedMaterial ? selectedMaterial.id : values.materielId,
        declarantId: currentUser.id,
        dateCreation: selectedTicket ? selectedTicket.dateCreation : new Date().toISOString(),
      }
      console.log("Ticket data to be sent:", ticketData)

      let response
      if (selectedTicket) {
        response = await MaterialService.updateTicket(selectedTicket.id, ticketData)
        message.success("Ticket modifié avec succès")
      } else {
        response = await MaterialService.createTicket(ticketData)
        console.log("Ticket created, API response:", response)
        message.success("Ticket créé avec succès")
      }

      setTicketModalVisible(false)
      ticketForm.resetFields()
      await loadTickets()
      await updateStats()

      // Mettre à jour l'état du matériel seulement si ce n'est pas déjà en panne
      const materialId = selectedMaterial ? selectedMaterial.id : values.materielId
      if (materialId) {
        const material = [...materials, ...assignedMaterials].find((m) => m.id === materialId)
        if (material && material.etat !== "EN_PANNE") {
          await MaterialService.updateMaterialState(materialId, "EN_PANNE")
          await loadMaterials()
          await loadAssignedMaterials()
        }
      }
    } catch (error) {
      message.error("Erreur lors de la sauvegarde du ticket")
      console.error("Erreur lors de la sauvegarde du ticket:", error)
    }
  }

  const handleSaveAffectation = async (values) => {
    try {
      await MaterialService.createAffectation(
        values.materielId,
        values.utilisateurId,
        currentUser.id, // technicienId - using current user as technician
        dayjs(values.dateDebut),
        values.motif,
      )
      message.success("Affectation créée avec succès")
      setAffectationModalVisible(false)
      affectationForm.resetFields()
      await loadMaterials()
      await loadAssignedMaterials()
      await updateStats()
    } catch (error) {
      message.error("Erreur lors de l'affectation")
    }
  }

  // Add handleSaveTermination function
  const handleSaveTermination = async (values) => {
    try {
      await MaterialService.terminateAffectation(
        selectedAffectation.affectationId,
        currentUser.id, // technicienId - using current user as technician
        values.dateFin,
        values.commentaire,
      )
      message.success("Affectation terminée avec succès")
      setTerminationModalVisible(false)
      terminationForm.resetFields()
      await loadMaterials()
      await loadAssignedMaterials()
      await updateStats()
    } catch (error) {
      message.error("Erreur lors de la terminaison de l'affectation")
    }
  }

  const filteredMaterials = materials.filter((material) => {
    if (!material) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      (material.marque && material.marque.toLowerCase().includes(searchLower)) ||
      (material.modele && material.modele.toLowerCase().includes(searchLower)) ||
      (material.numeroSerie && material.numeroSerie.toLowerCase().includes(searchLower)) ||
      (material.type && material.type.toLowerCase().includes(searchLower))
    )
  })

  const filteredAssignedMaterials = assignedMaterials.filter((material) => {
    if (!material) return false
    const searchLower = searchTerm.toLowerCase()

    // Handle different user data structures
    let userMatch = false
    if (material.utilisateurActuel) {
      if (typeof material.utilisateurActuel === "object") {
        const userName =
          `${material.utilisateurActuel.prenom || ""} ${material.utilisateurActuel.nom || ""}`.toLowerCase()
        const userLogin = (material.utilisateurActuel.nomDeUtilisateur || "").toLowerCase()
        userMatch = userName.includes(searchLower) || userLogin.includes(searchLower)
      }
    }

    return (
      (material.marque && material.marque.toLowerCase().includes(searchLower)) ||
      (material.modele && material.modele.toLowerCase().includes(searchLower)) ||
      (material.numeroSerie && material.numeroSerie.toLowerCase().includes(searchLower)) ||
      (material.type && material.type.toLowerCase().includes(searchLower)) ||
      userMatch
    )
  })

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={
            <span className={isLightMode ? "card-title-light" : "card-title-dark"}>
              Gestion du Matériel - Technicien
            </span>
          }
          extra={
         <Input 
                        placeholder="Rechercher par marque, modèle, n° série ou type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                        prefix={<SearchOutlined style={{ color: isLightMode ? "#000" : "#ccc" }} />}
                        style={{
                          backgroundColor: isLightMode ? "#f8f9fa" : "#273142",
                          color: isLightMode ? "#000" : "#fff",
                          borderRadius: "6px",
                          border: "1px solid #d9d9d9",
                          width: "360px", // ou fixe si tu préfères
                        }}
                      />
          }
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
        >
          {/* Statistiques */}
          <div className="stats-grid-modern">
            <StatCard title="Total Matériels" value={stats.total} trend="up" type="total" />
            <StatCard title="En Panne" value={stats.enPanne} trend="down" type="broken" />
            <StatCard title="En Réparation" value={stats.enReparation} trend="up" type="repair" />
            <StatCard title="Tickets Actifs" value={stats.ticketsOuverts} trend="up" type="tickets" />
          </div>

          {/* Onglets pour les matériels */}
          <Tabs activeKey={activeTab} onChange={setActiveTab} className="materials-tabs">
            <TabPane tab="Matériels Disponibles" key="disponibles">
              <Card
                title="Liste des Matériels Disponibles"
                 className={isLightMode ? "card-light" : "card-dark"}
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="header-action-btn"
                    onClick={handleAddMaterial}
                  >
                    Ajouter Matériel
                  </Button>
                }
              >
                {filteredMaterials.length === 0 ? (
                  <Empty description="Aucun matériel disponible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    columns={materialColumns}
                    dataSource={filteredMaterials}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} matériels`,
                    }}
                    className="materials-table"
                    rowClassName={getRowClassName}
                  />
                )}
              </Card>
            </TabPane>

            <TabPane tab="Matériels Affectés" key="affectes">
              <Card title="Liste des Matériels Affectés"  className={isLightMode ? "card-light" : "card-dark"}>
                {filteredAssignedMaterials.length === 0 ? (
                  <Empty description="Aucun matériel affecté" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    columns={assignedMaterialColumns}
                    dataSource={filteredAssignedMaterials}
                    rowKey="id"
                    loading={assignedLoading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} matériels affectés`,
                    }}
                    className="assigned-materials-table"
                    rowClassName={getRowClassName}
                    scroll={{ x: 1400 }}
                  />
                )}
              </Card>
            </TabPane>
          </Tabs>

          {/* Tickets de panne avec onglets séparés */}
          <Card title="Gestion des Tickets"  className={isLightMode ? "card-light" : "card-dark"}>
            <Tabs activeKey={activeTicketTab} onChange={setActiveTicketTab} className="tickets-tabs">
              <TabPane
                tab={
                  <span>
                    Tickets Actifs
                    {tickets.length > 0 && <span className="ticket-count-badge">{tickets.length}</span>}
                  </span>
                }
                key="actifs"
              >
                {tickets.length === 0 ? (
                  <Empty description="Aucun ticket actif" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    columns={activeTicketColumns}
                    dataSource={tickets}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="tickets-table"
                    rowClassName={(record) => `ticket-row ${record.statut ? record.statut.toLowerCase() : ""}`}
                    scroll={{ x: 1200 }}
                  />
                )}
              </TabPane>

              <TabPane tab={<span>Tickets Résolus</span>} key="resolus">
                {resolvedTickets.length === 0 ? (
                  <Empty description="Aucun ticket résolu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    columns={resolvedTicketColumns}
                    dataSource={resolvedTickets}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    className="tickets-table resolved-tickets"
                    rowClassName="ticket-row resolved"
                    scroll={{ x: 1200 }}
                  />
                )}
              </TabPane>
            </Tabs>
          </Card>

          {/* Modal Matériel */}
          <Modal
            title={selectedMaterial ? "Modifier Matériel" : "Ajouter Matériel"}
            open={materialModalVisible}
            onCancel={() => setMaterialModalVisible(false)}
            footer={null}
            width={600}
             className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          >
            <Form form={materialForm} layout="vertical" onFinish={handleSaveMaterial} className="material-form">
              <div className="form-row">
                <Form.Item
                  name="numeroSerie"
                  label="Numéro de Série"
                  rules={[{ required: true, message: "N° série requis" }, { validator: validateSerialNumber }]}
                >
                  <Input placeholder="Ex: DL123456789"  style={{backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50"}}/>
                </Form.Item>
                <Form.Item name="marque" label="Marque" rules={[{ required: true, message: "Marque requise" }]}>
                  <Input placeholder="Ex: Dell, HP, Sony..." style={{backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50"}}/>
                </Form.Item>
              </div>

              <div className="form-row">
                <Form.Item name="modele" label="Modèle">
                  <Input placeholder="Ex: Optiplex 7090" style={{backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50"}}/>
                </Form.Item>
                <Form.Item name="type" label="Type" rules={[{ required: true, message: "Type requis" }]}>
                  <Select placeholder="Sélectionner le type"  className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                    <Option value="ORDINATEUR">Ordinateur</Option>
                    <Option value="CASQUE">Casque</Option>
                    <Option value="LOGICIEL">Logiciel</Option>
                    <Option value="PERIPHERIQUE">Périphérique</Option>
                    <Option value="SERVEUR">Serveur</Option>
                    <Option value="RESEAU">Réseau</Option>
                  </Select>
                </Form.Item>
              </div>

              <div className="form-row">
                <Form.Item name="etat" label="État" rules={[{ required: true, message: "État requis" }]}>
                  <Select placeholder="Sélectionner l'état"  className={isLightMode ? "select-light" : "select-dark"}
                 dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                    <Option value="FONCTIONNEL">Fonctionnel</Option>
                    <Option value="EN_PANNE">En Panne</Option>
                    <Option value="EN_REPARATION">En Réparation</Option>
                    <Option value="HORS_SERVICE">Hors Service</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="dureeGarantie"
                  label="Durée Garantie (mois)"
                  rules={[{ validator: validateWarrantyDuration }]}
                >
                  <Input type="number" placeholder="Ex: 24" min="0" max="120"  style={{backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50"}}/>
                </Form.Item>
              </div>

              <Form.Item
                name="dateAchat"
                label="Date d'Achat"
                rules={[{ required: true, message: "Date d'achat requise" }, { validator: validatePurchaseDate }]}
              >
                <DatePicker
                  style={{ width: "100%",backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50" }}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => current && current > dayjs().endOf("day")} 
                  className="date-picker"
                />
              </Form.Item>

              <div className="modal-actions">
                <Button onClick={() => setMaterialModalVisible(false)} className="cancel-btn">
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit" className="submit-btn">
                  {selectedMaterial ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal Ticket */}
          <Modal
            title={selectedTicket ? "Modifier Ticket" : "Créer un Ticket"}
            open={ticketModalVisible}
            onCancel={() => setTicketModalVisible(false)}
            footer={null}
            width={700}
             className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          >
            <Form form={ticketForm} layout="vertical" onFinish={handleSaveTicket}>
              {!selectedMaterial ? (
                <Form.Item
                  name="materielId"
                  label="Matériel"
                  rules={[{ required: true, message: "Veuillez sélectionner un matériel" }]}
                >
                  <Select placeholder="Sélectionner un matériel"  
                  className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                    {[...materials, ...assignedMaterials].map((material) => (
                      <Option key={material.id} value={material.id}>
                        {material.marque} {material.modele} ({material.numeroSerie})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item name="materielInfo" label="Matériel">
                  <Input disabled placeholder="Matériel sélectionné" />
                </Form.Item>
              )}

              <Form.Item name="priorite" label="Priorité" rules={[{ required: true, message: "Priorité requise" }]}>
                <Select placeholder="Sélectionner la priorité" className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                  <Option value="BASSE">Basse</Option>
                  <Option value="MOYENNE">Moyenne</Option>
                  <Option value="HAUTE">Haute</Option>
                </Select>
              </Form.Item>

              {selectedTicket && (
                <Form.Item name="statut" label="Statut">
                  <Select placeholder="Sélectionner le statut">
                    <Option value="OUVERT">Ouvert</Option>
                    <Option value="EN_COURS">En cours</Option>
                    <Option value="RESOLU">Résolu</Option>
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                name="description"
                label="Description du Problème"
                rules={[{ required: true, message: "Description requise" }]}
              >
                <Input.TextArea rows={4} placeholder="Décrivez le problème rencontré..." style={{backgroundColor: isLightMode ? "white" : "#2c3e50"}}/>
              </Form.Item>

              <div className="modal-actions">
                <Button onClick={() => setTicketModalVisible(false)}>Annuler</Button>
                <Button type="primary" htmlType="submit">
                  {selectedTicket ? "Modifier" : "Créer Ticket"}
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal Affectation */}
          <Modal
            title="Affecter Matériel"
            open={affectationModalVisible}
            onCancel={() => setAffectationModalVisible(false)}
            footer={null}
             className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
            
          >
            <Form form={affectationForm} layout="vertical" onFinish={handleSaveAffectation}>
              <Form.Item name="materielId" label="ID Matériel" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="materielInfo" label="Matériel">
                <Input disabled />
              </Form.Item>
              {/* Update the user selection in affectation form to show more user info */}
              <Form.Item
                name="utilisateurId"
                label="Utilisateur"
                rules={[{ required: true, message: "Utilisateur requis" }]}
              >
                <Select
                  placeholder="Sélectionner un utilisateur"
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                >
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.prenom} {user.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="dateDebut"
                label="Date de début"
                rules={[{ required: true, message: "Date de début requise" }]}
              >
                <DatePicker style={{ width: "100%" ,backgroundColor: isLightMode ? "white" : "#2c3e50" }} format="DD/MM/YYYY"   />
              </Form.Item>
              <Form.Item
                name="motif"
                label="Motif de l'Affectation"
                rules={[{ required: true, message: "Motif requis" }]}
              >
                <Input placeholder="Ex: Nouveau poste, remplacement..." style={{ backgroundColor: isLightMode ? "white" : "#2c3e50" }}/>
              </Form.Item>
              <div className="modal-actions">
                <Button onClick={() => setAffectationModalVisible(false)}>Annuler</Button>
                <Button type="primary" htmlType="submit">
                  Affecter
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal Termination d'Affectation */}
          <Modal
            title="Terminer l'Affectation"
            open={terminationModalVisible}
            onCancel={() => setTerminationModalVisible(false)}
            footer={null}
             className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          >
            <Form form={terminationForm} layout="vertical" onFinish={handleSaveTermination}>
              <Form.Item name="materielInfo" label="Matériel">
                <Input disabled  />
              </Form.Item>
              <Form.Item name="utilisateurInfo" label="Utilisateur Actuel">
                <Input disabled />
              </Form.Item>
              <Form.Item
                name="dateFin"
                label="Date de fin d'affectation"
                rules={[{ required: true, message: "Date de fin requise" }]}
              >
                <DatePicker
                  style={{ width: "100%" ,backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50"}}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              </Form.Item>
              <Form.Item
                name="commentaire"
                label="Commentaire"
                rules={[{ required: true, message: "Commentaire requis" }]}
              >
                <Input.TextArea
                style={{  backgroundColor: isLightMode ? "#f8f9fa" : "#2c3e50"}}
                  rows={3}
                  placeholder="Raison de la fin d'affectation (ex: Changement de poste, démission, etc.)"
                />
              </Form.Item>
              <div className="modal-actions">
                <Button onClick={() => setTerminationModalVisible(false)}>Annuler</Button>
                <Button type="primary" htmlType="submit" danger>
                  Terminer l'Affectation
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Modal Historique */}
          <Modal
            title={`Historique - ${selectedMaterial?.numeroSerie}`}
            open={historiqueModalVisible}
            onCancel={() => setHistoriqueModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setHistoriqueModalVisible(false)}>
                Fermer
              </Button>,
            ]}
            width={800}
             className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          >
            <Table
             className={isLightMode ? 'table-light' : 'table-dark'}
              columns={[
                {
                  title: "Utilisateur",
                  dataIndex: "utilisateur",
                  key: "utilisateur",
                  render: (utilisateur) => {
                    if (!utilisateur) return "-"

                    // If utilisateur is just an ID number
                    if (typeof utilisateur === "number") {
                      // Try to find user in our users array
                      const user = users.find((u) => u.id === utilisateur)
                      if (user) {
                        return `${user.prenom} ${user.nom}`
                      }
                      return `Utilisateur #${utilisateur}`
                    }

                    // If utilisateur is an object
                    return utilisateur.prenom && utilisateur.nom
                      ? `${utilisateur.prenom} ${utilisateur.nom}`
                      : utilisateur.nomDeUtilisateur || "Utilisateur inconnu"
                  },
                },
                {
                  title: "Date Début",
                  dataIndex: "dateDebut",
                  key: "dateDebut",
                  render: (date) => new Date(date).toLocaleDateString(),
                },
                {
                  title: "Date Fin",
                  dataIndex: "dateFin",
                  key: "dateFin",
                  render: (date) => (date ? new Date(date).toLocaleDateString() : "En cours"),
                },
              ]}
              dataSource={historique}
              rowKey="id"
              pagination={false}
             
            />
          </Modal>
        </Card>
      </Content>
    </Layout>
  )
}
