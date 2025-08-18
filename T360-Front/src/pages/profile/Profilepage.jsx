
import { useState, useEffect } from "react"
import {
  Layout,
  Input,
  DatePicker,
  Select,
  Button,
  Avatar,
  Form,
  Card,
  Row,
  Col,
  Upload,
  message,
  Spin,
  Modal,
  Space,
} from "antd"
import {
  PlusOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  IdcardOutlined, // Added
  TeamOutlined, // Added
} from "@ant-design/icons"
import dayjs from "dayjs"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../contexts/AuthContext"
import { UserService } from "../../services/user-service"
import "./Profilepage.css"
import { validationRules, optionalValidationRules } from "../../utils/validation"

const { Content } = Layout
const { Option } = Select

const ProfilePage = () => {
  const { isLightMode } = useTheme()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [originalData, setOriginalData] = useState(null)
  const { user, isAuthenticated, updateUser, refreshProfileImage } = useAuth()
  const userId = user?.id

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    dateNaissance: "",
    genre: "Homme",
    nationalite: "",
    cin: "", // Added
    situationFamiliale: "", // Added
  })

  // Load user data and profile image on component mount
  useEffect(() => {
    if (userId) {
      loadUserData()
      loadProfileImage()
    }
  }, [userId])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (profileImage && profileImage.startsWith("blob:")) {
        URL.revokeObjectURL(profileImage)
      }
    }
  }, [profileImage])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await UserService.getUserById(userId)
      setFormData(userData)
      setOriginalData(userData)
      form.setFieldsValue({
        ...userData,
        dateNaissance: userData.dateNaissance ? dayjs(userData.dateNaissance) : null,
        cin: userData.cin || "", // Ensure it's not undefined
        situationFamiliale: userData.situationFamiliale || "", // Ensure it's not undefined
      })
    } catch (error) {
      message.error("Erreur lors du chargement des données utilisateur")
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadProfileImage = async () => {
    try {
      const imageBlob = await UserService.getProfileImage(userId)
      if (imageBlob) {
        // Clean up previous blob URL
        if (profileImage && profileImage.startsWith("blob:")) {
          URL.revokeObjectURL(profileImage)
        }
        const imageUrl = URL.createObjectURL(imageBlob)
        setProfileImage(imageUrl)
      } else {
        setProfileImage(null)
      }
    } catch (error) {
      console.error("Error loading profile image:", error)
      setProfileImage(null)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData)
      form.setFieldsValue({
        ...originalData,
        dateNaissance: originalData.dateNaissance ? dayjs(originalData.dateNaissance) : null,
      })
    }
    setIsEditing(false)
  }

  const handleFormSubmit = async (values) => {
    try {
      setLoading(true)
      const updateData = {
        ...values,
        dateNaissance: values.dateNaissance ? values.dateNaissance.format("YYYY-MM-DD") : "",
        cin: values.cin || "", // Ensure it's not undefined
        situationFamiliale: values.situationFamiliale || "", // Ensure it's not undefined
      }
      await UserService.updateUser(userId, updateData)
      // Mettre à jour le contexte avec les données du formulaire
      // car l'API pourrait ne pas retourner les données mises à jour
      updateUser({
        nom: updateData.nom,
        prenom: updateData.prenom,
        email: updateData.email,
        telephone: updateData.telephone,
        adresse: updateData.adresse,
        dateNaissance: updateData.dateNaissance,
        genre: updateData.genre,
        nationalite: updateData.nationalite,
        cin: updateData.cin, // Added
        situationFamiliale: updateData.situationFamiliale, // Added
      })
      message.success("Profil mis à jour avec succès!")
      setFormData(updateData)
      setOriginalData(updateData)
      setIsEditing(false)
    } catch (error) {
      message.error(error.message || "Erreur lors de la mise à jour du profil")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file) => {
    try {
      setImageLoading(true)
      await UserService.uploadProfileImage(userId, file)
      // Reload the profile image
      await loadProfileImage()
      // Forcer le rechargement de l'image dans la topbar
      refreshProfileImage()
      message.success("Photo de profil mise à jour avec succès!")
    } catch (error) {
      message.error(error.message || "Erreur lors de l'upload de l'image")
    } finally {
      setImageLoading(false)
    }
  }

  const handleImageDelete = async () => {
    Modal.confirm({
      title: "Supprimer la photo de profil",
      content: "Êtes-vous sûr de vouloir supprimer votre photo de profil ?",
      okText: "Supprimer",
      cancelText: "Annuler",
      okType: "danger",
      onOk: async () => {
        try {
          await UserService.deleteProfileImage(userId)
          // Clean up current blob URL
          if (profileImage && profileImage.startsWith("blob:")) {
            URL.revokeObjectURL(profileImage)
          }
          setProfileImage(null)
          // Forcer le rechargement de l'image dans la topbar
          refreshProfileImage()
          message.success("Photo de profil supprimée avec succès!")
        } catch (error) {
          message.error(error.message || "Erreur lors de la suppression de l'image")
        }
      },
    })
  }

  const uploadProps = {
    accept: ".png,.jpg,.jpeg,image/png,image/jpeg",
    beforeUpload: (file) => {
      const isPngOrJpg = file.type === "image/png" || file.type === "image/jpeg"
      if (!isPngOrJpg) {
        message.error("Vous ne pouvez télécharger que des fichiers PNG/JPG!")
        return false
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error("L'image doit faire moins de 2MB!")
        return false
      }
      handleImageUpload(file)
      return false // Prevent default upload
    },
    showUploadList: false,
  }

  if (!isAuthenticated || !userId) {
    return (
      <Layout className={isLightMode ? "layout-light" : "layout-dark"}>
        <Content className={isLightMode ? "content-light" : "content-dark"}>
          <Card className={isLightMode ? "card-light" : "card-dark"}>
            <div style={{ textAlign: "center", padding: "50px" }}>
              <p>Vous devez être connecté pour accéder à cette page.</p>
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
          title={<span className={isLightMode ? "card-title-light" : "card-title-dark"}>Profil Utilisateur</span>}
          bordered={false}
          className={isLightMode ? "card-light" : "card-dark"}
          
        >
          {loading && (
            <div className="loading-overlay">
              <Spin size="large" />
            </div>
          )}
          <Row justify="center" style={{ marginBottom: 24 }}>
            <Col>
              <div className="profile-avatar" style={{ padding: "0 50px" }}>
                <Avatar
                  size={100}
                  src={profileImage}
                  icon={!profileImage ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: profileImage ? "transparent" : "#f0f2f5", width: 100, height: 100 }}
                />
                {imageLoading && (
                  <div className="avatar-overlay">
                    <Spin />
                  </div>
                )}
                {!imageLoading && <div className="avatar-overlay"></div>}
              </div>
              <div style={{ textAlign: "center", marginTop: 8, padding: "0 16px" }}>
                <Upload {...uploadProps}>
                  <Button type="link" loading={imageLoading}>
                    {profileImage ? "Modifier image de profil" : "Ajouter image de profil"}
                  </Button>
                </Upload>
                {profileImage && (
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={handleImageDelete}></Button>
                )}
              </div>
            </Col>
          </Row>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit} disabled={!isEditing}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Prénom" name="prenom" rules={validationRules.prenom}>
                  <Input placeholder="Entrez votre prénom" className={isLightMode ? "input-light" : "input-dark"} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Nom" name="nom" rules={validationRules.nom}>
                  <Input placeholder="Entrez votre nom" className={isLightMode ? "input-light" : "input-dark"} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Email" name="email" rules={validationRules.email}>
                  <Input
                    type="email"
                    placeholder="Entrez votre email"
                    className={isLightMode ? "input-light" : "input-dark"}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Adresse" name="adresse" rules={optionalValidationRules.adresseOptional}>
                  <Input placeholder="Entrez votre adresse" className={isLightMode ? "input-light" : "input-dark"} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Téléphone" name="telephone" rules={optionalValidationRules.telephoneOptional}>
                  <Input
                    placeholder="Entrez votre numéro de téléphone"
                    className={isLightMode ? "input-light" : "input-dark"}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Nationalité" name="nationalite" rules={optionalValidationRules.nationaliteOptional}>
                  <Input
                    placeholder="Entrez votre nationalité"
                    className={isLightMode ? "input-light" : "input-dark"}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Date de naissance" name="dateNaissance" rules={validationRules.dateNaissance}>
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Sélectionnez une date"
                    format="DD/MM/YYYY"
                    className={isLightMode ? "input-light" : "input-dark"}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Genre" name="genre" rules={validationRules.genre}>
                  <Select
                    className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                  >
                    <Option value="Homme">Homme</Option>
                    <Option value="Femme">Femme</Option>
                    <Option value="Autre">Autre</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* New: CIN/Passport ID and Situation Familiale */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="CIN / Passeport ID" name="cin" rules={optionalValidationRules.cinOptional}>
                  <Input
                    prefix={<IdcardOutlined />}
                    placeholder="Entrez votre CIN ou Passeport ID"
                    className={isLightMode ? "input-light" : "input-dark"}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Situation Familiale"
                  name="situationFamiliale"
                  rules={optionalValidationRules.situationFamilialeOptional}
                >
                  <Select
                    prefix={<TeamOutlined />}
                    placeholder="Sélectionnez votre situation"
                    className={isLightMode ? "select-light" : "select-dark"}
                    dropdownClassName={isLightMode ? "" : "select-dropdown-dark"}
                  >
                    <Option value="CELIBATAIRE">Célibataire</Option>
                    <Option value="MARIE">Marié(e)</Option>
                    <Option value="DIVORCE">Divorcé(e)</Option>
                    <Option value="VEUF">Veuf(ve)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            {!isEditing ? (
              <Button type="primary" icon={<EditOutlined />} size="large" onClick={handleEdit} style={{ width: 200 }}>
                Modifier
              </Button>
            ) : (
              <Space size="middle">
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  style={{ width: 150 }}
                  onClick={() => form.submit()}
                >
                  Enregistrer
                </Button>
                <Button size="large" onClick={handleCancel} style={{ width: 150 }}>
                  Annuler
                </Button>
              </Space>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  )
}

export default ProfilePage
