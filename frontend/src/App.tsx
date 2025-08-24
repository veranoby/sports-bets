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
import OperatorLayout from "./components/layouts/OperatorLayout";
import VenueLayout from "./components/layouts/VenueLayout";
import GalleraLayout from "./components/layouts/GalleraLayout";

// Componentes comunes
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ErrorBoundary from "./components/shared/ErrorBoundary";

// Debug Tools (solo en desarrollo)
const RoleSwitcher = lazy(() => import("./components/debug/RoleSwitcher"));
const DebugPanel = lazy(() => import("./components/debug/DebugPanel"));
const DebugTestPage = lazy(() => import("./pages/DebugTestPage"));

// Toast System
import ToastContainer from "./components/shared/ToastContainer";
import { useToast } from "./hooks/useToast";

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
import ArticlePage from "./components/user/ArticlePage";

// Lazy imports para rutas no críticas
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const CreateUser = lazy(() => import("./pages/admin/CreateUser"));
const AdminOperators = lazy(() => import("./pages/admin/Operators"));
const AdminFinance = lazy(() => import("./pages/admin/Finance"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const AdminVenues = lazy(() => import("./pages/admin/Venues"));
const AdminRequests = lazy(() => import("./pages/admin/Requests"));
const AdminMonitoring = lazy(() => import("./pages/admin/Monitoring"));

const OperatorDashboard = lazy(() => import("./pages/operator/Dashboard"));
const OperatorEvents = lazy(() => import("./pages/operator/Events"));
const OperatorStream = lazy(() => import("./pages/operator/Stream"));

const VenueDashboard = lazy(() => import("./pages/venue/Dashboard"));
const VenueEvents = lazy(() => import("./pages/venue/Events"));
const VenueProfile = lazy(() => import("./pages/venue/Profile"));

const GalleraDashboard = lazy(() => import("./pages/gallera/Dashboard"));
const GalleraArticles = lazy(() => import("./pages/gallera/MyArticles"));

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
    gallera: "/gallera",
  };

  return <Navigate to={roleRoutes[user.role] || "/dashboard"} replace />;
};

// 🏗️ COMPONENTE PRINCIPAL CON RUTAS OPTIMIZADAS
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { toasts, removeToast } = useToast();

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

        {/* 🎯 RUTAS DE USUARIO - Mantener carga inmediata */}
        <Route
          element={
            <ProtectedRoute requiredRole="user">
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
          <Route path="/venues/:venueId" element={<VenuesPage />} />
          <Route path="/article/:articleId" element={<ArticlePage />} />
        </Route>

        {/* 🔧 RUTAS DE ADMIN - Con lazy loading */}
        <Route
          element={
            <ProtectedRoute requiredRole="admin">
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
        </Route>

        {/* 🎥 RUTAS DE OPERADOR - Con lazy loading */}
        <Route
          element={
            <ProtectedRoute requiredRole="operator">
              <OperatorLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/operator"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <OperatorDashboard />
              </Suspense>
            }
          />
          <Route
            path="/operator/events"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <OperatorEvents />
              </Suspense>
            }
          />
          <Route
            path="/operator/stream/:eventId"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <OperatorStream />
              </Suspense>
            }
          />
        </Route>

        {/* 🏛️ RUTAS DE VENUE - Con lazy loading */}
        <Route
          element={
            <ProtectedRoute requiredRole="venue">
              <VenueLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/venue"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <VenueDashboard />
              </Suspense>
            }
          />
          <Route
            path="/venue/events"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <VenueEvents />
              </Suspense>
            }
          />
          <Route
            path="/venue/profile"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <VenueProfile />
              </Suspense>
            }
          />
        </Route>

        {/* 🐓 RUTAS DE GALLERA - Con lazy loading */}
        <Route
          element={
            <ProtectedRoute requiredRole="gallera">
              <GalleraLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/gallera"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <GalleraDashboard />
              </Suspense>
            }
          />
          <Route
            path="/gallera/articles"
            element={
              <Suspense fallback={<LoadingSpinner fullPage />}>
                <GalleraArticles />
              </Suspense>
            }
          />
        </Route>

        {/* 🛠️ DEBUG TESTING PAGE (solo desarrollo) */}
        <Route
          path="/debug"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <DebugTestPage />
            </Suspense>
          }
        />

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
      
      {/* Debug Tools - Solo visible en desarrollo */}
      <Suspense fallback={null}>
        <RoleSwitcher />
        <DebugPanel />
      </Suspense>
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
