
import { useState, useEffect } from "react"
import {
  Layout,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Select,
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

const API_BASE_URL = "http://localhost:8081/api"
const { Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input
const { TabPane } = Tabs

// Fonctions utilitaires
const getTypeLabel = (demande) => demande.type || "Type non défini"
const formatDateDemandee = (demande) =>
  demande.dateDemande ? dayjs(demande.dateDemande).format("DD/MM/YYYY") : "Date non définie"
const getStatutLabel = (statut) => statut || "Statut non défini"
const getAvatarFromName = (nom) => nom.charAt(0).toUpperCase()

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

export default function AdminDashboard() {
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [actionType, setActionType] = useState("")
  const [form] = Form.useForm()
  const { isLightMode } = useTheme()
  const { user, isAuthenticated } = useAuth()

  // États pour toutes les demandes combinées
  const [toutesLesDemandes, setToutesLesDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Vérifier les permissions admin
  const isAdmin = user?.role === "ADMIN"

  // Charger les demandes au montage du composant
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAllDemandes()
    }
  }, [isAuthenticated, isAdmin])

  const loadAllDemandes = async () => {
    setLoading(true)
    try {
      console.log("Chargement des demandes pour ADMIN...")
      // Charger tous les types de demandes en parallèle
      const [conges, absences, documents] = await Promise.all([
        demandeService.getAllDemandeConges(user),
        demandeService.getAllDemandeAbsences(user),
        demandeService.getAllDemandeDocuments(user),
      ])

      console.log("Demandes chargées:", {
        conges: conges.length,
        absences: absences.length,
        documents: documents.length,
      })

      // Enrichir chaque type avec les informations utilisateur
      const enrichedConges = await enrichirAvecUtilisateurs(conges, "Congé")
      const enrichedAbsences = await enrichirAvecUtilisateurs(absences, "Absence")
      const enrichedDocuments = await enrichirAvecUtilisateurs(documents, "Document")

      // Combiner toutes les demandes
      const toutesLesDemandesCombiners = [...enrichedConges, ...enrichedAbsences, ...enrichedDocuments]

      console.log("Total demandes combinées:", toutesLesDemandesCombiners.length)
      setToutesLesDemandes(toutesLesDemandesCombiners)
      setFilteredDemandes(toutesLesDemandesCombiners)
    } catch (error) {
      message.error("Erreur lors du chargement des demandes")
      console.error("Erreur détaillée:", error)
    } finally {
      setLoading(false)
    }
  }

  const enrichirAvecUtilisateurs = async (demandes, typeCategorie) => {
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
          return mapDemandeAvecUtilisateur(demandeEnrichie, typeCategorie)
        } catch (error) {
          console.error(`Erreur lors du chargement de l'utilisateur ${demande.utilisateur?.id}:`, error)
          return mapDemandeAvecUtilisateur(demande, typeCategorie)
        }
      }),
    )
  }

  // Fonction pour mapper les demandes avec informations utilisateur complètes
  const mapDemandeAvecUtilisateur = (demande, typeCategorie) => ({
    id: demande.id,
    type: typeCategorie,
    typeDetaille: getTypeCongeLabel(demande.type, demande.autretype),
    employe:
      demande.utilisateur?.nom && demande.utilisateur?.prenom
        ? `${demande.utilisateur.prenom} ${demande.utilisateur.nom}`
        : demande.utilisateur?.nom || "Utilisateur inconnu",
    service: demande.utilisateur?.service || "Service non défini",
    email: demande.utilisateur?.email || "Email non défini",
    telephone: demande.utilisateur?.telephone || "Téléphone non défini",
    dateCreation: demande.dateDemande ? dayjs(demande.dateDemande).format("DD/MM/YYYY") : "Date non définie",
    dateDemandee: formatDateDemandee(demande),
    statut: getStatutLabel(demande.statut),
    priorite: demande.estUrgente ? "Urgente" : "Normale",
    details: demande.commentaire || "Aucun détail",
    avatar: getAvatarFromName(demande.utilisateur?.nom || "U"),
    manager: demande.utilisateur?.manager || "Manager non défini",
    originalData: demande, // Garder les données originales
  })

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

  const columns = [
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
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => {
        const colors = {
          Congé: "#764ba2",
          Absence: "#52c41a",
          Document: "#fa8c16",
        }
        return <Tag color={colors[type]}>{type}</Tag>
      },
    },
    {
      title: "Détail",
      dataIndex: "typeDetaille",
      key: "typeDetaille",
      width: 180,
      render: (typeDetaille) => <Tag color="#1890ff">{typeDetaille}</Tag>,
    },
    {
      title: "Date création",
      dataIndex: "dateCreation",
      key: "dateCreation",
      width: 120,
    },
    {
      title: "Période/Horaires",
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
        if (originalData?.heureDebut && originalData?.heureFin) {
          const date = originalData.dateDebut ? dayjs(originalData.dateDebut).format("DD/MM/YYYY") : "Date inconnue"
          return (
            <div>
              <div>
                <CalendarOutlined /> {date}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {originalData.heureDebut} - {originalData.heureFin}
              </Text>
            </div>
          )
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
      title: "Priorité",
      dataIndex: "priorite",
      key: "priorite",
      width: 100,
      render: (priorite) => <Tag color={priorite === "Urgente" ? "red" : "default"}>{priorite}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => {
        // Modifier la condition pour inclure les demandes validées par RH
        const peutValiderDirection = record.statut === "TRANSMISE_DIRECTION" || record.statut === "VALIDEE_RH"
        return (
          <Space>
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleVoirDetails(record)}>
              Examiner
            </Button>
            {peutValiderDirection && (
              <>
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  style={{ color: "#52c41a" }}
                  onClick={() => handleAction(record, "valider_direction")}
                >
                  Valider
                </Button>
                <Button
                  type="link"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => handleAction(record, "refuser_direction")}
                >
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
      console.error("Erreur:", error)
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
      if (actionType.includes("direction")) {
        const estValidee = actionType === "valider_direction"
        await demandeService.traiterDemandeDirection(selectedDemande.id, estValidee, commentaire, user)
        message.success(`Demande ${estValidee ? "validée" : "refusée"} par la Direction avec succès!`)
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

  const handleFilter = (filterType, value) => {
    let filtered = [...toutesLesDemandes]
    if (value && value !== "all") {
      switch (filterType) {
        case "type":
          filtered = filtered.filter((d) => d.type.toLowerCase().includes(value))
          break
        case "statut":
          if (value === "attente") {
            filtered = filtered.filter((d) => d.statut.includes("EN_ATTENTE") || d.statut.includes("TRANSMISE") || d.statut.includes("VALIDEE_RH"))
          } else if (value === "valide") {
            filtered = filtered.filter((d) => d.statut.includes("VALIDEE"))
          } else if (value === "refuse") {
            filtered = filtered.filter((d) => d.statut.includes("REFUSEE"))
          }
          break
        case "service":
          filtered = filtered.filter((d) => d.service.toLowerCase().includes(value))
          break
      }
    }
    setFilteredDemandes(filtered)
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

  // Fonction pour obtenir le titre de l'action
  const getActionTitle = (action) => {
    switch (action) {
      case "valider_direction":
        return "Valider la demande (Direction)"
      case "refuser_direction":
        return "Refuser la demande (Direction)"
      default:
        return "Action sur la demande"
    }
  }

  // Fonction pour obtenir la couleur du bouton
  const getActionButtonColor = (action) => {
    switch (action) {
      case "valider_direction":
        return "#52c41a"
      case "refuser_direction":
        return "#ff4d4f"
      default:
        return "#1890ff"
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

  if (!isAdmin) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <Card className={isLightMode ? "card-light" : "card-dark"}>
            <Alert
              message="Permissions insuffisantes"
              description="Vous n'avez pas les permissions nécessaires pour accéder à l'administration."
              type="error"
              showIcon
            />
          </Card>
        </Content>
      </Layout>
    )
  }

  // Compter les demandes en attente pour la Direction (inclure VALIDEE_RH)
  const demandesEnAttenteDirection = filteredDemandes.filter((d) => 
    d.statut === "TRANSMISE_DIRECTION" || d.statut === "VALIDEE_RH"
  ).length

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
              Actualiser
            </Button>
          }
          className={isLightMode ? "card-light" : "card-dark"}
        >
          <div style={{ marginBottom: "16px" }}>
            <Space wrap>
              <Select
                placeholder="Filtrer par type"
                style={{ width: 150 }}
                onChange={(value) => handleFilter("type", value)}
                options={[
                  { value: "all", label: "Tous" },
                  { value: "congé", label: "Congés" },
                  { value: "absence", label: "Absences" },
                  { value: "document", label: "Documents" },
                ]}
                  className={isLightMode ? "select-light" : "select-dark"}
          dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
              />
              <Select
                placeholder="Filtrer par statut"
                style={{ width: 180 }}
                onChange={(value) => handleFilter("statut", value)}
                options={[
                  { value: "all", label: "Tous" },
                  { value: "attente", label: "En attente" },
                  { value: "valide", label: "Validé" },
                  { value: "refuse", label: "Refusé" },
                ]}
                  className={isLightMode ? "select-light" : "select-dark"}
          dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
              />
            </Space>
          </div>

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={filteredDemandes}
              rowKey="id"
              scroll={{ x: 1600, y: 500 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} demandes`,
              }}
              locale={{
                emptyText: loading ? "Chargement..." : "Aucune demande trouvée",
              }}
            />
          </Spin>
        </Card>

        {/* Modal pour voir les détails et actions */}
        <Modal
        style={{
                top: 20
                  }}
        className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
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
                  {actionType === "valider_direction" ? "Valider" : "Refuser"}
                </Button>
              </Space>
            ) : (
              <Button type="primary" onClick={() => setModalVisible(false)}>
                Fermer
              </Button>
            )
          }
          width={800}
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
                      <Tag color="#764ba2">{selectedDemande.typeDetaille}</Tag>
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
                    <Descriptions.Item label="Date de demande">
                      {selectedDemande.originalData?.dateDemande
                        ? dayjs(selectedDemande.originalData.dateDemande).format("DD/MM/YYYY")
                        : "Non définie"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Statut">
                      <Tag color="purple">{selectedDemande.statut}</Tag>
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
                    label={`Commentaire Direction (${user?.nom || "Administrateur"})`}
                    rules={[{ required: true, message: "Veuillez ajouter un commentaire" }]}
                  >
                    <TextArea
                    style={{backgroundColor: isLightMode ? "#f5f5f5" : "#273142"}}
                      rows={4}
                      placeholder={`Commentaire pour ${
                        actionType === "valider_direction" ? "la validation" : "le refus"
                      }...`}
                    />
                  </Form.Item>
                  {actionType === "valider_direction" && (
                    <Alert
                      message="Cette demande sera validée définitivement par la Direction"
                      type="success"
                      showIcon
                      style={{ marginTop: "16px" }}
                    />
                  )}
                  {actionType === "refuser_direction" && (
                    <Alert
                      message="Cette demande sera refusée définitivement par la Direction"
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