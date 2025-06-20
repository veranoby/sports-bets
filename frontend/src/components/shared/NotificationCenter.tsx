// frontend/src/components/shared/NotificationCenter.tsx - OPTIMIZACIÓN DEFINITIVA
// ==============================================================================

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { useUserTheme } from "../../contexts/UserThemeContext";
import { Bell, X, Check, Archive } from "lucide-react";
import { apiClient } from "../../config/api";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  status: "unread" | "read" | "archived";
  type: "info" | "warning" | "error" | "success" | "bet_proposal";
  metadata?: any;
}

const NotificationCenter: React.FC = memo(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useUserTheme();
  const { addListener, removeListener, isConnected } = useWebSocketContext();

  // 🛡️ REFERENCIAS ESTABLES PARA PREVENIR RE-RENDERS
  const isMountedRef = useRef(true);
  const listenersRegisteredRef = useRef(false);
  const componentIdRef = useRef(`notification-${Date.now()}`);

  // ✅ FETCH NOTIFICATIONS COMPLETAMENTE ESTABLE
  const fetchNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      const response = await apiClient.get("/notifications");

      if (!isMountedRef.current) return;

      const formattedNotifications = response.data.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp || n.createdAt),
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (isMountedRef.current) {
        setNotifications([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // ✅ Sin dependencias - completamente estable

  // ✅ HANDLERS COMPLETAMENTE ESTABLES
  const handleNewNotification = useCallback((notification: Notification) => {
    if (!isMountedRef.current) return;

    console.log(`📢 Nueva notificación recibida:`, notification);

    setNotifications((prev) => {
      // Evitar duplicados
      if (prev.some((n) => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev.slice(0, 49)]; // Mantener máximo 50
    });
  }, []);

  const handleUpdateNotification = useCallback(
    (updatedNotification: Notification) => {
      if (!isMountedRef.current) return;

      console.log(`🔄 Notificación actualizada:`, updatedNotification);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === updatedNotification.id ? updatedNotification : n
        )
      );
    },
    []
  );

  // 🔒 EFFECT ÚNICO PARA LISTENERS - REGISTRO ÚNICO
  useEffect(() => {
    if (!isConnected || listenersRegisteredRef.current) {
      return;
    }

    console.log(`🎧 ${componentIdRef.current} registrando listeners WebSocket`);

    addListener("notification:new", handleNewNotification);
    addListener("notification:update", handleUpdateNotification);
    listenersRegisteredRef.current = true;

    return () => {
      if (listenersRegisteredRef.current) {
        console.log(
          `🧹 ${componentIdRef.current} limpiando listeners WebSocket`
        );
        removeListener("notification:new", handleNewNotification);
        removeListener("notification:update", handleUpdateNotification);
        listenersRegisteredRef.current = false;
      }
    };
  }, [
    isConnected,
    addListener,
    removeListener,
    handleNewNotification,
    handleUpdateNotification,
  ]);

  // 🧹 CLEANUP EN UNMOUNT - ROBUSTO
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      console.log(
        `🗑️ ${componentIdRef.current} desmontando - cleanup completo`
      );
      isMountedRef.current = false;

      // Forzar cleanup de listeners si aún están registrados
      if (listenersRegisteredRef.current) {
        removeListener("notification:new", handleNewNotification);
        removeListener("notification:update", handleUpdateNotification);
        listenersRegisteredRef.current = false;
      }
    };
  }, [removeListener, handleNewNotification, handleUpdateNotification]);

  // ✅ FETCH SOLO CUANDO SE ABRE EL PANEL
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]); // fetchNotifications es estable

  // ✅ ACCIONES DE NOTIFICACIÓN MEMOIZADAS
  const markAsRead = useCallback(async (id: string) => {
    if (!isMountedRef.current) return;

    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAsArchived = useCallback(async (id: string) => {
    if (!isMountedRef.current) return;

    try {
      await apiClient.put(`/notifications/${id}/archive`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ✅ MEMOIZAR VALORES COMPUTADOS
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.status === "unread").length;
  }, [notifications]);

  const notificationItems = useMemo(() => {
    return notifications.slice(0, 10).map((notification) => (
      <div
        key={notification.id}
        className={`p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          notification.status === "unread" ? "bg-blue-50" : ""
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <span className="text-xs text-gray-500">
              {notification.timestamp.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex space-x-1 ml-2">
            {notification.status === "unread" && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Marcar como leída"
              >
                <Check size={14} />
              </button>
            )}
            <button
              onClick={() => markAsArchived(notification.id)}
              className="text-gray-600 hover:text-gray-800 p-1"
              title="Archivar"
            >
              <Archive size={14} />
            </button>
          </div>
        </div>
      </div>
    ));
  }, [notifications, markAsRead, markAsArchived]);

  return (
    <div className="relative">
      {/* 🔔 BOTÓN DE NOTIFICACIONES */}
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
        title="Notificaciones"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 📋 PANEL DE NOTIFICACIONES */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h3>
            <button
              onClick={toggleOpen}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              notificationItems
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotificationCenter.displayName = "NotificationCenter";

export default NotificationCenter;
