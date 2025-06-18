import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useUserTheme } from "../../contexts/UserThemeContext";
import Card from "./Card";
import StatusChip from "./StatusChip";
import { Bell } from "lucide-react";
import { useApi } from "../../hooks/useApi";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  status: "unread" | "read" | "archived";
  type: "info" | "warning" | "error" | "success";
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useUserTheme();
  const { get } = useApi().useAuth();

  // Configurar listeners para WebSocket
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

  const { socket, isConnected } = useWebSocket(undefined, listeners);

  // Cargar notificaciones reales desde la API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await get("/notifications");
        if (response.data) {
          setNotifications(
            response.data.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [get]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
    );
    if (socket && isConnected) {
      socket.emit("notification:markAsRead", id);
    }
  };

  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "archived" } : n))
    );
    if (socket && isConnected) {
      socket.emit("notification:archive", id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full bg-${colors.primary} hover:bg-${colors.accent} text-white relative`}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {notifications.some((n) => n.status === "unread") && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <Card
            className={`fixed md:absolute right-0 mt-2 w-full max-w-xs sm:w-80 max-h-[calc(100vh-120px)] md:max-h-96 overflow-y-auto z-50 backdrop-blur-lg bg-${colors.background.card} border border-${colors.primary} rounded-lg`}
          >
            <h3
              className={`text-lg font-semibold mb-4 px-4 pt-4 text-${colors.text.primary}`}
            >
              Notificaciones
            </h3>
            {notifications.length === 0 ? (
              <p
                className={`text-gray-400 px-4 pb-4 text-${colors.text.light}`}
              >
                No hay notificaciones.
              </p>
            ) : (
              <ul className="space-y-3 px-4 pb-4">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-3 rounded-lg ${
                      notification.status === "unread"
                        ? `bg-${colors.status.success}/20`
                        : `bg-${colors.background.card}`
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4
                          className={`font-medium text-${colors.text.primary}`}
                        >
                          {notification.title}
                        </h4>
                        <p className={`text-sm text-${colors.text.secondary}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs text-${colors.text.light} mt-1`}>
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <StatusChip status={notification.type} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`text-xs text-${colors.status.info} hover:underline`}
                      >
                        Marcar como leído
                      </button>
                      <button
                        onClick={() => archiveNotification(notification.id)}
                        className={`text-xs text-${colors.text.light} hover:underline`}
                      >
                        Archivar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
