import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  ForeignKey,
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
} from "sequelize";
import sequelize from "../config/database";
import { User } from "./User";

// Definición del modelo Wallet
class Wallet extends Model<
  InferAttributes<Wallet>,
  InferCreationAttributes<Wallet>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User["id"]>;
  declare balance: CreationOptional<number>;
  declare frozenAmount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones (declaradas pero no definidas aquí)
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, number>;

  public user?: User;
  public readonly transactions?: Transaction[];

  // Métodos de instancia
  getAvailableBalance(): number {
    const balance = parseFloat(String(this.balance));
    const frozen = parseFloat(String(this.frozenAmount));
    return balance - frozen;
  }

  getTotalBalance(): number {
    return parseFloat(String(this.balance));
  }

  canWithdraw(amount: number): boolean {
    return this.getAvailableBalance() >= amount;
  }

  canBet(amount: number): boolean {
    return this.getAvailableBalance() >= amount;
  }

  async freezeAmount(amount: number): Promise<boolean> {
    if (this.canBet(amount)) {
      this.frozenAmount = parseFloat(String(this.frozenAmount)) + amount;
      await this.save();
      return true;
    }
    return false;
  }

  async unfreezeAmount(amount: number): Promise<boolean> {
    const frozen = parseFloat(String(this.frozenAmount));
    if (frozen >= amount) {
      this.frozenAmount = frozen - amount;
      await this.save();
      return true;
    }
    return false;
  }

  async addBalance(amount: number): Promise<void> {
    this.balance = parseFloat(String(this.balance)) + amount;
    await this.save();
  }

  async deductBalance(amount: number): Promise<boolean> {
    const balance = parseFloat(String(this.balance));
    if (balance >= amount) {
      this.balance = balance - amount;
      await this.save();
      return true;
    }
    return false;
  }

  toPublicJSON() {
    return {
      balance: parseFloat(String(this.balance)),
      frozenAmount: parseFloat(String(this.frozenAmount)),
      availableBalance: parseFloat(String(this.getAvailableBalance())),
      updatedAt: this.updatedAt,
    };
  }
}

// Definición del modelo Transaction
class Transaction extends Model<
  InferAttributes<Transaction>,
  InferCreationAttributes<Transaction>
> {
  declare id: CreationOptional<string>;
  declare walletId: ForeignKey<Wallet["id"]>;
  declare type:
    | "deposit"
    | "withdrawal"
    | "bet-win"
    | "bet-loss"
    | "bet-refund"
    | "admin_credit"
    | "admin_debit";
  declare amount: number;
  declare status: CreationOptional<
    "pending" | "completed" | "failed" | "cancelled"
  >;
  declare reference: CreationOptional<string>;
  declare description: string;
  declare metadata: CreationOptional<any>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones (declaradas pero no definidas aquí)
  declare getWallet: BelongsToGetAssociationMixin<Wallet>;
  declare setWallet: BelongsToSetAssociationMixin<Wallet, number>;

  // Métodos de instancia
  isPending(): boolean {
    return this.status === "pending";
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  isFailed(): boolean {
    return this.status === "failed";
  }

  isDebit(): boolean {
    return ["withdrawal", "bet-loss", "admin_debit"].includes(this.type);
  }

  isCredit(): boolean {
    return ["deposit", "bet-win", "bet-refund", "admin_credit"].includes(this.type);
  }

  toPublicJSON() {
    return this.toJSON();
  }
}

// Inicialización del modelo Wallet
Wallet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
      },
    },
    frozenAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
      },
      field: "frozen_amount",
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
    modelName: "Wallet",
    tableName: "wallets",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
        unique: true,
      },
    ],
    validate: {
      // Validación para asegurar que el monto congelado no exceda el balance
      frozenNotExceedsBalance() {
        if ((this as any).frozenAmount > (this as any).balance) {
          throw new Error("Frozen amount cannot exceed balance");
        }
      },
    },
  }
);

// Inicialización del modelo Transaction
Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "wallet_id",
      references: {
        model: Wallet,
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "deposit",
        "withdrawal",
        "bet-win",
        "bet-loss",
        "bet-refund"
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
    indexes: [
      {
        fields: ["wallet_id"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["reference"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["wallet_id", "created_at"],
      },
    ],
  }
);

// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts

export { Wallet, Transaction };
