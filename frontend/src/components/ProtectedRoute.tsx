import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"admin" | "operator" | "venue" | "user" | "gallera">;
  requiredRole?: "admin" | "operator" | "venue" | "user" | "gallera"; // Keep for backward compatibility
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredRole,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isWalletEnabled, isBettingEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const location = useLocation();

  // Show loading while verifying authentication OR feature flags
  if (authLoading || flagsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Feature Flag enforcement
  const path = location.pathname;
  if (path.startsWith('/wallet') && !isWalletEnabled) {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.startsWith('/bets') && !isBettingEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role verification (existing logic)
  const roles = allowedRoles || (requiredRole ? [requiredRole] : []);

  if (roles.length > 0 && user?.role && !roles.includes(user.role)) {
    // Redirect based on user role
    const roleRedirects = {
      admin: "/admin",
      operator: "/operator",
      venue: "/venue",
      user: "/user",
      gallera: "/gallera",
    };

    const userRedirect =
      roleRedirects[user.role as keyof typeof roleRedirects] || "/user";

    return <Navigate to={userRedirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
