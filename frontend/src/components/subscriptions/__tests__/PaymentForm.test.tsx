import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PaymentForm from '../PaymentForm';
import * as kushkiService from '../../../services/kushkiService';

// Mock the Kushki service
vi.mock('../../../services/kushkiService', () => ({
  initializeKushki: vi.fn(),
  tokenizeCard: vi.fn(),
  validateCardNumber: vi.fn(),
  validateExpiryDate: vi.fn(),
  validateCVV: vi.fn(),
  getCardType: vi.fn()
}));

// Mock AuthContext
const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user'
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false
  })
}));

describe('PaymentForm Component', () => {
  const defaultProps = {
    planType: 'monthly' as const,
    planPrice: 10.00,
    onPaymentSuccess: vi.fn(),
    onPaymentError: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (kushkiService.initializeKushki as any).mockResolvedValue(true);
    (kushkiService.validateCardNumber as any).mockReturnValue(true);
    (kushkiService.validateExpiryDate as any).mockReturnValue(true);
    (kushkiService.validateCVV as any).mockReturnValue(true);
    (kushkiService.getCardType as any).mockReturnValue('visa');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders payment form with all required fields', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete payment/i })).toBeInTheDocument();
  });

  it('displays plan information correctly', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText(/monthly plan/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10\.00/)).toBeInTheDocument();
  });

  it('validates card number input', async () => {
    const user = userEvent.setup();
    (kushkiService.validateCardNumber as any).mockReturnValue(false);

    render(<PaymentForm {...defaultProps} />);

    const cardNumberInput = screen.getByLabelText(/card number/i);
    await user.type(cardNumberInput, '1234');

    await waitFor(() => {
      expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
    });
  });

  it('validates expiry date format', async () => {
    const user = userEvent.setup();
    (kushkiService.validateExpiryDate as any).mockReturnValue(false);

    render(<PaymentForm {...defaultProps} />);

    const expiryInput = screen.getByLabelText(/expiry date/i);
    await user.type(expiryInput, '13/99');

    await waitFor(() => {
      expect(screen.getByText(/invalid expiry date/i)).toBeInTheDocument();
    });
  });

  it('validates CVV length', async () => {
    const user = userEvent.setup();
    (kushkiService.validateCVV as any).mockReturnValue(false);

    render(<PaymentForm {...defaultProps} />);

    const cvvInput = screen.getByLabelText(/cvv/i);
    await user.type(cvvInput, '12');

    await waitFor(() => {
      expect(screen.getByText(/invalid cvv/i)).toBeInTheDocument();
    });
  });

  it('formats card number with spaces', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    const cardNumberInput = screen.getByLabelText(/card number/i);
    await user.type(cardNumberInput, '4111111111111111');

    expect(cardNumberInput).toHaveValue('4111 1111 1111 1111');
  });

  it('formats expiry date with slash', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    const expiryInput = screen.getByLabelText(/expiry date/i);
    await user.type(expiryInput, '1225');

    expect(expiryInput).toHaveValue('12/25');
  });

  it('shows card type icon based on card number', async () => {
    const user = userEvent.setup();
    (kushkiService.getCardType as any).mockReturnValue('mastercard');

    render(<PaymentForm {...defaultProps} />);

    const cardNumberInput = screen.getByLabelText(/card number/i);
    await user.type(cardNumberInput, '5555555555554444');

    await waitFor(() => {
      expect(screen.getByTestId('card-type-mastercard')).toBeInTheDocument();
    });
  });

  it('disables submit button when form is invalid', () => {
    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /complete payment/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when all fields are valid', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    // Fill all required fields with valid data
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
    await user.type(screen.getByLabelText(/expiry date/i), '12/25');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /complete payment/i });
      expect(submitButton).toBeEnabled();
    });
  });

  it('submits form with tokenized card data', async () => {
    const user = userEvent.setup();
    const mockToken = 'tok_test_123456';
    (kushkiService.tokenizeCard as any).mockResolvedValue({ token: mockToken });

    render(<PaymentForm {...defaultProps} />);

    // Fill form
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
    await user.type(screen.getByLabelText(/expiry date/i), '12/25');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /complete payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(kushkiService.tokenizeCard).toHaveBeenCalledWith({
        number: '4111111111111111',
        expiry_month: '12',
        expiry_year: '25',
        cvv: '123',
        name: 'John Doe'
      });
    });

    expect(defaultProps.onPaymentSuccess).toHaveBeenCalledWith({
      token: mockToken,
      planType: 'monthly'
    });
  });

  it('handles tokenization errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Card declined';
    (kushkiService.tokenizeCard as any).mockRejectedValue(new Error(errorMessage));

    render(<PaymentForm {...defaultProps} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
    await user.type(screen.getByLabelText(/expiry date/i), '12/25');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');

    const submitButton = screen.getByRole('button', { name: /complete payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(defaultProps.onPaymentError).toHaveBeenCalledWith(errorMessage);
  });

  it('shows loading state during payment processing', async () => {
    const user = userEvent.setup();
    let resolveTokenization: (value: any) => void;
    const tokenizationPromise = new Promise(resolve => {
      resolveTokenization = resolve;
    });
    (kushkiService.tokenizeCard as any).mockReturnValue(tokenizationPromise);

    render(<PaymentForm {...defaultProps} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
    await user.type(screen.getByLabelText(/expiry date/i), '12/25');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');

    const submitButton = screen.getByRole('button', { name: /complete payment/i });
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText(/processing payment/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveTokenization!({ token: 'tok_test' });

    await waitFor(() => {
      expect(screen.queryByText(/processing payment/i)).not.toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('handles daily plan pricing', () => {
    render(<PaymentForm {...defaultProps} planType="daily" planPrice={2.50} />);

    expect(screen.getByText(/daily plan/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2\.50/)).toBeInTheDocument();
  });

  it('validates required fields are not empty', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /complete payment/i });
    
    // Try to submit empty form
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/card number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/expiry date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/cvv is required/i)).toBeInTheDocument();
      expect(screen.getByText(/cardholder name is required/i)).toBeInTheDocument();
    });
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    (kushkiService.validateCardNumber as any).mockReturnValue(false);

    render(<PaymentForm {...defaultProps} />);

    const cardNumberInput = screen.getByLabelText(/card number/i);
    
    // Type invalid card number
    await user.type(cardNumberInput, '1234');
    
    await waitFor(() => {
      expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
    });

    // Clear and type valid number
    await user.clear(cardNumberInput);
    (kushkiService.validateCardNumber as any).mockReturnValue(true);
    await user.type(cardNumberInput, '4111111111111111');

    await waitFor(() => {
      expect(screen.queryByText(/invalid card number/i)).not.toBeInTheDocument();
    });
  });
});