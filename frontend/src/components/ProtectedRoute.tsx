import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'operator' | 'venue' | 'user' | 'gallera'>;
  requiredRole?: 'admin' | 'operator' | 'venue' | 'user' | 'gallera'; // Keep for backward compatibility
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requiredRole,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar rol si se especifica
  const roles = allowedRoles || (requiredRole ? [requiredRole] : []);
  
  if (roles.length > 0 && user?.role && !roles.includes(user.role as any)) {
    // Redirigir según el rol del usuario
    const roleRedirects = {
      admin: '/admin',
      operator: '/operator',
      venue: '/venue',
      user: '/user',
      gallera: '/gallera',
    };

    const userRedirect = roleRedirects[user.role as keyof typeof roleRedirects] || '/user';
    
    return <Navigate to={userRedirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;