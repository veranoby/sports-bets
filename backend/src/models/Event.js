"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
const Venue_1 = require("./Venue");
// Definición del modelo Event
class Event extends sequelize_1.Model {
    // Métodos de instancia
    isLive() {
        return this.status === "in-progress";
    }
    isUpcoming() {
        return (this.status === "scheduled" && new Date(this.scheduledDate) > new Date());
    }
    isCompleted() {
        return this.status === "completed";
    }
    generateStreamKey() {
        return `event_${this.id}_${Date.now()}`;
    }
    toPublicJSON() {
        const _a = this.toJSON(), { streamKey } = _a, publicData = __rest(_a, ["streamKey"]);
        return publicData;
    }
}
exports.Event = Event;
// Inicialización del modelo
Event.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [3, 255],
        },
    },
    venueId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "venue_id",
        references: {
            model: Venue_1.Venue,
            key: "id",
        },
    },
    scheduledDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "scheduled_date",
        validate: {
            isDate: true,
            isAfter: new Date().toISOString(), // Solo fechas futuras al crear
        },
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "end_date",
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("scheduled", "in-progress", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "scheduled",
    },
    operatorId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: "operator_id",
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    streamKey: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: "stream_key",
    },
    streamUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: "stream_url",
        validate: {
            isUrl: true,
        },
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "created_by",
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    totalFights: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "total_fights",
        validate: {
            min: 0,
            max: 200,
        },
    },
    completedFights: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "completed_fights",
        validate: {
            min: 0,
        },
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
    totalPrizePool: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: "total_prize_pool",
        validate: {
            min: 0,
        },
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
    modelName: "Event",
    tableName: "events",
    timestamps: true,
    indexes: [
        {
            fields: ["venue_id"],
        },
        {
            fields: ["operator_id"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["scheduled_date"],
        },
        {
            fields: ["stream_key"],
            unique: true,
        },
        {
            fields: ["venue_id", "scheduled_date"],
        },
    ],
    hooks: {
        beforeCreate: (event) => {
            if (!event.streamKey) {
                event.streamKey = event.generateStreamKey();
            }
        },
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Event;
