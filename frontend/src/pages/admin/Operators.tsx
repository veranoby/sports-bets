import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users as UsersIcon,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";

// APIs
import { usersAPI, eventsAPI } from "../../config/api";

// Añadir interfaz para métricas
interface OperatorMetrics {
  eventsManaged: number;
  avgRating?: number;
  disputesResolved: number;
}

interface Operator {
  id: string;
  username: string;
  email: string;
  status: "active" | "inactive";
  lastActive?: string;
  assignedEvent?: {
    id: string;
    name: string;
    startTime: string;
  };
}

const AdminOperatorsPage: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "assigned"
  >("all");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );
  const [availableOperators, setAvailableOperators] = useState<Operator[]>([]);
  const [operatorMetrics, setOperatorMetrics] = useState<
    Record<string, OperatorMetrics>
  >({});

  // Modal de asignación rápida
  const [assignmentModal, setAssignmentModal] = useState<{
    operatorId: string | null;
  }>({ operatorId: null });

  // Fetch operadores
  const fetchOperators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({ role: "operator" });
      setOperators(response.data?.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading operators");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch operadores disponibles
  const fetchAvailableOperators = useCallback(async () => {
    const response = await usersAPI.getAvailableOperators();
    setAvailableOperators(response.data || []);
  }, []);

  // Fetch operadores asignados
  const fetchAssignedEvents = useCallback(async (operatorId: string) => {
    const response = await eventsAPI.getAll({ operatorId });
    return response.data?.events || [];
  }, []);

  // Función para obtener métricas
  const fetchOperatorMetrics = useCallback(async (operatorId: string) => {
    const response = await usersAPI.getOperatorMetrics(operatorId);
    setOperatorMetrics((prev) => ({ ...prev, [operatorId]: response.data }));
  }, []);

  // Filtrado
  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      if (availabilityFilter === "available") return !op.assignedEvent;
      if (availabilityFilter === "assigned") return op.assignedEvent;
      return true;
    });
  }, [operators, availabilityFilter]);

  // Toggle estado
  const toggleOperatorStatus = async (
    operatorId: string,
    isActive: boolean
  ) => {
    try {
      await usersAPI.updateStatus(operatorId, isActive ? "active" : "inactive");
      setOperators((ops) =>
        ops.map((op) =>
          op.id === operatorId
            ? { ...op, status: isActive ? "active" : "inactive" }
            : op
        )
      );
    } catch (err) {
      setError("Failed to update operator status");
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchOperators();
    fetchAvailableOperators();
  }, [fetchOperators, fetchAvailableOperators]);

  if (loading) return <LoadingSpinner text="Cargando operadores..." />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Operadores
        </h1>
        <p className="text-gray-600">{operators.length} operadores totales</p>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchOperators} />}

      {/* Sección 1: Filtros y herramientas */}
      <Card className="mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <button onClick={() => setAvailabilityFilter("all")}>Todos</button>
            <button onClick={() => setAvailabilityFilter("available")}>
              Disponibles
            </button>
            <button onClick={() => setAvailabilityFilter("assigned")}>
              Asignados
            </button>
          </div>
          <button
            onClick={() => navigate("/admin/operators/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Operador
          </button>
        </div>
      </Card>

      {/* Sección 2: Operadores disponibles */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Operadores Disponibles (
          {filteredOperators.filter((op) => !op.assignedEvent).length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOperators
            .filter((op) => !op.assignedEvent)
            .map((op) => (
              <div
                key={op.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{op.username}</p>
                    <p className="text-sm text-gray-600">{op.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusChip status={op.status} size="sm" />
                  <button
                    onClick={() => setAssignmentModal({ operatorId: op.id })}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Asignar Evento
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Sección 3: Operadores asignados */}
      <Card className="mb-6 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Operadores Asignados (
          {filteredOperators.filter((op) => op.assignedEvent).length})
        </h2>
        <div className="space-y-4">
          {filteredOperators
            .filter((op) => op.assignedEvent)
            .map((op) => (
              <div
                key={op.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{op.username}</p>
                      <p className="text-sm text-gray-600">{op.email}</p>
                    </div>
                  </div>
                  <StatusChip status={op.status} size="sm" />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">Evento asignado:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{op.assignedEvent?.name}</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(
                        op.assignedEvent?.startTime || ""
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Modal Detalle (similar a Users.tsx) */}
      {selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h3>Eventos Asignados</h3>
              {selectedOperator.assignedEvent ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedOperator.assignedEvent.name}</span>
                </div>
              ) : (
                <p>Sin eventos asignados</p>
              )}
              <h3 className="mt-4">Métricas</h3>
              {operatorMetrics[selectedOperator.id] ? (
                <div className="grid grid-cols-3 gap-4">
                  <Card
                    title="Eventos"
                    value={operatorMetrics[selectedOperator.id].eventsManaged}
                  />
                  <Card
                    title="Rating"
                    value={
                      operatorMetrics[selectedOperator.id].avgRating || "N/A"
                    }
                  />
                  <Card
                    title="Disputas"
                    value={
                      operatorMetrics[selectedOperator.id].disputesResolved
                    }
                  />
                </div>
              ) : (
                <LoadingSpinner text="Cargando métricas..." />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOperatorsPage;
