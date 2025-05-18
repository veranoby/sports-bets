/**
 * Navigation Component
 * Barra de navegación inferior fija con soporte para áreas seguras y optimización táctil
 */
"use client";

import React from "react";
import { Home, Calendar, DollarSign, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export type NavigationPage = "home" | "events" | "bets" | "profile";

export interface NavigationProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

const Navigation: React.FC<NavigationProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { id: "home" as const, label: "Inicio", icon: Home, path: "/" },
    { id: "events" as const, label: "Eventos", icon: Calendar, path: "/" },
    { id: "bets" as const, label: "Apuestas", icon: DollarSign, path: "/" },
    { id: "profile" as const, label: "Perfil", icon: User, path: "/profile" },
  ];

  // Determinar página activa por ruta
  const getActivePage = () => {
    if (
      location.pathname === "/" ||
      location.pathname.startsWith("/live-event")
    )
      return "home";
    if (location.pathname === "/wallet") return "bets";
    if (location.pathname === "/profile") return "profile";
    if (location.pathname === "/operator") return "operator";
    return "home";
  };
  const activePage = getActivePage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm z-10 pb-safe">
      <div className="flex justify-around items-center min-h-[64px]">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full py-2 transition-colors ${
                isActive ? "text-red-500" : "text-gray-400 hover:text-gray-600"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${item.label}${isActive ? " (Página actual)" : ""}`}
              style={{ border: "none", background: "transparent" }}
            >
              <item.icon
                className={`w-5 h-5 mb-1 flex-shrink-0 ${
                  isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-xs ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
