

import { useState } from "react"
import { Layout, Card, Row, Col, Typography, Button } from "antd"
import DemandeCongeForm from "./DemandeCongeForm"
import DemandeAbsenceForm from "./DemandeAbsenceForm"
import DemandeDocumentForm from "./DemandeDocumentForm"
import { useTheme } from "../../contexts/ThemeContext"
import img from "../../img/123.svg"
import img1 from "../../img/1234.svg"
import img2 from "../../img/12345.svg"

const { Title, Text } = Typography
const { Content } = Layout

export default function DemandesAdministratives() {
  const [selectedDemande, setSelectedDemande] = useState(null)
  const { isLightMode } = useTheme()

  const typesDemandes = [
    {
      id: "conge",
      title: "Demande de Congé",
      description: "Demander des jours de congés payés, RTT ou congés exceptionnels",
      image: img1,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      buttonColor: "#764ba2",
    },
    {
      id: "absence",
      title: "Demande d'Absence",
      description: "Signaler une absence pour maladie, formation ou autres motifs",
      image:img,
      gradient: "linear-gradient(135deg, rgb(175, 251, 147) 0%, #52c41a 100%)",
      buttonColor: "#52c41a",
    },
    {
      id: "document",
      title: "Demande de Document",
      description: "Demander une attestation, certificat de travail ou autres documents",
      image: img2,
      gradient: "linear-gradient(135deg,rgb(245, 137, 118) 0%, #f9735b 100%)",
      buttonColor: "#f9735b",
    },
  ]

  const handleSelectDemande = (type) => {
    setSelectedDemande(type)
  }

  const handleRetour = () => {
    setSelectedDemande(null)
  }

  // Fonction pour obtenir le titre du formulaire sélectionné
  const getSelectedTitle = () => {
    const selected = typesDemandes.find((type) => type.id === selectedDemande)
    return selected ? selected.title : "Demande"
  }

  if (selectedDemande) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <Card
            title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>{getSelectedTitle()}</span>}
            className={isLightMode ? "card-light" : "card-dark"}
            extra={
              <Button
                onClick={handleRetour}
                type="primary"
                style={{
                  backgroundColor: "#4880FF",
                  borderColor: "#4880FF",
                }}
              >
                ← Retour aux demandes
              </Button>
            }
          >
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              {selectedDemande === "conge" && <DemandeCongeForm />}
              {selectedDemande === "absence" && <DemandeAbsenceForm />}
              {selectedDemande === "document" && <DemandeDocumentForm />}
            </div>
          </Card>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Demandes Administratives</span>}
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
        >
          <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <Text
                type="secondary"
                style={{
                  fontSize: "16px",
                  color: isLightMode ? "#666" : "#ccc",
                }}
              >
                Sélectionnez le type de demande que vous souhaitez effectuer
              </Text>
            </div>

            <Row gutter={[32, 32]} justify="center">
              {typesDemandes.map((type) => (
                <Col xs={24} sm={12} lg={8} key={type.id}>
                  <Card
                    hoverable
                    style={{
                      height: "400px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "none",
                      boxShadow: isLightMode ? "0 8px 32px rgba(0, 0, 0, 0.1)" : "0 8px 32px rgba(0, 0, 0, 0.3)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      background: isLightMode ? "#ffffff" : "#2a2a2a",
                    }}
                    bodyStyle={{
                      padding: 0,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onClick={() => handleSelectDemande(type.id)}
                  >
                    {/* Image/Illustration Section */}
                    <div
                      style={{
                        height: "200px",
                        background: type.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={type.image || "/placeholder.svg"}
                        alt={type.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
                        }}
                      />
                    </div>

                    {/* Content Section */}
                    <div
                      style={{
                        padding: "24px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <Title
                          level={4}
                          style={{
                            margin: "0 0 12px 0",
                            color: isLightMode ? "#333" : "#fff",
                            fontSize: "18px",
                            fontWeight: "600",
                            lineHeight: "1.4",
                          }}
                        >
                          {type.title}
                        </Title>
                        <Text
                          style={{
                            fontSize: "14px",
                            color: isLightMode ? "#666" : "#ccc",
                            lineHeight: "1.5",
                            display: "block",
                          }}
                        >
                          {type.description}
                        </Text>
                      </div>

                      {/* Button at bottom */}
                      <Button
                        type="primary"
                        size="large"
                        style={{
                          backgroundColor: type.buttonColor,
                          borderColor: type.buttonColor,
                          width: "100%",
                          marginTop: "20px",
                          borderRadius: "8px",
                          fontWeight: "500",
                        }}
                      >
                        Commencer
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div
              style={{
                marginTop: "48px",
                padding: "32px",
                background: isLightMode
                  ? "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
                  : "linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)",
                borderRadius: "16px",
                textAlign: "center",
                border: `1px solid ${isLightMode ? "#e0e0e0" : "#404040"}`,
              }}
            >
              <Title
                level={4}
                style={{
                  color: isLightMode ? "#333" : "#fff",
                  marginBottom: "12px",
                }}
              >
                Circuit de Validation
              </Title>
              <Text
                style={{
                  color: isLightMode ? "#666" : "#ccc",
                  fontSize: "16px",
                }}
              >
                Vos demandes seront automatiquement transmises aux Ressources Humaines puis à la Direction pour
                validation
              </Text>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}
