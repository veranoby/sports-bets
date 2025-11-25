// frontend/src/pages/admin/Finance.tsx
// 💰 GESTIÓN DE OPERACIONES DE WALLET - Página de administración de depósitos y retiros

import React, { useState, useEffect, useMemo } from "react";
import { Wallet, PlusCircle, Download, Eye, Check, X, Upload, AlertCircle, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Modal from "../../components/shared/Modal";

// APIs y tipos
import { walletAPI } from "../../config/api";
import { WalletOperation, WalletOperationStats, CreateDepositData, CreateWithdrawalData, ApproveOperationData, CompleteOperationData, RejectOperationData } from "../../types/walletOperation";

// Componentes específicos
import WalletOperationCard from "../../components/admin/WalletOperationCard";
import ApproveDepositModal from "../../components/admin/ApproveDepositModal";
import ApproveWithdrawalModal from "../../components/admin/ApproveWithdrawalModal";
import RejectOperationModal from "../../components/admin/RejectOperationModal";
import WalletOperationFilters from "../../components/admin/WalletOperationFilters";

const AdminFinancePage: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'history'>('deposits');
  const [operations, setOperations] = useState<WalletOperation[]>([]);
  const [stats, setStats] = useState<WalletOperationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de modales
  const [showApproveDepositModal, setShowApproveDepositModal] = useState(false);
  const [showApproveWithdrawalModal, setShowApproveWithdrawalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<WalletOperation | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'pending',
    dateFrom: '',
    dateTo: '',
    type: 'deposit' as 'deposit' | 'withdrawal',
  });

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar estadísticas
      const statsRes = await walletAPI.getWalletOperationStats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }

      // Cargar operaciones según pestaña activa
      let params: any = { status: filters.status || 'pending' };
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      // Filtrar por tipo según la pestaña activa
      if (activeTab === 'deposits') {
        params.type = 'deposit';
      } else if (activeTab === 'withdrawals') {
        params.type = 'withdrawal';
      } else {
        // En historial, no filtrar por tipo
        delete params.type;
        params.status = 'completed'; // Mostrar solo operaciones completadas en historial
      }

      const operationsRes = await walletAPI.getWalletOperations(params);
      if (operationsRes.success) {
        setOperations(operationsRes.data.operations || []);
      }
    } catch (err: any) {
      console.error('Error loading wallet operations:', err);
      setError(err.message || 'Error al cargar operaciones de wallet');
      toast.error('Error al cargar operaciones de wallet');
    } finally {
      setLoading(false);
    }
  };

  // Refrescar datos cuando cambia la pestaña o los filtros
  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  // Manejar filtros
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Exportar a Excel
  const exportToExcel = () => {
    if (!operations.length) {
      toast.error('No hay operaciones para exportar');
      return;
    }

    try {
      // Preparar datos para exportación
      const exportData = operations.map(op => ({
        ID: op.id,
        Usuario: op.userId,
        'Tipo de Operación': op.type,
        Monto: op.amount,
        Estado: op.status,
        'Fecha de Solicitud': op.requestedAt,
        'Fecha de Procesamiento': op.processedAt || '',
        'Fecha de Completado': op.completedAt || '',
        'URL de Prueba de Pago': op.paymentProofUrl || '',
        'URL de Prueba de Admin': op.adminProofUrl || '',
        'Notas de Admin': op.adminNotes || '',
        'Razón de Rechazo': op.rejectionReason || '',
        ProcesadoPor: op.processedBy || ''
      }));

      // Crear libro de Excel y hoja
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Operaciones Wallet");

      // Generar archivo y descargar
      const fileName = `operaciones_wallet_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Exportación completada');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('Error al exportar a Excel');
    }
  };

  // Manejar acciones de operaciones
  const handleApproveOperation = async (operationId: string, adminNotes?: string) => {
    try {
      await walletAPI.approveWalletOperation(operationId, adminNotes);
      toast.success('Operación aprobada exitosamente');
      
      // Refrescar datos
      fetchData();
      
      // Cerrar modal
      setShowApproveDepositModal(false);
      setShowApproveWithdrawalModal(false);
    } catch (err: any) {
      console.error('Error approving operation:', err);
      toast.error('Error al aprobar operación');
    }
  };

  const handleCompleteOperation = async (operationId: string, adminProofUrl: string, adminNotes?: string) => {
    try {
      await walletAPI.completeWalletOperation(operationId, adminProofUrl, adminNotes);
      toast.success('Operación completada exitosamente');
      
      // Refrescar datos
      fetchData();
      
      // Cerrar modal
      setShowApproveWithdrawalModal(false);
    } catch (err: any) {
      console.error('Error completing operation:', err);
      toast.error('Error al completar operación');
    }
  };

  const handleRejectOperation = async (operationId: string, rejectionReason: string, adminNotes?: string) => {
    try {
      await walletAPI.rejectWalletOperation(operationId, rejectionReason, adminNotes);
      toast.success('Operación rechazada exitosamente');
      
      // Refrescar datos
      fetchData();
      
      // Cerrar modal
      setShowRejectModal(false);
    } catch (err: any) {
      console.error('Error rejecting operation:', err);
      toast.error('Error al rechazar operación');
    }
  };

  // Abrir modales según el tipo de operación
  const openApproveModal = (operation: WalletOperation) => {
    setSelectedOperation(operation);
    if (operation.type === 'deposit') {
      setShowApproveDepositModal(true);
    } else {
      setShowApproveWithdrawalModal(true);
    }
  };

  const openRejectModal = (operation: WalletOperation) => {
    setSelectedOperation(operation);
    setShowRejectModal(true);
  };

  // Mostrar operaciones según la pestaña activa
  const filteredOperations = useMemo(() => {
    if (!operations.length) return [];

    switch (activeTab) {
      case 'deposits':
        return operations.filter(op => op.type === 'deposit');
      case 'withdrawals':
        return operations.filter(op => op.type === 'withdrawal');
      case 'history':
        return operations; // Mostrar todas las operaciones completadas
      default:
        return operations;
    }
  }, [operations, activeTab]);

  if (loading && !operations.length) {
    return <LoadingSpinner text="Cargando operaciones de wallet..." />;
  }

  if (error && !operations.length) {
    return <ErrorMessage error={error} onRetry={fetchData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Gestión de Operaciones
            </h1>
            <p className="text-gray-600">
              Administrar depósitos, retiros y movimientos de wallet
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats && (
          <>
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Depósitos Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.deposit?.pending || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Retiros Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.withdrawal?.pending || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Aprobados Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totals?.approved || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Procesadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totals?.completed || 0}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Filtros */}
      <WalletOperationFilters 
        filters={filters} 
        onChange={handleFilterChange}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      />

      {/* Contenido según pestaña */}
      <div className="mt-6">
        <div className="flex flex-col">
          {/* Lista de operaciones */}
          {filteredOperations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOperations.map(operation => (
                <WalletOperationCard
                  key={operation.id}
                  operation={operation}
                  onApprove={() => openApproveModal(operation)}
                  onReject={() => openRejectModal(operation)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron operaciones
              </h3>
              <p className="text-gray-500">
                {activeTab === 'deposits' 
                  ? 'No hay depósitos pendientes para mostrar' 
                  : activeTab === 'withdrawals'
                  ? 'No hay retiros pendientes para mostrar'
                  : 'No hay operaciones completadas para mostrar'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showApproveDepositModal && selectedOperation && (
        <ApproveDepositModal
          operation={selectedOperation}
          onClose={() => setShowApproveDepositModal(false)}
          onApprove={handleApproveOperation}
        />
      )}

      {showApproveWithdrawalModal && selectedOperation && (
        <ApproveWithdrawalModal
          operation={selectedOperation}
          onClose={() => setShowApproveWithdrawalModal(false)}
          onApprove={handleApproveOperation}
          onComplete={handleCompleteOperation}
        />
      )}

      {showRejectModal && selectedOperation && (
        <RejectOperationModal
          operation={selectedOperation}
          onClose={() => setShowRejectModal(false)}
          onReject={handleRejectOperation}
        />
      )}
    </div>
  );
};

export default AdminFinancePage;