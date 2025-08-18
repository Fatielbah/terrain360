// src/components/layout/Header.js

import { NavLink } from "react-router-dom"
import logo from "../../img/logo.png"

const Header = () => {
  return (
    <div className={`topbar`}>
      <div className="topbar-container">
        <div className="logo-section">
          <div className="logo-text">
            <h2>Terrain360</h2>
            <span>Enquêtes & Sondages</span>
          </div>
        </div>
        <nav className="nav-menu">
          <NavLink to="/candidature">Accueil</NavLink>
          <NavLink to="/serviceT360">Services</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
      </div>
    </div>
  )
}

export default Header
