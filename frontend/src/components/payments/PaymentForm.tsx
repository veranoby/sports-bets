// frontend/src/components/payments/PaymentForm.tsx
import React, { useState } from "react";
import { CreditCard, Lock } from "lucide-react";

import type { KushkiCard } from "../../types/kushki.ts";

import { useKushki } from "../../hooks/useKushki";

interface PaymentFormProps {
  amount: number;
  description: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  description,
  onSuccess,
  onCancel,
}) => {
  const { loading, error, tokenizeCard, processPayment } = useKushki();
  const [cardData, setCardData] = useState<KushkiCard>({
    number: "",
    cvv: "",
    expiryMonth: "",
    expiryYear: "",
    name: "",
  });

  const handleInputChange = (field: keyof KushkiCard, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Tokenizar tarjeta
      const token = await tokenizeCard(cardData);

      // 2. Procesar pago
      const transactionId = await processPayment({
        amount,
        currency: "USD",
        description,
        email: "user@example.com", // En real, obtener del contexto de usuario
        token,
      });

      onSuccess(transactionId);
    } catch (err: any) {
      console.error("Payment failed:", err);
      // El error ya se maneja en el hook
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Procesar Pago</h3>
        <p className="text-gray-600">{description}</p>
        <div className="text-2xl font-bold text-[#cd6263] mt-2">
          ${amount.toFixed(2)} USD
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Número de tarjeta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de tarjeta
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formatCardNumber(cardData.number)}
              onChange={(e) =>
                handleInputChange("number", e.target.value.replace(/\s/g, ""))
              }
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Nombre en tarjeta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre en la tarjeta
          </label>
          <input
            type="text"
            value={cardData.name}
            onChange={(e) =>
              handleInputChange("name", e.target.value.toUpperCase())
            }
            placeholder="JOHN DOE"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
            required
          />
        </div>

        {/* Fecha expiración y CVV */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              value={cardData.expiryMonth}
              onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596c95]"
              required
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month.toString().padStart(2, "0")}>
                  {month.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              value={cardData.expiryYear}
              onChange={(e) => handleInputChange("expiryYear", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596c95]"
              required
            >
              <option value="">AA</option>
              {Array.from(
                { length: 10 },
                (_, i) => new Date().getFullYear() + i,
              ).map((year) => (
                <option key={year} value={year.toString().substr(-2)}>
                  {year.toString().substr(-2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => handleInputChange("cvv", e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596c95]"
                required
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#596c95] text-white px-4 py-2 rounded-lg hover:bg-[#4a5a85] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              `Pagar $${amount.toFixed(2)}`
            )}
          </button>
        </div>
      </form>

      {/* Información de seguridad */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          <Lock className="inline w-3 h-3 mr-1" />
          Pago seguro procesado por Kushki
        </p>
      </div>
    </div>
  );
};

export default PaymentForm;
