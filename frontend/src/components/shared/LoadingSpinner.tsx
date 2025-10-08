// CREAR O REEMPLAZAR CONTENIDO
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Cargando...",
  size = "md",
  className = "",
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-[#8ba3bc7e]", // color-primary with transparency
    secondary: "text-[#cd6263]", // color-secondary
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${fullPage ? "min-h-screen" : ""} ${className}`}
    >
      <Loader2
        className={`${sizeClasses[size]} animate-spin ${colorClasses.primary} mb-4`}
      />
      <p className={`text-gray-600 dark:text-gray-400`}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
