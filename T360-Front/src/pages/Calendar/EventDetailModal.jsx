"use client"
import { Modal, Button, Tag, message, List, Avatar, Spin } from "antd"
import {
  CloseOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  BellOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"
import "dayjs/locale/fr"
import { respondToInvitation, getInvitationsByEvent } from "../../services/calender-service"
import { useState, useEffect } from "react"

dayjs.locale("fr")

const EventDetailModal = ({ visible, onClose, event, isLightMode, onDelete, currentUserId, onRefresh, onEdit }) => {
  const [invitations, setInvitations] = useState([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const getFrenchEventType = (eventType) => {
    switch (eventType) {
      case "holiday":
        return "Jour férié"
      case "event":
        return "Événement"
      case "invitation":
        return "Invitation reçue"
      default:
        return "Événement personnalisé"
    }
  }

  const currentEvent = event
    ? {
        ...event,
        type: getFrenchEventType(event.type || event.extendedProps?.type),
        colorIndicator: event.colorIndicator || event.color || "#1890ff",
        visibility: event.visibility || "Privé",
        description: event.description || "",
        status: event.status || "",
      }
    : {
        title: "Titre de l'événement",
        start: new Date(),
        end: new Date(),
        type: "Événement personnalisé",
        visibility: "Privé",
        colorIndicator: "#1890ff",
        description: "Ceci est un événement par défaut pour l'exemple.",
        status: "",
      }

  const isHoliday = currentEvent.type === "Jour férié"
  const isInvitation = event?.type === "invitation"
  const isCompleted = event?.isCompleted
  const isPast = event?.isPast
  const isInProgress = event?.isInProgress

  const eventCreatorId = event?.createurId || event?.utilisateurId || event?.createur?.id
  const isCreator = eventCreatorId && currentUserId && Number(eventCreatorId) === Number(currentUserId)

  const canEdit = isCreator && !isHoliday && !isInvitation && !isInProgress && !isCompleted
  const canDelete = isCreator && !isHoliday && !isInvitation

  // Charger les invitations pour cet événement
  useEffect(() => {
    const loadInvitations = async () => {
      if (!event?.id || isInvitation || isHoliday) return

      setLoadingInvitations(true)
      try {
        const eventInvitations = await getInvitationsByEvent(event.id)
        console.log("Invitations chargées:", eventInvitations)
        setInvitations(eventInvitations || [])
      } catch (error) {
        console.error("Erreur lors du chargement des invitations:", error)
        setInvitations([])
      } finally {
        setLoadingInvitations(false)
      }
    }

    if (visible) {
      loadInvitations()
    }
  }, [visible, event?.id, isInvitation, isHoliday])

  const handleDelete = () => {
    if (onDelete && event) {
      const eventToDelete = {
        id: event.id,
        type: event.type || event.extendedProps?.type || "event",
        utilisateurId: event.utilisateurId,
        isPast: event.isPast,
        isInProgress: event.isInProgress,
        extendedProps: event.extendedProps || { type: event.type || "event" },
      }
      onDelete(eventToDelete)
    } else {
      console.error("Impossible de supprimer : données manquantes")
    }
  }

  const handleEdit = () => {
    if (isInProgress) {
      message.error("Impossible de modifier un événement en cours.")
      return
    }

    if (isCompleted) {
      message.error("Impossible de modifier un événement terminé.")
      return
    }

    if (onEdit && event) {
      onEdit(event)
    } else {
      console.error("Impossible de modifier : données manquantes")
    }
  }

  const handleInvitationResponse = async (accepte) => {
    if (!event?.invitationId) {
      message.error("ID d'invitation manquant")
      return
    }

    if (isPast) {
      message.error("Impossible de répondre à une invitation pour un événement passé.")
      return
    }

    try {
      console.log(`Réponse à l'invitation ${event.invitationId}: ${accepte ? "acceptée" : "refusée"}`)
      await respondToInvitation(event.invitationId, accepte)
      message.success(accepte ? "Invitation acceptée !" : "Invitation refusée !")

      if (onRefresh) {
        await onRefresh()
      }
      onClose()
    } catch (error) {
      console.error("Erreur lors de la réponse à l'invitation:", error)
      message.error("Erreur lors de la réponse à l'invitation")
    }
  }

  const getInvitationStatusColor = (status) => {
    switch (status) {
      case "EN_ATTENTE":
        return "orange"
      case "ACCEPTEE":
        return "green"
      case "REFUSEE":
        return "red"
      default:
        return "default"
    }
  }

  const getInvitationStatusText = (status) => {
    switch (status) {
      case "EN_ATTENTE":
        return "En attente"
      case "ACCEPTEE":
        return "Acceptée"
      case "REFUSEE":
        return "Refusée"
      default:
        return status
    }
  }

  // Vérifier si l'utilisateur actuel peut répondre à l'invitation
  const canRespondToInvitation = isInvitation && event?.invitationStatus === "EN_ATTENTE" && !isPast && !isCompleted

  console.log("EventDetailModal - Debug invitation:", {
    isInvitation,
    invitationStatus: event?.invitationStatus,
    isPast,
    isCompleted,
    canRespondToInvitation,
    invitationId: event?.invitationId,
  })

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={520}
        className="modern-event-modal"
        centered
        maskClosable={true}
        styles={{
          body: { padding: 0 },
          content: {
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            backgroundColor: isLightMode ? "#fff" : "#2c3e50",
          },
        }}
          
      >
        {/* Header avec gradient */}
        <div
          style={{
            background: `linear-gradient(135deg, ${currentEvent.colorIndicator}15, ${currentEvent.colorIndicator}25)`,
            borderBottom: `3px solid ${currentEvent.colorIndicator}`,
            padding: "24px",
            position: "relative",
          }}
        >
          {/* Boutons d'action */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              display: "flex",
              gap: "8px",
              zIndex: 10,
              flexWrap: "wrap",
            }}
          >
            {/* Boutons pour les invitations */}
            {canRespondToInvitation && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleInvitationResponse(true)}
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(82, 196, 26, 0.3)",
                  }}
                >
                  Accepter
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleInvitationResponse(false)}
                  style={{
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                  }}
                >
                  Refuser
                </Button>
              </>
            )}

            {/* Boutons pour les événements créés */}
            {canEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={handleEdit}
                style={{
                  backgroundColor: "#1890ff",
                  borderColor: "#1890ff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(24, 144, 255, 0.3)",
                }}
              >
                Modifier
              </Button>
            )}

            {canDelete && (
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
                backgroundColor: isLightMode ? "#fff" : "#2c3e50",
  
                }}
              >
                Supprimer
              </Button>
            )}

            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{
                borderRadius: "8px",
                color: "#666",
              }}
            />
          </div>

          {/* Titre de l'événement */}
          <div style={{ marginTop: "8px", marginRight: "200px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "40px",
                  backgroundColor: currentEvent.colorIndicator,
                  borderRadius: "3px",
                  boxShadow: `0 2px 8px ${currentEvent.colorIndicator}40`,
                }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  lineHeight: "1.3",
                }}
              >
                {isInvitation && <BellOutlined style={{ marginRight: "8px", color: "#faad14" }} />}
                {isInProgress && <span style={{ marginRight: "8px" }}>🔄</span>}
                {currentEvent.title}
              </h2>
            </div>

            {/* Date et heure */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#666",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              <CalendarOutlined />
              <span>{dayjs(currentEvent.start).format("dddd, D MMMM YYYY")}</span>
              {currentEvent.allDay === false && currentEvent.end && (
                <>
                  <ClockCircleOutlined style={{ marginLeft: "12px" }} />
                  <span>
                    {dayjs(currentEvent.start).format("HH:mm")} - {dayjs(currentEvent.end).format("HH:mm")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ padding: "24px", maxHeight: "500px", overflowY: "auto" }}>
          {/* Barres de statut */}
          {isCompleted && (
            <div
              style={{
                background: "linear-gradient(135deg, #52c41a, #73d13d)",
                color: "white",
                padding: "12px 16px",
                borderRadius: "12px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "20px",
                boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>✅</span>
              ÉVÉNEMENT TERMINÉ
            </div>
          )}

          {isInProgress && (
            <div
              style={{
                background: "linear-gradient(135deg, #faad14, #ffc53d)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s ease-in-out infinite",
                color: "white",
                padding: "12px 16px",
                borderRadius: "12px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "20px",
                boxShadow: "0 4px 12px rgba(250, 173, 20, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>🔄</span>
              ÉVÉNEMENT EN COURS
            </div>
          )}

          {/* Informations détaillées */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Type d'événement */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                backgroundColor: isLightMode ? "#fff" : "#2c3e50",
                
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: currentEvent.colorIndicator + "20",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                📋
              </div>
              <div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "2px" }}>Type</div>
                <div style={{ fontSize: "16px", fontWeight: "500", color: "#1a1a1a",
                  backgroundColor: isLightMode ? "#fff" : "#2c3e50",
                 }}>{currentEvent.type}</div>
              </div>
            </div>

            {/* Statut d'invitation */}
            {isInvitation && event?.invitationStatus && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                  backgroundColor: isLightMode ? "#fff" : "#2c3e50",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor:
                      getInvitationStatusColor(event.invitationStatus) === "orange"
                        ? "#faad1420"
                        : getInvitationStatusColor(event.invitationStatus) === "green"
                          ? "#52c41a20"
                          : "#ff4d4f20",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  📨
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: "#666", marginBottom: "2px" }}>Statut de votre invitation</div>
                  <Tag
                    color={getInvitationStatusColor(event.invitationStatus)}
                    style={{
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      padding: "4px 12px",
                    }}
                  >
                    {getInvitationStatusText(event.invitationStatus)}
                  </Tag>
                </div>
              </div>
            )}

            {/* Liste des invités (pour les événements créés) */}
            {!isInvitation && !isHoliday && invitations.length > 0 && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                  backgroundColor: isLightMode ? "#fff" : "#2c3e50",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#1890ff20",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    👥
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: "#666" }}>Invités</div>
                    <div style={{ fontSize: "16px", fontWeight: "500", color: "#1a1a1a",backgroundColor: isLightMode ? "#fff" : "#2c3e50", }}>
                      {invitations.length} personne(s) invitée(s)
                    </div>
                  </div>
                </div>

                {loadingInvitations ? (
                  <div style={{ textAlign: "center", padding: "20px" ,backgroundColor: isLightMode ? "#fff" : "#2c3e50",}}>
                    <Spin size="small" />
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                      Chargement des invitations...
                    </div>
                  </div>
                ) : (
                  <List
                    size="small"
                    dataSource={invitations}
                    renderItem={(invitation) => (
                      <List.Item
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          border: "1px solid #f0f0f0",
                          backgroundColor: isLightMode ? "#fff" : "#2c3e50",
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              size="small"
                              icon={<UserOutlined />}
                              style={{
                                backgroundColor:
                                  invitation.statut === "ACCEPTEE"
                                    ? "#52c41a"
                                    : invitation.statut === "EN_ATTENTE"
                                      ? "#faad14"
                                      : "#ff4d4f",
                              }}
                            />
                          }
                          title={
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>
                                {invitation.utilisateur?.nom} {invitation.utilisateur?.prenom}
                              </span>
                              <Tag
                                color={getInvitationStatusColor(invitation.statut)}
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                {getInvitationStatusText(invitation.statut)}
                              </Tag>
                            </div>
                          }
                          description={
                            <span style={{ fontSize: "12px", color: "#666" }}>
                              {invitation.utilisateur?.email || "Email non disponible"}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}

            {/* Description */}
            {currentEvent.description && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px 16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#52c41a20",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  📄
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>Description</div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#1a1a1a",
                      lineHeight: "1.5",
                    }}
                  >
                    {currentEvent.description}
                  </div>
                </div>
              </div>
            )}

            {/* Messages d'information */}
            {!isHoliday && !isInvitation && !isCreator && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f0f8ff",
                  borderRadius: "12px",
                  border: "1px solid #d6e4ff",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>ℹ️</span>
                <span style={{ fontSize: "14px", color: "#1890ff" }}>
                  Seul le créateur peut modifier ou supprimer cet élément
                </span>
              </div>
            )}

            {isInvitation && event?.invitationStatus !== "EN_ATTENTE" && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f6ffed",
                  borderRadius: "12px",
                  border: "1px solid #b7eb8f",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>✅</span>
                <span style={{ fontSize: "14px", color: "#52c41a" }}>Vous avez déjà répondu à cette invitation</span>
              </div>
            )}

            {isInvitation && isPast && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#fff7e6",
                  borderRadius: "12px",
                  border: "1px solid #ffd591",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ExclamationCircleOutlined style={{ color: "#fa8c16", fontSize: "16px" }} />
                <span style={{ fontSize: "14px", color: "#fa8c16" }}>Cette invitation concerne un événement passé</span>
              </div>
            )}

            {isCreator && !isInvitation && canEdit && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f0f8ff",
                  borderRadius: "12px",
                  border: "1px solid #d6e4ff",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>✨</span>
                <span style={{ fontSize: "14px", color: "#1890ff" }}>
                  Vous êtes le créateur - Glissez l'événement pour le déplacer
                </span>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* CSS pour les animations */}
      <style jsx global>{`
        .modern-event-modal .ant-modal-content {
          border-radius: 16px !important;
          overflow: hidden !important;
        }
        
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .modern-event-modal .ant-btn {
          transition: all 0.3s ease;
        }
        
        .modern-event-modal .ant-btn:hover {
          transform: translateY(-1px);
        }
        
        .modern-event-modal .ant-tag {
          transition: all 0.3s ease;
        }
        
        .modern-event-modal .ant-tag:hover {
          transform: scale(1.05);
        }

        .modern-event-modal .ant-list-item {
          transition: all 0.3s ease;
        }
        
        .modern-event-modal .ant-list-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  )
}

export default EventDetailModal
