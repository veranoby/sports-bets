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
exports.Fight = void 0;
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var Event_1 = require("./Event");
// Definición del modelo Fight
var Fight = /** @class */ (function (_super) {
    __extends(Fight, _super);
    function Fight() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Métodos de instancia
    Fight.prototype.isLive = function () {
        return this.status === "live";
    };
    Fight.prototype.isBettingOpen = function () {
        return this.status === "betting";
    };
    Fight.prototype.isCompleted = function () {
        return this.status === "completed";
    };
    Fight.prototype.canAcceptBets = function () {
        var now = new Date();
        return (this.status === "betting" &&
            (!this.bettingStartTime || now >= this.bettingStartTime) &&
            (!this.bettingEndTime || now <= this.bettingEndTime));
    };
    Fight.prototype.duration = function () {
        if (this.startTime && this.endTime) {
            return this.endTime.getTime() - this.startTime.getTime();
        }
        return null;
    };
    Fight.prototype.toPublicJSON = function () {
        return this.toJSON();
    };
    Fight.prototype.canTransitionTo = function (newStatus) {
        var _a, _b;
        var validTransitions = {
            "upcoming": ["betting", "cancelled"],
            "betting": ["live", "cancelled"],
            "live": ["completed", "cancelled"],
            "completed": [],
            "cancelled": []
        };
        return (_b = (_a = validTransitions[this.status]) === null || _a === void 0 ? void 0 : _a.includes(newStatus)) !== null && _b !== void 0 ? _b : false;
    };
    return Fight;
}(sequelize_1.Model));
exports.Fight = Fight;
// Inicialización del modelo
Fight.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    eventId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "event_id",
        references: {
            model: Event_1.Event,
            key: "id",
        },
    },
    number: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 999,
        },
    },
    redCorner: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        field: "red_corner",
        validate: {
            len: [2, 255],
        },
    },
    blueCorner: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        field: "blue_corner",
        validate: {
            len: [2, 255],
        },
    },
    weight: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 1.0,
            max: 10.0,
        },
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    initialOdds: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        field: "initial_odds",
        defaultValue: {
            red: 1.0,
            blue: 1.0,
        },
    },
    bettingStartTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "betting_start_time",
    },
    bettingEndTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "betting_end_time",
    },
    totalBets: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "total_bets",
        validate: {
            min: 0,
        },
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: "total_amount",
        validate: {
            min: 0,
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("upcoming", "betting", "live", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "upcoming",
    },
    result: {
        type: sequelize_1.DataTypes.ENUM("red", "blue", "draw", "cancelled"),
        allowNull: true,
    },
    startTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "start_time",
    },
    endTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "end_time",
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "created_at",
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
    },
}, {
    sequelize: database_1.default,
    modelName: "Fight",
    tableName: "fights",
    timestamps: true,
    indexes: [
        {
            fields: ["event_id"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["event_id", "number"],
            unique: true,
        },
        {
            fields: ["event_id", "status"],
        },
    ],
    validate: {
        // Validación personalizada para evitar criaderos iguales
        differentCorners: function () {
            if (this.redCorner === this.blueCorner) {
                throw new Error("Red and blue corners cannot be the same");
            }
        },
        // Validación de fechas
        endAfterStart: function () {
            if (this.startTime && this.endTime && this.endTime <= this.startTime) {
                throw new Error("End time must be after start time");
            }
        },
        bettingWindow: function () {
            if (this.bettingStartTime &&
                this.bettingEndTime &&
                this.bettingEndTime <= this.bettingStartTime) {
                throw new Error("Betting end time must be after start time");
            }
        },
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Fight;
