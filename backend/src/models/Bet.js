"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bet = void 0;
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var Fight_1 = require("./Fight");
var User_1 = require("./User");
// Definición del modelo Bet
var Bet = /** @class */ (function (_super) {
    __extends(Bet, _super);
    function Bet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Métodos de instancia
    Bet.prototype.isPending = function () {
        return this.status === "pending";
    };
    Bet.prototype.isActive = function () {
        return this.status === "active";
    };
    Bet.prototype.isCompleted = function () {
        return this.status === "completed";
    };
    Bet.prototype.isWin = function () {
        return this.result === "win";
    };
    Bet.prototype.isLoss = function () {
        return this.result === "loss";
    };
    Bet.prototype.isDraw = function () {
        return this.result === "draw";
    };
    Bet.prototype.calculatePotentialWin = function () {
        var _a;
        if ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.ratio) {
            return this.amount * this.terms.ratio;
        }
        return this.potentialWin;
    };
    Bet.prototype.canBeMatched = function () {
        var _a;
        return this.status === "pending" && ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.isOffer) === true;
    };
    Bet.prototype.toPublicJSON = function () {
        return this.toJSON();
    };
    Bet.prototype.isPagoProposal = function () {
        var _a;
        return this.betType === "flat" && ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.pagoAmount) !== undefined;
    };
    Bet.prototype.isDoyBet = function () {
        return this.betType === "doy";
    };
    Bet.prototype.canAcceptProposal = function () {
        var _a;
        return (this.proposalStatus === "pending" &&
            this.betType === "flat" &&
            ((_a = this.terms) === null || _a === void 0 ? void 0 : _a.proposedBy) !== undefined);
    };
    Bet.prototype.calculatePayoutAmounts = function () {
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
    };
    return Bet;
}(sequelize_1.Model));
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
        type: sequelize_1.DataTypes.JSON,
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
        beforeCreate: function (bet) {
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
        beforeUpdate: function (bet) {
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
