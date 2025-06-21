// frontend/src/App.tsx - CORREGIR PROVIDERS Y CONTEXTOS
// =========================================================

import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserThemeProvider } from "./contexts/UserThemeContext";
import {
  WebSocketProvider,
  useWebSocketContext,
} from "./contexts/WebSocketContext";
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

// ✅ COMPONENTE SIMPLE PARA NOTIFICACIONES SIN DEPENDENCIAS DE TEMA
const SimpleNotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(0); // Simplificado por ahora

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        title="Notificaciones"
      >
        <span className="text-gray-600">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-4">
            <p className="text-center text-gray-500">No hay notificaciones</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE SIMPLE PARA WEBSOCKET DIAGNOSTICS
const SimpleWebSocketDiagnostics: React.FC = () => {
  const { isConnected } = useWebSocketContext();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div
        className={`
        px-3 py-2 rounded-lg text-sm font-medium
        ${
          isConnected
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }
      `}
      >
        WebSocket: {isConnected ? "Conectado" : "Desconectado"}
      </div>
    </div>
  );
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

  return (
    <div className="app-container">
      {/* ✅ COMPONENTES WEBSOCKET SIMPLES A NIVEL APP */}
      {isAuthenticated && (
        <>
          <div className="fixed top-4 right-4 z-50">
            <SimpleNotificationCenter />
          </div>
          <SimpleWebSocketDiagnostics />
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
