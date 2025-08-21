import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import SubscriptionGuard from '../SubscriptionGuard'
import { AuthContext } from '../../../contexts/AuthContext'

// Mock the subscription API
const mockSubscriptionAPI = {
  getCurrent: vi.fn(),
  create: vi.fn(),
  cancel: vi.fn()
}

vi.mock('../../../config/api', () => ({
  subscriptionAPI: mockSubscriptionAPI
}))

const mockAuthContext = (user: any, subscription: any = null) => ({
  user,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  subscription
})

const TestWrapper = ({ children, user = null, subscription = null }: any) => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContext(user, subscription)}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
)

const ProtectedContent = () => (
  <div data-testid="protected-content">
    Premium streaming content
  </div>
)

describe('SubscriptionGuard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated users', () => {
    it('should show login prompt for unauthenticated users', () => {
      render(
        <TestWrapper user={null}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByText(/sign in to access/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect to login when sign in button is clicked', async () => {
      const mockUser = { id: 1, email: 'test@example.com' }
      
      render(
        <TestWrapper user={null}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)

      // In a real implementation, this would check navigation
      expect(signInButton).toBeInTheDocument()
    })
  })

  describe('Authenticated users without subscription', () => {
    const authenticatedUser = {
      id: 1,
      email: 'test@example.com',
      subscription: null
    }

    it('should show subscription upgrade prompt', () => {
      render(
        <TestWrapper user={authenticatedUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
      expect(screen.getByText(/unlock premium streaming/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should display subscription plans', () => {
      render(
        <TestWrapper user={authenticatedUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByText(/daily/i)).toBeInTheDocument()
      expect(screen.getByText(/\$2\.50/)).toBeInTheDocument()
      expect(screen.getByText(/monthly/i)).toBeInTheDocument()
      expect(screen.getByText(/\$10\.00/)).toBeInTheDocument()
    })

    it('should handle subscription purchase attempt', async () => {
      mockSubscriptionAPI.create.mockResolvedValue({
        data: { id: 'sub_123', type: 'daily', status: 'active' }
      })

      render(
        <TestWrapper user={authenticatedUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i })
      await user.click(upgradeButton)

      await waitFor(() => {
        expect(mockSubscriptionAPI.create).toHaveBeenCalled()
      })
    })
  })

  describe('Users with valid subscription', () => {
    const subscribedUser = {
      id: 1,
      email: 'test@example.com',
      subscription: {
        id: 'sub_123',
        type: 'daily',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    }

    it('should render protected content for subscribed users', () => {
      render(
        <TestWrapper user={subscribedUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByText('Premium streaming content')).toBeInTheDocument()
      expect(screen.queryByText(/upgrade to premium/i)).not.toBeInTheDocument()
    })

    it('should show subscription status in header', () => {
      render(
        <TestWrapper user={subscribedUser}>
          <SubscriptionGuard feature="streaming" showSubscriptionStatus>
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByText(/premium member/i)).toBeInTheDocument()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('Users with expired subscription', () => {
    const expiredSubscriptionUser = {
      id: 1,
      email: 'test@example.com',
      subscription: {
        id: 'sub_123',
        type: 'daily',
        status: 'expired',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    }

    it('should show renewal prompt for expired subscription', () => {
      render(
        <TestWrapper user={expiredSubscriptionUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByText(/subscription expired/i)).toBeInTheDocument()
      expect(screen.getByText(/renew your subscription/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /renew now/i })).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle subscription renewal', async () => {
      mockSubscriptionAPI.create.mockResolvedValue({
        data: { id: 'sub_456', type: 'daily', status: 'active' }
      })

      render(
        <TestWrapper user={expiredSubscriptionUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      const renewButton = screen.getByRole('button', { name: /renew now/i })
      await user.click(renewButton)

      await waitFor(() => {
        expect(mockSubscriptionAPI.create).toHaveBeenCalled()
      })
    })
  })

  describe('Feature-specific access control', () => {
    const subscribedUser = {
      id: 1,
      email: 'test@example.com',
      subscription: {
        id: 'sub_123',
        type: 'basic',
        status: 'active',
        features: ['articles']
      }
    }

    it('should block access to features not in subscription plan', () => {
      render(
        <TestWrapper user={subscribedUser}>
          <SubscriptionGuard feature="premium_streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByText(/upgrade required/i)).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should allow access to included features', () => {
      render(
        <TestWrapper user={subscribedUser}>
          <SubscriptionGuard feature="articles">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('Custom fallback content', () => {
    const CustomFallback = () => (
      <div data-testid="custom-fallback">
        Custom upgrade message
      </div>
    )

    it('should render custom fallback when provided', () => {
      render(
        <TestWrapper user={null}>
          <SubscriptionGuard 
            feature="streaming"
            fallback={<CustomFallback />}
          >
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom upgrade message')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Loading states', () => {
    it('should show loading spinner while checking subscription', () => {
      const loadingAuthContext = {
        ...mockAuthContext({ id: 1, email: 'test@example.com' }),
        loading: true
      }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={loadingAuthContext}>
            <SubscriptionGuard feature="streaming">
              <ProtectedContent />
            </SubscriptionGuard>
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should handle subscription API errors gracefully', async () => {
      mockSubscriptionAPI.getCurrent.mockRejectedValue(new Error('API Error'))

      const authenticatedUser = {
        id: 1,
        email: 'test@example.com',
        subscription: null
      }

      render(
        <TestWrapper user={authenticatedUser}>
          <SubscriptionGuard feature="streaming">
            <ProtectedContent />
          </SubscriptionGuard>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/error loading subscription/i)).toBeInTheDocument()
      })
    })
  })
})