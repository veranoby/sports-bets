import React from "react";
import { Calendar } from "lucide-react";
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  message?: string;
  buttonText?: string;
  buttonLink?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
  message,
  buttonText,
  buttonLink,
}) => {
  const finalDescription = description || message;

  const renderAction = () => {
    if (action) {
      return action;
    }
    if (buttonText && buttonLink) {
      return (
        <Link to={buttonLink} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          {buttonText}
        </Link>
      );
    }
    return null;
  };

  return (
    <div className={`text-center p-8 ${className}`}>
      <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
        {React.isValidElement(icon)
          ? React.cloneElement(icon, { className: "w-12 h-12" })
          : icon || <Calendar className="w-12 h-12" />}
      </div>

      <h3 className="text-lg font-medium mb-2 text-gray-800">{title}</h3>

      {finalDescription && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
          {finalDescription}
        </p>
      )}

      {renderAction() && <div className="mt-6">{renderAction()}</div>}
    </div>
  );
};

export default EmptyState;