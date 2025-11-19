// frontend/src/pages/admin/Operators.tsx
// 🧑‍🔧 GESTIÓN OPERADORES - Página dedicada para admin
// Muestra todos los usuarios con rol "operator"

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import UserModal from "../../components/admin/UserModal";

// APIs
import { usersAPI } from "../../services/api";

// Tipos
import type { User } from "../../types";

const AdminOperatorsPage: React.FC = () => {
  // Estados
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // State for unified modal
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit" | null;
    user?: User;
  }>({ mode: null });

  // Fetch de operadores
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await usersAPI.getAll({ role: "operator", limit: 1000 });
    console.log("API Response for operators:", res); // Debug log
    console.log("Users data from API:", (res.data as any)?.users); // Debug log
    if (res.success) {
      setOperators((res.data as any)?.users || []);
    } else {
      setError(res.error || "Error loading operators");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  // Abrir modal de edición
  const handleEditOperator = (operator: User) => {
    setModalState({ mode: "edit", user: operator });
  };

  // Cerrar modales
  const closeModals = () => {
    setModalState({ mode: null });
  };

  // Filtrar operadores por término de búsqueda
  const filteredOperators = operators.filter(
    (op) =>
      op &&
      op.username &&
      typeof op.username === "string" &&
      (op.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) return <LoadingSpinner text="Cargando operadores..." />;
  if (error) return <ErrorMessage error={error} onRetry={fetchOperators} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Operadores
            </h1>
            <button
              onClick={() => setModalState({ mode: "create", user: undefined })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear Operador
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de operadores */}
        <Card className="p-6">
          {filteredOperators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron operadores</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOperators.map((operator) => (
                <div
                  key={operator.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {operator.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {operator.username || "Unknown Operator"}
                      </h3>
                      <p className="text-sm text-gray-500">{operator.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusChip
                      status={operator.isActive ? "active" : "inactive"}
                    />
                    <button
                      onClick={() => handleEditOperator(operator)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats Card */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {operators.length}
              </p>
              <p className="text-sm text-gray-500">Total Operadores</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {operators.filter((op) => op.isActive).length}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {operators.filter((op) => !op.isActive).length}
              </p>
              <p className="text-sm text-gray-500">Inactivos</p>
            </div>
          </Card>
        </div>
      </div>

      {/* User Modal (Unified Create/Edit) */}
      {modalState.mode && (
        <UserModal
          mode={modalState.mode}
          role="operator"
          user={modalState.user}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            fetchOperators();
          }}
        />
      )}
    </div>
  );
};

export default AdminOperatorsPage;
