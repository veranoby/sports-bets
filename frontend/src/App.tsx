import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import OperatorDashboard from "./pages/operator/Dashboard";
import UserDashboard from "./pages/user/Dashboard";
import LiveEvent from "./pages/user/LiveEvent";
import Wallet from "./pages/user/Wallet";
import Profile from "./pages/user/Profile";
import EventsPage from "./pages/user/Events";
import BetsPage from "./pages/user/Bets";
import "./App.css";
import { LogOut } from "lucide-react";
import Navigation from "./components/user/Navigation";
import VenueDashboard from "./pages/venue/Dashboard";

// Componente para manejar redirección basada en rol
const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir según el rol del usuario
  switch (user.role) {
    case "admin":
      return <Navigate to="/operator" replace />;
    case "operator":
      return <Navigate to="/operator" replace />;
    case "venue":
      return <Navigate to="/venue" replace />;
    case "user":
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Determinar si mostrar la navegación
  const showNavigation =
    isAuthenticated &&
    [
      "/dashboard",
      "/events",
      "/bets",
      "/profile",
      "/wallet",
      "/live-event",
    ].some((path) => location.pathname.startsWith(path));

  return (
    <div className="app-container">
      <Routes>
        {/* Ruta de login */}
        <Route
          path="/login"
          element={isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />}
        />

        {/* Ruta raíz - redirige según autenticación */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Rutas del Panel de Operador */}
        <Route
          path="/operator"
          element={
            <ProtectedRoute requiredRole="operator">
              <OperatorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas del Dashboard de Usuario */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute requiredRole="user">
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-event/:id"
          element={
            <ProtectedRoute requiredRole="user">
              <LiveEvent />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Billetera */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute requiredRole="user">
              <Wallet />
            </ProtectedRoute>
          }
        />

        {/* Ruta para venues (implementar después) */}
        <Route
          path="/venue"
          element={
            <ProtectedRoute requiredRole="venue">
              <VenueDashboard />
            </ProtectedRoute>
          }
        />

        {/* Ruta de Perfil */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredRole="user">
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Ruta de Apuestas */}
        <Route
          path="/bets"
          element={
            <ProtectedRoute requiredRole="user">
              <BetsPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Página no encontrada</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Volver
                </button>
              </div>
            </div>
          }
        />
      </Routes>

      {/* Navigation component for user routes */}
      {showNavigation && <Navigation />}
    </div>
  );
};

// Componente principal con provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
