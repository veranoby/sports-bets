// frontend/src/App.tsx - MOVER COMPONENTES WEBSOCKET A NIVEL APP
// ====================================================================

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserThemeProvider } from "./contexts/UserThemeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import OperatorDashboard from "./pages/operator/Dashboard";
import UserDashboard from "./pages/user/Dashboard";
import LiveEvent from "./pages/user/LiveEvent";
import Wallet from "./pages/user/Wallet";
import Profile from "./pages/user/Profile";
import EventsPage from "./pages/user/Events";
import BetsPage from "./pages/user/Bets";
import VenueDashboard from "./pages/venue/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import Navigation from "./components/user/Navigation";
// ✅ IMPORTAR COMPONENTES WEBSOCKET A NIVEL APP
import NotificationCenter from "./components/shared/NotificationCenter";
import WebSocketDiagnostics from "./components/shared/WebSocketDiagnostics";
import "./App.css";

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

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "operator":
      return <Navigate to="/operator" replace />;
    case "venue":
      return <Navigate to="/venue" replace />;
    case "user":
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

const UserRouteWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <UserThemeProvider>{children}</UserThemeProvider>;
};

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Determinar si mostrar la navegación (solo para usuarios)
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

  // Determinar si mostrar componentes WebSocket (solo para usuarios autenticados)
  const showWebSocketComponents = isAuthenticated;

  return (
    <div className="app-container">
      {/* ✅ COMPONENTES WEBSOCKET A NIVEL APP - NO SE RE-MONTAN */}
      {showWebSocketComponents && (
        <>
          {/* NotificationCenter fijo a nivel App */}
          <div className="fixed top-4 right-4 z-50">
            <NotificationCenter />
          </div>

          {/* WebSocketDiagnostics solo en desarrollo */}
          {process.env.NODE_ENV === "development" && (
            <WebSocketDiagnostics showDetails={false} position="fixed" />
          )}
        </>
      )}

      <Routes>
        {/* Ruta de login */}
        <Route
          path="/login"
          element={isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />}
        />

        {/* Ruta raíz */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <RoleBasedRedirect />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rutas de operador */}
        <Route
          path="/operator"
          element={
            <ProtectedRoute requiredRole="operator">
              <OperatorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas de administrador */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas de venue */}
        <Route
          path="/venue"
          element={
            <ProtectedRoute requiredRole="venue">
              <VenueDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas de usuario con tema unificado */}
        <Route
          path="/dashboard"
          element={
            <UserRouteWrapper>
              <ProtectedRoute requiredRole="user">
                <UserDashboard />
              </ProtectedRoute>
            </UserRouteWrapper>
          }
        />

        <Route
          path="/events"
          element={
            <UserRouteWrapper>
              <ProtectedRoute requiredRole="user">
                <EventsPage />
              </ProtectedRoute>
            </UserRouteWrapper>
          }
        />

        <Route
          path="/live-event/:eventId"
          element={
            <UserRouteWrapper>
              <ProtectedRoute requiredRole="user">
                <LiveEvent />
              </ProtectedRoute>
            </UserRouteWrapper>
          }
        />

        <Route
          path="/wallet"
          element={
            <UserRouteWrapper>
              <ProtectedRoute requiredRole="user">
                <Wallet />
              </ProtectedRoute>
            </UserRouteWrapper>
          }
        />

        <Route
          path="/profile"
          element={
            <UserRouteWrapper>
              <ProtectedRoute requiredRole="user">
                <Profile />
              </ProtectedRoute>
            </UserRouteWrapper>
          }
        />

        <Route
          path="/bets"
          element={
            <UserRouteWrapper>
              <ProtectedRoute requiredRole="user">
                <BetsPage />
              </ProtectedRoute>
            </UserRouteWrapper>
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

      {/* Navigation component for user routes ONLY */}
      {showNavigation && <Navigation currentPage="dashboard" />}
    </div>
  );
};

// 🔧 ORDEN CORRECTO DE PROVIDERS
function App() {
  return (
    <ErrorBoundary
      fallback={<div>An error occurred. Please refresh the page.</div>}
    >
      <AuthProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
