import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  className = "",
  showIcon = true,
}) => (
  <div
    className={`flex items-center p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 ${className}`}
  >
    {showIcon && <AlertCircle className="w-5 h-5 mr-2" />}
    <span>{typeof error === "string" ? error : error.message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="ml-auto flex items-center text-red-700 hover:text-red-900"
      >
        <RefreshCw className="w-4 h-4 mr-1" />
        Retry
      </button>
    )}
  </div>
);
