"use client"
import { useState, useEffect } from "react"
import "./candidature.css"
import img from "../../img/logo.png"
import Header from "./Header"
import Footer from "./Footer"

const ServicesTerrain360 = () => {
  const [scrolled, setScrolled] = useState(false)
  const [activeService, setActiveService] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const services = [
    {
      id: "cati",
      title: "Enquêtes téléphoniques avec T360 CATI",
      icon: "📞",
      description:
        "Nous disposons de notre propre équipe de télé-enquêteurs expérimentés qui réalisent vos enquêtes téléphoniques. Salariés permanents et multilingues, les télé-enquêteurs de T360 CATI sont régulièrement formés et évalués afin de vous assurer une prestation de haute qualité.",
      subtitle:
        "T360 CATI est une solution simple, qualitative, fiable et économique pour réaliser toutes vos enquêtes téléphoniques.",
      features: [
        {
          title: "Simple",
          description:
            "Vous nous transmettez votre questionnaire (et, le cas échéant, les coordonnées téléphoniques des cibles à interroger). Vous êtes informé de l'avancée du terrain par notre chargé de projets selon la cadence convenue ensemble et pouvez participer à des écoutes en temps réel. Nous nous occupons de tout le reste et vous livrons les données brutes (en tris à plat ou tris croisés selon vos besoins), prêtes à être analysées.",
        },
        {
          title: "Qualitative",
          description:
            "Nous validons toutes les étapes clés du projet avec vous (programmation, prononciation des mots techniques, fréquence des points intermédiaires, avancement des quotas, extraction et format de livraison). Notre chargé de projets assure la formation des télé-enquêteurs et supervise la phase test de chacun (5 appels test/télé-enquêteur).",
        },
        {
          title: "Fiable",
          description:
            "Nous utilisons Askia (logiciel spécialisé pour les enquêtes quantitatives) pour programmer votre questionnaire. Nous travaillons sur les panels que vous nous fournissez ou à partir des bases SIREN pour le BtoB.",
        },
        {
          title: "Economique",
          description:
            "Terrain 360 est une structure légère avec des charges fixes maîtrisées et optimisées. Nos tarifs sont travaillés pour s'ajuster à un contexte économique globalement difficile et à des budgets souvent tendus.",
        },
      ],
      color: "#2563eb",
    },
    {
      id: "cawi",
      title: "Enquêtes en ligne avec T360 CAWI",
      icon: "💻",
      description: "Nous disposons de notre propre plateforme d'administration de questionnaires en ligne : T360 CAWI.",
      subtitle:
        "T360 CAWI est une solution simple, rapide, fiable et économique pour réaliser toutes vos enquêtes en ligne, de la plus basique à la plus élaborée. Elle s'adapte à toutes les situations et à tous types d'études via Internet.",
      features: [
        {
          title: "Simple",
          description:
            "Vous nous transmettez votre questionnaire (et, le cas échéant, les listes d'emails des cibles à interroger). Vous pouvez suivre l'avancée du terrain via notre interface client. Nous nous occupons de tout le reste et vous livrons les données brutes (en tris à plat ou tris croisés selon vos besoins), prêtes à être analysées.",
        },
        {
          title: "Rapide",
          description:
            "Nous pouvons programmer votre questionnaire en moins de 6h. Nous pouvons lancer une enquête online en moins de 12h. Vous pouvez obtenir vos résultats (pour une enquête grand public) en moins de 72h.",
        },
        {
          title: "Fiable",
          description:
            "Nous utilisons Askia (logiciel spécialisé pour les enquêtes quantitatives) pour programmer votre questionnaire. La programmation est faite et contrôlée en interne avant de vous être soumise pour validation. Nous utilisons les panels grand public fournis par des partenaires reconnus et leaders sur leur marché (Bilendi).",
        },
        {
          title: "Economique",
          description:
            "Tout au long de l'enquête, un informaticien et un chargé de projets sont dédiés à votre mission et garantissent la bonne mise en œuvre de votre projet pour des tarifs comptant parmi les plus compétitifs du marché des études online.",
        },
      ],
      color: "#059669",
    },
    {
      id: "am",
      title: "Analyses médiatiques avec T360 AM",
      icon: "📊",
      description: "Nous disposons d'une équipe d'analystes spécialisée dans les analyses médiatiques : T360 AM.",
      subtitle:
        "T360 AM propose une lecture critique de chaque retombée médiatique (presse écrite, TV, Radio et médias en ligne) afin de mesurer l'intensité d'une présence médiatique et d'en évaluer les forces et les faiblesses. T360 AM est une solution simple, qualitative et fiable pour évaluer l'impact des campagnes de relations médias et optimiser les stratégies de communication.",
      features: [
        {
          title: "Simple",
          description:
            "Vous nous transmettez l'ensemble des retombées médiatiques à analyser et le cas échéant, votre grille d'analyse. Nous vous livrons les données brutes (en tris à plat ou tris croisés selon vos besoins), prêtes à être analysées.",
        },
        {
          title: "Qualitative",
          description:
            "Nous pouvons vous établir la grille d'analyse à partir des indicateurs de performance déterminés ensemble.",
        },
        {
          title: "Fiable",
          description:
            "Chaque retombée presse est évaluée avec minutie et précision en suivant scrupuleusement la grille d'analyse.",
        },
      ],
      color: "#dc2626",
    },
  ]

  const handleServiceClick = (serviceId) => {
    setActiveService(activeService === serviceId ? null : serviceId)
  }

  return (
    <div className="terrain360-page">
      {/* TopBar */}
    
      <Header />
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Services
                <span className="highlight"> Terrain360 </span>
                spécialisés dans le recueil de données
              </h1>
              <p className="hero-description">
                Terrain360 propose plusieurs services spécialisés dans le recueil et la gestion de données pour les
                instituts d'études et la recherche de marché.
              </p>
              <div className="company-stats">
                <div className="stat-item">
                  <span className="stat-number">3</span>
                  <span className="stat-label">Services spécialisés</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Qualité garantie</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24h</span>
                  <span className="stat-label">Réactivité</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="decoration-lines"></div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Services Introduction */}
          <div className="company-intro">
            <div className="intro-content">
              <h2>Nos Services Spécialisés</h2>
              <p>
                Terrain360 met à votre disposition une gamme complète de services pour répondre à tous vos besoins en
                matière d'enquêtes et d'analyses. Notre expertise couvre les enquêtes téléphoniques, les sondages en
                ligne et les analyses médiatiques.
              </p>
              <div className="intro-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">🎯</span>
                  <span>Solutions sur mesure</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">⚡</span>
                  <span>Réactivité optimale</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🔒</span>
                  <span>Confidentialité garantie</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="services-section">
            <div className="section-header">
              <h2>Découvrez nos services</h2>
              <p>Cliquez sur chaque service pour découvrir ses avantages et spécificités</p>
            </div>

            <div className="services-grid">
              {services.map((service) => (
                <div key={service.id} className="service-card">
                  <div className="service-card-header">
                    <div className="service-icon" style={{ backgroundColor: `${service.color}20` }}>
                      <span style={{ fontSize: "2rem" }}>{service.icon}</span>
                    </div>
                    <div className="service-info">
                      <h3 className="service-title">{service.title}</h3>
                      <p className="service-description">{service.description}</p>
                      {service.subtitle && <p className="service-subtitle">{service.subtitle}</p>}
                    </div>
                  </div>

                  <div className="service-card-body">
                    <button
                      className="service-toggle-button"
                      onClick={() => handleServiceClick(service.id)}
                      style={{ borderColor: service.color, color: service.color }}
                    >
                      {activeService === service.id ? "Masquer les détails" : "Voir les avantages"}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: activeService === service.id ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>

                    {activeService === service.id && (
                      <div className="service-features">
                        <h4>Avantages clés :</h4>
                        <div className="features-grid">
                          {service.features.map((feature, index) => (
                            <div key={index} className="feature-item">
                              <div className="feature-header">
                                <div className="feature-icon" style={{ backgroundColor: service.color }}>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                </div>
                                <h5 className="feature-title">{feature.title}</h5>
                              </div>
                              <p className="feature-description">{feature.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  
                </div>
              ))}
            </div>
          </div>

          {/* Process Section */}
          <div className="process-section">
            <div className="section-header">
              <h2>Notre processus de travail</h2>
              <p>Une méthodologie éprouvée pour garantir la qualité de vos projets</p>
            </div>

            <div className="process-steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Analyse des besoins</h3>
                  <p>Nous étudions votre projet et définissons ensemble les objectifs et la méthodologie adaptée.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Préparation & Formation</h3>
                  <p>Nos équipes sont formées spécifiquement à votre projet pour garantir la qualité des données.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Réalisation & Supervision</h3>
                  <p>Exécution du projet avec supervision continue et contrôles qualité réguliers.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Livraison & Suivi</h3>
                  <p>Livraison des données dans les délais convenus avec accompagnement post-projet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />


      {/* Scroll to Top Button */}
      <button className="scroll-to-top" onClick={scrollToTop} aria-label="Retour en haut">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  )
}

export default ServicesTerrain360
