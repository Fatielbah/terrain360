

import { useState, useEffect } from "react"
import {
  Form,
  Input,
  Select,
  Button,
  Typography,
  message,
  Row,
  Col,
  Alert,
  Card,
  List,
  Popconfirm,
  Tag,
  Space,
} from "antd"
import { SendOutlined, DeleteOutlined, StopOutlined, ReloadOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { demandeService, getTypeDocumentLabel } from "../../services/demandeService"

const { Title, Text } = Typography
const { TextArea } = Input

export default function DemandeDocumentForm() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState(null)
  const [existingDemandes, setExistingDemandes] = useState([])
  const [loadingDemandes, setLoadingDemandes] = useState(false)
  const [typeDocument, setTypeDocument] = useState("")

  const { isLightMode } = useTheme()
  const { user } = useAuth()

  // Types de documents selon votre enum backend
  const typesDocument = [
    { value: "ATTESTATION_TRAVAIL", label: "Attestation de travail" },
    { value: "ATTESTATION_SALAIRE", label: "Attestation de salaire" },
    { value: "AUTRE", label: "Autre" },
  ]

  // Vérifier les permissions utilisateur
  const checkUserPermissions = () => {
    if (!user) {
      setErrorDetails({
        type: "error",
        message: "Vous devez être connecté pour soumettre une demande.",
      })
      return false
    }

    if (!user.id) {
      setErrorDetails({
        type: "error",
        message: "Informations utilisateur incomplètes. Veuillez vous reconnecter.",
      })
      return false
    }

    return true
  }

  // Récupérer les demandes existantes
  const fetchExistingDemandes = async () => {
    if (!user?.id) return

    setLoadingDemandes(true)
    try {
      console.log("Récupération des demandes pour l'utilisateur:", user.id)

      // Utiliser la nouvelle méthode que vous avez créée
      const demandes = await demandeService.getDemandesDocumentByUser(user.id, user)

      console.log("Demandes reçues:", demandes)

      // Filtrer seulement les demandes de documents (correction de la faute de frappe)
      const documentRequests = demandes.filter(
        (demande) =>
          demande.type === "ATTESTATION_TRAVAIL" || demande.type === "ATTESTATION_SALAIRE" || demande.type === "AUTRE", // Correction: "AuTRE" -> "AUTRE"
      )

      console.log("Demandes filtrées:", documentRequests)
      setExistingDemandes(documentRequests)
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      if (error.status === 403) {
        setErrorDetails({
          type: "warning",
          message: "Vous n'avez pas les permissions pour consulter vos demandes.",
        })
      } else {
        setErrorDetails({
          type: "error",
          message: "Erreur lors du chargement des demandes: " + (error.message || "Erreur inconnue"),
        })
      }
    } finally {
      setLoadingDemandes(false)
    }
  }

  // Annuler une demande
  const handleCancelDemande = async (demandeId) => {
    try {
      setLoadingDemandes(true)
      await demandeService.cancelDemande(demandeId, user)
      message.success("Demande annulée avec succès")
      await fetchExistingDemandes()
    } catch (error) {
      console.error("Erreur:", error)
      if (error.status === 403) {
        message.error("Vous n'avez pas les permissions pour annuler cette demande")
      } else {
        message.error("Erreur lors de l'annulation de la demande")
      }
    } finally {
      setLoadingDemandes(false)
    }
  }

  // Supprimer une demande
  const handleDeleteDemande = async (demandeId) => {
    try {
      setLoadingDemandes(true)
      await demandeService.deleteDemande(demandeId, user)
      message.success("Demande supprimée avec succès")
      await fetchExistingDemandes()
    } catch (error) {
      console.error("Erreur:", error)
      if (error.status === 403) {
        message.error("Vous n'avez pas les permissions pour supprimer cette demande")
      } else {
        message.error("Erreur lors de la suppression de la demande")
      }
    } finally {
      setLoadingDemandes(false)
    }
  }

  // Charger les données au montage
  useEffect(() => {
    if (checkUserPermissions()) {
      fetchExistingDemandes()
    }
  }, [user?.id])

  // Gérer le changement de type de document
  const handleTypeDocumentChange = (value) => {
    setTypeDocument(value)
    // Réinitialiser le champ "autre" si on change de type
    if (value !== "AUTRE") {
      form.setFieldsValue({ autre_type: undefined })
    }
  }

  // Soumettre la demande
  const handleSubmit = async (values) => {
    if (!checkUserPermissions()) {
      return
    }

    setLoading(true)
    setErrorDetails(null)

    try {
      // Validation côté client
      if (!values.type_document) {
        throw new Error("Veuillez sélectionner un type de document")
      }

      if (values.type_document === "AUTRE" && !values.autre_type?.trim()) {
        throw new Error("Veuillez préciser le type de document")
      }

      // Préparer les données selon votre entité DemandeDocument
      let typeToSend = values.type_document
      const commentaire = values.commentaire?.trim() || ""

      // Si c'est "AUTRE", utiliser le type et mettre le détail dans le commentaire
      let autreType = null
      if (values.type_document === "AUTRE" && values.autre_type?.trim()) {
        typeToSend = "AUTRE"
        autreType = values.autre_type.trim()
      }

      const demandeData = {
        type: typeToSend,
        commentaire: commentaire,
        autretype: autreType || undefined,
      }

      console.log("Données préparées:", demandeData)
      console.log("ID Utilisateur:", user.id)

      await demandeService.createDemandeDocument(demandeData, user)

      message.success({
        content: "Votre demande de document a été envoyée avec succès!",
        duration: 5,
      })

      form.resetFields()
      setTypeDocument("")
      setErrorDetails(null)
      fetchExistingDemandes()
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error)

      let errorMessage = "Une erreur inattendue s'est produite"

      if (error.status === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour soumettre des demandes."
      } else if (error.status === 400) {
        errorMessage = "Données de demande invalides. Vérifiez tous les champs."
      } else {
        errorMessage = error.message || errorMessage
      }

      setErrorDetails({
        type: "error",
        message: errorMessage,
      })

      message.error({
        content: errorMessage,
        duration: 8,
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour afficher le type de document (avec gestion du type "AUTRE")
  const getDisplayType = (demande) => {
    if (demande.type === "AUTRE" && demande.autretype) {
      return demande.autretype
    }
    return getTypeDocumentLabel(demande.type)
  }

  // Obtenir le tag de statut
  const getStatutTag = (statut) => {
    const statusConfig = {
      EN_ATTENTE: { color: "orange", text: "En attente" },
      VALIDEE_RH: { color: "blue", text: "Validé RH" },
      VALIDEE_DIRECTION: { color: "green", text: "Validé" },
      REFUSEE_RH: { color: "red", text: "Refusé" },
      REFUSEE_DIRECTION: { color: "red", text: "Refusé" },
      ANNULEE: { color: "gray", text: "Annulé" },
    }

    const config = statusConfig[statut] || { color: "default", text: statut }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <Title level={2}>Demande de Document Administratif</Title>
        <Text type="secondary" style={{ color: isLightMode ? "#666" : "#ccc" }}>
          Demandez vos documents administratifs
        </Text>
      </div>

      {errorDetails && (
        <div style={{ marginBottom: "24px" }}>
          <Alert
            message={errorDetails.message}
            type={errorDetails.type}
            showIcon
            closable
            onClose={() => setErrorDetails(null)}
          />
        </div>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="Nouvelle Demande" className={isLightMode ? "card-light" : "card-dark"}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                name="type_document"
                label="Type de document"
                rules={[{ required: true, message: "Veuillez sélectionner le type de document" }]}
              >
                <Select
                  placeholder="Sélectionnez le type de document"
                  size="large"
                  options={typesDocument}
                  onChange={handleTypeDocumentChange}
                  className={isLightMode ? "select-light" : "select-dark"}
                  dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                />
              </Form.Item>

              {/* Champ conditionnel pour "Autre" */}
              {typeDocument === "AUTRE" && (
                <Form.Item
                  name="autre_type"
                  label="Précisez le type de document"
                  rules={[{ required: true, message: "Veuillez préciser le type de document" }]}
                >
                  <Input placeholder="Ex: Certificat de travail, Relevé d'heures..." size="large" maxLength={100} 
                  style={{backgroundColor: isLightMode? "white" : "#2c3e50"}}/>
                </Form.Item>
              )}

              <Form.Item name="commentaire" label="Commentaire (optionnel)">
                <TextArea rows={4} placeholder="Informations complémentaires..." maxLength={500} style={{backgroundColor: isLightMode? "white" : "#2c3e50"}} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} block loading={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer la demande"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
          className={isLightMode ? "card-light" : "card-dark"}
            title="Mes Demandes de Documents"
            extra={
              <Button onClick={fetchExistingDemandes} loading={loadingDemandes} icon={<ReloadOutlined />}>
                Actualiser
              </Button>
            }
          >
            <List
              dataSource={existingDemandes}
              loading={loadingDemandes}
              locale={{ emptyText: "Aucune demande de document" }}
              renderItem={(demande) => (
                <List.Item
                  actions={[
                    // Action Annuler (seulement si en attente)
                    ...(demande.statut === "EN_ATTENTE"
                      ? [
                          <Popconfirm
                            key="cancel"
                            title="Êtes-vous sûr de vouloir annuler cette demande ?"
                            onConfirm={() => handleCancelDemande(demande.id)}
                            okText="Oui"
                            cancelText="Non"
                          >
                            <Button type="link" icon={<StopOutlined />} danger>
                              Annuler
                            </Button>
                          </Popconfirm>,
                        ]
                      : []),
                    // Action Supprimer (seulement si refusée ou annulée)
                    ...(demande.statut === "REFUSEE" || demande.statut === "ANNULEE"
                      ? [
                          <Popconfirm
                            key="delete"
                            title="Êtes-vous sûr de vouloir supprimer cette demande ?"
                            onConfirm={() => handleDeleteDemande(demande.id)}
                            okText="Oui"
                            cancelText="Non"
                          >
                            <Button type="link" icon={<DeleteOutlined />} danger>
                              Supprimer
                            </Button>
                          </Popconfirm>,
                        ]
                      : []),
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{getDisplayType(demande)}</Text>
                        {getStatutTag(demande.statut)}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">Demandé le {dayjs(demande.dateDemande).format("DD/MM/YYYY")}</Text>
                        {demande.commentaire && (
                          <>
                            <br />
                            <Text type="secondary">
                                Commentaire : {" "}
                              { demande.commentaire.length > 100
                                ? `${demande.commentaire.substring(0, 100)}...`
                                : demande.commentaire}
                            </Text>
                          </>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
