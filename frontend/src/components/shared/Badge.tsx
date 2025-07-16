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
  const variantColors = {
    primary: "var(--color-primary)",
    secondary: "var(--color-secondary)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: dot ? "transparent" : variantColors[variant] }}
    >
      {icon && iconPosition === "left" && <span className="mr-1">{icon}</span>}
      <span className="text-white font-bold">{value}</span>
      {children && (
        <span className="!font-bold text-xs [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] uppercase">
          {typeof children === "string" ? children.toUpperCase() : children}
        </span>
      )}
      {icon && iconPosition === "right" && <span className="ml-1">{icon}</span>}
    </div>
  );
};

export default Badge;
