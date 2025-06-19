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
        return this.status === "unread";
    }
    markAsRead() {
        this.status = "read";
    }
    toPublicJSON() {
        return {
            id: this.id,
            title: this.title,
            message: this.message,
            type: this.type,
            status: this.status,
            metadata: this.metadata,
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
    type: {
        // ✅ USAR EL ENUM EXACTO DE LA DB
        type: sequelize_1.DataTypes.ENUM("info", "warning", "error", "success", "bet_proposal"),
        allowNull: false,
        defaultValue: "info",
    },
    status: {
        // ✅ USAR EL ENUM EXACTO DE LA DB
        type: sequelize_1.DataTypes.ENUM("unread", "read", "archived"),
        allowNull: false,
        defaultValue: "unread",
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
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
        { fields: ["status"] },
        { fields: ["type"] },
        { fields: ["created_at"] },
        { fields: ["user_id", "status"] },
    ],
});
exports.default = Notification;
