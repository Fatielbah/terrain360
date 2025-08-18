
import { useState, useEffect } from "react"
import {
  Layout,
  Card,
  Button,
  Avatar,
  Row,
  Col,
  Modal,
  Tabs,
  Table,
  Tag,
  Spin,
  message,
  Descriptions,
  Statistic,
  Input, // Import Input for the search bar
} from "antd"
import {
  UserOutlined,
  FolderOpenOutlined,
  CalendarOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { UserService } from "../../services/user-service"
import { MaterialService } from "../../services/material-service"
import { RetardService } from "../../services/retard-service"
import { AbsenceCongeService } from "../../services/absence-conge-service"

const { Content } = Layout
const { TabPane } = Tabs

const LesEnqueteurs = () => {
  const { isLightMode } = useTheme()
  const [enqueteurs, setEnqueteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEnqueteur, setSelectedEnqueteur] = useState(null)
  const [dossierVisible, setDossierVisible] = useState(false)
  const [dossierData, setDossierData] = useState({
    materiels: [],
    retards: [],
    absencesConges: { absences: [], conges: [] },
    loading: false,
  })
  const [searchTerm, setSearchTerm] = useState("") // New state for search term

  // Charger tous les enquêteurs au montage du composant
  useEffect(() => {
    loadEnqueteurs()
    // Cleanup function pour libérer les URLs d'objets
    return () => {
      enqueteurs.forEach((enqueteur) => {
        if (enqueteur.imageUrl && enqueteur.imageUrl.startsWith("blob:")) {
          URL.revokeObjectURL(enqueteur.imageUrl)
        }
      })
    }
  }, [])

  const loadEnqueteurs = async () => {
    try {
      setLoading(true)
      const data = await UserService.getAllEnqueteurs()
      // Charger les images de profil pour chaque enquêteur
      const enqueteursAvecImages = await Promise.all(
        data.map(async (enqueteur) => {
          try {
            const imageBlob = await UserService.getProfileImage(enqueteur.id)
            const imageUrl = imageBlob ? URL.createObjectURL(imageBlob) : null
            return { ...enqueteur, imageUrl }
          } catch (error) {
            console.log(`Pas d'image pour l'enquêteur ${enqueteur.id}`)
            return { ...enqueteur, imageUrl: null }
          }
        }),
      )
      setEnqueteurs(enqueteursAvecImages)
    } catch (error) {
      console.error("Erreur lors du chargement des enquêteurs:", error)
      message.error("Erreur lors du chargement des enquêteurs")
    } finally {
      setLoading(false)
    }
  }

  const loadDossierData = async (enqueteurId) => {
    setDossierData((prev) => ({ ...prev, loading: true }))
    try {
      // Charger les données en parallèle
      const [materielsAffectes, retards, absencesConges] = await Promise.all([
        MaterialService.getAffectationsByUtilisateur(enqueteurId).catch(() => []),
        RetardService.getAllRetards()
          .then((allRetards) => allRetards.filter((retard) => retard.utilisateur?.id === enqueteurId))
          .catch(() => []),
        AbsenceCongeService.getAbsencesEtConges(enqueteurId).catch(() => ({ absences: [], conges: [] })),
      ])
      // Enrichir les matériels avec les détails
      const materielsEnrichis = await Promise.all(
        materielsAffectes.map(async (affectation) => {
          try {
            const materiel = await MaterialService.getMaterialById(affectation.materielId)
            return {
              ...affectation,
              materiel,
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du matériel ${affectation.materielId}:`, error)
            return affectation
          }
        }),
      )
      setDossierData({
        materiels: materielsEnrichis,
        retards,
        absencesConges,
        loading: false,
      })
    } catch (error) {
      console.error("Erreur lors du chargement du dossier:", error)
      message.error("Erreur lors du chargement du dossier")
      setDossierData((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleVoirDossier = (enqueteur) => {
    setSelectedEnqueteur(enqueteur)
    setDossierVisible(true)
    loadDossierData(enqueteur.id)
  }

  const handleCloseDossier = () => {
    setDossierVisible(false)
    setSelectedEnqueteur(null)
    setDossierData({
      materiels: [],
      retards: [],
      absencesConges: { absences: [], conges: [] },
      loading: false,
    })
  }

  // Filter enqueteurs based on searchTerm
  const filteredEnqueteurs = enqueteurs.filter((enqueteur) => {
    const fullName = `${enqueteur.nom} ${enqueteur.prenom}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Colonnes pour le tableau des matériels
  const materielsColumns = [
    {
      title: "Marque",
      dataIndex: ["materiel", "marque"],
      key: "marque",
      render: (text, record) => record.materiel?.marque || "N/A",
    },
    {
      title: "Modèle",
      dataIndex: ["materiel", "model"],
      key: "model",
      render: (text, record) => record.materiel?.model || "N/A",
    },
    {
      title: "Type",
      dataIndex: ["materiel", "type"],
      key: "type",
      render: (text, record) => record.materiel?.type || "N/A",
    },
    {
      title: "Numéro de série",
      dataIndex: ["materiel", "numeroSerie"],
      key: "numeroSerie",
      render: (text, record) => record.materiel?.numeroSerie || "N/A",
    },
    {
      title: "Date d'affectation",
      dataIndex: "dateDebut",
      key: "dateDebut",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
    {
      title: "Statut",
      dataIndex: "active",
      key: "active",
      render: (active) => <Tag color={active ? "green" : "red"}>{active ? "Active" : "Terminée"}</Tag>,
    },
  ]
  // Colonnes pour le tableau des retards
  const retardsColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Heure d'arrivée",
      dataIndex: "heureArrivee",
      key: "heureArrivee",
    },
    {
      title: "Justifié",
      dataIndex: "justifie",
      key: "justifie",
      render: (justifie) => <Tag color={justifie ? "green" : "red"}>{justifie ? "Oui" : "Non"}</Tag>,
    },
    {
      title: "Remarque",
      dataIndex: "remarque",
      key: "remarque",
      render: (text) => text || "Aucune",
    },
  ]
  // Colonnes pour le tableau des absences
  const absencesColumns = [
    {
      title: "Date début",
      dataIndex: "dateDebut",
      key: "dateDebut",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Date fin",
      dataIndex: "dateFin",
      key: "dateFin",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "En cours"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
  ]
  // Colonnes pour le tableau des congés
  const congesColumns = [
    {
      title: "Date début",
      dataIndex: "dateDebut",
      key: "dateDebut",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Date fin",
      dataIndex: "dateFin",
      key: "dateFin",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Type de congé",
      dataIndex: "type",
      key: "type",
      render: (type) => type || "Non spécifié",
    },
  ]

  if (loading) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Dossier électronique</span>}
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
          extra={
            <Input
            placeholder="Rechercher un enquêteur par nom ou prénom"
            allowClear
            enterButton="Rechercher"
            size="large"
            prefix={<SearchOutlined style={{ color: isLightMode ? "#000" : "#ccc" }} />
            }
            value={searchTerm}
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: isLightMode ? "#fff" : "#273142" ,width: "360px"}}
          />
        }
        >
          
          <Row gutter={[16, 16]}>
            {filteredEnqueteurs.map((enqueteur) => (
              <Col key={enqueteur.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className={isLightMode ? "card-light" : "card-dark"}
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
                    height: "100%",
                  }}
                  extra={[
                    <Button
                      key="voirDossier" // Added key property
                      icon={<FolderOpenOutlined />}
                      type="primary"
                      size="small"
                      onClick={() => handleVoirDossier(enqueteur)}
                    >
                      Voir dossier
                    </Button>,
                  ]}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Avatar
                      size={80}
                      src={enqueteur.imageUrl}
                      icon={<UserOutlined />}
                      style={{ marginBottom: "12px" }}
                    />
                    <h3 style={{ margin: "0 0 4px" }}>
                      {enqueteur.nom} {enqueteur.prenom}
                    </h3>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
        {/* Modal du dossier */}
        <Modal
          style={{
            top: 10,
          }}
          title={
            selectedEnqueteur ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar
                  src={selectedEnqueteur.imageUrl}
                  icon={<UserOutlined />}
                  size={40}
                  style={{
                    border: selectedEnqueteur.imageUrl ? "none" : "1px solid #d9d9d9",
                    top: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                    Dossier de {selectedEnqueteur.nom} {selectedEnqueteur.prenom}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>{selectedEnqueteur.email}</div>
                </div>
              </div>
            ) : (
              "Dossier"
            )
          }
          open={dossierVisible}
          onCancel={handleCloseDossier}
          width={1200}
          className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          footer={[
            <Button key="close" onClick={handleCloseDossier}>
              Fermer
            </Button>,
          ]}
        >
          {selectedEnqueteur && (
            <Spin spinning={dossierData.loading}>
              {/* Informations personnelles */}
              <Card
                style={{ marginBottom: 16 }}
                title="Informations personnelles"
                className={isLightMode ? "card-light" : "card-dark"}
              >
                <Descriptions column={3} size="small" bordered>
                  <Descriptions.Item label="Nom complet" span={2}>
                    {selectedEnqueteur.nom} {selectedEnqueteur.prenom}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email" span={2}>
                    {selectedEnqueteur.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Téléphone" span={2}>
                    {selectedEnqueteur.telephone || "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="CIN" span={2}>
                    {selectedEnqueteur.cin || "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Genre" span={2}>
                    {selectedEnqueteur.genre || "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date de naissance" span={2}>
                    {selectedEnqueteur.dateNaissance
                      ? new Date(selectedEnqueteur.dateNaissance).toLocaleDateString("fr-FR")
                      : "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date d'embauche" span={2}>
                    {selectedEnqueteur.dateEmbauche
                      ? new Date(selectedEnqueteur.dateEmbauche).toLocaleDateString("fr-FR")
                      : "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nationalité" span={2}>
                    {selectedEnqueteur.nationalite || "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Situation familiale" span={2}>
                    {selectedEnqueteur.situationFamiliale || "Non renseigné"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Adresse" span={2}>
                    {selectedEnqueteur.adresse || "Non renseigné"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              {/* Statistiques rapides */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card className={isLightMode ? "card-light" : "card-dark"}>
                    <Statistic
                      title="Matériels affectés"
                      value={dossierData.materiels.filter((m) => m.active).length}
                      prefix={<ToolOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className={isLightMode ? "card-light" : "card-dark"}>
                    <Statistic title="Retards" value={dossierData.retards.length} prefix={<ClockCircleOutlined />} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className={isLightMode ? "card-light" : "card-dark"}>
                    <Statistic
                      title="Absences"
                      value={dossierData.absencesConges.absences?.length || 0}
                      prefix={<CalendarOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className={isLightMode ? "card-light" : "card-dark"}>
                    <Statistic
                      title="Congés"
                      value={dossierData.absencesConges.conges?.length || 0}
                      prefix={<CalendarOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
              {/* Onglets avec les détails */}
              <Tabs defaultActiveKey="materiels">
                <TabPane tab={`Matériels (${dossierData.materiels.length})`} key="materiels">
                  <Table
                    columns={materielsColumns}
                    dataSource={dossierData.materiels}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    className={isLightMode ? "table-light" : "table-dark"}
                  />
                </TabPane>
                <TabPane tab={`Retards (${dossierData.retards.length})`} key="retards">
                  <Table
                    columns={retardsColumns}
                    dataSource={dossierData.retards}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    className={isLightMode ? "table-light" : "table-dark"}
                  />
                </TabPane>
                <TabPane tab={`Absences (${dossierData.absencesConges.absences?.length || 0})`} key="absences">
                  <Table
                    columns={absencesColumns}
                    dataSource={dossierData.absencesConges.absences || []}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    className={isLightMode ? "table-light" : "table-dark"}
                  />
                </TabPane>
                <TabPane tab={`Congés (${dossierData.absencesConges.conges?.length || 0})`} key="conges">
                  <Table
                    columns={congesColumns}
                    dataSource={dossierData.absencesConges.conges || []}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    className={isLightMode ? "table-light" : "table-dark"}
                  />
                </TabPane>
              </Tabs>
            </Spin>
          )}
        </Modal>
      </Content>
    </Layout>
  )
}

export default LesEnqueteurs
