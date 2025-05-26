"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.Wallet = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
// Definición del modelo Wallet
class Wallet extends sequelize_1.Model {
    // Métodos de instancia
    getAvailableBalance() {
        return this.balance - this.frozenAmount;
    }
    getTotalBalance() {
        return this.balance;
    }
    canWithdraw(amount) {
        return this.getAvailableBalance() >= amount;
    }
    canBet(amount) {
        return this.getAvailableBalance() >= amount;
    }
    freezeAmount(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canBet(amount)) {
                this.frozenAmount += amount;
                yield this.save();
                return true;
            }
            return false;
        });
    }
    unfreezeAmount(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.frozenAmount >= amount) {
                this.frozenAmount -= amount;
                yield this.save();
                return true;
            }
            return false;
        });
    }
    addBalance(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            this.balance += amount;
            yield this.save();
        });
    }
    deductBalance(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.balance >= amount) {
                this.balance -= amount;
                yield this.save();
                return true;
            }
            return false;
        });
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
exports.Wallet = Wallet;
// Definición del modelo Transaction
class Transaction extends sequelize_1.Model {
    // Métodos de instancia
    isPending() {
        return this.status === "pending";
    }
    isCompleted() {
        return this.status === "completed";
    }
    isFailed() {
        return this.status === "failed";
    }
    isDebit() {
        return ["withdrawal", "bet-loss"].includes(this.type);
    }
    isCredit() {
        return ["deposit", "bet-win", "bet-refund"].includes(this.type);
    }
    toPublicJSON() {
        return this.toJSON();
    }
}
exports.Transaction = Transaction;
// Inicialización del modelo Wallet
Wallet.init({
    userId: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    balance: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
            min: 0,
        },
    },
    frozenAmount: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
            min: 0,
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
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
            if (this.frozenAmount > this.balance) {
                throw new Error("Frozen amount cannot exceed balance");
            }
        },
    },
});
// Inicialización del modelo Transaction
Transaction.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    walletId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: Wallet,
            key: "userId",
        },
    },
    type: {
        type: sequelize_1.DataTypes.ENUM("deposit", "withdrawal", "bet-win", "bet-loss", "bet-refund"),
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0.01,
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("pending", "completed", "failed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
    },
    reference: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
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
});
