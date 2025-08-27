import React from "react";

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variants = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger:
      "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary)]/90",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default ActionButton;
