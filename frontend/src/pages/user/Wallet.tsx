import { useState, useEffect } from "react";
import { DollarSign, Plus, Minus, Download } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import TransactionDetailModal from "../../components/user/TransactionDetailModal";
import TransactionHistory from "../../components/user/TransactionHistory";
import DepositModal from "../../components/user/DepositModal";
import WithdrawModal from "../../components/user/WithdrawModal";
import { useWallet } from "../../hooks/useApi";
import Card from "../../components/shared/Card";
import type { Transaction as TransactionTypeFull } from "../../types";

type TransactionType =
  | "deposit"
  | "withdrawal"
  | "bet-win"
  | "bet-loss"
  | "bet-refund";
type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: Date;
}

// Registrar componentes de Chart.js (solo una vez en el archivo)
Chart.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

const WalletPage = () => {
  const {
    wallet,
    recentTransactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
  } = useWallet();
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const filteredTransactions =
    recentTransactions?.filter((transaction) => {
      const matchesType =
        filterType === "all" || transaction.type === filterType;
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDate =
        (!dateFrom || transaction.createdAt >= new Date(dateFrom)) &&
        (!dateTo || transaction.createdAt <= new Date(dateTo));
      return matchesType && matchesSearch && matchesDate;
    }) || [];

  const totalBalance = (wallet?.balance || 0) + (wallet?.frozenAmount || 0);

  if (loading) return <LoadingSpinner text="Cargando billetera..." />;
  if (error) return <ErrorMessage error={error} onRetry={fetchWallet} />;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header simplificado */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            Billetera
          </h1>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* Resumen de saldos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card
            variant="data"
            title="Saldo Disponible"
            value={`$${wallet?.balance || 0}`}
            color="green"
            icon={DollarSign}
          />
          <Card
            title="Monto Congelado"
            value={`$${wallet?.frozenAmount || 0}`}
            color="yellow"
          />
          <Card title="Saldo Total" value={`$${totalBalance}`} color="blue" />
        </div>

        {/* Gráfica de evolución de saldo */}
        <div className="mb-6">
          <Line
            data={{
              labels: recentTransactions
                ?.sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                )
                .map((t) => new Date(t.createdAt).toLocaleDateString()),
              datasets: [
                {
                  label: "Saldo",
                  data: recentTransactions
                    ?.sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    )
                    .reduce((acc, t, i) => {
                      const prev = acc[i - 1] ?? totalBalance;
                      let delta = 0;
                      if (
                        t.type === "deposit" ||
                        t.type === "bet-win" ||
                        t.type === "bet-refund"
                      )
                        delta = t.amount;
                      if (t.type === "withdrawal" || t.type === "bet-loss")
                        delta = -t.amount;
                      acc.push((prev ?? 0) + delta);
                      return acc;
                    }, [] as number[]),
                  borderColor: "#2563eb",
                  backgroundColor: "rgba(37,99,235,0.1)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
            height={120}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between mb-4">
          <button
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center"
            onClick={() => setShowDeposit(true)}
          >
            <Plus size={20} className="mr-2" />
            Depositar
          </button>
          <button
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition flex items-center justify-center ml-2"
            onClick={() => setShowWithdraw(true)}
          >
            <Minus size={20} className="mr-2" />
            Retirar
          </button>
        </div>

        {/* Filtros de transacciones */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar transacción..."
            className="border rounded px-3 py-2 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2 w-full mt-2"
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as TransactionType | "all")
            }
          >
            <option value="all">Todos</option>
            <option value="deposit">Depósitos</option>
            <option value="withdrawal">Retiros</option>
            <option value="bet-win">Ganancias</option>
            <option value="bet-loss">Pérdidas</option>
            <option value="bet-refund">Reembolsos</option>
          </select>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="date"
            className="border rounded px-2 py-1 flex-1"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Desde"
          />
          <input
            type="date"
            className="border rounded px-2 py-1 flex-1"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Hasta"
          />
        </div>

        {/* Lista de transacciones */}
        <h3 className="font-semibold mb-2">Historial de Transacciones</h3>
        <TransactionHistory
          transactions={filteredTransactions}
          onSelectTransaction={(tx) => setSelectedTransaction(tx)}
        />

        {/* Botón de exportación */}
        <div className="mt-4">
          <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center w-full">
            <Download size={20} className="mr-2" />
            Exportar Historial
          </button>
        </div>

        {selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction as unknown as TransactionTypeFull}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
        {showDeposit && (
          <DepositModal
            isOpen={showDeposit}
            onClose={() => setShowDeposit(false)}
          />
        )}
        {showWithdraw && (
          <WithdrawModal
            isOpen={showWithdraw}
            onClose={() => setShowWithdraw(false)}
            availableBalance={wallet?.balance || 0}
          />
        )}
      </div>
    </div>
  );
};

export default WalletPage;
