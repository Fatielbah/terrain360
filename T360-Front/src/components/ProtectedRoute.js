import { Navigate } from "react-router-dom"
import { Spin } from "antd"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, loading, user } = useAuth()

  console.log("ProtectedRoute - Path:", window.location.pathname);
  console.log("  isAuthenticated:", isAuthenticated);
  console.log("  loading:", loading);
  console.log("  user:", user);
  console.log("  user.role:", user?.role); // Use optional chaining for safety
  console.log("  requiredRoles:", requiredRoles);

  if (loading) {
    console.log("ProtectedRoute - Loading authentication data...");
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute - Not authenticated. Redirecting to /login.");
    return <Navigate to="/login" replace />
  }

  // Vérification des rôles
  if (requiredRoles && requiredRoles.length > 0) { // S'il y a des rôles requis
    if (!user || !user.role) {
      console.log("ProtectedRoute - User or user.role is missing. Denying access.");
      return <Navigate to="/unauthorized" replace />;
    }

    // Convertir le rôle de l'utilisateur en majuscules pour une comparaison insensible à la casse
    const userRoleUpperCase = user.role.toUpperCase();
    // Convertir les rôles requis en majuscules pour la comparaison
    const requiredRolesUpperCase = requiredRoles.map(role => role.toUpperCase());

    if (!requiredRolesUpperCase.includes(userRoleUpperCase)) {
      console.log(`ProtectedRoute - Access denied for role '${user.role}'. Required roles: ${requiredRoles.join(', ')}. Redirecting to /unauthorized.`);
      return <Navigate to="/unauthorized" replace />
    }
    console.log(`ProtectedRoute - Access granted for role '${user.role}'. Required roles: ${requiredRoles.join(', ')}.`);
  } else {
    console.log("ProtectedRoute - No specific roles required for this route. Access granted (authenticated).");
  }

  return children
}

export default ProtectedRoute
