import React, { useState } from "react";
import Modal from "../shared/Modal";
import { Crown } from "lucide-react";

interface SetWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fightId: string;
  onSubmit: (fightId: string, winner: string) => void;
}

const SetWinnerModal: React.FC<SetWinnerModalProps> = ({
  isOpen,
  onClose,
  fightId,
  onSubmit,
}) => {
  const [winner, setWinner] = useState<"red" | "blue" | "draw" | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (winner) {
      onSubmit(fightId, winner);
      onClose();
    }
  };

  const handleCancel = () => {
    setWinner("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="bg-white p-0 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Seleccionar Ganador
          </h3>
        </div>

        <p className="text-gray-600 mb-6">
          Selecciona al ganador de la pelea o el resultado:
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setWinner("red")}
              className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${
                winner === "red"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-red-500 mb-2"></div>
              <span className="font-medium text-gray-700">Gallo Rojo</span>
            </button>

            <button
              type="button"
              onClick={() => setWinner("draw")}
              className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${
                winner === "draw"
                  ? "border-gray-500 bg-gray-100"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-500 mb-2"></div>
              <span className="font-medium text-gray-700">Empate</span>
            </button>

            <button
              type="button"
              onClick={() => setWinner("blue")}
              className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${
                winner === "blue"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 mb-2"></div>
              <span className="font-medium text-gray-700">Gallo Azul</span>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!winner}
              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                !winner
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Registrar Resultado
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SetWinnerModal;
