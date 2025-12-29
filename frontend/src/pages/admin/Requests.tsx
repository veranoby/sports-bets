import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Download,
  Upload,
  Banknote,
  RefreshCw,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// APIs
import { walletAPI } from "../../services/api";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "in_process" | "completed" | "rejected" | "failed";
  accountNumber: string;
  accountType?: "checking" | "savings";
  bankName?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  transferProof?: string;
  user: {
    username: string;
    email: string;
    profileInfo?: {
      fullName?: string;
    };
  };
}

interface ProcessRequestPayload {
  status: "in_process" | "rejected" | "completed";
  rejectionReason?: string;
  transferProof?: string;
  processNotes?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isWithdrawalRequest = (value: unknown): value is WithdrawalRequest => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    typeof value.amount === "number" &&
    typeof value.status === "string" &&
    typeof value.accountNumber === "string" &&
    typeof value.requestedAt === "string" &&
    isRecord(value.user) &&
    typeof value.user.username === "string" &&
    typeof value.user.email === "string"
  );
};

const extractWithdrawalRequests = (payload: unknown): WithdrawalRequest[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isWithdrawalRequest);
  }

  if (isRecord(payload)) {
    const maybeRequests = payload["requests"];
    if (Array.isArray(maybeRequests)) {
      return maybeRequests.filter(isWithdrawalRequest);
    }
  }

  return [];
};

const AdminRequestsPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Estados principales
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "new",
  );

  // Estados para procesamiento
  const [processing, setProcessing] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null);
  const [transferProof, setTransferProof] = useState("");
  const [processNotes, setProcessNotes] = useState("");

  // Success/error para UX
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar solicitudes de retiro
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await walletAPI.getWithdrawalRequests({
      includeUser: true,
      limit: 1000,
    });

    if (response.success) {
      setRequests(extractWithdrawalRequests(response.data));
    } else {
      setError(response.error || "Error loading requests");
    }
    setLoading(false);
  }, []);

  // Filtrado por categorías
  const { newRequests, inProcessRequests, filteredRequests } = useMemo(() => {
    const byTerm = requests.filter((request) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.user.username.toLowerCase().includes(searchLower) ||
        request.user.email.toLowerCase().includes(searchLower) ||
        request.accountNumber.includes(searchLower) ||
        request.id.toLowerCase().includes(searchLower)
      );
    });

    const byStatus = byTerm.filter((request) => {
      if (statusFilter === "all") return true;
      return request.status === statusFilter;
    });

    const byCategory = byStatus.filter((request) => {
      switch (selectedCategory) {
        case "new":
          return request.status === "pending";
        case "in_process":
          return request.status === "in_process";
        case "completed":
          return ["completed", "rejected", "failed"].includes(request.status);
        default:
          return true;
      }
    });

    return {
      newRequests: requests.filter((r) => r.status === "pending"),
      inProcessRequests: requests.filter((r) => r.status === "in_process"),
      filteredRequests: byCategory,
    };
  }, [requests, searchTerm, statusFilter, selectedCategory]);

  // Estadísticas
  const totalAmount = filteredRequests.reduce(
    (sum, req) => sum + req.amount,
    0,
  );
  const completedAmount = filteredRequests
    .filter((r) => r.status === "completed")
    .reduce((sum, req) => sum + req.amount, 0);

  // Procesar solicitud
  const processRequest = async (
    requestId: string,
    action: "approve" | "reject" | "complete",
  ) => {
    if (action === "reject" && !processNotes.trim()) {
      setError("Se requiere una razón para el rechazo");
      return;
    }

    if (action === "complete" && !transferProof.trim()) {
      setError("Se requiere comprobante de transferencia");
      return;
    }

    try {
      setProcessing(requestId);

      const payload: ProcessRequestPayload = {
        status:
          action === "approve"
            ? "in_process"
            : action === "reject"
              ? "rejected"
              : "completed",
      };

      if (action === "reject") {
        payload.rejectionReason = processNotes;
      } else if (action === "complete") {
        payload.transferProof = transferProof;
        payload.processNotes = processNotes;
      }

      await walletAPI.processWithdrawalRequest(requestId, {
        action: action === "approve" ? "approve" : "reject",
        reason: action === "reject" ? processNotes : undefined,
      });

      // Actualizar request local
      setRequests(
        requests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: payload.status,
                processedAt: new Date().toISOString(),
                rejectionReason: payload.rejectionReason,
              }
            : r,
        ),
      );

      setSuccessMessage(
        `Solicitud ${action === "approve" ? "aprobada" : action === "reject" ? "rechazada" : "completada"} exitosamente`,
      );
      setShowDetailsModal(null);
      setTransferProof("");
      setProcessNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Error al ${action === "approve" ? "aprobar" : action === "reject" ? "rechazar" : "completar"} solicitud`,
      );
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Limpiar mensajes de éxito/error
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) return <LoadingSpinner />;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_process":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "inline-flex px-2 py-1 text-xs font-medium rounded-full";
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      in_process: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitudes de Retiro
          </h1>
          <p className="text-gray-600">
            Gestiona las solicitudes de retiro de los usuarios
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Mensajes de estado */}
      {error && <ErrorMessage message={error} />}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Nuevas</p>
              <p className="text-2xl font-bold text-gray-900">
                {newRequests.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900">
                {inProcessRequests.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total ($)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Completado ($)
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${completedAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="space-y-4">
          {/* Categorías */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: "new", label: "Nuevas", count: newRequests.length },
              {
                key: "in_process",
                label: "En Proceso",
                count: inProcessRequests.length,
              },
              {
                key: "completed",
                label: "Completadas",
                count: requests.filter((r) =>
                  ["completed", "rejected", "failed"].includes(r.status),
                ).length,
              },
            ].map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedCategory === category.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {category.label}
                <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {category.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filtros de búsqueda */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, email, cuenta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in_process">En Proceso</option>
              <option value="completed">Completada</option>
              <option value="rejected">Rechazada</option>
              <option value="failed">Fallida</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando {filteredRequests.length} de {requests.length} solicitudes
          </div>
        </div>
      </Card>

      {/* Lista de solicitudes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuenta
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
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.user.profileInfo?.fullName ||
                          request.user.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${request.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {request.bankName || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.accountNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className="ml-2">
                        {getStatusBadge(request.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowDetailsModal(request.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              processRequest(request.id, "approve")
                            }
                            disabled={processing === request.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => processRequest(request.id, "reject")}
                            disabled={processing === request.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {request.status === "in_process" && (
                        <button
                          onClick={() => processRequest(request.id, "complete")}
                          disabled={processing === request.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        >
                          <Banknote className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay solicitudes
              </h3>
              <p className="text-gray-500">
                No se encontraron solicitudes que coincidan con los filtros
                aplicados.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de detalles */}
      {showDetailsModal && (
        <RequestDetailsModal
          request={
            requests.find((r) => r.id === showDetailsModal) ||
            ({} as WithdrawalRequest)
          }
          onClose={() => setShowDetailsModal(null)}
          onProcess={processRequest}
          processing={processing}
          transferProof={transferProof}
          setTransferProof={setTransferProof}
          processNotes={processNotes}
          setProcessNotes={setProcessNotes}
        />
      )}
    </div>
  );
};

// Modal component
const RequestDetailsModal: React.FC<{
  request: WithdrawalRequest;
  onClose: () => void;
  onProcess: (id: string, action: "approve" | "reject" | "complete") => void;
  processing: string | null;
  transferProof: string;
  setTransferProof: (value: string) => void;
  processNotes: string;
  setProcessNotes: (value: string) => void;
}> = ({
  request,
  onClose,
  onProcess,
  processing,
  transferProof,
  setTransferProof,
  processNotes,
  setProcessNotes,
}) => {
  if (!request.id) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Detalles de Solicitud
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Información del usuario */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Información del Usuario
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <p className="font-medium">
                    {request.user.profileInfo?.fullName ||
                      request.user.username}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{request.user.email}</p>
                </div>
              </div>
            </div>

            {/* Información de la solicitud */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Detalles de Retiro
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Monto:</span>
                  <p className="font-medium text-lg">
                    ${request.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <p className="font-medium">{request.status}</p>
                </div>
                <div>
                  <span className="text-gray-500">Banco:</span>
                  <p className="font-medium">{request.bankName || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cuenta:</span>
                  <p className="font-medium">{request.accountNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de solicitud:</span>
                  <p className="font-medium">
                    {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                {request.processedAt && (
                  <div>
                    <span className="text-gray-500">
                      Fecha de procesamiento:
                    </span>
                    <p className="font-medium">
                      {new Date(request.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Razón de rechazo */}
            {request.rejectionReason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">
                  Razón de Rechazo
                </h4>
                <p className="text-red-800">{request.rejectionReason}</p>
              </div>
            )}

            {/* Comprobante de transferencia */}
            {request.transferProof && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Comprobante de Transferencia
                </h4>
                <a
                  href={request.transferProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Ver comprobante
                </a>
              </div>
            )}

            {/* Acciones según estado */}
            {request.status === "pending" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de procesamiento
                  </label>
                  <textarea
                    value={processNotes}
                    onChange={(e) => setProcessNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Agregar notas..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => onProcess(request.id, "approve")}
                    disabled={processing === request.id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => onProcess(request.id, "reject")}
                    disabled={processing === request.id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {request.status === "in_process" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de transferencia *
                  </label>
                  <input
                    type="url"
                    value={transferProof}
                    onChange={(e) => setTransferProof(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL del comprobante..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={processNotes}
                    onChange={(e) => setProcessNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales..."
                  />
                </div>

                <button
                  onClick={() => onProcess(request.id, "complete")}
                  disabled={processing === request.id || !transferProof.trim()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Marcar como Completada
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestsPage;
