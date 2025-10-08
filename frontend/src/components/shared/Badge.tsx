import React from "react";

interface BadgeProps {
  value: string | number;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  dot?: boolean; // For notification dots
  className?: string;
  children?: React.ReactNode; // Añadir soporte para children
  icon?: React.ReactNode; // Nueva prop para iconos
  iconPosition?: "left" | "right"; // Posición del icono
}

const Badge: React.FC<BadgeProps> = ({
  value,
  variant = "primary",
  size = "md",
  dot,
  className,
  children,
  icon,
  iconPosition = "left", // Default: icono a la izquierda
}) => {
  // Definir las clases de variantes usando Tailwind
  const variantClasses = {
    primary: "bg-[#8ba3bc7e] text-white",    // color-primary con transparencia
    secondary: "bg-[#7fc29b] text-white",    // color-secondary
    success: "bg-green-500 text-white",      // color-success
    warning: "bg-yellow-500 text-white",     // color-warning
    error: "bg-red-500 text-white",          // color-error
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  // Si es un dot, aplicamos estilos especiales
  const dotClasses = dot 
    ? "w-2 h-2 rounded-full" 
    : "inline-flex items-center justify-center rounded-lg";

  const baseClasses = dot 
    ? `${variantClasses[variant]} ${className}` 
    : `${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={`${dotClasses} ${baseClasses}`}>
      {icon && iconPosition === "left" && <span className="mr-1">{icon}</span>}
      {!dot && (
        <span className="text-white font-bold">
          {value}
        </span>
      )}
      {children && (
        <span className="!font-bold text-xs [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] uppercase">
          {typeof children === "string" ? children.toUpperCase() : children}
        </span>
      )}
      {icon && iconPosition === "right" && <span className="ml-1">{icon}</span>}
    </span>
  );
};

export default Badge;
