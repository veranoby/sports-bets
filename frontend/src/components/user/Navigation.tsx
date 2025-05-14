"use client";

import type React from "react";
import { Home, Calendar, DollarSign, User } from "lucide-react";

/**
 * All possible navigation items for the bottom navigation bar
 */
type NavItem = "home" | "events" | "bets" | "profile";

/**
 * Navigation component props
 */
interface NavigationProps {
  /** Currently active navigation page */
  activePage: NavItem;
  /** Handler for navigation changes */
  onNavigate: (page: NavItem) => void;
}

/**
 * Bottom navigation bar component for mobile-focused layout
 */
const Navigation: React.FC<NavigationProps> = ({ activePage, onNavigate }) => {
  // Navigation items configuration
  const navItems: Array<{
    id: NavItem;
    label: string;
    icon: React.ReactNode;
    ariaLabel: string;
  }> = [
    {
      id: "home",
      label: "Inicio",
      icon: <Home size={20} />,
      ariaLabel: "Ir a inicio",
    },
    {
      id: "events",
      label: "Eventos",
      icon: <Calendar size={20} />,
      ariaLabel: "Ir a eventos",
    },
    {
      id: "bets",
      label: "Apuestas",
      icon: <DollarSign size={20} />,
      ariaLabel: "Ir a mis apuestas",
    },
    {
      id: "profile",
      label: "Perfil",
      icon: <User size={20} />,
      ariaLabel: "Ir a mi perfil",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
      <div className="flex justify-around items-center h-16 safe-area-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-label={item.ariaLabel}
            aria-current={activePage === item.id ? "page" : undefined}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
              activePage === item.id
                ? "text-amber-500 dark:text-amber-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {/* Icon */}
            <div className="relative">
              {item.icon}

              {/* Active indicator dot for smaller screens */}
              {activePage === item.id && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 sm:hidden"></span>
              )}
            </div>

            {/* Label */}
            <span className="text-xs mt-1">{item.label}</span>

            {/* Active indicator bar - only visible on larger screens */}
            {activePage === item.id && (
              <div className="absolute bottom-0 w-6 h-1 bg-amber-500 dark:bg-amber-400 rounded-t-full hidden sm:block"></div>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
