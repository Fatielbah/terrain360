

import { useState } from "react"
import { Dropdown, List, Typography, Button, Empty, Spin, Badge, Avatar, Divider, Popconfirm, message } from "antd"
import {
  BellOutlined,
  CheckOutlined,
  CalendarOutlined,
  UserOutlined,
  DeleteOutlined,
  ClearOutlined,
} from "@ant-design/icons"
import { useNotifications } from "../contexts/NotificationContext"

const { Text, Title } = Typography

const NotificationDropdown = ({ isLightMode, children }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications()
  const [visible, setVisible] = useState(false)

  const handleVisibleChange = (flag) => {
    setVisible(flag)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleDeleteAll = () => {
    deleteAllNotifications()
    message.success("Toutes les notifications ont été supprimées")
  }

  const handleDeleteNotification = (notificationId) => {
    if (deleteNotification) {
      deleteNotification(notificationId)
      message.success("Notification supprimée")
    } else {
      console.error("deleteNotification function not available")
      message.error("Erreur lors de la suppression")
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.lue) {
      markAsRead(notification.id)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case "INVITATION_EVENEMENT":
        return <CalendarOutlined style={{ color: "#1890ff" }} />
      case "RAPPEL_EVENEMENT":
        return <BellOutlined style={{ color: "#faad14" }} />
      default:
        return <UserOutlined style={{ color: "#52c41a" }} />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "À l'instant"
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString("fr-FR")
    }
  }

  const dropdownContent = (
    <div
      className={`notification-dropdown ${isLightMode ? "light" : "dark"}`}
      style={{
        width: "400px",
        maxHeight: "500px",
        backgroundColor: isLightMode ? "#fff" : "#1f1f1f",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: `1px solid ${isLightMode ? "#d9d9d9" : "#434343"}`,
      }}
    >
      {/* En-tête fixé */}
      <div
        className="notification-header"
        style={{
          padding: "16px",
          borderBottom: `1px solid ${isLightMode ? "#f0f0f0" : "#434343"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={5}
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: isLightMode ? "#000" : "#fff",
          }}
        >
          Notifications
        </Title>
        <div className="notification-header-actions" style={{ display: "flex", gap: "8px" }}>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
              style={{ fontSize: "12px", padding: "2px 8px" }}
            >
              Marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Popconfirm
              title="Supprimer toutes les notifications ?"
              onConfirm={handleDeleteAll}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="link"
                size="small"
                icon={<ClearOutlined />}
                danger
                style={{ fontSize: "12px", padding: "2px 8px" }}
              >
                Tout supprimer
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Contenu des notifications */}
      <div className="notification-content" style={{ maxHeight: "400px", overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="Aucune notification" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: "20px" }} />
        ) : (
          <List
            dataSource={notifications.slice(0, 10)}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                className={`notification-item ${!notification.lue ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${isLightMode ? "#f0f0f0" : "#434343"}`,
                  backgroundColor: !notification.lue
                    ? isLightMode
                      ? "#cbe5fd"
                      : "#1890ff" // Vert clair pour mode clair, vert foncé pour mode sombre
                    : "transparent",
                  ":hover": {
                    backgroundColor: isLightMode ? "#fafafa" : "#262626",
                  },
                }}
                actions={[
                  <Popconfirm
                    title="Supprimer ?"
                    onConfirm={() => handleDeleteNotification(notification.id)}
                    okText="Oui"
                    cancelText="Non"
                    placement="left"
                    key="delete"
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "#ff4d4f" }}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={!notification.lue}>
                      <Avatar icon={getIcon(notification.type)} size="small" />
                    </Badge>
                  }
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text
                        strong={!notification.lue}
                        style={{
                          fontSize: "14px",
                          color: isLightMode ? "#000" : "#fff",
                        }}
                      >
                        {notification.titre}
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <Text
                        style={{
                          fontSize: "13px",
                          display: "block",
                          marginBottom: "4px",
                          color: isLightMode ? "#666" : "#ccc",
                        }}
                      >
                        {notification.message}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {formatDate(notification.dateCreation)}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer si plus de 10 notifications */}
      {notifications.length > 10 && (
        <>
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ textAlign: "center", padding: "8px" }}>
            <Button type="link" size="small">
              Voir toutes les notifications ({notifications.length})
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={["click"]}
      placement="bottomRight"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      overlayStyle={{ zIndex: 1050 }}
    >
      {children}
    </Dropdown>
  )
}

export default NotificationDropdown
