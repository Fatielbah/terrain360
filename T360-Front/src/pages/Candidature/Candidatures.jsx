"use client"

import { useState, useEffect } from "react"
import "./candidature.css"
import img from "../../img/logo.png"
import Header from "./Header"
import Footer from "./Footer"
const Terrain360JobPage = () => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null) // Pour stocker le résultat de la soumission
  const [searchData, setSearchData] = useState({
    keyword: "",
    location: "",
  })
  const [formData, setFormData] = useState({
    civilite: "",
    nomComplet: "",
    email: "",
    telephone: "",
    adresse: "",
    codePostal: "",
    ville: "Marrakech",
    message: "",
    cv: null,
    lettreMotivation: null,
  })
  const [errors, setErrors] = useState({})
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [selectedJobDetails, setSelectedJobDetails] = useState(null)

  // Configuration de l'API
  const API_BASE_URL = "http://localhost:8081/api/fiches"
  const CANDIDATURE_API_URL = "http://localhost:8081/api/candidatures"

  // Fonction pour récupérer les postes depuis l'API
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log("Données reçues de l'API:", data)

      // Transformation des données pour correspondre au format attendu
      const transformedJobs = data.map((job) => ({
        id: job.id,
        titre: job.titre,
        service: job.service,
        typeContrat: job.typeContrat,
        localisation: job.localisation,
        datePublication: job.datePublication,
        typeEmploi: job.typeEmploi,
        description: job.description,
        status: job.status === true || job.status === 1,
        salaireMin: job.salaireMin,
        salaireMax: job.salaireMax,
        evolutionProfessionnelle: job.evolutionProfessionnelle,
        avantages: job.avantages,
        missions: Array.isArray(job.missions) ? job.missions : [],
        competencesRequises: Array.isArray(job.competencesRequises) ? job.competencesRequises : [],
      }))

      setJobs(transformedJobs)
      setFilteredJobs(transformedJobs)
    } catch (err) {
      console.error("Erreur lors du chargement des postes:", err)
      setError("Impossible de charger les offres d'emploi. Veuillez réessayer plus tard.")

      // Données de fallback en cas d'erreur
      const fallbackJobs = [
        {
          id: 1,
          titre: "Enquêteur Téléphonique",
          service: "Enquêtes téléphoniques",
          typeContrat: "CDI",
          localisation: "Marrakech, Maroc",
          datePublication: "2024-01-15T10:00:00",
          typeEmploi: "Temps plein",
          description:
            "Nous recherchons des enquêteurs téléphoniques motivés pour réaliser des sondages et enquêtes d'opinion.",
          status: true,
          salaireMin: 4000,
          salaireMax: 6000,
          evolutionProfessionnelle: "Évolution vers superviseur d'équipe",
          avantages: "Formation continue, prime de performance, assurance santé",
        },
      ]
      setJobs(fallbackJobs)
      setFilteredJobs(fallbackJobs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fonctions utilitaires
  const formatSalary = (min, max) => {
    if (min && max) {
      return `${min.toLocaleString()} DH - ${max.toLocaleString()} DH`
    }
    return "Salaire à négocier"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Date non spécifiée"

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) return "Il y a 1 jour"
      if (diffDays < 7) return `Il y a ${diffDays} jours`
      if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`
      return `Il y a ${Math.ceil(diffDays / 30)} mois`
    } catch (error) {
      return "Date non spécifiée"
    }
  }

  const getServiceIcon = (service) => {
    if (!service) return "🏢"

    switch (service.toLowerCase()) {
      case "enquêtes téléphoniques":
        return "📞"
      case "supervision":
        return "👥"
      case "analyse de données":
        return "📊"
      case "formation":
        return "🎓"
      case "qualité":
        return "✅"
      case "développement commercial":
        return "💼"
      default:
        return "🏢"
    }
  }

  // Gestionnaires d'événements
  const handleSearch = (e) => {
    e.preventDefault()
    let filtered = jobs

    if (searchData.keyword) {
      filtered = filtered.filter(
        (job) =>
          job.titre?.toLowerCase().includes(searchData.keyword.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchData.keyword.toLowerCase()) ||
          job.service?.toLowerCase().includes(searchData.keyword.toLowerCase()),
      )
    }

    if (searchData.location) {
      filtered = filtered.filter((job) => job.localisation?.toLowerCase().includes(searchData.location.toLowerCase()))
    }

    setFilteredJobs(filtered)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApply = (job) => {
    setSelectedJob(job)
    setShowForm(true)
    // Réinitialiser les résultats précédents
    setSubmitResult(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedJob(null)
    setFormData({
      civilite: "",
      nomComplet: "",
      email: "",
      telephone: "",
      adresse: "",
      codePostal: "",
      ville: "Marrakech",
      message: "",
      cv: null,
      lettreMotivation: null,
    })
    setErrors({})
    setSubmitResult(null)
  }

  const handleFormInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
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

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (files && files[0]) {
      // Validation de la taille du fichier (max 10MB)
      if (files[0].size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Le fichier ne doit pas dépasser 10MB",
        }))
        return
      }

      // Validation du type de fichier
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]

      if (!allowedTypes.includes(files[0].type)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Seuls les fichiers PDF, DOC et DOCX sont acceptés",
        }))
        return
      }

      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }))

      // Effacer l'erreur si le fichier est valide
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Tous les champs sont obligatoires sauf message
    if (!formData.civilite) newErrors.civilite = "Veuillez sélectionner votre civilité"
    if (!formData.nomComplet) newErrors.nomComplet = "Le nom complet est requis"
    if (!formData.email) newErrors.email = "L'email est requis"
    if (!formData.telephone) newErrors.telephone = "Le téléphone est requis"
    if (!formData.adresse) newErrors.adresse = "L'adresse est requise"
    if (!formData.codePostal) newErrors.codePostal = "Le code postal est requis"
    if (!formData.ville) newErrors.ville = "La ville est requise"
    if (!formData.cv) newErrors.cv = "Le CV est requis"

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    const phoneRegex = /^[0-9+\-\s()]+$/
    if (formData.telephone && !phoneRegex.test(formData.telephone)) {
      newErrors.telephone = "Format de téléphone invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitCandidature = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      // Afficher un message d'erreur global
      setSubmitResult({
        success: false,
        message: "Veuillez remplir tous les champs obligatoires correctement.",
      })
      return
    }

    setSubmitting(true)
    setSubmitResult(null)

    try {
      // Créer un FormData pour l'envoi multipart
      const formDataToSend = new FormData()

      // Créer l'objet candidature avec la structure correcte
      const candidatureData = {
        civilite: formData.civilite,
        nomComplet: formData.nomComplet,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        codePostal: formData.codePostal,
        ville: formData.ville,
        message: formData.message || "",
        ficheDePoste: {
          id: selectedJob.id,
        },
      }

      console.log("Données de candidature à envoyer:", candidatureData)

      // Ajouter les données de candidature comme JSON string
      formDataToSend.append("candidature", JSON.stringify(candidatureData))

      // Ajouter les fichiers
      if (formData.cv) {
        formDataToSend.append("cv", formData.cv)
        console.log("CV ajouté:", formData.cv.name)
      }

      if (formData.lettreMotivation) {
        formDataToSend.append("lettreMotivation", formData.lettreMotivation)
        console.log("Lettre de motivation ajoutée:", formData.lettreMotivation.name)
      }

      console.log("Envoi de la candidature pour le poste:", selectedJob.titre)

      const response = await fetch(CANDIDATURE_API_URL, {
        method: "POST",
        body: formDataToSend,
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || `Erreur HTTP: ${response.status}`)
      }

      console.log("Candidature envoyée avec succès:", responseData)

      // Afficher un message de succès
      setSubmitResult({
        success: true,
        message: `Votre candidature pour le poste "${selectedJob.titre}" a été envoyée avec succès ! Nous vous contacterons bientôt.`,
        data: responseData,
      })

      // Ne pas fermer le formulaire automatiquement pour montrer le message de succès
      // L'utilisateur fermera le formulaire manuellement
    } catch (error) {
      console.error("Erreur lors de l'envoi de la candidature:", error)

      // Afficher un message d'erreur spécifique
      let errorMessage = "Erreur lors de l'envoi de votre candidature. "

      if (error.message.includes("Failed to fetch")) {
        errorMessage += "Vérifiez votre connexion internet et que le serveur est accessible."
      } else if (error.message.includes("413")) {
        errorMessage += "Les fichiers sont trop volumineux."
      } else if (error.message.includes("400")) {
        errorMessage += "Données invalides. Vérifiez vos informations."
      } else {
        errorMessage += error.message
      }

      setSubmitResult({
        success: false,
        message: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRefresh = () => {
    fetchJobs()
  }

  const handleViewDetails = (job) => {
    setSelectedJobDetails(job)
    setShowJobDetails(true)
  }

  const handleCloseDetails = () => {
    setShowJobDetails(false)
    setSelectedJobDetails(null)
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
                Rejoignez l'équipe
                <span className="highlight"> Terrain360 </span>
                et participez à l'avenir des enquêtes
              </h1>
              <p className="hero-description">
                Spécialisés dans la réalisation d'enquêtes et de sondages par téléphone, nous recherchons des talents
                passionnés pour renforcer notre équipe à Marrakech.
              </p>

              <div className="search-container">
                <form onSubmit={handleSearch} className="search-form">
                  <div className="search-inputs">
                    <div className="input-group">
                      <input
                        type="text"
                        name="keyword"
                        placeholder="Poste recherché (enquêteur, superviseur...)"
                        value={searchData.keyword}
                        onChange={handleInputChange}
                        className="search-input"
                      />
                    </div>

                    
                  </div>

                  <button type="submit" className="search-button">
                    Trouver votre poste
                  </button>
                </form>
              </div>

              <div className="company-stats">
                
                <div className="stat-item">
                  <span className="stat-number">{jobs.length}</span>
                  <span className="stat-label">Postes disponibles</span>
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
          {/* Company Intro */}
          <div className="company-intro">
            <div className="intro-content">
              <h2>À propos de Terrain360</h2>
              <p>
                Spécialisés dans la réalisation d'enquêtes et de sondages par téléphone sur le territoire français, nous
                intervenons également ponctuellement à l'international. Nous recueillons l'avis de personnes sur des
                sujets ciblés, relatifs à des faits de société ou des problématiques business-to-business.
              </p>
              <div className="intro-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">🇫🇷</span>
                  <span>Enquêtes nationales françaises</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🌍</span>
                  <span>Interventions internationales</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">📊</span>
                  <span>Sondages B2B & société</span>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Section */}
          <div className="jobs-section">
            <div className="section-header">
              <h2>Opportunités de carrière</h2>
              <p>Rejoignez notre équipe dynamique basée à Marrakech et participez à des projets d'envergure</p>
              {error && (
                <div className="error-banner">
                  <p>{error}</p>
                  <button onClick={handleRefresh} className="refresh-button">
                    Réessayer
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des offres d'emploi...</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-card-header">
                      <div className="company-logo">
                        <span className="company-icon">{getServiceIcon(job.service)}</span>
                      </div>

                      <div className="job-info">
                        <h3 className="job-title">{job.titre}</h3>
                        <p className="company-name">Terrain360 - {job.service}</p>

                        <div className="job-details">
                          <div className="job-location">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{job.localisation}</span>
                          </div>

                          <div className="job-salary">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M16 8l-4 4-4-4" />
                            </svg>
                            <span>{formatSalary(job.salaireMin, job.salaireMax)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="job-meta">
                        <span className={`job-type ${job.typeContrat?.toLowerCase()}`}>{job.typeContrat}</span>
                        <span className="job-time">{formatDate(job.datePublication)}</span>
                        <span className={`job-status ${job.status ? "active" : "closed"}`}>
                          {job.status ? "Ouvert" : "Fermé"}
                        </span>
                      </div>
                    </div>

                    <div className="job-card-body">
                      <p className="job-description">
                        {job.description?.substring(0, 150)}
                        {job.description?.length > 150 ? "..." : ""}
                      </p>

                      <div className="job-tags">
                        <span className="job-tag">{job.typeEmploi}</span>
                        <span className={`job-tag ${job.status ? "active" : "closed"}`}>
                          {job.status ? "Recrutement actif" : "Poste fermé"}
                        </span>
                      </div>

                      {job.avantages && (
                        <div className="job-benefits">
                          <h4>Avantages :</h4>
                          <p>{job.avantages.substring(0, 100)}...</p>
                        </div>
                      )}

                      {job.evolutionProfessionnelle && (
                        <div className="job-evolution">
                          <h4>Évolution :</h4>
                          <p>{job.evolutionProfessionnelle.substring(0, 80)}...</p>
                        </div>
                      )}
                    </div>

                    <div className="job-card-footer">
                      <button className="details-button" onClick={() => handleViewDetails(job)}>
                        Voir détails
                      </button>
                      <button
                        className={`apply-button ${!job.status ? "disabled" : ""}`}
                        onClick={() => handleApply(job)}
                        disabled={!job.status}
                      >
                        {job.status ? "Postuler " : "Poste fermé"}
                      </button>
                      <button className="save-button">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredJobs.length === 0 && !error && (
              <div className="no-results">
                <h3>Aucun poste trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
                <button onClick={handleRefresh} className="refresh-button">
                  Actualiser les offres
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Candidature Form */}
      {showForm && selectedJob && (
  <div className="form-overlay">
    <div className="candidature-form">
      <div className="form-header">
        <div>
          <h2>Candidature - {selectedJob.titre}</h2>
          <p>Terrain360 - {selectedJob.service}</p>
        </div>
        <button className="close-button" onClick={handleCloseForm} disabled={submitting}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nouveau: Affichage du résultat de la soumission */}
      {submitResult && (
        <div className={`submit-result ${submitResult.success ? "success" : "error"}`}>
          <div className="result-icon">
            {submitResult.success ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
          </div>
          <div className="result-message">
            <h3>{submitResult.success ? "Candidature envoyée !" : "Erreur"}</h3>
            <p>{submitResult.message}</p>
          </div>
          {submitResult.success && (
            <div className="result-actions">
              <button className="close-result-button" onClick={handleCloseForm}>
                Fermer
              </button>
            </div>
          )}
        </div>
      )}

            <form
              onSubmit={handleSubmitCandidature}
              className={`form-content ${submitResult?.success ? "hidden" : ""}`}
            >
              {/* Afficher un message d'erreur global si nécessaire */}
              {Object.keys(errors).length > 0 && (
                <div className="form-error-summary">
                  <p>Veuillez corriger les erreurs suivantes :</p>
                  <ul>
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-section">
                <h3>
                  Informations personnelles <span className="required-indicator">*</span>
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Civilité <span className="required-indicator">*</span>
                    </label>
                    <select
                      name="civilite"
                      value={formData.civilite}
                      onChange={handleFormInputChange}
                      className={errors.civilite ? "error" : ""}
                      disabled={submitting}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="Homme">Monsieur</option>
                      <option value="Femme">Madame</option>
                    </select>
                    {errors.civilite && <span className="error-message">{errors.civilite}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      Nom complet <span className="required-indicator">*</span>
                    </label>
                    <input
                      type="text"
                      name="nomComplet"
                      value={formData.nomComplet}
                      onChange={handleFormInputChange}
                      className={errors.nomComplet ? "error" : ""}
                      placeholder="Votre nom complet"
                      disabled={submitting}
                      required
                    />
                    {errors.nomComplet && <span className="error-message">{errors.nomComplet}</span>}
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
                      value={formData.email}
                      onChange={handleFormInputChange}
                      className={errors.email ? "error" : ""}
                      placeholder="votre.email@exemple.com"
                      disabled={submitting}
                      required
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      Téléphone <span className="required-indicator">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleFormInputChange}
                      className={errors.telephone ? "error" : ""}
                      placeholder="+212 6 12 34 56 78"
                      disabled={submitting}
                      required
                    />
                    {errors.telephone && <span className="error-message">{errors.telephone}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  Adresse <span className="required-indicator">*</span>
                </h3>

                <div className="form-group">
                  <label>
                    Adresse <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleFormInputChange}
                    placeholder="Votre adresse complète"
                    disabled={submitting}
                    className={errors.adresse ? "error" : ""}
                    required
                  />
                  {errors.adresse && <span className="error-message">{errors.adresse}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Code postal <span className="required-indicator">*</span>
                    </label>
                    <input
                      type="text"
                      name="codePostal"
                      value={formData.codePostal}
                      onChange={handleFormInputChange}
                      placeholder="40000"
                      disabled={submitting}
                      className={errors.codePostal ? "error" : ""}
                      required
                    />
                    {errors.codePostal && <span className="error-message">{errors.codePostal}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      Ville <span className="required-indicator">*</span>
                    </label>
                    <select
                      name="ville"
                      value={formData.ville}
                      onChange={handleFormInputChange}
                      disabled={submitting}
                      className={errors.ville ? "error" : ""}
                      required
                    >
                      <option value="Marrakech">Marrakech</option>
                      <option value="Casablanca">Casablanca</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Fès">Fès</option>
                      <option value="Autre">Autre</option>
                    </select>
                    {errors.ville && <span className="error-message">{errors.ville}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Documents</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      CV <span className="required-indicator">*</span> (PDF, DOC, DOCX - Max 10MB)
                    </label>
                    <input
                      type="file"
                      name="cv"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className={errors.cv ? "error" : ""}
                      disabled={submitting}
                      required
                    />
                    {errors.cv && <span className="error-message">{errors.cv}</span>}
                    {formData.cv && (
                      <div className="file-info">
                        <span>
                          ✓ {formData.cv.name} ({(formData.cv.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Lettre de motivation (PDF, DOC, DOCX - Max 10MB)</label>
                    <input
                      type="file"
                      name="lettreMotivation"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      disabled={submitting}
                    />
                    {errors.lettreMotivation && <span className="error-message">{errors.lettreMotivation}</span>}
                    {formData.lettreMotivation && (
                      <div className="file-info">
                        <span>
                          ✓ {formData.lettreMotivation.name} (
                          {(formData.lettreMotivation.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label>Message de motivation</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleFormInputChange}
                    rows="4"
                    placeholder="Expliquez votre motivation pour rejoindre Terrain360 et votre intérêt pour les enquêtes téléphoniques..."
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-note">
                <p>
                  <span className="required-indicator">*</span> Champs obligatoires
                </p>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCloseForm} disabled={submitting}>
                  Annuler
                </button>
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer ma candidature"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJobDetails && (
        <div className="form-overlay">
          <div className="job-details-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedJobDetails.titre}</h2>
                <p>Terrain360 - {selectedJobDetails.service}</p>
              </div>
              <button className="close-button" onClick={handleCloseDetails}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-content">
              <div className="job-details-grid">
                <div className="detail-section">
                  <h3>Informations générales</h3>
                  <div className="detail-item">
                    <strong>Type de contrat :</strong>
                    <span className={`contract-type ${selectedJobDetails.typeContrat?.toLowerCase()}`}>
                      {selectedJobDetails.typeContrat}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Type d'emploi :</strong>
                    <span>{selectedJobDetails.typeEmploi}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Localisation :</strong>
                    <span>{selectedJobDetails.localisation}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Salaire :</strong>
                    <span>{formatSalary(selectedJobDetails.salaireMin, selectedJobDetails.salaireMax)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Date de publication :</strong>
                    <span>{formatDate(selectedJobDetails.datePublication)}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Statut :</strong>
                    <span className={`status ${selectedJobDetails.status ? "open" : "closed"}`}>
                      {selectedJobDetails.status ? "Ouvert" : "Fermé"}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Description du poste</h3>
                  <p className="job-full-description">{selectedJobDetails.description}</p>
                </div>

                {selectedJobDetails.avantages && (
                  <div className="detail-section">
                    <h3>Avantages</h3>
                    <p className="job-advantages">{selectedJobDetails.avantages}</p>
                  </div>
                )}

                {selectedJobDetails.evolutionProfessionnelle && (
                  <div className="detail-section">
                    <h3>Évolution professionnelle</h3>
                    <p className="job-evolution-full">{selectedJobDetails.evolutionProfessionnelle}</p>
                  </div>
                )}

                {selectedJobDetails.missions && selectedJobDetails.missions.length > 0 && (
                  <div className="detail-section">
                    <h3>Missions principales</h3>
                    <ul className="missions-list">
                      {selectedJobDetails.missions.map((mission, index) => (
                        <li key={mission.id || index} className="mission-item">
                          <span>{mission.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJobDetails.competencesRequises && selectedJobDetails.competencesRequises.length > 0 && (
                  <div className="detail-section">
                    <h3>Compétences requises</h3>
                    <div className="competences-grid">
                      {selectedJobDetails.competencesRequises.map((competence, index) => (
                        <div key={competence.id || index} className="competence-item">
                          <span className="competence-name">
                            {competence.nom || competence.titre || competence.description}
                          </span>
                          {competence.niveau && <span className="competence-level">{competence.niveau}</span>}
                          {competence.description && competence.nom && (
                            <p className="competence-description">{competence.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="close-details-button" onClick={handleCloseDetails}>
                  Fermer
                </button>
                <button
                  className="apply-from-details-button"
                  onClick={() => {
                    handleCloseDetails()
                    handleApply(selectedJobDetails)
                  }}
                  disabled={!selectedJobDetails.status}
                >
                  {selectedJobDetails.status ? "Postuler maintenant" : "Poste fermé"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

export default Terrain360JobPage
