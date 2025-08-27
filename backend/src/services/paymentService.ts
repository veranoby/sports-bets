import axios from 'axios';
import crypto from 'crypto';
import { Subscription } from '../models/Subscription';
import { PaymentTransaction } from '../models/PaymentTransaction';

// Kushki API interfaces
interface KushkiSubscriptionRequest {
  token: string;
  amount: number;
  currency: string;
  planId: string;
  email: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface KushkiSubscriptionResponse {
  subscriptionId: string;
  status: 'active' | 'cancelled' | 'expired';
  nextPaymentDate: Date;
  customerId?: string;
}

interface KushkiPaymentResponse {
  transactionId: string;
  status: 'approved' | 'declined' | 'pending';
  authCode?: string;
  responseText: string;
  responseCode: string;
}

interface KushkiWebhookEvent {
  event: string;
  data: {
    id: string;
    subscription_id?: string;
    amount: number;
    currency: string;
    status: string;
    error_code?: string;
    error_message?: string;
    created_at: string;
    metadata?: Record<string, any>;
  };
  timestamp: number;
}

class PaymentService {
  private kushkiApiUrl: string;
  private kushkiPrivateKey: string;
  private kushkiWebhookSecret: string;

  constructor() {
    this.kushkiApiUrl = process.env.KUSHKI_API_URL || 'https://api-uat.kushkipagos.com';
    this.kushkiPrivateKey = process.env.KUSHKI_PRIVATE_KEY || '';
    this.kushkiWebhookSecret = process.env.KUSHKI_WEBHOOK_SECRET || '';

    if (!this.kushkiPrivateKey) {
      console.warn('KUSHKI_PRIVATE_KEY not configured');
    }
  }

  /**
   * Create subscription with Kushki
   */
  async createSubscription(params: {
    token: string;
    planType: 'daily' | 'monthly';
    userId: string;
    userEmail: string;
  }): Promise<KushkiSubscriptionResponse> {
    try {
      // Get plan configuration
      const planConfig = this.getPlanConfig(params.planType);
      
      const requestData: KushkiSubscriptionRequest = {
        token: params.token,
        amount: planConfig.amount,
        currency: planConfig.currency,
        planId: planConfig.planId,
        email: params.userEmail,
        description: `${planConfig.name} subscription for user ${params.userId}`,
        metadata: {
          userId: params.userId,
          planType: params.planType
        }
      };

      const response = await this.makeKushkiRequest('/subscriptions', 'POST', requestData);
      
      return {
        subscriptionId: response.data.subscription_id,
        status: response.data.status,
        nextPaymentDate: new Date(response.data.next_payment_date),
        customerId: response.data.customer_id
      };
    } catch (error: any) {
      console.error('Kushki subscription creation failed:', error);
      this.handleKushkiError(error);
      throw error;
    }
  }

  /**
   * Cancel subscription with Kushki
   */
  async cancelSubscription(kushkiSubscriptionId: string): Promise<{
    cancelled: boolean;
    refundAmount: number;
  }> {
    try {
      const response = await this.makeKushkiRequest(
        `/subscriptions/${kushkiSubscriptionId}`, 
        'DELETE'
      );

      return {
        cancelled: response.data.cancelled,
        refundAmount: response.data.refund_amount || 0
      };
    } catch (error: any) {
      console.error('Kushki subscription cancellation failed:', error);
      this.handleKushkiError(error);
      throw error;
    }
  }

  /**
   * Process one-time payment
   */
  async processPayment(params: {
    token: string;
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<KushkiPaymentResponse> {
    try {
      const requestData = {
        token: params.token,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        metadata: params.metadata
      };

      const response = await this.makeKushkiRequest('/charges', 'POST', requestData);
      
      return {
        transactionId: response.data.transaction_id,
        status: response.data.status,
        authCode: response.data.auth_code,
        responseText: response.data.response_text,
        responseCode: response.data.response_code
      };
    } catch (error: any) {
      console.error('Kushki payment processing failed:', error);
      this.handleKushkiError(error);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string, secret?: string): boolean {
    try {
      const webhookSecret = secret || this.kushkiWebhookSecret;
      
      if (!webhookSecret) {
        console.warn('Webhook secret not configured');
        return false;
      }

      // Remove 'sha256=' prefix if present
      const cleanSignature = signature.replace('sha256=', '');
      
      // Calculate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature validation failed:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: KushkiWebhookEvent): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      console.log('Processing webhook event:', {
        event: event.event,
        paymentId: event.data.id,
        subscriptionId: event.data.subscription_id
      });

      switch (event.event) {
        case 'payment.success':
          return await this.handlePaymentSuccess(event);
        
        case 'payment.failed':
          return await this.handlePaymentFailed(event);
        
        case 'subscription.cancelled':
          return await this.handleSubscriptionCancelled(event);
        
        case 'payment.refunded':
          return await this.handlePaymentRefunded(event);
        
        default:
          console.log(`Unhandled webhook event: ${event.event}`);
          return { processed: false };
      }
    } catch (error: any) {
      console.error('Webhook processing failed:', error);
      return { processed: false, error: error.message };
    }
  }

  /**
   * Retry failed payment
   */
  async retryFailedPayment(subscriptionId: string): Promise<{
    willRetry: boolean;
    retryAt?: Date;
    error?: string;
  }> {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.canRetry()) {
        return { 
          willRetry: false, 
          error: 'Maximum retry attempts reached' 
        };
      }

      // Schedule retry (in production, this would use a job queue)
      const retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
      
      await subscription.incrementRetryCount();

      console.log(`Payment retry scheduled for subscription ${subscriptionId} at ${retryAt}`);
      
      return { willRetry: true, retryAt };
    } catch (error: any) {
      console.error('Failed payment retry failed:', error);
      return { willRetry: false, error: error.message };
    }
  }

  /**
   * Get subscription plans configuration
   */
  getSubscriptionPlans(): Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
    popular?: boolean;
  }> {
    return [
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
  }

  // Private methods
  private getPlanConfig(planType: 'daily' | 'monthly'): {
    planId: string;
    name: string;
    amount: number;
    currency: string;
  } {
    const configs = {
      daily: {
        planId: 'daily_2_50',
        name: 'Daily Access',
        amount: 250, // $2.50 in cents
        currency: 'USD'
      },
      monthly: {
        planId: 'monthly_10_00',
        name: 'Monthly Premium',
        amount: 1000, // $10.00 in cents
        currency: 'USD'
      }
    };

    return configs[planType];
  }

  private async makeKushkiRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${this.kushkiApiUrl}/v1${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Private-Merchant-Id': this.kushkiPrivateKey
    };

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
        timeout: 30000 // 30 second timeout
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Kushki API error
        throw new Error(error.response.data.message || 'Payment gateway error');
      } else if (error.request) {
        // Network error
        throw new Error('Payment gateway unavailable');
      } else {
        throw new Error('Payment processing failed');
      }
    }
  }

  private handleKushkiError(error: any): void {
    // Log specific Kushki error codes for monitoring
    if (error.response?.data?.code) {
      console.error(`Kushki Error ${error.response.data.code}: ${error.response.data.message}`);
    }
  }

  // Webhook handlers
  private async handlePaymentSuccess(event: KushkiWebhookEvent): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      // Check for duplicate processing
      const existingTransaction = await PaymentTransaction.findByKushkiPaymentId(event.data.id);
      if (existingTransaction) {
        return { processed: true }; // Already processed
      }

      // Find subscription
      const subscription = await Subscription.findOne({
        where: { kushkiSubscriptionId: event.data.subscription_id }
      });

      if (!subscription) {
        return { processed: false, error: 'Subscription not found' };
      }

      // Create transaction record
      await PaymentTransaction.create({
        subscriptionId: subscription.id,
        kushkiPaymentId: event.data.id,
        type: 'subscription_payment',
        status: 'completed',
        amount: event.data.amount,
        currency: event.data.currency,
        paymentMethod: 'card',
        processedAt: new Date(),
        kushkiResponse: event.data,
        metadata: event.data.metadata
      });

      // Extend subscription if payment was successful
      const now = new Date();
      const newExpiryDate = subscription.type === 'daily'
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
        : new Date(now.setMonth(now.getMonth() + 1));

      await subscription.update({
        expiresAt: newExpiryDate,
        status: 'active'
      });

      await subscription.resetRetryCount();

      return { processed: true };
    } catch (error: any) {
      return { processed: false, error: error.message };
    }
  }

  private async handlePaymentFailed(event: KushkiWebhookEvent): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      // Find subscription
      const subscription = await Subscription.findOne({
        where: { kushkiSubscriptionId: event.data.subscription_id }
      });

      if (!subscription) {
        return { processed: false, error: 'Subscription not found' };
      }

      // Create failed transaction record
      await PaymentTransaction.create({
        subscriptionId: subscription.id,
        kushkiPaymentId: event.data.id,
        type: 'subscription_payment',
        status: 'failed',
        amount: event.data.amount,
        currency: event.data.currency,
        paymentMethod: 'card',
        errorCode: event.data.error_code,
        errorMessage: event.data.error_message,
        failedAt: new Date(),
        kushkiResponse: event.data
      });

      // Schedule retry if possible
      if (subscription.canRetry()) {
        await this.retryFailedPayment(subscription.id);
      } else {
        // Mark subscription as expired after max retries
        await subscription.update({ status: 'expired' });
      }

      return { processed: true };
    } catch (error: any) {
      return { processed: false, error: error.message };
    }
  }

  private async handleSubscriptionCancelled(event: KushkiWebhookEvent): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      const subscription = await Subscription.findOne({
        where: { kushkiSubscriptionId: event.data.id }
      });

      if (!subscription) {
        return { processed: false, error: 'Subscription not found' };
      }

      await subscription.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: 'kushki_cancellation'
      });

      return { processed: true };
    } catch (error: any) {
      return { processed: false, error: error.message };
    }
  }

  private async handlePaymentRefunded(event: KushkiWebhookEvent): Promise<{
    processed: boolean;
    error?: string;
  }> {
    try {
      // Find original transaction
      const originalTransaction = await PaymentTransaction.findByKushkiPaymentId(
        event.data.id // This would be the original payment ID in the refund event
      );

      if (!originalTransaction) {
        return { processed: false, error: 'Original transaction not found' };
      }

      // Create refund transaction
      await PaymentTransaction.create({
        subscriptionId: originalTransaction.subscriptionId,
        kushkiPaymentId: `refund_${event.data.id}`,
        type: 'refund',
        status: 'completed',
        amount: -event.data.amount, // Negative amount for refund
        currency: event.data.currency,
        paymentMethod: originalTransaction.paymentMethod,
        processedAt: new Date(),
        kushkiResponse: event.data
      });

      return { processed: true };
    } catch (error: any) {
      return { processed: false, error: error.message };
    }
  }
}

// Create singleton instance
export const paymentService = new PaymentService();

// Export class for testing
export { PaymentService };

export default paymentService;