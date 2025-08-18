
import { useState, useEffect } from "react"
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Tabs,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Timeline,
  Avatar,
  InputNumber,
  Switch,
  Typography,
  List,
} from "antd"
import {
  PlusOutlined,
  UserOutlined,
  AppstoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons"

import { apiService } from "../../services/recruitmentService"
import { useTheme } from '../../contexts/ThemeContext';
import './Recrutement.css'
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs
const { Content } = Layout
const { Title, Text, Paragraph } = Typography

const statusColors = {
  EN_ATTENTE: "orange",
  ENTRETIEN: "blue",
  ACCEPTE: "green",
  REJETE: "red",
}

const statusLabels = {
  EN_ATTENTE: "En attente",
  ENTRETIEN: "Entretien",
  ACCEPTE: "Accepté",
  REJETE: "Rejeté",
}

const contractTypes = ["CDI", "CDD", "Stage", "Freelance", "Alternance", "Intérim"]
const employmentTypes = ["Temps plein", "Temps partiel", "Télétravail", "Hybride"]

export default function RecrutementDashboard() {
  const [candidatures, setCandidatures] = useState([])
  const [fichesDePoste, setFichesDePoste] = useState([])
  const [loading, setLoading] = useState(false)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false)
  const [showJobDetailsDrawer, setShowJobDetailsDrawer] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [form] = Form.useForm()
   const { isLightMode } = useTheme();
  // Ajouter un état pour le chargement de l'analyse
  // Supprimer cette ligne
  //const [analyzingCandidates, setAnalyzingCandidates] = useState(new Set())

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [candidaturesData, fichesData] = await Promise.all([
        apiService.getCandidatures(),
        apiService.getFichesDePoste(),
      ])

      console.log("Candidatures reçues:", candidaturesData)
      console.log("Fiches reçues:", fichesData)

      // S'assurer que candidaturesData est un tableau
      setCandidatures(Array.isArray(candidaturesData) ? candidaturesData : [])
      setFichesDePoste(Array.isArray(fichesData) ? fichesData : [])

      // Lancer l'analyse des scores en arrière-plan après le chargement des données
      setTimeout(() => {
        if (Array.isArray(candidaturesData) && candidaturesData.length > 0) {
          analyzeScoresInBackground(candidaturesData)
        }
      }, 1000) // Délai de 1 seconde pour laisser l'interface se charger
    } catch (error) {
      message.error("Erreur lors du chargement des données")
      console.error("Erreur détaillée:", error)
      // Initialiser avec des tableaux vides en cas d'erreur
      setCandidatures([])
      setFichesDePoste([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics - avec vérification que candidatures est un tableau
  const stats = {
    totalApplications: Array.isArray(candidatures) ? candidatures.length : 0,
    pendingApplications: Array.isArray(candidatures)
      ? candidatures.filter((app) => app.statut === "EN_ATTENTE").length
      : 0,
    interviewApplications: Array.isArray(candidatures)
      ? candidatures.filter((app) => app.statut === "ENTRETIEN").length
      : 0,
    acceptedApplications: Array.isArray(candidatures)
      ? candidatures.filter((app) => app.statut === "ACCEPTE").length
      : 0,
    rejectedApplications: Array.isArray(candidatures)
      ? candidatures.filter((app) => app.statut === "REJETE").length
      : 0,
    totalJobs: Array.isArray(fichesDePoste) ? fichesDePoste.filter((job) => job.status).length : 0,
  }

  const updateApplicationStatus = async (candidatureId, newStatus) => {
    try {
      await apiService.updateCandidatureStatus(candidatureId, newStatus)
      setCandidatures((prev) =>
        prev.map((app) => {
          if (app.id === candidatureId) {
            return { ...app, statut: newStatus }
          }
          return app
        }),
      )
      message.success("Statut mis à jour avec succès")
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut")
      console.error(error)
    }
  }

  // Nouvelle fonction pour supprimer une candidature
  const deleteCandidature = async (candidatureId) => {
    try {
      await apiService.deleteCandidature(candidatureId)
      setCandidatures((prev) => prev.filter((app) => app.id !== candidatureId))
      message.success("Candidature supprimée avec succès")
    } catch (error) {
      message.error("Erreur lors de la suppression de la candidature")
      console.error(error)
    }
  }

  // Dans la fonction RecrutementDashboard, ajouter cette nouvelle fonction après deleteCandidature

  // Remplacer la fonction analyserCV par :
  const analyzeScoresInBackground = async (candidaturesData = candidatures) => {
    try {
      // Trouver les candidatures sans score
      const candidaturesWithoutScore = candidaturesData.filter(
        (candidature) => candidature.scoreIA === null || candidature.scoreIA === undefined
      )

      if (candidaturesWithoutScore.length === 0) {
        return // Aucune candidature à analyser
      }

      // Analyser chaque candidature sans score en parallèle
      const analysisPromises = candidaturesWithoutScore.map(async (candidature) => {
        try {
          const result = await apiService.analyserCV(candidature.id)
          return { candidatureId: candidature.id, score: result.score }
        } catch (error) {
          console.error(`Erreur analyse CV ${candidature.id}:`, error)
          return null
        }
      })

      // Attendre toutes les analyses
      const results = await Promise.all(analysisPromises)

      // Mettre à jour les candidatures avec les nouveaux scores
      const validResults = results.filter(result => result !== null)
      if (validResults.length > 0) {
        setCandidatures((prev) =>
          prev.map((app) => {
            const result = validResults.find(r => r.candidatureId === app.id)
            if (result) {
              return { ...app, scoreIA: result.score }
            }
            return app
          })
        )
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse en arrière-plan:", error)
    }
  }

  // Fonction pour obtenir l'icône appropriée selon le type de fichier
  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) {
      return <FilePdfOutlined style={{ color: "#ff4d4f" }} />
    } else if (fileType?.includes("word") || fileType?.includes("document")) {
      return <FileWordOutlined style={{ color: "#1890ff" }} />
    } else {
      return <FileTextOutlined style={{ color: "#52c41a" }} />
    }
  }

  // Fonction pour télécharger un fichier
  const downloadFile = async (candidatureId, fileType, fileName) => {
    try {
      console.log(`Téléchargement ${fileType} pour candidature ${candidatureId}`)

      const blob = await apiService.downloadFile(candidatureId, fileType)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName || `document-${candidatureId}.${fileType === "cv" ? "pdf" : "pdf"}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      message.success("Fichier téléchargé avec succès")
    } catch (error) {
      message.error("Erreur lors du téléchargement du fichier")
      console.error(error)
    }
  }

  const handleJobSubmit = async (values) => {
    try {
      // Process missions and competences
      const missions = values.missions
        ? values.missions
            .split("\n")
            .filter((m) => m.trim())
            .map((description) => ({ description: description.trim() }))
        : []

      const competencesRequises = values.competences
        ? values.competences
            .split(",")
            .filter((c) => c.trim())
            .map((nom) => ({ nom: nom.trim() }))
        : []

      const ficheData = {
        titre: values.titre,
        service: values.service,
        typeContrat: values.typeContrat,
        localisation: values.localisation,
        datePublication: values.datePublication || new Date().toISOString(),
        typeEmploi: values.typeEmploi,
        description: values.description,
        status: values.status ?? true,
        salaireMin: values.salaireMin || 0,
        salaireMax: values.salaireMax || 0,
        evolutionProfessionnelle: values.evolutionProfessionnelle || "",
        avantages: values.avantages || "",
        missions,
        competencesRequises,
      }

      if (editingJob && editingJob.id) {
        await apiService.updateFicheDePoste(editingJob.id, ficheData)
        message.success("Offre mise à jour avec succès")
      } else {
        await apiService.createFicheDePoste(ficheData)
        message.success("Offre créée avec succès")
      }

      await loadData()
      setShowJobModal(false)
      setEditingJob(null)
      form.resetFields()
    } catch (error) {
      console.error("Erreur détaillée:", error)
      message.error(`Erreur lors de la sauvegarde: ${error.message}`)
    }
  }

  const handleEditJob = async (job) => {
    try {
      // Si on n'a pas les missions et compétences (cas où on vient des détails candidat)
      if (!job.missions || !job.competencesRequises) {
        // Récupérer les données complètes de la fiche de poste
        const completeJob = await apiService.getFicheDePosteById(job.id)
        setEditingJob(completeJob)
        form.setFieldsValue({
          ...completeJob,
          missions: completeJob.missions?.map((m) => m.description).join("\n") || "",
          competences: completeJob.competencesRequises?.map((c) => c.nom).join(", ") || "",
          datePublication: completeJob.datePublication,
        })
      } else {
        // Utiliser les données existantes si elles sont complètes
        setEditingJob(job)
        form.setFieldsValue({
          ...job,
          missions: job.missions?.map((m) => m.description).join("\n") || "",
          competences: job.competencesRequises?.map((c) => c.nom).join(", ") || "",
          datePublication: job.datePublication,
        })
      }
      setShowJobModal(true)
    } catch (error) {
      message.error("Erreur lors du chargement des détails du poste")
      console.error(error)
    }
  }

  const handleDeleteJob = async (jobId) => {
    try {
      await apiService.deleteFicheDePoste(jobId)
      await loadData()
      message.success("Offre supprimée avec succès")
    } catch (error) {
      message.error("Erreur lors de la suppression")
      console.error(error)
    }
  }

  const viewCandidateDetails = (candidate) => {
    setSelectedCandidate(candidate)
    setShowCandidateDrawer(true)
  }

  const viewJobDetails = (job) => {
    // Fermer le drawer candidat s'il est ouvert pour éviter les conflits de z-index
    if (showCandidateDrawer) {
      setShowCandidateDrawer(false)
    }
    setSelectedJob(job)
    setShowJobDetailsDrawer(true)
  }

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      // Trouver le job actuel pour préserver ses données
      const currentJob = fichesDePoste.find((job) => job.id === jobId)
      if (!currentJob) {
        throw new Error("Poste non trouvé")
      }

      // Créer une copie avec seulement le status modifié
      const updatedJobData = {
        ...currentJob,
        status: !currentStatus,
      }

      await apiService.updateFicheDePoste(jobId, updatedJobData)
      await loadData()
      message.success(`Poste ${!currentStatus ? "ouvert" : "fermé"} avec succès`)
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut")
      console.error(error)
    }
  }

  // Modifier candidatureColumns pour ajouter la colonne Score
  // Remplacer la définition de candidatureColumns par:

  const candidatureColumns = [
    {
      title: "Nom",
      dataIndex: "nomComplet",
      key: "nomComplet",
      width: 180,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: "#3b82f6" }} />
          <div>
            <div className="font-semibold">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Poste",
      key: "poste",
      width: 180,
      render: (_, record) => (
        <div>
          {record.ficheDePoste ? (
            <Button type="link" onClick={() => viewJobDetails(record.ficheDePoste)} className="p-0 h-auto text-left">
              {record.ficheDePoste.titre}
            </Button>
          ) : (
            <Text type="secondary">Non spécifié</Text>
          )}
        </div>
      ),
    },
    {
      title: "Score IA",
      key: "scoreIA",
      width: 100,
      render: (_, record) => (
        <div className="text-center">
          {record.scoreIA !== null && record.scoreIA !== undefined ? (
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: record.scoreIA >= 70 ? "#52c41a" : record.scoreIA >= 50 ? "#faad14" : "#ff4d4f",
              }}
            >
              {record.scoreIA}%
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
              En cours...
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.scoreIA || 0) - (b.scoreIA || 0),
    },
    {
      title: "Documents",
      key: "documents",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {record.cv && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadFile(record.id, "cv", record.cv.name)}
              title="Télécharger CV"
            >
              CV
            </Button>
          )}
          {record.lettreMotivation && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadFile(record.id, "lettreMotivation", record.lettreMotivation.name)}
              title="Télécharger LM"
            >
              LM
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 120,
      backgroundColor: isLightMode ? "#fff" : "#2c3e50",
      render: (status) => (
        <Tag color={statusColors[status]} className="animated-tag">
          {statusLabels[status]}
        </Tag>
      ),
      filters: [
        { text: "En attente", value: "EN_ATTENTE" },
        { text: "Entretien", value: "ENTRETIEN" },
        { text: "Accepté", value: "ACCEPTE" },
        { text: "Rejeté", value: "REJETE" },
      ],
      onFilter: (value, record) => record.statut === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewCandidateDetails(record)} />
          <Select
            size="small"
            value={record.statut}
            onChange={(value) => record.id && updateApplicationStatus(record.id, value)}
            style={{ width: 100 }}
            className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
          >
            <Option value="EN_ATTENTE">En attente</Option>
            <Option value="ENTRETIEN">Entretien</Option>
            <Option value="ACCEPTE">Accepté</Option>
            <Option value="REJETE">Rejeté</Option>
          </Select>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette candidature?"
            onConfirm={() => record.id && deleteCandidature(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const jobColumns = [
    {
      title: "Poste",
      dataIndex: "titre",
      key: "titre",
      render: (text, record) => (
        <div>
          <Button
            type="link"
            onClick={() => viewJobDetails(record)}
            className="p-0 h-auto text-[#3b82f6] font-semibold"
          >
            {text}
          </Button>
          <div className="text-sm text-gray-500">{record.service}</div>
        </div>
      ),
    },
    {
      title: "Localisation",
      dataIndex: "localisation",
      key: "localisation",
    },
    {
      title: "Type Contrat",
      dataIndex: "typeContrat",
      key: "typeContrat",
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Type Emploi",
      dataIndex: "typeEmploi",
      key: "typeEmploi",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Candidatures",
      key: "candidatures",
      render: (_, record) => {
        const candidaturesCount = Array.isArray(candidatures)
          ? candidatures.filter((c) => c.ficheDePoste?.id === record.id).length
          : 0
        return (
          <Tag color="cyan">
            {candidaturesCount} candidature{candidaturesCount !== 1 ? "s" : ""}
          </Tag>
        )
      },
    },
    {
      title: "Salaire",
      key: "salaire",
      render: (_, record) => (
        <span>
          {record.salaireMin > 0 || record.salaireMax > 0
            ? `${record.salaireMin} - ${record.salaireMax} MAD`
            : "Non spécifié"}
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status ? "green" : "red"}>{status ? "Ouvert" : "Fermé"}</Tag>,
    },
    {
      title: "Date Publication",
      dataIndex: "datePublication",
      key: "datePublication",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewJobDetails(record)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditJob(record)} />
          <Button
            size="small"
            type={record.status ? "default" : "primary"}
            onClick={() => record.id && toggleJobStatus(record.id, record.status)}
          >
            {record.status ? "Fermer" : "Ouvrir"}
          </Button>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette offre?"
            onConfirm={() => record.id && handleDeleteJob(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
     <Layout className={isLightMode? 'layout-light':'layout-dark'}>
      <Content className={isLightMode ? 'content-light' : 'content-dark'}>
        <Card 
          title={<span className={isLightMode ? 'card-title-light' : 'card-title-dark'}>Recrutement</span>}
          bordered={false} className={isLightMode ? "card-light" : "card-dark"}
        >
          {/* Statistics */}
          <Row gutter={16} className="mb-6">
            <Col span={4}>
              <Card className={isLightMode ? "card-light" : "card-dark"}>
                <Statistic
                  title="Candidatures"
                  value={stats.totalApplications}
                  prefix={<UserOutlined style={{ color: "#3b82f6" }} />}
                  valueStyle={{ color: "#3b82f6" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card className={isLightMode ? "card-light" : "card-dark"}>
                <Statistic
                  title="En Attente"
                  value={stats.pendingApplications}
                  prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card className={isLightMode ? "card-light" : "card-dark"}>
                <Statistic
                  title="Entretiens"
                  value={stats.interviewApplications}
                  prefix={<CalendarOutlined style={{ color: "#1890ff" }} />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card className={isLightMode ? "card-light" : "card-dark"}>
                <Statistic
                  title="Acceptées"
                  value={stats.acceptedApplications}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card className={isLightMode ? "card-light" : "card-dark"}>
                <Statistic
                  title="Rejetées"
                  value={stats.rejectedApplications}
                  prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card className={isLightMode ? "card-light" : "card-dark"}>
                <Statistic
                  title="Offres Actives"
                  value={stats.totalJobs}
                  prefix={<AppstoreOutlined style={{ color: "#3b82f6" }} />}
                  valueStyle={{ color: "#3b82f6" }}
                />
              </Card>
            </Col>
          </Row>

          <Tabs defaultActiveKey="applications">
            <TabPane tab="Candidatures" key="applications">
              <Card title="Gestion des Candidatures" className={isLightMode ? "card-light" : "card-dark"}>
                <Table
                  columns={candidatureColumns}
                  dataSource={candidatures}
                  loading={loading}
                  scroll={{ x: 12 }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  rowKey="id"
                  locale={{
                    emptyText: candidatures.length === 0 ? "Aucune candidature trouvée" : "Chargement...",
                  }}
                  className={isLightMode ? "card-light" : "card-dark"}
                />
              </Card>
            </TabPane>

            <TabPane tab="Offres d'Emploi" key="jobs">
              <Card
                title="Fiches de Poste"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowJobModal(true)}>
                    Nouvelle Offre
                  </Button>
                }
                className={isLightMode ? "card-light" : "card-dark"}
              >
                <Table
                  columns={jobColumns}
                  dataSource={fichesDePoste}
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1200 }}
                  rowKey="id"
                  style={{
                    backgroundColor: isLightMode ? "#fff" : "#2c3e50",
                  }}


                />
              </Card>
            </TabPane>
          </Tabs>

          {/* Job Creation/Edit Modal */}
          <Modal
            title={editingJob ? "Modifier l'Offre" : "Créer une Nouvelle Offre"}
            open={showJobModal}
            onCancel={() => {
              setShowJobModal(false)
              setEditingJob(null)
              form.resetFields()
            }}
            footer={null}
            width={900}
            className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          
          >
            <Form form={form} layout="vertical" onFinish={handleJobSubmit} className="mt-6"
             style={{
             backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}>
              <Row gutter={16}  style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}>
                <Col span={12}>
                  <Form.Item
                    name="titre"
                    label="Titre du Poste"
                    rules={[{ required: true, message: "Veuillez saisir le titre" }]}
                    
                  >
                    <Input size="large" style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}/>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="service"
                    label="Service"
                    rules={[{ required: true, message: "Veuillez saisir le service" }]}
                  >
                    <Input size="large" style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}/>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="localisation"
                    label="Localisation"
                    rules={[{ required: true, message: "Veuillez saisir la localisation" }]}
                  >
                    <Input size="large"style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="typeContrat"
                    label="Type de Contrat"
                    rules={[{ required: true, message: "Veuillez sélectionner le type" }]}
                  >
                    <Select size="large" placeholder="Sélectionner"
                    className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                      {contractTypes.map((type) => (
                        <Option key={type} value={type} >
                          {type}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="typeEmploi"
                    label="Type d'Emploi"
                    rules={[{ required: true, message: "Veuillez sélectionner le type d'emploi" }]}
                  >
                    <Select size="large" placeholder="Sélectionner"
                    className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                      {employmentTypes.map((type) => (
                        <Option key={type} value={type}>
                          {type}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="salaireMin" label="Salaire Minimum (MAD)">
                    <InputNumber size="large" style={{ width: "100%" ,backgroundColor: isLightMode ? "#fff" : "#2c3e50"}} min={0}  
                    
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="salaireMax" label="Salaire Maximum (MAD)">
                    <InputNumber size="large" style={{ width: "100%",backgroundColor: isLightMode ? "#fff" : "#2c3e50" }} min={0} 
                 />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="Statut" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="Description du Poste"
                rules={[{ required: true, message: "Veuillez saisir la description" }]}
              >
                <TextArea rows={4} 
                style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}/>
              </Form.Item>

              <Form.Item name="missions" label="Missions (une par ligne)">
                <TextArea rows={3} placeholder="Mission 1&#10;Mission 2&#10;Mission 3" 
                style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}/>
              </Form.Item>

              <Form.Item name="competences" label="Compétences requises (séparées par des virgules)">
                <Input size="large" placeholder="Compétence 1, Compétence 2, Compétence 3"
                style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }} />
              </Form.Item>

              <Form.Item name="evolutionProfessionnelle" label="Évolution Professionnelle">
                <TextArea rows={2} style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}/>
              </Form.Item>

              <Form.Item name="avantages" label="Avantages">
                <TextArea rows={2} style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }} />
              </Form.Item>

              <div className="flex gap-4 pt-4">
                <Button
                  size="large"
                  onClick={() => {
                    setShowJobModal(false)
                    setEditingJob(null)
                    form.resetFields()
                  }}
                  className="flex-1"
                  style={{
              backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}
                >
                  Annuler
                </Button>
                <Button type="primary" htmlType="submit" size="large" className="flex-1">
                  {editingJob ? "Mettre à jour" : "Créer l'Offre"}
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Candidate Details Drawer - Style amélioré */}
          <Drawer
            title={null}
            placement="right"
            onClose={() => setShowCandidateDrawer(false)}
            open={showCandidateDrawer}
            width={700}
            zIndex={1000}
            bodyStyle={{
              padding: 0,
               backgroundColor: isLightMode ? "#fff" : "#2c3e50"
            }}
            headerStyle={{ display: "none" }}
          >
            {selectedCandidate && (
              <div style={{ height: "100vh", overflow: "auto", }}>
                {/* Header Section */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "40px 30px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-50px",
                      right: "-50px",
                      width: "200px",
                      height: "200px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-30px",
                      left: "-30px",
                      width: "150px",
                      height: "150px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "50%",
                    }}
                  ></div>

                  <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
                    <Avatar
                      size={100}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#667eea",
                        border: "4px solid #ffffff",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        marginBottom: "20px",
                      }}
                    />
                    <h1
                      style={{
                        color: "#ffffff",
                        fontSize: "28px",
                        fontWeight: "700",
                        margin: "0 0 10px 0",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {selectedCandidate.nomComplet}
                    </h1>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "16px",
                        margin: "0 0 15px 0",
                      }}
                    >
                      {selectedCandidate.email}
                    </p>
                    <Tag
                      color={statusColors[selectedCandidate.statut]}
                      style={{
                        fontSize: "14px",
                        padding: "8px 20px",
                        borderRadius: "25px",
                        fontWeight: "600",
                        border: "2px solid rgba(255,255,255,0.3)",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                      }}
                    >
                      {statusLabels[selectedCandidate.statut]}
                    </Tag>
                  </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: "30px" }}>
                  {/* Quick Info Cards */}
                  <Row gutter={[16, 16]} style={{ marginBottom: "30px" }}>
                    <Col span={8}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#1890ff", fontSize: "18px", marginBottom: "5px" }}>📞</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>Téléphone</div>
                        <div style={{ fontWeight: "500" }}>{selectedCandidate.telephone}</div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#52c41a", fontSize: "18px", marginBottom: "5px" }}>📍</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>Ville</div>
                        <div style={{ fontWeight: "500" }}>{selectedCandidate.ville}</div>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#faad14", fontSize: "18px", marginBottom: "5px" }}>📅</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>Candidature</div>
                        <div style={{ fontWeight: "500" }}>
                          {new Date(selectedCandidate.dateSoumission).toLocaleDateString()}
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Score IA Section */}
                  {selectedCandidate.scoreIA !== null && selectedCandidate.scoreIA !== undefined && (
                    <Card
                      style={{
                        marginBottom: "25px",
                        borderRadius: "15px",
                        border: "1px solid #e1e8ed",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        background:
                          selectedCandidate.scoreIA >= 70
                            ? "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)"
                            : selectedCandidate.scoreIA >= 50
                              ? "linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)"
                              : "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)",
                      }}
                      className={isLightMode ? "card-light" : "card-dark"}
                    >
                      <div className="text-center" style={{ padding: "20px" }}>
                        <div
                          style={{
                            fontSize: "48px",
                            fontWeight: "700",
                            color:
                              selectedCandidate.scoreIA >= 70
                                ? "#52c41a"
                                : selectedCandidate.scoreIA >= 50
                                  ? "#faad14"
                                  : "#ff4d4f",
                            marginBottom: "10px",
                          }}
                        >
                          {selectedCandidate.scoreIA}%
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "600", color: "#262626", marginBottom: "15px" }}>
                          Score d'Adéquation IA
                        </div>
                        <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
                          {selectedCandidate.scoreIA >= 70
                            ? "🎯 Excellent match avec le poste"
                            : selectedCandidate.scoreIA >= 50
                              ? "⚡ Bon potentiel pour le poste"
                              : "💡 Profil à développer"}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Personal Information */}
                  <Card
  className={isLightMode ? "card-light" : "card-dark"}
  title={
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        👤
      </div>
      <span style={{ fontSize: "18px", fontWeight: "600" }}>Informations Personnelles</span>
    </div>
  }
  style={{
    marginBottom: "25px",
    borderRadius: "15px",
    border: isLightMode ? "1px solid #e1e8ed" : "1px solid #2c3e50",
    backgroundColor: isLightMode ? "#fff" : "#2c3e50",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    color: isLightMode ? "#000" : "#fff",
  }}
>
  <Descriptions column={2} size="small">
    <Descriptions.Item label="Civilité" labelStyle={{ fontWeight: "600", color: isLightMode ? "#595959" : "#ddd" }}>
      {selectedCandidate.civilite}
    </Descriptions.Item>
    <Descriptions.Item label="Code Postal" labelStyle={{ fontWeight: "600", color: isLightMode ? "#595959" : "#ddd" }}>
      {selectedCandidate.codePostal}
    </Descriptions.Item>
    <Descriptions.Item
      label="Adresse"
      span={2}
      labelStyle={{ fontWeight: "600", color: isLightMode ? "#595959" : "#ddd" }}
    >
      {selectedCandidate.adresse}
    </Descriptions.Item>
  </Descriptions>
</Card>


                  {/* Job Applied */}
                  {selectedCandidate.ficheDePoste && (
                    <Card
  title={
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          backgroundColor: isLightMode ? "#f6ffed" : "#34495e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
        className={isLightMode ? "card-light" : "card-dark"}
      >
        💼
      </div>
      <span style={{ fontSize: "18px", fontWeight: "600", color: isLightMode ? "#000" : "#fff" }}>
        Poste Candidaté
      </span>
    </div>
  }
  style={{
    marginBottom: "25px",
    borderRadius: "15px",
    border: isLightMode ? "1px solid #e1e8ed" : "1px solid #444",
    backgroundColor: isLightMode ? "#fff" : "#2c3e50",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    color: isLightMode ? "#000" : "#fff",
  }}
>
  <div
    style={{
      background: isLightMode
        ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
        : "linear-gradient(135deg, #3c4b57 0%, #2c3e50 100%)",
      padding: "20px",
      borderRadius: "12px",
      border: isLightMode ? "1px solid #bae7ff" : "1px solid #555",
    }}
  >
    <Title
      level={4}
      style={{
        margin: "0 0 8px 0",
        color: isLightMode ? "#1890ff" : "#40a9ff",
      }}
    >
      {selectedCandidate.ficheDePoste.titre}
    </Title>
    <Text
      type="secondary"
      style={{
        fontSize: "16px",
        display: "block",
        marginBottom: "15px",
        color: isLightMode ? "rgba(0,0,0,0.65)" : "#ccc",
      }}
    >
      {selectedCandidate.ficheDePoste.service}
    </Text>
    <Button
      type={isLightMode ? "primary" : "default"}
      ghost
      size="small"
      onClick={() => viewJobDetails(selectedCandidate.ficheDePoste)}
      style={{ borderRadius: "8px", borderColor: isLightMode ? undefined : "#40a9ff", color: isLightMode ? undefined : "#40a9ff" }}
    >
      Voir les détails du poste →
    </Button>
  </div>
</Card>

                  )}

                  {/* Message */}
                  {selectedCandidate.message && (
                    <Card
                    className={isLightMode ? "card-light" : "card-dark"}
                      title={
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              backgroundColor:  isLightMode ? "#fffbe6" : "#34495e",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                            }}
                            
                          >
                            💬
                          </div>
                          <span style={{ fontSize: "18px", fontWeight: "600" }}>Message du Candidat</span>
                        </div>
                      }
                      style={{
                        marginBottom: "25px",
                        borderRadius: "15px",
                        border: "1px solid #e1e8ed",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor:  isLightMode ? "#fff" : "#2c3e50",
                          padding: "20px",
                          borderRadius: "12px",
                          border: "1px solid #f0f0f0",
                          fontStyle: "italic",
                          lineHeight: "1.6",
                        }}
                      >
                        "{selectedCandidate.message}"
                      </div>
                    </Card>
                  )}

                  {/* Documents */}
                  <Card
                  className={isLightMode ? "card-light" : "card-dark"}
                    title={
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor:  isLightMode ? "#f0f9ff" : "#34495e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                          }}
                          
                        >
                          📄
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>Documents</span>
                      </div>
                    }
                    style={{
                      marginBottom: "25px",
                      borderRadius: "15px",
                      border: "1px solid #e1e8ed",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                      {selectedCandidate.cv && (
                        <div
                          style={{
                            background: isLightMode? "linear-gradient(135deg, #fff1f0 0%, #ffebe6 100%)": "#34495e",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid  #34495e",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div style={{ fontSize: "24px" }}>📋</div>
                              <div>
                                <div style={{ fontWeight: "600", fontSize: "16px", color: "#262626" }}>
                                  Curriculum Vitae
                                </div>
                                <div style={{ color: "#8c8c8c", fontSize: "14px" }}>{selectedCandidate.cv.name}</div>
                              </div>
                            </div>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={() => downloadFile(selectedCandidate.id, "cv", selectedCandidate.cv.name)}
                              style={{
                                borderRadius: "10px",
                                height: "40px",
                                paddingLeft: "20px",
                                paddingRight: "20px",
                                fontWeight: "500",
                              }}
                            >
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      )}
                      {selectedCandidate.lettreMotivation && (
                        <div
                          style={{
                            background:isLightMode? "linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)":"#34495e",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #bae7ff",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div style={{ fontSize: "24px" }}>✉️</div>
                              <div>
                                <div style={{ fontWeight: "600", fontSize: "16px", color: "#262626" }}>
                                  Lettre de Motivation
                                </div>
                                <div style={{ color: "#8c8c8c", fontSize: "14px" }}>
                                  {selectedCandidate.lettreMotivation.name}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={() =>
                                downloadFile(
                                  selectedCandidate.id,
                                  "lettreMotivation",
                                  selectedCandidate.lettreMotivation.name,
                                )
                              }
                              style={{
                                borderRadius: "10px",
                                height: "40px",
                                paddingLeft: "20px",
                                paddingRight: "20px",
                                fontWeight: "500",
                              }}
                            >
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>

                  {/* Timeline */}
                  <Card
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: isLightMode?"#f6ffed": "#34495e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                          }}
                          className={isLightMode ? "card-light" : "card-dark"}
                        >
                          ⏱️
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>Chronologie</span>
                      </div>
                    }
                    style={{
                      borderRadius: "15px",
                      border: "1px solid #e1e8ed",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      backgroundColor: isLightMode ? "#f0f2f5" : "#2c3e50"
                    }}
                  >
                    <Timeline>
                      <Timeline.Item
                        color="blue"
                        dot={
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#1890ff",
                              border: "3px solid #e6f7ff",
                            }}
                          ></div>
                        }
                      >
                        <div style={{backgroundColor: isLightMode ? "#f0f2f5" : "#2c3e50"}}>
                          <div style={{ fontWeight: "600", fontSize: "16px", color: "#262626" }}>Candidature reçue</div>
                          <div style={{ color: "#8c8c8c", fontSize: "14px" }}>
                            {new Date(selectedCandidate.dateSoumission).toLocaleDateString()}
                          </div>
                        </div>
                      </Timeline.Item>
                      {selectedCandidate.statut === "ENTRETIEN" && (
                        <Timeline.Item
                          color="orange"
                          dot={
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: "#faad14",
                                border: "3px solid #fff7e6",
                              }}
                            ></div>
                          }
                        >
                          <div style={{ fontWeight: "600", fontSize: "16px", color: "#262626" }}>
                            Entretien programmé
                          </div>
                        </Timeline.Item>
                      )}
                      {selectedCandidate.statut === "ACCEPTE" && (
                        <Timeline.Item
                          color="green"
                          dot={
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: "#52c41a",
                                border: "3px solid #f6ffed",
                              }}
                            ></div>
                          }
                        >
                          <div style={{ fontWeight: "600", fontSize: "16px", color: "#262626" }}>
                            Candidature acceptée
                          </div>
                        </Timeline.Item>
                      )}
                      {selectedCandidate.statut === "REJETE" && (
                        <Timeline.Item
                          color="red"
                          dot={
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: "#ff4d4f",
                                border: "3px solid #fff1f0",
                              }}
                            ></div>
                          }
                        >
                          <div style={{ fontWeight: "600", fontSize: "16px", color: "#262626" }}>
                            Candidature rejetée
                          </div>
                        </Timeline.Item>
                      )}
                    </Timeline>
                  </Card>
                </div>
              </div>
            )}
          </Drawer>

          {/* Job Details Drawer - Style amélioré */}
          <Drawer
            title={null}
            placement="right"
            onClose={() => setShowJobDetailsDrawer(false)}
            open={showJobDetailsDrawer}
            width={800}
            zIndex={1001}
            bodyStyle={{
              padding: 0,
              backgroundColor: isLightMode ? "#f0f2f5" : "#2c3e50",
            }}
            headerStyle={{ display: "none" }}
          >
            {selectedJob && (
              <div style={{ height: "100vh", overflow: "auto" }}>
                {/* Header Section */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                    padding: "40px 30px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                <div
                    style={{
                      position: "absolute",
                      top: "-100px",
                      right: "-100px",
                      width: "300px",
                      height: "300px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-50px",
                      left: "-50px",
                      width: "200px",
                      height: "200px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "50%",
                    }}
                  ></div>

                  <div className="text-center" style={{ position: "relative", zIndex: 2 }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "20px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px auto",
                        fontSize: "40px",
                        border: "3px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      💼
                    </div>
                    <h1
                      style={{
                        color: "#ffffff",
                        fontSize: "32px",
                        fontWeight: "700",
                        margin: "0 0 10px 0",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {selectedJob.titre}
                    </h1>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "18px",
                        margin: "0 0 15px 0",
                      }}
                    >
                      {selectedJob.service}
                    </p>
                    <Tag
                      color={selectedJob.status ? "green" : "red"}
                      style={{
                        fontSize: "14px",
                        padding: "8px 20px",
                        borderRadius: "25px",
                        fontWeight: "600",
                        border: "2px solid rgba(255,255,255,0.3)",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                      }}
                    >
                      {selectedJob.status ? "🟢 Ouvert" : "🔴 Fermé"}
                    </Tag>
                  </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: "30px" }}>
                  {/* Quick Info Cards */}
                  <Row gutter={[16, 16]} style={{ marginBottom: "30px" }}>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#1890ff", fontSize: "20px", marginBottom: "8px" }}>📍</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Localisation</div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedJob.localisation}</div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#52c41a", fontSize: "20px", marginBottom: "8px" }}>📋</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Contrat</div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedJob.typeContrat}</div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#faad14", fontSize: "20px", marginBottom: "8px" }}>⏰</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Emploi</div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedJob.typeEmploi}</div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{
                          textAlign: "center",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ color: "#722ed1", fontSize: "20px", marginBottom: "8px" }}>💰</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: "4px" }}>Salaire</div>
                        <div style={{ fontWeight: "600", fontSize: "12px" }}>
                          {selectedJob.salaireMin > 0 || selectedJob.salaireMax > 0
                            ? `${selectedJob.salaireMin}-${selectedJob.salaireMax} MAD`
                            : "Non spécifié"}
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Description */}
                  <Card
                  className={isLightMode ? "card-light" : "card-dark"}
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: "10px"}}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                          }}
                          
                        >
                          📝
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>Description du Poste</span>
                      </div>
                    }
                    style={{
                      marginBottom: "25px",
                      borderRadius: "15px",
                      border: "1px solid #e1e8ed",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      backgroundColor: isLightMode ? "#e6f7ff" : "#34495e"
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #f0f0f0",
                        lineHeight: "1.7",
                        fontSize: "15px",
                      }}
                    >
                      {selectedJob.description}
                    </div>
                  </Card>

                  {/* Missions */}
                  {selectedJob.missions && selectedJob.missions.length > 0 && (
                    <Card
                    className={isLightMode ? "card-light" : "card-dark"}
                      title={
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                            }}
                            
                          >
                            🎯
                          </div>
                          <span style={{ fontSize: "18px", fontWeight: "600" }}>Missions Principales</span>
                        </div>
                      }
                      style={{
                        marginBottom: "25px",
                        borderRadius: "15px",
                        border: "1px solid #e1e8ed",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    <List
                      dataSource={selectedJob.missions}
                      renderItem={(mission, index) => (
                        <List.Item style={{ border: "none", padding: "8px 0" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", width: "100%" }}>
                            <div
                              style={{
                                minWidth: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                backgroundColor: "#52c41a",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {index + 1}
                            </div>
                            <div style={{ fontSize: "15px", lineHeight: "1.6", color: "#262626" }}>
                              {mission.description}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

                {/* Compétences */}
                {selectedJob.competencesRequises && selectedJob.competencesRequises.length > 0 && (
                  <Card
                  className={isLightMode ? "card-light" : "card-dark"}
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                           backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                          }}
                          
                        >
                          🛠️
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: "600" }}>Compétences Requises</span>
                      </div>
                    }
                    style={{
                      marginBottom: "25px",
                      borderRadius: "15px",
                      border: "1px solid #e1e8ed",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {selectedJob.competencesRequises.map((competence, index) => (
                        <Tag
                          key={index}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "500",
                            backgroundColor: "#e6f7ff",
                            border: "1px solid #91d5ff",
                            color: "#1890ff",
                          }}
                        >
                          {competence.nom}
                        </Tag>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Évolution et Avantages */}
                <Row gutter={16} style={{ marginBottom: "25px" }}>
                  {selectedJob.evolutionProfessionnelle && (
                    <Col span={12}>
                      <Card
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "16px" }}>📈</span>
                            <span style={{ fontSize: "16px", fontWeight: "600" }}>Évolution</span>
                          </div>
                        }
                        size="small"
                        style={{
                          height: "100%",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                          {selectedJob.evolutionProfessionnelle}
                        </div>
                      </Card>
                    </Col>
                  )}
                  {selectedJob.avantages && (
                    <Col span={selectedJob.evolutionProfessionnelle ? 12 : 24}>
                      <Card
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🎁</span>
                            <span style={{ fontSize: "16px", fontWeight: "600" }}>Avantages</span>
                          </div>
                        }
                        size="small"
                        style={{
                          height: "100%",
                          borderRadius: "12px",
                          border: "1px solid #e1e8ed",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        className={isLightMode ? "card-light" : "card-dark"}
                      >
                        <div style={{ fontSize: "14px", lineHeight: "1.6" }}>{selectedJob.avantages}</div>
                      </Card>
                    </Col>
                  )}
                </Row>

                {/* Candidatures Stats */}
                <Card
                className={isLightMode ? "card-light" : "card-dark"}
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                      
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                        }}
                        
                      >
                        📊
                      </div>
                      <span style={{ fontSize: "18px", fontWeight: "600" }}>Statistiques des Candidatures</span>
                    </div>
                  }
                  style={{
                    marginBottom: "25px",
                    borderRadius: "15px",
                    border: "1px solid #e1e8ed",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  {Array.isArray(candidatures) && (
                    <div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#1890ff",
                          marginBottom: "15px",
                          textAlign: "center",
                          backgroundColor: isLightMode ? "#e6f7ff" : "#34495e",
                        }}
                      >
                        {candidatures.filter((c) => c.ficheDePoste?.id === selectedJob.id).length} candidature(s)
                        reçue(s)
                      </div>
                      <Row gutter={16}>
                        {Object.entries(statusLabels).map(([status, label]) => {
                          const count = candidatures.filter(
                            (c) => c.ficheDePoste?.id === selectedJob.id && c.statut === status,
                          ).length
                          return (
                            <Col span={6} key={status}>
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "15px",
                                  borderRadius: "12px",
                                  backgroundColor: `${statusColors[status]}15`,
                                  border: `1px solid ${statusColors[status]}30`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    color: statusColors[status],
                                    marginBottom: "5px",
                                  }}
                                >
                                  {count}
                                </div>
                                <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{label}</div>
                              </div>
                            </Col>
                          )
                        })}
                      </Row>
                    </div>
                  )}
                </Card>

                {/* Action Button */}
                <div style={{ textAlign: "center", paddingTop: "20px" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setShowJobDetailsDrawer(false)
                      handleEditJob(selectedJob)
                    }}
                    style={{
                      height: "50px",
                      paddingLeft: "30px",
                      paddingRight: "30px",
                      borderRadius: "25px",
                      fontSize: "16px",
                      fontWeight: "600",
                      boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                    }}
                  >
                    Modifier cette Offre
                  </Button>
                </div>
              </div>
              </div>
            )}
          </Drawer>
        </Card>
      </Content>
    </Layout>
  )
}
