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
exports.Event = void 0;
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var User_1 = require("./User");
// Definición del modelo Event
var Event = /** @class */ (function (_super) {
    __extends(Event, _super);
    function Event() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Métodos de instancia
    Event.prototype.isLive = function () {
        return this.status === "in-progress";
    };
    Event.prototype.isUpcoming = function () {
        return (this.status === "scheduled" && new Date(this.scheduledDate) > new Date());
    };
    Event.prototype.isCompleted = function () {
        return this.status === "completed";
    };
    Event.prototype.isIntermission = function () {
        return this.status === "intermission";
    };
    Event.prototype.isPaused = function () {
        return this.status === "paused";
    };
    Event.prototype.generateStreamKey = function () {
        return "event_".concat(this.id, "_").concat(Date.now());
    };
    Event.prototype.toJSON = function (options) {
        var data = this.get(); // Get raw data from model instance
        var result = {};
        // Include only requested attributes if specified
        if (options === null || options === void 0 ? void 0 : options.attributes) {
            for (var _i = 0, _a = options.attributes; _i < _a.length; _i++) {
                var attr = _a[_i];
                if (data[attr] !== undefined) {
                    result[attr] = data[attr];
                }
            }
        }
        else {
            // If no specific attributes requested, return all direct attributes
            Object.assign(result, data);
        }
        // Conditionally add associated data if loaded
        if (this.venue) {
            result.venue = this.venue.toJSON(); // Assuming Venue model also has toJSON
        }
        if (this.operator) {
            result.operator = this.operator.toJSON(); // Assuming User model also has toJSON
        }
        if (this.creator) {
            result.creator = this.creator.toJSON(); // Assuming User model also has toJSON
        }
        if (this.fights) {
            result.fights = this.fights.map(function (fight) { return fight.toJSON(); }); // Assuming Fight model also has toJSON
        }
        return result;
    };
    return Event;
}(sequelize_1.Model));
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
            model: User_1.User,
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
        type: sequelize_1.DataTypes.ENUM("scheduled", "in-progress", "intermission", "paused", "completed", "cancelled"),
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
        beforeCreate: function (event) {
            if (!event.streamKey) {
                event.streamKey = event.generateStreamKey();
            }
        },
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Event;
