// Usar solo:
// 1. Formulario básico (monto, lado)
// 2. Llamada a useBets().createBet
// 3. Chips de estado con colores oficiales (#596c95, #cd6263)

import { useState } from "react";
import { useBets } from "../../hooks/useBets";

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#1a1f37] p-6 rounded-lg max-w-md w-full">
        <h3 className="text-white font-bold mb-4">Nueva Apuesta</h3>
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
      </div>
    </div>
  );
};
