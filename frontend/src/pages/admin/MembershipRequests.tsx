// frontend/src/pages/admin/MembershipRequests.tsx
// 🎯 ADMIN - Gestión de solicitudes de cambio de membresía

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  User,
  Phone,
  FileText,
  Eye,
  RefreshCw,
  Crown,
  Trash2,
} from "lucide-react";
import { membershipRequestsAPI, adminAPI } from "../../services/api";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import SubscriptionTabs from "../../components/admin/SubscriptionTabs";

interface MembershipRequest {
  id: string;
  userId: string;
  requestedMembershipType: "24-hour" | "monthly";
  requestNotes?: string;
  paymentProofUrl?: string;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  rejectionReason?: string;
  user: {
    id: string;
    username: string;
    email: string;
    profileInfo?: {
      fullName?: string;
      phoneNumber?: string;
    };
    subscription?: {
      status?: "active" | "cancelled" | "expired" | "pending";
      type?: "daily" | "monthly";
      manual_expires_at?: string;
    };
  };
}

const MembershipRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "rejected"
  >("pending");

  // Modal states
  const [selectedRequest, setSelectedRequest] =
    useState<MembershipRequest | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await membershipRequestsAPI.getPendingRequests({
        status: "all", // Fetch all requests, then filter in frontend
      });
      if (response.success && response.data) {
        setRequests((response.data as any).requests || []);
      } else {
        setError(response.error || "Error al cargar solicitudes");
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === "all") return true;
    return req.status === statusFilter;
  });

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      setErrorMessage("Debes proporcionar un motivo de rechazo");
      return;
    }

    setProcessing(requestId);
    setErrorMessage(null);
    try {
      const response = await membershipRequestsAPI.rejectRequest(
        requestId,
        rejectionReason,
      );

      if (response.success) {
        setSuccessMessage("Solicitud rechazada correctamente");
        setShowDetailsModal(false);
        setRejectionReason("");
        fetchRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(response.error || "Error al rechazar solicitud");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al rechazar solicitud");
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = (request: MembershipRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleUserSave = async (subscriptionData: any) => {
    if (!selectedRequest) return;

    setProcessing(selectedRequest.id);
    setErrorMessage(null);
    try {
      // Complete the request (this also creates/updates the subscription)
      const completeResponse = await membershipRequestsAPI.completeRequest(
        selectedRequest.id,
      );

      if (completeResponse.success) {
        setSuccessMessage("Solicitud aprobada y membresía actualizada");
        setShowUserModal(false);
        setSelectedRequest(null);
        fetchRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(completeResponse.error || "Error al aprobar solicitud");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al aprobar solicitud");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar esta solicitud? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setProcessing(requestId);
    setErrorMessage(null);
    try {
      const response = await membershipRequestsAPI.deleteRequest(requestId);

      if (response.success) {
        setSuccessMessage("Solicitud eliminada correctamente");
        fetchRequests();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(response.error || "Error al eliminar solicitud");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al eliminar solicitud");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "completed":
        return "Aprobada";
      case "rejected":
        return "Rechazada";
      default:
        return status;
    }
  };

  const getMembershipLabel = (type: string) => {
    switch (type) {
      case "24-hour":
        return "24 Horas - $5";
      case "monthly":
        return "Mensual - $10";
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando solicitudes de membresía..." />;
  }

  return (
    <div className="min-h-screen page-background p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
            <Crown className="w-7 h-7" />
            Solicitudes de Cambio de Membresía
          </h1>
          <p className="text-theme-secondary">
            Gestiona las solicitudes de usuarios para actualizar sus planes
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchRequests} />}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex gap-4 items-center">
          <span className="font-medium text-gray-700">Filtrar por estado:</span>
          <div className="flex gap-2">
            {["all", "pending", "completed", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() =>
                  setStatusFilter(
                    status as "all" | "pending" | "completed" | "rejected",
                  )
                }
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status === "all"
                  ? "Todas"
                  : status === "pending"
                    ? "Pendientes"
                    : status === "completed"
                      ? "Aprobadas"
                      : "Rechazadas"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card variant="stat" color="yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter((r) => r.status === "pending").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card variant="stat" color="green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === "completed").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card variant="stat" color="red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600">
                {requests.filter((r) => r.status === "rejected").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No hay solicitudes para mostrar</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan Actual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan Solicitado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.user.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.user.email}
                          </p>
                          {request.user.profileInfo?.phoneNumber && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {request.user.profileInfo.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {request.user.subscription?.type || "free"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        <CreditCard className="w-3 h-3" />
                        {getMembershipLabel(request.requestedMembershipType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="text-sm">
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver detalles de la solicitud"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApprove(request)}
                              disabled={processing === request.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Aprobar y cambiar membresía"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Rechazar solicitud"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(request.status === "completed" ||
                          request.status === "rejected") && (
                          <button
                            onClick={() => handleDelete(request.id)}
                            disabled={processing === request.id}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="Eliminar solicitud"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles de Solicitud
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setRejectionReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <p className="text-lg font-semibold">
                  {selectedRequest.user.username}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedRequest.user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Membresía Solicitada
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  {getMembershipLabel(selectedRequest.requestedMembershipType)}
                </p>
              </div>

              {selectedRequest.requestNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas del Usuario
                  </label>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-800">
                      {selectedRequest.requestNotes}
                    </p>
                  </div>
                </div>
              )}

              {selectedRequest.paymentProofUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Pago
                  </label>
                  <img
                    src={selectedRequest.paymentProofUrl}
                    alt="Comprobante de pago"
                    className="max-w-full rounded border border-gray-300"
                  />
                </div>
              )}

              {selectedRequest.status === "rejected" &&
                selectedRequest.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Motivo de Rechazo
                    </label>
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm text-red-800">
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

              {selectedRequest.status === "pending" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de Rechazo (opcional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Explica por qué se rechaza la solicitud..."
                  />
                </div>
              )}
            </div>

            {selectedRequest.status === "pending" && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={processing === selectedRequest.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing === selectedRequest.id
                    ? "Rechazando..."
                    : "Rechazar Solicitud"}
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApprove(selectedRequest);
                  }}
                  disabled={processing === selectedRequest.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Aprobar y Cambiar Membresía
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Actualizar Membresía - {selectedRequest.user.username}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <SubscriptionTabs
              userId={selectedRequest.userId}
              subscription={selectedRequest.user.subscription}
              onSave={handleUserSave}
              onCancel={() => {
                setShowUserModal(false);
                setSelectedRequest(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipRequestsPage;
