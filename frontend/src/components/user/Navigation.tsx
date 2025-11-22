// frontend/src/components/user/Navigation.tsx
// 🎨 NAVEGACIÓN REDISEÑADA - Consistente con tema oscuro

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  User,
  Newspaper,
  Building2,
  Wallet, // Added for wallet
  Trophy, // Added for bets
  Users, // Added for admin users
  Settings, // Added for admin system
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // Added
import { useFeatureFlags } from "../../hooks/useFeatureFlags"; // Added useFeatureFlags import
import type { UserRole } from "../../../../shared/types"; // Fixed path to project-level shared/types; type-only import

const Navigation: React.FC<{ currentPage?: string }> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isWalletEnabled, isBettingEnabled } = useFeatureFlags(); // Added feature flag checks

  const getActivePage = () => {
    if (location.pathname.startsWith("/events")) return "events";
    if (location.pathname.startsWith("/bets")) return "bets";
    if (location.pathname.startsWith("/wallet")) return "wallet";
    if (location.pathname.startsWith("/profile")) return "profile";
    if (location.pathname.startsWith("/news")) return "news";
    if (location.pathname.startsWith("/venues")) return "venues";
    if (location.pathname.startsWith("/galleras")) return "galleras";
    return "home";
  };

  const activePage = getActivePage();

  const { user } = useAuth(); // Get user from AuthContext

  const getNavItems = (role: UserRole) => {
    const commonItems = [
      {
        id: "home",
        icon: Home,
        label: "Inicio",
        path: "/dashboard",
        gradient: "from-blue-500 to-blue-600",
      },
      {
        id: "events",
        icon: Calendar,
        label: "Eventos",
        path: "/events",
        gradient: "from-purple-500 to-purple-600",
      },
      {
        id: "venues",
        icon: Building2,
        label: "Galleras",
        path: "/venues",
        gradient: "from-orange-500 to-orange-600",
      },
      {
        id: "galleras",
        icon: Building2,
        label: "Criaderos",
        path: "/galleras",
        gradient: "from-orange-500 to-orange-600",
      },
      {
        id: "news",
        icon: Newspaper,
        label: "Articulos",
        path: "/news",
        gradient: "from-pink-500 to-pink-600",
      },
      {
        id: "profile",
        icon: User,
        label: "Perfil",
        path: "/profile",
        gradient: "from-green-500 to-green-600",
      },
    ];

    // Only add wallet and betting items for user and gallera roles
    if (isWalletEnabled && ["user", "gallera"].includes(role)) {
      // Conditionally add wallet item
      commonItems.push({
        id: "wallet",
        icon: Wallet,
        label: "Cartera",
        path: "/wallet",
        gradient: "from-yellow-500 to-yellow-600",
      });
    }
    if (isBettingEnabled && ["user", "gallera"].includes(role)) {
      // Conditionally add bets item
      commonItems.push({
        id: "bets",
        icon: Trophy,
        label: "Mis Apuestas",
        path: "/bets",
        gradient: "from-red-500 to-red-600",
      });
    }

    switch (role) {
      case "user": {
        // For regular users, return common items (they get all standard navigation)
        return commonItems;
      }
      case "venue":
        // Venue users cannot access wallet/betting functionality
        return commonItems.filter(
          (item) => !["wallet", "bets"].includes(item.id),
        );
      case "gallera":
        // Gallera users have full access to all items
        return commonItems;
      case "admin":
        return [
          {
            id: "admin-dashboard",
            icon: Home,
            label: "Admin",
            path: "/admin",
            gradient: "from-blue-500 to-blue-600",
          },
          {
            id: "admin-users",
            icon: Users,
            label: "Usuarios",
            path: "/admin/users",
            gradient: "from-purple-500 to-purple-600",
          },
          {
            id: "admin-venues",
            icon: Building2,
            label: "Galleras",
            path: "/admin/venues",
            gradient: "from-orange-500 to-orange-600",
          },
          {
            id: "admin-articles",
            icon: Newspaper,
            label: "Artículos",
            path: "/admin/articles",
            gradient: "from-pink-500 to-pink-600",
          },
          {
            id: "admin-system",
            icon: Settings,
            label: "Sistema",
            path: "/admin/monitoring", // Or a more general settings page
            gradient: "from-gray-500 to-gray-600",
          },
        ];
      case "operator":
        return [
          {
            id: "operator-dashboard",
            icon: Home,
            label: "Operador",
            path: "/operator",
            gradient: "from-blue-500 to-blue-600",
          },
          {
            id: "operator-events",
            icon: Calendar,
            label: "Eventos",
            path: "/operator/events",
            gradient: "from-purple-500 to-purple-600",
          },
        ];
      default:
        return [];
    }
  };

  const navItems = user ? getNavItems(user.role) : [];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-theme-header backdrop-blur-lg border-t border-theme-border-primary"></div>

      {/* Content */}
      <div className="relative px-4 py-2 safe-area-pb">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 min-w-[60px] ${
                  isActive
                    ? "transform -translate-y-1 scale-105"
                    : "hover:scale-105"
                }`}
              >
                {/* Active Background */}
                {isActive && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-xl opacity-20 animate-pulse`}
                  ></div>
                )}

                {/* Icon Container */}
                <div
                  className={`relative p-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                      : "bg-theme-accent hover:bg-theme-bg-hover"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-theme-secondary hover:text-theme-primary"
                    }`}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-xs mt-1 font-medium transition-colors duration-300 ${
                    isActive ? "text-theme-primary" : "text-theme-secondary"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div
                    className={`absolute -top-1 w-8 h-1 bg-gradient-to-r ${item.gradient} rounded-full`}
                  ></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
