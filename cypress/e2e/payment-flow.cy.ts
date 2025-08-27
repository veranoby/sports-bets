describe('Payment Flow E2E', () => {
  beforeEach(() => {
    // Mock Kushki SDK
    cy.window().then((win) => {
      win.Kushki = {
        init: cy.stub().returns({
          requestToken: cy.stub().resolves({
            token: 'tok_test_123456',
            brand: 'visa'
          })
        })
      };
    });

    // Login as test user
    cy.login('testuser@example.com', 'password123');
  });

  describe('Subscription Purchase Flow', () => {
    it('completes monthly subscription purchase successfully', () => {
      cy.visit('/subscriptions');

      // Should show subscription plans
      cy.contains('Choose Your Plan').should('be.visible');
      cy.contains('Monthly Premium').should('be.visible');
      cy.contains('$10.00').should('be.visible');

      // Select monthly plan
      cy.get('[data-testid="plan-monthly"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Should open payment modal
      cy.get('[data-testid="payment-modal"]').should('be.visible');
      cy.contains('Complete Payment').should('be.visible');

      // Fill payment form
      cy.get('[data-testid="card-number"]').type('4111111111111111');
      cy.get('[data-testid="expiry-date"]').type('12/25');
      cy.get('[data-testid="cvv"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('John Doe');

      // Should show card type
      cy.get('[data-testid="card-type-visa"]').should('be.visible');

      // Submit payment
      cy.get('[data-testid="submit-payment"]').click();

      // Should show processing state
      cy.contains('Processing Payment').should('be.visible');
      cy.get('[data-testid="submit-payment"]').should('be.disabled');

      // Mock successful payment response
      cy.intercept('POST', '/api/subscriptions/create', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 'sub_123',
            type: 'monthly',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }).as('createSubscription');

      // Should show success message
      cy.wait('@createSubscription');
      cy.contains('Payment Successful').should('be.visible');
      cy.contains('Your monthly subscription is now active').should('be.visible');

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Premium Member').should('be.visible');
    });

    it('handles payment validation errors', () => {
      cy.visit('/subscriptions');

      // Select monthly plan
      cy.get('[data-testid="plan-monthly"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Try to submit empty form
      cy.get('[data-testid="submit-payment"]').click();

      // Should show validation errors
      cy.contains('Card number is required').should('be.visible');
      cy.contains('Expiry date is required').should('be.visible');
      cy.contains('CVV is required').should('be.visible');
      cy.contains('Cardholder name is required').should('be.visible');

      // Submit button should remain disabled
      cy.get('[data-testid="submit-payment"]').should('be.disabled');
    });

    it('handles invalid card number', () => {
      cy.visit('/subscriptions');

      cy.get('[data-testid="plan-monthly"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Enter invalid card number
      cy.get('[data-testid="card-number"]').type('1234567890123456');
      cy.get('[data-testid="expiry-date"]').click(); // Trigger validation

      cy.contains('Invalid card number').should('be.visible');
      cy.get('[data-testid="submit-payment"]').should('be.disabled');
    });

    it('handles payment failure', () => {
      cy.visit('/subscriptions');

      cy.get('[data-testid="plan-monthly"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Fill valid payment form
      cy.get('[data-testid="card-number"]').type('4111111111111111');
      cy.get('[data-testid="expiry-date"]').type('12/25');
      cy.get('[data-testid="cvv"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('John Doe');

      // Mock payment failure
      cy.intercept('POST', '/api/subscriptions/create', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Your card was declined. Please try a different payment method.'
        }
      }).as('failedPayment');

      cy.get('[data-testid="submit-payment"]').click();

      // Should show error message
      cy.wait('@failedPayment');
      cy.contains('Your card was declined').should('be.visible');

      // Should allow retry
      cy.get('[data-testid="submit-payment"]').should('be.enabled');
      cy.contains('Try Again').should('be.visible');
    });

    it('purchases daily subscription', () => {
      cy.visit('/subscriptions');

      // Select daily plan
      cy.get('[data-testid="plan-daily"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Should show daily plan details
      cy.contains('Daily Access').should('be.visible');
      cy.contains('$2.50').should('be.visible');

      // Complete payment flow
      cy.get('[data-testid="card-number"]').type('4111111111111111');
      cy.get('[data-testid="expiry-date"]').type('12/25');
      cy.get('[data-testid="cvv"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('Jane Doe');

      cy.intercept('POST', '/api/subscriptions/create', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 'sub_daily_123',
            type: 'daily',
            status: 'active',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }).as('createDailySubscription');

      cy.get('[data-testid="submit-payment"]').click();

      cy.wait('@createDailySubscription');
      cy.contains('Payment Successful').should('be.visible');
      cy.contains('Your daily subscription is now active').should('be.visible');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      // Mock active subscription
      cy.intercept('GET', '/api/subscriptions/current', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'sub_existing',
            type: 'monthly',
            status: 'active',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            features: ['streaming', 'hd_quality', 'ad_free']
          }
        }
      });
    });

    it('displays current subscription details', () => {
      cy.visit('/account/subscription');

      cy.contains('Current Subscription').should('be.visible');
      cy.contains('Monthly Premium').should('be.visible');
      cy.contains('Active').should('be.visible');
      cy.contains('Expires in 15 days').should('be.visible');
    });

    it('cancels subscription successfully', () => {
      cy.visit('/account/subscription');

      // Click cancel subscription
      cy.contains('Cancel Subscription').click();

      // Should show confirmation dialog
      cy.get('[data-testid="cancel-confirmation"]').should('be.visible');
      cy.contains('Are you sure you want to cancel').should('be.visible');

      // Mock cancellation success
      cy.intercept('POST', '/api/subscriptions/cancel', {
        statusCode: 200,
        body: {
          success: true,
          data: { cancelled: true }
        }
      }).as('cancelSubscription');

      cy.get('[data-testid="confirm-cancel"]').click();

      cy.wait('@cancelSubscription');
      cy.contains('Subscription cancelled successfully').should('be.visible');
      cy.contains('Your subscription will remain active until').should('be.visible');
    });

    it('displays payment history', () => {
      cy.intercept('GET', '/api/subscriptions/history', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'txn_1',
              amount: 1000,
              currency: 'USD',
              status: 'completed',
              createdAt: new Date().toISOString(),
              type: 'subscription_payment'
            },
            {
              id: 'txn_2',
              amount: 1000,
              currency: 'USD',
              status: 'completed',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'subscription_payment'
            }
          ]
        }
      });

      cy.visit('/account/subscription');

      cy.contains('Payment History').click();

      // Should show transaction history
      cy.contains('$10.00').should('be.visible');
      cy.contains('Completed').should('be.visible');
      cy.contains('Subscription Payment').should('be.visible');
    });

    it('upgrades from daily to monthly plan', () => {
      // Mock daily subscription
      cy.intercept('GET', '/api/subscriptions/current', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'sub_daily',
            type: 'daily',
            status: 'active',
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
          }
        }
      });

      cy.visit('/account/subscription');

      cy.contains('Upgrade Plan').click();

      // Should show upgrade options
      cy.contains('Upgrade to Monthly Premium').should('be.visible');
      cy.contains('Save $65.00 per month').should('be.visible');

      cy.get('[data-testid="upgrade-monthly"]').click();

      // Should open payment form for upgrade
      cy.get('[data-testid="payment-modal"]').should('be.visible');
      cy.contains('Upgrade Payment').should('be.visible');
    });
  });

  describe('Access Control', () => {
    it('blocks premium content for non-subscribers', () => {
      // Mock no subscription
      cy.intercept('GET', '/api/subscriptions/current', {
        statusCode: 200,
        body: {
          success: true,
          data: null
        }
      });

      cy.visit('/events/live-stream-123');

      // Should show subscription guard
      cy.contains('Upgrade to Premium').should('be.visible');
      cy.contains('Unlock premium streaming').should('be.visible');

      // Should not show video player
      cy.get('[data-testid="video-player"]').should('not.exist');

      // Click upgrade button
      cy.contains('Upgrade Now').click();

      // Should redirect to subscription page
      cy.url().should('include', '/subscriptions');
    });

    it('allows premium content for active subscribers', () => {
      // Mock active subscription
      cy.intercept('GET', '/api/subscriptions/current', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'sub_active',
            type: 'monthly',
            status: 'active',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });

      cy.intercept('POST', '/api/subscriptions/check-access', {
        statusCode: 200,
        body: {
          success: true,
          data: { hasAccess: true }
        }
      });

      cy.visit('/events/live-stream-123');

      // Should show premium member badge
      cy.contains('Premium Member').should('be.visible');

      // Should show video player
      cy.get('[data-testid="video-player"]').should('be.visible');

      // Should not show upgrade prompt
      cy.contains('Upgrade to Premium').should('not.exist');
    });

    it('blocks expired subscription access', () => {
      // Mock expired subscription
      cy.intercept('GET', '/api/subscriptions/current', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'sub_expired',
            type: 'monthly',
            status: 'active',
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
          }
        }
      });

      cy.intercept('POST', '/api/subscriptions/check-access', {
        statusCode: 200,
        body: {
          success: true,
          data: { hasAccess: false }
        }
      });

      cy.visit('/events/live-stream-123');

      // Should show renewal prompt
      cy.contains('Subscription Expired').should('be.visible');
      cy.contains('Renew your subscription').should('be.visible');
      cy.contains('Renew Now').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      cy.visit('/subscriptions');

      // Mock network failure
      cy.intercept('GET', '/api/subscriptions/plans', { forceNetworkError: true });

      // Should show error state
      cy.contains('Failed to load subscription plans').should('be.visible');
      cy.contains('Check your internet connection').should('be.visible');

      // Should provide retry option
      cy.contains('Retry').should('be.visible');
    });

    it('handles authentication errors', () => {
      // Mock auth failure
      cy.intercept('POST', '/api/subscriptions/create', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Authentication required'
        }
      });

      cy.visit('/subscriptions');

      cy.get('[data-testid="plan-monthly"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Fill and submit form
      cy.get('[data-testid="card-number"]').type('4111111111111111');
      cy.get('[data-testid="expiry-date"]').type('12/25');
      cy.get('[data-testid="cvv"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('John Doe');

      cy.get('[data-testid="submit-payment"]').click();

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.contains('Please sign in to continue').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('displays subscription plans correctly on mobile', () => {
      cy.visit('/subscriptions');

      // Plans should stack vertically on mobile
      cy.get('[data-testid="subscription-plans"]').should('have.class', 'flex-col');

      // Should be readable and clickable
      cy.contains('Monthly Premium').should('be.visible');
      cy.get('[data-testid="plan-monthly"]').should('be.visible');
    });

    it('payment form works on mobile', () => {
      cy.visit('/subscriptions');

      cy.get('[data-testid="plan-monthly"]').within(() => {
        cy.contains('Select Plan').click();
      });

      // Payment modal should be full screen on mobile
      cy.get('[data-testid="payment-modal"]').should('have.class', 'sm:max-w-md');

      // Form fields should be accessible
      cy.get('[data-testid="card-number"]').should('be.visible').type('4111111111111111');
      cy.get('[data-testid="expiry-date"]').should('be.visible').type('12/25');
      cy.get('[data-testid="cvv"]').should('be.visible').type('123');
      cy.get('[data-testid="cardholder-name"]').should('be.visible').type('John Doe');

      cy.get('[data-testid="submit-payment"]').should('be.visible');
    });
  });
});