// frontend/src/components/user/WalletTransactionModal.tsx
// ================================================================
// 🏦 WALLET MODAL UNIFICADO: Reemplaza DepositModal + WithdrawModal
// ⚡ PRESERVA: Todas las funcionalidades específicas de cada modal

import React, { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Modal from "../shared/Modal";


type PaymentMethod = "card" | "transfer";
type TransactionMode = "deposit" | "withdraw";
type DepositStep = "amount" | "payment" | "success";

interface TransactionConfig {
  title: string;
  MIN_AMOUNT: number;
  MAX_AMOUNT: number;
  submitText: string;
  successText: string;
  FEE_PERCENTAGE?: number;
  PROCESSING_FEE?: number;
  HIGH_AMOUNT_THRESHOLD?: number;
  PROCESSING_TIME?: string;
}

interface WalletTransactionModalProps {
  mode: TransactionMode;
  isOpen: boolean;
  onClose: () => void;
  // Deposit specific props
  onDeposit?: (
    amount: number,
    paymentMethod: string,
    paymentData?: Record<string, unknown>,
  ) => Promise<void>;
  // Withdraw specific props
  onWithdraw?: (
    amount: number,
    accountNumber: string,
    accountType?: string,
    bankName?: string,
  ) => Promise<void>;
  availableBalance?: number;
}

const WalletTransactionModal: React.FC<WalletTransactionModalProps> = ({
  mode,
  isOpen,
  onClose,
  onDeposit,
  onWithdraw,
  availableBalance = 0,
}) => {
  // Common states
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(1);

  // Deposit specific states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [step, setStep] = useState<DepositStep>("amount");

  // Withdraw specific states
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [identityVerification, setIdentityVerification] = useState(false);

  // Configuration based on mode
  const config: TransactionConfig = {
    deposit: {
      title: "Depositar Fondos",
      MIN_AMOUNT: 10,
      MAX_AMOUNT: 1000,
      FEE_PERCENTAGE: 0.05,
      submitText: "Procesar Depósito",
      successText: "¡Depósito realizado con éxito!",
    },
    withdraw: {
      title: "Retirar Fondos",
      MIN_AMOUNT: 10,
      MAX_AMOUNT: availableBalance,
      PROCESSING_FEE: 1.5,
      HIGH_AMOUNT_THRESHOLD: 500,
      PROCESSING_TIME: "24-48 horas",
      submitText: "Procesar Retiro",
      successText: "¡Retiro procesado con éxito!",
    },
  }[mode];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setError("Ingrese un monto válido");
      return;
    }
    if (value < config.MIN_AMOUNT || value > config.MAX_AMOUNT) {
      setError(
        `Monto debe ser entre $${config.MIN_AMOUNT} y $${config.MAX_AMOUNT.toFixed?.(2) || config.MAX_AMOUNT}`,
      );
    } else {
      setError(null);
    }
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Common validation
    if (
      isNaN(amount) ||
      amount < config.MIN_AMOUNT ||
      amount > config.MAX_AMOUNT
    ) {
      setError("Ingrese un monto válido");
      return;
    }

    // Mode-specific validation
    if (mode === "withdraw" && !accountNumber) {
      setError("Complete todos los campos correctamente");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "deposit") {
        // Deposit flow
        await onDeposit?.(amount, paymentMethod);
        setTimeout(() => {
          setLoading(false);
          if (Math.random() > 0.2) {
            setConfirmationStep(2);
          } else {
            setError(
              "Pago rechazado. Verifique los datos o intente otro método.",
            );
          }
        }, 2000);
      } else {
        // Withdraw flow
        setTimeout(
          () => {
            setLoading(false);
            if (
              config.HIGH_AMOUNT_THRESHOLD &&
              amount > config.HIGH_AMOUNT_THRESHOLD
            ) {
              setIdentityVerification(true);
            } else {
              setConfirmationStep(2);
            }
          },
          1500 + Math.random() * 1000,
        );
      }
    } catch (error) {
      setLoading(false);
      setError(
        error instanceof Error
          ? error.message
          : "Error procesando la transacción",
      );
    }
  };

  const handleIdentityVerificationComplete = async () => {
    setLoading(true);
    try {
      await onWithdraw?.(amount, accountNumber, accountType, bankName);
      setLoading(false);
      setConfirmationStep(2);
    } catch {
      setLoading(false);
      setError("Error en verificación de identidad");
    }
  };

  const resetForm = () => {
    setAmount(0);
    setError(null);
    setConfirmationStep(1);
    setStep("amount");
    setAccountNumber("");
    setAccountType("");
    setBankName("");
    setIdentityVerification(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getTotalAmount = () => {
    if (mode === "deposit") {
      return amount + amount * (config.FEE_PERCENTAGE || 0);
    } else {
      return amount - (config.PROCESSING_FEE || 0);
    }
  };

  const renderDepositContent = () => {
    if (step === "success") {
      return (
        <div className="text-center py-8">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold mb-2">{config.successText}</h3>
          <p className="text-gray-600">
            Tu depósito será procesado en unos minutos.
          </p>
        </div>
      );
    }

    if (step === "payment") {
      // Payment form has been deprecated, so we'll process the payment directly
      // In a real implementation this would integrate with payment provider
      return (
        <div className="text-center py-8">
          <div className="text-blue-500 text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold mb-2">Procesando Pago</h3>
          <p className="text-gray-600 mb-4">
            Su pago de ${amount} está siendo procesado...
          </p>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Método de Pago
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="card">Tarjeta de Crédito/Débito</option>
            <option value="transfer">Transferencia Bancaria</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Monto a Depositar
          </label>
          <input
            type="number"
            value={amount || ""}
            onChange={handleAmountChange}
            min={config.MIN_AMOUNT}
            max={config.MAX_AMOUNT}
            step="0.01"
            className="w-full p-3 border rounded-lg"
            placeholder={`Mínimo $${config.MIN_AMOUNT}`}
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Monto:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Comisión (5%):</span>
            <span>${(amount * (config.FEE_PERCENTAGE || 0)).toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${getTotalAmount().toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full bg-blue-400 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {config.submitText}
        </button>
      </form>
    );
  };

  const renderWithdrawContent = () => {
    if (confirmationStep === 2) {
      return (
        <div className="text-center py-8">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold mb-2">{config.successText}</h3>
          <p className="text-gray-600">
            Tu retiro será procesado en {config.PROCESSING_TIME || "N/A"}.
          </p>
        </div>
      );
    }

    if (identityVerification) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">
                Verificación Requerida
              </h4>
              <p className="text-sm text-yellow-700">
                Por montos superiores a ${config.HIGH_AMOUNT_THRESHOLD || 0},
                necesitamos verificar tu identidad.
              </p>
            </div>
          </div>

          <button
            onClick={handleIdentityVerificationComplete}
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Completar Verificación
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            Balance disponible:{" "}
            <span className="font-semibold">
              ${availableBalance.toFixed(2)}
            </span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Número de Cuenta *
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Ingrese número de cuenta"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Cuenta (Opcional)
          </label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Seleccione tipo</option>
            <option value="savings">Ahorros</option>
            <option value="checking">Corriente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Banco (Opcional)
          </label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Nombre del banco"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Monto a Retirar
          </label>
          <input
            type="number"
            value={amount || ""}
            onChange={handleAmountChange}
            min={config.MIN_AMOUNT}
            max={config.MAX_AMOUNT}
            step="0.01"
            className="w-full p-3 border rounded-lg"
            placeholder={`Mínimo $${config.MIN_AMOUNT}`}
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Monto:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Comisión:</span>
            <span>${config.PROCESSING_FEE || 0}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Recibirás:</span>
            <span>${getTotalAmount().toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tiempo de procesamiento: {config.PROCESSING_TIME || "N/A"}
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !amount || !accountNumber}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {config.submitText}
        </button>
      </form>
    );
  };

  return (
    <Modal title={config.title} isOpen={isOpen} onClose={handleClose}>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}

      {!loading &&
        (mode === "deposit" ? renderDepositContent() : renderWithdrawContent())}
    </Modal>
  );
};

export default WalletTransactionModal;
