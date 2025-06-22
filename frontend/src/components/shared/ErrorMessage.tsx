// CREAR O REEMPLAZAR CONTENIDO
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  className = "",
}) => {
  return (
    <div className="bg-theme-card border-l-4 border-theme-error p-4 ${className}">
      <AlertCircle className="w-5 h-5 text-theme-error mr-3" />
      <p className="text-theme-error">{error}</p>
      <button onClick={onRetry} className="btn-ghost ml-4">
        <RefreshCw className="w-4 h-4 mr-2" />
        Reintentar
      </button>
    </div>
  );
};

export default ErrorMessage;
