// frontend/src/pages/user/Wallet.tsx
// 💰 WALLET OPTIMIZADO - Refresh button en balance, header unificado

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

// Hooks y contextos
import { useWallet } from "../../hooks/useApi";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import { useWebSocketListener } from "../../hooks/useWebSocket";

// Componentes
import UserHeader from "../../components/user/UserHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import TransactionHistory from "../../components/user/TransactionHistory";
import DepositModal from "../../components/user/DepositModal";
import WithdrawModal from "../../components/user/WithdrawModal";
import Card from "../../components/shared/Card";
import Navigation from "../../components/user/Navigation";

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
  Filler
);

const WalletPage: React.FC = () => {
  const theme = getUserThemeClasses();
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

  // Debug: Verificar datos
  console.log("Wallet data:", wallet);
  console.log("Transactions:", recentTransactions);

  // Estados locales
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">(
    "30d"
  );
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Datos calculados
  const balanceData = {
    available: wallet?.availableBalance || 0,
    frozen: wallet?.frozenAmount || 0,
    total: wallet?.balance || 0,
  };

  // Filtrar transacciones
  const filteredTransactions =
    recentTransactions?.filter((transaction) => {
      if (transactionFilter === "all") return true;
      return transaction.type === transactionFilter;
    }) || [];

  // Estadísticas rápidas
  const stats = {
    totalDeposits: filteredTransactions
      .filter((t) => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: filteredTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
    pendingTransactions: filteredTransactions.filter(
      (t) => t.status === "pending"
    ).length,
    winnings: filteredTransactions
      .filter((t) => t.type === "bet-win")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  // Datos para gráfico
  const chartData = {
    labels: [
      "Hace 30d",
      "Hace 25d",
      "Hace 20d",
      "Hace 15d",
      "Hace 10d",
      "Hace 5d",
      "Hoy",
    ],
    datasets: [
      {
        label: "Balance",
        data: [750, 820, 790, 900, 850, 920, balanceData.total],
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
          callback: function (value: any) {
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
          label: function (context: any) {
            return `Balance: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchWallet(), fetchTransactions()]);
      } catch (err) {
        console.error("Error loading wallet data:", err);
      }
    };

    loadData();
  }, [fetchWallet, fetchTransactions]);

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
    paymentData?: any
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
    bankName?: string
  ) => {
    try {
      await withdraw(amount, accountNumber, accountType, bankName);
      setShowWithdrawModal(false);
      await handleRefreshBalance();
    } catch (error) {
      console.error("Error en retiro:", error);
    }
  };

  // ✅ 1. Listener para actualizaciones de billetera
  useWebSocketListener<{ balance: number; frozenAmount: number }>(
    "wallet_updated",
    (data) => {
      if (data) {
        // Actualizar balance sin necesidad de refresh manual
        fetchWallet();
        addNotification("Tu balance ha sido actualizado", "info");
      }
    }
  );

  // ✅ 2. Listener para transacciones completadas
  useWebSocketListener<Transaction>("transaction_completed", (transaction) => {
    if (transaction) {
      fetchTransactions();
      const message =
        transaction.type === "deposit"
          ? `Depósito completado: $${transaction.amount}`
          : `Retiro completado: $${transaction.amount}`;
      addNotification(message, "success");
    }
  });

  if (loading && !refreshing) {
    return (
      <div className={theme.pageBackground}>
        <LoadingSpinner text="Cargando billetera..." className="mt-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={theme.pageBackground}>
        <UserHeader title="Mi Billetera" />
        <div className="p-4">
          <ErrorMessage
            error={error}
            onRetry={() => {
              fetchWallet();
              fetchTransactions();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.pageBackground} pb-24`}>
      <UserHeader title="Mi Billetera" />

      <div className="p-4 space-y-6">
        {/* Balance Principal */}
        <Card className={`${theme.cardBackground} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#596c95] to-[#4a5b80] rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Balance Total</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-white">
                    {showBalance
                      ? `$${Number(wallet?.balance || 0).toFixed(2)}`
                      : "••••••"}
                  </p>

                  {/* 🔧 NUEVO: Refresh button AQUÍ junto al balance */}
                  <button
                    onClick={handleRefreshBalance}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-[#1a1f37] transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                    title="Actualizar balance"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Show/Hide Balance Toggle */}
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg hover:bg-[#1a1f37] transition-colors text-gray-400 hover:text-white"
              title={showBalance ? "Ocultar balance" : "Mostrar balance"}
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Balances Detallados */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1a1f37] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Disponible</span>
              </div>
              <p className="text-xl font-bold text-green-400">
                ${Number(balanceData.available || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-[#1a1f37] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Congelado</span>
              </div>
              <p className="text-xl font-bold text-yellow-400">
                ${Number(balanceData.frozen || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className={`${theme.primaryButton} flex items-center justify-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              Depositar
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className={`${theme.secondaryButton} flex items-center justify-center gap-2`}
              disabled={balanceData.available < 10}
            >
              <Minus className="w-4 h-4" />
              Retirar
            </button>
          </div>
        </Card>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`${theme.cardBackground} p-4`}>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-lg font-bold text-white">
                  ${stats.totalDeposits.toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">Depósitos</p>
              </div>
            </div>
          </Card>

          <Card className={`${theme.cardBackground} p-4`}>
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-lg font-bold text-white">
                  ${stats.totalWithdrawals.toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">Retiros</p>
              </div>
            </div>
          </Card>

          <Card className={`${theme.cardBackground} p-4`}>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-lg font-bold text-white">
                  ${stats.winnings.toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">Ganancias</p>
              </div>
            </div>
          </Card>

          <Card className={`${theme.cardBackground} p-4`}>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-lg font-bold text-white">
                  {stats.pendingTransactions}
                </p>
                <p className="text-xs text-gray-400">Pendientes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfico de Balance */}
        <Card className={`${theme.cardBackground} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Evolución del Balance
            </h2>
            <select
              value={selectedPeriod}
              onChange={(e) =>
                setSelectedPeriod(e.target.value as "7d" | "30d" | "90d")
              }
              className={theme.input}
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>

        {/* Historial de Transacciones */}
        <Card className={`${theme.cardBackground} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Historial de Transacciones
            </h2>
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className={theme.input}
            >
              <option value="all">Todas</option>
              <option value="deposit">Depósitos</option>
              <option value="withdrawal">Retiros</option>
              <option value="bet-win">Ganancias</option>
              <option value="bet-loss">Apuestas</option>
            </select>
          </div>

          <TransactionHistory
            transactions={filteredTransactions}
            loading={refreshing}
            variant="dark"
          />
        </Card>
      </div>

      {/* Modales */}
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onDeposit={handleDeposit}
          minAmount={10}
          maxAmount={10000}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onWithdraw={handleWithdraw}
          availableBalance={balanceData.available}
          minAmount={10}
          maxAmount={Math.min(balanceData.available, 5000)}
        />
      )}

      {/* Navigation */}
      <Navigation currentPage="wallet" />
    </div>
  );
};

export default WalletPage;
