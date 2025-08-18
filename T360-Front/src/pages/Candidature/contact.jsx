"use client"

import { useState, useEffect, useRef } from "react"
import "./candidature.css"
import img from "../../img/logo.png"
import Header from "./Header";
import Footer from "./Footer"

const ContactTerrain360 = () => {
  const [scrolled, setScrolled] = useState(false)
  const [contactForm, setContactForm] = useState({
    nomComplet: "",
    prenomComplet: "",
    email: "",
    telephone: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [useAdvancedMap, setUseAdvancedMap] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  // Coordonnées précises de Terrain360
  const terrain360Coords = {
    lat: 31.647951,
    lng: -8.012891,
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)

    // Charger Google Maps si mode avancé activé
    if (useAdvancedMap) {
      loadGoogleMaps()
    }

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [useAdvancedMap])

  const loadGoogleMaps = () => {
    // Remplacez 'VOTRE_CLE_API' par votre vraie clé API Google Maps
    const API_KEY = "VOTRE_CLE_API_GOOGLE_MAPS"

    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`
      script.async = true
      script.defer = true

      window.initMap = initializeGoogleMap
      document.head.appendChild(script)
    } else {
      initializeGoogleMap()
    }
  }

  const initializeGoogleMap = () => {
    if (!mapRef.current || mapInstance.current) return

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 16,
        center: terrain360Coords,
        mapTypeId: "roadmap",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      const marker = new window.google.maps.Marker({
        position: terrain360Coords,
        map: map,
        title: "Terrain360",
        animation: window.google.maps.Animation.DROP,
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; font-family: inherit; line-height: 1.4;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px; margin: -10px -10px 10px -10px; border-radius: 8px 8px 0 0;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 600;">🏢 Terrain360</h3>
              <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-top: 4px; display: inline-block;">Enquêtes & Sondages</span>
            </div>
            <div style="padding: 0;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #1f2937; font-size: 13px;">📍 Adresse :</strong><br/>
                <span style="font-size: 12px; color: #6b7280; line-height: 1.3;">
                  Imm B, RDC, N° 1<br/>
                  Résidence Ahlam II<br/>
                  Avenue Prince Moulay Abdellah<br/>
                  Quartier Guéliz<br/>
                  Marrakech 04000, Maroc
                </span>
              </div>
              <div style="border-top: 1px solid #f3f4f6; padding-top: 8px;">
                <div style="margin-bottom: 6px;">
                  <strong style="color: #1f2937; font-size: 13px;">📞 Téléphone :</strong><br/>
                  <a href="tel:+212524433843" style="color: #3b82f6; text-decoration: none; font-size: 12px;">+212 (0) 524 433 843</a><br/>
                  <a href="tel:+212649360360" style="color: #3b82f6; text-decoration: none; font-size: 12px;">+212 (0) 649 360 360</a>
                </div>
                <div>
                  <strong style="color: #1f2937; font-size: 13px;">✉️ Email :</strong><br/>
                  <a href="mailto:contact@terrain360.eu" style="color: #3b82f6; text-decoration: none; font-size: 12px;">contact@terrain360.eu</a>
                </div>
              </div>
            </div>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })

      // Ouvrir l'info window par défaut
      infoWindow.open(map, marker)

      mapInstance.current = map
      setMapLoaded(true)
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Google Maps:", error)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    
    if (!contactForm.nomComplet) newErrors.nomComplet = "Le nom complet est requis"
    if (!contactForm.prenomComplet) newErrors.prenomComplet = "Le prénom complet est requis"
    if (!contactForm.email) newErrors.email = "L'email est requis"
    if (!contactForm.message) newErrors.message = "Le message est requis"

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (contactForm.email && !emailRegex.test(contactForm.email)) {
      newErrors.email = "Format d'email invalide"
    }

    const phoneRegex = /^[0-9+\-\s()]+$/
    if (contactForm.telephone && !phoneRegex.test(contactForm.telephone)) {
      newErrors.telephone = "Format de téléphone invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  
const handleSubmitContact = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    setSubmitResult({
      success: false,
      message: "Veuillez remplir tous les champs obligatoires correctement.",
    });
    return;
  }

  setSubmitting(true);
  setSubmitResult(null);

  try {
    const response = await fetch("http://localhost:8081/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      nom: contactForm.nomComplet.trim(),
      prenom: contactForm.prenomComplet.trim(),
      email: contactForm.email.trim(),
      tel: contactForm.telephone.trim(),
      message: contactForm.message.trim(),
    }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi du message");
    }

    const data = await response.text();

    setSubmitResult({
      success: true,
      message: "Votre message a été envoyé avec succès ! Nous vous contacterons dans les plus brefs délais.",
    });

    setContactForm({
      nomComplet: "",
      prenomComplet: "",
      email: "",
      telephone: "",
      message: "",
    });
  } catch (error) {
    console.error(error);
    setSubmitResult({
      success: false,
      message: "Erreur lors de l'envoi de votre message. Veuillez réessayer.",
    });
  } finally {
    setSubmitting(false);
  }
};

  const openGoogleMaps = () => {
    const coords = "31.647951,-8.012891"
    window.open(`https://www.google.com/maps/search/?api=1&query=${coords}+(Terrain360)`, "_blank")
  }

  const centerMapOnLocation = () => {
    if (mapInstance.current) {
      mapInstance.current.setCenter({ lat: 31.647951, lng: -8.012891 })
      mapInstance.current.setZoom(16)
    }
  }

  const toggleMapMode = () => {
    setUseAdvancedMap(!useAdvancedMap)
  }

  return (
    <div className="terrain360-page">
      {/* TopBar */}
      <Header/>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Contactez
                <span className="highlight"> Terrain360 </span>
                pour vos projets d'enquêtes
              </h1>
              <p className="hero-description">
                Notre équipe d'experts est à votre disposition pour répondre à vos questions et vous accompagner dans
                vos projets d'études et de sondages.
              </p>
              <div className="company-stats">
                <div className="stat-item">
                  <span className="stat-number">24h</span>
                  <span className="stat-label">Réponse garantie</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">15+</span>
                  <span className="stat-label">Années d'expérience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Satisfaction client</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="decoration-lines"></div>
        </div>
      </section>

      {/* Contact Section */}
      <main className="main-content">
        <div className="container">
          <div className="contact-section">
            <div className="section-header">
              <h2>Nous contacter</h2>
            </div>

            <div className="contact-grid">
              {/* Formulaire de contact */}
              <div className="contact-form-container">
                <div className="contact-form-card">
                  <div className="form-header">
                    <h3>Demande de devis</h3>
                  </div>

                  {submitResult && (
                    <div className={`submit-result ${submitResult.success ? "success" : "error"}`}>
                      <div className="result-icon">
                        {submitResult.success ? (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        ) : (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        )}
                      </div>
                      <div className="result-message">
                        <h4>{submitResult.success ? "Message envoyé !" : "Erreur"}</h4>
                        <p>{submitResult.message}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitContact} className="contact-form">
                    <div className="form-section">
                      

                      <div className="form-row">
                        
                      <div className="form-group">
                          <label>
                            Nom <span className="required-indicator">*</span>
                          </label>
                          <input
                            type="text"
                            name="nomComplet"
                            value={contactForm.nomComplet}
                            onChange={handleInputChange}
                            className={errors.nomComplet ? "error" : ""}
                            placeholder="Votre nom complet"
                            disabled={submitting}
                            required
                          />
                          {errors.nomComplet && <span className="error-message">{errors.nomComplet}</span>}
                        </div>
                        <div className="form-group">
                          <label>
                            Prénom<span className="required-indicator">*</span>
                          </label>
                          <input
                            type="text"
                            name="prenomComplet"
                            value={contactForm.prenomComplet}
                            onChange={handleInputChange}
                            className={errors.prenomComplet ? "error" : ""}
                            placeholder="Votre prenom complet"
                            disabled={submitting}
                            required
                          />
                          {errors.prenomComplet && <span className="error-message">{errors.prenomComplet}</span>}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            Email <span className="required-indicator">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleInputChange}
                            className={errors.email ? "error" : ""}
                            placeholder="votre.email@exemple.com"
                            disabled={submitting}
                            required
                          />
                          {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                          <label>Téléphone</label>
                          <input
                            type="tel"
                            name="telephone"
                            value={contactForm.telephone}
                            onChange={handleInputChange}
                            className={errors.telephone ? "error" : ""}
                            placeholder="+212 6 12 34 56 78"
                            disabled={submitting}
                          />
                          {errors.telephone && <span className="error-message">{errors.telephone}</span>}
                        </div>
                      </div>

                      
                    </div>

                    <div className="form-section">
                      <div className="form-group">
                        <label>
                          Message <span className="required-indicator">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={contactForm.message}
                          onChange={handleInputChange}
                          rows="5"
                          placeholder="Décrivez votre projet et vos besoins..."
                          disabled={submitting}
                          className={errors.message ? "error" : ""}
                          required
                        />
                        {errors.message && <span className="error-message">{errors.message}</span>}
                      </div>
                    </div>

                    <div className="form-note">
                      <p>
                        <span className="required-indicator">*</span> Champs obligatoires
                      </p>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="submit-button" disabled={submitting}>
                        {submitting ? (
                          <>
                            <span className="loading-spinner-small"></span>
                            Envoi en cours...
                          </>
                        ) : (
                          "Envoyer le message"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Informations de contact et carte */}
              <div className="contact-info-container">
                {/* Informations de contact */}
                <div className="contact-info-card">
                  <div className="contact-info-header">
                    <h3>Informations de contact</h3>
                  </div>
                  <div className="contact-info-content">
                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div className="contact-info-details">
                        <h4>Adresse</h4>
                        <p>
                          Imm B, RDC, N° 1, Résidence Ahlam II
                          <br />
                          Avenue Prince Moulay Abdellah
                          <br />
                          Marrakech 04000, Maroc
                        </p>
                      </div>
                    </div>

                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div className="contact-info-details">
                        <h4>Téléphone</h4>
                        <p>
                          <a href="tel:+212524433843">+212 (0) 524 433 843</a>
                          <br />
                          <a href="tel:+212649360360">+212 (0) 649 360 360</a>
                        </p>
                      </div>
                    </div>

                    <div className="contact-info-item">
                      <div className="contact-info-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div className="contact-info-details">
                        <h4>Email</h4>
                        <p>
                          <a href="mailto:contact@terrain360.eu">contact@terrain360.eu</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte Google Maps */}
                <div className="map-card">
                  <div className="map-header">
                    <h3>Notre localisation</h3>
                    <div className="map-controls">
                      
                      {useAdvancedMap && (
                        <button className="map-control-btn" onClick={centerMapOnLocation} title="Centrer la carte">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="map-container">
                    {!useAdvancedMap ? (
                      // Version simple avec iframe (recommandée)
                      <iframe
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.5!2d-8.012891!3d31.647951!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM4JzUyLjYiTiA4wrAwMCc0Ni40Ilc!5e0!3m2!1sfr!2sma!4v1234567890`}
                        width="100%"
                        height="300"
                        style={{
                          border: 0,
                          borderRadius: "8px",
                        }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Localisation Terrain360"
                        onLoad={() => setMapLoaded(true)}
                      />
                    ) : (
                      // Version avancée avec API JavaScript (nécessite clé API)
                      <div
                        ref={mapRef}
                        className="google-map"
                        style={{
                          height: "300px",
                          width: "100%",
                          borderRadius: "8px",
                        }}
                      />
                    )}
                  </div>
                  <div className="map-actions">
                    
                  </div>
                  
                </div>

                {/* Horaires */}
                <div className="hours-card">
                  <div className="hours-header">
                    <h3>Horaires d'ouverture</h3>
                  </div>
                  <div className="hours-content">
                    <div className="hours-item">
                      <span className="hours-day">Lundi - Vendredi</span>
                      <span className="hours-time">9h00 - 18h00</span>
                    </div>
                    <div className="hours-item">
                      <span className="hours-day">Samedi</span>
                      <span className="hours-time">9h00 - 13h00</span>
                    </div>
                    <div className="hours-item">
                      <span className="hours-day">Dimanche</span>
                      <span className="hours-time closed">Fermé</span>
                    </div>
                  </div>
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

export default ContactTerrain360
