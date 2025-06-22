import React from "react";

interface BadgeProps {
  value: string | number;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  dot?: boolean; // For notification dots
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  value,
  variant = "primary",
  size = "md",
  dot,
  className,
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
    <span
      className={`inline-flex items-center justify-center rounded-full text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: dot ? "transparent" : variantColors[variant] }}
    >
      {dot ? <span className="w-2 h-2 rounded-full bg-current" /> : value}
    </span>
  );
};

export default Badge;
