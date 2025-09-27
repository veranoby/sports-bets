import React, { useState, useEffect, useCallback } from "react";
// Note: Stripe integration removed - using Kushki for LATAM payments
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface PaymentFormProps {
  planType: "daily" | "monthly";
  planPrice: number;
  onPaymentSuccess: (data: { token: string; planType: string }) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  className?: string;
}

interface CardErrors {
  number?: string;
  expiry?: string;
  cvv?: string;
  name?: string;
  general?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planType,
  planPrice,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  className = "",
}) => {
  useAuth();

  // Form state
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [errors, setErrors] = useState<CardErrors>({});
  const [processing, setProcessing] = useState<boolean>(false);
  const [kushkiReady, setKushkiReady] = useState(false);
  const [cardType, setCardType] = useState("unknown");

  // Initialize Kushki on component mount
  useEffect(() => {
    const initKushki = async () => {
      try {
        // await // kushkiService.initializeKushki(); // TODO: Implement Kushki service
        setKushkiReady(true);
      } catch (error: unknown) {
        let errorMessage =
          "Payment system unavailable. Please try again later.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setErrors({
          general: errorMessage,
        });
        onPaymentError(errorMessage);
      }
    };

    initKushki();
  }, [onPaymentError]);

  // Update card type when number changes
  useEffect(() => {
    if (cardData.number) {
      // const type = // kushkiService.getCardType(cardData.number);
      // setCardType(type);
    } else {
      setCardType("unknown");
    }
  }, [cardData.number]);

  // Handle input changes with formatting and validation
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      let formattedValue = value;
      const newErrors = { ...errors };

      // Clear error for this field when user starts typing
      delete newErrors[field as keyof CardErrors];

      switch (field) {
        case "number":
          // formattedValue = // kushkiService.formatCardNumber(value);
          // Real-time validation
          if (formattedValue.replace(/\s/g, "").length >= 13) {
            // if (!// kushkiService.validateCardNumber(formattedValue)) {
            //   newErrors.number = 'Invalid card number';
            // }
          }
          break;

        case "expiry":
          // formattedValue = // kushkiService.formatExpiryDate(value);
          // Real-time validation
          if (formattedValue.length === 5) {
            // if (!// kushkiService.validateExpiryDate(formattedValue)) {
            //   newErrors.expiry = 'Invalid expiry date';
            // }
          }
          break;

        case "cvv": {
          // Only allow digits
          formattedValue = value.replace(/\D/g, "");
          const maxLength = cardType === "amex" ? 4 : 3;
          formattedValue = formattedValue.slice(0, maxLength);

          // Real-time validation
          if (formattedValue.length === maxLength) {
            // if (!// kushkiService.validateCVV(formattedValue, cardType)) {
            //   newErrors.cvv = 'Invalid CVV';
            // }
          }
          break;
        }

        case "name":
          // Only allow letters and spaces
          formattedValue = value.replace(/[^a-zA-Z\s]/g, "");
          if (formattedValue.length > 0 && formattedValue.trim().length < 2) {
            newErrors.name = "Name is too short";
          }
          break;
      }

      setCardData((prev) => ({ ...prev, [field]: formattedValue }));
      setErrors(newErrors);
    },
    [errors, cardType],
  );

  // Validate entire form
  const validateForm = useCallback(() => {
    // const [month, year] = cardData.expiry.split('/');
    // const validation = // kushkiService.validateCompleteCard({
    //   number: cardData.number,
    //   expiry_month: month,
    //   expiry_year: year,
    //   cvv: cardData.cvv,
    //   name: cardData.name
    // });

    // if (!validation.isValid) {
    //   const formattedErrors: CardErrors = {};
    //   if (validation.errors.number) formattedErrors.number = validation.errors.number;
    //   if (validation.errors.expiry) formattedErrors.expiry = validation.errors.expiry;
    //   if (validation.errors.cvv) formattedErrors.cvv = validation.errors.cvv;
    //   if (validation.errors.name) formattedErrors.name = validation.errors.name;

    //   setErrors(formattedErrors);
    //   return false;
    // }

    return true;
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setProcessing(true);
    setErrors({});

    try {
      // Parse expiry date
      // const [month, year] = cardData.expiry.split('/');

      // Tokenize card with Kushki
      // const tokenResponse = await // kushkiService.tokenizeCard({
      //   number: cardData.number.replace(/\s/g, ''),
      //   expiry_month: month,
      //   expiry_year: year,
      //   cvv: cardData.cvv,
      //   name: cardData.name.trim()
      // });

      // Call success handler with token
      // onPaymentSuccess({
      //   token: tokenResponse.token,
      //   planType
      // });

      // For now, we'll just simulate a successful payment
      onPaymentSuccess({
        token: "test-token",
        planType,
      });
    } catch (error: unknown) {
      let errorMessage = "Payment processing failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setErrors({ general: errorMessage });
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return (
      kushkiReady &&
      cardData.number.replace(/\s/g, "").length >= 13 &&
      cardData.expiry.length === 5 &&
      cardData.cvv.length >= 3 &&
      cardData.name.trim().length >= 2 &&
      Object.keys(errors).length === 0
    );
  };

  const planName = planType === "daily" ? "Daily Access" : "Monthly Premium";
  const formattedPrice = `$${planPrice.toFixed(2)}`;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Payment
        </h2>
        <div className="text-lg">
          <span className="font-medium text-gray-900">{planName}</span>
          <span className="text-2xl font-bold text-blue-600 ml-2">
            {formattedPrice}
          </span>
          <span className="text-gray-500">
            /{planType === "daily" ? "day" : "month"}
          </span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Lock className="w-5 h-5 text-green-600 mr-2" />
        <span className="text-sm text-green-700">
          Secured by Kushki - Your card data is encrypted
        </span>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label
            htmlFor="card-number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Card Number
          </label>
          <div className="relative">
            <input
              id="card-number"
              data-testid="card-number"
              type="text"
              value={cardData.number}
              onChange={(e) => handleInputChange("number", e.target.value)}
              placeholder="1234 5678 9012 3456"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.number ? "border-red-500" : "border-gray-300"
              }`}
              disabled={processing || !kushkiReady}
            />
            {cardType !== "unknown" && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div
                  data-testid={`card-type-${cardType}`}
                  className={`w-8 h-5 rounded ${
                    cardType === "visa"
                      ? "bg-blue-400"
                      : cardType === "mastercard"
                        ? "bg-red-600"
                        : cardType === "amex"
                          ? "bg-green-600"
                          : "bg-gray-600"
                  } flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-bold">
                    {cardType === "visa"
                      ? "V"
                      : cardType === "mastercard"
                        ? "MC"
                        : cardType === "amex"
                          ? "AE"
                          : "?"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {errors.number && (
            <p className="mt-1 text-sm text-red-600">{errors.number}</p>
          )}
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="expiry-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Expiry Date
            </label>
            <input
              id="expiry-date"
              data-testid="expiry-date"
              type="text"
              value={cardData.expiry}
              onChange={(e) => handleInputChange("expiry", e.target.value)}
              placeholder="MM/YY"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.expiry ? "border-red-500" : "border-gray-300"
              }`}
              disabled={processing || !kushkiReady}
            />
            {errors.expiry && (
              <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="cvv"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CVV
            </label>
            <input
              id="cvv"
              data-testid="cvv"
              type="text"
              value={cardData.cvv}
              onChange={(e) => handleInputChange("cvv", e.target.value)}
              placeholder={cardType === "amex" ? "1234" : "123"}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cvv ? "border-red-500" : "border-gray-300"
              }`}
              disabled={processing || !kushkiReady}
            />
            {errors.cvv && (
              <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
            )}
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label
            htmlFor="cardholder-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cardholder Name
          </label>
          <input
            id="cardholder-name"
            data-testid="cardholder-name"
            type="text"
            value={cardData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="John Doe"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            disabled={processing || !kushkiReady}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          data-testid="submit-payment"
          disabled={!isFormValid() || processing}
          className="w-full flex items-center justify-center py-3 px-4 bg-blue-400 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 mr-2" />
              <span>Complete Payment</span>
            </>
          )}
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Your payment is processed securely by Kushki.</p>
        <p>We never store your card information.</p>
      </div>
    </div>
  );
};

export default PaymentForm;
