import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SubscriptionPlans from '../SubscriptionPlans';
import * as subscriptionAPI from '../../../config/api';

// Mock the API
vi.mock('../../../config/api', () => ({
  subscriptionAPI: {
    getPlans: vi.fn(),
    create: vi.fn(),
    getCurrent: vi.fn()
  }
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

const mockPlans = [
  {
    id: 'daily',
    name: 'Daily Access',
    price: 2.50,
    currency: 'USD',
    interval: 'day',
    features: ['Live streaming', 'HD quality', 'Chat access']
  },
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 10.00,
    currency: 'USD',
    interval: 'month',
    features: ['Live streaming', '720p quality', 'Chat access', 'Ad-free', 'Exclusive content'],
    popular: true
  }
];

describe('SubscriptionPlans Component', () => {
  const defaultProps = {
    onPlanSelect: vi.fn(),
    currentPlan: null,
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (subscriptionAPI.subscriptionAPI.getPlans as any).mockResolvedValue({
      data: mockPlans
    });
  });

  it('renders loading state', () => {
    render(<SubscriptionPlans {...defaultProps} loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('fetches and displays subscription plans', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Access')).toBeInTheDocument();
      expect(screen.getByText('Monthly Premium')).toBeInTheDocument();
    });

    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('displays plan features correctly', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Live streaming')).toBeInTheDocument();
      expect(screen.getByText('HD quality')).toBeInTheDocument();
      expect(screen.getByText('720p quality')).toBeInTheDocument();
      expect(screen.getByText('Ad-free')).toBeInTheDocument();
      expect(screen.getByText('Exclusive content')).toBeInTheDocument();
    });
  });

  it('marks popular plan with badge', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('POPULAR')).toBeInTheDocument();
    });
  });

  it('calls onPlanSelect when plan is selected', async () => {
    const user = userEvent.setup();
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Access')).toBeInTheDocument();
    });

    const selectButton = screen.getAllByText(/select plan/i)[0];
    await user.click(selectButton);

    expect(defaultProps.onPlanSelect).toHaveBeenCalledWith(mockPlans[0]);
  });

  it('shows different button text for current plan', async () => {
    render(<SubscriptionPlans {...defaultProps} currentPlan="daily" />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Select Plan')).toBeInTheDocument();
    });
  });

  it('disables current plan selection', async () => {
    const user = userEvent.setup();
    render(<SubscriptionPlans {...defaultProps} currentPlan="daily" />);

    await waitFor(() => {
      const currentPlanButton = screen.getByText('Current Plan');
      expect(currentPlanButton).toBeDisabled();
    });
  });

  it('handles API error gracefully', async () => {
    (subscriptionAPI.subscriptionAPI.getPlans as any).mockRejectedValue(
      new Error('Failed to fetch plans')
    );

    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading plans/i)).toBeInTheDocument();
    });
  });

  it('shows retry button on error', async () => {
    const user = userEvent.setup();
    (subscriptionAPI.subscriptionAPI.getPlans as any).mockRejectedValue(
      new Error('Network error')
    );

    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(subscriptionAPI.subscriptionAPI.getPlans).toHaveBeenCalledTimes(2);
  });

  it('displays billing cycle information', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('/day')).toBeInTheDocument();
      expect(screen.getByText('/month')).toBeInTheDocument();
    });
  });

  it('shows upgrade/downgrade labels', async () => {
    render(<SubscriptionPlans {...defaultProps} currentPlan="daily" />);

    await waitFor(() => {
      expect(screen.getByText(/upgrade to/i)).toBeInTheDocument();
    });
  });

  it('applies correct styling to popular plan', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      const popularPlan = screen.getByTestId('plan-monthly');
      expect(popularPlan).toHaveClass('ring-2', 'ring-yellow-400');
    });
  });

  it('shows plan comparison when multiple plans available', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
      expect(screen.getByText('Compare features and select the plan that works best for you')).toBeInTheDocument();
    });
  });

  it('handles empty plans response', async () => {
    (subscriptionAPI.subscriptionAPI.getPlans as any).mockResolvedValue({
      data: []
    });

    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/no plans available/i)).toBeInTheDocument();
    });
  });

  it('formats price correctly for different currencies', async () => {
    const euroPlans = [
      { ...mockPlans[0], price: 2.99, currency: 'EUR' },
      { ...mockPlans[1], price: 12.99, currency: 'EUR' }
    ];

    (subscriptionAPI.subscriptionAPI.getPlans as any).mockResolvedValue({
      data: euroPlans
    });

    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('€2.99')).toBeInTheDocument();
      expect(screen.getByText('€12.99')).toBeInTheDocument();
    });
  });

  it('shows savings information for monthly plan', async () => {
    render(<SubscriptionPlans {...defaultProps} />);

    await waitFor(() => {
      // Monthly plan should show savings compared to daily
      expect(screen.getByText(/save \$65/i)).toBeInTheDocument();
    });
  });

  it('handles plan selection with loading state', async () => {
    const user = userEvent.setup();
    let resolvePlanSelect: (value: any) => void;
    const planSelectPromise = new Promise(resolve => {
      resolvePlanSelect = resolve;
    });

    const mockOnPlanSelect = vi.fn().mockReturnValue(planSelectPromise);
    render(<SubscriptionPlans {...defaultProps} onPlanSelect={mockOnPlanSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Access')).toBeInTheDocument();
    });

    const selectButton = screen.getAllByText(/select plan/i)[0];
    await user.click(selectButton);

    // Should show loading state
    expect(screen.getByText(/selecting/i)).toBeInTheDocument();
    expect(selectButton).toBeDisabled();

    // Resolve the promise
    resolvePlanSelect!(true);

    await waitFor(() => {
      expect(screen.queryByText(/selecting/i)).not.toBeInTheDocument();
    });
  });
});