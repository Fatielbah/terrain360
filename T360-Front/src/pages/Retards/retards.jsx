
import { useState, useEffect } from "react"
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Switch,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Divider,
  Spin,
  Alert,
  message,
  Popconfirm,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined } from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { UserService } from "../../services/user-service"
import { RetardService } from "../../services/retard-service"
import dayjs from "dayjs"

const { Content } = Layout
const { TextArea } = Input

const RetardsDashboard = () => {
  const { isLightMode } = useTheme()
  const { user } = useAuth() // Utilisateur connecté (superviseur)

  // États pour les employés
  const [employes, setEmployes] = useState([])
  const [loadingEmployes, setLoadingEmployes] = useState(true)
  const [errorEmployes, setErrorEmployes] = useState(null)
  const [imageUrls, setImageUrls] = useState({})

  // États pour les retards
  const [retards, setRetards] = useState([])
  const [loadingRetards, setLoadingRetards] = useState(true)
  const [errorRetards, setErrorRetards] = useState(null)

  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEmploye, setSelectedEmploye] = useState(null)
  const [editingRetard, setEditingRetard] = useState(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState("")
  const [filteredEmployes, setFilteredEmployes] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // Fonction pour charger l'image d'un utilisateur
  const loadUserImage = async (userId) => {
    try {
      const imageBlob = await UserService.getProfileImage(userId)
      if (imageBlob) {
        const imageUrl = URL.createObjectURL(imageBlob)
        setImageUrls((prev) => ({
          ...prev,
          [userId]: imageUrl,
        }))
        return imageUrl
      }
    } catch (error) {
      console.log(`Pas d'image pour l'utilisateur ${userId}:`, error.message)
    }
    return null
  }

  // Fonction pour transformer les données des retards de l'API
  const transformRetardData = (apiRetards) => {
    return apiRetards.map((retard) => ({
      id: retard.id,
      employeId: retard.utilisateur?.id,
      nomComplet: retard.utilisateur ? `${retard.utilisateur.prenom} ${retard.utilisateur.nom}` : "N/A",
      email: retard.utilisateur ? `${retard.utilisateur.nomDeUtilisateur}@entreprise.com` : "N/A",
      date: retard.date,
      heureArrivee: retard.heureArrivee,
      justifie: retard.justifie,
      remarque: retard.remarque || "",
      superviseur: retard.superviseur ? `${retard.superviseur.prenom} ${retard.superviseur.nom}` : "Non défini",
      superviseurId: retard.superviseur?.id,
    }))
  }

  // Fonction pour convertir les données de l'API employés
  const transformEmployeData = (apiData) => {
    return apiData.map((employe) => ({
      id: employe.id,
      nomComplet: `${employe.prenom} ${employe.nom}`,
      email: `${employe.nomDeUtilisateur}@entreprise.com`,
      telephone: employe.telephone,
      adresse: employe.adresse,
      dateNaissance: employe.dateNaissance,
      genre: employe.genre,
      nomDeUtilisateur: employe.nomDeUtilisateur,
      image: null,
    }))
  }

  // Fonction pour récupérer les employés
  const fetchEmployes = async () => {
    try {
      setLoadingEmployes(true)
      setErrorEmployes(null)

      const response = await fetch("http://localhost:8081/api/utilisateurs/enqueteur")
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      const transformedData = transformEmployeData(data)

      setEmployes(transformedData)
      setFilteredEmployes(transformedData)

      // Charger les images
      transformedData.forEach((employe) => {
        loadUserImage(employe.id)
      })
    } catch (err) {
      console.error("Erreur lors du chargement des employés:", err)
      setErrorEmployes(err.message)
    } finally {
      setLoadingEmployes(false)
    }
  }

  // Fonction pour récupérer tous les retards
  const fetchRetards = async () => {
    try {
      setLoadingRetards(true)
      setErrorRetards(null)

      const allRetards = await RetardService.getAllRetards()
      const transformedRetards = transformRetardData(allRetards)
      setRetards(transformedRetards)
    } catch (err) {
      console.error("Erreur lors du chargement des retards:", err)
      setErrorRetards(err.message)
      setRetards([])
    } finally {
      setLoadingRetards(false)
    }
  }

  // Charger les données au montage
  useEffect(() => {
    fetchEmployes()
    fetchRetards()
  }, [])

  // Nettoyer les URLs d'objets
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [])

  // Ajouter un retard
  const handleAjouterRetard = (employe) => {
    setSelectedEmploye(employe)
    setEditingRetard(null)
    form.setFieldsValue({
      nomComplet: employe.nomComplet,
      email: employe.email,
    })
    setModalVisible(true)
  }

  // Modifier un retard
  const handleEditRetard = (record) => {
    setEditingRetard(record)
    setSelectedEmploye(null)
    form.setFieldsValue({
      nomComplet: record.nomComplet,
      email: record.email,
      date: dayjs(record.date),
      heureArrivee: dayjs(record.heureArrivee, "HH:mm"),
      justifie: record.justifie,
      remarque: record.remarque,
    })
    setModalVisible(true)
  }

  // Supprimer un retard
  const handleDeleteRetard = async (id) => {
    try {
      await RetardService.deleteRetard(id)
      setRetards(retards.filter((retard) => retard.id !== id))
      message.success("Retard supprimé avec succès")
    } catch (error) {
      message.error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  // Soumettre le formulaire
  const handleSubmitRetard = async () => {
    try {
      setSubmitting(true)
      const values = await form.validateFields()

      // Vérifier que la date n'est pas dans le futur
      const selectedDate = values.date
      const today = dayjs()

      if (selectedDate.isAfter(today, "day")) {
        message.error("Impossible d'ajouter un retard pour une date future")
        setSubmitting(false)
        return
      }

      // Vérifier le nombre de retards pour cet employé à cette date
      const selectedDateFormatted = values.date.format("YYYY-MM-DD")
      const retardsForEmployeeToday = retards.filter(
        (retard) => retard.employeId === selectedEmploye.id && retard.date === selectedDateFormatted,
      )

      if (retardsForEmployeeToday.length >= 2) {
        message.error("Un employé ne peut avoir que 2 retards maximum par jour")
        return
      }

      // Vérifier que l'utilisateur est connecté
      if (!user || !user.id) {
        throw new Error("Utilisateur non connecté")
      }

      if (editingRetard) {
        // Modifier seulement la justification
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
        message.success("Retard modifié avec succès")
      } else {
        // Ajouter un nouveau retard avec l'ID du superviseur
        const newRetardData = {
          date: values.date.format("YYYY-MM-DD"),
          heureArrivee: values.heureArrivee.format("HH:mm"),
          justifie: values.justifie || false,
          remarque: values.remarque || "",
          utilisateurId: selectedEmploye.id,
        }

        // Utiliser le nouvel endpoint avec l'ID du superviseur
        // Essayer d'abord la méthode principale
        try {
          const createdRetard = await RetardService.createRetard(newRetardData, user.id)
          const transformedRetard = transformRetardData([createdRetard])[0]
          setRetards([...retards, transformedRetard])
          message.success("Retard ajouté avec succès")
        } catch (error) {
          console.log("Échec méthode principale, essai avec paramètre...")
          try {
            // Fallback avec l'endpoint alternatif
            const createdRetard = await RetardService.createRetardWithSuperviseurParam(newRetardData, user.id)
            const transformedRetard = transformRetardData([createdRetard])[0]
            setRetards([...retards, transformedRetard])
            message.success("Retard ajouté avec succès (méthode alternative)")
          } catch (fallbackError) {
            throw fallbackError
          }
        }

        // Actualiser la liste pour voir le superviseur
        setTimeout(() => {
          fetchRetards()
        }, 500)
      }

      setModalVisible(false)
      setSelectedEmploye(null)
      setEditingRetard(null)
      form.resetFields()
    } catch (error) {
      console.error("Erreur lors de la soumission:", error)
      message.error(`Erreur: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalCancel = () => {
    setModalVisible(false)
    setSelectedEmploye(null)
    setEditingRetard(null)
    form.resetFields()
  }

  // Fonction de recherche
  const handleSearch = (value) => {
    setSearchText(value)
    if (!value) {
      setFilteredEmployes(employes)
    } else {
      const filtered = employes.filter(
        (employe) =>
          employe.nomComplet.toLowerCase().includes(value.toLowerCase()) ||
          employe.email.toLowerCase().includes(value.toLowerCase()) ||
          employe.telephone.includes(value),
      )
      setFilteredEmployes(filtered)
    }
  }

  // Synchroniser filteredEmployes avec employes
  useEffect(() => {
    if (!searchText) {
      setFilteredEmployes(employes)
    } else {
      handleSearch(searchText)
    }
  }, [employes, searchText])

  // Colonnes employés
  const employesColumns = [
    {
      title: "Photo",
      dataIndex: "id",
      key: "image",
      width: 80,
      render: (id, record) => (
        <Avatar
          size={40}
          src={imageUrls[id]}
          icon={<UserOutlined />}
          alt={record.nomComplet}
          style={{ border: "1px solid #d9d9d9" }}
        />
      ),
    },
    {
      title: "Nom complet",
      dataIndex: "nomComplet",
      key: "nomComplet",
      width: 200,
      sorter: (a, b) => a.nomComplet.localeCompare(b.nomComplet),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
      width: 130,
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAjouterRetard(record)} size="small">
          Ajouter retard
        </Button>
      ),
    },
  ]

  // Colonnes retards avec superviseur
  const retardsColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Nom complet",
      dataIndex: "nomComplet",
      key: "nomComplet",
      width: 200,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
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
      width: 200,
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditRetard(record)} />
          <Popconfirm
            title="Supprimer ce retard"
            description="Êtes-vous sûr de vouloir supprimer ce retard ?"
            onConfirm={() => handleDeleteRetard(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        {/* Tableau des employés */}
        <Card
          title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Liste des Employés</span>}
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
          extra={
            <Input
              placeholder="Rechercher..."
              allowClear
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: isLightMode ? "#000" : "#ccc" }} />}
                        
              onSearch={handleSearch}
              disabled={loadingEmployes}
              style={{
                          backgroundColor: isLightMode ? "#f8f9fa" : "#273142",
                          color: isLightMode ? "#000" : "#fff",
                          borderRadius: "6px",
                          border: "1px solid #d9d9d9",
                          width: "360px", // ou fixe si tu préfères
                        }}
            />
          }
          style={{ marginBottom: "24px" }}
        >
          {errorEmployes && (
            <Alert
              message="Erreur de chargement des employés"
              description={errorEmployes}
              type="error"
              showIcon
              closable
              style={{ marginBottom: "16px" }}
            />
          )}

          <Spin spinning={loadingEmployes} tip="Chargement des employés...">
            <Table
              className={isLightMode ? "table-light" : "table-dark"}
              columns={employesColumns}
              dataSource={filteredEmployes}
              rowKey="id"
              scroll={{ x: 600 }}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} sur ${total} ${searchText ? "résultat(s)" : "employés"}`,
              }}
            />
          </Spin>
        </Card>

        <Divider />

        {/* Tableau des retards */}
        <Card
          title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Liste des Retards</span>}
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
        >
          {errorRetards && (
            <Alert
              message="Erreur de chargement des retards"
              description={errorRetards}
              type="error"
              showIcon
              closable
              style={{ marginBottom: "16px" }}
            />
          )}

          <Spin spinning={loadingRetards} tip="Chargement des retards...">
            <Table
              className={isLightMode ? "table-light" : "table-dark"}
              columns={retardsColumns}
              dataSource={retards}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} retards`,
              }}
            />
          </Spin>
        </Card>

        {/* Modal pour ajouter/modifier un retard */}
        <Modal
          title={
            <div>
              {editingRetard ? "Modifier le retard" : "Ajouter un retard"}
              {selectedEmploye && (
                <span>
                  {" "}
                  pour <strong>{selectedEmploye.nomComplet}</strong>
                </span>
              )}
            </div>
          }
          open={modalVisible}
          onCancel={handleModalCancel}
          onOk={handleSubmitRetard}
          okText={editingRetard ? "Modifier" : "Ajouter"}
          cancelText="Annuler"
          confirmLoading={submitting}
          width={600}
          className={isLightMode ? "modal-light" : "modal-dark"}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Nom complet" name="nomComplet">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Email" name="email">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Date du retard"
                  name="date"
                  rules={[{ required: true, message: "La date est requise" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Sélectionnez la date"
                    format="YYYY-MM-DD"
                    disabledDate={(current) => current && current.isAfter(dayjs(), "day")}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Heure d'arrivée"
                  name="heureArrivee"
                  rules={[{ required: true, message: "L'heure d'arrivée est requise" }]}
                >
                  <TimePicker style={{ width: "100%" }} placeholder="Sélectionnez l'heure" format="HH:mm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Retard justifié ?" name="justifie" valuePropName="checked">
                  <Switch checkedChildren="Oui" unCheckedChildren="Non" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Remarque" name="remarque">
              <TextArea
                rows={3}
                placeholder="Entrez une remarque concernant ce retard (optionnel)"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}

export default RetardsDashboard
