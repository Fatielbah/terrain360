// src/components/layout/Footer.js

import logo from "../../img/logo.png"

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img src={logo} alt="Logo" className="footer-logo-img" />
              <div className="footer-logo-text">
                <h3>Terrain360</h3>
                <span>Enquêtes & Sondages</span>
              </div>
            </div>
            <p className="footer-description">
              Spécialisés dans la réalisation d'enquêtes et de sondages par téléphone, nous intervenons sur le
              territoire français et à l'international.
            </p>
          </div>
          <div className="footer-section">
            <h4>Nos Services</h4>
            <ul className="footer-links">
              <li>Enquêtes téléphoniques - T360 CATI</li>
              <li>Enquêtes en ligne - T360 CAWI</li>
              <li>Analyses médiatiques - T360 AM</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <strong>Adresse</strong>
                <span>
                  Imm B, RDC, N° 1, Résidence Ahlam II<br />
                  Avenue Prince Moulay Abdellah – Marrakech
                </span>
              </div>
              <div className="footer-contact-item">
                <strong>Email</strong>
                <a href="mailto:contact@terrain360.eu">contact@terrain360.eu</a>
              </div>
              <div className="footer-contact-item">
                <strong>Téléphone</strong>
                <div>
                  <a href="tel:+212524433843">+212 (0) 524 433 843</a><br />
                  <a href="tel:+212649360360">+212 (0) 649 360 360</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Terrain360. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
