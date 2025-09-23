// frontend/src/hooks/useKushki.ts
import { useState, useCallback } from "react";
import type {
  KushkiCard,
  KushkiResponse,
  PaymentRequest,
} from "../types/kushki.ts";
// Configuración Kushki
const KUSHKI_CONFIG = {
  publicKey: import.meta.env.VITE_KUSHKI_PUBLIC_KEY || "test-public-key",
  environment: (import.meta.env.VITE_KUSHKI_ENVIRONMENT || "sandbox") as
    | "sandbox"
    | "production",
  currency: "USD" as const,
  locale: "es" as const,
};

export const useKushki = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenizeCard = useCallback(
    async (cardData: KushkiCard): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        // En desarrollo, simular tokenización
        if (KUSHKI_CONFIG.environment === "sandbox") {
          // Simular delay de red
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Validaciones básicas
          if (!cardData.number || cardData.number.length < 16) {
            throw new Error("Número de tarjeta inválido");
          }
          if (!cardData.cvv || cardData.cvv.length < 3) {
            throw new Error("CVV inválido");
          }
          if (!cardData.expiryMonth || !cardData.expiryYear) {
            throw new Error("Fecha de expiración inválida");
          }

          // Retornar token simulado
          return `sim_token_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        // Implementación real con Kushki SDK
        // Aquí iría la integración real con el SDK de Kushki
        const response = await fetch("https://api.kushkipagos.com/v1/tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Public-Key": KUSHKI_CONFIG.publicKey,
          },
          body: JSON.stringify({
            card: {
              number: cardData.number.replace(/\s/g, ""),
              cvv: cardData.cvv,
              expiryMonth: cardData.expiryMonth,
              expiryYear: cardData.expiryYear,
              name: cardData.name,
            },
            currency: KUSHKI_CONFIG.currency,
          }),
        });

        const result: KushkiResponse = await response.json();

        if (result.code !== "000") {
          throw new Error(result.message || "Error al procesar la tarjeta");
        }

        return result.token!;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al tokenizar tarjeta";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const processPayment = useCallback(
    async (paymentData: PaymentRequest): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        // Enviar al backend para procesamiento real
        const response = await fetch("/api/wallet/process-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...paymentData,
            provider: "kushki",
            environment: KUSHKI_CONFIG.environment,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Error al procesar pago");
        }

        return result.data.transactionId;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al procesar pago";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    tokenizeCard,
    processPayment,
    config: KUSHKI_CONFIG,
  };
};
