"use client";

import type React from "react";
import { Home, Calendar, DollarSign, User } from "lucide-react";

interface NavigationProps {
  activePage: "home" | "events" | "bets" | "profile";
  onNavigate: (page: "home" | "events" | "bets" | "profile") => void;
}

const Navigation: React.FC<NavigationProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "events", label: "Eventos", icon: Calendar },
    { id: "bets", label: "Apuestas", icon: DollarSign },
    { id: "profile", label: "Perfil", icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-red-500" : "text-gray-400 hover:text-gray-600"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={`w-5 h-5 mb-1 ${
                  isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                }`}
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
