"use strict";
// ARCHIVO: backend/src/models/User.ts
// CORRECCIÓN: Cambiar nombres de índices para compatibilidad con underscored: true
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Definición del modelo User
class User extends sequelize_1.Model {
    // Métodos estáticos para autenticación
    static hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
            return bcryptjs_1.default.hash(password, saltRounds);
        });
    }
    // Método de instancia para verificar contraseña
    comparePassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🔍 Comparing password:", password, "with hash:", this.passwordHash);
            const result = yield bcryptjs_1.default.compare(password, this.passwordHash);
            console.log("🔍 Comparison result:", result);
            return result;
        });
    }
    // Método para obtener datos públicos del usuario
    toPublicJSON() {
        const _b = this.toJSON(), { passwordHash } = _b, publicData = __rest(_b, ["passwordHash"]);
        return publicData;
    }
    // Método para verificar si el usuario puede realizar determinadas acciones
    canPerformRole(role) {
        var _b;
        const roleHierarchy = {
            admin: ["admin", "operator", "venue", "user", "gallera"],
            operator: ["operator"],
            venue: ["venue"],
            user: ["user"],
            gallera: ["gallera"],
        };
        return ((_b = roleHierarchy[this.role]) === null || _b === void 0 ? void 0 : _b.includes(role)) || false;
    }
    // Verificar si puede gestionar eventos
    canManageEvents() {
        return ["admin", "operator"].includes(this.role);
    }
    // Verificar si puede gestionar galleras
    canManageVenues() {
        return ["admin", "venue"].includes(this.role);
    }
}
exports.User = User;
_a = User;
// Hook antes de crear usuario
User.beforeCreateHook = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.passwordHash && !user.passwordHash.startsWith("$2")) {
        user.passwordHash = yield _a.hashPassword(user.passwordHash);
    }
});
// Hook antes de actualizar usuario
User.beforeUpdateHook = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.changed("passwordHash") &&
        user.passwordHash &&
        !user.passwordHash.startsWith("$2")) {
        user.passwordHash = yield _a.hashPassword(user.passwordHash);
    }
});
// Inicialización del modelo
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50],
            isAlphanumeric: true,
        },
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
        validate: {
            len: [6, 255],
        },
    },
    role: {
        type: sequelize_1.DataTypes.ENUM("admin", "operator", "venue", "user", "gallera"),
        allowNull: false,
        defaultValue: "user",
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
    },
    profileInfo: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        field: "profile_info",
        defaultValue: {
            verificationLevel: "none",
        },
    },
    lastLogin: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "last_login",
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
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true, // Enable snake_case mapping
    indexes: [
        {
            name: "users_email_unique",
            fields: ["email"],
            unique: true,
        },
        {
            name: "users_username_unique",
            fields: ["username"],
            unique: true,
        },
        {
            name: "idx_users_role_is_active",
            fields: ["role", "is_active"],
        },
        {
            name: "idx_users_email_is_active",
            fields: ["email", "is_active"],
        },
    ],
    hooks: {
        beforeCreate: User.beforeCreateHook,
        beforeUpdate: User.beforeUpdateHook,
    },
});
// NO DEFINIR ASOCIACIONES AQUÍ - SE DEFINEN EN models/index.ts
exports.default = User;
