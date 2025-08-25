import { DataTypes, Model, Optional, CreationOptional } from "sequelize";
import { sequelize } from "../config/database";

// Payment transaction attributes interface
export interface PaymentTransactionAttributes {
  id: string;
  subscriptionId: string;
  kushkiPaymentId?: string;
  kushkiTransactionId?: string;
  kushkiTicketNumber?: string;
  type: string;
  transactionType: string;
  paymentMethod: "card" | "cash" | "transfer" | "wallet";
  idempotencyKey?: string;
  retryCount: number;
  maxRetries: number;
  status: string;
  amount: number;
  currency: string;
  cardLast4?: string;
  cardBrand?: string;
  errorCode?: string;
  errorMessage?: string;
  kushkiResponse?: object;
  retryAttempt: number;
  processedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  metadata?: object;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation
export interface PaymentTransactionCreationAttributes
  extends Optional<
    PaymentTransactionAttributes,
    "id" | "createdAt" | "updatedAt" | "retryAttempt"
  > {}

// Payment transaction model class
export class PaymentTransaction
  extends Model<
    PaymentTransactionAttributes,
    PaymentTransactionCreationAttributes
  >
  implements PaymentTransactionAttributes
{
  public id!: string;
  public subscriptionId!: string;
  public kushkiPaymentId?: string;
  public kushkiTransactionId?: string;
  public type!:
    | "subscription_payment"
    | "one_time_payment"
    | "refund"
    | "chargeback";
  public status!:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded";
  public amount!: number;
  public currency!: string;
  public paymentMethod!: "card" | "cash" | "transfer" | "wallet";
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
  declare kushkiTicketNumber: CreationOptional<string>;
  declare transactionType: string;
  declare idempotencyKey: CreationOptional<string>;
  declare retryCount: number;
  declare maxRetries: number;

  // Instance methods
  public isCompleted(): boolean {
    return this.status === "completed";
  }

  public isFailed(): boolean {
    return this.status === "failed";
  }

  public canRetry(): boolean {
    return this.isFailed() && this.retryAttempt < 3;
  }

  public getFormattedAmount(): string {
    const amount = this.amount / 100; // Convert cents to dollars
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currency,
    }).format(amount);
  }

  public async markAsCompleted(
    kushkiData?: Record<string, any>
  ): Promise<void> {
    await this.update({
      status: "completed",
      processedAt: new Date(),
      kushkiResponse: kushkiData,
      errorCode: null,
      errorMessage: null,
    });
  }

  public async markAsFailed(
    errorCode: string,
    errorMessage: string
  ): Promise<void> {
    await this.update({
      status: "failed",
      failedAt: new Date(),
      errorCode,
      errorMessage,
    });
  }

  public async incrementRetryAttempt(): Promise<void> {
    await this.update({
      retryAttempt: this.retryAttempt + 1,
      status: "pending",
    });
  }

  // Static methods
  static async findByKushkiPaymentId(
    kushkiPaymentId: string
  ): Promise<PaymentTransaction | null> {
    return await PaymentTransaction.findOne({
      where: { kushkiPaymentId },
    });
  }

  static async findBySubscriptionId(
    subscriptionId: string
  ): Promise<PaymentTransaction[]> {
    return await PaymentTransaction.findAll({
      where: { subscriptionId },
      order: [["createdAt", "DESC"]],
    });
  }

  static async findFailedTransactions(): Promise<PaymentTransaction[]> {
    return await PaymentTransaction.findAll({
      where: {
        status: "failed",
        retryAttempt: {
          [require("sequelize").Op.lt]: 3,
        },
      },
      order: [["failedAt", "ASC"]],
    });
  }

  static async getTransactionStats(subscriptionId: string): Promise<{
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    lastPayment?: Date;
  }> {
    const transactions = await PaymentTransaction.findAll({
      where: { subscriptionId },
    });

    const completed = transactions.filter((t) => t.status === "completed");
    const failed = transactions.filter((t) => t.status === "failed");

    const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0);
    const lastPayment =
      completed.length > 0
        ? new Date(
            Math.max(...completed.map((t) => t.processedAt?.getTime() || 0))
          )
        : undefined;

    return {
      totalAmount,
      successfulPayments: completed.length,
      failedPayments: failed.length,
      lastPayment,
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
      field: "subscription_id",
      references: {
        model: "subscriptions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    kushkiPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: "kushki_payment_id",
    },
    kushkiTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "kushki_transaction_id",
    },
    kushkiTicketNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "kushki_ticket_number",
    },
    type: {
      type: DataTypes.ENUM(
        "subscription_payment",
        "one_time_payment",
        "refund",
        "chargeback"
      ),
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM(
        "subscription_payment",
        "subscription_refund",
        "bet_deposit",
        "bet_withdrawal"
      ),
      allowNull: false,
      field: "transaction_type",
    },
    paymentMethod: {
      type: DataTypes.ENUM("card", "cash", "transfer", "wallet"),
      allowNull: false,
      field: "payment_method",
    },
    idempotencyKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "idempotency_key",
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "processed_at",
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "retry_count",
      defaultValue: 0,
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "max_retries",
      defaultValue: 3,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    amount: {
      type: DataTypes.INTEGER, // Amount in cents
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "USD",
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: true,
      field: "card_last_4",
    },
    cardBrand: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "card_brand",
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "error_code",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
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
        max: 3,
      },
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "failed_at",
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "refunded_at",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payment_transactions",
    modelName: "PaymentTransaction",
    timestamps: true,
    indexes: [
      {
        fields: ["subscriptionId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["kushkiPaymentId"],
        unique: true,
        where: {
          kushkiPaymentId: {
            [require("sequelize").Op.ne]: null,
          },
        },
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["processedAt"],
      },
      {
        fields: ["failedAt"],
      },
      {
        fields: ["status", "retryAttempt"],
      },
    ],
    hooks: {
      beforeCreate: (transaction: PaymentTransaction) => {
        // Set processing timestamp for non-pending transactions
        if (transaction.status === "processing") {
          transaction.processedAt = new Date();
        }
      },

      beforeUpdate: (transaction: PaymentTransaction) => {
        // Set timestamps based on status changes
        if (transaction.changed("status")) {
          switch (transaction.status) {
            case "completed":
              if (!transaction.processedAt) {
                transaction.processedAt = new Date();
              }
              break;
            case "failed":
              if (!transaction.failedAt) {
                transaction.failedAt = new Date();
              }
              break;
            case "refunded":
              if (!transaction.refundedAt) {
                transaction.refundedAt = new Date();
              }
              break;
          }
        }
      },
    },
  }
);

export default PaymentTransaction;
