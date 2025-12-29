// frontend/src/components/betting/AcceptPagoModal.tsx

import React, { useState } from "react";
import { useBets } from "../../hooks/useApi";
import Modal from "../shared/Modal";
import { Check, X, AlertTriangle, DollarSign, ShieldCheck } from "lucide-react";
import { BetData } from "../../types";

interface AcceptPagoModalProps {
  originalBet: BetData; // The original bet that received the PAGO proposal
  pagoBet: BetData; // The PAGO proposal bet
  onClose: () => void;
  onSuccess: (result: { originalBet: BetData; pagoBet: BetData }) => void;
}

const AcceptPagoModal: React.FC<AcceptPagoModalProps> = ({
  originalBet,
  pagoBet,
  onClose,
  onSuccess,
}) => {
  const { acceptPago, rejectPago } = useBets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getActionErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message) {
      return err.message;
    }

    return `Error al ${
      action === "accept" ? "aceptar" : "rechazar"
    } la propuesta PAGO`;
  };

  const handleSubmit = async () => {
    if (!action) return;

    setLoading(true);
    setError(null);

    try {
      const response =
        action === "accept"
          ? await acceptPago(pagoBet.id)
          : await rejectPago(
              pagoBet.id,
              "Rechazado por el propietario de la apuesta original",
            );

      if (response.success && response.data) {
        onSuccess(response.data);
        onClose();
      } else {
        throw new Error(response.error || "Error procesando la propuesta");
      }
    } catch (err: unknown) {
      console.error(
        `Error ${action === "accept" ? "aceptando" : "rechazando"} propuesta PAGO:`,
        err,
      );
      setError(getActionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Gestionar Propuesta PAGO" onClose={onClose}>
      <div className="space-y-5">
        {/* PAGO Proposal Details */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">
              Propuesta PAGO Recibida
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-blue-700 font-medium">Usuario PAGO:</span>
                <p className="text-blue-900">
                  {pagoBet.userId?.substring(0, 8)}...
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Monto PAGO:</span>
                <p className="text-blue-900">
                  {formatCurrency(pagoBet.amount)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200">
              <span className="text-blue-700 font-medium">Descripción:</span>
              <p className="text-blue-900">
                {pagoBet.userId} quiere pagar ${pagoBet.amount} para cubrir tu
                apuesta de ${originalBet.amount}
              </p>
            </div>
          </div>
        </div>

        {/* Original Bet Details */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Tu Apuesta Original</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-700 font-medium">Lado:</span>
                <p className="text-gray-900">
                  {originalBet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                </p>
              </div>
              <div>
                <span className="text-gray-700 font-medium">Monto:</span>
                <p className="text-gray-900">
                  {formatCurrency(originalBet.amount)}
                </p>
              </div>
            </div>

            <div>
              <span className="text-gray-700 font-medium">Estado:</span>
              <p className="text-gray-900 capitalize">{originalBet.status}</p>
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">¿Qué deseas hacer?</h3>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setAction("accept")}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                action === "accept"
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-green-50 hover:border-green-300"
              }`}
              disabled={loading}
            >
              <Check className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Aceptar Propuesta</div>
                <div className="text-sm">
                  Aceptas que {pagoBet.userId?.substring(0, 8)}... pague $
                  {pagoBet.amount} para cubrir tu apuesta
                </div>
              </div>
            </button>

            <button
              onClick={() => setAction("reject")}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                action === "reject"
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:border-red-300"
              }`}
              disabled={loading}
            >
              <X className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Rechazar Propuesta</div>
                <div className="text-sm">
                  Rechazas la propuesta de {pagoBet.userId?.substring(0, 8)}...
                  para cubrir tu apuesta
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!action || loading}
            className={`flex-1 px-4 py-3 rounded-lg text-white transition-colors font-medium flex items-center justify-center gap-2 ${
              action === "accept"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : action === "accept" ? (
              <>
                <Check className="w-4 h-4" />
                Confirmar Aceptación
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Confirmar Rechazo
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AcceptPagoModal;
