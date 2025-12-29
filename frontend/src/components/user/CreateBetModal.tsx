import { useState, useEffect } from "react";
import { useBets } from "../../hooks/useApi";
import Modal from "../shared/Modal";
import { DollarSign } from "lucide-react";

const CreateBetModal = ({
  fightId,
  onClose,
}: {
  fightId: string;
  onClose: () => void;
}) => {
  const [amount, setAmount] = useState("");
  const [side, setSide] = useState<"red" | "blue">("red");
  const { createBet } = useBets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBet({ fightId, amount: Number(amount), side });
      onClose();
    } catch (error) {
      console.error("Error creating bet:", error);
    }
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
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateBetModal;
