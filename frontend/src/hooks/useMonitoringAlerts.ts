// frontend/src/hooks/useMonitoringAlerts.ts
// Custom hook to monitor system alerts for admin header badge
// Uses SSE to get real-time alert count updates from backend

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

// Interface for monitoring alert data
export interface MonitoringAlertData {
  critical: number;
  warnings: number;
  total: number;
  timestamp: string;
  metrics?: {
    memory: {
      currentMB: number;
      limitMB: number;
      percentUsed: number;
    };
    database: {
      activeConnections: number;
      freeConnections: number;
      totalConnections: number;
      queuedRequests: number;
      percentUsed: number;
    };
    intervals: {
      activeCount: number;
      details: any[];
    };
    adminSSE: {
      activeConnections: number;
      maxConnections: number;
      percentUsed: number;
    };
  };
}

export interface UseMonitoringAlertsReturn {
  alertCount: number;
  criticalAlerts: number;
  warningAlerts: number;
  metrics: MonitoringAlertData["metrics"] | null;
  loading: boolean;
  error: string | null;
  refreshAlerts: () => void;
}

const useMonitoringAlerts = (): UseMonitoringAlertsReturn => {
  const { user, token } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);
  const [criticalAlerts, setCriticalAlerts] = useState<number>(0);
  const [warningAlerts, setWarningAlerts] = useState<number>(0);
  const [metrics, setMetrics] = useState<MonitoringAlertData["metrics"] | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const MAX_RECONNECT_DELAY = 30000; // 30 seconds max delay

  const fetchInitialAlerts = useCallback(async () => {
    if (!user || !token || !mountedRef.current) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/monitoring/alerts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const { critical, warnings, total, metrics: metricsData } = result.data;
        setCriticalAlerts(critical || 0);
        setWarningAlerts(warnings || 0);
        setAlertCount(total || 0);
        setMetrics(metricsData || null);
        setError(null);
      } else {
        setAlertCount(0);
        setCriticalAlerts(0);
        setWarningAlerts(0);
        setMetrics(null);
      }
    } catch (fetchError: any) {
      console.error("❌ Fetch alerts error:", fetchError);
      setError(fetchError.message || "Error fetching monitoring alerts");
      setAlertCount(0);
      setCriticalAlerts(0);
      setWarningAlerts(0);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, token]);

  const connect = useCallback(() => {
    if (!user || !token || !mountedRef.current) {
      setLoading(false);
      return;
    }

    // Ensure no parallel connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/monitoring/sse/admin/monitoring`;
      console.log(`🔌 SSE: Monitoring - Attempting connection`);
      console.log(
        `   Token: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`,
      );

      const sseUrl = `${url}?token=${encodeURIComponent(token)}`;
      const es = new EventSource(sseUrl);

      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;

        console.log(`✅ SSE: Monitoring connected`);
        setError(null);
        retryCountRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      es.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const data: MonitoringAlertData = JSON.parse(event.data);
          if (
            data &&
            data.critical !== undefined &&
            data.warnings !== undefined
          ) {
            setCriticalAlerts(data.critical);
            setWarningAlerts(data.warnings);
            setAlertCount(data.total || data.critical + data.warnings);
            setMetrics(data.metrics || null);
          } else {
            console.error("❌ SSE: Invalid monitoring data format");
          }
        } catch (parseError: any) {
          console.error(`❌ SSE: Monitoring parse error`, parseError);
          setError(`Parse error: ${parseError.message}`);
        }
      };

      es.addEventListener("monitoring-update", (event: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const data: MonitoringAlertData = JSON.parse(event.data);
          if (
            data &&
            data.critical !== undefined &&
            data.warnings !== undefined
          ) {
            setCriticalAlerts(data.critical);
            setWarningAlerts(data.warnings);
            setAlertCount(data.total || data.critical + data.warnings);
            setMetrics(data.metrics || null);
          } else {
            console.error("❌ SSE: Invalid monitoring-update format");
          }
        } catch (parseError: any) {
          console.error(`❌ SSE: Monitoring-update parse error`, parseError);
          setError(`Parse error: ${parseError.message}`);
        }
      });

      es.onerror = () => {
        if (!mountedRef.current) return;

        console.warn("⚠️ SSE: Monitoring connection error");
        eventSourceRef.current?.close();

        const delay = Math.min(
          MAX_RECONNECT_DELAY,
          1000 * Math.pow(2, retryCountRef.current),
        );
        retryCountRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (e: any) {
      console.error(`❌ SSE: Monitoring - EventSource error:`, e);
      setError(e.message || "Error creating SSE connection");
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, token]);

  const refreshAlerts = useCallback(() => {
    setLoading(true);
    setError(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    fetchInitialAlerts();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [fetchInitialAlerts, connect]);

  useEffect(() => {
    if (user && token && (user.role === "admin" || user.role === "operator")) {
      // Initial fetch
      fetchInitialAlerts();

      // Setup SSE for real-time updates
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        console.log("🔌 SSE: Closing admin monitoring alerts connection");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user, token, fetchInitialAlerts, connect]);

  return {
    alertCount,
    criticalAlerts,
    warningAlerts,
    metrics,
    loading,
    error,
    refreshAlerts,
  };
};

export default useMonitoringAlerts;
