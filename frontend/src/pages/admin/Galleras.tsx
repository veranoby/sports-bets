// frontend/src/pages/admin/Galleras.tsx
// 🐓 GESTIÓN GALLERAS - Página dedicada para admin
// Muestra usuarios con rol "gallera" y sus entidades de gallera asociadas

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Edit,
  User,
  Mail,
  MapPin,
  Trash2,
} from "lucide-react";

// Componentes
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import CreateUserModal from "../../components/admin/CreateUserModal"; // Import universal create modal
import EditVenueGalleraModal from "../../components/admin/EditVenueGalleraModal"; // Import unified edit modal

// APIs
import { gallerasAPI, usersAPI, userAPI } from "../../services/api";

// Tipos
import type { User as UserType, Gallera as GalleraType } from "../../types";

interface CombinedGalleraData {
  user: UserType;
  gallera?: GalleraType;
}

const AdminGallerasPage: React.FC = () => {
  // Estados
  const navigate = useNavigate();
  const location = useLocation();
  const [combinedData, setCombinedData] = useState<CombinedGalleraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [galleraStatus, setGalleraStatus] = useState<string>(
    new URLSearchParams(location.search).get("status") || "all",
  );
  const [ownerApproved, setOwnerApproved] = useState<string>(
    new URLSearchParams(location.search).get("ownerApproved") || "all",
  );
  const [ownerSubscription, setOwnerSubscription] = useState<string>(
    new URLSearchParams(location.search).get("subscription") || "all",
  );

  // Fetch de datos combinados
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 1000,
        role: 'gallera'
      };
      if (galleraStatus !== "all") {
        params.status = galleraStatus;
      }
      if (ownerApproved !== "all") {
        params.ownerApproved = ownerApproved === "approved";
      }
      if (ownerSubscription !== "all") {
        params.ownerSubscription = ownerSubscription;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const res = await usersAPI.getAll(params);
      if (res.success) {
        const users = (res.data as any)?.users || [];
        const data = users.map((user: UserType) => ({
          user: user,
          gallera: user.galleras?.[0],
        }));
        setCombinedData(data || []);
      } else {
        throw new Error(res.error || "Failed to load galleras");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [galleraStatus, ownerApproved, ownerSubscription, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (galleraStatus !== "all") {
      params.set("status", galleraStatus);
    } else {
      params.delete("status");
    }

    if (ownerApproved !== "all") {
      params.set("ownerApproved", ownerApproved);
    } else {
      params.delete("ownerApproved");
    }

    if (ownerSubscription !== "all") {
      params.set("subscription", ownerSubscription);
    } else {
      params.delete("subscription");
    }

    const newSearch = params.toString();
    if (newSearch !== new URLSearchParams(location.search).toString()) {
      navigate(`?${newSearch}`, { replace: true });
    }
  }, [
    galleraStatus,
    ownerApproved,
    ownerSubscription,
    navigate,
    location.search,
  ]);

  // Filtrado por búsqueda
  const filteredData = useMemo(
    () =>
      combinedData.filter(
        ({ user, gallera }) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email &&
            user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (gallera &&
            gallera.name.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [combinedData, searchTerm],
  );

  // Estado para modal de edición dual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<CombinedGalleraData | null>(
    null,
  );

  // Estado para modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Handlers para edición dual
  const handleEdit = (userId: string) => {
    const userData = combinedData.find((item) => item.user.id === userId);
    if (userData) {
      setEditingData(userData);
      setIsEditModalOpen(true);
    }
  };

  // Handler para suspensión/activación
  const handleToggleStatus = async (
    galleraId?: string,
    currentStatus?: string,
  ) => {
    if (!galleraId) {
      setError("No hay gallera asociada para actualizar.");
      return;
    }

    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const actionMessage =
      currentStatus === "suspended" ? "reactivar" : "desactivar";

    if (
      !window.confirm(
        `¿Estás seguro de que quieres ${actionMessage} esta gallera?`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      const galleraRes = await gallerasAPI.updateStatus(galleraId, newStatus);
      if (!galleraRes.success) {
        setError(galleraRes.error || `Error al ${actionMessage} la gallera`);
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Error al ${actionMessage} la gallera`,
      );
      return;
    }

    // Actualizar la lista
    fetchData();
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleUserCreated = () => {
    fetchData(); // Refresh data
    handleCloseCreateModal(); // Close the modal
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingData(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchData(); // Refresh data
  };

  if (loading) {
    return <LoadingSpinner text="Cargando galleras..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Galleras
          </h1>
          <p className="text-gray-600">
            {combinedData.length} galleras registradas
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Gallera
        </button>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchData} className="mb-6" />
      )}

      <Card className="p-6">
        {/* Barra de filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por usuario, email o nombre de la gallera..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={galleraStatus}
            onChange={(e) => setGalleraStatus(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="suspended">Suspendido</option>
          </select>

          <select
            value={ownerApproved}
            onChange={(e) => setOwnerApproved(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todos los propietarios</option>
            <option value="approved">Propietario aprobado</option>
            <option value="pending">Propietario pendiente</option>
          </select>

          <select
            value={ownerSubscription}
            onChange={(e) => setOwnerSubscription(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todas las suscripciones</option>
            <option value="free">Gratis</option>
            <option value="daily">24h (Diaria)</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        {/* Grid de Galleras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(({ user, gallera }) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {gallera ? gallera.name : "Gallera no asignada"}
                  </h3>
                  {gallera && <StatusChip status={gallera.status} size="sm" />}
                </div>

                {gallera && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{gallera.location}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 mt-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
                    Propietario
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Membresía expira:</span>{" "}
                    {user.subscription?.manual_expires_at
                      ? new Date(
                          user.subscription.manual_expires_at,
                        ).toLocaleDateString("es-ES")
                      : "Gratuita"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => handleEdit(user.id)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                {gallera && gallera.status === "active" ? (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Estás seguro de que quieres desactivar la gallera "${gallera.name}"?`,
                        )
                      ) {
                        gallerasAPI.updateStatus(gallera.id, "suspended");
                      }
                    }}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                    Desactivar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Estás seguro de que quieres activar al usuario "${user.username}"?`,
                          )
                        ) {
                          usersAPI.updateStatus(user.id, true);
                        }
                      }}
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
                    >
                      <Trash2 className="w-4 h-4" />
                      Activar
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Estás seguro de que quieres eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`,
                          )
                        ) {
                          userAPI.delete(user.id);
                        }
                      }}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">
              No se encontraron galleras
            </h3>
            <p className="text-sm">
              No hay galleras que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </Card>

      {/* Modal de Edición con Pestañas */}
      {isEditModalOpen && editingData && (
        <EditVenueGalleraModal
          user={editingData.user}
          venue={editingData.gallera}
          role="gallera"
          onClose={handleCloseModal}
          onSaved={handleSave}
        />
      )}

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <CreateUserModal
          role="gallera"
          onClose={handleCloseCreateModal}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};

export default AdminGallerasPage;
