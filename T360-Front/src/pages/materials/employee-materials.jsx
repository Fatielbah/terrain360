
import { useState, useEffect } from "react"
import { Card, Button, Input, Modal, Form, Table, message, Tag, Space, Tooltip, Layout, Select } from "antd"
import {
  SearchOutlined,
  DesktopOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { MaterialService } from "../../services/material-service"
import { useAuth } from "../../contexts/AuthContext"
import "./employee-materials.css"

const { Content } = Layout
const { Option } = Select

// Composant StatCard pour les employés
function StatCard({ title, value, type, icon }) {
  const { isLightMode } = useTheme()
  
  const getIcon = () => {
    const iconMap = {
      assigned: <UserOutlined />,
      functional: <DesktopOutlined />,
      reported: <WarningOutlined />,
    }
    return icon || iconMap[type] || <UserOutlined />
  }

  const getIconColor = () => {
    const colorMap = {
      assigned: "#1890ff",
      functional: "#10b981",
      reported: "#ef4444",
    }
    return colorMap[type] || "#1890ff"
  }

  return (
    <Card className={`stat-card-modern ${isLightMode ? 'stat-card-light' : 'stat-card-dark'}`} bordered={false}>
      <div className="stat-card-content">
        <div className="stat-card-header">
          <div className={`stat-card-title ${isLightMode ? 'stat-card-title-light' : 'stat-card-title-dark'}`}>{title}</div>
          <div className="stat-card-icon" style={{ backgroundColor: `${getIconColor()}20` }}>
            <span style={{ color: getIconColor() }}>{getIcon()}</span>
          </div>
        </div>
        <div className={`stat-card-value ${isLightMode ? 'stat-card-value-light' : 'stat-card-value-dark'}`}>{value.toLocaleString()}</div>
      </div>
    </Card>
  )
}

export default function EmployeeMaterialsPage() {
  const { isLightMode } = useTheme()
  const { user: currentUser } = useAuth()
  const [activeAssignments, setActiveAssignments] = useState([])
  const [terminatedAssignments, setTerminatedAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal state pour signaler un défaut
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  const [reportForm] = Form.useForm()

  useEffect(() => {
    if (currentUser && currentUser.id) {
      loadAssignedMaterials(currentUser.id)
    }
  }, [currentUser])

  const loadAssignedMaterials = async (userId) => {
    try {
      setLoading(true)
      const data = await MaterialService.getAffectationsByUtilisateur(userId)

      // Enrichir les affectations avec les détails du matériel et vérifier les tickets
      const affectationsWithDetails = await Promise.all(
        data.map(async (affectation) => {
          const materiel = await MaterialService.getMaterialById(affectation.materielId)

          // Vérifier si le matériel a un ticket ouvert
          const hasOpenTicket = await MaterialService.checkMaterialHasOpenTicket(affectation.materielId)

          return {
            ...affectation,
            materiel,
            ticketOuvert: hasOpenTicket,
          }
        }),
      )

      const active = affectationsWithDetails.filter((a) => a.statut !== "TERMINATED")
      const terminated = affectationsWithDetails.filter((a) => a.statut === "TERMINATED")

      setActiveAssignments(active)
      setTerminatedAssignments(terminated)
    } catch (error) {
      console.error("Erreur lors du chargement des matériels:", error)
      message.error("Erreur lors du chargement de vos matériels")
    } finally {
      setLoading(false)
    }
  }

  // Colonnes pour le tableau des matériels affectés - Simplifiées
  const activeMaterialColumns = [
    {
      title: "N° Série",
      dataIndex: ["materiel", "numeroSerie"],
      key: "numeroSerie",
      width: 150,
      render: (text) => <code className="serial-number">{text}</code>,
    },
    {
      title: "Marque",
      dataIndex: ["materiel", "marque"],
      key: "marque",
      width: 120,
      render: (text) => <strong className="material-reference">{text}</strong>,
    },
    {
      title: "Modèle",
      dataIndex: ["materiel", "modele"],
      key: "modele",
      width: 150,
      render: (text) => <span className="material-name">{text}</span>,
    },
    {
      title: "Type",
      dataIndex: ["materiel", "type"],
      key: "type",
      width: 120,
      render: (text) => <span className="material-type">{text}</span>,
    },
    {
      title: "État",
      dataIndex: ["materiel", "etat"],
      key: "etat",
      width: 120,
      render: (etat, record) => {
        const colors = {
          FONCTIONNEL: "green",
          EN_PANNE: "red",
          EN_REPARATION: "orange",
          HORS_SERVICE: "gray",
        }
        return (
          <div>
            <Tag color={colors[etat]} className="status-tag">
              {etat}
            </Tag>
            {record.ticketOuvert && (
              <Tag color="blue" size="small">
                Signalé
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Space size={2} className="action-buttons">
          {record.materiel.etat === "FONCTIONNEL" && !record.ticketOuvert && (
            <Tooltip title="Signaler une panne">
              <Button
                type="link"
                size="small"
                icon={<ExclamationCircleOutlined />}
                onClick={() => handleReportDefect(record.materiel)}
                className="action-btn report-btn"
                danger
              />
            </Tooltip>
          )}
          {record.ticketOuvert && (
            <Tooltip title="Panne déjà signalée">
              <Button
                type="link"
                size="small"
                icon={<WarningOutlined />}
                disabled
                className="action-btn reported-btn"
              />
            </Tooltip>
          )}
          {record.materiel.etat !== "FONCTIONNEL" && !record.ticketOuvert && (
            <Tooltip title="Matériel en panne">
              <Button
                type="link"
                size="small"
                icon={<WarningOutlined />}
                disabled
                className="action-btn disabled-btn"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const terminatedMaterialColumns = [
    {
      title: "N° Série",
      dataIndex: ["materiel", "numeroSerie"],
      key: "numeroSerie",
      width: 150,
      render: (text) => <code className="serial-number">{text}</code>,
    },
    {
      title: "Marque",
      dataIndex: ["materiel", "marque"],
      key: "marque",
      width: 120,
      render: (text) => <strong className="material-reference">{text}</strong>,
    },
    {
      title: "Modèle",
      dataIndex: ["materiel", "modele"],
      key: "modele",
      width: 150,
      render: (text) => <span className="material-name">{text}</span>,
    },
    {
      title: "Date de Fin",
      dataIndex: "dateFin",
      key: "dateFin",
      width: 120,
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
  ]

  const handleReportDefect = (material) => {
    setSelectedMaterial(material)
    reportForm.resetFields()
    reportForm.setFieldsValue({
      materielInfo: `${material.marque} ${material.modele} (${material.numeroSerie})`,
      declarant: `${currentUser.prenom} ${currentUser.nom}`,
    })
    setReportModalVisible(true)
  }

  const handleSubmitReport = async (values) => {
    try {
      const reportData = {
        materielId: selectedMaterial.id,
        description: values.description,
        priorite: values.priorite,
        declarantId: currentUser.id,
        statut: "OUVERT",
        dateCreation: new Date().toISOString(),
      }

      await MaterialService.createTicket(reportData)

      // Mettre à jour l'état du matériel à EN_PANNE
      await MaterialService.updateMaterialState(selectedMaterial.id, "EN_PANNE")

      message.success("Panne signalée avec succès. Un technicien va traiter votre demande.")

      setReportModalVisible(false)
      reportForm.resetFields()

      // Corriger l'appel avec l'ID utilisateur
      loadAssignedMaterials(currentUser.id)
    } catch (error) {
      message.error("Erreur lors du signalement de la panne")
      console.error("Erreur lors du signalement:", error)
    }
  }

  const filteredActiveAssignments = activeAssignments.filter((assignment) => {
    if (!assignment.materiel) return false
    const searchLower = searchTerm.toLowerCase()
    const { materiel } = assignment
    return (
      (materiel.marque && materiel.marque.toLowerCase().includes(searchLower)) ||
      (materiel.modele && materiel.modele.toLowerCase().includes(searchLower)) ||
      (materiel.numeroSerie && materiel.numeroSerie.toLowerCase().includes(searchLower)) ||
      (materiel.type && materiel.type.toLowerCase().includes(searchLower))
    )
  })

  const stats = {
    assigned: activeAssignments.length,
    functional: activeAssignments.filter((a) => a.materiel && a.materiel.etat === "FONCTIONNEL" && !a.ticketOuvert)
      .length,
    reported: activeAssignments.filter((a) => a.ticketOuvert || (a.materiel && a.materiel.etat === "EN_PANNE")).length,
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={
            <div className="page-header">
              <span className={isLightMode ? "card-title-light" : "card-title-dark"}>
                Mes Matériels - {currentUser?.prenom} {currentUser?.nom}
              </span>
            </div>
          }
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
          extra={
            <Input 
                        placeholder="Rechercher par marque, modèle, n° série ou type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                         size="large"
                        prefix={<SearchOutlined style={{ color: isLightMode ? "#000" : "#ccc" }} />}
                        style={{
                          backgroundColor: isLightMode ? "#ffffffff" : "#273142",
                          color: isLightMode ? "#000" : "#fff",
                          width: "360px", // ou fixe si tu préfères
                        }}
                      />
          }
          
        >
          {/* Statistiques */}
          <div className="stats-grid-modern">
            <StatCard title="Matériels Affectés" value={stats.assigned} type="assigned" />
            <StatCard title="Fonctionnels" value={stats.functional} type="functional" />
            <StatCard title="Pannes Signalées" value={stats.reported} type="reported" />
          </div>

          {/* Tableau des matériels affectés */}
          <Card title="Vos Matériels Actifs" className={isLightMode ? "card-light" : "card-dark"}>
            <Table
              columns={activeMaterialColumns}
              dataSource={filteredActiveAssignments}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} matériels`,
              }}
              className="materials-table"
              rowClassName={(record) => {
                let className = `table-row ${record.materiel.etat.toLowerCase()}`
                if (record.ticketOuvert) className += " ticket-reported"
                return className
              }}
              scroll={{ x: 800 }}
            />
          </Card>

          <Card title="Historique de vos affectations" className={isLightMode ? "card-light" : "card-dark"}style={{ marginTop: "20px" }}>
            <Table
              columns={terminatedMaterialColumns}
              dataSource={terminatedAssignments}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} affectations`,
              }}
              className="materials-table"
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Modal pour signaler une panne */}
          <Modal
            title="Signaler une Panne"
            open={reportModalVisible}
            onCancel={() => setReportModalVisible(false)}
            footer={null}
            width={600}
            className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          >
            <Form form={reportForm} layout="vertical" onFinish={handleSubmitReport}>
              <Form.Item name="materielInfo" label="Matériel">
                <Input disabled />
              </Form.Item>

              <Form.Item name="declarant" label="Déclarant">
                <Input disabled />
              </Form.Item>

              <Form.Item
                name="priorite"
                label="Urgence"
                rules={[{ required: true, message: "Veuillez sélectionner l'urgence" }]}
              >
                <Select placeholder="Sélectionner l'urgence du problème" 
                  className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                  <Option value="BASSE">Basse - Peut attendre</Option>
                  <Option value="MOYENNE">Moyenne - À traiter rapidement</Option>
                  <Option value="HAUTE">Haute - Urgent, bloque le travail</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="Description du Problème"
                rules={[{ required: true, message: "Veuillez décrire le problème" }]}
              >
                <Input.TextArea
                  style={{ backgroundColor: isLightMode ? "white" : "#2c3e50", color: isLightMode ? "#000" : "#fff" }}
                  rows={4}
                  placeholder="Décrivez précisément le problème rencontré, les circonstances, les messages d'erreur..."
                />
              </Form.Item>

              <div className="modal-actions">
                <Button onClick={() => setReportModalVisible(false)}>Annuler</Button>
                <Button type="primary" htmlType="submit" danger>
                  Signaler la Panne
                </Button>
              </div>
            </Form>
          </Modal>
        </Card>
      </Content>
    </Layout>
  )
}