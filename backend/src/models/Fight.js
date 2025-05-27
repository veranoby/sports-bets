"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fight = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("./Event");
// Definición del modelo Fight
class Fight extends sequelize_1.Model {
    // Métodos de instancia
    isLive() {
        return this.status === "live";
    }
    isBettingOpen() {
        return this.status === "betting";
    }
    isCompleted() {
        return this.status === "completed";
    }
    canAcceptBets() {
        return this.status === "betting";
    }
    duration() {
        if (this.startTime && this.endTime) {
            return this.endTime.getTime() - this.startTime.getTime();
        }
        return null;
    }
    toPublicJSON() {
        return this.toJSON();
    }
}
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
        validate: {
            len: [2, 255],
        },
    },
    blueCorner: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
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
    },
    endTime: {
        type: sequelize_1.DataTypes.DATE,
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
    modelName: "Fight",
    tableName: "fights",
    timestamps: true,
    indexes: [
        {
            fields: ["eventId"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["eventId", "number"],
            unique: true,
        },
    ],
    validate: {
        // Validación personalizada para evitar criaderos iguales
        differentCorners() {
            if (this.redCorner === this.blueCorner) {
                throw new Error("Red and blue corners cannot be the same");
            }
        },
        // Validación de fechas
        endAfterStart() {
            if (this.startTime && this.endTime && this.endTime <= this.startTime) {
                throw new Error("End time must be after start time");
            }
        },
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Fight;
