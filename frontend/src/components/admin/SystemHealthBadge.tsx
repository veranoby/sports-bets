// frontend/src/components/admin/SystemHealthBadge.tsx
// Displays system health alert count with color-coded severity indicator
// Shows dropdown with alert details on click/hover (no navigation to preserve context)

import React, { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  AlertOctagon,
} from "lucide-react";
import useMonitoringAlerts from "../../hooks/useMonitoringAlerts";

interface SystemHealthBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SystemHealthBadge: React.FC<SystemHealthBadgeProps> = ({
  className = "",
  size = "md",
}) => {
  const { alertCount, criticalAlerts, warningAlerts, metrics, loading, error } =
    useMonitoringAlerts();
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Execute quick action
  const executeAction = async (actionType: string) => {
    setActionLoading(actionType);
    setActionMessage(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/monitoring/actions/${actionType}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setActionMessage(`✓ ${data.message}`);
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionMessage(`✗ ${data.message}`);
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err) {
      setActionMessage("✗ Action failed");
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

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
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`inline-flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80 transition-opacity ${severityColor} ${sizeClasses[size]} ${className}`}
          title={
            alertCount > 0
              ? `${alertCount} system alert${alertCount > 1 ? "s" : ""} - Click for details`
              : "System monitoring - All OK - Click for details"
          }
        >
          {getSeverityIcon()}
          <span>
            {alertCount > 0
              ? `${alertCount} Alert${alertCount > 1 ? "s" : ""}`
              : "OK"}
          </span>
        </button>

        {/* Dropdown popover */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                System Health Status
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {/* Critical alerts */}
              {criticalAlerts > 0 && (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {criticalAlerts} Critical Alert
                    {criticalAlerts > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Warning alerts */}
              {warningAlerts > 0 && (
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {warningAlerts} Warning{warningAlerts > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* All OK */}
              {alertCount === 0 && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    All systems operational
                  </span>
                </div>
              )}

              {/* System Metrics - Always show if available */}
              {metrics && (
                <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold mb-2">
                    System Metrics:
                  </p>

                  {/* Memory */}
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Memory:</span>{" "}
                    {metrics.memory.currentMB} MB / {metrics.memory.limitMB} MB
                    <span
                      className={`ml-1 ${metrics.memory.percentUsed > 80 ? "text-red-600" : metrics.memory.percentUsed > 60 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      ({metrics.memory.percentUsed}%)
                    </span>
                  </div>

                  {/* Database Connections */}
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">DB Pool:</span>{" "}
                    {metrics.database.activeConnections} /{" "}
                    {metrics.database.totalConnections} active (
                    {metrics.database.freeConnections} free)
                    {metrics.database.queuedRequests > 0 && (
                      <span className="ml-1 text-red-600">
                        , {metrics.database.queuedRequests} queued
                      </span>
                    )}
                  </div>

                  {/* Intervals */}
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Intervals:</span>{" "}
                    {metrics.intervals.activeCount} active
                    <span
                      className={`ml-1 ${metrics.intervals.activeCount > 50 ? "text-red-600" : metrics.intervals.activeCount > 30 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {metrics.intervals.activeCount > 50 ? "(HIGH!)" : "(OK)"}
                    </span>
                  </div>

                  {/* Admin SSE Connections */}
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Admin SSE:</span>{" "}
                    {metrics.adminSSE.activeConnections} /{" "}
                    {metrics.adminSSE.maxConnections} connections
                    <span
                      className={`ml-1 ${metrics.adminSSE.percentUsed > 80 ? "text-red-600" : metrics.adminSSE.percentUsed > 60 ? "text-yellow-600" : "text-green-600"}`}
                    >
                      ({metrics.adminSSE.percentUsed}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Action message feedback */}
              {actionMessage && (
                <div
                  className={`text-xs p-2 rounded ${actionMessage.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                >
                  {actionMessage}
                </div>
              )}

              {/* Quick Actions - Only show if there are alerts */}
              {alertCount > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => executeAction("clear-cache")}
                      disabled={actionLoading !== null}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === "clear-cache" ? "..." : "Clear Cache"}
                    </button>
                    <button
                      onClick={() => executeAction("force-gc")}
                      disabled={actionLoading !== null}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === "force-gc" ? "..." : "Force GC"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    );
  }
};

export default SystemHealthBadge;
