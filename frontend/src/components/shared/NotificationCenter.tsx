import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import Card from "./Card";
import StatusChip from "./StatusChip";

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
  const theme = getUserThemeClasses();

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

  // Cargar notificaciones iniciales (simulado)
  useEffect(() => {
    // Simular carga inicial de notificaciones
    const initialNotifications: Notification[] = [
      {
        id: "1",
        title: "Bienvenido",
        message: "Tu cuenta ha sido creada exitosamente.",
        timestamp: new Date(),
        status: "unread",
        type: "info",
      },
    ];
    setNotifications(initialNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
    );
    // Emitir evento al servidor para actualizar el estado (simulado)
    if (socket && isConnected) {
      socket.emit("notification:markAsRead", id);
    }
  };

  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "archived" } : n))
    );
    // Emitir evento al servidor para archivar (simulado)
    if (socket && isConnected) {
      socket.emit("notification:archive", id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full ${theme.buttonPrimary}`}
      >
        <span className="relative">
          🔔
          {notifications.some((n) => n.status === "unread") && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </span>
      </button>

      {isOpen && (
        <Card
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50"
          variant="default"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Notificaciones</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-400">No hay notificaciones.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-3 rounded-lg ${
                      notification.status === "unread"
                        ? "bg-blue-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <StatusChip status={notification.type} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Marcar como leído
                      </button>
                      <button
                        onClick={() => archiveNotification(notification.id)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Archivar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenter;
