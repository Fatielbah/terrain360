
import { useState, useEffect } from "react"
import {
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  DownOutlined,
} from "@ant-design/icons"
import {
  Layout,
  Menu,
  Typography,
  Select,
  Avatar,
  Dropdown,
  Badge,
  Switch,
  message,
  Button,
  Modal,
  Form,
  Input,
  Spin,
} from "antd"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import NotificationDropdown from "./NotificationDropdown"
import { UserService } from "../services/user-service"

const { Text } = Typography
const { Option } = Select
const { Header } = Layout

const MainTopbar = () => {
  const { isLightMode, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { unreadCount, isWebSocketConnected } = useNotifications()
  const navigate = useNavigate()
  const [profileImage, setProfileImage] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)

  // Recharger l'image quand l'utilisateur change ou quand profileImageTimestamp change
  useEffect(() => {
    if (user?.id) {
      loadProfileImage()
    }
  }, [user?.id, user?.profileImageTimestamp])

  const loadProfileImage = async () => {
    setImageLoading(true)
    try {
      const imageBlob = await UserService.getProfileImage(user.id)
      if (imageBlob) {
        const imageUrl = URL.createObjectURL(imageBlob)
        // Nettoyer l'ancienne URL si elle existe
        if (profileImage && profileImage.startsWith("blob:")) {
          URL.revokeObjectURL(profileImage)
        }
        setProfileImage(imageUrl)
      } else {
        setProfileImage(null)
      }
    } catch (error) {
      console.error("Erreur de chargement de l'image:", error)
      setProfileImage(null)
    } finally {
      setImageLoading(false)
    }
  }

  // Nettoyer les URLs blob quand le composant se démonte
  useEffect(() => {
    return () => {
      if (profileImage && profileImage.startsWith("blob:")) {
        URL.revokeObjectURL(profileImage)
      }
    }
  }, [profileImage])

  const handleLogout = () => {
    // Nettoyer l'URL de l'image avant de se déconnecter
    if (profileImage && profileImage.startsWith("blob:")) {
      URL.revokeObjectURL(profileImage)
    }
    logout()
    navigate("/login")
  }

  const handlePasswordChange = async (values) => {
    try {
      await UserService.changePassword(user.id, values)
      message.success("Mot de passe changé avec succès!")
      setChangePasswordVisible(false)
    } catch (error) {
      message.error(error.message || "Erreur lors du changement de mot de passe")
    }
  }

  const menu = (
    <Menu className={isLightMode ? "menu-dropdown-light" : "menu-dropdown-dark"}>
      <Menu.Item
        key="profile"
        icon={<UserOutlined />}
        onClick={() => navigate("/profile")}
        className={isLightMode ? "menu-item-light" : "menu-item-dark"}
      >
        Profil
      </Menu.Item>
      <Menu.Item
        key="password"
        icon={<LockOutlined />}
        onClick={() => setChangePasswordVisible(true)}
        className={isLightMode ? "menu-item-light" : "menu-item-dark"}
      >
        Changer mot de passe
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        className={isLightMode ? "menu-item-light" : "menu-item-dark"}
        onClick={handleLogout}
      >
        Déconnexion
      </Menu.Item>
    </Menu>
  )

  return (
    <>
      <Header
        className={isLightMode ? "header-light" : "header-dark"}
        style={{ position: "fixed", zIndex: 1000, width: "100%" }}
      >
        <div className="topbar-container">
          <div className="logo-container1">
            <Text className="logo-main">
              T<span className={isLightMode ? "logo-sub-light" : "logo-sub-dark"}>360</span>
            </Text>
          </div>

          <div className="topbar-right">
            <NotificationDropdown isLightMode={isLightMode}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Badge count={unreadCount} size="small" overflowCount={99}>
                  <BellOutlined
                    className="bell-icon"
                    style={{
                      fontSize: "16px",
                      cursor: "pointer",
                      color: isWebSocketConnected ? (isLightMode ? "#000" : "#fff") : "#ccc",
                    }}
                  />
                </Badge>
                {!isWebSocketConnected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#ff4d4f",
                      borderRadius: "50%",
                      border: "1px solid #fff",
                    }}
                  />
                )}
              </div>
            </NotificationDropdown>

            <Select
              defaultValue="fr"
              className={isLightMode ? "select-light" : "select-dark"}
              dropdownClassName={isLightMode ? "dropdown-light" : "select-dropdown-dark"}
              bordered={false}
              suffixIcon={null}
            >
              <Option value="fr">🇫🇷 Français</Option>
              <Option value="en">🇬🇧 English</Option>
            </Select>

            <Switch
              checkedChildren={<SunOutlined />}
              unCheckedChildren={<MoonOutlined />}
              checked={isLightMode}
              onChange={toggleTheme}
            />

            <span className={isLightMode ? "role-light" : "role-dark"}>
              {user?.nom && user?.prenom ? `${user.nom} ${user.prenom}` : "Utilisateur"}
            </span>

            <Dropdown
              overlay={menu}
              placement="bottomRight"
              arrow
              className={isLightMode ? "dropdown-light" : "dropdown-dark"}
            >
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Spin spinning={imageLoading} size="small">
                  <Avatar
                    src={profileImage}
                    icon={!profileImage && <UserOutlined />}
                    style={{ backgroundColor: isLightMode ? "#f0f2f5" : "#001529" }}
                  />
                </Spin>
                <DownOutlined className={isLightMode ? "dropdown-icon-light" : "dropdown-icon-dark"} />
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      <Modal
        title="Changer le mot de passe"
        open={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
        footer={null}
        className={isLightMode ? "modal-light" : "modal-dark"}
      >
        <Form onFinish={handlePasswordChange}>
          <Form.Item
            name="currentPassword"
            rules={[{ required: true, message: "Veuillez entrer votre mot de passe actuel" }]}
          >
            <Input.Password placeholder="Mot de passe actuel" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            rules={[{ required: true, message: "Veuillez entrer un nouveau mot de passe" }]}
          >
            <Input.Password placeholder="Nouveau mot de passe" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Veuillez confirmer le nouveau mot de passe" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error("Les mots de passe ne correspondent pas"))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirmer le nouveau mot de passe" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Enregistrer
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default MainTopbar
