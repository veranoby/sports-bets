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
exports.Notification = void 0;
// backend/src/models/Notification.ts - VERSIÓN CORREGIDA
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var User_1 = require("./User");
var Notification = /** @class */ (function (_super) {
    __extends(Notification, _super);
    function Notification() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Métodos de instancia
    Notification.prototype.isUnread = function () {
        return this.isRead === false;
    };
    Notification.prototype.markAsRead = function () {
        this.isRead = true;
    };
    Notification.prototype.toPublicJSON = function () {
        return {
            id: this.id,
            title: this.title,
            message: this.message,
            type: this.type,
            isRead: this.isRead,
            metadata: this.data,
            createdAt: this.createdAt,
        };
    };
    return Notification;
}(sequelize_1.Model));
exports.Notification = Notification;
Notification.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "user_id", // ✅ IMPORTANTE: Mapear al nombre de columna en DB
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_read",
    },
    status: {
        type: sequelize_1.DataTypes.STRING(10),
        defaultValue: "unread",
        field: "status",
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "read_at",
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "expires_at",
    },
    data: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM("info", "warning", "error", "success", "bet_proposal"),
        allowNull: false,
        defaultValue: "info",
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "created_at", // ✅ IMPORTANTE: Mapear al nombre de columna en DB
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "updated_at", // ✅ IMPORTANTE: Mapear al nombre de columna en DB
    },
}, {
    sequelize: database_1.default,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    // ✅ IMPORTANTE: Configurar underscored para coincir con DB
    underscored: true,
    indexes: [
        { fields: ["user_id"] },
        { fields: ["is_read"] },
        { fields: ["created_at"] },
        { fields: ["user_id", "is_read"] },
    ],
});
exports.default = Notification;
