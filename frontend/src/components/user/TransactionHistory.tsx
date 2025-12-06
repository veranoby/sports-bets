import { useState, useMemo } from "react";
import {
  Search,
  CheckCircle,
  Clock,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import StatusChip from "../shared/StatusChip";
import EmptyState from "../shared/EmptyState";

type TransactionType =
  | "deposit"
  | "withdrawal"
  | "bet-win"
  | "bet-loss"
  | "bet-refund"
  | "admin_credit"
  | "admin_debit";
type TransactionStatus = "pending" | "completed" | "failed";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: Date;
}

// Nuevo tipo para configuración
type SortConfig = {
  key: "date" | "amount";
  direction: "asc" | "desc";
};

interface TransactionHistoryProps {
  transactions: Transaction[];
  onSelectTransaction?: (transaction: Transaction) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "desc",
  });

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesType =
        filterType === "all" || transaction.type === filterType;
      const matchesStatus =
        filterStatus === "all" || transaction.status === filterStatus;
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by date

  // Función para manejar ordenamiento
  const requestSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  // Función de ordenamiento optimizada
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortConfig.key === "date") {
        return sortConfig.direction === "desc"
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime();
      } else {
        return sortConfig.direction === "desc"
          ? b.amount - a.amount
          : a.amount - b.amount;
      }
    });
  }, [filteredTransactions, sortConfig]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const currentTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Nuevos iconos por tipo de transacción
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return <ArrowDown className="text-green-500" size={16} />;
      case "withdrawal":
        return <ArrowUp className="text-red-500" size={16} />;
      case "bet-win":
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <Clock className="text-yellow-500" size={16} />;
    }
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No hay transacciones"
        description="No se encontraron transacciones para los filtros seleccionados."
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-bold mb-4">Historial de Transacciones</h2>

      {/* Search and Filters */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Buscar transacción..."
          className="border rounded px-3 py-2 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="ml-2 p-2 bg-blue-400 text-white rounded">
          <Search size={20} />
        </button>
      </div>

      <div className="flex mb-4">
        <select
          className="border rounded px-3 py-2 w-full mr-2"
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as TransactionType | "all")
          }
        >
          <option value="all">Todos los tipos</option>
          <option value="deposit">Depósitos</option>
          <option value="withdrawal">Retiros</option>
          <option value="bet-win">Ganancias</option>
          <option value="bet-loss">Pérdidas</option>
          <option value="bet-refund">Reembolsos</option>
        </select>

        <select
          className="border rounded px-3 py-2 w-full"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as TransactionStatus | "all")
          }
        >
          <option value="all">Todos los estados</option>
          <option value="completed">Completados</option>
          <option value="pending">Pendientes</option>
          <option value="failed">Fallidos</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {currentTransactions.map((transaction) => (
          <div key={transaction.id} className="border rounded overflow-hidden">
            <div
              className={`flex justify-between p-3 cursor-pointer ${
                transaction.status === "completed"
                  ? "bg-green-50"
                  : transaction.status === "pending"
                    ? "bg-yellow-50"
                    : "bg-red-50"
              }`}
              onClick={() => {
                if (onSelectTransaction) {
                  onSelectTransaction(transaction);
                } else {
                  setExpandedId(
                    expandedId === transaction.id ? null : transaction.id,
                  );
                }
              }}
            >
              <div className="flex items-center gap-2">
                {getTransactionIcon(transaction.type)}
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-xs text-gray-500">
                    {transaction.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold ${
                    transaction.type === "withdrawal"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {transaction.type === "withdrawal" ? "-" : "+"}$
                  {transaction.amount}
                </span>
                <StatusChip
                  status={transaction.status as TransactionStatus}
                  size="sm"
                />
                {expandedId === transaction.id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </div>

            {expandedId === transaction.id && (
              <div className="p-3 bg-gray-50 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>ID Transacción:</div>
                  <div className="font-mono">{transaction.id}</div>
                  <div>Estado:</div>
                  <div>
                    <StatusChip
                      status={transaction.status as TransactionStatus}
                      size="sm"
                    />
                  </div>
                  <div>Fecha exacta:</div>
                  <div>{transaction.createdAt.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() =>
            handlePageChange(currentPage > 1 ? currentPage - 1 : 1)
          }
          className="bg-blue-400 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() =>
            handlePageChange(
              currentPage < totalPages ? currentPage + 1 : totalPages,
            )
          }
          className="bg-blue-400 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>

      {/* Controles de ordenamiento */}
      <div className="flex mb-2 gap-2">
        <button
          onClick={() => requestSort("date")}
          className="flex items-center gap-1 text-sm px-3 py-1 border rounded"
        >
          Fecha{" "}
          {sortConfig.key === "date" &&
            (sortConfig.direction === "desc" ? "↓" : "↑")}
        </button>
        <button
          onClick={() => requestSort("amount")}
          className="flex items-center gap-1 text-sm px-3 py-1 border rounded"
        >
          Monto{" "}
          {sortConfig.key === "amount" &&
            (sortConfig.direction === "desc" ? "↓" : "↑")}
        </button>
      </div>
    </div>
  );
};

export default TransactionHistory;
