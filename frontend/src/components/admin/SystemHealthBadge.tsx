// frontend/src/components/admin/SystemHealthBadge.tsx
// Displays system health alert count with color-coded severity indicator
// Click navigates to monitoring page for detailed view

import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  AlertOctagon,
} from "lucide-react";
import { Link } from "react-router-dom";
import useMonitoringAlerts from "../../hooks/useMonitoringAlerts";

interface SystemHealthBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SystemHealthBadge: React.FC<SystemHealthBadgeProps> = ({
  className = "",
  size = "md",
}) => {
  const { alertCount, loading, error } = useMonitoringAlerts();

  // Size configurations
  const sizeClasses = {
    sm: "text-xs px-2 py-1 rounded-full",
    md: "text-sm px-2.5 py-1.5 rounded-full",
    lg: "text-base px-3 py-2 rounded-full",
  };

  const currentSizeClass = sizeClasses[size];

  // Determine color based on alert count
  const getSeverityColor = () => {
    if (error) {
      return "text-red-700 bg-red-100 border border-red-300";
    } else if (alertCount > 5) {
      return "text-red-700 bg-red-100 border border-red-300";
    } else if (alertCount > 0) {
      return "text-yellow-700 bg-yellow-100 border border-yellow-300";
    } else {
      return "text-green-700 bg-green-100 border border-green-300";
    }
  };

  const severityColor = getSeverityColor();

  // Get appropriate icon based on status
  const getSeverityIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
      );
    } else if (error) {
      return <AlertOctagon className="w-3 h-3" />;
    } else if (alertCount > 5) {
      return <AlertTriangle className="w-3 h-3" />;
    } else if (alertCount > 0) {
      return <AlertCircle className="w-3 h-3" />;
    } else {
      return <CheckCircle className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-medium text-gray-700 bg-gray-100 border border-gray-300 ${sizeClasses[size]} ${className}`}
      >
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
        <span>...</span>
      </div>
    );
  } else if (error) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-medium text-red-700 bg-red-100 border border-red-300 ${sizeClasses[size]} ${className}`}
      >
        <AlertOctagon className="w-3 h-3" />
        <span>Err</span>
      </div>
    );
  } else {
    return (
      <Link
        to="/admin/monitoring"
        className="no-underline hover:no-underline focus:no-underline"
        title={
          alertCount > 0
            ? `View ${alertCount} system alert${alertCount > 1 ? "s" : ""}`
            : "System monitoring - All OK"
        }
      >
        <div
          className={`inline-flex items-center gap-1.5 font-medium ${severityColor} ${sizeClasses[size]} ${className}`}
        >
          {getSeverityIcon()}
          <span>
            {alertCount > 0
              ? `${alertCount} Alert${alertCount > 1 ? "s" : ""}`
              : "OK"}
          </span>
        </div>
      </Link>
    );
  }
};

export default SystemHealthBadge;
