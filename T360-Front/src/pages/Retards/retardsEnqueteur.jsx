

import { useState, useEffect } from "react"
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Card,
  Row,
  Col,
  Tag,
  Spin,
  Alert,
  message,
  Statistic,
} from "antd"
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { RetardService } from "../../services/retard-service"
import dayjs from "dayjs"


const { Content } = Layout
const { TextArea } = Input

const EmployeRetardsPage = () => {
  const { isLightMode } = useTheme()
  const { user } = useAuth() // Utilisateur connecté (employé)

  // États pour les retards
  const [retards, setRetards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingRetard, setEditingRetard] = useState(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // Fonction pour transformer les données des retards de l'API
  const transformRetardData = (apiRetards) => {
    return apiRetards.map((retard) => ({
      id: retard.id,
      date: retard.date,
      heureArrivee: retard.heureArrivee,
      justifie: retard.justifie,
      remarque: retard.remarque || "",
      superviseur: retard.superviseur ? `${retard.superviseur.prenom} ${retard.superviseur.nom}` : "Non défini",
    }))
  }

  // Fonction pour récupérer les retards de l'employé connecté
  const fetchEmployeRetards = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user || !user.id) {
        throw new Error("Utilisateur non connecté")
      }

      // Récupérer tous les retards et filtrer côté client
      // Ou utiliser un endpoint spécifique si disponible
      const allRetards = await RetardService.getAllRetards()
      const employeRetards = allRetards.filter((retard) => retard.utilisateur?.id === user.id)
      const transformedRetards = transformRetardData(employeRetards)
      setRetards(transformedRetards)
    } catch (err) {
      console.error("Erreur lors du chargement des retards:", err)
      setError(err.message)
      setRetards([])
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au montage
  useEffect(() => {
    if (user) {
      fetchEmployeRetards()
    }
  }, [user])

  // Modifier la justification d'un retard
  const handleJustifierRetard = (record) => {
    setEditingRetard(record)
    form.setFieldsValue({
      justifie: record.justifie,
      remarque: record.remarque,
    })
    setModalVisible(true)
  }

  // Soumettre la justification
  const handleSubmitJustification = async () => {
    try {
      setSubmitting(true)
      const values = await form.validateFields()

      const updatedRetard = await RetardService.updateRetardJustification(
        editingRetard.id,
        values.justifie || false,
        values.remarque || "",
      )

      setRetards(
        retards.map((retard) =>
          retard.id === editingRetard.id
            ? {
                ...retard,
                justifie: updatedRetard.justifie,
                remarque: updatedRetard.remarque,
              }
            : retard,
        ),
      )

      message.success("Justification mise à jour avec succès")
      setModalVisible(false)
      setEditingRetard(null)
      form.resetFields()
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      message.error(`Erreur: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalCancel = () => {
    setModalVisible(false)
    setEditingRetard(null)
    form.resetFields()
  }

  // Calculer les statistiques
  const totalRetards = retards.length
  const retardsJustifies = retards.filter((r) => r.justifie).length
  const retardsNonJustifies = retards.filter((r) => !r.justifie).length

  // Colonnes du tableau
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Heure d'arrivée",
      dataIndex: "heureArrivee",
      key: "heureArrivee",
      width: 130,
    },
    {
      title: "Justifié",
      dataIndex: "justifie",
      key: "justifie",
      width: 100,
      render: (justifie) => <Tag color={justifie ? "green" : "red"}>{justifie ? "Oui" : "Non"}</Tag>,
    },
    {
      title: "Superviseur",
      dataIndex: "superviseur",
      key: "superviseur",
      width: 150,
      render: (superviseur) => <Tag color={superviseur === "Non défini" ? "red" : "blue"}>{superviseur}</Tag>,
    },
    {
      title: "Remarque",
      dataIndex: "remarque",
      key: "remarque",
      width: 250,
      ellipsis: true,
      render: (remarque) => remarque || <span style={{ color: "#999", fontStyle: "italic" }}>Aucune remarque</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleJustifierRetard(record)}
          style={{ backgroundColor: record.justifie ? "#52c41a" : "#faad14" }}
        >
          {record.justifie ? "Modifier" : "Justifier"}
        </Button>
      ),
    },
  ]

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={isLightMode ? "card-title-light" : "card-title-dark"}>Mes Retards</span>
              
            </div>
          }
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
        >
          {error && (
            <Alert
              message="Erreur de chargement des retards"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: "16px" }}
            />
          )}

          <Spin spinning={loading} tip="Chargement de vos retards...">
            <Table
              className={isLightMode ? "table-light" : "table-dark"}
              columns={columns}
              dataSource={retards}
              rowKey="id"
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} retards`,
              }}
              locale={{
                emptyText: "Aucun retard enregistré",
              }}
            />
          </Spin>
        </Card>

        {/* Modal pour justifier un retard */}
        <Modal
          title={
            <div>
              Justifier le retard du <strong>{editingRetard && dayjs(editingRetard.date).format("DD/MM/YYYY")}</strong>
            </div>
          }
          open={modalVisible}
          onCancel={handleModalCancel}
          onOk={handleSubmitJustification}
          okText="Enregistrer"
          cancelText="Annuler"
          confirmLoading={submitting}
          width={500}
          className={isLightMode ? "modal-light" : "modal-dark"}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Ce retard est-il justifié ?" name="justifie" valuePropName="checked">
              <Switch
                checkedChildren="Justifié"
                unCheckedChildren="Non justifié"
                style={{ backgroundColor: form.getFieldValue("justifie") ? "#52c41a" : "#ff4d4f" }}
              />
            </Form.Item>

            <Form.Item
              label="Explication / Remarque"
              name="remarque"
              rules={[
                {
                  validator: (_, value) => {
                    const isJustified = form.getFieldValue("justifie")
                    if (isJustified && (!value || value.trim().length === 0)) {
                      return Promise.reject(new Error("Une explication est requise pour un retard justifié"))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <TextArea rows={4} placeholder="Expliquez la raison de votre retard..." maxLength={500} showCount />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}

export default EmployeRetardsPage
