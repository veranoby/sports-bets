"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bet = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Fight_1 = require("./Fight");
const User_1 = require("./User");
// Definición del modelo Bet
class Bet extends sequelize_1.Model {
    // Métodos de instancia
    isPending() {
        return this.status === "pending";
    }
    isActive() {
        return this.status === "active";
    }
    isCompleted() {
        return this.status === "completed";
    }
    isWin() {
        return this.result === "win";
    }
    isLoss() {
        return this.result === "loss";
    }
    isDraw() {
        return this.result === "draw";
    }
    calculatePotentialWin() {
        var _a;
        if ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.ratio) {
            return this.amount * this.terms.ratio;
        }
        return this.potentialWin;
    }
    canBeMatched() {
        var _a;
        return this.status === "pending" && ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.isOffer) === true;
    }
    toPublicJSON() {
        return this.toJSON();
    }
}
exports.Bet = Bet;
// Inicialización del modelo
Bet.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    fightId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: Fight_1.Fight,
            key: "id",
        },
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    side: {
        type: sequelize_1.DataTypes.ENUM("red", "blue"),
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01,
            max: 10000.0,
        },
    },
    potentialWin: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01,
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("pending", "active", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
    },
    result: {
        type: sequelize_1.DataTypes.ENUM("win", "loss", "draw", "cancelled"),
        allowNull: true,
    },
    matchedWith: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: "bets",
            key: "id",
        },
    },
    terms: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
            ratio: 2.0,
            isOffer: true,
        },
    },
}, {
    sequelize: database_1.default,
    modelName: "Bet",
    tableName: "bets",
    timestamps: true,
    indexes: [
        {
            fields: ["fightId", "userId"],
            unique: true, // Previene que un usuario apueste múltiples veces en la misma pelea
        },
        {
            fields: ["createdAt"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["matchedWith"],
        },
        {
            fields: ["fightId", "status"],
        },
    ],
    hooks: {
        beforeCreate: (bet) => {
            var _a;
            // Calcular ganancia potencial si no está configurada
            if (!bet.potentialWin && ((_a = bet.terms) === null || _a === void 0 ? void 0 : _a.ratio)) {
                bet.potentialWin = bet.calculatePotentialWin();
            }
            // Validar que la ganancia potencial sea mayor que el monto apostado
            if (bet.potentialWin && bet.potentialWin <= bet.amount) {
                throw new Error("Potential win must be greater than bet amount");
            }
        },
        beforeUpdate: (bet) => {
            var _a;
            // Recalcular ganancia potencial si cambió el ratio
            if (bet.changed("terms") && ((_a = bet.terms) === null || _a === void 0 ? void 0 : _a.ratio)) {
                bet.potentialWin = bet.calculatePotentialWin();
            }
            // Validar que la ganancia potencial sea mayor que el monto apostado
            if (bet.potentialWin && bet.potentialWin <= bet.amount) {
                throw new Error("Potential win must be greater than bet amount");
            }
        },
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Bet;
