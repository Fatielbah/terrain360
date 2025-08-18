

import { useEffect, useState } from "react"
import { Layout, Card, Table, Button, Modal, Form, Upload, message, Tabs, Space, Spin } from "antd"
import {
  EyeOutlined,
  FileTextOutlined,
  DollarOutlined,
  UploadOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { UserService } from "../../services/user-service" // Importez UserService
import { FicheService } from "../../services/FicheService"
import moment from "moment"

const { Content } = Layout
const { TabPane } = Tabs

const PaiePrimesPageRH = () => {
  const { isLightMode } = useTheme()
  const [enqueteurs, setEnqueteurs] = useState([])
  const [selectedEnqueteur, setSelectedEnqueteur] = useState(null)
  const [fichesPaie, setFichesPaie] = useState([])
  const [fichesPrime, setFichesPrime] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])

  // Charger tous les enquêteurs
  useEffect(() => {
    loadEnqueteurs()
  }, [])

  // Charger les fiches quand un enquêteur est sélectionné
  useEffect(() => {
    if (selectedEnqueteur) {
      loadFichesForEnqueteur(selectedEnqueteur.id)
    }
  }, [selectedEnqueteur])

  const loadEnqueteurs = async () => {
    try {
      setLoading(true)
      // Utilise la nouvelle fonction pour récupérer seulement les enquêteurs
      const users = await UserService.getAllEnqueteurs()
      setEnqueteurs(users)
    } catch (error) {
      console.error("Erreur lors du chargement des enquêteurs:", error)
      message.error("Erreur lors du chargement des enquêteurs")
    } finally {
      setLoading(false)
    }
  }

  const loadFichesForEnqueteur = async (idUtilisateur) => {
    try {
      setLoading(true)
      const [fichesPaieData, fichesPrimeData] = await Promise.all([
        FicheService.getFichesPaieByUser(idUtilisateur),
        FicheService.getFichesPrimeByUser(idUtilisateur),
      ])
      setFichesPaie(fichesPaieData)
      setFichesPrime(fichesPrimeData)
    } catch (error) {
      console.error("Erreur lors du chargement des fiches:", error)
      message.error("Erreur lors du chargement des fiches")
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase()
    if (extension === "pdf") return <FilePdfOutlined style={{ color: "#ff4d4f" }} />
    if (["doc", "docx"].includes(extension)) return <FileWordOutlined style={{ color: "#1890ff" }} />
    return <FileOutlined />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A"
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    return `${Math.round(kb / 1024)} MB`
  }

  const handleUpload = (info) => {
    setFileList(info.fileList.slice(-1)) // Garder seulement le dernier fichier
  }

  const handleDownload = async (fiche, type) => {
    try {
      if (type === "paie") {
        await FicheService.downloadFichePaie(fiche.id, fiche.nomFichier)
      } else {
        await FicheService.downloadFichePrime(fiche.id, fiche.nomFichier)
      }
      message.success(`Téléchargement de ${fiche.nomFichier} démarré`)
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      message.error("Erreur lors du téléchargement")
    }
  }

  const handleSubmit = async (values) => {
    if (fileList.length === 0) {
      message.error("Veuillez sélectionner un fichier")
      return
    }

    try {
      setUploading(true)
      const file = fileList[0].originFileObj

      if (modalType === "paie") {
        await FicheService.uploadFichePaie(selectedEnqueteur.id, file)
        message.success("Fiche de paie uploadée avec succès")
      } else {
        await FicheService.uploadFichePrime(selectedEnqueteur.id, file)
        message.success("Fiche de prime uploadée avec succès")
      }

      // Recharger les fiches
      await loadFichesForEnqueteur(selectedEnqueteur.id)

      setModalVisible(false)
      setFileList([])
      form.resetFields()
    } catch (error) {
      console.error("Erreur upload:", error)
      message.error(error.message || "Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = (type) => {
    setModalType(type)
    form.resetFields()
    setFileList([])
    setModalVisible(true)
  }

  const columnsEnqueteurs = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
    },
    {
      title: "Prénom",
      dataIndex: "prenom",
      key: "prenom",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setSelectedEnqueteur(record)}>
            Gérer les fichiers
          </Button>
        </Space>
      ),
    },
  ]

  const columnsPaie = [
    {
      title: "Fichier",
      dataIndex: "nomFichier",
      key: "nomFichier",
      render: (text, record) => (
        <Space>
          {getFileIcon(text)}
          <span>{text}</span>
        </Space>
      ),
    },
    
    {
      title: "Date d'upload",
      dataIndex: "dateCreation",
      key: "dateCreation",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleDownload(record, "paie")} type="primary">
            Télécharger
          </Button>
        </Space>
      ),
    },
  ]

  const columnsPrime = [
    {
      title: "Fichier",
      dataIndex: "nomFichier",
      key: "nomFichier",
      render: (text, record) => (
        <Space>
          {getFileIcon(text)}
          <span>{text}</span>
        </Space>
      ),
    },
    
    {
      title: "Date d'upload",
      dataIndex: "dateCreation",
      key: "dateCreation",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleDownload(record, "prime")} type="primary">
            Télécharger
          </Button>
        </Space>
      ),
    },
  ]

  const uploadProps = {
    beforeUpload: () => false, // Empêche l'upload automatique
    onChange: handleUpload,
    fileList: fileList,
    accept: ".pdf,.doc,.docx",
    maxCount: 1,
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        {!selectedEnqueteur ? (
          <Card
          className={isLightMode ? "card-light" : "card-dark"}
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={isLightMode ? "card-title-light" : "card-title-dark"}>
                  Liste des Enquêteurs ({enqueteurs.length})
                </span>
                <Button icon={<ReloadOutlined />} onClick={loadEnqueteurs} loading={loading}>
                  Actualiser
                </Button>
              </div>
            }
            bordered={false}
          >
            <Spin spinning={loading}>
              <Table
                columns={columnsEnqueteurs}
                dataSource={enqueteurs}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "Aucun enquêteur trouvé" }}
              />
            </Spin>
          </Card>
        ) : (
          <Card
          className={isLightMode ? "card-light" : "card-dark"}
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={isLightMode ? "card-title-light" : "card-title-dark"}>
                  Fichiers de {selectedEnqueteur.prenom} {selectedEnqueteur.nom} (ID: {selectedEnqueteur.id})
                </span>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => loadFichesForEnqueteur(selectedEnqueteur.id)}
                    loading={loading}
                  >
                    Actualiser
                  </Button>
                  <Button onClick={() => setSelectedEnqueteur(null)}>Retour à la liste</Button>
                </Space>
              </div>
            }
            bordered={false}
          >
            <Spin spinning={loading}>
              <Tabs defaultActiveKey="paie">
                <TabPane
                  tab={
                    <span>
                      <FileTextOutlined />
                      Fiches de Paie ({fichesPaie.length})
                    </span>
                  }
                  key="paie"
                >
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<UploadOutlined />} onClick={() => handleAdd("paie")}>
                      Uploader une Fiche de Paie
                    </Button>
                  </div>
                  <Table
                    columns={columnsPaie}
                    dataSource={fichesPaie}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: "Aucune fiche de paie" }}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <span>
                      <DollarOutlined />
                      Fiches de Prime ({fichesPrime.length})
                    </span>
                  }
                  key="prime"
                >
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<UploadOutlined />} onClick={() => handleAdd("prime")}>
                      Uploader une Fiche de Prime
                    </Button>
                  </div>
                  <Table
                    columns={columnsPrime}
                    dataSource={fichesPrime}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: "Aucune fiche de prime" }}
                  />
                </TabPane>
              </Tabs>
            </Spin>
          </Card>
        )}

        {/* Modal d'upload */}
        <Modal
          title={`Uploader une fiche de ${modalType}`}
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setFileList([])
          }}
          footer={null}
          width={600}
          className={isLightMode ? "custom-modal-light" : "custom-modal-dark"}
          style={{top: 20}}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{backgroundColor: isLightMode ? "#fff" : "#2c3e50"}}>
            <Form.Item label="Fichier" rules={[{ required: true, message: "Veuillez sélectionner un fichier" }]}>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}style={{backgroundColor: isLightMode ? "#fff" : "#2c3e50"}} >Sélectionner le fichier (PDF, Word)</Button>
              </Upload>
              <div style={{ marginTop: 8, color: "#666", fontSize: "12px" }}>
                Formats acceptés : PDF, DOC, DOCX (Max: 10MB)
              </div>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={uploading}>
                  {uploading ? "Upload en cours..." : "Uploader"}
                </Button>
                <Button
                  onClick={() => {
                    setModalVisible(false)
                    setFileList([])
                  }}
                  style={{backgroundColor: isLightMode ? "#fff" : "#2c3e50"}}
                >
                  Annuler
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}

export default PaiePrimesPageRH
