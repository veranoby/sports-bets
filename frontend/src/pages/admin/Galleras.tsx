// frontend/src/pages/admin/Galleras.tsx
// 🐓 GESTIÓN GALLERAS - Página dedicada para admin
// Muestra usuarios con rol "gallera" y sus entidades de gallera asociadas

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
} from "lucide-react";

// Componentes
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import UserProfileForm from "../../components/forms/UserProfileForm";
import GalleraEntityForm from "../../components/forms/GalleraEntityForm";

// APIs
import { usersAPI, gallerasAPI } from "../../config/api";

// Tipos
import { User as UserType, Gallera as GalleraType } from "../../types";

interface CombinedGalleraData {
  user: UserType;
  gallera?: GalleraType;
}

const AdminGallerasPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados
  const [combinedData, setCombinedData] = useState<CombinedGalleraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch de datos combinados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, gallerasRes] = await Promise.all([
        usersAPI.getAll({ role: "gallera", limit: 1000 }),
        gallerasAPI.getAll({ limit: 1000 }),
      ]);

      const galleraUsers = usersRes.data?.users || [];
      const allGalleras = gallerasRes.data?.galleras || [];

      const gallerasByOwner = new Map<string, GalleraType>();
      allGalleras.forEach((gallera) => {
        if (gallera.owner_id) {
          gallerasByOwner.set(gallera.owner_id, gallera);
        }
      });

      const combined = galleraUsers.map((user) => ({
        user,
        gallera: gallerasByOwner.get(user.id),
      }));

      setCombinedData(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading gallera data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrado por búsqueda
  const filteredData = useMemo(() =>
    combinedData.filter(
      ({ user, gallera }) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (gallera && gallera.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [combinedData, searchTerm]
  );

  // Estado para modal de edición dual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<{ user: UserType; gallera?: GalleraType } | null>(null);

  // Handlers para edición dual
  const handleEdit = (userId: string, galleraId?: string) => {
    const userData = combinedData.find(item => item.user.id === userId);
    if (userData) {
      setEditingData({ user: userData.user, gallera: userData.gallera });
      setIsEditModalOpen(true);
    }
  };

  const handleCreate = () => {
    alert("TODO: Abrir modal para crear nueva gallera y usuario asociado");
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Gallera
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
              placeholder="Buscar por usuario, email o nombre de la gallera..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de Galleras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(({ user, gallera }) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col justify-between">
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
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Propietario</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{user.username}</span>
                    <StatusChip status={user.is_active ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                 <button
                    onClick={() => handleEdit(user.id, gallera?.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">No se encontraron galleras</h3>
            <p className="text-sm">No hay galleras que coincidan con la búsqueda.</p>
          </div>
        )}
      </Card>

      {/* Modal de Edición Dual */}
      {isEditModalOpen && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Gallera Profile & Entity
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* User Profile Form */}
              <UserProfileForm
                user={editingData.user}
                onSave={(userData) => console.log('User saved:', userData)}
                onCancel={() => {}}
                showRoleChange={true}
              />
              
              {/* Gallera Entity Form */}
              <GalleraEntityForm
                gallera={editingData.gallera}
                userId={editingData.user.id}
                onSave={(galleraData) => console.log('Gallera saved:', galleraData)}
                onCancel={() => {}}
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallerasPage;