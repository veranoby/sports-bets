// frontend/src/pages/admin/Operators.tsx
// 🧑‍🔧 GESTIÓN OPERADORES - Página dedicada para admin
// Muestra todos los usuarios con rol "operator"

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import EditOperatorModal from "../../components/admin/EditOperatorModal";
import CreateUserModal from "../../components/admin/CreateUserModal"; // Import universal create modal

// APIs
import { usersAPI } from "../../config/api";

// Tipos
import type { User } from "../../types";

const AdminOperatorsPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // New state for create modal

  // Fetch de operadores
  const fetchOperators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await usersAPI.getAll({ role: "operator", limit: 1000 });
      console.log("API Response for operators:", res); // Debug log
      console.log("Users data from API:", res.data?.users); // Debug log
      setOperators(res.data?.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading operators");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  // Filtrado por búsqueda
  const filteredOperators = operators.filter(
    (op) =>
      op.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.email && op.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers for edit modal
  const handleEditOperator = (operator: User) => {
    setEditingOperator(operator);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingOperator(null);
  };

  const handleOperatorUpdated = (updatedOperator: User) => {
    setOperators(operators.map(op => op.id === updatedOperator.id ? updatedOperator : op));
    handleCloseEditModal();
  };

  // Handlers for create modal
  const handleCreateOperator = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleOperatorCreated = () => {
    fetchOperators(); // Re-fetch the list to include the new operator
    handleCloseCreateModal(); // Close the modal
  };

  // Handler for delete operator
  const handleDeleteOperator = (operator: User) => {
    if (window.confirm(`¿Está seguro que desea eliminar al operador ${operator.username}? Esta acción no se puede deshacer.`)) {
      // TODO: Implementar la eliminación del operador
      console.log("Eliminar operador:", operator.id);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando operadores..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Operadores
          </h1>
          <p className="text-gray-600">
            {operators.length} operadores registrados
          </p>
        </div>
        <button
          onClick={handleCreateOperator}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Operador
        </button>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchOperators} className="mb-6" />
      )}

      <Card className="p-6">
        {/* Barra de búsqueda */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de Operadores */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre de Usuario
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Miembro Desde
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOperators.map((operator) => (
                <tr key={operator.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {operator.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {operator.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusChip
                      status={operator.is_active ? "active" : "inactive"}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(operator.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                    <button
                      onClick={() => handleEditOperator(operator)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteOperator(operator)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOperators.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron operadores.
          </div>
        )}
      </Card>
      
      {isEditModalOpen && editingOperator && (
        <EditOperatorModal 
          operator={editingOperator}
          onClose={handleCloseEditModal}
          onOperatorUpdated={handleOperatorUpdated}
        />
      )}

      {isCreateModalOpen && (
        <CreateUserModal
          role="operator"
          onClose={handleCloseCreateModal}
          onUserCreated={handleOperatorCreated}
        />
      )}
    </div>
  );
};

export default AdminOperatorsPage;
