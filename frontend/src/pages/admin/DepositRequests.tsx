import React, { useState, useEffect, useCallback } from "react";
import { useWalletOperations } from "../../../hooks/useApi";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import WalletOperationCard from "../../../components/admin/WalletOperationCard";
import ApproveDepositModal from "../../../components/admin/ApproveDepositModal";
import RejectOperationModal from "../../../components/admin/RejectOperationModal";
import ConfirmModal from "../../../components/shared/ConfirmModal";
import { useToast } from "../../../hooks/useToast";
import type { WalletOperation } from "../../../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw, Filter } from "lucide-react";

const DepositRequests: React.FC = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterType, setFilterType] = useState<string>("deposit");
  const [selectedOperation, setSelectedOperation] =
    useState<WalletOperation | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false); // For deposits, this is a formality
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    operations,
    loading,
    error,
    fetchOperations,
    approveOperation,
    rejectOperation,
    completeOperation,
  } = useWalletOperations();

  const loadOperations = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOperations({
      page,
      limit,
      status: filterStatus,
      type: filterType,
    });
    setIsRefreshing(false);
  }, [page, limit, filterStatus, filterType, fetchOperations]);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  const handleApprove = async (operationId: string, adminNotes?: string) => {
    try {
      await approveOperation(operationId, adminNotes);
      toast.success("Solicitud de depósito aprobada exitosamente.");
      setShowApproveModal(false);
      setSelectedOperation(null);
      loadOperations();
    } catch (err: any) {
      toast.error(err.message || "Error al aprobar la solicitud.");
    }
  };

  const handleReject = async (
    operationId: string,
    rejectionReason: string,
    adminNotes?: string,
  ) => {
    try {
      await rejectOperation(operationId, rejectionReason, adminNotes);
      toast.success("Solicitud de depósito rechazada.");
      setShowRejectModal(false);
      setSelectedOperation(null);
      loadOperations();
    } catch (err: any) {
      toast.error(err.message || "Error al rechazar la solicitud.");
    }
  };

  const handleCompleteDeposit = async (
    operationId: string,
    adminProofUrl?: string,
    adminNotes?: string,
  ) => {
    try {
      await completeOperation(operationId, adminProofUrl, adminNotes);
      toast.success("Depósito marcado como completado.");
      setShowCompleteModal(false);
      setSelectedOperation(null);
      loadOperations();
    } catch (err: any) {
      toast.error(err.message || "Error al marcar como completado.");
    }
  };

  if (loading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner text="Cargando solicitudes de depósito..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const totalPages = operations ? Math.ceil(operations.total / limit) : 1;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Solicitudes de Depósito
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadOperations()}
            className="btn btn-outline-primary flex items-center"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select pl-3 pr-10 py-2"
            >
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="completed">Completadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="all">Todas</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {operations?.operations.length === 0 ? (
          <p className="text-center text-gray-600 text-lg py-8">
            No hay solicitudes de depósito{" "}
            {filterStatus === "pending" ? "pendientes" : ""}.
          </p>
        ) : (
          operations?.operations.map((operation) => (
            <WalletOperationCard
              key={operation.id}
              operation={operation}
              onApprove={() => {
                setSelectedOperation(operation);
                setShowApproveModal(true);
              }}
              onReject={() => {
                setSelectedOperation(operation);
                setShowRejectModal(true);
              }}
              onComplete={() => {
                // For deposits, this is to mark as completed. No financial change.
                setSelectedOperation(operation);
                setShowCompleteModal(true);
              }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="btn btn-primary"
          >
            <ChevronLeft className="w-5 h-5" /> Anterior
          </button>
          <span className="text-gray-700">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-primary"
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedOperation && (
        <>
          <ApproveDepositModal
            isOpen={showApproveModal}
            onClose={() => setShowApproveModal(false)}
            onApprove={(adminNotes) =>
              handleApprove(selectedOperation.id, adminNotes)
            }
            operation={selectedOperation}
          />
          <RejectOperationModal
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            onReject={(reason, adminNotes) =>
              handleReject(selectedOperation.id, reason, adminNotes)
            }
            operation={selectedOperation}
          />
          <ConfirmModal // Generic confirm for marking as completed
            isOpen={showCompleteModal}
            onClose={() => setShowCompleteModal(false)}
            onConfirm={() => handleCompleteDeposit(selectedOperation.id)}
            title="Marcar Depósito como Completado"
            message={`¿Está seguro de que el depósito de $${selectedOperation.amount.toFixed(2)} del usuario ${selectedOperation.user?.username} ha sido confirmado y desea marcarlo como completado?`}
            confirmText="Sí, Completar"
            isConfirming={loading} // Use general loading for simplicity
          />
        </>
      )}
    </div>
  );
};

export default DepositRequests;
