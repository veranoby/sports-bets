import { useState } from "react";
import {
  DollarSign,
  Plus,
  Minus,
  Download,
  Loader2,
  ArrowLeft,
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
} from "chart.js";
import { useNavigate } from "react-router-dom";

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

const MOCK_BALANCE = {
  available: 1200,
  frozen: 300,
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: 500,
    status: "completed",
    description: "Depósito inicial",
    createdAt: new Date("2023-10-01"),
  },
  {
    id: "2",
    type: "withdrawal",
    amount: 200,
    status: "completed",
    description: "Retiro a cuenta bancaria",
    createdAt: new Date("2023-10-05"),
  },
  {
    id: "3",
    type: "bet-win",
    amount: 150,
    status: "completed",
    description: "Ganancia de apuesta",
    createdAt: new Date("2023-10-10"),
  },
  {
    id: "4",
    type: "bet-loss",
    amount: 100,
    status: "completed",
    description: "Pérdida de apuesta",
    createdAt: new Date("2023-10-12"),
  },
  {
    id: "5",
    type: "withdrawal",
    amount: 50,
    status: "pending",
    description: "Retiro en proceso",
    createdAt: new Date("2023-10-15"),
  },
  {
    id: "6",
    type: "bet-refund",
    amount: 100,
    status: "failed",
    description: "Reembolso de apuesta",
    createdAt: new Date("2023-10-16"),
  },
];

// Registrar componentes de Chart.js (solo una vez en el archivo)
Chart.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

const Wallet = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDate =
      (!dateFrom || transaction.createdAt >= new Date(dateFrom)) &&
      (!dateTo || transaction.createdAt <= new Date(dateTo));
    return matchesType && matchesSearch && matchesDate;
  });

  const totalBalance = MOCK_BALANCE.available + MOCK_BALANCE.frozen;

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
        <div className="flex justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold">Saldo Disponible</span>
            <span className="text-2xl text-green-600">
              <DollarSign size={16} className="inline mr-1" />$
              {MOCK_BALANCE.available}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Monto Congelado</span>
            <span className="text-2xl text-yellow-600">
              ${MOCK_BALANCE.frozen}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Saldo Total</span>
            <span className="text-2xl text-blue-600">${totalBalance}</span>
          </div>
        </div>

        {/* Gráfica de evolución de saldo */}
        <div className="mb-6">
          <Line
            data={{
              labels: transactions
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                .map((t) => t.createdAt.toLocaleDateString()),
              datasets: [
                {
                  label: "Saldo",
                  data: transactions
                    .sort(
                      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                    )
                    .reduce((acc, t, i) => {
                      const prev =
                        acc[i - 1] ??
                        MOCK_BALANCE.available + MOCK_BALANCE.frozen;
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
          <button className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center">
            <Plus size={20} className="mr-2" />
            Depositar
          </button>
          <button className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition flex items-center justify-center ml-2">
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
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No hay transacciones que mostrar
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex justify-between p-3 rounded ${
                  transaction.status === "completed"
                    ? "bg-green-50"
                    : transaction.status === "pending"
                    ? "bg-yellow-50"
                    : "bg-red-50"
                }`}
              >
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-xs text-gray-500">
                    {transaction.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`font-bold ${
                    transaction.type === "withdrawal"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {transaction.type === "withdrawal" ? "-" : "+"}$
                  {transaction.amount}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botón de exportación */}
        <div className="mt-4">
          <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center w-full">
            <Download size={20} className="mr-2" />
            Exportar Historial
          </button>
        </div>

        {loading && <Loader2 className="animate-spin" size={20} />}
      </div>
    </div>
  );
};

export default Wallet;
