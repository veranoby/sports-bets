"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Venue = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
// Definición del modelo Venue
class Venue extends sequelize_1.Model {
    // Métodos de instancia
    toJSON(options) {
        const data = this.get(); // Get raw data from model instance
        const result = {};
        // Include only requested attributes if specified
        if (options === null || options === void 0 ? void 0 : options.attributes) {
            for (const attr of options.attributes) {
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
        if (this.owner) {
            result.owner = this.owner.toJSON(); // Assuming User model also has toJSON
        }
        return result;
    }
}
exports.Venue = Venue;
// Inicialización del modelo
Venue.init({
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
    location: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        validate: {
            len: [5, 500],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    contactInfo: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        field: "contact_info",
        defaultValue: {},
    },
    ownerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "owner_id",
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("pending", "active", "suspended", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_verified",
    },
    images: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
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
    modelName: "Venue",
    tableName: "venues",
    timestamps: true,
    indexes: [
        {
            fields: ["owner_id"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["name"],
        },
        {
            fields: ["is_verified"],
        },
    ],
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = Venue;
