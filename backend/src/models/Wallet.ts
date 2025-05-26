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
  declare userId: ForeignKey<User["id"]>;
  declare balance: CreationOptional<number>;
  declare frozenAmount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, number>;

  // Métodos de instancia
  getAvailableBalance(): number {
    return this.balance - this.frozenAmount;
  }

  getTotalBalance(): number {
    return this.balance;
  }

  canWithdraw(amount: number): boolean {
    return this.getAvailableBalance() >= amount;
  }

  canBet(amount: number): boolean {
    return this.getAvailableBalance() >= amount;
  }

  async freezeAmount(amount: number): Promise<boolean> {
    if (this.canBet(amount)) {
      this.frozenAmount += amount;
      await this.save();
      return true;
    }
    return false;
  }

  async unfreezeAmount(amount: number): Promise<boolean> {
    if (this.frozenAmount >= amount) {
      this.frozenAmount -= amount;
      await this.save();
      return true;
    }
    return false;
  }

  async addBalance(amount: number): Promise<void> {
    this.balance += amount;
    await this.save();
  }

  async deductBalance(amount: number): Promise<boolean> {
    if (this.balance >= amount) {
      this.balance -= amount;
      await this.save();
      return true;
    }
    return false;
  }

  toPublicJSON() {
    return {
      balance: this.balance,
      frozenAmount: this.frozenAmount,
      availableBalance: this.getAvailableBalance(),
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
  declare walletId: ForeignKey<Wallet["userId"]>;
  declare type:
    | "deposit"
    | "withdrawal"
    | "bet-win"
    | "bet-loss"
    | "bet-refund";
  declare amount: number;
  declare status: CreationOptional<
    "pending" | "completed" | "failed" | "cancelled"
  >;
  declare reference: CreationOptional<string>;
  declare description: string;
  declare metadata: CreationOptional<any>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones
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
    return ["withdrawal", "bet-loss"].includes(this.type);
  }

  isCredit(): boolean {
    return ["deposit", "bet-win", "bet-refund"].includes(this.type);
  }

  toPublicJSON() {
    return this.toJSON();
  }
}

// Inicialización del modelo Wallet
Wallet.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
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
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Wallet",
    tableName: "wallets",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
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
      references: {
        model: Wallet,
        key: "userId",
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
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
    indexes: [
      {
        fields: ["walletId"],
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
        fields: ["createdAt"],
      },
    ],
  }
);

// Definir asociaciones
Wallet.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Wallet.hasMany(Transaction, {
  foreignKey: "walletId",
  as: "transactions",
});

Transaction.belongsTo(Wallet, {
  foreignKey: "walletId",
  as: "wallet",
});

User.hasOne(Wallet, {
  foreignKey: "userId",
  as: "wallet",
});

export { Wallet, Transaction };
