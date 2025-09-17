// Kushki Service for secure payment processing
// Handles card tokenization, validation, and payment flow

interface CardData {
  number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  name: string;
}

interface KushkiTokenResponse {
  token: string;
  brand: string;
  lastFourDigits?: string;
  bin?: string;
}

interface KushkiConfig {
  publicKey: string;
  environment: 'test' | 'production';
}

interface KushkiInstance {
  requestToken: (params: unknown) => Promise<KushkiTokenResponse>;
}

// Declare global Kushki
declare global {
  interface Window {
    Kushki: {
      init: (config: KushkiConfig) => KushkiInstance;
    };
  }
}

let kushkiInstance: KushkiInstance | null = null;

/**
 * Initialize Kushki SDK with environment configuration
 */
export const initializeKushki = async (): Promise<boolean> => {
  try {
    // Check if Kushki SDK is loaded
    if (!window.Kushki) {
      throw new Error('Kushki SDK not loaded. Please include the Kushki script.');
    }

    // Get configuration from environment
    const publicKey = import.meta.env.VITE_KUSHKI_PUBLIC_KEY;
    const environment = import.meta.env.VITE_KUSHKI_ENVIRONMENT || 'test';

    if (!publicKey) {
      throw new Error('Kushki public key not configured. Set VITE_KUSHKI_PUBLIC_KEY environment variable.');
    }

    // Initialize Kushki instance
    kushkiInstance = window.Kushki.init({
      publicKey,
      environment: environment as 'test' | 'production'
    });

    console.log(`Kushki initialized in ${environment} mode`);
    return true;
  } catch (error: unknown) {
    console.error('Failed to initialize Kushki:', error);
    throw new Error(`Failed to initialize Kushki: ${(error as Error).message}`);
  }
};

/**
 * Tokenize card data securely with Kushki
 */
export const tokenizeCard = async (cardData: CardData): Promise<KushkiTokenResponse> => {
  try {
    // Validate required fields
    const requiredFields = ['number', 'expiry_month', 'expiry_year', 'cvv', 'name'];
    for (const field of requiredFields) {
      if (!cardData[field as keyof CardData]) {
        throw new Error(`Missing required card fields: ${field}`);
      }
    }

    // Ensure Kushki is initialized
    if (!kushkiInstance) {
      await initializeKushki();
    }

    if (!kushkiInstance) {
      throw new Error('Kushki not initialized');
    }

    // Sanitize card data
    const sanitizedCard = {
      number: cardData.number.replace(/\s/g, ''), // Remove spaces
      expiryMonth: cardData.expiry_month.padStart(2, '0'), // Ensure 2 digits
      expiryYear: cardData.expiry_year,
      cvv: cardData.cvv,
      name: cardData.name.trim()
    };

    // Validate card data before sending
    if (!validateCardNumber(sanitizedCard.number)) {
      throw new Error('Invalid card number');
    }

    if (!validateExpiryDate(`${sanitizedCard.expiryMonth}/${sanitizedCard.expiryYear}`)) {
      throw new Error('Invalid expiry date');
    }

    if (!validateCVV(sanitizedCard.cvv, getCardType(sanitizedCard.number))) {
      throw new Error('Invalid CVV');
    }

    // Request token from Kushki
    const tokenResponse = await kushkiInstance.requestToken({
      card: sanitizedCard
    });

    return tokenResponse;
  } catch (error: unknown) {
    console.error('Card tokenization failed:', error);
    
    // Handle specific Kushki error codes
    if ((error as { code?: string }).code) {
      switch ((error as { code?: string }).code) {
        case 'E100':
          throw new Error('Invalid card number');
        case 'E101':
          throw new Error('Invalid expiry date');
        case 'E102':
          throw new Error('Invalid CVV');
        case 'E103':
          throw new Error('Invalid cardholder name');
        case 'E104':
          throw new Error('Card has expired');
        case 'E105':
          throw new Error('Card is not supported');
        case 'E106':
          throw new Error('Insufficient funds');
        case 'E107':
          throw new Error('Card is blocked');
        default:
          throw new Error((error as Error).message || 'Payment processing failed');
      }
    }

    throw new Error((error as Error).message || 'Payment processing failed');
  }
};

/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }

  // Remove spaces and non-digits
  const number = cardNumber.replace(/\D/g, '');

  // Check length (13-19 digits for most cards)
  if (number.length < 13 || number.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate expiry date (MM/YY format)
 */
export const validateExpiryDate = (expiryDate: string): boolean => {
  if (!expiryDate || typeof expiryDate !== 'string') {
    return false;
  }

  const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return false;
  }

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000; // Convert YY to YYYY

  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }

  // Check if date is in the future
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
};

/**
 * Validate CVV based on card type
 */
export const validateCVV = (cvv: string, cardType: string = ''): boolean => {
  if (!cvv || typeof cvv !== 'string') {
    return false;
  }

  // Remove non-digits
  const digits = cvv.replace(/\D/g, '');

  // American Express uses 4-digit CVV, others use 3-digit
  const expectedLength = cardType === 'amex' ? 4 : 3;
  
  return digits.length === expectedLength;
};

/**
 * Detect card type from card number
 */
export const getCardType = (cardNumber: string): string => {
  if (!cardNumber) {
    return 'unknown';
  }

  // Remove spaces and non-digits
  const number = cardNumber.replace(/\D/g, '');

  // Card type patterns
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]|^2[2-7]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3[0689]/,
    jcb: /^35/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(number)) {
      return type;
    }
  }

  return 'unknown';
};

/**
 * Format card number with appropriate spacing
 */
export const formatCardNumber = (cardNumber: string): string => {
  if (!cardNumber) {
    return '';
  }

  // Remove all non-digits
  const number = cardNumber.replace(/\D/g, '');
  const cardType = getCardType(number);

  // Limit length based on card type
  const maxLength = cardType === 'amex' ? 15 : 16;
  const limitedNumber = number.slice(0, maxLength);

  // Format based on card type
  if (cardType === 'amex') {
    // American Express: 4-6-5 format
    return limitedNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3')
                       .replace(/(\d{4})(\d{6})(\d{1,5})/, '$1 $2 $3')
                       .replace(/(\d{4})(\d{1,6})/, '$1 $2');
  } else {
    // Other cards: 4-4-4-4 format
    return limitedNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
};

/**
 * Format expiry date with slash (MM/YY)
 */
export const formatExpiryDate = (expiryDate: string): string => {
  if (!expiryDate) {
    return '';
  }

  // Remove non-digits
  const digits = expiryDate.replace(/\D/g, '');
  
  // Limit to 4 digits (MMYY)
  const limitedDigits = digits.slice(0, 4);

  // Add slash after MM
  if (limitedDigits.length >= 2) {
    return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
  }

  return limitedDigits;
};

/**
 * Get user-friendly card type name
 */
export const getCardTypeName = (cardType: string): string => {
  const names: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unknown: 'Unknown'
  };

  return names[cardType] || 'Unknown';
};

/**
 * Get card type icon/class for UI
 */
export const getCardTypeIcon = (cardType: string): string => {
  const icons: Record<string, string> = {
    visa: 'fab fa-cc-visa',
    mastercard: 'fab fa-cc-mastercard',
    amex: 'fab fa-cc-amex',
    discover: 'fab fa-cc-discover',
    diners: 'fab fa-cc-diners-club',
    jcb: 'fab fa-cc-jcb',
    unknown: 'far fa-credit-card'
  };

  return icons[cardType] || icons.unknown;
};

/**
 * Validate complete card data
 */
export const validateCompleteCard = (cardData: Partial<CardData>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  // Validate card number
  if (!cardData.number) {
    errors.number = 'Card number is required';
  } else if (!validateCardNumber(cardData.number)) {
    errors.number = 'Invalid card number';
  }

  // Validate expiry date
  if (!cardData.expiry_month || !cardData.expiry_year) {
    errors.expiry = 'Expiry date is required';
  } else {
    const expiryString = `${cardData.expiry_month.padStart(2, '0')}/${cardData.expiry_year}`;
    if (!validateExpiryDate(expiryString)) {
      errors.expiry = 'Invalid expiry date';
    }
  }

  // Validate CVV
  if (!cardData.cvv) {
    errors.cvv = 'CVV is required';
  } else {
    const cardType = getCardType(cardData.number || '');
    if (!validateCVV(cardData.cvv, cardType)) {
      errors.cvv = 'Invalid CVV';
    }
  }

  // Validate cardholder name
  if (!cardData.name) {
    errors.name = 'Cardholder name is required';
  } else if (cardData.name.trim().length < 2) {
    errors.name = 'Cardholder name is too short';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  initializeKushki,
  tokenizeCard,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  getCardType,
  formatCardNumber,
  formatExpiryDate,
  getCardTypeName,
  getCardTypeIcon,
  validateCompleteCard
};