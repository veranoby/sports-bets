import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  Clock,
  Eye,
  Trash2,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { notificationsAPI } from "../../services/api";
import type { Notification } from "../../types";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import Card from "../../components/shared/Card";

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // States para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<
    Partial<Notification>
  >({});

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Estado para operaciones en progreso
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || notification.status === statusFilter;

    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationsAPI.getAll({
        limit: 100,
        includeCreatedBy: true,
      });

      setNotifications((response.data as any)?.notifications || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading notifications",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar notificación
  const sendNotification = async (notificationData: Partial<Notification>) => {
    try {
      setOperationInProgress("sending");

      await notificationsAPI.create({
        title: notificationData.title || "",
        message: notificationData.message || "",
        type: notificationData.type || "",
        userId: notificationData.userId,
      });

      setSuccessMsg("Notificación enviada exitosamente");
      setIsCreateModalOpen(false);
      setCurrentNotification({});

      // Recargar lista
      fetchNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error sending notification",
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Programar notificación
  const scheduleNotification = async (
    notificationData: Partial<Notification>,
  ) => {
    try {
      setOperationInProgress("scheduling");

      await notificationsAPI.create({
        title: notificationData.title || "",
        message: notificationData.message || "",
        type: notificationData.type || "",
        userId: notificationData.userId,
      });

      setSuccessMsg("Notificación programada exitosamente");
      setIsCreateModalOpen(false);
      setCurrentNotification({});

      // Recargar lista
      fetchNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error scheduling notification",
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta notificación?")) return;

    try {
      setOperationInProgress("deleting");
      await notificationsAPI.delete(id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSuccessMsg("Notificación eliminada exitosamente");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error deleting notification",
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Marcar como leída
  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error marking as read");
    }
  };

  // Obtener estadísticas
  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.readAt).length;
    const sent = notifications.filter((n) => n.status === "sent").length;
    const scheduled = notifications.filter(
      (n) => n.status === "scheduled",
    ).length;

    return { total, unread, sent, scheduled };
  };

  const stats = getStats();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Limpiar mensajes de éxito después de 3 segundos
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600">
            Gestiona las notificaciones del sistema
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Notificación
        </button>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} />}
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">No Leídas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.scheduled}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="sent">Enviadas</option>
            <option value="scheduled">Programadas</option>
            <option value="failed">Fallidas</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="general">General</option>
            <option value="event">Evento</option>
            <option value="bet">Apuesta</option>
            <option value="system">Sistema</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredNotifications.length} de {notifications.length}{" "}
          notificaciones
        </div>
      </Card>

      {/* Notifications List */}
      <Card>
        <div className="overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-12 h-12 text-gray-400" />}
              title="No hay notificaciones"
              description="No se encontraron notificaciones que coincidan con los filtros."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notificación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <tr
                      key={notification.id}
                      className={`hover:bg-gray-50 ${
                        !notification.readAt ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {notification.type === "event" && (
                              <Bell className="w-5 h-5 text-blue-500 mt-1" />
                            )}
                            {notification.type === "general" && (
                              <AlertCircle className="w-5 h-5 text-green-500 mt-1" />
                            )}
                            {notification.type === "bet" && (
                              <UserCheck className="w-5 h-5 text-purple-500 mt-1" />
                            )}
                            {notification.type === "system" && (
                              <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            notification.type === "event"
                              ? "bg-blue-100 text-blue-800"
                              : notification.type === "general"
                                ? "bg-green-100 text-green-800"
                                : notification.type === "bet"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            notification.status === "sent"
                              ? "bg-green-100 text-green-800"
                              : notification.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {notification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setCurrentNotification(notification);
                              setIsDetailModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!notification.readAt && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={operationInProgress === "deleting"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Create Notification Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Notificación"
      >
        <CreateNotificationForm
          onSend={sendNotification}
          onSchedule={scheduleNotification}
          onCancel={() => setIsCreateModalOpen(false)}
          loading={operationInProgress !== null}
        />
      </Modal>

      {/* Notification Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalle de Notificación"
      >
        <NotificationDetail notification={currentNotification} />
      </Modal>
    </div>
  );
};

// Componente para crear notificación
const CreateNotificationForm: React.FC<{
  onSend: (data: Partial<Notification>) => void;
  onSchedule: (data: Partial<Notification>) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ onSend, onSchedule, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    userId: "",
    scheduledFor: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido";
    }

    if (!formData.message.trim()) {
      newErrors.message = "El mensaje es requerido";
    }

    if (!formData.type) {
      newErrors.type = "El tipo es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent, action: "send" | "schedule") => {
    e.preventDefault();

    if (!validateForm()) return;

    const notificationData = {
      title: formData.title,
      message: formData.message,
      type: formData.type as "bet" | "general" | "event" | "system",
      userId: formData.userId || undefined,
      scheduledFor: formData.scheduledFor || undefined,
    };

    if (action === "send") {
      onSend(notificationData);
    } else {
      onSchedule(notificationData);
    }
  };

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mensaje *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.message ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.message && (
          <p className="text-red-500 text-sm mt-1">{errors.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="general">General</option>
          <option value="event">Evento</option>
          <option value="bet">Apuesta</option>
          <option value="system">Sistema</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Usuario Específico (opcional)
        </label>
        <input
          type="text"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          placeholder="ID del usuario"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Programar para (opcional)
        </label>
        <input
          type="datetime-local"
          value={formData.scheduledFor}
          onChange={(e) =>
            setFormData({ ...formData, scheduledFor: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={(e) => handleSubmit(e, "schedule")}
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? "Programando..." : "Programar"}
        </button>
        <button
          onClick={(e) => handleSubmit(e, "send")}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar Ahora"}
        </button>
      </div>
    </form>
  );
};

// Componente para mostrar detalle de notificación
const NotificationDetail: React.FC<{
  notification: Partial<Notification>;
}> = ({ notification }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {notification.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {notification.createdAt &&
            new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Mensaje</h4>
        <p className="text-gray-900">{notification.message}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Tipo</h4>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              notification.type === "event"
                ? "bg-blue-100 text-blue-800"
                : notification.type === "general"
                  ? "bg-green-100 text-green-800"
                  : notification.type === "bet"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-red-100 text-red-800"
            }`}
          >
            {notification.type}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Estado</h4>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              notification.status === "sent"
                ? "bg-green-100 text-green-800"
                : notification.status === "scheduled"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {notification.status}
          </span>
        </div>
      </div>

      {notification.readAt && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Leída el</h4>
          <p className="text-gray-900">
            {new Date(notification.readAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
