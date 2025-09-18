// frontend/src/pages/admin/Venues.tsx
// 🏟️ GESTIÓN VENUES - Página dedicada para admin
// Muestra usuarios con rol "venue" y sus entidades de venue asociadas

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { usersAPI, venuesAPI } from "../../services/api";

// Tipos
import type { User as UserType, Venue as VenueType } from "../../types";

interface CombinedVenueData {
  user: UserType;
  venue?: VenueType;
}

const AdminVenuesPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados
  const [combinedData, setCombinedData] = useState<CombinedVenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para modal de creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch de datos combinados
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const usersRes = await usersAPI.getAll({ role: "venue", limit: 1000 });
    const venuesRes = await venuesAPI.getAll({ limit: 1000 });

    if (usersRes.success && venuesRes.success) {
      const venueUsers = usersRes.data?.users || [];
      const allVenues = venuesRes.data?.venues || [];

      const venuesByOwner = new Map<string, VenueType>();
      allVenues.forEach((venue) => {
        if (venue.owner_id) {
          venuesByOwner.set(venue.owner_id, venue);
        }
      });

      const combined = venueUsers.map((user) => ({
        user,
        venue: venuesByOwner.get(user.id),
      }));

      setCombinedData(combined);
    } else {
      setError(usersRes.error || venuesRes.error || "Error loading venue data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrado por búsqueda
  const filteredData = useMemo(() =>
    combinedData.filter(
      ({ user, venue }) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (venue && venue.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [combinedData, searchTerm]
  );

  // Estado para modal de edición dual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<{ user: UserType; venue?: VenueType } | null>(null);

  // Handlers para edición dual
  const handleEdit = (userId: string, venueId?: string) => {
    const userData = combinedData.find(item => item.user.id === userId);
    if (userData) {
      setEditingData({ user: userData.user, venue: userData.venue });
      setIsEditModalOpen(true);
    }
  };

  // Handler para eliminación
  const handleDelete = async (userId: string, venueId?: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este venue? Esta acción no se puede deshacer.')) {
      return;
    }

    setError(null);
    
    // Si hay venue asociado, eliminarlo primero
    if (venueId) {
      const venueRes = await venuesAPI.delete(venueId);
      if (!venueRes.success) {
        setError(venueRes.error || 'Error eliminando venue');
        return;
      }
    }
    
    // Eliminar el usuario
    const userRes = await usersAPI.delete(userId);
    if (!userRes.success) {
      setError(userRes.error || 'Error eliminando usuario');
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Venue
        </button>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchData} className="mb-6" />
      )}

      <Card className="p-6">
        {/* Barra de búsqueda */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por usuario, email o nombre de la venue..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de Venues */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(({ user, venue }) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {venue ? venue.name : "Venue no asignada"}
                  </h3>
                  {venue && <StatusChip status={venue.status} size="sm" />}
                </div>

                {venue && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{venue.location}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 mt-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Propietario</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{user.username}</span>
                    <StatusChip status={user.isActive ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                 <button
                    onClick={() => handleEdit(user.id, venue?.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, venue?.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">No se encontraron venues</h3>
            <p className="text-sm">No hay venues que coincidan con la búsqueda.</p>
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
          venue={editingData.venue}
          role="venue"
          onClose={handleCloseModal}
          onSaved={handleSave}
        />
      )}
    </div>
  );
};

export default AdminVenuesPage;