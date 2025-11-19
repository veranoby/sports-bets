import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Subscription attributes interface
export interface SubscriptionAttributes {
  id: string;
  userId: string;
  type: 'daily' | 'monthly' | null;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'free';
  kushkiSubscriptionId?: string;
  paymentMethod: 'card' | 'cash' | 'transfer';
  autoRenew: boolean;
  amount: number; // Amount in cents
  currency: string;
  expiresAt: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  retryCount: number;
  maxRetries: number;
  features: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  manual_expires_at?: Date;
  payment_proof_url?: string;
  assigned_by_admin_id?: string;
  assigned_username?: string;
}

// Optional attributes for creation
export interface SubscriptionCreationAttributes 
  extends Optional<SubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'retryCount' | 'maxRetries'> {}

// Subscription model class with proper camelCase → snake_case mapping
export class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> 
  implements SubscriptionAttributes {
  
  // TypeScript properties (camelCase) - automatically mapped to snake_case in DB
  public id!: string;
  public userId!: string; // → user_id
  public type!: 'daily' | 'monthly' | null;
  public status!: 'active' | 'cancelled' | 'expired' | 'pending' | 'free';
  public kushkiSubscriptionId?: string; // → kushki_subscription_id
  public paymentMethod!: 'card' | 'cash' | 'transfer'; // → payment_method
  public autoRenew!: boolean; // → auto_renew
  public amount!: number;
  public currency!: string;
  public expiresAt!: Date; // → expires_at
  public nextBillingDate?: Date; // → next_billing_date
  public cancelledAt?: Date; // → cancelled_at
  public cancelReason?: string; // → cancel_reason
  public retryCount!: number; // → retry_count
  public maxRetries!: number; // → max_retries
  public features!: string[];
  public metadata?: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
  public manual_expires_at?: Date;
  public payment_proof_url?: string;
  public assigned_by_admin_id?: string;
  public assigned_username?: string;

  // Instance methods
  public isActive(): boolean {
    return this.status === 'active' && new Date(this.expiresAt) > new Date();
  }

  public isExpired(): boolean {
    return this.status === 'expired' || new Date(this.expiresAt) <= new Date();
  }

  public isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  public getRemainingDays(): number {
    if (this.isExpired()) return 0;
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  public canRetry(): boolean {
    return this.getRetryCount() < this.getMaxRetries();
  }

  public hasFeature(feature: string): boolean {
    return this.features.includes(feature);
  }

  public async markAsExpired(): Promise<void> {
    this.setNextBillingDate(null);
    await this.update({
      status: 'expired',
      autoRenew: false,
      metadata: this.metadata
    });
  }

  public async incrementRetryCount(): Promise<void> {
    const currentCount = this.getRetryCount();
    this.setRetryCount(currentCount + 1);
    await this.update({
      metadata: this.metadata
    });
  }

  public async resetRetryCount(): Promise<void> {
    this.setRetryCount(0);
    await this.update({
      metadata: this.metadata
    });
  }

  public getFormattedAmount(): string {
    const amount = this.amount / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }

  // ============================================================
  // METADATA ACCESSORS - Transparent access to metadata.payment
  // These getters/setters provide backward compatibility
  // Original columns are preserved in DB, but data lives in metadata
  // ============================================================

  /**
   * Get next billing date from metadata.payment or fallback to column
   */
  public getNextBillingDate(): Date | null {
    // Try metadata.payment first (migrated data)
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (payment?.nextBillingDate) {
        return new Date(payment.nextBillingDate);
      }
    }
    // Fallback to direct column (pre-migration)
    return this.nextBillingDate ? new Date(this.nextBillingDate) : null;
  }

  /**
   * Set next billing date in metadata.payment
   */
  public setNextBillingDate(date: Date | null): void {
    if (!this.metadata) this.metadata = {};
    if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
      if (!((this.metadata as any).payment)) {
        (this.metadata as any).payment = {};
      }
      (this.metadata as any).payment.nextBillingDate = date ? date.toISOString() : null;
    }
  }

  /**
   * Get cancelled date from metadata.payment or fallback to column
   */
  public getCancelledAt(): Date | null {
    // Try metadata.payment first
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (payment?.cancelledAt) {
        return new Date(payment.cancelledAt);
      }
    }
    // Fallback to direct column
    return this.cancelledAt ? new Date(this.cancelledAt) : null;
  }

  /**
   * Set cancelled date in metadata.payment
   */
  public setCancelledAt(date: Date | null): void {
    if (!this.metadata) this.metadata = {};
    if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
      if (!((this.metadata as any).payment)) {
        (this.metadata as any).payment = {};
      }
      (this.metadata as any).payment.cancelledAt = date ? date.toISOString() : null;
    }
  }

  /**
   * Get cancel reason from metadata.payment or fallback to column
   */
  public getCancelReason(): string | null {
    // Try metadata.payment first
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (payment?.cancelReason) {
        return payment.cancelReason;
      }
    }
    // Fallback to direct column
    return this.cancelReason || null;
  }

  /**
   * Set cancel reason in metadata.payment
   */
  public setCancelReason(reason: string | null): void {
    if (!this.metadata) this.metadata = {};
    if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
      if (!((this.metadata as any).payment)) {
        (this.metadata as any).payment = {};
      }
      (this.metadata as any).payment.cancelReason = reason;
    }
  }

  /**
   * Get retry count from metadata.payment or fallback to column
   */
  public getRetryCount(): number {
    // Try metadata.payment first
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (typeof payment?.retryCount === 'number') {
        return payment.retryCount;
      }
    }
    // Fallback to direct column
    return this.retryCount || 0;
  }

  /**
   * Set retry count in metadata.payment
   */
  public setRetryCount(count: number): void {
    if (!this.metadata) this.metadata = {};
    if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
      if (!((this.metadata as any).payment)) {
        (this.metadata as any).payment = {};
      }
      (this.metadata as any).payment.retryCount = count;
    }
  }

  /**
   * Get max retries from metadata.payment or fallback to column
   */
  public getMaxRetries(): number {
    // Try metadata.payment first
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (typeof payment?.maxRetries === 'number') {
        return payment.maxRetries;
      }
    }
    // Fallback to direct column
    return this.maxRetries || 3;
  }

  /**
   * Set max retries in metadata.payment
   */
  public setMaxRetries(count: number): void {
    if (!this.metadata) this.metadata = {};
    if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
      if (!((this.metadata as any).payment)) {
        (this.metadata as any).payment = {};
      }
      (this.metadata as any).payment.maxRetries = count;
    }
  }

  /**
   * Get Kushki subscription ID from metadata.payment or fallback to column
   */
  public getKushkiSubscriptionId(): string | null {
    // Try metadata.payment first
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (payment?.kushkiSubscriptionId) {
        return payment.kushkiSubscriptionId;
      }
    }
    // Fallback to direct column
    return this.kushkiSubscriptionId || null;
  }

  /**
   * Set Kushki subscription ID in metadata.payment
   */
  public setKushkiSubscriptionId(id: string | null): void {
    if (!this.metadata) this.metadata = {};
    if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
      if (!((this.metadata as any).payment)) {
        (this.metadata as any).payment = {};
      }
      (this.metadata as any).payment.kushkiSubscriptionId = id;
    }
  }

  /**
   * Get admin data from metadata.admin
   */
  public getAdminMetadata(): { assignedByAdminId?: string; assignedUsername?: string } | null {
    if (this.metadata && typeof this.metadata === 'object') {
      const admin = (this.metadata as any).admin;
      if (admin) {
        return {
          assignedByAdminId: admin.assignedByAdminId,
          assignedUsername: admin.assignedUsername
        };
      }
    }
    // Fallback to direct columns
    if (this.assigned_by_admin_id || this.assigned_username) {
      return {
        assignedByAdminId: this.assigned_by_admin_id,
        assignedUsername: this.assigned_username
      };
    }
    return null;
  }

  /**
   * Get payment metadata
   */
  public getPaymentMetadata(): Record<string, any> | null {
    if (this.metadata && typeof this.metadata === 'object') {
      const payment = (this.metadata as any).payment;
      if (payment) {
        return payment;
      }
    }
    return null;
  }

  // Static methods
  static async findActiveByUserId(userId: string): Promise<Subscription | null> {
    return await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  static async findByKushkiSubscriptionId(kushkiSubscriptionId: string): Promise<Subscription | null> {
    return await Subscription.findOne({
      where: { kushkiSubscriptionId }
    });
  }

  static async findExpiredSubscriptions(): Promise<Subscription[]> {
    return await Subscription.findAll({
      where: {
        status: 'active',
        expiresAt: {
          [require('sequelize').Op.lte]: new Date()
        }
      }
    });
  }

  static async findRetryableSubscriptions(): Promise<Subscription[]> {
    return await Subscription.findAll({
      where: {
        status: 'active',
        retryCount: {
          [require('sequelize').Op.lt]: require('sequelize').col('maxRetries')
        },
        expiresAt: {
          [require('sequelize').Op.lte]: new Date()
        }
      }
    });
  }

  static async getSubscriptionStats(userId?: string): Promise<{
    total: number;
    active: number;
    cancelled: number;
    expired: number;
  }> {
    const whereClause = userId ? { userId } : {};
    
    const [total, active, cancelled, expired] = await Promise.all([
      Subscription.count({ where: whereClause }),
      Subscription.count({ where: { ...whereClause, status: 'active' } }),
      Subscription.count({ where: { ...whereClause, status: 'cancelled' } }),
      Subscription.count({ where: { ...whereClause, status: 'expired' } })
    ]);

    return { total, active, cancelled, expired };
  }

  // Legacy methods for compatibility with old code
  public getPlanPrice(): number {
    return this.amount / 100; // Convert cents to dollars
  }

  public daysRemaining(): number {
    return this.getRemainingDays();
  }

  public async extend(): Promise<void> {
    const extensionTime = (this.type === 'daily' || this.type === null)
      ? 24 * 60 * 60 * 1000 // 24 hours
      : 30 * 24 * 60 * 60 * 1000; // 30 days
    
    await this.update({
      expiresAt: new Date(this.expiresAt.getTime() + extensionTime)
    });
  }

  public async cancel(): Promise<void> {
    await this.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      autoRenew: false,
      nextBillingDate: null
    });
  }

  public toPublicJSON() {
    return {
      id: this.id,
      type: this.type,
      plan: this.type, // Legacy compatibility
      status: this.status,
      expiresAt: this.expiresAt,
      endDate: this.expiresAt, // Legacy compatibility
      autoRenew: this.autoRenew,
      amount: this.amount,
      formattedAmount: this.getFormattedAmount(),
      currency: this.currency,
      features: this.features,
      remainingDays: this.getRemainingDays(),
      daysRemaining: this.getRemainingDays(), // Legacy compatibility
      isActive: this.isActive(),
      nextBillingDate: this.nextBillingDate,
      createdAt: this.createdAt
    };
  }

  // Manual membership management methods
  async assignManualMembership(membershipType: 'free' | '24h' | 'monthly', adminId: string, assignedUsername: string) {
    const now = new Date();
    let expiresAt: Date | null = null;
    
    if (membershipType === '24h') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (membershipType === 'monthly') {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }
    
    await this.update({
      status: membershipType === 'free' ? 'free' : 'active',
      manual_expires_at: expiresAt,
      assigned_by_admin_id: adminId,
      assigned_username: assignedUsername,
      expiresAt: expiresAt
    });
    
    return this;
  }
}

// Define the model
Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.ENUM('daily', 'monthly'),
      allowNull: true, // Temporarily allow null for migration
      defaultValue: 'daily'
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending', 'free'),
      allowNull: false,
      defaultValue: 'pending'
    },
    kushkiSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: "kushki_subscription_id",
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'cash', 'transfer'),
      allowNull: false,
      defaultValue: 'card',
      field: "payment_method",
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "auto_renew",
    },
    amount: {
      type: DataTypes.INTEGER, // Amount in cents
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "next_billing_date",
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "cancelled_at",
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "cancel_reason",
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "retry_count",
      validate: {
        min: 0
      }
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: "max_retries",
      validate: {
        min: 0
      }
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: () => {
        // Default features based on subscription type
        return ['Live streaming', 'HD quality', 'Chat access'];
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
    manual_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Manual expiration for admin-assigned memberships'
    },
    payment_proof_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL to uploaded payment proof image'
    },
    assigned_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin who assigned this membership'
    },
    assigned_username: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Username specified in payment proof'
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    modelName: 'Subscription',
    timestamps: true,
    underscored: true, // Enable snake_case mapping
    indexes: [
      {
        name: 'idx_subscriptions_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_subscriptions_status',
        fields: ['status']
      },
      {
        name: 'idx_subscriptions_type',
        fields: ['type']
      },
      {
        name: 'idx_subscriptions_expires_at',
        fields: ['expires_at']
      },
      {
        name: 'subscriptions_kushki_subscription_id_unique',
        fields: ['kushki_subscription_id'],
        unique: true,
        where: {
          kushki_subscription_id: {
            [require('sequelize').Op.ne]: null
          }
        }
      },
      {
        name: 'idx_subscriptions_status_expires',
        fields: ['status', 'expires_at']
      },
      {
        name: 'idx_subscriptions_retry',
        fields: ['retry_count', 'max_retries']
      }
    ],
    hooks: {
      beforeCreate: (subscription: Subscription) => {
        // Set default features based on subscription type
        if (!subscription.features || subscription.features.length === 0) {
          subscription.features = (subscription.type === 'daily' || subscription.type === null)
            ? ['Live streaming', 'HD quality', 'Chat access']
            : ['Live streaming', '720p quality', 'Chat access', 'Ad-free', 'Exclusive content'];
        }
        
        // Set default type if null
        if (!subscription.type) {
          subscription.type = 'daily';
        }
      },
      
      beforeUpdate: (subscription: Subscription) => {
        // Auto-expire subscriptions that have passed their expiry date
        if (subscription.changed('expiresAt') || subscription.changed('status')) {
          if (subscription.status === 'active' && subscription.isExpired()) {
            subscription.status = 'expired';
            subscription.autoRenew = false;
            subscription.nextBillingDate = null;
          }
        }
      }
    }
  }
);

export default Subscription;