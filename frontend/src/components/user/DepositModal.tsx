import { useState } from "react";
import { Loader2 } from "lucide-react";

type PaymentMethod = "card" | "transfer";

const DepositModal = ({ onClose }: { onClose: () => void }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(1);

  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = 1000;
  const FEE_PERCENTAGE = 0.05;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setError("Ingrese un monto válido");
      return;
    }
    if (value < MIN_AMOUNT || value > MAX_AMOUNT) {
      setError(`Monto debe ser entre $${MIN_AMOUNT} y $${MAX_AMOUNT}`);
    } else {
      setError(null);
    }
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(amount) || amount === 0) {
      setError("Ingrese un monto válido");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulación de API con casos de éxito/error
    setTimeout(() => {
      setLoading(false);
      if (Math.random() > 0.2) {
        setConfirmationStep(2);
      } else {
        setError("Pago rechazado. Verifique los datos o intente otro método.");
      }
    }, 2000);
  };

  const resetForm = () => {
    setAmount(0);
    setError(null);
    setConfirmationStep(1);
  };

  const totalAmount = amount + amount * FEE_PERCENTAGE;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {confirmationStep === 1 ? (
          <>
            <h2 className="text-lg font-bold mb-4">Realizar Depósito</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="border rounded px-3 py-2 w-full"
                  aria-label="Método de pago"
                >
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">Monto (USD)</label>
                <input
                  type="number"
                  value={amount || ""}
                  onChange={handleAmountChange}
                  className="border rounded px-3 py-2 w-full"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.01"
                  placeholder={`$${MIN_AMOUNT} - $${MAX_AMOUNT}`}
                  aria-invalid={!!error}
                />
                {error && (
                  <p
                    className="text-red-500 text-xs mt-1"
                    aria-live="assertive"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm">
                  Comisión (5%): ${(amount * FEE_PERCENTAGE).toFixed(2)}
                </p>
                <p className="font-bold">
                  Total a depositar:{" "}
                  <span aria-live="polite">${totalAmount.toFixed(2)}</span>
                </p>
              </div>

              <button
                type="submit"
                className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex justify-center items-center ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Depósito"
                )}
              </button>
            </form>
          </>
        ) : (
          <div aria-live="polite">
            <h3 className="text-lg font-bold text-green-600 mb-2">
              ¡Depósito exitoso!
            </h3>
            <div className="mb-4 space-y-1">
              <p>
                Monto:{" "}
                <span className="font-semibold">${amount.toFixed(2)}</span>
              </p>
              <p>
                Método:{" "}
                <span className="font-semibold">
                  {paymentMethod === "card" ? "Tarjeta" : "Transferencia"}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                ID de transacción:{" "}
                {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Finalizar
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition"
              >
                Nuevo Depósito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
