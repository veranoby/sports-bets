import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

const WithdrawModal = ({
  onClose,
  availableBalance,
}: {
  onClose: () => void;
  availableBalance: number;
}) => {
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(1);
  const [identityVerification, setIdentityVerification] = useState(false);

  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = availableBalance; // Limit withdrawal to available balance
  const HIGH_AMOUNT_THRESHOLD = 500;
  const PROCESSING_FEE = 1.5; // Comisión fija simulada
  const PROCESSING_TIME = "24-48 horas";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setError("Ingrese un monto válido");
      return;
    }
    if (value < MIN_AMOUNT || value > MAX_AMOUNT) {
      setError(
        `Monto debe ser entre $${MIN_AMOUNT} y $${MAX_AMOUNT.toFixed(2)}`
      );
    } else {
      setError(null);
    }
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !accountNumber ||
      isNaN(amount) ||
      amount < MIN_AMOUNT ||
      amount > MAX_AMOUNT
    ) {
      setError("Complete todos los campos correctamente");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulación mejorada con timeout variable
    setTimeout(() => {
      setLoading(false);
      if (amount > HIGH_AMOUNT_THRESHOLD) {
        setIdentityVerification(true);
      } else {
        setConfirmationStep(2);
      }
    }, 1500 + Math.random() * 1000); // Simula latencia variable
  };

  const resetForm = () => {
    setAccountNumber("");
    setAmount(0);
    setError(null);
    setConfirmationStep(1);
    setIdentityVerification(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {confirmationStep === 1 ? (
          <>
            <h2 className="text-lg font-bold mb-4">Solicitar Retiro</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm mb-1">
                  Número de Cuenta/IBAN
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  required
                  placeholder="Ingrese su número de cuenta"
                />
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
                  placeholder={`$${MIN_AMOUNT} - $${MAX_AMOUNT}`}
                  required
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <div className="mb-4 space-y-1 text-sm">
                <p className="text-gray-600">
                  Comisión:{" "}
                  <span className="font-medium">
                    ${PROCESSING_FEE.toFixed(2)}
                  </span>
                </p>
                <p className="text-gray-600">
                  Recibirás:{" "}
                  <span className="font-medium">
                    ${(amount - PROCESSING_FEE).toFixed(2)}
                  </span>
                </p>
                <p className="text-gray-600">
                  Tiempo de procesamiento:{" "}
                  <span className="font-medium">{PROCESSING_TIME}</span>
                </p>
              </div>

              <button
                type="submit"
                className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition ${
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
                  "Confirmar Retiro"
                )}
              </button>
            </form>
          </>
        ) : (
          <div aria-live="polite">
            <h3 className="text-lg font-bold text-green-600 mb-2">
              ¡Retiro solicitado!
            </h3>
            <p>
              Monto: <span className="font-semibold">${amount.toFixed(2)}</span>
            </p>
            <p>
              Número de cuenta:{" "}
              <span className="font-semibold">{accountNumber}</span>
            </p>
            <p>Tiempo estimado: {PROCESSING_TIME}</p>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Finalizar
            </button>
          </div>
        )}

        {identityVerification && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-bold text-yellow-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Verificación requerida
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Para retiros superiores a ${HIGH_AMOUNT_THRESHOLD}, debe verificar
              su identidad.
            </p>
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                  setIdentityVerification(false);
                  setConfirmationStep(2);
                }, 2000);
              }}
              className="mt-3 w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition flex justify-center items-center"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : null}
              Verificar Identidad
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;
