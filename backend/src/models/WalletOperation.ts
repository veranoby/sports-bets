// backend/src/models/WalletOperation.ts
// Model for wallet operations (deposits and withdrawals)

import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Op,
} from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";
import { Wallet } from "./Wallet";

export class WalletOperation extends Model<
  InferAttributes<WalletOperation>,
  InferCreationAttributes<WalletOperation>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]>;
  declare walletId: ForeignKey<Wallet["id"]>;
  declare type: "deposit" | "withdrawal";
  declare amount: number;
  declare status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  declare paymentProofUrl?: string;
  declare adminProofUrl?: string;
  declare adminNotes?: string;
  declare rejectionReason?: string;
  declare processedBy?: string; // ID of admin who processed
  declare processedAt?: Date;
  declare completedAt?: Date;
  declare requestedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, number>;
  declare getWallet: BelongsToGetAssociationMixin<Wallet>;
  declare setWallet: BelongsToSetAssociationMixin<Wallet, number>;

  // Métodos de instancia
  isPending(): boolean {
    return this.status === "pending";
  }

  isApproved(): boolean {
    return this.status === "approved";
  }

  isRejected(): boolean {
    return this.status === "rejected";
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  isCancelled(): boolean {
    return this.status === "cancelled";
  }

  toPublicJSON() {
    const json = this.toJSON();
    return {
      id: json.id,
      userId: json.userId,
      type: json.type,
      amount: json.amount,
      status: json.status,
      paymentProofUrl: json.paymentProofUrl,
      adminProofUrl: json.adminProofUrl,
      adminNotes: json.adminNotes,
      rejectionReason: json.rejectionReason,
      processedBy: json.processedBy,
      processedAt: json.processedAt,
      completedAt: json.completedAt,
      requestedAt: json.requestedAt,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }

  static async validateDeposit(min: number, max: number, maxDaily: number, amount: number, userId: string): Promise<boolean> {
    if (amount < min || amount > max) {
      return false;
    }

    // Check daily limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const dailyTotal = await WalletOperation.sum('amount', {
      where: {
        userId,
        type: 'deposit',
        status: ['approved', 'completed'],
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });

    if ((dailyTotal || 0) + amount > maxDaily) {
      return false;
    }

    return true;
  }

  static async validateWithdrawal(min: number, max: number, maxDaily: number, amount: number, userId: string, walletBalance: number): Promise<boolean> {
    if (amount < min || amount > max) {
      return false;
    }

    if (amount > walletBalance) {
      return false;
    }

    // Check daily limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const dailyTotal = await WalletOperation.sum('amount', {
      where: {
        userId,
        type: 'withdrawal',
        status: ['pending', 'approved', 'completed'], // Include pending to prevent exceeding limit
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });

    if ((dailyTotal || 0) + amount > maxDaily) {
      return false;
    }

    return true;
  }
}

// Inicialización del modelo
WalletOperation.init(
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
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "wallet_id",
      references: {
        model: Wallet,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("deposit", "withdrawal"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        isFloat: true,
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled", "completed"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentProofUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "payment_proof_url",
      validate: {
        isUrl: true,
      },
    },
    adminProofUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "admin_proof_url",
      validate: {
        isUrl: true,
      },
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "admin_notes",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },
    processedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "processed_by",
      references: {
        model: User,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "processed_at",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completed_at",
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "requested_at",
      defaultValue: DataTypes.NOW,
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
  },
  {
    sequelize,
    modelName: "WalletOperation",
    tableName: "wallet_operations",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id", "created_at"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["user_id", "type", "status"],
      },
      {
        fields: ["created_at"],
        name: "wallet_operations_created_at_idx",
      },
      {
        fields: ["user_id", "requested_at"],
        name: "wallet_operations_user_requested_idx",
      },
    ],
    hooks: {
      beforeCreate: (operation: WalletOperation) => {
        // Validate that admin proof is required for withdrawals
        if (operation.type === "withdrawal" && operation.status === "completed" && !operation.adminProofUrl) {
          throw new Error("Admin proof is required for withdrawal completion");
        }
      },
      beforeUpdate: (operation: WalletOperation) => {
        // Validate that admin proof is required for withdrawals when completing
        if (operation.type === "withdrawal" && operation.changed("status")) {
          if (operation.status === "completed" && !operation.adminProofUrl) {
            throw new Error("Admin proof is required for withdrawal completion");
          }
        }
      },
    },
  }
);

export default WalletOperation;