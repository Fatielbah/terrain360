"use client"

import { useEffect, useState, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import "./Calendar.css"
import "./EventModal.css"
import "./EventDetailModal.css"
import { Layout, Card, Spin, Alert, Select, Button, Tooltip, message } from "antd"
import { CalendarOutlined, ReloadOutlined, BellOutlined } from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import EventModal from "./EventModal"
import EventDetailModal from "./EventDetailModal"
import {
  createEvent as createEventService,
  updateEvent as updateEventService,
  deleteEvent as deleteEventService,
  getInvitationsByUser,
  getInvitationsByEvent,
  notifyEventUpdate,
  notifyEventDeletion,
  notifyEventMove,
} from "../../services/calender-service"
import dayjs from "dayjs"
import "dayjs/locale/fr"

dayjs.locale("fr")

const { Content } = Layout
const { Option } = Select

const GOOGLE_API_KEY = "AIzaSyCYZX3qN_ByCP-cAJPMEfGwH9XSml0vuco"
const HOLIDAY_CALENDAR_ID = "fr.french#holiday@group.v.calendar.google.com"

const EVENT_COLORS = {
  event: "#b37feb",
  holiday: "#f39597",
  invitation: "#52c41a",
  myEvent: "#1890ff",
  otherEvent: "#ffa940",
  completedEvent: "#52c41a",
}

const isEventCompleted = (event) => {
  const now = dayjs()
  const eventEnd = dayjs(event.end || event.start)
  return eventEnd.isBefore(now)
}

const isEventInPast = (event) => {
  const now = dayjs()
  const eventStart = dayjs(event.start)
  return eventStart.isBefore(now)
}

const isEventInProgress = (event) => {
  const now = dayjs()
  const eventStart = dayjs(event.start)
  const eventEnd = dayjs(event.end || event.start)
  return eventStart.isBefore(now) && eventEnd.isAfter(now)
}

const fetchEvents = async () => {
  try {
    const response = await axios.get("http://localhost:8081/api/evenements")
    return response.data
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}

const Calendar = () => {
  const { isLightMode } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const [calendarRef, setCalendarRef] = useState(null)
  const [currentView, setCurrentView] = useState("dayGridMonth")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loadedYears, setLoadedYears] = useState(new Set())
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const userId = user?.id
  const [eventToDisplay, setEventToDisplay] = useState(null)
  const [isEventDisplayModalVisible, setIsEventDisplayModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [detailedEvent, setDetailedEvent] = useState(null)

  const [invitations, setInvitations] = useState([])
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0)

  const fetchEventsData = useCallback(async () => {
    try {
      const eventsData = await fetchEvents()
      console.log("events:", eventsData)

      const formattedEvents = await Promise.all(
        eventsData.map(async (event) => {
          const start = new Date(event.date + "T" + event.heureDebut).toISOString()
          const end = new Date(event.date + "T" + event.heureFin).toISOString()

          const creatorId =
            event.createurId ||
            event.utilisateurId ||
            event.utilisateur?.id ||
            event.createur?.id ||
            event.user_id ||
            event.creator_id ||
            event.createur_id

          console.log(
            `Événement ${event.id}: creatorId=${creatorId}, currentUserId=${userId}, event.createurId=${event.createurId}`,
          )

          let invitationsCount = 0
          let participantsInfo = ""
          try {
            const eventInvitations = await getInvitationsByEvent(event.id)
            invitationsCount = eventInvitations.length
            const acceptedCount = eventInvitations.filter((inv) => inv.statut === "ACCEPTEE").length
            const pendingCount = eventInvitations.filter((inv) => inv.statut === "EN_ATTENTE").length
            const refusedCount = eventInvitations.filter((inv) => inv.statut === "REFUSEE").length
            participantsInfo = `${acceptedCount} accepté(s), ${pendingCount} en attente, ${refusedCount} refusé(s)`
          } catch (error) {
            console.log("Erreur lors de la récupération des invitations pour l'événement", event.id)
          }

          const eventCompleted = isEventCompleted({ start, end })
          const eventInPast = isEventInPast({ start })
          const eventInProgress = isEventInProgress({ start, end })

          let backgroundColor = EVENT_COLORS.otherEvent
          if (creatorId && userId && Number(creatorId) === Number(userId)) {
            backgroundColor = EVENT_COLORS.myEvent
          }

          const formattedEvent = {
            id: event.id,
            title: event.titre,
            start: start,
            end: end,
            type: "event",
            description: event.description,
            allDay: false,
            visibility: event.visibilite,
            status: event.statut,
            utilisateurId: creatorId,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            invitationsCount: invitationsCount,
            participantsInfo: participantsInfo,
            isCompleted: eventCompleted,
            isPast: eventInPast,
            isInProgress: eventInProgress,
            extendedProps: {
              type: "event",
              description: event.description,
              visibility: event.visibilite,
              status: event.statut,
              utilisateurId: creatorId,
              originalEvent: event,
              isCompleted: eventCompleted,
              isPast: eventInPast,
              isInProgress: eventInProgress,
            },
          }

          return formattedEvent
        }),
      )

      const filteredEvents = await Promise.all(
        formattedEvents.map(async (event) => {
          const creatorId = event.utilisateurId

          if (creatorId && userId && Number(creatorId) === Number(userId)) {
            return event
          }

          try {
            const eventInvitations = await getInvitationsByEvent(event.id)
            const userInvitation = eventInvitations.find(
              (inv) => inv.utilisateur && Number(inv.utilisateur.id) === Number(userId),
            )

            if (userInvitation) {
              return event
            }
          } catch (error) {
            console.log("Erreur lors de la vérification des invitations pour l'événement", event.id)
          }

          return null
        }),
      )

      const authorizedEvents = filteredEvents.filter((event) => event !== null)

      setEvents((prevEvents) => [...prevEvents.filter((e) => e.type !== "event"), ...authorizedEvents])
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error)
    }
  }, [userId])

  const fetchInvitations = useCallback(async () => {
    if (!userId) return

    try {
      const userInvitations = await getInvitationsByUser(userId)
      console.log("Invitations reçues:", userInvitations)

      setInvitations(userInvitations)

      const pendingCount = userInvitations.filter((inv) => inv.statut === "EN_ATTENTE").length
      setPendingInvitationsCount(pendingCount)

      const invitationEvents = userInvitations
        .filter((inv) => inv.evenement)
        .map((invitation) => {
          const event = invitation.evenement
          const start = new Date(event.date + "T" + event.heureDebut).toISOString()
          const end = new Date(event.date + "T" + event.heureFin).toISOString()

          const eventCompleted = isEventCompleted({ start, end })
          const eventTitle = `[Invitation] ${event.titre}`

          return {
            id: `invitation-${invitation.id}`,
            title: eventTitle,
            start: start,
            end: end,
            type: "invitation",
            description: event.description,
            allDay: false,
            invitationId: invitation.id,
            invitationStatus: invitation.statut,
            originalEventId: event.id,
            utilisateurId: event.createur?.id || event.utilisateurId,
            isCompleted: eventCompleted,
            isPast: isEventInPast({ start }),
            isInProgress: isEventInProgress({ start, end }),
            backgroundColor:
              invitation.statut === "EN_ATTENTE" ? "#faad14" : invitation.statut === "ACCEPTEE" ? "#52c41a" : "#ff4d4f",
            extendedProps: {
              type: "invitation",
              description: event.description,
              invitationId: invitation.id,
              invitationStatus: invitation.statut,
              originalEventId: event.id,
              utilisateurId: event.createur?.id || event.utilisateurId,
              isCompleted: eventCompleted,
              isPast: isEventInPast({ start }),
              isInProgress: isEventInProgress({ start, end }),
              originalEvent: event,
            },
          }
        })

      setEvents((prevEvents) => [...prevEvents.filter((e) => e.type !== "invitation"), ...invitationEvents])
    } catch (error) {
      console.error("Erreur lors de la récupération des invitations:", error)
    }
  }, [userId])

  const refreshAllData = useCallback(async () => {
    try {
      console.log("🔄 Début du rafraîchissement des données du calendrier...")
      await Promise.all([fetchEventsData(), fetchInvitations()])
      console.log("✅ Rafraîchissement des données terminé")
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error)
      message.error("Erreur lors de la mise à jour du calendrier")
    }
  }, [fetchEventsData, fetchInvitations])

  const fetchHolidaysForYear = useCallback(
    async (year) => {
      if (loadedYears.has(year)) {
        return []
      }

      try {
        const timeMin = `${year}-01-01T00:00:00Z`
        const timeMax = `${year}-12-31T23:59:59Z`

        const response = await axios.get(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(HOLIDAY_CALENDAR_ID)}/events`,
          {
            params: {
              key: GOOGLE_API_KEY,
              timeMin,
              timeMax,
              maxResults: 200,
              orderBy: "startTime",
              singleEvents: true,
            },
          },
        )

        const holidays = response.data.items.map((event) => ({
          id: event.id,
          title: event.summary,
          start: event.start.date || event.start.dateTime,
          end: event.end?.date || event.end?.dateTime,
          type: "holiday",
          description: event.description || "Jour férié (Google Calendar)",
          allDay: true,
          editable: false,
          backgroundColor: EVENT_COLORS.holiday,
        }))

        return holidays
      } catch (error) {
        console.error(`Erreur lors du chargement des jours fériés pour ${year}:`, error)
        throw error
      }
    },
    [loadedYears],
  )

  const fetchHolidays = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const currentYear = currentDate.getFullYear()
      const yearsToLoad = [currentYear - 1, currentYear, currentYear + 1]
      const newHolidays = []

      for (const year of yearsToLoad) {
        if (!loadedYears.has(year)) {
          const yearHolidays = await fetchHolidaysForYear(year)
          newHolidays.push(...yearHolidays)
          setLoadedYears((prev) => new Set([...prev, year]))
        }
      }

      setEvents((prev) => [...prev.filter((event) => event.type !== "holiday"), ...newHolidays])
    } catch (error) {
      console.error("Erreur lors du chargement des jours fériés :", error)
      setError("Impossible de charger les jours fériés depuis Google Calendar.")
    } finally {
      setLoading(false)
    }
  }, [currentDate, fetchHolidaysForYear, loadedYears])

  useEffect(() => {
    fetchHolidays()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchInvitations()
    }
  }, [fetchInvitations, userId])

  useEffect(() => {
    fetchEventsData()
  }, [fetchEventsData])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const eventIdFromQuery = params.get("eventId")
    const fromNotification = params.get("fromNotification")

    if (eventIdFromQuery && fromNotification === "true" && events.length > 0 && calendarRef) {
      const eventToFocus = events.find((e) => String(e.id) === String(eventIdFromQuery))
      if (eventToFocus) {
        const mockEventInfo = {
          event: {
            id: eventToFocus.id,
            title: eventToFocus.title,
            start: new Date(eventToFocus.start),
            end: eventToFocus.end ? new Date(eventToFocus.end) : null,
            allDay: eventToFocus.allDay,
            extendedProps: {
              type: eventToFocus.type,
              description: eventToFocus.description,
              visibility: eventToFocus.visibility,
              status: eventToFocus.status,
              utilisateurId: eventToFocus.utilisateurId,
              isCompleted: eventToFocus.isCompleted,
              isPast: eventToFocus.isPast,
              isInProgress: eventToFocus.isInProgress,
            },
            backgroundColor: eventToFocus.color,
          },
        }
        handleEventClick(mockEventInfo)

        const calendarApi = calendarRef.getApi()
        if (calendarApi && eventToFocus.start) {
          calendarApi.gotoDate(new Date(eventToFocus.start))
        }

        navigate("/calendar", { replace: true })
      }
    }
  }, [location.search, events, calendarRef, navigate])

  const handleDatesSet = (dateInfo) => {
    const visibleStart = new Date(dateInfo.start)
    const visibleEnd = new Date(dateInfo.end)

    const startYear = visibleStart.getFullYear()
    const endYear = visibleEnd.getFullYear()

    const yearsToCheck = []
    for (let year = startYear; year <= endYear; year++) {
      yearsToCheck.push(year)
    }

    const needToLoadYears = yearsToCheck.some((year) => !loadedYears.has(year))

    if (needToLoadYears) {
      setCurrentDate(new Date(dateInfo.start))
      fetchHolidays()
    }
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
    if (calendarRef) {
      calendarRef.getApi().changeView(view)
    }
  }

  const handleEventClick = async (info) => {
    const event = info.event
    const originalEvent = events.find((e) => String(e.id) === String(event.id))

    console.log("🔍 CLICK EVENT DEBUG:")
    console.log("Event cliqué:", event)
    console.log("Original event trouvé:", originalEvent)

    if (originalEvent?.type === "invitation") {
      console.log("✅ C'est une invitation - affichage direct")
      setDetailedEvent({
        ...originalEvent,
        title: originalEvent.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        type: "invitation",
        description: originalEvent.description,
        invitationId: originalEvent.invitationId || originalEvent.extendedProps?.invitationId,
        invitationStatus: originalEvent.invitationStatus || originalEvent.extendedProps?.invitationStatus,
        originalEventId: originalEvent.originalEventId || originalEvent.extendedProps?.originalEventId,
        utilisateurId: originalEvent.utilisateurId || originalEvent.extendedProps?.utilisateurId,
        colorIndicator: originalEvent.backgroundColor,
        calendarName: "Invitations reçues",
        isCompleted: originalEvent.isCompleted,
        isPast: originalEvent.isPast,
        isInProgress: originalEvent.isInProgress,
      })
    } else {
      // Pour les événements normaux, vérifier si l'utilisateur a une invitation
      console.log("🔍 Événement normal - vérification des invitations...")

      try {
        const eventInvitations = await getInvitationsByEvent(event.id)
        console.log("Invitations trouvées:", eventInvitations)

        const userInvitation = eventInvitations.find(
          (inv) => inv.utilisateur && Number(inv.utilisateur.id) === Number(userId),
        )

        console.log("Invitation de l'utilisateur:", userInvitation)

        if (userInvitation) {
          console.log("✅ Utilisateur a une invitation - affichage en mode invitation")
          setDetailedEvent({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            type: "invitation", // FORCER le type invitation
            description: event.extendedProps?.description || originalEvent?.description,
            // AJOUTER les données d'invitation
            invitationId: userInvitation.id,
            invitationStatus: userInvitation.statut,
            originalEventId: event.id,
            utilisateurId: event.extendedProps?.utilisateurId || originalEvent?.utilisateurId,
            colorIndicator: event.backgroundColor || event.color,
            invitationsCount: originalEvent?.invitationsCount || 0,
            participantsInfo: originalEvent?.participantsInfo || "",
            calendarName: "Invitation reçue",
            isCompleted: event.extendedProps?.isCompleted || originalEvent?.isCompleted,
            isPast: event.extendedProps?.isPast || originalEvent?.isPast,
            isInProgress: event.extendedProps?.isInProgress || originalEvent?.isInProgress,
            originalEvent: originalEvent?.extendedProps?.originalEvent || originalEvent,
          })
        } else {
          console.log("❌ Pas d'invitation - affichage normal")
          setDetailedEvent({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            type: event.extendedProps?.type || originalEvent?.type,
            description: event.extendedProps?.description || originalEvent?.description,
            visibility: event.extendedProps?.visibility || originalEvent?.visibility,
            status: event.extendedProps?.status || originalEvent?.status,
            utilisateurId: event.extendedProps?.utilisateurId || originalEvent?.utilisateurId,
            colorIndicator: event.backgroundColor || event.color,
            invitationsCount: originalEvent?.invitationsCount || 0,
            participantsInfo: originalEvent?.participantsInfo || "",
            calendarName:
              (event.extendedProps?.type || originalEvent?.type) === "holiday"
                ? "Jours fériés au Maroc"
                : "Mon calendrier",
            headerImage:
              (event.extendedProps?.type || originalEvent?.type) === "holiday" ? "/images/birthday-banner.png" : null,
            isCompleted: event.extendedProps?.isCompleted || originalEvent?.isCompleted,
            isPast: event.extendedProps?.isPast || originalEvent?.isPast,
            isInProgress: event.extendedProps?.isInProgress || originalEvent?.isInProgress,
            originalEvent: originalEvent?.extendedProps?.originalEvent || originalEvent,
          })
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des invitations:", error)
        // Affichage normal en cas d'erreur
        setDetailedEvent({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          type: event.extendedProps?.type || originalEvent?.type,
          description: event.extendedProps?.description || originalEvent?.description,
          visibility: event.extendedProps?.visibility || originalEvent?.visibility,
          status: event.extendedProps?.status || originalEvent?.status,
          utilisateurId: event.extendedProps?.utilisateurId || originalEvent?.utilisateurId,
          colorIndicator: event.backgroundColor || event.color,
          invitationsCount: originalEvent?.invitationsCount || 0,
          participantsInfo: originalEvent?.participantsInfo || "",
          calendarName:
            (event.extendedProps?.type || originalEvent?.type) === "holiday"
              ? "Jours fériés au Maroc"
              : "Mon calendrier",
          headerImage:
            (event.extendedProps?.type || originalEvent?.type) === "holiday" ? "/images/birthday-banner.png" : null,
          isCompleted: event.extendedProps?.isCompleted || originalEvent?.isCompleted,
          isPast: event.extendedProps?.isPast || originalEvent?.isPast,
          isInProgress: event.extendedProps?.isInProgress || originalEvent?.isInProgress,
          originalEvent: originalEvent?.extendedProps?.originalEvent || originalEvent,
        })
      }
    }

    setIsDetailModalVisible(true)
  }

  const handleDateClick = (info) => {
    const clickedDate = info.date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (clickedDate.getDay() === 0) {
      message.warning("Impossible d'ajouter un événement le dimanche.")
      return
    }

    if (clickedDate < today) {
      message.warning("Impossible d'ajouter un événement à une date passée.")
      return
    }

    const isHoliday = events.some(
      (event) => event.type === "holiday" && new Date(event.start).toDateString() === clickedDate.toDateString(),
    )

    if (isHoliday) {
      return
    }

    setSelectedDate(clickedDate)
    setEventToDisplay(null)
    setIsModalVisible(true)
  }

  // Gestion du glisser-déposer d'événements AVEC NOTIFICATIONS
  const handleEventDrop = async (info) => {
    const { event, delta, revert } = info
    const originalEvent = events.find((e) => String(e.id) === String(event.id))

    console.log("🔄 Tentative de déplacement d'événement:", {
      eventId: event.id,
      eventTitle: event.title,
      newStart: event.start,
      newEnd: event.end,
      delta: delta,
    })

    // Vérifications de sécurité
    if (!originalEvent) {
      message.error("Événement introuvable")
      revert()
      return
    }

    // Vérifier si c'est le créateur
    const isCreator = originalEvent.utilisateurId && userId && Number(originalEvent.utilisateurId) === Number(userId)
    if (!isCreator) {
      message.error("Seul le créateur peut déplacer cet événement")
      revert()
      return
    }

    // Vérifier si l'événement est en cours ou terminé
    if (originalEvent.isInProgress || originalEvent.isCompleted) {
      message.error("Impossible de déplacer un événement en cours ou terminé")
      revert()
      return
    }

    // Vérifier si la nouvelle date n'est pas dans le passé
    const newDate = dayjs(event.start)
    const today = dayjs().startOf("day")
    if (newDate.isBefore(today)) {
      message.error("Impossible de déplacer un événement vers une date passée")
      revert()
      return
    }

    // Vérifier si ce n'est pas un dimanche
    if (newDate.day() === 0) {
      message.error("Impossible de déplacer un événement vers un dimanche")
      revert()
      return
    }

    // Vérifier si ce n'est pas un jour férié
    const isHoliday = events.some(
      (e) => e.type === "holiday" && dayjs(e.start).format("YYYY-MM-DD") === newDate.format("YYYY-MM-DD"),
    )
    if (isHoliday) {
      message.error("Impossible de déplacer un événement vers un jour férié")
      revert()
      return
    }

    try {
      // Préparer les données pour la mise à jour
      const originalEventData = originalEvent.extendedProps.originalEvent
      const newStartTime = dayjs(event.start)
      const newEndTime = dayjs(event.end)

      const updateData = {
        titre: originalEventData.titre,
        description: originalEventData.description || "",
        date: newStartTime.format("YYYY-MM-DD"),
        heureDebut: newStartTime.format("HH:mm:ss"),
        heureFin: newEndTime.format("HH:mm:ss"),
        visibilite: originalEventData.visibilite || "PRIVE",
        statut: originalEventData.statut || "PLANIFIE",
        utilisateurId: originalEventData.utilisateurId || originalEventData.createurId,
      }

      console.log("📤 Mise à jour de l'événement:", updateData)

      // Mettre à jour l'événement
      await updateEventService(event.id, updateData)

      // 🔔 ENVOYER NOTIFICATION DE DÉPLACEMENT
      try {
        const formattedNewDate = newStartTime.format("dddd, DD MMMM YYYY à HH:mm")
        await notifyEventMove(event.id, userId, event.title, formattedNewDate)
        console.log("✅ Notifications de déplacement envoyées")
      } catch (notificationError) {
        console.error("❌ Erreur notification déplacement:", notificationError)
        // Ne pas faire échouer l'opération pour une erreur de notification
      }

      message.success(`Événement déplacé vers le ${newStartTime.format("DD/MM/YYYY")}`)

      // Rafraîchir les données
      await refreshAllData()
    } catch (error) {
      console.error("❌ Erreur lors du déplacement:", error)
      message.error("Erreur lors du déplacement de l'événement")
      revert()
    }
  }

  // Gestion du redimensionnement d'événements
  const handleEventResize = async (info) => {
    const { event, endDelta, revert } = info
    const originalEvent = events.find((e) => String(e.id) === String(event.id))

    console.log("🔄 Tentative de redimensionnement d'événement:", {
      eventId: event.id,
      newEnd: event.end,
      endDelta: endDelta,
    })

    // Vérifications similaires au déplacement
    if (!originalEvent) {
      message.error("Événement introuvable")
      revert()
      return
    }

    const isCreator = originalEvent.utilisateurId && userId && Number(originalEvent.utilisateurId) === Number(userId)
    if (!isCreator) {
      message.error("Seul le créateur peut modifier cet événement")
      revert()
      return
    }

    if (originalEvent.isInProgress || originalEvent.isCompleted) {
      message.error("Impossible de modifier un événement en cours ou terminé")
      revert()
      return
    }

    try {
      const originalEventData = originalEvent.extendedProps.originalEvent
      const newEndTime = dayjs(event.end)

      const updateData = {
        titre: originalEventData.titre,
        description: originalEventData.description || "",
        date: dayjs(event.start).format("YYYY-MM-DD"),
        heureDebut: dayjs(event.start).format("HH:mm:ss"),
        heureFin: newEndTime.format("HH:mm:ss"),
        visibilite: originalEventData.visibilite || "PRIVE",
        statut: originalEventData.statut || "PLANIFIE",
        utilisateurId: originalEventData.utilisateurId || originalEventData.createurId,
      }

      await updateEventService(event.id, updateData)

      // 🔔 ENVOYER NOTIFICATION DE MODIFICATION
      try {
        await notifyEventUpdate(event.id, userId, event.title)
        console.log("✅ Notifications de modification envoyées")
      } catch (notificationError) {
        console.error("❌ Erreur notification modification:", notificationError)
      }

      message.success("Durée de l'événement modifiée")
      await refreshAllData()
    } catch (error) {
      console.error("❌ Erreur lors du redimensionnement:", error)
      message.error("Erreur lors de la modification de la durée")
      revert()
    }
  }

  const refreshCalendar = () => {
    setEvents(events.filter((event) => event.type !== "holiday"))
    setLoadedYears(new Set())
    fetchHolidays()
    refreshAllData()
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setIsEventDisplayModalVisible(false)
    setSelectedDate(null)
    setEventToDisplay(null)
  }

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false)
    setDetailedEvent(null)
  }

  const handleDisplayModalCancel = () => {
    setIsEventDisplayModalVisible(false)
    setEventToDisplay(null)
  }

  // Fonction pour gérer la modification d'un événement
  const handleEditEvent = (eventToEdit) => {
    console.log("Modification de l'événement:", eventToEdit)

    // Vérifier si l'événement peut être modifié
    if (eventToEdit.isInProgress || eventToEdit.isCompleted) {
      message.error("Impossible de modifier un événement en cours ou terminé.")
      return
    }

    // Préparer les données pour la modal de modification
    const editEventData = {
      id: eventToEdit.id,
      title: eventToEdit.title,
      description: eventToEdit.description,
      start: eventToEdit.start,
      end: eventToEdit.end,
      allDay: eventToEdit.allDay,
      visibility: eventToEdit.visibility,
      status: eventToEdit.status,
      utilisateurId: eventToEdit.utilisateurId,
      isCompleted: eventToEdit.isCompleted,
      isPast: eventToEdit.isPast,
      isInProgress: eventToEdit.isInProgress,
      extendedProps: {
        description: eventToEdit.description,
        visibility: eventToEdit.visibility,
        status: eventToEdit.status,
        utilisateurId: eventToEdit.utilisateurId,
        isCompleted: eventToEdit.isCompleted,
        isPast: eventToEdit.isPast,
        isInProgress: eventToEdit.isInProgress,
        originalEvent: eventToEdit.originalEvent,
      },
    }

    setEventToDisplay(editEventData)
    setIsEventDisplayModalVisible(true)
    setIsDetailModalVisible(false) // Fermer la modal de détails
  }

  const handleSaveEventOrTask = async (data, itemType, isEditMode) => {
    try {
      let result
      if (isEditMode) {
        console.log("Modification de l'événement avec les données:", data)
        result = await updateEventService(data.id, data)

        // 🔔 ENVOYER NOTIFICATION DE MODIFICATION
        try {
          await notifyEventUpdate(data.id, userId, data.titre)
          console.log("✅ Notifications de modification envoyées")
        } catch (notificationError) {
          console.error("❌ Erreur notification modification:", notificationError)
        }
      } else {
        result = await createEventService(data)
      }

      await refreshAllData()
      setIsModalVisible(false)
      setIsEventDisplayModalVisible(false)
      setEventToDisplay(null)

      return result
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de l'événement:`, error)
      throw error
    }
  }

  const handleDeleteEventOrTask = async (eventToDelete) => {
    if (!eventToDelete || !eventToDelete.id) {
      console.log("❌ Erreur: ID manquant")
      message.error("Impossible de supprimer : ID de l'élément manquant.")
      return
    }

    const creatorId = eventToDelete.utilisateurId
    const currentUserId = user?.id

    console.log("Suppression - Vérification des permissions:", {
      eventId: eventToDelete.id,
      creatorId: creatorId,
      currentUserId: currentUserId,
      isAuthorized: Number(creatorId) === Number(currentUserId),
    })

    if (creatorId && currentUserId && Number(creatorId) !== Number(currentUserId)) {
      message.error("Vous n'êtes pas autorisé à supprimer cet élément. Seul le créateur peut le supprimer.")
      return
    }

    const itemType = eventToDelete.type || (eventToDelete.extendedProps && eventToDelete.extendedProps.type) || "event"
    const { id } = eventToDelete

    try {
      if (itemType === "event") {
        // 🔔 ENVOYER NOTIFICATION DE SUPPRESSION AVANT LA SUPPRESSION
        try {
          await notifyEventDeletion(id, userId, eventToDelete.title)
          console.log("✅ Notifications de suppression envoyées")
        } catch (notificationError) {
          console.error("❌ Erreur notification suppression:", notificationError)
        }

        console.log(`Suppression de l'événement avec l'ID: ${id}`)
        await deleteEventService(id)
        message.success("Événement supprimé avec succès !")
      } else {
        message.error("Type d'élément inconnu pour la suppression.")
        return
      }

      await refreshAllData()
      setIsDetailModalVisible(false)
      setIsEventDisplayModalVisible(false)
      setEventToDisplay(null)
      setDetailedEvent(null)
    } catch (error) {
      console.error(`❌ Error deleting ${itemType}:`, error)
      console.error("Error details:", error.response?.data || error.message)
      message.error(`Erreur lors de la suppression de l'événement: ${error.response?.data?.message || error.message}`)
    }
  }

  const eventDidMount = (info) => {
    const event = info.event.extendedProps
    const type = event.type ? event.type.toLowerCase() : ""

    if (type === "event") {
      info.el.classList.add("event-event")
      if (event.isCompleted) {
        info.el.classList.add("completed-event")
      }
      if (event.isInProgress) {
        info.el.classList.add("in-progress-event")
      }
    } else if (type === "holiday") {
      info.el.classList.add("holiday-event")
    } else if (type === "invitation") {
      info.el.classList.add("invitation-event")
    }
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className={isLightMode ? "card-title-light" : "card-title-dark"}>Calendrier</span>
            </div>
          }
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
          extra={
            <div style={{ display: "flex", gap: "8px" }}>
              <Select
                style={{ width: "150px" }}
                value={currentView}
                onChange={handleViewChange}
                prefix={<CalendarOutlined />}
                className={isLightMode ? "select-light" : "select-dark"}
                dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
              >
                <Option value="dayGridMonth">Mois</Option>
                <Option value="timeGridWeek">Semaine</Option>
                <Option value="timeGridDay">Jour</Option>
              </Select>
              <Tooltip title="Rafraîchir le calendrier">
                <Button icon={<ReloadOutlined />} onClick={refreshCalendar} loading={loading} />
              </Tooltip>
            </div>
          }
        >
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: "16px" }} />}

          <div style={{ padding: "20px", background: isLightMode ? "#fff" : "#2d3748", borderRadius: "10px" }}>
            {loading && events.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Spin size="large" tip="Chargement des jours fériés..." />
              </div>
            ) : (
              <FullCalendar
                ref={setCalendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={currentView}
                headerToolbar={{
                  start: "today prev,next",
                  center: "title",
                  end: "",
                }}
                initialDate={currentDate}
                events={events.map((event) => ({
                  ...event,
                  // Définir si l'événement est éditable - seulement pour les événements futurs
                  editable:
                    event.type === "event" &&
                    event.utilisateurId === userId &&
                    !event.isInProgress &&
                    !event.isCompleted,
                  extendedProps: {
                    type: event.type,
                    description: event.description,
                    visibility: event.visibility,
                    status: event.status,
                    utilisateurId: event.utilisateurId,
                    invitationId: event.invitationId,
                    invitationStatus: event.invitationStatus,
                    originalEventId: event.originalEventId,
                    invitationsCount: event.invitationsCount,
                    participantsInfo: event.participantsInfo,
                    originalEvent: event.extendedProps?.originalEvent,
                    isCompleted: event.isCompleted,
                    isPast: event.isPast,
                    isInProgress: event.isInProgress,
                  },
                }))}
                height="auto"
                locale="fr"
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                datesSet={handleDatesSet}
                eventDidMount={eventDidMount}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                selectConstraint={{ start: new Date() }}
                eventConstraint={{
                  start: dayjs().format("YYYY-MM-DD"),
                }}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6], // Lundi à Samedi
                  startTime: "08:00",
                  endTime: "19:00",
                }}
                eventContent={(info) => {
                  const event = info.event
                  const isInvitation = event.extendedProps.type === "invitation"
                  const isMyEvent = event.extendedProps.utilisateurId === userId
                  const invitationsCount = event.extendedProps.invitationsCount || 0
                  const isCompleted = event.extendedProps.isCompleted
                  const isInProgress = event.extendedProps.isInProgress

                  return (
                    <Tooltip
                      title={
                        <div>
                          <div>{event.title}</div>
                          {isCompleted && (
                            <div style={{ fontSize: "11px", color: "#52c41a", marginTop: "4px" }}>
                              Événement terminé
                            </div>
                          )}
                          {isInProgress && (
                            <div style={{ fontSize: "11px", color: "#faad14", marginTop: "4px" }}>
                              Événement en cours
                            </div>
                          )}
                          {event.extendedProps.participantsInfo && (
                            <div style={{ fontSize: "11px", marginTop: "4px" }}>
                              👥 {event.extendedProps.participantsInfo}
                            </div>
                          )}
                          {isMyEvent && <div style={{ fontSize: "11px", color: "#52c41a" }}>Votre événement</div>}
                          {event.editable && (
                            <div style={{ fontSize: "11px", color: "#1890ff", marginTop: "4px" }}>
                              📝 Glissez pour déplacer
                            </div>
                          )}
                        </div>
                      }
                    >
                      <div className="fc-event-title" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {isInvitation && <BellOutlined style={{ fontSize: "10px" }} />}
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{event.title}</span>
                          {invitationsCount > 0 && !isInvitation && (
                            <span
                              style={{
                                fontSize: "9px",
                                backgroundColor: "rgba(255,255,255,0.8)",
                                color: "#333",
                                padding: "1px 4px",
                                borderRadius: "8px",
                                marginLeft: "4px",
                              }}
                            >
                              {invitationsCount}
                            </span>
                          )}
                        </div>

                        {/* Barre de statut pour les événements terminés */}
                        {isCompleted && (
                          <div
                            style={{
                              fontSize: "8px",
                              backgroundColor: "rgba(82, 196, 26, 0.8)",
                              color: "white",
                              padding: "1px 4px",
                              borderRadius: "2px",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            TERMINÉ
                          </div>
                        )}

                        {/* Animation pour les événements en cours */}
                        {isInProgress && (
                          <div
                            style={{
                              fontSize: "8px",
                              background: "linear-gradient(90deg, #faad14, #ffc53d, #faad14)",
                              backgroundSize: "200% 100%",
                              animation: "pulse 2s ease-in-out infinite",
                              color: "white",
                              padding: "1px 4px",
                              borderRadius: "2px",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            EN COURS
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  )
                }}
                className={isLightMode ? "fc fc-theme-light" : "fc fc-theme-dark"}
                
              />
            )}
          </div>
        </Card>
      </Content>

      {/* CSS pour l'animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <EventModal
        visible={isModalVisible || isEventDisplayModalVisible}
        onCancel={handleModalCancel}
        onSave={handleSaveEventOrTask}
        onDelete={handleDeleteEventOrTask}
        isLightMode={isLightMode}
        initialDate={selectedDate}
        eventData={eventToDisplay}
        currentUserId={userId}
        onRefresh={refreshAllData}
      />
      <EventDetailModal
        visible={isDetailModalVisible}
        onClose={handleDetailModalClose}
        event={detailedEvent}
        isLightMode={isLightMode}
        currentUserId={userId}
        onRefresh={refreshAllData}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEventOrTask}
      />
    </Layout>
  )
}

export default Calendar
