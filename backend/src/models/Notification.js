"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
// backend/src/models/Notification.ts - VERSIÓN CORREGIDA
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
class Notification extends sequelize_1.Model {
    // Métodos de instancia
    isUnread() {
        return this.isRead === false;
    }
    markAsRead() {
        this.isRead = true;
    }
    toPublicJSON() {
        return {
            id: this.id,
            title: this.title,
            message: this.message,
            type: this.type,
            isRead: this.isRead,
            metadata: this.data,
            createdAt: this.createdAt,
        };
    }
}
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
        type: sequelize_1.DataTypes.JSONB,
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
