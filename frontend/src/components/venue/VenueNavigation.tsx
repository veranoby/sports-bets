// frontend/src/components/venue/VenueNavigation.tsx
import React, { memo } from "react";
import { NavLink } from "react-router-dom";
import { Home, Calendar, User } from "lucide-react";

const VenueNavigation = memo(() => {
  const navItems = [
    { path: "/venue", icon: Home, label: "Inicio" },
    { path: "/venue/events", icon: Calendar, label: "Eventos" },
    { path: "/venue/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 ${
                isActive ? "text-orange-500" : "text-gray-400"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
});

export default VenueNavigation;
