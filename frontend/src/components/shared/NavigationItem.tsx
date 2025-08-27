// frontend/src/components/shared/NavigationItem.tsx
// ================================================================
// 🧭 NAVIGATION ITEM: Elemento de navegación reutilizable con estados activos

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface NavigationItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number | string;
  variant?: 'sidebar' | 'bottom' | 'header';
  className?: string;
  onClick?: () => void;
  exactMatch?: boolean; // Para match exacto de ruta
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  to,
  icon: Icon,
  label,
  badge,
  variant = 'sidebar',
  className = '',
  onClick,
  exactMatch = false
}) => {
  const location = useLocation();
  
  // Determinar si está activo
  const isActive = exactMatch 
    ? location.pathname === to
    : location.pathname.startsWith(to);

  // Clases por variante
  const variantClasses = {
    sidebar: {
      base: "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      active: "bg-blue-100 text-blue-700 font-medium shadow-sm",
      inactive: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    },
    bottom: {
      base: "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200",
      active: "text-blue-600 bg-blue-50",
      inactive: "text-gray-500 hover:text-gray-700"
    },
    header: {
      base: "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
      active: "bg-white/20 text-white font-medium",
      inactive: "text-white/80 hover:text-white hover:bg-white/10"
    }
  };

  const classes = variantClasses[variant];
  const combinedClasses = `${classes.base} ${isActive ? classes.active : classes.inactive} ${className}`;

  // Tamaños de icon por variante
  const iconSize = {
    sidebar: "w-5 h-5",
    bottom: "w-6 h-6",
    header: "w-4 h-4"
  }[variant];

  // Tamaños de texto por variante
  const textSize = {
    sidebar: "text-sm",
    bottom: "text-xs",
    header: "text-sm"
  }[variant];

  const handleClick = () => {
    onClick?.();
  };

  return (
    <Link
      to={to}
      className={combinedClasses}
      onClick={handleClick}
    >
      <div className="relative">
        <Icon className={iconSize} />
        
        {/* Badge para notificaciones */}
        {badge && (
          <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </div>
        )}

        {/* Indicador de estado activo para bottom navigation */}
        {variant === 'bottom' && isActive && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
        )}
      </div>
      
      <span className={`${textSize} ${variant === 'bottom' ? 'font-medium' : ''}`}>
        {label}
      </span>
      
      {/* Indicador lateral para sidebar */}
      {variant === 'sidebar' && isActive && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
      )}
    </Link>
  );
};

export default NavigationItem;