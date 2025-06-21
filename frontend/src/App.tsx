// frontend/src/App.tsx - ESTRUCTURA CON LAYOUTS PERSISTENTES
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserThemeProvider } from "./contexts/UserThemeContext";
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

// Componente para manejar redirección basada en rol
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

// COMPONENTE PRINCIPAL CON RUTAS
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rutas públicas */}
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

      {/* RUTAS DE USUARIO con Layout persistente */}
      <Route
        element={
          <ProtectedRoute requiredRole="user">
            <UserThemeProvider>
              <UserLayout />
            </UserThemeProvider>
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

      {/* RUTAS DE ADMIN con Layout persistente */}
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

      {/* RUTAS DE OPERADOR con Layout persistente */}
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

      {/* RUTAS DE VENUE con Layout persistente */}
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
  );
};

// APP PRINCIPAL
function App() {
  return (
    <ErrorBoundary
      fallback={<div>Ha ocurrido un error. Por favor recarga la página.</div>}
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
