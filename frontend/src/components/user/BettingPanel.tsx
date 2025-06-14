import { useState } from "react";
import { Plus, CheckCircle, Loader2 } from "lucide-react";
import DataCard from "../shared/DataCard";
import Modal from "../shared/Modal";
import ErrorMessage from "../shared/ErrorMessage";
import { useBets, useWallet } from "../../hooks/useApi";
import LoadingSpinner from "../shared/LoadingSpinner";

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

const BettingPanel: React.FC = () => {
  const {
    bets: availableBets,
    loading: betsLoading,
    error: betsError,
    createBet,
    acceptBet,
    fetchMyBets,
    fetchAvailableBets,
  } = useBets();
  const { wallet, loading: walletLoading, error: walletError } = useWallet();

  // Nueva apuesta
  const [showNewBet, setShowNewBet] = useState(false);
  const [newBetAmount, setNewBetAmount] = useState<number>(0);
  const [newBetSide, setNewBetSide] = useState<"red" | "blue">("red");
  const [confirmAction, setConfirmAction] = useState<null | {
    betId?: string;
    action: "aceptar" | "crear";
  }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validación de saldo
  const canBet = (amount: number) => (wallet?.balance || 0) >= amount;

  // Crear nueva apuesta
  const handleCreateBet = async () => {
    if (newBetAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    if (!canBet(newBetAmount)) {
      setError("Saldo insuficiente.");
      return;
    }
    setError(null);
    setConfirmAction({ action: "crear" });
  };

  // Aceptar apuesta existente
  const handleAcceptBet = (betId: string, amount: number) => {
    if (!canBet(amount)) {
      setError("Saldo insuficiente para aceptar esta apuesta.");
      return;
    }
    setError(null);
    setConfirmAction({ betId, action: "aceptar" });
  };

  // Confirmar acción
  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      if (confirmAction.action === "aceptar" && confirmAction.betId) {
        await acceptBet(confirmAction.betId);
        await fetchMyBets({});
        await fetchAvailableBets({});
      } else if (confirmAction.action === "crear") {
        await createBet({
          fightId: "current-fight-id", // TODO: parametrizar correctamente
          side: newBetSide,
          amount: newBetAmount,
        });
        await fetchMyBets({});
        await fetchAvailableBets({});
        setShowNewBet(false);
        setNewBetAmount(0);
        setNewBetSide("red");
      }
      setConfirmAction(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar la apuesta");
    } finally {
      setLoading(false);
    }
  };

  if (betsLoading || walletLoading)
    return <LoadingSpinner text="Cargando apuestas..." />;
  if (betsError || walletError)
    return <ErrorMessage error={betsError || walletError || "Error"} />;

  return (
    <div className="space-y-4">
      <DataCard
        title="Apuestas Disponibles"
        value={availableBets.length}
        trend="up"
        color="blue"
      />
      <DataCard
        title="Saldo"
        value={`$${wallet?.balance?.toFixed(2) || 0}`}
        trend="neutral"
        color="gray"
      />
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
        {/* Saldo y botón nueva apuesta */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-green-600 font-bold">
            <span>Saldo: ${wallet?.balance?.toFixed(2) || 0}</span>
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
          {availableBets.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No hay apuestas disponibles
            </div>
          ) : (
            <div className="space-y-2">
              {availableBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between bg-gray-50 rounded p-2"
                >
                  <div>
                    <div className="font-medium">
                      {bet.fighterNames?.red} vs {bet.fighterNames?.blue}
                    </div>
                    <div className="text-xs text-gray-500">
                      Monto: ${bet.amount} | Cuota: {bet.odds}x
                    </div>
                  </div>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition"
                    onClick={() => handleAcceptBet(bet.id, bet.amount)}
                  >
                    Aceptar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal nueva apuesta */}
        {showNewBet && (
          <Modal
            title="Crear Nueva Apuesta"
            isOpen={showNewBet}
            onClose={() => setShowNewBet(false)}
          >
            <div className="mb-2">
              <label className="block text-xs mb-1">Lado</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={newBetSide}
                onChange={(e) =>
                  setNewBetSide(e.target.value as "red" | "blue")
                }
              >
                <option value="red">Rojo</option>
                <option value="blue">Azul</option>
              </select>
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
            <div className="mb-2 text-xs text-blue-700">
              Potencial ganancia:{" "}
              <span className="font-bold">
                ${(newBetAmount * 2).toFixed(2)}
              </span>
            </div>
            {error && <ErrorMessage error={error} />}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                onClick={() => setShowNewBet(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                onClick={handleCreateBet}
              >
                Crear apuesta
              </button>
            </div>
          </Modal>
        )}

        {/* Modal de confirmación */}
        {confirmAction && (
          <Modal
            title={
              confirmAction.action === "aceptar"
                ? "Confirmar aceptar apuesta"
                : "Confirmar nueva apuesta"
            }
            isOpen={!!confirmAction}
            onClose={() => setConfirmAction(null)}
          >
            <div className="mb-2">
              {confirmAction.action === "aceptar" ? (
                <div>Aceptarás la apuesta seleccionada. ¿Confirmar?</div>
              ) : (
                <div>
                  Nueva apuesta por <b>${newBetAmount}</b> al lado{" "}
                  <b>{newBetSide === "red" ? "Rojo" : "Azul"}</b>.
                </div>
              )}
            </div>
            {error && <ErrorMessage error={error} />}
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
          </Modal>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;
