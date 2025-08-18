
import { useEffect, useState } from "react"
import { Layout, Card, Table, Button, Space, Empty, Spin, message } from "antd"
import { DownloadOutlined, FilePdfOutlined, FileWordOutlined, FileOutlined, ReloadOutlined } from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { FicheService } from "../../services/FicheService"
import moment from "moment"

const { Content } = Layout

const PaiePrimesPage = () => {
  const { isLightMode } = useTheme()
  const { user } = useAuth()
  const [fichesPaie, setFichesPaie] = useState([])
  const [fichesPrime, setFichesPrime] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadFiches()
    }
  }, [user])

  const loadFiches = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [fichesPaieData, fichesPrimeData] = await Promise.all([
        FicheService.getFichesPaieByUser(user.id),
        FicheService.getFichesPrimeByUser(user.id),
      ])
      setFichesPaie(fichesPaieData)
      setFichesPrime(fichesPrimeData)
    } catch (error) {
      console.error("Erreur lors du chargement des fiches:", error)
      message.error("Erreur lors du chargement de vos fiches")
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

  const handleView = (fiche, type) => {
    try {
      if (type === "paie") {
        FicheService.viewFichePaie(fiche.id)
      } else {
        FicheService.viewFichePrime(fiche.id)
      }
    } catch (error) {
      console.error("Erreur visualisation:", error)
      message.error("Erreur lors de l'ouverture du fichier")
    }
  }

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
      title: "Date de mise à disposition",
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
      title: "Date de mise à disposition",
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

  const getRecentFiles = () => {
    const allFiles = [
      ...fichesPaie.map((f) => ({ ...f, category: "Paie" })),
      ...fichesPrime.map((f) => ({ ...f, category: "Prime" })),
    ]
    return allFiles.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)).slice(0, 5)
  }

  if (!user) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <Card>
            <Empty description="Vous devez être connecté pour voir vos fiches" />
          </Card>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        

        <Spin spinning={loading}>
          {/* Fiches de Paie */}
          <Card
            title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Mes Fiches de Paie</span>}
            bordered={false}
            className={isLightMode ? "card-light" : "card-dark"}
            style={{ marginBottom: 24 }}
          >
            <Table
              columns={columnsPaie}
              dataSource={fichesPaie}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "Aucune fiche de paie disponible" }}
            />
          </Card>

          {/* Fiches de Prime */}
          <Card
            title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Mes Fiches de Prime</span>}
            bordered={false}
            className={isLightMode ? "card-light" : "card-dark"}
          >
            <Table
              columns={columnsPrime}
              dataSource={fichesPrime}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "Aucune fiche de prime disponible" }}
            />
          </Card>
        </Spin>
      </Content>
    </Layout>
  )
}

export default PaiePrimesPage
