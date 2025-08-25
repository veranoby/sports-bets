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
    isPagoProposal() {
        var _a;
        return this.betType === "flat" && ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.pagoAmount) !== undefined;
    }
    isDoyBet() {
        return this.betType === "doy";
    }
    canAcceptProposal() {
        var _a;
        return (this.proposalStatus === "pending" &&
            this.betType === "flat" &&
            ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.proposedBy) !== undefined);
    }
    calculatePayoutAmounts() {
        var _a, _b;
        if (this.isDoyBet()) {
            return {
                winner: this.amount + (((_a = this.terms) === null || _a === void 0 ? void 0 : _a.doyAmount) || 0),
                loser: this.amount,
            };
        }
        else if (this.isPagoProposal()) {
            return {
                winner: this.amount,
                loser: this.amount + (((_b = this.terms) === null || _b === void 0 ? void 0 : _b.pagoAmount) || 0),
            };
        }
        return { winner: this.potentialWin, loser: this.amount };
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
        field: "fight_id",
        references: {
            model: Fight_1.Fight,
            key: "id",
        },
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "user_id",
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
        field: "potential_win",
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
        field: "matched_with",
        references: {
            model: "bets",
            key: "id",
        },
    },
    parentBetId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: "parent_bet_id",
        references: {
            model: "bets",
            key: "id",
        },
    },
    betType: {
        type: sequelize_1.DataTypes.ENUM("flat", "doy"),
        allowNull: false,
        defaultValue: "flat",
    },
    proposalStatus: {
        type: sequelize_1.DataTypes.ENUM("none", "pending", "accepted", "rejected"),
        allowNull: false,
        defaultValue: "none",
    },
    terms: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
            ratio: 2.0,
            isOffer: true,
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
    modelName: "Bet",
    tableName: "bets",
    timestamps: true,
    indexes: [
        {
            fields: ["fight_id", "user_id"],
            unique: true,
        },
        {
            fields: ["created_at"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["matched_with"],
        },
        {
            fields: ["fight_id", "status"],
        },
        {
            fields: ["parent_bet_id"],
        },
        {
            fields: ["bet_type"],
        },
        {
            fields: ["proposal_status"],
        },
    ],
    hooks: {
        beforeCreate: (bet) => {
            var _a, _b, _c;
            // Validar campos PAGO/DOY
            if (bet.betType === "doy" && !((_a = bet.terms) === null || _a === void 0 ? void 0 : _a.doyAmount)) {
                throw new Error("DOY bets require doyAmount in terms");
            }
            if (bet.isPagoProposal() && !((_b = bet.terms) === null || _b === void 0 ? void 0 : _b.pagoAmount)) {
                throw new Error("PAGO proposals require pagoAmount in terms");
            }
            // Calcular ganancia potencial si no está configurada
            if (!bet.potentialWin && ((_c = bet.terms) === null || _c === void 0 ? void 0 : _c.ratio)) {
                bet.potentialWin = bet.calculatePotentialWin();
            }
            // Validar que la ganancia potencial sea mayor que el monto apostado
            if (bet.potentialWin && bet.potentialWin <= bet.amount) {
                throw new Error("Potential win must be greater than bet amount");
            }
        },
        beforeUpdate: (bet) => {
            var _a, _b, _c;
            // Validar campos PAGO/DOY
            if (bet.changed("betType") || bet.changed("terms")) {
                if (bet.betType === "doy" && !((_a = bet.terms) === null || _a === void 0 ? void 0 : _a.doyAmount)) {
                    throw new Error("DOY bets require doyAmount in terms");
                }
                if (bet.isPagoProposal() && !((_b = bet.terms) === null || _b === void 0 ? void 0 : _b.pagoAmount)) {
                    throw new Error("PAGO proposals require pagoAmount in terms");
                }
            }
            // Recalcular ganancia potencial si cambió el ratio
            if (bet.changed("terms") && ((_c = bet.terms) === null || _c === void 0 ? void 0 : _c.ratio)) {
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
