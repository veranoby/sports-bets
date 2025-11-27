// frontend/src/components/admin/AdminHeaderMetricsBar.tsx
// Real-time metrics display bar for AdminHeader (Fila 2 of stacked layout)
// Shows Memory, DB Pool, Intervals, Admin SSE with color-coded severity

import React, { useState } from "react";
import useMonitoringAlerts from "../../hooks/useMonitoringAlerts";

interface AdminHeaderMetricsBarProps {
  className?: string;
}

const AdminHeaderMetricsBar: React.FC<AdminHeaderMetricsBarProps> = ({
  className = "",
}) => {
  const { metrics, loading, error } = useMonitoringAlerts();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Helper: Get color class based on percentage
  const getColorClass = (percent: number): string => {
    if (percent > 80) return "text-red-700 font-semibold";
    if (percent > 60) return "text-yellow-700 font-semibold";
    return "text-green-700 font-semibold";
  };

  // Helper: Get status icon
  const getStatusIcon = (percent: number): string => {
    if (percent > 80) return "🔴";
    if (percent > 60) return "🟡";
    return "🟢";
  };

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

  if (loading || error || !metrics) {
    return (
      <div
        className={`bg-gray-50 px-6 py-2 border-t border-gray-200 ${className}`}
      >
        <span className="text-xs text-gray-500">
          {loading
            ? "Loading metrics..."
            : error
              ? "Monitoring error"
              : "No data"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 px-6 py-2.5 border-t border-gray-200 flex items-center gap-6 text-xs ${className}`}
    >
      {/* Memory */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-700">Memory:</span>
        <span className={getColorClass(metrics.memory.percentUsed)}>
          {metrics.memory.currentMB}MB / {metrics.memory.limitMB}MB
          {getStatusIcon(metrics.memory.percentUsed)}
        </span>
      </div>

      {/* DB Pool */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-700">DB:</span>
        <span className={getColorClass(metrics.database.percentUsed)}>
          {metrics.database.activeConnections} /{" "}
          {metrics.database.totalConnections}
          {metrics.database.freeConnections > 0 &&
            ` (${metrics.database.freeConnections} free)`}
          {metrics.database.queuedRequests > 0 && (
            <span className="text-red-700 font-semibold">
              , {metrics.database.queuedRequests} queued
            </span>
          )}
          {getStatusIcon(metrics.database.percentUsed)}
        </span>
      </div>

      {/* Intervals */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-700">Intervals:</span>
        <span
          className={
            metrics.intervals.activeCount > 50
              ? "text-red-700 font-semibold"
              : metrics.intervals.activeCount > 30
                ? "text-yellow-700 font-semibold"
                : "text-green-700 font-semibold"
          }
        >
          {metrics.intervals.activeCount} active
          {metrics.intervals.activeCount > 50
            ? " 🔴"
            : metrics.intervals.activeCount > 30
              ? " 🟡"
              : " 🟢"}
        </span>
      </div>

      {/* Admin SSE */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-700">SSE:</span>
        <span className={getColorClass(metrics.adminSSE.percentUsed)}>
          {metrics.adminSSE.activeConnections} /{" "}
          {metrics.adminSSE.maxConnections}
          {getStatusIcon(metrics.adminSSE.percentUsed)}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="ml-auto flex items-center gap-2">
        {actionMessage && (
          <span
            className={`${actionMessage.startsWith("✓") ? "text-green-700" : "text-red-700"}`}
          >
            {actionMessage}
          </span>
        )}
        <button
          onClick={() => executeAction("clear-cache")}
          disabled={actionLoading !== null}
          className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Clear application cache"
        >
          {actionLoading === "clear-cache" ? "..." : "Clear Cache"}
        </button>
        <button
          onClick={() => executeAction("force-gc")}
          disabled={actionLoading !== null}
          className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Force garbage collection"
        >
          {actionLoading === "force-gc" ? "..." : "Force GC"}
        </button>
      </div>
    </div>
  );
};

export default AdminHeaderMetricsBar;
