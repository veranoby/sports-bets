// CREAR O REEMPLAZAR CONTENIDO
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

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
  const theme = getUserThemeClasses();

  return (
    <div
      className={`${theme.cardBackground} border-l-4 border-theme-error p-4 ${className}`}
    >
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-theme-error mr-3" />
        <div className="flex-1">
          <p className={theme.errorText}>{error}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className={`${theme.ghostButton} ml-4`}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
