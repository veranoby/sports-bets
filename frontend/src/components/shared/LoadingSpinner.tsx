// CREAR O REEMPLAZAR CONTENIDO
import React from "react";
import { Loader2 } from "lucide-react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Cargando...",
  size = "md",
  className = "",
}) => {
  const theme = getUserThemeClasses();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-theme-primary mb-4`}
      />
      <p className={theme.secondaryText}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
