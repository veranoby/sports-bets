import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as kushkiService from '../kushkiService';

// Mock the global Kushki object
const mockKushki = {
  requestToken: vi.fn(),
  setEnvironment: vi.fn(),
  init: vi.fn()
};

// Mock window.Kushki
Object.defineProperty(window, 'Kushki', {
  value: mockKushki,
  writable: true,
  configurable: true
});

describe('KushkiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    import.meta.env.VITE_KUSHKI_PUBLIC_KEY = 'pk_test_123456';
    import.meta.env.VITE_KUSHKI_ENVIRONMENT = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeKushki', () => {
    it('initializes Kushki with correct configuration', async () => {
      mockKushki.init.mockReturnValue(mockKushki);

      const result = await kushkiService.initializeKushki();

      expect(mockKushki.init).toHaveBeenCalledWith({
        publicKey: 'pk_test_123456',
        environment: 'test'
      });
      expect(result).toBe(true);
    });

    it('throws error when Kushki is not loaded', async () => {
      // Remove Kushki from window
      delete (window as any).Kushki;

      await expect(kushkiService.initializeKushki()).rejects.toThrow(
        'Kushki SDK not loaded'
      );
    });

    it('throws error when public key is missing', async () => {
      import.meta.env.VITE_KUSHKI_PUBLIC_KEY = '';

      await expect(kushkiService.initializeKushki()).rejects.toThrow(
        'Kushki public key not configured'
      );
    });

    it('handles initialization errors', async () => {
      mockKushki.init.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      await expect(kushkiService.initializeKushki()).rejects.toThrow(
        'Failed to initialize Kushki: Initialization failed'
      );
    });
  });

  describe('tokenizeCard', () => {
    beforeEach(() => {
      mockKushki.init.mockReturnValue(mockKushki);
    });

    it('tokenizes card successfully', async () => {
      const mockToken = {
        token: 'tok_test_123456',
        brand: 'visa',
        lastFourDigits: '1111'
      };

      mockKushki.requestToken.mockResolvedValue(mockToken);

      const cardData = {
        number: '4111111111111111',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: 'John Doe'
      };

      const result = await kushkiService.tokenizeCard(cardData);

      expect(mockKushki.requestToken).toHaveBeenCalledWith(
        expect.objectContaining({
          card: {
            number: '4111111111111111',
            expiryMonth: '12',
            expiryYear: '25',
            cvv: '123',
            name: 'John Doe'
          }
        })
      );

      expect(result).toEqual(mockToken);
    });

    it('handles tokenization errors', async () => {
      const error = {
        code: 'invalid_card',
        message: 'Invalid card number'
      };

      mockKushki.requestToken.mockRejectedValue(error);

      const cardData = {
        number: '1234567890123456',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: 'John Doe'
      };

      await expect(kushkiService.tokenizeCard(cardData)).rejects.toThrow(
        'Invalid card number'
      );
    });

    it('validates required card fields', async () => {
      const incompleteCard = {
        number: '4111111111111111',
        expiry_month: '12'
        // Missing expiry_year, cvv, name
      };

      await expect(kushkiService.tokenizeCard(incompleteCard as any))
        .rejects.toThrow('Missing required card fields');
    });

    it('sanitizes card data before tokenization', async () => {
      const cardData = {
        number: '4111 1111 1111 1111', // With spaces
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: '  John Doe  ' // With extra spaces
      };

      mockKushki.requestToken.mockResolvedValue({ token: 'tok_123' });

      await kushkiService.tokenizeCard(cardData);

      expect(mockKushki.requestToken).toHaveBeenCalledWith(
        expect.objectContaining({
          card: {
            number: '4111111111111111', // Spaces removed
            expiryMonth: '12',
            expiryYear: '25',
            cvv: '123',
            name: 'John Doe' // Trimmed
          }
        })
      );
    });
  });

  describe('validateCardNumber', () => {
    it('validates valid Visa card number', () => {
      expect(kushkiService.validateCardNumber('4111111111111111')).toBe(true);
      expect(kushkiService.validateCardNumber('4532015112830366')).toBe(true);
    });

    it('validates valid Mastercard number', () => {
      expect(kushkiService.validateCardNumber('5555555555554444')).toBe(true);
      expect(kushkiService.validateCardNumber('5105105105105100')).toBe(true);
    });

    it('validates valid American Express number', () => {
      expect(kushkiService.validateCardNumber('378282246310005')).toBe(true);
      expect(kushkiService.validateCardNumber('371449635398431')).toBe(true);
    });

    it('rejects invalid card numbers', () => {
      expect(kushkiService.validateCardNumber('1234567890123456')).toBe(false);
      expect(kushkiService.validateCardNumber('4111111111111112')).toBe(false); // Wrong checksum
      expect(kushkiService.validateCardNumber('411111111111111')).toBe(false); // Too short
      expect(kushkiService.validateCardNumber('41111111111111111')).toBe(false); // Too long
    });

    it('handles card numbers with spaces', () => {
      expect(kushkiService.validateCardNumber('4111 1111 1111 1111')).toBe(true);
      expect(kushkiService.validateCardNumber('5555 5555 5555 4444')).toBe(true);
    });

    it('rejects empty or non-string inputs', () => {
      expect(kushkiService.validateCardNumber('')).toBe(false);
      expect(kushkiService.validateCardNumber(null as any)).toBe(false);
      expect(kushkiService.validateCardNumber(undefined as any)).toBe(false);
      expect(kushkiService.validateCardNumber(123456789 as any)).toBe(false);
    });
  });

  describe('validateExpiryDate', () => {
    it('validates valid expiry dates', () => {
      const futureYear = new Date().getFullYear() + 5;
      expect(kushkiService.validateExpiryDate(`12/${futureYear.toString().slice(-2)}`)).toBe(true);
      expect(kushkiService.validateExpiryDate(`01/${futureYear.toString().slice(-2)}`)).toBe(true);
    });

    it('rejects expired dates', () => {
      expect(kushkiService.validateExpiryDate('12/20')).toBe(false); // 2020
      expect(kushkiService.validateExpiryDate('01/21')).toBe(false); // 2021
    });

    it('rejects invalid month values', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(kushkiService.validateExpiryDate(`00/${futureYear.toString().slice(-2)}`)).toBe(false);
      expect(kushkiService.validateExpiryDate(`13/${futureYear.toString().slice(-2)}`)).toBe(false);
    });

    it('rejects invalid date formats', () => {
      expect(kushkiService.validateExpiryDate('12-25')).toBe(false);
      expect(kushkiService.validateExpiryDate('1225')).toBe(false);
      expect(kushkiService.validateExpiryDate('12/2025')).toBe(false); // 4-digit year
    });

    it('handles current month/year correctly', () => {
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = now.getFullYear().toString().slice(-2);
      
      expect(kushkiService.validateExpiryDate(`${currentMonth}/${currentYear}`)).toBe(true);
    });
  });

  describe('validateCVV', () => {
    it('validates 3-digit CVV', () => {
      expect(kushkiService.validateCVV('123')).toBe(true);
      expect(kushkiService.validateCVV('000')).toBe(true);
      expect(kushkiService.validateCVV('999')).toBe(true);
    });

    it('validates 4-digit CVV for American Express', () => {
      expect(kushkiService.validateCVV('1234', 'amex')).toBe(true);
      expect(kushkiService.validateCVV('0000', 'amex')).toBe(true);
    });

    it('rejects invalid CVV lengths', () => {
      expect(kushkiService.validateCVV('12')).toBe(false); // Too short
      expect(kushkiService.validateCVV('12345')).toBe(false); // Too long
      expect(kushkiService.validateCVV('1234')).toBe(false); // 4 digits for non-amex
    });

    it('rejects non-numeric CVV', () => {
      expect(kushkiService.validateCVV('abc')).toBe(false);
      expect(kushkiService.validateCVV('12a')).toBe(false);
      expect(kushkiService.validateCVV('')).toBe(false);
    });
  });

  describe('getCardType', () => {
    it('detects Visa cards', () => {
      expect(kushkiService.getCardType('4111111111111111')).toBe('visa');
      expect(kushkiService.getCardType('4532015112830366')).toBe('visa');
      expect(kushkiService.getCardType('4')).toBe('visa'); // Partial number
    });

    it('detects Mastercard', () => {
      expect(kushkiService.getCardType('5555555555554444')).toBe('mastercard');
      expect(kushkiService.getCardType('5105105105105100')).toBe('mastercard');
      expect(kushkiService.getCardType('55')).toBe('mastercard'); // Partial number
    });

    it('detects American Express', () => {
      expect(kushkiService.getCardType('378282246310005')).toBe('amex');
      expect(kushkiService.getCardType('371449635398431')).toBe('amex');
      expect(kushkiService.getCardType('34')).toBe('amex'); // Partial number
      expect(kushkiService.getCardType('37')).toBe('amex'); // Partial number
    });

    it('detects Discover cards', () => {
      expect(kushkiService.getCardType('6011111111111117')).toBe('discover');
      expect(kushkiService.getCardType('6011000990139424')).toBe('discover');
    });

    it('returns unknown for unrecognized cards', () => {
      expect(kushkiService.getCardType('1234567890123456')).toBe('unknown');
      expect(kushkiService.getCardType('9999999999999999')).toBe('unknown');
      expect(kushkiService.getCardType('')).toBe('unknown');
    });

    it('handles card numbers with spaces', () => {
      expect(kushkiService.getCardType('4111 1111 1111 1111')).toBe('visa');
      expect(kushkiService.getCardType('5555 5555 5555 4444')).toBe('mastercard');
    });
  });

  describe('formatCardNumber', () => {
    it('formats Visa/Mastercard numbers with spaces', () => {
      expect(kushkiService.formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
      expect(kushkiService.formatCardNumber('5555555555554444')).toBe('5555 5555 5555 4444');
    });

    it('formats American Express numbers correctly', () => {
      expect(kushkiService.formatCardNumber('378282246310005')).toBe('3782 822463 10005');
      expect(kushkiService.formatCardNumber('371449635398431')).toBe('3714 496353 98431');
    });

    it('handles partial card numbers', () => {
      expect(kushkiService.formatCardNumber('4111')).toBe('4111');
      expect(kushkiService.formatCardNumber('411111')).toBe('4111 11');
      expect(kushkiService.formatCardNumber('41111111')).toBe('4111 1111');
    });

    it('removes existing formatting', () => {
      expect(kushkiService.formatCardNumber('4111 1111 1111 1111')).toBe('4111 1111 1111 1111');
      expect(kushkiService.formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
    });

    it('limits input length', () => {
      const longNumber = '41111111111111111111111111';
      expect(kushkiService.formatCardNumber(longNumber)).toBe('4111 1111 1111 1111');
    });
  });

  describe('formatExpiryDate', () => {
    it('formats expiry date with slash', () => {
      expect(kushkiService.formatExpiryDate('1225')).toBe('12/25');
      expect(kushkiService.formatExpiryDate('0130')).toBe('01/30');
    });

    it('handles partial input', () => {
      expect(kushkiService.formatExpiryDate('1')).toBe('1');
      expect(kushkiService.formatExpiryDate('12')).toBe('12/');
      expect(kushkiService.formatExpiryDate('123')).toBe('12/3');
    });

    it('preserves existing slash', () => {
      expect(kushkiService.formatExpiryDate('12/25')).toBe('12/25');
      expect(kushkiService.formatExpiryDate('12/')).toBe('12/');
    });

    it('limits input length', () => {
      expect(kushkiService.formatExpiryDate('12345678')).toBe('12/34');
    });

    it('handles non-numeric input', () => {
      expect(kushkiService.formatExpiryDate('ab/cd')).toBe('');
      expect(kushkiService.formatExpiryDate('12/ab')).toBe('12/');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors during tokenization', async () => {
      mockKushki.requestToken.mockRejectedValue(new Error('Network error'));

      const cardData = {
        number: '4111111111111111',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: 'John Doe'
      };

      await expect(kushkiService.tokenizeCard(cardData)).rejects.toThrow('Network error');
    });

    it('handles Kushki-specific errors', async () => {
      const kushkiError = {
        code: 'E100',
        message: 'Invalid card number',
        details: { field: 'card.number' }
      };

      mockKushki.requestToken.mockRejectedValue(kushkiError);

      const cardData = {
        number: '1234567890123456',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: 'John Doe'
      };

      await expect(kushkiService.tokenizeCard(cardData)).rejects.toThrow('Invalid card number');
    });

    it('provides fallback error messages', async () => {
      mockKushki.requestToken.mockRejectedValue({});

      const cardData = {
        number: '4111111111111111',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: 'John Doe'
      };

      await expect(kushkiService.tokenizeCard(cardData)).rejects.toThrow(
        'Payment processing failed'
      );
    });
  });
});