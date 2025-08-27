// ✅ CONTENIDO CORRECTO - COPIAR EXACTAMENTE:
export interface KushkiConfig {
  publicKey: string;
  environment: "sandbox" | "production";
  currency: "USD";
  locale: "es" | "en";
}

export interface KushkiCard {
  number: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  name: string;
}

export interface KushkiResponse {
  code: string;
  message: string;
  token?: string;
  transaction_id?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: "USD";
  description: string;
  email: string;
  token?: string;
}
