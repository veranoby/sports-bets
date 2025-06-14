import React from "react";
import { Calendar, Target, DollarSign } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => (
  <div className={`text-center p-8 ${className}`}>
    <div className="mx-auto w-12 h-12 text-gray-400">
      {icon || <Calendar className="w-full h-full" />}
    </div>
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#596c95] hover:bg-[#4a5b80]"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
