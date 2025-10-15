// frontend/src/components/navigation/FeaturedNavigation.tsx
// Componente de navegación para artículos destacados y contenido premium

import React from "react";
import { Star, Crown, Zap, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const FeaturedNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isPremiumUser = user?.subscription?.status === "active" && 
                       user.subscription.type !== "free";

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto py-3 space-x-8">
          <Link
            to="/featured"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              isActive("/featured")
                ? "bg-yellow-100 text-yellow-800"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Star className="w-4 h-4" />
            Destacados
          </Link>
          
          <Link
            to="/featured/premium"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              isActive("/featured/premium")
                ? "bg-yellow-500 text-black"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Crown className="w-4 h-4" />
            Premium
            <Zap className="w-3 h-3 text-yellow-500" />
          </Link>
          
          <Link
            to="/featured/latest"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              isActive("/featured/latest")
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Más Recientes
          </Link>
          
          {isPremiumUser && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg text-sm font-bold">
              <Crown className="w-4 h-4" />
              ERES PREMIUM
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedNavigation;