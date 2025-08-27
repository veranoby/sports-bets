// frontend/src/pages/admin/Requests.tsx
// 💸 GESTIÓN SOLICITUDES RETIRO - Layout 3 secciones

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  X,
  RefreshCw,
  Banknote,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// APIs
import { walletAPI, usersAPI } from "../../config/api";

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

const AdminRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados principales
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || searchParams.get("filter") || ""
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [amountMin, setAmountMin] = useState(
    searchParams.get("amountMin") || ""
  );
  const [amountMax, setAmountMax] = useState(
    searchParams.get("amountMax") || ""
  );

  // Modal detalle
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Modal procesamiento
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<
    "approve" | "reject" | "complete" | null
  >(null);
  const [processNotes, setProcessNotes] = useState("");
  const [transferProof, setTransferProof] = useState("");

  // Estados operativos
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await walletAPI.getWithdrawalRequests({
        includeUser: true,
        limit: 1000,
      });

      setRequests(response.data?.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrado por categorías
  const {
    newRequests,
    inProcessRequests,
    completedRequests,
    filteredRequests,
  } = useMemo(() => {
    let filtered = [...requests];

    // Categorizar por estado
    const newReqs = requests.filter((r) => r.status === "pending");
    const processReqs = requests.filter((r) => r.status === "in_process");
    const completedReqs = requests.filter((r) =>
      ["completed", "rejected", "failed"].includes(r.status)
    );

    // Aplicar filtros
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.user.username.toLowerCase().includes(term) ||
          r.user.email.toLowerCase().includes(term) ||
          r.accountNumber.includes(term) ||
          r.user.profileInfo?.fullName?.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter(
        (r) => new Date(r.requestedAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(
        (r) => new Date(r.requestedAt) <= new Date(dateTo)
      );
    }

    if (amountMin) {
      filtered = filtered.filter((r) => r.amount >= parseFloat(amountMin));
    }

    if (amountMax) {
      filtered = filtered.filter((r) => r.amount <= parseFloat(amountMax));
    }

    return {
      newRequests: newReqs,
      inProcessRequests: processReqs,
      completedRequests: completedReqs,
      filteredRequests: filtered.sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      ),
    };
  }, [
    requests,
    searchTerm,
    statusFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
  ]);

  // Acciones
  const handleProcessRequest = async (
    requestId: string,
    action: "approve" | "reject" | "complete"
  ) => {
    if (action === "complete" && !transferProof.trim()) {
      setError("Se requiere comprobante de transferencia");
      return;
    }

    try {
      setProcessing(requestId);

      const payload: any = {
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

      await walletAPI.processWithdrawalRequest(requestId, payload);

      // Actualizar request local
      setRequests(
        requests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: payload.status,
                processedAt: new Date().toISOString(),
                rejectionReason: payload.rejectionReason,
                transferProof: payload.transferProof,
              }
            : r
        )
      );

      setShowProcessModal(false);
      setProcessNotes("");
      setTransferProof("");
    } catch (err) {
      setError(
        `Error procesando solicitud: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    } finally {
      setProcessing(null);
    }
  };

  const openProcessModal = (
    request: WithdrawalRequest,
    action: "approve" | "reject" | "complete"
  ) => {
    setSelectedRequest(request);
    setProcessAction(action);
    setProcessNotes("");
    setTransferProof("");
    setShowProcessModal(true);
  };

  const exportRequests = () => {
    const csvData = filteredRequests.map((r) => ({
      ID: r.id,
      Usuario: r.user.username,
      Email: r.user.email,
      Monto: r.amount,
      Estado: r.status,
      Cuenta: `****${r.accountNumber.slice(-4)}`,
      Banco: r.bankName || "",
      Solicitado: new Date(r.requestedAt).toLocaleDateString(),
      Procesado: r.processedAt
        ? new Date(r.processedAt).toLocaleDateString()
        : "",
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawal_requests_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Fetch inicial
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Componentes auxiliares
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_process: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || colors.pending
        }`}
      >
        {status === "in_process" ? "En proceso" : status}
      </span>
    );
  };

  const formatAmount = (amount: number) => `$${amount.toLocaleString()}`;
  const formatAccount = (account: string) => `****${account.slice(-4)}`;

  if (loading) {
    return <LoadingSpinner text="Cargando solicitudes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitudes de Retiro
            </h1>
            <p className="text-gray-600">
              {newRequests.length} nuevas • {inProcessRequests.length} en
              proceso • $
              {requests.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}{" "}
              total
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportRequests}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchRequests} className="mb-6" />
      )}

      {/* Sección Superior: Nuevas + En Proceso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Nuevas Solicitudes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              🆕 Nuevas Solicitudes ({newRequests.length})
            </h2>
            <div className="text-sm text-gray-600">
              Total:{" "}
              {formatAmount(newRequests.reduce((sum, r) => sum + r.amount, 0))}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {newRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No hay solicitudes nuevas</p>
              </div>
            ) : (
              newRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.user.username}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {formatAmount(request.amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatAccount(request.accountNumber)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openProcessModal(request, "approve")}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => openProcessModal(request, "reject")}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* En Proceso */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ⏳ En Proceso ({inProcessRequests.length})
            </h2>
            <div className="text-sm text-gray-600">
              Total:{" "}
              {formatAmount(
                inProcessRequests.reduce((sum, r) => sum + r.amount, 0)
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {inProcessRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No hay solicitudes en proceso</p>
              </div>
            ) : (
              inProcessRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.user.username}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.bankName || "Banco no especificado"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Aprobado:{" "}
                        {request.processedAt
                          ? new Date(request.processedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {formatAmount(request.amount)}
                      </p>
                      <StatusBadge status={request.status} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openProcessModal(request, "complete")}
                      disabled={processing === request.id}
                      className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <Banknote className="w-4 h-4" />
                      Marcar Completada
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Sección Inferior: Filtros + Historial */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial Completo
          </h2>
          <p className="text-sm text-gray-600">
            {filteredRequests.length} solicitudes
          </p>
        </div>

        {/* Filtros avanzados */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_process">En proceso</option>
              <option value="completed">Completadas</option>
              <option value="rejected">Rechazadas</option>
            </select>

            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Desde"
            />

            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Hasta"
            />

            <input
              type="number"
              placeholder="Monto min"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
            />

            <input
              type="number"
              placeholder="Monto max"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
            />
          </div>

          {(searchTerm ||
            statusFilter ||
            dateFrom ||
            dateTo ||
            amountMin ||
            amountMax) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setDateFrom("");
                setDateTo("");
                setAmountMin("");
                setAmountMax("");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla historial */}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No se encontraron solicitudes con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.user.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {formatAmount(request.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">
                          {formatAccount(request.accountNumber)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.bankName || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.processedAt && (
                          <p className="text-xs">
                            {new Date(request.processedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detalle */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Solicitud
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Usuario
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.user.username}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedRequest.user.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Monto
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {formatAmount(selectedRequest.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Cuenta
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.accountNumber}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedRequest.accountType} • {selectedRequest.bankName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Estado
                  </label>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Solicitado
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.processedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Procesado
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedRequest.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedRequest.rejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Motivo de Rechazo
                  </label>
                  <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-lg">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {selectedRequest.transferProof && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Comprobante de Transferencia
                  </label>
                  <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg">
                    {selectedRequest.transferProof}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Procesamiento */}
      {showProcessModal && selectedRequest && processAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {processAction === "approve"
                  ? "Aprobar Solicitud"
                  : processAction === "reject"
                  ? "Rechazar Solicitud"
                  : "Marcar Completada"}
              </h2>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedRequest.user.username}</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(selectedRequest.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatAccount(selectedRequest.accountNumber)} •{" "}
                  {selectedRequest.bankName}
                </p>
              </div>

              {processAction === "complete" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Transferencia *
                  </label>
                  <input
                    type="text"
                    value={transferProof}
                    onChange={(e) => setTransferProof(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Transfer. #123456789 - Banco Nacional"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {processAction === "reject"
                    ? "Motivo del rechazo"
                    : "Notas (opcional)"}
                </label>
                <textarea
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={
                    processAction === "reject"
                      ? "Describe el motivo..."
                      : "Notas adicionales..."
                  }
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    handleProcessRequest(selectedRequest.id, processAction)
                  }
                  disabled={
                    processing === selectedRequest.id ||
                    (processAction === "complete" && !transferProof.trim())
                  }
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                    processAction === "approve"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : processAction === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {processing === selectedRequest.id
                    ? "Procesando..."
                    : processAction === "approve"
                    ? "Aprobar"
                    : processAction === "reject"
                    ? "Rechazar"
                    : "Completar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
