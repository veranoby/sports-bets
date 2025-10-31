// frontend/src/pages/admin/Venues.tsx
// 🏟️ GESTIÓN VENUES - Página dedicada para admin
// Muestra usuarios con rol "venue" y sus entidades de venue asociadas

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
import EditVenueGalleraModal from "../../components/admin/EditVenueGalleraModal";
import CreateUserModal from "../../components/admin/CreateUserModal"; // Import universal create modal

// APIs
import { userAPI } from "../../services/api";

// Tipos
import type { User as UserType } from "../../types";

interface CombinedVenueData {
  user: UserType;
}

const AdminVenuesPage: React.FC = () => {
  // Estados
  const navigate = useNavigate();
  const location = useLocation();
  const [combinedData, setCombinedData] = useState<CombinedVenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [venueStatus, setVenueStatus] = useState<string>(
    new URLSearchParams(location.search).get("status") || "all",
  );
  const [ownerApproved, setOwnerApproved] = useState<string>(
    new URLSearchParams(location.search).get("ownerApproved") || "all",
  );
  const [ownerSubscription, setOwnerSubscription] = useState<string>(
    new URLSearchParams(location.search).get("subscription") || "all",
  );

  // Estado para modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch de datos combinados
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 1000,
        role: "venue",
      };
      if (venueStatus !== "all") {
        params.status = venueStatus;
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

      const res = await userAPI.getAll(params);
      if (res.success) {
        const users = (res.data as any)?.users || [];
        const data = users.map((user: UserType) => ({
          user: user,
        }));
        setCombinedData(data || []);
      } else {
        throw new Error(res.error || "Failed to load venues");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [venueStatus, ownerApproved, ownerSubscription, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (venueStatus !== "all") {
      params.set("status", venueStatus);
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
    venueStatus,
    ownerApproved,
    ownerSubscription,
    navigate,
    location.search,
  ]);

  // Filtrado por búsqueda
  const filteredData = useMemo(
    () =>
      combinedData.filter(
        ({ user }) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email &&
            user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          ((user.profileInfo as any)?.venueName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [combinedData, searchTerm],
  );

  // Estado para modal de edición dual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<CombinedVenueData | null>(
    null,
  );

  // Handlers para edición dual
  const handleEdit = (userId: string) => {
    const userData = combinedData.find((item) => item.user.id === userId);
    if (userData) {
      setEditingData(userData);
      setIsEditModalOpen(true);
    }
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
    return <LoadingSpinner text="Cargando venues..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Venues
          </h1>
          <p className="text-gray-600">
            {combinedData.length} venues registradas
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Venue
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
              placeholder="Buscar por usuario, email o nombre de la venue..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={venueStatus}
            onChange={(e) => setVenueStatus(e.target.value)}
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

        {/* Grid de Venues */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(({ user }) => {
            const profile = user.profileInfo || {};
            const venueName = (profile as any).venueName || user.username;
            const venueLocation = (profile as any).venueLocation || "Ubicación no especificada";
            const venueStatus = user.isActive && user.approved ? "active" : user.isActive && !user.approved ? "pending" : "inactive";

            return (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {venueName}
                  </h3>
                  <StatusChip status={venueStatus} size="sm" />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{venueLocation}</span>
                </div>

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
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
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
              </div>
            </div>
            );
          })}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">No se encontraron venues</h3>
            <p className="text-sm">
              No hay venues que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </Card>

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <CreateUserModal
          role="venue"
          onClose={handleCloseCreateModal}
          onUserCreated={handleUserCreated}
        />
      )}

      {/* Modal de Edición Unificado */}
      {isEditModalOpen && editingData && (
        <EditVenueGalleraModal
          user={editingData.user}
          role="venue"
          onClose={handleCloseModal}
          onSaved={handleSave}
        />
      )}
    </div>
  );
};

export default AdminVenuesPage;
