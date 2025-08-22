import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Subscription attributes interface
export interface SubscriptionAttributes {
  id: string;
  userId: string;
  type: 'daily' | 'monthly' | null; // Temporarily allow null for migration
  status: 'active' | 'cancelled' | 'expired' | 'pending';
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
}

// Optional attributes for creation
export interface SubscriptionCreationAttributes 
  extends Optional<SubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'retryCount' | 'maxRetries'> {}

// Subscription model class
export class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> 
  implements SubscriptionAttributes {
  
  public id!: string;
  public userId!: string;
  public type!: 'daily' | 'monthly' | null;
  public status!: 'active' | 'cancelled' | 'expired' | 'pending';
  public kushkiSubscriptionId?: string;
  public paymentMethod!: 'card' | 'cash' | 'transfer';
  public autoRenew!: boolean;
  public amount!: number;
  public currency!: string;
  public expiresAt!: Date;
  public nextBillingDate?: Date;
  public cancelledAt?: Date;
  public cancelReason?: string;
  public retryCount!: number;
  public maxRetries!: number;
  public features!: string[];
  public metadata?: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

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
    return this.retryCount < this.maxRetries;
  }

  public hasFeature(feature: string): boolean {
    return this.features.includes(feature);
  }

  public async markAsExpired(): Promise<void> {
    await this.update({
      status: 'expired',
      autoRenew: false,
      nextBillingDate: null
    });
  }

  public async incrementRetryCount(): Promise<void> {
    await this.update({
      retryCount: this.retryCount + 1
    });
  }

  public async resetRetryCount(): Promise<void> {
    await this.update({
      retryCount: 0
    });
  }

  public getFormattedAmount(): string {
    const amount = this.amount / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
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
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
      allowNull: false,
      defaultValue: 'pending'
    },
    kushkiSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'cash', 'transfer'),
      allowNull: false,
      defaultValue: 'card'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    modelName: 'Subscription',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['kushkiSubscriptionId'],
        unique: true,
        where: {
          kushkiSubscriptionId: {
            [require('sequelize').Op.ne]: null
          }
        }
      },
      {
        fields: ['status', 'expiresAt']
      },
      {
        fields: ['retryCount', 'maxRetries']
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