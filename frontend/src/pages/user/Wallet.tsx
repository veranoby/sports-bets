// frontend/src/pages/user/Wallet.tsx - MIGRADO V9
// ===================================================
// ELIMINADO: getUserThemeClasses() import y usage
// APLICADO: Clases CSS estáticas directas

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  Minus,
  Download,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Navigate } from "react-router-dom"; // Added Navigate import

// Hooks y contextos
import { useWallet } from "../../hooks/useApi";
import { useFeatureFlags } from "../../hooks/useFeatureFlags"; // Added useFeatureFlags import
// ❌ ELIMINADO: import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import { useWebSocketListener } from "../../hooks/useWebSocket";

// Componentes
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import TransactionHistory from "../../components/user/TransactionHistory";
import WalletTransactionModal from "../../components/user/WalletTransactionModal";
import Card from "../../components/shared/Card";

// Tipos
import type { Transaction } from "../../types";

// Registrar Chart.js
Chart.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

const WalletPage: React.FC = () => {
  const { isWalletEnabled } = useFeatureFlags(); // Added feature flag check

  // ❌ ELIMINADO: const theme = getUserThemeClasses();
  const {
    wallet,
    transactions: recentTransactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    deposit,
    withdraw,
  } = useWallet();

  // Estados locales
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data para el gráfico (hasta que tengamos datos reales)
  const mockChartData = [
    { date: "01/20", balance: 450.0 },
    { date: "01/21", balance: 520.0 },
    { date: "01/22", balance: 480.0 },
    { date: "01/23", balance: 600.0 },
    { date: "01/24", balance: 580.0 },
    { date: "01/25", balance: wallet?.balance || 500.0 },
  ];

  // Configuración del gráfico
  const chartData = {
    labels: mockChartData.map((item) => item.date),
    datasets: [
      {
        label: "Balance",
        data: mockChartData.map((item) => item.balance),
        borderColor: "#596c95",
        backgroundColor: "rgba(89, 108, 149, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(89, 108, 149, 0.2)" },
        ticks: {
          color: "#94a3b8",
          callback: function (value: unknown) {
            return "$" + value;
          },
        },
      },
      x: {
        grid: { color: "rgba(89, 108, 149, 0.2)" },
        ticks: { color: "#94a3b8" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#2a325c",
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        borderColor: "#596c95",
        borderWidth: 1,
        callbacks: {
          label: function (context: unknown) {
            return `Balance: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
  };

  useEffect(() => {
    // Solo verificar si wallet está cargado, NO hacer fetch
    if (!wallet && !loading) {
      console.log(
        "💰 Wallet data not available, UserHeader should handle this",
      );
    }
  }, [wallet, loading]);

  // 🔧 NUEVO: Handler para refresh específico del balance
  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchWallet(), fetchTransactions()]);
    } catch (error) {
      console.error("Error refreshing wallet:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handlers para modales
  const handleDeposit = async (
    amount: number,
    paymentMethod: string,
    paymentData?: unknown,
  ) => {
    try {
      await deposit(amount, paymentMethod, paymentData);
      setShowDepositModal(false);
      await handleRefreshBalance();
    } catch (error) {
      console.error("Error en depósito:", error);
    }
  };

  const handleWithdraw = async (
    amount: number,
    accountNumber: string,
    accountType?: string,
    bankName?: string,
  ) => {
    try {
      await withdraw(amount, accountNumber, accountType, bankName);
      setShowWithdrawModal(false);
      await handleRefreshBalance();
    } catch (error) {
      console.error("Error en retiro:", error);
    }
  };

  // ✅ LISTENER ESPECÍFICO DE WALLET (solo transaction_completed)
  useWebSocketListener<Transaction>("transaction_completed", (transaction) => {
    if (transaction) {
      fetchTransactions();
      const message =
        transaction.type === "deposit"
          ? `Depósito completado: ${transaction.amount}`
          : `Retiro completado: ${transaction.amount}`;
      console.log("Transacción completada:", message);
    }
  });

  if (!isWalletEnabled) return <Navigate to="/dashboard" replace />; // Conditional rendering

  if (loading && !refreshing) {
    return (
      <div className="bg-theme-main text-theme-primary">
        <LoadingSpinner text="Cargando billetera..." className="mt-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-main text-theme-primary">
        <div className="p-4">
          <ErrorMessage
            error={error}
            onRetry={() => {
              console.log("Retrying wallet data fetch...");
              fetchWallet();
              fetchTransactions();
            }}
          />
          <p className="text-theme-error text-sm mt-2">
            Si el problema persiste, contacta al soporte técnico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-main text-theme-primary pb-24">
      <div className="p-4 space-y-6">
        {/* Balance Principal */}
        <Card className="card-background p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#596c95] to-[#4a5b80] rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-theme-light">Balance Total</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-theme-primary">
                    {showBalance
                      ? `$${Number(wallet?.balance || 0).toFixed(2)}`
                      : "••••••"}
                  </p>

                  <button
                    onClick={handleRefreshBalance}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-[#1a1f37] transition-colors text-theme-light hover:text-white disabled:opacity-50"
                    title="Actualizar balance"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 rounded-lg hover:bg-[#1a1f37] transition-colors text-theme-light hover:text-white"
                    title={showBalance ? "Ocultar balance" : "Mostrar balance"}
                  >
                    {showBalance ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Saldo Congelado */}
          {wallet?.frozenAmount && wallet.frozenAmount > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">
                  Fondos congelados: ${wallet.frozenAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Acciones Principales */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Depositar
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Minus className="w-4 h-4" />
              Retirar
            </button>
          </div>
        </Card>

        {/* Gráfico de Balance */}
        <Card className="card-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              Historial de Balance
            </h2>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-background p-4 text-center">
            <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-theme-primary">
              $
              {recentTransactions
                ?.filter((t) => t.type === "deposit")
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-theme-light">Total Depósitos</p>
          </Card>

          <Card className="card-background p-4 text-center">
            <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-theme-primary">
              $
              {recentTransactions
                ?.filter((t) => t.type === "withdrawal")
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-theme-light">Total Retiros</p>
          </Card>

          <Card className="card-background p-4 text-center">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-theme-primary">
              {recentTransactions?.filter((t) => t.status === "completed")
                .length || 0}
            </p>
            <p className="text-sm text-theme-light">Completadas</p>
          </Card>

          <Card className="card-background p-4 text-center">
            <div className="w-10 h-10 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-theme-primary">
              {recentTransactions?.filter((t) => t.status === "pending")
                .length || 0}
            </p>
            <p className="text-sm text-theme-light">Pendientes</p>
          </Card>
        </div>

        {/* Historial de Transacciones */}
        <Card className="card-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              Transacciones Recientes
            </h2>
            <button className="btn-ghost text-sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
          <TransactionHistory
            transactions={(recentTransactions || []).map((t) => ({
              id: t.id,
              type: t.type as
                | "deposit"
                | "withdrawal"
                | "bet-win"
                | "bet-loss"
                | "bet-refund",
              amount: t.amount,
              status: t.status as "pending" | "completed" | "failed",
              description:
                t.description ||
                `${t.type === "deposit" ? "Depósito" : "Retiro"} de $${t.amount}`,
              createdAt: new Date(t.createdAt),
            }))}
          />
        </Card>
      </div>

      {/* Modales */}
      <WalletTransactionModal
        mode="deposit"
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        availableBalance={wallet?.balance || 0}
      />

      <WalletTransactionModal
        mode="withdraw"
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        availableBalance={wallet?.balance || 0}
      />
    </div>
  );
};

export default WalletPage;
