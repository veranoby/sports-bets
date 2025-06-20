// frontend/src/components/shared/NotificationCenter.tsx - OPTIMIZACIÓN ANTI-THRASHING

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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

const NotificationCenter: React.FC = React.memo(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useUserTheme();
  const { addListener, removeListener, isConnected } = useWebSocketContext();

  // 🛡️ REF PARA PREVENIR MULTIPLE REGISTRATIONS
  const listenersRegisteredRef = useRef(false);
  const isMountedRef = useRef(true);

  // ✅ FETCH NOTIFICATIONS ESTABLE (sin dependencias inestables)
  const fetchNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      const response = await apiClient.get("/notifications");

      if (!isMountedRef.current) return;

      setNotifications(
        response.data.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp || n.createdAt),
        }))
      );
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
  }, []); // ✅ Sin dependencias

  // ✅ CALLBACKS COMPLETAMENTE ESTABLES
  const handleNewNotification = useCallback((notification: Notification) => {
    if (!isMountedRef.current) return;
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
  }, []);

  const handleUpdateNotification = useCallback(
    (updatedNotification: Notification) => {
      if (!isMountedRef.current) return;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === updatedNotification.id ? updatedNotification : n
        )
      );
    },
    []
  );

  // 🔒 EFFECT ÚNICO PARA LISTENERS - SIN DEPENDENCIAS INESTABLES
  useEffect(() => {
    if (!isConnected || listenersRegisteredRef.current) return;

    console.log("🎧 Registrando listeners (estable)");
    addListener("notification:new", handleNewNotification);
    addListener("notification:update", handleUpdateNotification);
    listenersRegisteredRef.current = true;

    return () => {
      if (listenersRegisteredRef.current) {
        console.log("🧹 Limpiando listeners (estable)");
        removeListener("notification:new", handleNewNotification);
        removeListener("notification:update", handleUpdateNotification);
        listenersRegisteredRef.current = false;
      }
    };
  }, [isConnected]); // ✅ Solo isConnected como dependencia

  // 🧹 CLEANUP EN UNMOUNT (robusto)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      console.log("🗑️ Componente desmontado (cleanup completo)");
    };
  }, []);

  // ✅ EFFECT PARA FETCH - SOLO CUANDO SE ABRE
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]); // ✅ fetchNotifications no es dependencia

  // ✅ MEMOIZAR FUNCIONES DE ACCIÓN
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

  // ✅ MEMOIZAR UNREAD COUNT
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.status === "unread").length;
  }, [notifications]);

  // ✅ MEMOIZAR NOTIFICATION ITEMS
  const notificationItems = useMemo(() => {
    return notifications.slice(0, 10).map((notification) => (
      <div
        key={notification.id}
        className={`p-3 border-b border-gray-200 hover:bg-gray-50 ${
          notification.status === "unread" ? "bg-blue-50" : ""
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {notification.timestamp.toLocaleString()}
            </p>
          </div>
          <div className="flex space-x-1 ml-2">
            {notification.status === "unread" && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-gray-400 hover:text-green-600"
                title="Marcar como leída"
              >
                <Check size={16} />
              </button>
            )}
            <button
              onClick={() => markAsArchived(notification.id)}
              className="text-gray-400 hover:text-red-600"
              title="Archivar"
            >
              <Archive size={16} />
            </button>
          </div>
        </div>
      </div>
    ));
  }, [notifications, markAsRead, markAsArchived]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
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
