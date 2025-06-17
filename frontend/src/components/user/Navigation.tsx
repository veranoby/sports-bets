// frontend/src/components/user/Navigation.tsx
// 🎨 NAVEGACIÓN REDISEÑADA - Consistente con tema oscuro

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Activity, Wallet, User } from "lucide-react";

const Navigation: React.FC<{ currentPage?: string }> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePage = () => {
    if (location.pathname.startsWith("/events")) return "events";
    if (location.pathname.startsWith("/bets")) return "bets";
    if (location.pathname.startsWith("/wallet")) return "wallet";
    if (location.pathname.startsWith("/profile")) return "profile";
    return "home";
  };

  const activePage = getActivePage();

  const navItems = [
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
      id: "bets",
      icon: Activity,
      label: "Apuestas",
      path: "/bets",
      gradient: "from-red-500 to-red-600",
    },
    {
      id: "wallet",
      icon: Wallet,
      label: "Billetera",
      path: "/wallet",
      gradient: "from-green-500 to-green-600",
    },
    {
      id: "profile",
      icon: User,
      label: "Perfil",
      path: "/profile",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-[#1a1f37]/95 backdrop-blur-lg border-t border-[#596c95]/30"></div>

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
                      : "bg-[#2a325c]/50 hover:bg-[#596c95]/30"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-xs mt-1 font-medium transition-colors duration-300 ${
                    isActive ? "text-white" : "text-gray-400"
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
