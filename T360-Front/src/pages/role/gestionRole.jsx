
import { useState, useEffect, useMemo } from "react"
import {
  Layout,
  Card,
  Button,
  Avatar,
  Row,
  Col,
  Select,
  message,
  Spin,
  Modal,
  Tag,
  Space,
  Tooltip,
  Input,
  Empty,
} from "antd"
import {
  UserOutlined,
  CrownOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  EditOutlined,
  TeamOutlined,
  LaptopOutlined,
  EyeOutlined,
  SearchOutlined,
  ClearOutlined,
  FilterOutlined,
} from "@ant-design/icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { RoleService } from "../../services/role-service"
import { UserService } from "../../services/user-service"
import "./gestionRole.css"

const { Content } = Layout
const { Option } = Select
const { Search } = Input

// Définition des rôles disponibles
const ROLES = {
  ADMIN: "ADMIN",
  RH: "RH",
  INFORMATICIEN: "INFORMATICIEN",
  SUPERVISEUR: "SUPERVISEUR",
  ENQUETEUR: "ENQUETEUR",
  DEFAULT: "DEFAULT",
}

// Couleurs pour les rôles
const ROLE_COLORS = {
  ADMIN: "red",
  RH: "purple",
  INFORMATICIEN: "cyan",
  SUPERVISEUR: "orange",
  ENQUETEUR: "blue",
  DEFAULT: "default",
  null: "default",
}

// Icônes pour les rôles
const ROLE_ICONS = {
  ADMIN: <CrownOutlined />,
  RH: <TeamOutlined />,
  INFORMATICIEN: <LaptopOutlined />,
  SUPERVISEUR: <EyeOutlined />,
  ENQUETEUR: <SearchOutlined />,
  DEFAULT: <UserOutlined />,
}

// Labels français pour les rôles
const ROLE_LABELS = {
  ADMIN: "Administrateur",
  RH: "Ressources Humaines",
  INFORMATICIEN: "Informaticien",
  SUPERVISEUR: "Superviseur",
  ENQUETEUR: "Enquêteur",
  DEFAULT: "Sans rôle spécifique",
}

const GestionRoles = () => {
  const { isLightMode } = useTheme()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [selectedRole, setSelectedRole] = useState({})
  const [profileImages, setProfileImages] = useState({})

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const allUsers = await RoleService.getAllUsersWithRoles()

      // Filtrer pour exclure l'utilisateur connecté
      const filteredUsers = allUsers.filter((user) => user.id !== currentUser?.id)
      setUsers(filteredUsers)

      // Charger les images de profil pour chaque utilisateur
      loadProfileImages(filteredUsers)
    } catch (error) {
      message.error("Erreur lors du chargement des utilisateurs")
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadProfileImages = async (usersList) => {
    const images = {}

    for (const user of usersList) {
      try {
        const imageBlob = await UserService.getProfileImage(user.id)
        if (imageBlob) {
          images[user.id] = URL.createObjectURL(imageBlob)
        }
      } catch (error) {
        // Ignorer les erreurs d'image (utilisateur sans photo)
        console.log(`No profile image for user ${user.id}`)
      }
    }

    setProfileImages(images)
  }

  // Fonction de filtrage et recherche avec useMemo pour optimiser les performances
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((user) => {
        const fullName = `${user.prenom} ${user.nom}`.toLowerCase()
        const username = user.nomDeUtilisateur?.toLowerCase() || ""
        const email = user.email?.toLowerCase() || ""

        return (
          fullName.includes(searchLower) ||
          username.includes(searchLower) ||
          email.includes(searchLower) ||
          user.prenom?.toLowerCase().includes(searchLower) ||
          user.nom?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Filtrage par rôle
    if (roleFilter !== "ALL") {
      if (roleFilter === "NO_ROLE") {
        // Utilisateurs sans rôle spécifique (null ou DEFAULT)
        filtered = filtered.filter((user) => !user.role || user.role === "DEFAULT")
      } else {
        // Utilisateurs avec un rôle spécifique
        filtered = filtered.filter((user) => user.role === roleFilter)
      }
    }

    return filtered
  }, [users, searchTerm, roleFilter])

  const handleRoleAction = async (userId, action, newRole = null) => {
  try {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));

    const actions = {
      assign: () => RoleService.assignRole(userId, newRole),
      remove: () => RoleService.removeRole(userId),
      update: () => RoleService.updateRole(userId, newRole)
    };

    if (!actions[action]) throw new Error("Action non reconnue");

    const result = await actions[action]();
    const successMessages = {
      assign: `Rôle ${ROLE_LABELS[newRole]} assigné avec succès`,
      remove: 'Rôle supprimé avec succès',
      update: `Rôle mis à jour vers ${ROLE_LABELS[newRole]}`
    };

    message.success(result.success || successMessages[action] || "Opération réussie");
    await loadUsers();
    setSelectedRole((prev) => ({ ...prev, [userId]: undefined }));
  } catch (error) {
    console.error(`Erreur ${action} rôle:`, error);
    message.error(error.response?.data?.message || error.message || "Erreur lors de l'opération");
  } finally {
    setActionLoading((prev) => ({ ...prev, [userId]: false }));
  }
};

const confirmRoleAction = (userId, userName, action, newRole = null) => {
  const actionConfigs = {
    assign: {
      title: "Assigner un rôle",
      content: `Êtes-vous sûr de vouloir assigner le rôle "${ROLE_LABELS[newRole]}" à ${userName} ?`,
      okType: 'primary'
    },
    remove: {
      title: "Supprimer le rôle",
      content: `Êtes-vous sûr de vouloir supprimer le rôle de ${userName} ? L'utilisateur aura le statut DEFAULT.`,
      okType: 'danger'
    },
    update: {
      title: "Modifier le rôle",
      content: `Êtes-vous sûr de vouloir modifier le rôle de ${userName} vers "${ROLE_LABELS[newRole]}" ?`,
      okType: 'primary'
    }
  };

  if (!actionConfigs[action]) return;

  Modal.confirm({
    ...actionConfigs[action],
    className: isLightMode ? 'modal-light' : 'modal-dark',
    okText: "Confirmer",
    cancelText: "Annuler",
    onOk: () => handleRoleAction(userId, action, newRole),
    bodyStyle: {
      backgroundColor: isLightMode ? '#fff' : '#273142',
      color: isLightMode ? '#000' : '#fff'
    }
  });
};

  const getRoleDisplay = (role) => {
    // Si le rôle est null ou DEFAULT, considérer comme "sans rôle spécifique"
    if (!role || role === "DEFAULT") {
      return (
        <Tag color="default" icon={<UserOutlined />}>
          Aucun rôle
        </Tag>
      )
    }

    return (
      <Tag color={ROLE_COLORS[role]} icon={ROLE_ICONS[role]}>
        {ROLE_LABELS[role] || role}
      </Tag>
    )
  }

  const getUserActions = (user) => {
    const hasSpecificRole = user.role && user.role !== "DEFAULT"
    const currentRole = user.role
    const selectedNewRole = selectedRole[user.id]

    return (
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Select
          placeholder="Sélectionner un rôle"
          style={{ width: "100%" }}
          value={selectedNewRole}
          onChange={(value) => setSelectedRole((prev) => ({ ...prev, [user.id]: value }))}
          className={isLightMode ? "select-light" : "select-dark"}
          dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
        >
          {Object.entries(ROLES).map(([key, value]) => (
            <Option key={key} value={value} disabled={value === currentRole}>
              <Space>
                {ROLE_ICONS[key]}
                {ROLE_LABELS[key]}
              </Space>
            </Option>
          ))}
        </Select>

        <Space size="small" style={{ width: "100%", justifyContent: "center" }}>
          {(!hasSpecificRole || currentRole === "DEFAULT") && selectedNewRole && selectedNewRole !== "DEFAULT" && (
            <Tooltip title={`Assigner le rôle ${ROLE_LABELS[selectedNewRole]}`}>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                size="small"
                loading={actionLoading[user.id]}
                onClick={() => confirmRoleAction(user.id, `${user.prenom} ${user.nom}`, "assign", selectedNewRole)}
              >
                Assigner
              </Button>
            </Tooltip>
          )}

          {hasSpecificRole && selectedNewRole && selectedNewRole !== currentRole && (
            <Tooltip title={`Modifier vers ${ROLE_LABELS[selectedNewRole]}`}>
              <Button
                type="default"
                icon={<EditOutlined />}
                size="small"
                loading={actionLoading[user.id]}
                onClick={() => confirmRoleAction(user.id, `${user.prenom} ${user.nom}`, "update", selectedNewRole)}
              >
                Modifier
              </Button>
            </Tooltip>
          )}

          {hasSpecificRole && currentRole !== "DEFAULT" && (
            <Tooltip title="Retirer le rôle (DEFAULT)">
              <Button
                danger
                icon={<UserDeleteOutlined />}
                size="small"
                loading={actionLoading[user.id]}
                onClick={() => confirmRoleAction(user.id, `${user.prenom} ${user.nom}`, "remove")}
              >
                Retirer
              </Button>
            </Tooltip>
          )}
        </Space>
      </Space>
    )
  }

  // Statistiques des rôles (basées sur les utilisateurs filtrés)
  const getRoleStats = () => {
    const stats = {}
    filteredUsers.forEach((user) => {
      const role = user.role || "DEFAULT"
      stats[role] = (stats[role] || 0) + 1
    })
    return stats
  }

  const roleStats = getRoleStats()

  // Fonction pour effacer tous les filtres
  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("ALL")
  }

  // Fonction pour mettre en évidence le texte recherché
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim() || !text) return text

    const regex = new RegExp(`(${searchTerm.trim()})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: "#fffb8f", padding: "0 2px" }}>
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  if (loading) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <p style={{ marginTop: "16px" }}>Chargement des utilisateurs...</p>
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
      <Content className={isLightMode ? "content-light" : "content-dark"}>
        <Card
          title={
            <span className={isLightMode ? "card-title-light" : "card-title-dark"}>
              Gestion des rôles utilisateurs 
            </span>
          }
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
          
        >
          {/* Barre de recherche et filtres */}
          <Card size="small" style={{ marginBottom: 16 }} className={isLightMode ? "card-light" : "card-dark"}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input 
                placeholder="Rechercher par nom, prénom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                prefix={<SearchOutlined style={{ color: isLightMode ? "#000" : "#ccc" }} />}
                style={{
                  backgroundColor: isLightMode ? "#f8f9fa" : "#273142",
                  color: isLightMode ? "#000" : "#fff",
                  borderRadius: "6px",
                  border: "1px solid #d9d9d9",
                  width: "100%", // ou fixe si tu préfères
                }}
              />
              </Col>

              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Filtrer par rôle"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  style={{ width: "100%" }}
                  className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                >
                  <Option value="ALL">
                    <Space>
                      <FilterOutlined />
                      Tous les rôles
                    </Space>
                  </Option>
                  {Object.entries(ROLES).map(([key, value]) => (
                    <Option key={key} value={value}>
                      <Space>
                        {ROLE_ICONS[key]}
                        {ROLE_LABELS[key]}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={4} md={4}>
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearFilters}
                  disabled={searchTerm === "" && roleFilter === "ALL"}
                >
                  Effacer
                </Button>
              </Col>

              
            </Row>
          </Card>

          {/* Liste des utilisateurs */}
          <Row gutter={[16, 16]}>
            {filteredUsers.map((user) => (
              <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className={isLightMode ? "card-light" : "card-dark"}
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      height: "100%",
                    }}
                  >
                    <Avatar
                      size={64}
                      src={profileImages[user.id]}
                      icon={!profileImages[user.id] && <UserOutlined />}
                      style={{ marginBottom: "12px" }}
                    />

                    <h4 style={{ margin: "0 0 4px", fontSize: "16px" }}>
                      {highlightSearchTerm(`${user.prenom} ${user.nom}`, searchTerm)}
                    </h4>

                    <div style={{ marginBottom: "16px" }}>{getRoleDisplay(user.role)}</div>

                    <div style={{ width: "100%", marginTop: "auto" }}>{getUserActions(user)}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Message si aucun utilisateur trouvé */}
          {filteredUsers.length === 0 && users.length > 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  Aucun utilisateur trouvé pour les critères de recherche
                  <br />
                  <Button type="link" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                </span>
              }
            />
          )}

          {/* Message si aucun utilisateur du tout */}
          {users.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <UserOutlined style={{ fontSize: "48px", color: "#ccc" }} />
              <p style={{ marginTop: "16px", color: "#888" }}>Aucun utilisateur trouvé</p>
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  )
}

export default GestionRoles
