import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  variant?: "card" | "inline" | "page";
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  variant = "card",
  className = "",
}) => {
  const errorText = typeof error === "string" ? error : error.message;

  const variants = {
    card: "bg-red-50 border border-red-200 rounded-lg p-4",
    inline: "text-red-600 text-sm",
    page: "min-h-[400px] flex items-center justify-center",
  };

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-red-600">{errorText}</span>
      </div>
    );
  }

  return (
    <div className={`${variants[variant]} ${className}`}>
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 mb-4">{errorText}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-[#596c95] text-white px-4 py-2 rounded-lg hover:bg-[#4a5a85] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
