import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OperatorDashboard from './pages/operator/Dashboard';
import UserDashboard from './pages/user/Dashboard';
import LiveEvent from './pages/user/LiveEvent';
import Wallet from './pages/user/Wallet';
import './App.css';

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
    case 'admin':
      return <Navigate to="/operator" replace />; // Admin puede usar panel de operador
    case 'operator':
      return <Navigate to="/operator" replace />;
    case 'venue':
      return <Navigate to="/venue" replace />; // Para implementar después
    case 'user':
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      <Routes>
        {/* Ruta de login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />
          } 
        />

        {/* Ruta raíz - redirige según autenticación */}
        <Route 
          path="/" 
          element={<RoleBasedRedirect />} 
        />

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

        {/* Rutas de Eventos en Vivo */}
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
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Panel de Venue</h1>
                  <p className="text-gray-600">En desarrollo...</p>
                </div>
              </div>
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