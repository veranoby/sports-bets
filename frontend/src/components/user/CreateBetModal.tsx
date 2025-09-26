// Usar solo:
// 1. Formulario básico (monto, lado)
// 2. Llamada a useBets().createBet
// 3. Chips de estado con colores oficiales (#596c95, #cd6263)

import { useState, useEffect } from "react";
import { useBets } from "../../hooks/useApi";
import Modal from "../shared/Modal";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Bet, BetData } from "../../types";

const CreateBetModal = ({
  fightId,
  onClose,
}: {
  fightId: string;
  onClose: () => void;
}) => {
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState<"red" | "blue">("red");
  const [betType, setBetType] = useState<"flat" | "doy">("flat");
  const [doyAmount, setDoyAmount] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { createBet, getCompatibleBets } = useBets();
  const [suggestions, setSuggestions] = useState<BetData[]>([]);
  const [pagoProposal, setPagoProposal] = useState<{
    bet: BetData;
    amount: string;
  } | null>(null);

  // Validación DOY
  const isDoyValid = betType === "doy" && Number(doyAmount) > Number(amount);

  useEffect(() => {
    if (amount && Number(amount) > 0) {
      const range = Number(amount) * 0.2;
      getCompatibleBets({
        fightId,
        side: side === "red" ? "blue" : "red",
        minAmount: Number(amount) - range,
        maxAmount: Number(amount) + range,
      }).then(response => {
        if (response.success && Array.isArray(response.data.bets)) {
          setSuggestions(response.data.bets as BetData[]);
        }
      });
    }
  }, [amount, side, fightId, getCompatibleBets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBet({ fightId, amount: Number(amount), side });
      onClose();
    } catch (error) {
      console.error("Error creating bet:", error);
    }
  };

  const handleProposePago = (bet: BetData) => {
    setPagoProposal({ bet, amount: "" });
  };

  const handleSubmitPago = async () => {
    if (!pagoProposal || Number(pagoProposal.amount) >= Number(amount)) {
      return; // Validar monto PAGO menor al principal
    }
    await createBet({
      fightId,
      amount: Number(pagoProposal.amount),
      side,
      betType: "flat",
      parentBetId: pagoProposal.bet.id,
    });
    setPagoProposal(null);
    onClose();
  };

  return (
    <Modal title="Create Bet" onClose={onClose}>
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Monto</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#2a325c] text-white p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Lado</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSide("red")}
                className={`flex-1 py-2 rounded ${
                  side === "red" ? "bg-[#cd6263]" : "bg-[#596c95]"
                }`}
              >
                Rojo
              </button>
              <button
                type="button"
                onClick={() => setSide("blue")}
                className={`flex-1 py-2 rounded ${
                  side === "blue" ? "bg-[#596c95]" : "bg-[#cd6263]"
                }`}
              >
                Azul
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-gray-300"
            >
              {showAdvanced ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              {betType === "flat" ? "Apuesta Plana" : "Apuesta DOY"}
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-[#2a325c] rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="flat"
                    checked={betType === "flat"}
                    onChange={() => setBetType("flat")}
                  />
                  <label htmlFor="flat">Plana</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="doy"
                    checked={betType === "doy"}
                    onChange={() => setBetType("doy")}
                  />
                  <label htmlFor="doy">DOY</label>
                </div>

                {betType === "doy" && (
                  <div>
                    <label className="block text-gray-300 mb-1">
                      Monto DOY
                    </label>
                    <input
                      type="number"
                      value={doyAmount}
                      onChange={(e) => setDoyAmount(e.target.value)}
                      className="w-full bg-[#2a325c] text-white p-2 rounded"
                      required
                    />
                    {!isDoyValid && (
                      <p className="text-[#cd6263] text-sm">
                        El monto DOY debe ser mayor al principal
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                betType === "flat" ? "bg-[#596c95]" : "bg-[#cd6263]"
              }`}
            >
              {betType === "flat" ? "Plana" : "DOY"}
            </span>
          </div>
          {betType === "doy" && isDoyValid && (
            <div className="text-gray-300 text-sm">
              Ganancia potencial: {Number(amount) + Number(doyAmount)}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#cd6263] text-white rounded"
            >
              Confirmar
            </button>
          </div>
        </form>
        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-gray-300">Apuestas compatibles</h3>
            {suggestions.map((bet) => (
              <div
                key={bet.id}
                className="flex justify-between items-center p-2 bg-[#2a325c] rounded"
              >
                <span>
                  {bet.amount} - {bet.side === "red" ? "Rojo" : "Azul"}
                </span>
                <button
                  type="button"
                  onClick={() => handleProposePago(bet)}
                  className="px-2 py-1 bg-[#596c95] rounded text-sm"
                >
                  Proponer PAGO
                </button>
              </div>
            ))}
          </div>
        )}
        {pagoProposal && (
          <Modal title="Proponer PAGO" onClose={() => setPagoProposal(null)}>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Monto PAGO</label>
                <input
                  type="number"
                  value={pagoProposal.amount}
                  onChange={(e) =>
                    setPagoProposal({ ...pagoProposal, amount: e.target.value })
                  }
                  className="w-full bg-[#2a325c] text-white p-2 rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPagoProposal(null)}
                  className="px-4 py-2 text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPago}
                  className="px-4 py-2 bg-[#cd6263] text-white rounded"
                  disabled={Number(pagoProposal.amount) >= Number(amount)}
                >
                  Enviar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};

export default CreateBetModal;
