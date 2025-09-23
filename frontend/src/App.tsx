// frontend/src/App.tsx - OPTIMIZADO V9 - SIN UserThemeProvider
// ================================================================
// ELIMINADO: UserThemeProvider que causaba re-renders
// OPTIMIZADO: Layouts directos, CSS variables estáticas

import React, { lazy, Suspense } from "react";
import LoadingSpinner from "./components/shared/LoadingSpinner";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// ❌ ELIMINADO: import { UserThemeProvider } from "./contexts/UserThemeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

// Layouts por rol
import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";


// Componentes comunes
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// Debug Tools removidos en producción

// Toast System
import ToastContainer from "./components/shared/ToastContainer";
import { useToast } from "./hooks/useToast";
import { usePWA } from "./hooks/usePWA";

// Páginas de Usuario
import UserDashboard from "./pages/user/Dashboard";
import EventsPage from "./pages/user/Events";
import LiveEvent from "./pages/user/LiveEvent";
import Wallet from "./pages/user/Wallet";
import Profile from "./pages/user/Profile";
import BetsPage from "./pages/user/Bets";
import SubscriptionsPage from "./pages/user/Subscriptions";
import NewsPage from "./pages/user/News";
import VenuesPage from "./pages/user/Venues";
import GallerasPage from "./pages/user/Galleras";
import VenueDetailPage from "./pages/user/VenueDetailPage";
import GalleraDetailPage from "./pages/user/GalleraDetailPage";
import ArticlePage from "./components/user/ArticlePage";

// Lazy imports para rutas no críticas
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const CreateUser = lazy(() => import("./pages/admin/CreateUser"));
const AdminOperators = lazy(() => import("./pages/admin/Operators"));
const AdminFinance = lazy(() => import("./pages/admin/Finance"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const AdminVenues = lazy(() => import("./pages/admin/Venues"));
const AdminGalleras = lazy(() => import("./pages/admin/Galleras"));
const AdminRequests = lazy(() => import("./pages/admin/Requests"));
const AdminMonitoring = lazy(() => import("./pages/admin/Monitoring"));
const CreateEvent = lazy(() => import("./pages/admin/CreateEvent"));

// Operators use admin environment with role-based restrictions



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
    operator: "/admin", // Operators use admin environment with restrictions
    venue: "/dashboard", // Redirect venue to user dashboard
    user: "/dashboard",
    gallera: "/dashboard", // Redirect gallera to user dashboard
  };

  return <Navigate to={roleRoutes[user.role] || "/dashboard"} replace />;
};

// 🏗️ COMPONENTE PRINCIPAL CON RUTAS OPTIMIZADAS
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { toasts, removeToast } = useToast();
  const { canInstall, install } = usePWA();

  return (
    <>
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

        {/* REDIRECTS para unificación de roles */}
        <Route path="/venue" element={<Navigate to="/dashboard" replace />} />
        <Route path="/venue/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/gallera" element={<Navigate to="/dashboard" replace />} />
        <Route path="/gallera/*" element={<Navigate to="/dashboard" replace />} />

        {/* 🎯 RUTAS DE USUARIO - Mantener carga inmediata */}
        <Route
          element={
<ProtectedRoute allowedRoles={["user", "venue", "gallera"]}>
<UserLayout />
            </ProtectedRoute>
          }
        >
          {/* Rutas user permanecen igual (sin lazy) */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/live-event/:eventId" element={<LiveEvent />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bets" element={<BetsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/news" element={<NewsPage />} />
                    <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailPage />} />
          <Route path="/galleras" element={<GallerasPage />} />
          <Route path="/galleras/:id" element={<GalleraDetailPage />} />
          <Route path="/article/:articleId" element={<ArticlePage />} />
        </Route>

        {/* 🔧 RUTAS DE ADMIN - Con lazy loading (incluye operadores con jerarquía) */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "operator"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            path="/admin"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminDashboard />
              </Suspense>
            }
          />

          {/* Usuarios */}
          <Route
            path="/admin/users"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminUsers />
              </Suspense>
            }
          />
          <Route
            path="/admin/users/create"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <CreateUser />
              </Suspense>
            }
          />

          {/* Operadores */}
          <Route
            path="/admin/operators"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminOperators />
              </Suspense>
            }
          />

          {/* Finanzas */}
          <Route
            path="/admin/finance"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminFinance />
              </Suspense>
            }
          />

          {/* Eventos */}
          <Route
            path="/admin/events"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminEvents />
              </Suspense>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <CreateEvent />
              </Suspense>
            }
          />

          {/* Artículos */}
          <Route
            path="/admin/articles"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminArticles />
              </Suspense>
            }
          />

          {/* Venues */}
          <Route
            path="/admin/venues"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminVenues />
              </Suspense>
            }
          />

          {/* Galleras */}
          <Route
            path="/admin/galleras"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminGalleras />
              </Suspense>
            }
          />

          {/* Solicitudes */}
          <Route
            path="/admin/requests"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminRequests />
              </Suspense>
            }
          />

          {/* Monitoreo */}
          <Route
            path="/admin/monitoring"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminMonitoring />
              </Suspense>
            }
          />

          {/* Configuración */}
          <Route
            path="/admin/settings"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <AdminSettings />
              </Suspense>
            }
          />
        </Route>

        {/* Operators use admin routes with role-based restrictions */}

        

        {/* Debug route removida */}

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
      {/* Toast System - Notificaciones globales */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* PWA Install Button */}
      {canInstall && (
        <button
          onClick={install}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Install App"
        >
          Instalar App
        </button>
      )}

      {/* Debug tools removidos */}
    </>
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
