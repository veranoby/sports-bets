import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  variant?: "center" | "inline" | "overlay";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className = "",
  variant = "center",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const variants = {
    center: "flex items-center justify-center min-h-[200px]",
    inline: "inline-flex items-center gap-2",
    overlay:
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      <div className="text-center">
        <Loader2
          className={`${sizeClasses[size]} animate-spin text-[#cd6263] mx-auto`}
        />
        {text && <p className="text-gray-600 mt-2 text-sm">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
