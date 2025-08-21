import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Payment transaction attributes interface
export interface PaymentTransactionAttributes {
  id: string;
  subscriptionId: string;
  kushkiPaymentId?: string;
  kushkiTransactionId?: string;
  type: 'subscription_payment' | 'one_time_payment' | 'refund' | 'chargeback';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number; // Amount in cents
  currency: string;
  paymentMethod: 'card' | 'cash' | 'transfer';
  cardLast4?: string;
  cardBrand?: string;
  errorCode?: string;
  errorMessage?: string;
  kushkiResponse?: Record<string, any>;
  retryAttempt: number;
  processedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface PaymentTransactionCreationAttributes 
  extends Optional<PaymentTransactionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'retryAttempt'> {}

// Payment transaction model class
export class PaymentTransaction extends Model<PaymentTransactionAttributes, PaymentTransactionCreationAttributes> 
  implements PaymentTransactionAttributes {
  
  public id!: string;
  public subscriptionId!: string;
  public kushkiPaymentId?: string;
  public kushkiTransactionId?: string;
  public type!: 'subscription_payment' | 'one_time_payment' | 'refund' | 'chargeback';
  public status!: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  public amount!: number;
  public currency!: string;
  public paymentMethod!: 'card' | 'cash' | 'transfer';
  public cardLast4?: string;
  public cardBrand?: string;
  public errorCode?: string;
  public errorMessage?: string;
  public kushkiResponse?: Record<string, any>;
  public retryAttempt!: number;
  public processedAt?: Date;
  public failedAt?: Date;
  public refundedAt?: Date;
  public metadata?: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance methods
  public isCompleted(): boolean {
    return this.status === 'completed';
  }

  public isFailed(): boolean {
    return this.status === 'failed';
  }

  public canRetry(): boolean {
    return this.isFailed() && this.retryAttempt < 3;
  }

  public getFormattedAmount(): string {
    const amount = this.amount / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }

  public async markAsCompleted(kushkiData?: Record<string, any>): Promise<void> {
    await this.update({
      status: 'completed',
      processedAt: new Date(),
      kushkiResponse: kushkiData,
      errorCode: null,
      errorMessage: null
    });
  }

  public async markAsFailed(errorCode: string, errorMessage: string): Promise<void> {
    await this.update({
      status: 'failed',
      failedAt: new Date(),
      errorCode,
      errorMessage
    });
  }

  public async incrementRetryAttempt(): Promise<void> {
    await this.update({
      retryAttempt: this.retryAttempt + 1,
      status: 'pending'
    });
  }

  // Static methods
  static async findByKushkiPaymentId(kushkiPaymentId: string): Promise<PaymentTransaction | null> {
    return await PaymentTransaction.findOne({
      where: { kushkiPaymentId }
    });
  }

  static async findBySubscriptionId(subscriptionId: string): Promise<PaymentTransaction[]> {
    return await PaymentTransaction.findAll({
      where: { subscriptionId },
      order: [['createdAt', 'DESC']]
    });
  }

  static async findFailedTransactions(): Promise<PaymentTransaction[]> {
    return await PaymentTransaction.findAll({
      where: {
        status: 'failed',
        retryAttempt: {
          [require('sequelize').Op.lt]: 3
        }
      },
      order: [['failedAt', 'ASC']]
    });
  }

  static async getTransactionStats(subscriptionId: string): Promise<{
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    lastPayment?: Date;
  }> {
    const transactions = await PaymentTransaction.findAll({
      where: { subscriptionId }
    });

    const completed = transactions.filter(t => t.status === 'completed');
    const failed = transactions.filter(t => t.status === 'failed');
    
    const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0);
    const lastPayment = completed.length > 0 
      ? new Date(Math.max(...completed.map(t => t.processedAt?.getTime() || 0)))
      : undefined;

    return {
      totalAmount,
      successfulPayments: completed.length,
      failedPayments: failed.length,
      lastPayment
    };
  }
}

// Define the model
PaymentTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    kushkiPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    kushkiTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('subscription_payment', 'one_time_payment', 'refund', 'chargeback'),
      allowNull: false,
      defaultValue: 'subscription_payment'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
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
    paymentMethod: {
      type: DataTypes.ENUM('card', 'cash', 'transfer'),
      allowNull: false,
      defaultValue: 'card'
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    cardBrand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    kushkiResponse: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    retryAttempt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 3
      }
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'payment_transactions',
    modelName: 'PaymentTransaction',
    timestamps: true,
    indexes: [
      {
        fields: ['subscriptionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['kushkiPaymentId'],
        unique: true,
        where: {
          kushkiPaymentId: {
            [require('sequelize').Op.ne]: null
          }
        }
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['processedAt']
      },
      {
        fields: ['failedAt']
      },
      {
        fields: ['status', 'retryAttempt']
      }
    ],
    hooks: {
      beforeCreate: (transaction: PaymentTransaction) => {
        // Set processing timestamp for non-pending transactions
        if (transaction.status === 'processing') {
          transaction.processedAt = new Date();
        }
      },
      
      beforeUpdate: (transaction: PaymentTransaction) => {
        // Set timestamps based on status changes
        if (transaction.changed('status')) {
          switch (transaction.status) {
            case 'completed':
              if (!transaction.processedAt) {
                transaction.processedAt = new Date();
              }
              break;
            case 'failed':
              if (!transaction.failedAt) {
                transaction.failedAt = new Date();
              }
              break;
            case 'refunded':
              if (!transaction.refundedAt) {
                transaction.refundedAt = new Date();
              }
              break;
          }
        }
      }
    }
  }
);

export default PaymentTransaction;