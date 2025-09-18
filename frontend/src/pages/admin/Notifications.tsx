// frontend/src/pages/admin/Notifications.tsx
// 📢 NOTIFICATIONS ADMIN - Gestión de notificaciones del sistema
// Interfaz para enviar notificaciones del sistema, ver logs y programar anuncios

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";

// APIs
import { notificationsAPI } from "../../services/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success" | "announcement";
  priority: "low" | "medium" | "high" | "urgent";
  status: "draft" | "scheduled" | "sent" | "failed";
  targetUsers?: string[]; // IDs de usuarios específicos
  targetRoles?: string[]; // Roles específicos
  scheduledAt?: string; // Para notificaciones programadas
  sentAt?: string; // Fecha de envío
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
  };
}

const NotificationsAdminPage: React.FC = () => {
  // Estados principales
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados para creación/edición
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Partial<Notification>>({});

  // Estados para filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Estados operativos
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationsAPI.getAll({
        limit: 100,
        includeCreatedBy: true,
      });

      setNotifications(response.data?.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar notificación
  const sendNotification = async (notificationData: Partial<Notification>) => {
    try {
      setOperationInProgress("sending");

      const response = await notificationsAPI.create(notificationData);

      setSuccessMsg("Notificación enviada exitosamente");
      setIsCreateModalOpen(false);
      setCurrentNotification({});
      
      // Recargar lista
      fetchNotifications();
    } catch (err) {
      setError(
        `Error al enviar notificación: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Programar notificación
  const scheduleNotification = async (notificationData: Partial<Notification>) => {
    try {
      setOperationInProgress("scheduling");

      const response = await notificationsAPI.create({
        ...notificationData,
        status: "scheduled"
      });

      setSuccessMsg("Notificación programada exitosamente");
      setIsCreateModalOpen(false);
      setCurrentNotification({});
      
      // Recargar lista
      fetchNotifications();
    } catch (err) {
      setError(
        `Error al programar notificación: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      setOperationInProgress(`delete-${notificationId}`);

      await notificationsAPI.delete(notificationId);

      setSuccessMsg("Notificación eliminada exitosamente");
      
      // Recargar lista
      fetchNotifications();
    } catch (err) {
      setError(
        `Error al eliminar notificación: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!notification.title.toLowerCase().includes(term) && 
          !notification.message.toLowerCase().includes(term)) {
        return false;
      }
    }

    // Filtrar por tipo
    if (typeFilter && notification.type !== typeFilter) {
      return false;
    }

    // Filtrar por estado
    if (statusFilter && notification.status !== statusFilter) {
      return false;
    }

    // Filtrar por prioridad
    if (priorityFilter && notification.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Limpiar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Renderizar ícono según tipo
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "announcement":
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Renderizar etiqueta de estado
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { text: "Borrador", color: "bg-gray-100 text-gray-800" },
      scheduled: { text: "Programada", color: "bg-blue-100 text-blue-800" },
      sent: { text: "Enviada", color: "bg-green-100 text-green-800" },
      failed: { text: "Fallida", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Renderizar etiqueta de prioridad
  const renderPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { text: "Baja", color: "bg-gray-100 text-gray-800" },
      medium: { text: "Media", color: "bg-blue-100 text-blue-800" },
      high: { text: "Alta", color: "bg-orange-100 text-orange-800" },
      urgent: { text: "Urgente", color: "bg-red-100 text-red-800" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchNotifications} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Notificaciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Envía notificaciones del sistema, programa anuncios y monitorea el historial
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Notificación
        </button>
      </div>

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Notificaciones
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {notifications.length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Send className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Enviadas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {notifications.filter(n => n.status === "sent").length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-orange-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Programadas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {notifications.filter(n => n.status === "scheduled").length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Fallidas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {notifications.filter(n => n.status === "failed").length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por título o mensaje"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="info">Info</option>
                <option value="warning">Advertencia</option>
                <option value="error">Error</option>
                <option value="success">Éxito</option>
                <option value="announcement">Anuncio</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="scheduled">Programada</option>
                <option value="sent">Enviada</option>
                <option value="failed">Fallida</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Todas las prioridades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No hay notificaciones"
              description="No se encontraron notificaciones que coincidan con los filtros."
            />
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <li key={notification.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0">
                        {renderTypeIcon(notification.type)}
                      </div>
                      <div className="min-w-0 ml-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          {renderStatusBadge(notification.status)}
                          {renderPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center text-xs text-gray-400 mt-1 space-x-2">
                          <span className="flex items-center">
                            <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {notification.createdBy?.username || "Sistema"}
                          </span>
                          <span className="flex items-center">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.scheduledAt && (
                            <span className="flex items-center">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              Programada: {formatDate(notification.scheduledAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => {
                          setCurrentNotification(notification);
                          setIsEditing(true);
                          setIsCreateModalOpen(true);
                        }}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        disabled={!!operationInProgress}
                        className="inline-flex items-center p-2 border border-transparent rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal para crear/editar notificación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditing(false);
                  setCurrentNotification({});
                }}
              ></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isEditing ? "Editar Notificación" : "Nueva Notificación"}
                  </h3>
                  <div className="mt-4">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        const notificationData = {
                          title: formData.get("title") as string,
                          message: formData.get("message") as string,
                          type: formData.get("type") as Notification["type"],
                          priority: formData.get("priority") as Notification["priority"],
                          targetRoles: formData.getAll("targetRoles") as string[],
                          scheduledAt: formData.get("scheduledAt") as string,
                        };
                        
                        if (isEditing) {
                          // Actualizar notificación existente
                          sendNotification({...currentNotification, ...notificationData});
                        } else {
                          // Crear nueva notificación
                          if (notificationData.scheduledAt) {
                            scheduleNotification(notificationData);
                          } else {
                            sendNotification(notificationData);
                          }
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Título
                        </label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          defaultValue={currentNotification.title || ""}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                          Mensaje
                        </label>
                        <textarea
                          name="message"
                          id="message"
                          rows={3}
                          required
                          defaultValue={currentNotification.message || ""}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Tipo
                          </label>
                          <select
                            name="type"
                            id="type"
                            defaultValue={currentNotification.type || "info"}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="info">Info</option>
                            <option value="warning">Advertencia</option>
                            <option value="error">Error</option>
                            <option value="success">Éxito</option>
                            <option value="announcement">Anuncio</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Prioridad
                          </label>
                          <select
                            name="priority"
                            id="priority"
                            defaultValue={currentNotification.priority || "medium"}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Roles Destino
                        </label>
                        <div className="mt-2 space-y-2">
                          {["admin", "operator", "venue", "user", "gallera"].map((role) => (
                            <div key={role} className="flex items-center">
                              <input
                                id={`targetRoles-${role}`}
                                name="targetRoles"
                                type="checkbox"
                                value={role}
                                defaultChecked={currentNotification.targetRoles?.includes(role)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`targetRoles-${role}`}
                                className="ml-3 block text-sm text-gray-700 capitalize"
                              >
                                {role}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700">
                          Programar para (opcional)
                        </label>
                        <input
                          type="datetime-local"
                          name="scheduledAt"
                          id="scheduledAt"
                          defaultValue={currentNotification.scheduledAt ? 
                            new Date(currentNotification.scheduledAt).toISOString().slice(0, 16) : ""}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={!!operationInProgress}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                        >
                          {operationInProgress ? (
                            <span className="flex items-center">
                              <LoadingSpinner className="h-4 w-4 mr-2" />
                              {isEditing ? "Actualizando..." : "Enviando..."}
                            </span>
                          ) : (
                            isEditing ? "Actualizar" : "Enviar"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            setIsEditing(false);
                            setCurrentNotification({});
                          }}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsAdminPage;