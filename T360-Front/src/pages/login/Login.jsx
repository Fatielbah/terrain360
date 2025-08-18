
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Input, Button, Typography, Card, message } from "antd"
import { MailOutlined, LockOutlined } from "@ant-design/icons"
import { useAuth } from "../../contexts/AuthContext"
import { UserService  } from "../../services/user-service"
import { validationRules } from "../../utils/validation"
import "./LogIn.css"

const { Title, Text } = Typography

const LoginForm = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await UserService.signIn({
        username: values.username,
        password: values.password,
      })

      console.log("Réponse backend :", data)

      // Sauvegarder les données utilisateur dans le contexte
      login(data)

      message.success(`Bienvenue ${data.nomDeUtilisateur}`)
      navigate("/profile")
    } catch (error) {
      console.error("Erreur de connexion :", error)
      message.error(error.message || "Nom d'utilisateur ou mot de passe incorrect")
    } finally {
      setLoading(false)
    }
  }

  const navigateToSignup = () => {
    navigate("/signup")
  }


  return (
    <div className="login-container">
      <div className="watermark">VISION 360</div>
      <div className="corner-logo">Vision 360</div>

      <Card className="login-card">
        <Title level={4} className="logo-text">
            <div className="logo-main">T<span className={"logo-sub-light" }>360</span></div> 
        </Title>
        <Title level={3} className="login-title">
          Connexion
        </Title>
        <Text type="secondary" className="login-subtitle">
          Veuillez entrer votre nom d'utilisateur et votre mot de passe pour continuer
        </Text>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            label="Nom d'utilisateur"
            rules={[{ required: true, message: "Veuillez saisir votre nom d'utilisateur !" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nom d'utilisateur" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: "Veuillez saisir votre mot de passe !" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" />
          </Form.Item>

          <div className="form-options">
            <a href="#" className="forgot-password">
              Mot de passe oublié ?
            </a>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Se connecter
            </Button>
          </Form.Item>
          <div className="auth-switch">
            <Text type="secondary">
              Vous n'avez pas de compte ?{" "}
              <Button type="link" onClick={navigateToSignup} className="switch-button">
                S'inscrire
              </Button>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default LoginForm
