// frontend/src/App.tsx - OPTIMIZADO V9 - SIN UserThemeProvider
// ================================================================
// ELIMINADO: UserThemeProvider que causaba re-renders
// OPTIMIZADO: Layouts directos, CSS variables estáticas

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// ❌ ELIMINADO: import { UserThemeProvider } from "./contexts/UserThemeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

// Layouts por rol
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import OperatorLayout from "./components/layouts/OperatorLayout";
import VenueLayout from "./components/layouts/VenueLayout";

// Componentes comunes
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// Páginas de Usuario
import UserDashboard from "./pages/user/Dashboard";
import EventsPage from "./pages/user/Events";
import LiveEvent from "./pages/user/LiveEvent";
import Wallet from "./pages/user/Wallet";
import Profile from "./pages/user/Profile";
import BetsPage from "./pages/user/Bets";

// Páginas de Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminFinance from "./pages/admin/Finance";
import AdminReports from "./pages/admin/Reports";

// Páginas de Operador
import OperatorDashboard from "./pages/operator/Dashboard";
import OperatorEvents from "./pages/operator/Events";
import OperatorStream from "./pages/operator/Stream";

// Páginas de Venue
import VenueDashboard from "./pages/venue/Dashboard";
import VenueEvents from "./pages/venue/Events";
import VenueProfile from "./pages/venue/Profile";

// 🎯 COMPONENTE PARA REDIRECCIÓN BASADA EN ROL
const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirigir según rol
  const roleRoutes = {
    admin: "/admin",
    operator: "/operator",
    venue: "/venue",
    user: "/dashboard",
  };

  return <Navigate to={roleRoutes[user.role] || "/dashboard"} replace />;
};

// 🏗️ COMPONENTE PRINCIPAL CON RUTAS OPTIMIZADAS
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* 🔓 RUTAS PÚBLICAS */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <RoleBasedRedirect />}
      />
      <Route
        path="/"
        element={
          isAuthenticated ? <RoleBasedRedirect /> : <Navigate to="/login" />
        }
      />

      {/* 👤 RUTAS DE USUARIO - Layout persistente SIN UserThemeProvider */}
      <Route
        element={
          <ProtectedRoute requiredRole="user">
            {/* ❌ ELIMINADO: <UserThemeProvider> wrapper */}
            <UserLayout />
            {/* ❌ ELIMINADO: </UserThemeProvider> */}
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/live-event/:eventId" element={<LiveEvent />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bets" element={<BetsPage />} />
      </Route>

      {/* 🔧 RUTAS DE ADMIN - Layout persistente */}
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/finance" element={<AdminFinance />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>

      {/* 🎥 RUTAS DE OPERADOR - Layout persistente */}
      <Route
        element={
          <ProtectedRoute requiredRole="operator">
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/operator" element={<OperatorDashboard />} />
        <Route path="/operator/events" element={<OperatorEvents />} />
        <Route path="/operator/stream/:eventId" element={<OperatorStream />} />
      </Route>

      {/* 🏛️ RUTAS DE VENUE - Layout persistente */}
      <Route
        element={
          <ProtectedRoute requiredRole="venue">
            <VenueLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/venue" element={<VenueDashboard />} />
        <Route path="/venue/events" element={<VenueEvents />} />
        <Route path="/venue/profile" element={<VenueProfile />} />
      </Route>

      {/* 🚫 RUTA 404 */}
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
  );
};

// 🚀 APP PRINCIPAL - ESTRUCTURA OPTIMIZADA
function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Ha ocurrido un error
            </h1>
            <p className="text-gray-600 mb-4">
              La aplicación encontró un problema inesperado.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Recargar página
            </button>
          </div>
        </div>
      }
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
