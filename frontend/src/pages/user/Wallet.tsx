// frontend/src/pages/user/Wallet.tsx - MIGRADO V9
// ===================================================
// ELIMINADO: getUserThemeClasses() import y usage
// APLICADO: Clases CSS estáticas directas

import React, { useState, useEffect, useMemo } from "react";
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
import type { TooltipItem } from "chart.js";
import { Navigate } from "react-router-dom"; // Added Navigate import

// Hooks y contextos
import { useWallet } from "../../hooks/useApi";
import { useFeatureFlags } from "../../hooks/useFeatureFlags"; // Added useFeatureFlags import
// ❌ ELIMINADO: import { getUserThemeClasses } from "../../contexts/UserThemeContext";

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

const Wallet: React.FC = () => {
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

  // ✅ CALCULATE REAL BALANCE HISTORY
  const balanceHistory = useMemo(() => {
    if (!wallet || !recentTransactions) return [];

    let currentBalance = wallet.balance || 0;
    const history = [];

    // 1. Add current state (Now)
    history.push({
      date: "Actual",
      balance: currentBalance,
      timestamp: new Date().getTime(),
    });

    // 2. Sort transactions by date descending (newest first) to backtrack
    const sortedTransactions = [...recentTransactions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // 3. Backtrack through transactions to calculate past balances
    // Only consider completed/processed changes that affected balance
    sortedTransactions.forEach((tx) => {
      // Logic: If we are going BACKWARDS in time:
      // - Deposit (+): means before this, balance was LOWER (- amount)
      // - Withdraw (-): means before this, balance was HIGHER (+ amount)
      // - Bet (-): means before this, balance was HIGHER (+ amount)
      // - Win (+): means before this, balance was LOWER (- amount)
      const type = tx.type;
      const amount = tx.amount;

      if (tx.status === "completed" || tx.status === "active") {
        // Assuming active bets deducted balance
        let change = 0;
        if (type === "deposit" || type === "win" || type === "bet-win") {
          change = amount; // It added to balance, so previous was less
          currentBalance -= change;
        } else if (
          type === "withdrawal" ||
          type === "bet" ||
          type === "bet-loss"
        ) {
          change = amount; // It removed from balance, so previous was more
          currentBalance += change;
        }

        const date = new Date(tx.createdAt);
        history.push({
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          balance: currentBalance,
          timestamp: date.getTime(),
        });
      }
    });

    // 4. Reverse to get chronological order (Oldest -> Newest) and take last 10 points
    return history.reverse().slice(-10);
  }, [wallet, recentTransactions]);

  // Configuración del gráfico con datos reales
  const chartData = {
    labels:
      balanceHistory.length > 0
        ? balanceHistory.map((item) => item.date)
        : ["Inicio", "Actual"],
    datasets: [
      {
        label: "Balance",
        data:
          balanceHistory.length > 0
            ? balanceHistory.map((item) => item.balance)
            : [0, wallet?.balance || 0],
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
          label: function (context: TooltipItem<"line">) {
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
      await deposit(
        amount,
        paymentMethod,
        paymentData as Record<string, unknown>,
      );
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Balance y Estadísticas */}
          <div className="space-y-6">
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
                        title={
                          showBalance ? "Ocultar balance" : "Mostrar balance"
                        }
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

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="card-background p-2 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-theme-primary">
                  $
                  {recentTransactions
                    ?.filter((t) => t.type === "deposit")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(0) || "0"}
                </p>
                <p className="text-[10px] text-theme-light leading-tight">
                  Depósitos
                </p>
              </Card>

              <Card className="card-background p-2 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-1">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-theme-primary">
                  $
                  {recentTransactions
                    ?.filter((t) => t.type === "withdrawal")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(0) || "0"}
                </p>
                <p className="text-[10px] text-theme-light leading-tight">
                  Retiros
                </p>
              </Card>

              <Card className="card-background p-2 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 bg-blue-500/20 text-blue-600 rounded-full flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-theme-primary">
                  {recentTransactions?.filter((t) => t.status === "completed")
                    .length || 0}
                </p>
                <p className="text-[10px] text-theme-light leading-tight">
                  Completas
                </p>
              </Card>

              <Card className="card-background p-2 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-theme-primary">
                  {recentTransactions?.filter((t) => t.status === "pending")
                    .length || 0}
                </p>
                <p className="text-[10px] text-theme-light leading-tight">
                  Pendientes
                </p>
              </Card>
            </div>
          </div>

          {/* Columna Derecha: Gráfico de Balance */}
          <div className="h-full">
            <Card className="card-background p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-theme-primary">
                  Historial de Balance
                </h2>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-grow min-h-[300px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </Card>
          </div>
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

export default Wallet;
