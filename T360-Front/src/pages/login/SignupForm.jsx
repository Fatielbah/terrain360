
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Input, Button, Typography, Card, message, Select, DatePicker } from "antd"
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  HomeOutlined,
  IdcardOutlined,
} from "@ant-design/icons"
import { UserService } from "../../services/user-service"
import { validationRules } from "../../utils/validation"
import "./LogIn.css"

const { Title, Text } = Typography
const { Option } = Select

const SignupForm = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const userData = {
        username: values.username,
        password: values.password,
        nom: values.nom,
        prenom: values.prenom,
        email: values.email,
        telephone: values.telephone,
        adresse: values.adresse,
        dateNaissance: values.dateNaissance ? values.dateNaissance.format("YYYY-MM-DD") : null,
        genre: values.genre,
        nationalite: values.nationalite,
        cin: values.cin,
        situationFamiliale: values.situationFamiliale,
      }
      const response = await UserService.signUp(userData)
      console.log("Réponse inscription :", response)
      message.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.")
      navigate("/login")
    } catch (error) {
      console.error("Erreur d'inscription :", error)
      message.error(error.message || "Erreur lors de la création du compte")
    } finally {
      setLoading(false)
    }
  }

  const navigateToLogin = () => {
    navigate("/login")
  }

  const validatePasswordConfirmation = (getFieldValue) => ({
    validator(_, value) {
      if (!value || getFieldValue("password") === value) {
        return Promise.resolve()
      }
      return Promise.reject(new Error("Les mots de passe ne correspondent pas !"))
    },
  })

  return (
    <div className="login-container">
      <div className="watermark">VISION 360</div>
      <div className="corner-logo">Vision 360</div>
      <Card className="auth-card signup-card">
        <Title level={4} className="logo-text">
          <div className="logo-main">
            T<span className="logo-sub-light">360</span>
          </div>
        </Title>
        <Title level={3} className="login-title">
          Inscription
        </Title>
        <Text type="secondary" className="login-subtitle">
          Créez votre compte pour accéder à la plateforme
        </Text>
        <Form form={form} name="signup" onFinish={onFinish} layout="vertical">
          {/* Section Nom/Prénom avec espacement réduit entre eux */}
          <div className="form-row name-section">
            <Form.Item name="nom" label="Nom" rules={validationRules.nom} className="form-item-half">
              <Input prefix={<UserOutlined />} placeholder="Nom" />
            </Form.Item>
            <Form.Item name="prenom" label="Prénom" rules={validationRules.prenom} className="form-item-half">
              <Input prefix={<UserOutlined />} placeholder="Prénom" />
            </Form.Item>
          </div>
          {/* Espacement accru après Nom/Prénom */}
          <div className="large-gap" />
          {/* Section Nom d'utilisateur */}
          <Form.Item name="username" label="Nom d'utilisateur" rules={validationRules.username}>
            <Input prefix={<UserOutlined />} placeholder="Nom d'utilisateur" />
          </Form.Item>
          {/* Section Email */}
          <Form.Item name="email" label="Email" rules={validationRules.email}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          {/* Section Mot de passe */}
          <Form.Item name="password" label="Mot de passe" rules={validationRules.password}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" />
          </Form.Item>
          {/* Section Confirmation mot de passe */}
          <Form.Item
            name="confirmPassword"
            label="Confirmer le mot de passe"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Veuillez confirmer votre mot de passe !" },
              validatePasswordConfirmation(form.getFieldValue),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmer le mot de passe" />
          </Form.Item>
          {/* Téléphone et Genre */}
          <div className="form-row">
            <Form.Item name="telephone" label="Téléphone" rules={validationRules.telephone} className="form-item-half">
              <Input prefix={<PhoneOutlined />} placeholder="Numéro de téléphone" />
            </Form.Item>
            <Form.Item
              name="genre"
              label="Genre"
              rules={[{ required: true, message: "Veuillez sélectionner votre genre !" }]}
              className="form-item-half"
            >
              <Select placeholder="Sélectionner le genre">
                <Option value="HOMME">Homme</Option>
                <Option value="FEMME">Femme</Option>
              </Select>
            </Form.Item>
          </div>
          <div className="large-gap" />
          {/* Adresse - champ plein largeur */}
          <Form.Item name="adresse" label="Adresse" rules={validationRules.adresse} className="full-width-item">
            <Input prefix={<HomeOutlined />} placeholder="Adresse complète" />
          </Form.Item>
          {/* Date de naissance et Nationalité */}
          <div className="form-row ">
            <Form.Item
              name="dateNaissance"
              label="Date de naissance"
              rules={[{ required: true, message: "Veuillez sélectionner votre date de naissance !" }]}
              className="form-item-half"
            >
              <DatePicker placeholder="Date de naissance" style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="nationalite"
              label="Nationalité"
              rules={validationRules.nationalite}
              className="form-item-half"
            >
              <Input placeholder="Nationalité" />
            </Form.Item>
          </div>
<div className="large-gap" />
          {/* New: CIN/Passport ID and Situation Familiale */}
          <div className="form-row">
            <Form.Item name="cin" label="CIN / Passeport ID" rules={validationRules.cin} className="form-item-half">
              <Input prefix={<IdcardOutlined />} placeholder="Numéro CIN ou Passeport" />
            </Form.Item>
            <Form.Item
              name="situationFamiliale"
              label="Situation Familiale"
              rules={validationRules.situationFamiliale}
              className="form-item-half"
            >
              <Select placeholder="Sélectionner la situation">
                <Option value="CELIBATAIRE">Célibataire</Option>
                <Option value="MARIE">Marié(e)</Option>
                <Option value="DIVORCE">Divorcé(e)</Option>
                <Option value="VEUF">Veuf(ve)</Option>
              </Select>
            </Form.Item>
          </div>

          {/* Bouton d'inscription */}
          <Form.Item className="full-width-item">
            <Button type="primary" htmlType="submit" block loading={loading}>
              S'inscrire
            </Button>
          </Form.Item>
          {/* Lien vers la connexion */}
          <div className="auth-switch">
            <Text type="secondary">
              Vous avez déjà un compte ?{" "}
              <Button type="link" onClick={navigateToLogin} className="switch-button">
                Se connecter
              </Button>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default SignupForm
