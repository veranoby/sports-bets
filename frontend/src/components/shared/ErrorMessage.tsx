import React from "react";
import { AlertCircle, RefreshCw, Settings, Lock } from "lucide-react";

interface ErrorMessageProps {
  error?: string;
  message?: string; // Alternative prop name used in Notifications.tsx
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  message,
  onRetry,
  className = ""
}) => {
  // Use either error or message prop
  const displayMessage = error || message || '';
  
  // Check if this is a feature disabled error
  const isFeatureDisabled = displayMessage.toLowerCase().includes('currently disabled') || 
                           displayMessage.toLowerCase().includes('wallet system is currently disabled');

  if (isFeatureDisabled) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <Settings className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Funcionalidad Deshabilitada
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              El sistema de billeteras está temporalmente deshabilitado por el administrador.
            </p>
            <div className="flex items-center text-xs text-yellow-600">
                <Lock className="w-4 h-4 mr-1" />
                Contacta al administrador del sistema para habilitar esta funcionalidad.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 mb-3">{displayMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  export { ErrorMessage };
  export default ErrorMessage;
