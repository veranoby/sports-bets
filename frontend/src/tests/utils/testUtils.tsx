import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock user context for authenticated tests
interface MockUser {
  id: string;
  email: string;
  role: 'admin' | 'operator' | 'venue' | 'gallera' | 'user';
  subscription?: {
    type: 'daily' | 'monthly';
    status: 'active' | 'expired';
  };
}

interface TestWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
  user?: MockUser | null;
}

// Test wrapper with common providers
const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  // initialEntries = ['/'],  // Unused variable removed
  user = null 
}) => {
  // Mock auth context
  // const mockAuthContext = {  // Unused variable removed
  //   user,
  //   login: vi.fn(),
  //   logout: vi.fn(),
  //   register: vi.fn(),
  //   loading: false,
  //   error: null
  // };

  return (
    <BrowserRouter>
      {/* Mock AuthContext.Provider */}
      <div data-testid="auth-context" data-user={user ? JSON.stringify(user) : null}>
        {children}
      </div>
    </BrowserRouter>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: MockUser | null;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialEntries, user, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper initialEntries={initialEntries} user={user}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions
  });
};

// Mock users for testing
export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@gallobets.com',
    role: 'admin' as const
  },
  operator: {
    id: '2',
    email: 'operator@gallobets.com',
    role: 'operator' as const
  },
  venue: {
    id: '3',
    email: 'venue@gallobets.com',
    role: 'venue' as const,
    subscription: {
      type: 'monthly' as const,
      status: 'active' as const
    }
  },
  user: {
    id: '4',
    email: 'user@gallobets.com',
    role: 'user' as const,
    subscription: {
      type: 'daily' as const,
      status: 'active' as const
    }
  }
};

// Mock API responses
export const mockApiResponses = {
  events: [
    {
      id: '1',
      title: 'Test Event',
      description: 'Test event description',
      status: 'scheduled',
      scheduledDate: new Date().toISOString(),
      operatorId: '2'
    }
  ],
  fights: [
    {
      id: '1',
      eventId: '1',
      number: 1,
      status: 'upcoming',
      startTime: new Date().toISOString()
    }
  ],
  bets: [
    {
      id: '1',
      userId: '4',
      fightId: '1',
      amount: 100,
      type: 'pago',
      status: 'pending'
    }
  ]
};

// Mock API calls
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

// Helper to mock successful API responses
export const mockApiSuccess = (data: unknown) => {
  mockApi.get.mockResolvedValue({ data });
  mockApi.post.mockResolvedValue({ data });
  mockApi.put.mockResolvedValue({ data });
  mockApi.delete.mockResolvedValue({ data });
};

// Helper to mock API errors
export const mockApiError = (error: string) => {
  const errorResponse = { response: { data: { message: error } } };
  mockApi.get.mockRejectedValue(errorResponse);
  mockApi.post.mockRejectedValue(errorResponse);
  mockApi.put.mockRejectedValue(errorResponse);
  mockApi.delete.mockRejectedValue(errorResponse);
};

// Wait for async operations (useful for testing async components)
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock WebSocket for streaming tests
export const mockWebSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

// Mock video.js for streaming components
export const mockVideoJs = {
  dispose: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  src: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

// Export everything
export * from '@testing-library/react';
export { customRender as render };