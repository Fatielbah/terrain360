"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Divider,
  TimePicker,
  message,
  Checkbox,
  Card,
  Space,
  Tag,
  InputNumber,
  Radio,
  Alert,
  Spin,
  Switch,
} from "antd"
import { UserOutlined, TeamOutlined, BellOutlined, ExclamationCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import "dayjs/locale/fr"
import utc from "dayjs/plugin/utc"
import {
  fetchServices,
  fetchAllUsersExceptOne,
  getUsersByService,
  sendMultipleInvitations,
  createReminder,
  updateReminder,
  deleteReminder,
  getInvitationsByEvent,
  getReminderByEvent,
  addInvitesToEvent,
  removeInvitesFromEvent,
  notifyInvitationRemoval,
  notifyNewInvitations,
} from "../../services/calender-service"

dayjs.locale("fr")
dayjs.extend(utc)

const { TextArea } = Input
const { Option } = Select

const EventModal = ({
  visible,
  onCancel,
  onSave,
  isLightMode,
  initialDate,
  eventData,
  onDelete,
  currentUserId,
  onRefresh,
}) => {
  const [form] = Form.useForm()
  const [allDay, setAllDay] = useState(true)
  const [inviteType, setInviteType] = useState("person")
  const [services, setServices] = useState([])
  const [users, setUsers] = useState([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [inviteAll, setInviteAll] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedServices, setSelectedServices] = useState([])
  const [serviceUsers, setServiceUsers] = useState({})
  const [selectedUsersByService, setSelectedUsersByService] = useState({})
  const [loadingServiceUsers, setLoadingServiceUsers] = useState({})

  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState(30)
  const [reminderUnit, setReminderUnit] = useState("minutes")
  const [reminderError, setReminderError] = useState("")

  const [existingInvitations, setExistingInvitations] = useState([])
  const [existingReminder, setExistingReminder] = useState(null)
  const [loadingExistingData, setLoadingExistingData] = useState(false)

  const [allowRemoveInvites, setAllowRemoveInvites] = useState(false)
  const [selectedExistingInvites, setSelectedExistingInvites] = useState([])

  const isCreatingMode = !eventData || !eventData.id
  const isDisplayOnlyMode = !!eventData && !isEditMode && !!eventData.id
  const isCreator = eventData && eventData.utilisateurId && currentUserId && eventData.utilisateurId === currentUserId
  const isPastEvent = eventData && (eventData.isInProgress || eventData.isCompleted) // Événements en cours ou terminés

  console.log("Modes détectés:", {
    isCreatingMode,
    isEditMode,
    isDisplayOnlyMode,
    eventDataExists: !!eventData,
    eventId: eventData?.id,
    isPastEvent,
    isCompleted: eventData?.isCompleted,
    isInProgress: eventData?.isInProgress,
  })

  const parseReminderDelay = (delaiAvant) => {
    if (!delaiAvant) return { time: 30, unit: "minutes" }

    const minutesMatch = delaiAvant.match(/PT(\d+)M/)
    const hoursMatch = delaiAvant.match(/PT(\d+)H/)
    const daysMatch = delaiAvant.match(/P(\d+)D/)

    if (minutesMatch) {
      return { time: Number.parseInt(minutesMatch[1]), unit: "minutes" }
    } else if (hoursMatch) {
      return { time: Number.parseInt(hoursMatch[1]), unit: "hours" }
    } else if (daysMatch) {
      return { time: Number.parseInt(daysMatch[1]), unit: "days" }
    }

    return { time: 30, unit: "minutes" }
  }

  const loadExistingData = async (eventId) => {
    if (!eventId) return

    setLoadingExistingData(true)
    try {
      const [invitations, reminder] = await Promise.all([
        getInvitationsByEvent(eventId).catch(() => []),
        getReminderByEvent(eventId).catch(() => null),
      ])

      console.log("Invitations existantes:", invitations)
      console.log("Rappel existant:", reminder)

      setExistingInvitations(invitations || [])
      setExistingReminder(reminder)

      if (reminder) {
        const { time, unit } = parseReminderDelay(reminder.delaiAvant)
        setReminderTime(time)
        setReminderUnit(unit)
        setReminderEnabled(true)
      } else {
        setReminderEnabled(false)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données existantes:", error)
    } finally {
      setLoadingExistingData(false)
    }
  }

  const getAvailableUsers = () => {
    if (!isEditMode) return users

    const existingUserIds = existingInvitations.map((inv) => inv.utilisateur.id)
    return users.filter((user) => !existingUserIds.includes(user.id))
  }

  const getAvailableServiceUsers = (serviceId) => {
    const allServiceUsers = serviceUsers[serviceId] || []
    const filteredServiceUsers = allServiceUsers.filter((user) => user.id !== currentUserId)

    if (!isEditMode) return filteredServiceUsers

    const existingUserIds = existingInvitations.map((inv) => inv.utilisateur.id)
    return filteredServiceUsers.filter((user) => !existingUserIds.includes(user.id))
  }

  useEffect(() => {
    if (eventData && eventData.id) {
      setIsEditMode(true)
      console.log("Mode édition activé")
      loadExistingData(eventData.id)
    } else {
      setIsEditMode(false)
      console.log("Mode création activé")
      setExistingInvitations([])
      setExistingReminder(null)
    }
  }, [eventData])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData] = await Promise.all([fetchServices()])
        setServices(servicesData)
      } catch (error) {
        message.error("Erreur lors du chargement des données")
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUserId) return
      try {
        const users = await fetchAllUsersExceptOne(currentUserId)
        setUsers(users)
      } catch (err) {
        console.error(err)
      }
    }

    fetchUsers()
  }, [currentUserId])

  const loadServiceUsers = async (serviceId) => {
    if (serviceUsers[serviceId]) return

    setLoadingServiceUsers((prev) => ({ ...prev, [serviceId]: true }))
    try {
      const users = await getUsersByService(serviceId)
      setServiceUsers((prev) => ({ ...prev, [serviceId]: users }))
    } catch (error) {
      message.error(`Erreur lors du chargement des utilisateurs du service`)
    } finally {
      setLoadingServiceUsers((prev) => ({ ...prev, [serviceId]: false }))
    }
  }

  const handleServiceSelection = async (serviceIds) => {
    setSelectedServices(serviceIds)

    for (const serviceId of serviceIds) {
      if (!serviceUsers[serviceId]) {
        await loadServiceUsers(serviceId)
      }
    }

    const newSelectedUsersByService = { ...selectedUsersByService }
    Object.keys(newSelectedUsersByService).forEach((serviceIdStr) => {
      const serviceId = Number.parseInt(serviceIdStr)
      if (!serviceIds.includes(serviceId)) {
        delete newSelectedUsersByService[serviceId]
      }
    })
    setSelectedUsersByService(newSelectedUsersByService)
  }

  const handleServiceUserSelection = (serviceId, userIds) => {
    setSelectedUsersByService((prev) => ({
      ...prev,
      [serviceId]: userIds,
    }))
  }

  const handleSelectAllInService = (serviceId, selectAll) => {
    const availableUsers = getAvailableServiceUsers(serviceId)
    if (selectAll) {
      handleServiceUserSelection(
        serviceId,
        availableUsers.map((user) => user.id),
      )
    } else {
      handleServiceUserSelection(serviceId, [])
    }
  }

  const getAllSelectedUsers = () => {
    const allSelected = []

    if (inviteType === "person") {
      const directGuests = form.getFieldValue("guests") || []
      allSelected.push(...directGuests)
    }

    if (inviteType === "service") {
      Object.values(selectedUsersByService).forEach((userIds) => {
        allSelected.push(...userIds)
      })
    }

    return [...new Set(allSelected)]
  }

  const hasInvitations = () => {
    if (isDisplayOnlyMode) return true
    if (isEditMode) return true // En mode édition, on peut sauvegarder sans nouvelles invitations

    const allUsers = getAllSelectedUsers()
    return allUsers.length > 0
  }

  const initialStartTime = initialDate ? dayjs(initialDate) : dayjs()
  const initialEndTime = initialDate ? dayjs(initialDate).add(1, "hour") : dayjs().add(1, "hour")

  useEffect(() => {
    if (eventData) {
      const { title, description, start, end, extendedProps, allDay: isAllDay } = eventData
      setAllDay(isAllDay !== undefined ? isAllDay : false)

      const formValues = {
        title: title,
        description: description || extendedProps?.description,
        startTime: start ? dayjs(start) : null,
        endTime: end ? dayjs(end) : null,
        guests: extendedProps?.invites || [],
        services: extendedProps?.services || [],
      }

      form.setFieldsValue(formValues)
      console.log("Données du formulaire chargées:", formValues)
    } else {
      form.resetFields()
      form.setFieldsValue({
        startTime: initialDate ? dayjs(initialDate) : dayjs(),
        endTime: initialDate ? dayjs(initialDate).add(1, "hour") : dayjs(),
      })
      setAllDay(true)
      setReminderEnabled(true)
      setReminderTime(30)
      setReminderUnit("minutes")
    }

    if (!visible) {
      setIsEditMode(false)
      setSelectedServices([])
      setSelectedUsersByService({})
      setInviteAll(false)
      setExistingInvitations([])
      setExistingReminder(null)
      setSaving(false)
      setReminderError("")
      setAllowRemoveInvites(false)
      setSelectedExistingInvites([])
    }
  }, [visible, eventData, initialDate, form])

  const handleInviteAllToggle = () => {
    const newInviteAll = !inviteAll
    setInviteAll(newInviteAll)

    const availableUsers = getAvailableUsers()
    if (newInviteAll) {
      const allUserIds = availableUsers.map((user) => user.id)
      form.setFieldsValue({ guests: allUserIds })
    } else {
      form.setFieldsValue({ guests: [] })
    }
  }

  const handleGuestsChange = (selectedUserIds) => {
    form.setFieldsValue({ guests: selectedUserIds })
    const availableUsers = getAvailableUsers()
    const allSelected = selectedUserIds.length === availableUsers.length
    if (inviteAll !== allSelected) {
      setInviteAll(allSelected)
    }
  }

  const validateStartTime = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("L'heure de début est obligatoire"))
    }

    const hour = value.hour()
    if (hour < 8 || hour >= 19) {
      return Promise.reject(new Error("L'heure doit être entre 8h00 et 18h59"))
    }

    if (!isEditMode) {
      const eventDate = initialDate ? dayjs(initialDate) : dayjs()
      const selectedDateTime = eventDate.hour(value.hour()).minute(value.minute())
      const now = dayjs()

      if (selectedDateTime.isBefore(now)) {
        return Promise.reject(new Error("L'heure de début ne peut pas être dans le passé"))
      }
    }

    return Promise.resolve()
  }

  const validateEndTime = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value) {
        return Promise.reject(new Error("L'heure de fin est obligatoire"))
      }

      const startTime = getFieldValue("startTime")
      if (!startTime) {
        return Promise.resolve()
      }

      if (value.isBefore(startTime) || value.isSame(startTime)) {
        return Promise.reject(new Error("L'heure de fin doit être postérieure à l'heure de début"))
      }

      const hour = value.hour()
      if (hour < 8 || hour >= 19) {
        return Promise.reject(new Error("L'heure doit être entre 8h00 et 18h59"))
      }

      if (!isEditMode) {
        const eventDate = initialDate ? dayjs(initialDate) : dayjs()
        const selectedDateTime = eventDate.hour(value.hour()).minute(value.minute())
        const now = dayjs()

        if (selectedDateTime.isBefore(now)) {
          return Promise.reject(new Error("L'heure de fin ne peut pas être dans le passé"))
        }
      }

      return Promise.resolve()
    },
  })

  const validateReminderTime = () => {
    if (!reminderEnabled) {
      setReminderError("")
      return true
    }

    const eventDate =
      isEditMode && eventData?.start ? dayjs(eventData.start) : initialDate ? dayjs(initialDate) : dayjs()
    const startTime = form.getFieldValue("startTime")

    if (startTime) {
      const eventDateTime = eventDate.hour(startTime.hour()).minute(startTime.minute())
      const now = dayjs()

      let reminderDateTime = eventDateTime.clone()
      if (reminderUnit === "minutes") {
        reminderDateTime = reminderDateTime.subtract(reminderTime, "minutes")
      } else if (reminderUnit === "hours") {
        reminderDateTime = reminderDateTime.subtract(reminderTime, "hours")
      } else if (reminderUnit === "days") {
        reminderDateTime = reminderDateTime.subtract(reminderTime, "days")
      }

      if (reminderDateTime.isBefore(now)) {
        setReminderError(
          "Le rappel ne peut pas être programmé dans le passé. Veuillez ajuster l'heure de l'événement ou le délai du rappel.",
        )
        return false
      }
    }

    setReminderError("")
    return true
  }

  // Valider le rappel à chaque changement
  useEffect(() => {
    if (reminderEnabled) {
      validateReminderTime()
    }
  }, [reminderEnabled, reminderTime, reminderUnit, form.getFieldValue("startTime")])

  const handleSave = async () => {
    setSaving(true)

    try {
      const values = await form.validateFields()
      console.log("Valeurs du formulaire validées :", values)

      if (isCreatingMode && !hasInvitations()) {
        message.error("Vous devez inviter au moins une personne ou sélectionner un service !")
        setSaving(false)
        return
      }

      if (reminderEnabled && !validateReminderTime()) {
        setSaving(false)
        return
      }

      const eventDate =
        isEditMode && eventData?.start ? dayjs(eventData.start) : initialDate ? dayjs(initialDate) : dayjs()
      const formattedDate = eventDate.format("YYYY-MM-DD")
      const startHour = values.startTime?.hour() || 0
      const endHour = values.endTime?.hour() || 0

      if (startHour < 8 || startHour >= 19) {
        message.error("Les événements doivent commencer entre 8h et 19h")
        setSaving(false)
        return
      }

      if (endHour < 8 || endHour >= 19) {
        message.error("Les événements doivent se terminer entre 8h et 19h")
        setSaving(false)
        return
      }

      if (values.endTime?.isBefore(values.startTime)) {
        message.error("L'heure de fin doit être après l'heure de début")
        setSaving(false)
        return
      }

      const saveData = {
        id: isEditMode && eventData ? eventData.id : undefined,
        titre: values.title,
        description: values.description,
        date: formattedDate,
        heureDebut: `${String(values.startTime?.hour() || (eventData?.start ? dayjs(eventData.start).hour() : 9)).padStart(2, "0")}:${String(values.startTime?.minute() || (eventData?.start ? dayjs(eventData.start).minute() : 0)).padStart(2, "0")}:00`,
        heureFin: `${String(values.endTime?.hour() || (eventData?.end ? dayjs(eventData.end).hour() : 10)).padStart(2, "0")}:${String(values.endTime?.minute() || (eventData?.end ? dayjs(eventData.end).minute() : 0)).padStart(2, "0")}:00`,
        visibilite: "PRIVE",
        statut: "PLANIFIE",
        utilisateurId: currentUserId,
      }

      console.log(`Données envoyées pour ${isEditMode ? "modification" : "création"} :`, saveData)

      const savedItem = await onSave(saveData, "event", isEditMode)
      const itemId = savedItem?.id || (isEditMode ? eventData.id : null)

      let invitationSuccess = true
      let reminderSuccess = true

      // Gestion des invitations
      if (itemId) {
        try {
          if (isEditMode) {
            // En mode édition, gérer les invitations existantes et nouvelles
            const allSelectedUserIds = getAllSelectedUsers()

            // 1. Supprimer les invitations sélectionnées
            if (allowRemoveInvites && selectedExistingInvites.length > 0) {
              console.log("Suppression des invitations sélectionnées:", selectedExistingInvites)

              // Récupérer les informations des utilisateurs avant suppression pour les notifications
              const invitationsToRemove = existingInvitations.filter((inv) => selectedExistingInvites.includes(inv.id))
              const removedUsers = invitationsToRemove.map((inv) => inv.utilisateur)
              const removedUserIds = removedUsers.map((user) => user.id)

              // Supprimer les invitations en utilisant votre endpoint backend
              await removeInvitesFromEvent(itemId, removedUserIds)

              // 🔔 Envoyer notifications de suppression d'invitation
              if (removedUsers.length > 0) {
                try {
                  await notifyInvitationRemoval(itemId, currentUserId, values.title, removedUsers)
                  console.log("✅ Notifications de suppression d'invitation envoyées")
                } catch (notificationError) {
                  console.error("❌ Erreur notification suppression invitation:", notificationError)
                }
              }
            }

            // 2. Ajouter de nouvelles invitations
            if (allSelectedUserIds.length > 0) {
              console.log("Ajout de nouvelles invitations:", allSelectedUserIds)
              await addInvitesToEvent(itemId, allSelectedUserIds)

              // 🔔 Envoyer notifications pour les nouveaux invités
              try {
                // Récupérer les informations des nouveaux utilisateurs invités
                const newUsers = users.filter((user) => allSelectedUserIds.includes(user.id))
                if (newUsers.length > 0) {
                  await notifyNewInvitations(itemId, currentUserId, values.title, newUsers)
                  console.log("✅ Notifications de nouvelles invitations envoyées")
                }
              } catch (notificationError) {
                console.error("❌ Erreur notification nouvelles invitations:", notificationError)
              }
            }
          } else {
            // Mode création
            const allSelectedUserIds = getAllSelectedUsers()
            if (allSelectedUserIds.length > 0) {
              console.log("Envoi des invitations aux utilisateurs:", allSelectedUserIds)
              await sendMultipleInvitations(itemId, allSelectedUserIds)
              console.log("Invitations envoyées avec succès")
            }
          }
        } catch (error) {
          console.error("Erreur lors de la gestion des invitations:", error)
          invitationSuccess = false
        }
      }

      // Gestion des rappels
      if (itemId) {
        try {
          if (reminderEnabled) {
            let delaiAvant = ""
            if (reminderUnit === "minutes") {
              delaiAvant = `PT${reminderTime}M`
            } else if (reminderUnit === "hours") {
              delaiAvant = `PT${reminderTime}H`
            } else if (reminderUnit === "days") {
              delaiAvant = `P${reminderTime}D`
            }

            const reminderData = {
              delaiAvant: delaiAvant,
              envoye: false,
            }

            if (isEditMode && existingReminder) {
              await updateReminder(existingReminder.id, reminderData)
              console.log("Rappel mis à jour avec succès")
            } else {
              await createReminder(itemId, reminderData)
              console.log("Rappel créé avec succès")
            }
          } else if (isEditMode && existingReminder) {
            // Supprimer le rappel existant si désactivé
            await deleteReminder(existingReminder.id)
            console.log("Rappel supprimé avec succès")
          }
        } catch (error) {
          console.error("Erreur lors de la gestion du rappel:", error)
          reminderSuccess = false
        }
      }

      console.log("🔄 Rafraîchissement des données du calendrier...")
      if (onRefresh) {
        await onRefresh()
        console.log("✅ Données du calendrier rafraîchies")
      }

      // Messages de succès
      if (isEditMode) {
        if (invitationSuccess && reminderSuccess) {
          message.success("Événement modifié avec succès !")
        } else if (invitationSuccess && !reminderSuccess) {
          message.success("Événement modifié avec succès ! (Problème avec le rappel)")
        } else if (!invitationSuccess && reminderSuccess) {
          message.success("Événement modifié avec succès ! (Problème avec les invitations)")
        } else {
          message.success("Événement modifié avec succès !")
        }
      } else {
        if (invitationSuccess && reminderSuccess) {
          message.success("Événement créé avec succès ! Invitations envoyées et rappel programmé.")
        } else if (invitationSuccess && !reminderSuccess) {
          message.success("Événement créé avec succès ! Invitations envoyées.")
        } else if (!invitationSuccess && reminderSuccess) {
          message.success("Événement créé avec succès ! Rappel programmé.")
        } else {
          message.success("Événement créé avec succès !")
        }
      }

      // Réinitialiser le formulaire
      form.resetFields()
      setIsEditMode(false)
      setSelectedServices([])
      setSelectedUsersByService({})
      setInviteAll(false)
      setExistingInvitations([])
      setExistingReminder(null)
      setReminderError("")
      setAllowRemoveInvites(false)
      setSelectedExistingInvites([])

      onCancel()
    } catch (validationError) {
      if (validationError.errorFields && validationError.errorFields.length > 0) {
        console.log("Erreurs de validation du formulaire:", validationError.errorFields)
        setSaving(false)
        return
      }

      console.error("Erreur lors de la sauvegarde:", validationError)
      message.error(`Erreur lors de ${isEditMode ? "la modification" : "la création"} de l'événement`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isCreatingMode ? "Ajouter un événement" : isEditMode ? "Modifier l'événement" : "Détails de l'événement"}
      open={visible}
      onCancel={() => {
        if (saving) return
        setIsEditMode(false)
        setSelectedServices([])
        setSelectedUsersByService({})
        setInviteAll(false)
        setExistingInvitations([])
        setExistingReminder(null)
        setReminderError("")
        setAllowRemoveInvites(false)
        setSelectedExistingInvites([])
        onCancel()
      }}
      footer={
        isCreatingMode || isEditMode
          ? [
              <Button
                key="cancel"
                disabled={saving}
                onClick={() => {
                  form.resetFields()
                  setSelectedServices([])
                  setSelectedUsersByService({})
                  setInviteAll(false)
                  setReminderError("")
                  setAllowRemoveInvites(false)
                  setSelectedExistingInvites([])
                  onCancel()
                }}
              >
                Annuler
              </Button>,
              <Button key="save" type="primary" loading={saving} onClick={handleSave}>
                {saving
                  ? isEditMode
                    ? "Modification..."
                    : "Enregistrement..."
                  : isEditMode
                    ? "Modifier"
                    : "Enregistrer"}
              </Button>,
            ]
          : [
              ...(isCreator && !eventData?.isInProgress // Supprimer seulement si créateur et pas en cours
                ? [
                    <Button key="delete" danger onClick={() => onDelete(eventData)} style={{ float: "left" }}>
                      Supprimer
                    </Button>,
                  ]
                : []),
              <Button key="close" type="primary" onClick={onCancel}>
                Fermer
              </Button>,
            ]
      }
      width={700}
      className={isLightMode ? "modal-light" : "modal-dark"}
      maskClosable={!saving}
    >
      {saving && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            borderRadius: "6px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px", fontSize: "16px", fontWeight: "500" }}>
              {isEditMode ? "Modification en cours..." : "Création en cours..."}
            </div>
            <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
              Mise à jour des invitations et du calendrier
            </div>
          </div>
        </div>
      )}

      {isPastEvent && (
        <Alert
          message={eventData?.isInProgress ? "Événement en cours" : "Événement terminé"}
          description={
            eventData?.isInProgress
              ? "Cet événement est en cours et ne peut plus être modifié."
              : "Cet événement est terminé et ne peut plus être modifié."
          }
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {isDisplayOnlyMode && !isCreator && (
        <div style={{ marginBottom: "16px", padding: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>
            ℹ️ Vous consultez un événement créé par un autre utilisateur.
          </span>
        </div>
      )}

      {loadingExistingData && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <div style={{ marginTop: "8px" }}>Chargement des données existantes...</div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startTime: initialStartTime,
          endTime: initialEndTime,
        }}
      >
        <Divider orientation="left">Titre</Divider>
        <Form.Item
          name="title"
          rules={[
            { required: true, message: "Le titre est obligatoire" },
            { min: 3, message: "Le titre doit contenir au moins 3 caractères" },
          ]}
        >
          <Input placeholder="Ajouter un titre" size="large" readOnly={isDisplayOnlyMode || isPastEvent} />
        </Form.Item>

        <Divider orientation="left">Date</Divider>
        <div style={{ marginBottom: "16px" }}>
          <strong>Date:</strong>{" "}
          {isDisplayOnlyMode && eventData?.start
            ? dayjs(eventData.start).format("dddd, DD MMM YYYY")
            : isEditMode && eventData?.start
              ? dayjs(eventData.start).format("dddd, DD MMM YYYY")
              : initialDate
                ? dayjs(initialDate).format("dddd, DD MMM YYYY")
                : "Non spécifiée"}
        </div>

        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <Form.Item
              name="startTime"
              style={{ marginBottom: 0, flex: 1 }}
              rules={[
                { validator: validateStartTime },
                { required: true, message: "Veuillez sélectionner une heure de début" },
              ]}
            >
              <TimePicker
                format="HH:mm"
                placeholder="Heure de début"
                style={{ width: "100%" }}
                size="large"
                disabled={isDisplayOnlyMode || isPastEvent}
                minuteStep={1}
                disabledHours={() => [
                  ...Array(8).keys(),
                  ...Array(5)
                    .keys()
                    .map((i) => i + 19),
                ]}
              />
            </Form.Item>

            <Form.Item
              name="endTime"
              style={{ marginBottom: 0, flex: 1 }}
              rules={[validateEndTime]}
              dependencies={["startTime"]}
            >
              <TimePicker
                format="HH:mm"
                placeholder="Heure de fin"
                style={{ width: "100%" }}
                size="large"
                disabled={isDisplayOnlyMode || isPastEvent}
                minuteStep={1}
                disabledHours={() => [
                  ...Array(8).keys(),
                  ...Array(5)
                    .keys()
                    .map((i) => i + 19),
                ]}
              />
            </Form.Item>
          </div>
        </>

        {isEditMode && existingInvitations.length > 0 && !isPastEvent && (
          <>
            <Divider orientation="left">📋 Invitations existantes</Divider>
            <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}
              >
                <strong>Invités actuels ({existingInvitations.length}) :</strong>
                <Switch
                  size="small"
                  checked={allowRemoveInvites}
                  onChange={setAllowRemoveInvites}
                  checkedChildren="Supprimer"
                  unCheckedChildren="Conserver"
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {existingInvitations.map((invitation) => (
                  <Tag
                    key={invitation.id}
                    color={
                      invitation.statut === "ACCEPTEE" ? "green" : invitation.statut === "EN_ATTENTE" ? "orange" : "red"
                    }
                    closable={allowRemoveInvites && !selectedExistingInvites.includes(invitation.id)}
                    onClose={() => {
                      if (allowRemoveInvites) {
                        setSelectedExistingInvites((prev) => [...prev, invitation.id])
                      }
                    }}
                    style={{
                      opacity: selectedExistingInvites.includes(invitation.id) ? 0.5 : 1,
                      textDecoration: selectedExistingInvites.includes(invitation.id) ? "line-through" : "none",
                    }}
                  >
                    {invitation.utilisateur?.nom} {invitation.utilisateur?.prenom} ({invitation.statut})
                    {selectedExistingInvites.includes(invitation.id) && (
                      <span style={{ marginLeft: "8px", color: "#ff4d4f" }}>- À supprimer</span>
                    )}
                  </Tag>
                ))}
              </div>
              {!allowRemoveInvites && (
                <Alert
                  message="Activez le mode suppression pour retirer des invités existants"
                  type="info"
                  style={{ marginTop: "8px" }}
                  showIcon
                />
              )}
            </div>
          </>
        )}

        {(isCreatingMode || isEditMode) && (
          <>
            <Divider orientation="left">
              {isEditMode ? (
                "Ajouter des invités"
              ) : (
                <>
                  <span style={{ color: "#ff4d4f" }}>*</span> Inviter (Obligatoire)
                </>
              )}
            </Divider>

            {!hasInvitations() && isCreatingMode && (
              <Alert
                message="Vous devez inviter au moins une personne ou sélectionner un service"
                type="warning"
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: "16px" }}
                showIcon
              />
            )}

            <Form.Item>
              <div style={{ flex: 1 }}>
                <Radio.Group
                  value={inviteType}
                  onChange={(e) => setInviteType(e.target.value)}
                  style={{ marginBottom: "16px" }}
                  disabled={isDisplayOnlyMode}
                >
                  <Radio value="person">
                    <UserOutlined /> Inviter des personnes
                  </Radio>
                  <Radio value="service">
                    <TeamOutlined /> Inviter par service
                  </Radio>
                </Radio.Group>

                {inviteType === "person" ? (
                  <>
                    {!isDisplayOnlyMode && (
                      <div style={{ marginBottom: "8px" }}>
                        <Button type={inviteAll ? "primary" : "default"} onClick={handleInviteAllToggle} size="small">
                          {inviteAll ? "Désélectionner tous" : "Inviter tous"}
                        </Button>
                      </div>
                    )}

                    <Form.Item
                      name="guests"
                      style={{ marginBottom: 0 }}
                      rules={[
                        {
                          validator: (_, value) => {
                            if (isCreatingMode && inviteType === "person" && (!value || value.length === 0)) {
                              return Promise.reject(new Error("Veuillez sélectionner au moins une personne"))
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        mode="multiple"
                        style={{ width: "100%" }}
                        placeholder={isEditMode ? "Ajouter de nouveaux invités" : "Ajouter des invités (obligatoire)"}
                        value={form.getFieldValue("guests")}
                        onChange={handleGuestsChange}
                        notFoundContent="Aucun utilisateur trouvé"
                        className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                      >
                        {getAvailableUsers().map((user) => (
                          <Option key={user.id} value={user.id}>
                            {user.nom} {user.prenom}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                ) : (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                        {isEditMode ? (
                          "Ajouter des services :"
                        ) : (
                          <>
                            <span style={{ color: "#ff4d4f" }}>*</span> Sélectionner les services :
                          </>
                        )}
                      </label>
                      <Select
                        mode="multiple"
                        placeholder={
                          isEditMode ? "Choisir des services à ajouter" : "Choisir les services (obligatoire)"
                        }
                        style={{ width: "100%" }}
                        value={selectedServices}
                        onChange={handleServiceSelection}
                        className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                      >
                        {services.map((service) => (
                          <Option key={service.id} value={service.id}>
                            {service.nom}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    {selectedServices.length > 0 && (
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {selectedServices.map((serviceId) => {
                          const service = services.find((s) => s.id === serviceId)
                          const availableUsers = getAvailableServiceUsers(serviceId)
                          const selectedInService = selectedUsersByService[serviceId] || []
                          const isLoading = loadingServiceUsers[serviceId]

                          return (
                            <Card
                              key={serviceId}
                              size="small"
                              style={{ marginBottom: "12px" }}
                              title={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span>{service?.nom}</span>
                                  <Tag color="blue">
                                    {selectedInService.length}/{availableUsers.length} disponibles
                                  </Tag>
                                </div>
                              }
                              extra={
                                availableUsers.length > 0 && (
                                  <Space>
                                    <Button
                                      size="small"
                                      onClick={() => handleSelectAllInService(serviceId, true)}
                                      disabled={selectedInService.length === availableUsers.length}
                                    >
                                      Tout sélectionner
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={() => handleSelectAllInService(serviceId, false)}
                                      disabled={selectedInService.length === 0}
                                    >
                                      Tout désélectionner
                                    </Button>
                                  </Space>
                                )
                              }
                            >
                              {isLoading ? (
                                <div>Chargement des utilisateurs...</div>
                              ) : availableUsers.length === 0 ? (
                                <div style={{ color: "#999", fontStyle: "italic" }}>
                                  Aucun utilisateur disponible dans ce service
                                  {isEditMode && " (déjà invités ou vous êtes exclu automatiquement)"}
                                </div>
                              ) : (
                                <Checkbox.Group
                                  value={selectedInService}
                                  onChange={(checkedValues) => handleServiceUserSelection(serviceId, checkedValues)}
                                  style={{ width: "100%" }}
                                >
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                      gap: "8px",
                                    }}
                                  >
                                    {availableUsers.map((user) => (
                                      <Checkbox key={user.id} value={user.id}>
                                        {user.nom} {user.prenom}
                                      </Checkbox>
                                    ))}
                                  </div>
                                </Checkbox.Group>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )}

                    {selectedServices.length > 0 && (
                      <div
                        style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px",backgroundColor: isLightMode ? "#fff" : "#2c3e50", }}
                      >
                        <strong>{isEditMode ? "Nouveaux invités sélectionnés" : "Résumé des invitations"} :</strong>
                        <div style={{ marginTop: "8px" ,backgroundColor: isLightMode ? "#fff" : "#2c3e50",}}>
                          Total des personnes sélectionnées : <Tag color="green">{getAllSelectedUsers().length}</Tag>
                        </div>
                      </div>
                    )}

                    {selectedServices.length === 0 && isCreatingMode && (
                      <Alert
                        message="Veuillez sélectionner au moins un service"
                        type="error"
                        style={{ marginTop: "8px" }}
                        showIcon
                      />
                    )}
                  </div>
                )}
              </div>
            </Form.Item>
          </>
        )}

        <Divider orientation="left">Description</Divider>
        <Form.Item
          name="description"
          rules={[{ max: 500, message: "La description ne peut pas dépasser 500 caractères" }]}
        >
          {isDisplayOnlyMode ? (
            <p>{form.getFieldValue("description") || "Aucune description"}</p>
          ) : (
            <TextArea
              placeholder="Ajouter une description (optionnel)"
              rows={4}
              readOnly={isDisplayOnlyMode || isPastEvent}
              showCount
              maxLength={500}
            />
          )}
        </Form.Item>

        {isEditMode && existingReminder && (
          <>
            <Divider orientation="left">⏰ Rappel existant</Divider>
            <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#e6f7ff", borderRadius: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BellOutlined style={{ color: "#1890ff" }} />
                <span>
                  <strong>Rappel actuel :</strong> {reminderTime}{" "}
                  {reminderUnit === "minutes" ? "minutes" : reminderUnit === "hours" ? "heures" : "jours"} avant
                  l'événement
                </span>
                <Tag color={existingReminder.envoye ? "green" : "orange"}>
                  {existingReminder.envoye ? "Envoyé" : "En attente"}
                </Tag>
              </div>
            </div>
          </>
        )}

        {(isCreatingMode || isEditMode) && (
          <>
            <Divider orientation="left">
              <BellOutlined /> Rappel
            </Divider>

            <div style={{ marginBottom: "16px" }}>
              <Checkbox checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)}>
                {isEditMode && existingReminder ? "Modifier le rappel" : "Activer le rappel"}
              </Checkbox>
            </div>

            {reminderEnabled && (
              <>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
                  <span>Rappeler</span>
                  <InputNumber
                    min={1}
                    max={999}
                    value={reminderTime}
                    onChange={setReminderTime}
                    style={{ width: "80px" }}
                  />
                  <Select value={reminderUnit} onChange={setReminderUnit} 
                  style={{ width: "120px" }}
                  className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}>
                    <Option value="minutes">minutes</Option>
                    <Option value="hours">heures</Option>
                    <Option value="days">jours</Option>
                  </Select>
                  <span>avant l'événement</span>
                </div>

                {reminderError && (
                  <div
                    style={{
                      color: "#ff4d4f",
                      fontSize: "14px",
                      marginBottom: "16px",
                      padding: "8px",
                      backgroundColor: "#fff2f0",
                      borderRadius: "4px",
                      border: "1px solid #ffccc7",
                    }}
                  >
                    ⚠️ {reminderError}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Form>
    </Modal>
  )
}

export default EventModal
