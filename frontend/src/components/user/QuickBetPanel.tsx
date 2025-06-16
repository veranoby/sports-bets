import React, { useState } from "react";
import { useBets, useWallet } from "../../hooks/useApi";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import type { Bet, BetSide } from "../../types";

const QuickBetPanel: React.FC = () => {
  const { placeBet } = useBets();
  const { balance } = useWallet();
  const theme = getUserThemeClasses();

  const [amount, setAmount] = useState<number>(0);
  const [selectedSide, setSelectedSide] = useState<BetSide>("red");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? 0 : value);
  };

  const handleSideChange = (side: BetSide) => {
    setSelectedSide(side);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (amount <= 0) {
      setError("El monto debe ser mayor que cero.");
      setIsSubmitting(false);
      return;
    }

    if (amount > balance) {
      setError("Saldo insuficiente.");
      setIsSubmitting(false);
      return;
    }

    try {
      await placeBet({
        amount,
        side: selectedSide,
      });
      setAmount(0);
    } catch (err) {
      setError("Error al realizar la apuesta. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${theme.cardBackground} shadow-md`}>
      <h2 className="text-xl font-bold mb-4 text-white">Apuesta Rápida</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Monto
          </label>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className={`w-full p-2 rounded-md ${theme.inputBackground} text-white`}
            placeholder="Ingresa el monto"
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Selecciona un lado
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${
                selectedSide === "red" ? "bg-red-500" : "bg-gray-600"
              } text-white`}
              onClick={() => handleSideChange("red")}
            >
              Rojo
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${
                selectedSide === "blue" ? "bg-blue-500" : "bg-gray-600"
              } text-white`}
              onClick={() => handleSideChange("blue")}
            >
              Azul
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded-md ${
            isSubmitting ? "bg-gray-500" : "bg-[#596c95]"
          } text-white font-semibold`}
        >
          {isSubmitting ? "Procesando..." : "Apostar"}
        </button>
      </form>
    </div>
  );
};

export default QuickBetPanel;
