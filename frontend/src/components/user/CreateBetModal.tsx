// Usar solo:
// 1. Formulario básico (monto, lado)
// 2. Llamada a useBets().createBet
// 3. Chips de estado con colores oficiales (#596c95, #cd6263)

import { useState, useEffect } from "react";
import { useBets } from "../../hooks/useApi";
import Modal from "../shared/Modal";
import { ChevronDown, ChevronUp, DollarSign, Zap, Users } from "lucide-react";
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
      }).then((response) => {
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
    <Modal title="Crear Apuesta" onClose={onClose}>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Monto */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Monto
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#2a325c] text-white p-3 pl-10 rounded-lg border border-[#596c95] focus:outline-none focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
                required
                placeholder="Ingresa el monto de tu apuesta"
              />
            </div>
          </div>

          {/* Lado */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Lado</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSide("red")}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                  side === "red"
                    ? "bg-red-500/20 border-2 border-red-500 text-red-400 font-medium"
                    : "bg-[#2a325c] border border-[#596c95] text-gray-300 hover:bg-[#596c95]/20"
                }`}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Rojo</span>
              </button>
              <button
                type="button"
                onClick={() => setSide("blue")}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                  side === "blue"
                    ? "bg-blue-500/20 border-2 border-blue-500 text-blue-600 font-medium"
                    : "bg-[#2a325c] border border-[#596c95] text-gray-300 hover:bg-[#596c95]/20"
                }`}
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Azul</span>
              </button>
            </div>
          </div>

          {/* Tipo de apuesta */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full p-3 bg-[#2a325c] rounded-lg border border-[#596c95] text-gray-300 hover:bg-[#596c95]/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span className="font-medium">
                  {betType === "flat" ? "Apuesta Plana" : "Apuesta DOY"}
                </span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-[#2a325c] rounded-lg border border-[#596c95]">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="flat"
                    checked={betType === "flat"}
                    onChange={() => setBetType("flat")}
                    className="w-4 h-4 text-[#596c95] bg-[#2a325c] border-[#596c95] focus:ring-[#596c95] focus:ring-2"
                  />
                  <label htmlFor="flat" className="text-gray-300">
                    <span className="font-medium">Plana</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Apuesta estándar sin condiciones especiales
                    </p>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="doy"
                    checked={betType === "doy"}
                    onChange={() => setBetType("doy")}
                    className="w-4 h-4 text-[#cd6263] bg-[#2a325c] border-[#596c95] focus:ring-[#cd6263] focus:ring-2"
                  />
                  <label htmlFor="doy" className="text-gray-300">
                    <span className="font-medium">DOY</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Si pierdes, recuperas tu apuesta original
                    </p>
                  </label>
                </div>

                {betType === "doy" && (
                  <div className="pt-3 border-t border-[#596c95]">
                    <label className="block text-gray-300 mb-2 font-medium">
                      Monto DOY
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={doyAmount}
                        onChange={(e) => setDoyAmount(e.target.value)}
                        className="w-full bg-[#2a325c] text-white p-3 pl-10 rounded-lg border border-[#596c95] focus:outline-none focus:ring-2 focus:ring-[#cd6263] focus:border-transparent"
                        required
                        placeholder="Monto adicional para DOY"
                      />
                    </div>
                    {!isDoyValid && (
                      <p className="text-[#cd6263] text-sm mt-2 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        El monto DOY debe ser mayor al principal
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chip de tipo de apuesta */}
          <div className="flex justify-center">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                betType === "flat"
                  ? "bg-[#596c95]/20 text-[#596c95] border border-[#596c95]"
                  : "bg-[#cd6263]/20 text-[#cd6263] border border-[#cd6263]"
              }`}
            >
              {betType === "flat" ? "APUESTA PLANA" : "APUESTA DOY"}
            </span>
          </div>

          {/* Ganancia potencial */}
          {betType === "doy" && isDoyValid && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    Ganancia Potencial
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  ${(Number(amount) + Number(doyAmount)).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Incluye tu apuesta original + ganancia DOY
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#cd6263] hover:bg-[#cd6263]/90 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
              disabled={betType === "doy" && !isDoyValid}
            >
              Confirmar
            </button>
          </div>
        </form>

        {/* Apuestas compatibles */}
        {suggestions.length > 0 && (
          <div className="mt-2 pt-4 border-t border-[#596c95]">
            <h3 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Apuestas compatibles
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestions.map((bet) => (
                <div
                  key={bet.id}
                  className="flex justify-between items-center p-3 bg-[#2a325c] rounded-lg border border-[#596c95] hover:bg-[#596c95]/20 transition-colors"
                >
                  <div>
                    <div className="font-medium text-white">
                      ${bet.amount} -{" "}
                      {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {bet.id.substring(0, 8)}...
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProposePago(bet)}
                    className="px-3 py-2 bg-[#596c95] hover:bg-[#596c95]/80 text-white rounded-lg text-sm transition-colors"
                  >
                    Proponer PAGO
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de propuesta PAGO */}
        {pagoProposal && (
          <Modal title="Proponer PAGO" onClose={() => setPagoProposal(null)}>
            <div className="space-y-5">
              <div className="p-4 bg-[#2a325c] rounded-lg border border-[#596c95]">
                <div className="font-medium text-white mb-2">
                  Apuesta Original: ${amount} -{" "}
                  {side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                </div>
                <div className="text-sm text-gray-400">
                  ID: {pagoProposal.bet.id.substring(0, 8)}...
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Monto PAGO
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={pagoProposal.amount}
                    onChange={(e) =>
                      setPagoProposal({
                        ...pagoProposal,
                        amount: e.target.value,
                      })
                    }
                    className="w-full bg-[#2a325c] text-white p-3 pl-10 rounded-lg border border-[#596c95] focus:outline-none focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
                    required
                    placeholder="Monto menor al principal"
                    max={Number(amount) - 0.01}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  El monto PAGO debe ser menor a tu apuesta principal (${amount}
                  )
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPagoProposal(null)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPago}
                  className="flex-1 px-4 py-3 bg-[#cd6263] hover:bg-[#cd6263]/90 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                  disabled={
                    Number(pagoProposal.amount) >= Number(amount) ||
                    !pagoProposal.amount
                  }
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
