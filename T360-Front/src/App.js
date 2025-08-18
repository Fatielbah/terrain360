import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login/Login";
import Profile from "./pages/profile/Profilepage";
import MainLayout from "./pages/MainLayout";
import Chat from "./pages/chat/chat";
import RetardsEnqueteur from "./pages/Retards/retardsEnqueteur";
import Demande from "./pages/demande/DemandsPage";
import DemandeRH from "./pages/demande/DemandeRH";
import DemandeADMIN from "./pages/demande/DemandeAdmin";
import Etudes from "./pages/Etudes/etudes";
import Calendar from "./pages/Calendar/Calendar";
import LesEnqueteurs from "./pages/Enqueteur/EnqueteurPage";
import Materials from "./pages/materials/materials";
import Clients from "./pages/clients/clients";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MaterialsEmployee from "./pages/materials/employee-materials";
import Recrutement from "./pages/recrutement/Recrutement";
import Candidatures from "./pages/Candidature/Candidatures";
import Signup from "./pages/login/SignupForm";
import Role from "./pages/role/gestionRole";
import ServiceT360 from "./pages/Candidature/services";
import Contact from "./pages/Candidature/contact";
import Retard from "./pages/Retards/retards";
import Annonces from "./pages/Annonces/Annonces";
import SalairePrimesRH from "./pages/SalairePrimes/SalairePrimesRH";
import SalairePrimes from "./pages/SalairePrimes/SalairePrimes";
import Dossier from "./pages/dossier/dossier";
import Unauthorized from "./pages/Unauthorized/Unauthorized";

// Définition des rôles pour chaque catégorie de pages
const ALL_AUTHENTICATED_ROLES = ['ADMIN', 'ENQUETEUR', 'SUPERVISEUR', 'RH', 'INFORMATICIEN'];
const ADMIN_ROLES = ['ADMIN'];
const ENQUETEUR_ROLES = ['ENQUETEUR'];
const SUPERVISEUR_ROLES = ['SUPERVISEUR'];
const RH_ROLES = ['RH'];
const INFORMATICIEN_ROLES = ['INFORMATICIEN'];
const ADMIN_RH_ROLES = ['ADMIN', 'RH'];

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/candidature" element={<Candidatures />} />
              <Route path="/serviceT360" element={<ServiceT360 />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Routes nécessitant une authentification et une protection par rôle */}
              <Route
                path="/*"
                element={
                  <MainLayout>
                    <Routes>
                      {/* Routes communes à tous les rôles authentifiés */}
                      <Route path="/profile" element={<ProtectedRoute requiredRoles={ALL_AUTHENTICATED_ROLES}><Profile /></ProtectedRoute>} />
                      <Route path="/chat" element={<ProtectedRoute requiredRoles={ALL_AUTHENTICATED_ROLES}><Chat /></ProtectedRoute>} />
                      <Route path="/calendar" element={<ProtectedRoute requiredRoles={ALL_AUTHENTICATED_ROLES}><Calendar /></ProtectedRoute>} />
                      <Route path="/annonces" element={<ProtectedRoute requiredRoles={ALL_AUTHENTICATED_ROLES}><Annonces /></ProtectedRoute>} />
                      <Route path="/dashboard" element={<ProtectedRoute requiredRoles={ALL_AUTHENTICATED_ROLES}><Profile /></ProtectedRoute>} />

                      {/* Routes ADMIN */}
                      <Route path="/etudes" element={<ProtectedRoute requiredRoles={ADMIN_ROLES}><Etudes /></ProtectedRoute>} />
                      <Route path="/role" element={<ProtectedRoute requiredRoles={ADMIN_ROLES}><Role /></ProtectedRoute>} />
                      <Route path="/demandesADMIN" element={<ProtectedRoute requiredRoles={ADMIN_ROLES}><DemandeADMIN /></ProtectedRoute>} />
                      <Route path="/clients" element={<ProtectedRoute requiredRoles={ADMIN_ROLES}><Clients /></ProtectedRoute>} />

                      {/* Routes ADMIN & RH */}
                      <Route path="/dossier" element={<ProtectedRoute requiredRoles={ADMIN_RH_ROLES}><Dossier /></ProtectedRoute>} />

                      {/* Routes ENQUETEUR */}
                      <Route path="/demandes" element={<ProtectedRoute requiredRoles={ENQUETEUR_ROLES}><Demande /></ProtectedRoute>} />
                      <Route path="/materialsEmployees" element={<ProtectedRoute requiredRoles={ENQUETEUR_ROLES}><MaterialsEmployee /></ProtectedRoute>} />
                      <Route path="/retardEmployees" element={<ProtectedRoute requiredRoles={ENQUETEUR_ROLES}><RetardsEnqueteur /></ProtectedRoute>} />
                      <Route path="/salairePrimes" element={<ProtectedRoute requiredRoles={ENQUETEUR_ROLES}><SalairePrimes /></ProtectedRoute>} />

                      {/* Routes SUPERVISEUR */}
                      <Route path="/retard" element={<ProtectedRoute requiredRoles={SUPERVISEUR_ROLES}><Retard /></ProtectedRoute>} />
                      <Route path="/enqueteurs" element={<ProtectedRoute requiredRoles={SUPERVISEUR_ROLES}><LesEnqueteurs /></ProtectedRoute>} />

                      {/* Routes RH */}
                      <Route path="/recrutement" element={<ProtectedRoute requiredRoles={RH_ROLES}><Recrutement /></ProtectedRoute>} />
                      <Route path="/demandesRH" element={<ProtectedRoute requiredRoles={RH_ROLES}><DemandeRH /></ProtectedRoute>} />
                      <Route path="/salairePrimesRH" element={<ProtectedRoute requiredRoles={RH_ROLES}><SalairePrimesRH /></ProtectedRoute>} />

                      {/* Routes INFORMATICIEN */}
                      <Route path="/materials" element={<ProtectedRoute requiredRoles={INFORMATICIEN_ROLES}><Materials /></ProtectedRoute>} />

                      {/* Redirection par défaut si aucune route ne correspond */}
                      <Route path="*" element={<Navigate to="/profile" />} />
                    </Routes>
                  </MainLayout>
                }
              />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
