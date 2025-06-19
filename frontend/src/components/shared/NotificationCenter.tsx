// frontend/src/components/shared/NotificationCenter.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useUserTheme } from "../../contexts/UserThemeContext";
import { Bell, X, Check, Archive } from "lucide-react";
import { apiClient } from "../../config/api"; // ✅ IMPORTACIÓN CORRECTA

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  status: "unread" | "read" | "archived";
  type: "info" | "warning" | "error" | "success" | "bet_proposal";
  metadata?: any;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useUserTheme();

  // WebSocket listeners
  const listeners = {
    "notification:new": (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    },
    "notification:update": (updatedNotification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === updatedNotification.id ? updatedNotification : n
        )
      );
    },
  };

  const { isConnected } = useWebSocket(undefined, listeners);

  // ✅ CARGAR NOTIFICACIONES - ENDPOINT CORRECTO
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/notifications"); // ✅ ENDPOINT VÁLIDO
        setNotifications(
          response.data.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp || n.createdAt),
          }))
        );
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // ✅ MARCAR COMO LEÍDA
  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // ✅ ARCHIVAR NOTIFICACIÓN
  const archiveNotification = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/archive`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="relative">
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                    notification.status === "unread" ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {notification.status === "unread" && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Marcar como leída"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => archiveNotification(notification.id)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        title="Archivar"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
