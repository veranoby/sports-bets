import { useState } from "react";
import {
  Plus,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  Shield,
} from "lucide-react";
import DataCard from "../shared/DataCard";

// Tipos de apuesta
type BetType = "Ganador" | "KO" | "Ronda Exacta";

type Bet = {
  id: string;
  type: BetType;
  breeder: string;
  amount: number;
  odds: number;
  status: "pendiente" | "aceptada" | "rechazada";
};

type MyBet = Bet & {
  placedAt: string;
};

const MOCK_AVAILABLE_BETS: Bet[] = [
  {
    id: "1",
    type: "Ganador",
    breeder: "El Campeón",
    amount: 500,
    odds: 1.8,
    status: "pendiente",
  },
  {
    id: "2",
    type: "Ganador",
    breeder: "El Retador",
    amount: 300,
    odds: 2.2,
    status: "pendiente",
  },
  {
    id: "3",
    type: "KO",
    breeder: "El Campeón",
    amount: 200,
    odds: 3.5,
    status: "pendiente",
  },
  {
    id: "4",
    type: "Ronda Exacta",
    breeder: "El Retador",
    amount: 100,
    odds: 6.0,
    status: "pendiente",
  },
];

const MOCK_MY_BETS: MyBet[] = [
  {
    id: "5",
    type: "Ganador",
    breeder: "El Campeón",
    amount: 200,
    odds: 1.9,
    status: "aceptada",
    placedAt: "2023-10-15T14:25:00Z",
  },
  {
    id: "6",
    type: "KO",
    breeder: "El Retador",
    amount: 100,
    odds: 4.0,
    status: "pendiente",
    placedAt: "2023-10-15T14:30:00Z",
  },
];

const MOCK_BALANCE = 1000;

interface BettingPanelProps {
  onCreateBet: (betData: {
    fightId: string;
    amount: number;
    side: "red" | "blue";
  }) => Promise<void>;
  fights: Array<{ id: string; name: string }>;
}

const BettingPanel: React.FC<BettingPanelProps> = ({ onCreateBet, fights }) => {
  const [availableBets, setAvailableBets] =
    useState<Bet[]>(MOCK_AVAILABLE_BETS);
  const [myBets, setMyBets] = useState<MyBet[]>(MOCK_MY_BETS);
  const [balance, setBalance] = useState<number>(MOCK_BALANCE);

  // Nueva apuesta
  const [showNewBet, setShowNewBet] = useState(false);
  const [newBetType, setNewBetType] = useState<BetType>("Ganador");
  const [newBetBreeder, setNewBetBreeder] = useState("");
  const [newBetAmount, setNewBetAmount] = useState<number>(0);
  const [newBetOdds, setNewBetOdds] = useState<number>(1.5);

  // Confirmación
  const [confirmAction, setConfirmAction] = useState<null | {
    bet: Bet;
    action: "aceptar" | "crear";
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Agrupar apuestas por tipo
  const groupedBets = availableBets.reduce<Record<BetType, Bet[]>>(
    (acc, bet) => {
      acc[bet.type] = acc[bet.type] || [];
      acc[bet.type].push(bet);
      return acc;
    },
    {} as Record<BetType, Bet[]>
  );

  // Validación de saldo
  const canBet = (amount: number) => balance >= amount;

  // Crear nueva apuesta
  const handleCreateBet = () => {
    if (!newBetBreeder.trim()) {
      setError("Debes ingresar el nombre del criadero.");
      return;
    }
    if (newBetAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    if (!canBet(newBetAmount)) {
      setError("Saldo insuficiente.");
      return;
    }
    setError(null);
    setConfirmAction({
      bet: {
        id: Date.now().toString(),
        type: newBetType,
        breeder: newBetBreeder,
        amount: newBetAmount,
        odds: newBetOdds,
        status: "pendiente",
      },
      action: "crear",
    });
  };

  // Aceptar apuesta existente
  const handleAcceptBet = (bet: Bet) => {
    if (!canBet(bet.amount)) {
      setError("Saldo insuficiente para aceptar esta apuesta.");
      return;
    }
    setError(null);
    setConfirmAction({ bet, action: "aceptar" });
  };

  // Confirmar acción
  const handleConfirm = () => {
    if (!confirmAction) return;
    setLoading(true);
    setTimeout(() => {
      if (confirmAction.action === "aceptar") {
        setMyBets([
          ...myBets,
          {
            ...confirmAction.bet,
            placedAt: new Date().toISOString(),
            status: "aceptada",
          },
        ]);
        setBalance((b) => b - confirmAction.bet.amount);
      } else if (confirmAction.action === "crear") {
        setAvailableBets([...availableBets, confirmAction.bet]);
        setMyBets([
          ...myBets,
          {
            ...confirmAction.bet,
            placedAt: new Date().toISOString(),
            status: "pendiente",
          },
        ]);
        setBalance((b) => b - confirmAction.bet.amount);
        setShowNewBet(false);
        setNewBetBreeder("");
        setNewBetAmount(0);
        setNewBetOdds(1.5);
      }
      setConfirmAction(null);
      setLoading(false);
    }, 1200);
  };

  const [amount, setAmount] = useState(0);
  const [selectedSide, setSelectedSide] = useState<"red" | "blue">("red");

  const handleSubmit = async () => {
    if (fights.length > 0) {
      await onCreateBet({
        fightId: fights[0].id, // O permitir selección
        amount,
        side: selectedSide,
      });
    }
  };

  return (
    <div className="space-y-4">
      <DataCard
        title="Total Bets"
        value={availableBets.length}
        trend="up"
        color="blue"
      />
      <DataCard
        title="Active Bets"
        value={myBets.length}
        trend="neutral"
        color="green"
      />
      <DataCard
        title="Balance"
        value={`$${balance}`}
        trend="neutral"
        color="gray"
      />
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
        {/* Saldo y botón nueva apuesta */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-green-600 font-bold">
            <DollarSign size={20} />
            <span>Saldo: ${balance}</span>
          </div>
          <button
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700 transition"
            onClick={() => setShowNewBet(true)}
          >
            <Plus size={18} />
            Nueva apuesta
          </button>
        </div>

        {/* Lista de apuestas disponibles */}
        <div>
          <h3 className="font-semibold mb-2">Apuestas Disponibles</h3>
          {Object.entries(groupedBets).map(([type, bets]) => (
            <div key={type} className="mb-3">
              <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium">
                <Shield size={16} />
                {type}
              </div>
              <div className="space-y-2">
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between bg-gray-50 rounded p-2"
                  >
                    <div>
                      <div className="font-medium">{bet.breeder}</div>
                      <div className="text-xs text-gray-500">
                        Monto: ${bet.amount} | Cuota: {bet.odds}x
                      </div>
                    </div>
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition"
                      onClick={() => handleAcceptBet(bet)}
                    >
                      Aceptar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mis apuestas activas */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Mis Apuestas Activas</h3>
          {myBets.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No tienes apuestas activas
            </div>
          ) : (
            <div className="space-y-2">
              {myBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between bg-blue-50 rounded p-2"
                >
                  <div>
                    <div className="font-medium">
                      {bet.breeder}{" "}
                      <span className="text-xs text-gray-500">
                        ({bet.type})
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Monto: ${bet.amount} | Cuota: {bet.odds}x
                    </div>
                    <div className="text-xs text-gray-500">
                      Potencial:{" "}
                      <span className="font-bold text-blue-700">
                        ${(bet.amount * bet.odds).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    {bet.status === "aceptada" ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : bet.status === "pendiente" ? (
                      <Loader2
                        className="text-yellow-500 animate-spin"
                        size={20}
                      />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal nueva apuesta */}
        {showNewBet && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNewBet(false)}
              >
                <XCircle size={22} />
              </button>
              <h4 className="font-bold mb-3">Crear Nueva Apuesta</h4>
              <div className="mb-2">
                <label className="block text-xs mb-1">Tipo</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={newBetType}
                  onChange={(e) => setNewBetType(e.target.value as BetType)}
                >
                  <option value="Ganador">Ganador</option>
                  <option value="KO">KO</option>
                  <option value="Ronda Exacta">Ronda Exacta</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-xs mb-1">Criadero</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={newBetBreeder}
                  onChange={(e) => setNewBetBreeder(e.target.value)}
                  placeholder="Nombre del criadero"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs mb-1">Monto</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={newBetAmount}
                  onChange={(e) => setNewBetAmount(Number(e.target.value))}
                  min={1}
                  placeholder="Monto a apostar"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs mb-1">Cuota</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={newBetOdds}
                  onChange={(e) => setNewBetOdds(Number(e.target.value))}
                  min={1}
                  step={0.1}
                  placeholder="Cuota"
                />
              </div>
              <div className="mb-2 text-xs text-blue-700">
                Potencial ganancia:{" "}
                <span className="font-bold">
                  ${(newBetAmount * newBetOdds).toFixed(2)}
                </span>
              </div>
              {error && (
                <div className="text-red-500 text-xs mb-2">{error}</div>
              )}
              <button
                className="w-full bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700 transition"
                onClick={handleCreateBet}
              >
                Crear apuesta
              </button>
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {confirmAction && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-lg">
              <h4 className="font-bold mb-3">
                Confirmar{" "}
                {confirmAction.action === "aceptar"
                  ? "aceptar apuesta"
                  : "nueva apuesta"}
              </h4>
              <div className="mb-2">
                <div className="font-medium">
                  {confirmAction.bet.breeder}{" "}
                  <span className="text-xs text-gray-500">
                    ({confirmAction.bet.type})
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Monto: ${confirmAction.bet.amount} | Cuota:{" "}
                  {confirmAction.bet.odds}x
                </div>
                <div className="text-xs text-blue-700">
                  Potencial ganancia:{" "}
                  <span className="font-bold">
                    $
                    {(
                      confirmAction.bet.amount * confirmAction.bet.odds
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                  onClick={() => setConfirmAction(null)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex items-center justify-center"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <CheckCircle className="mr-2" size={18} />
                  )}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;
