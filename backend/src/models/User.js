"use strict";
// ARCHIVO: backend/src/models/User.ts
// CORRECCIÓN: Cambiar nombres de índices para compatibilidad con underscored: true
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var sequelize_1 = require("sequelize");
var database_1 = __importDefault(require("../config/database"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
// Definición del modelo User
var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Métodos estáticos para autenticación
    User.hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            var saltRounds;
            return __generator(this, function (_b) {
                saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
                return [2 /*return*/, bcryptjs_1.default.hash(password, saltRounds)];
            });
        });
    };
    // Método de instancia para verificar contraseña
    User.prototype.comparePassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("🔍 Comparing password:", password, "with hash:", this.passwordHash);
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, this.passwordHash)];
                    case 1:
                        result = _b.sent();
                        console.log("🔍 Comparison result:", result);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    // Método para obtener datos públicos del usuario incluyendo suscripción
    User.prototype.toPublicJSON = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _b, passwordHash, verificationToken, publicData, latestSubscription, _c, err_1;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _b = this.toJSON(), passwordHash = _b.passwordHash, verificationToken = _b.verificationToken, publicData = __rest(_b, ["passwordHash", "verificationToken"]);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 5, , 6]);
                        if (!(this.subscriptions && Array.isArray(this.subscriptions) && this.subscriptions.length > 0)) return [3 /*break*/, 2];
                        latestSubscription = this.subscriptions[0];
                        publicData.subscription = {
                            type: latestSubscription.type || 'daily',
                            status: latestSubscription.status,
                            expiresAt: (_d = latestSubscription.expiresAt) !== null && _d !== void 0 ? _d : null,
                            features: latestSubscription.features || [],
                            remainingDays: this.calculateRemainingDays(latestSubscription.expiresAt),
                        };
                        return [3 /*break*/, 4];
                    case 2:
                        // Fallback: fetch from database if not pre-loaded
                        _c = publicData;
                        return [4 /*yield*/, this.getCurrentSubscription()];
                    case 3:
                        // Fallback: fetch from database if not pre-loaded
                        _c.subscription = _e.sent();
                        _e.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        err_1 = _e.sent();
                        console.warn('Failed to get subscription for user:', this.id, err_1);
                        // Fallback to free subscription if error occurs
                        publicData.subscription = {
                            type: 'free',
                            status: 'active',
                            expiresAt: null,
                            features: [],
                            remainingDays: 0,
                        };
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, publicData];
                }
            });
        });
    };
    User.prototype.calculateRemainingDays = function (expiresAt) {
        if (!expiresAt)
            return 0;
        var now = new Date();
        var expireDate = new Date(expiresAt);
        var diffMs = expireDate.getTime() - now.getTime();
        var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };
    // Método para verificar si el usuario puede realizar determinadas acciones
    User.prototype.canPerformRole = function (role) {
        var _b;
        var roleHierarchy = {
            admin: ["admin", "operator", "venue", "user", "gallera"],
            operator: ["operator"],
            venue: ["venue"],
            user: ["user"],
            gallera: ["gallera"],
        };
        return ((_b = roleHierarchy[this.role]) === null || _b === void 0 ? void 0 : _b.includes(role)) || false;
    };
    // Verificar si puede gestionar eventos
    User.prototype.canManageEvents = function () {
        return ["admin", "operator"].includes(this.role);
    };
    // Verificar si puede gestionar galleras
    User.prototype.canManageVenues = function () {
        return ["admin", "venue"].includes(this.role);
    };
    // Obtener suscripción actual normalizada (free si no hay activa)
    User.prototype.getCurrentSubscription = function () {
        return __awaiter(this, void 0, void 0, function () {
            var Subscription, active, json;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        Subscription = require('./Subscription').Subscription;
                        return [4 /*yield*/, Subscription.findActiveByUserId(this.id)];
                    case 1:
                        active = _c.sent();
                        if (!active) {
                            return [2 /*return*/, {
                                    type: 'free',
                                    status: 'active',
                                    expiresAt: null,
                                    features: [],
                                    remainingDays: 0,
                                }];
                        }
                        json = active.toPublicJSON();
                        return [2 /*return*/, {
                                type: (json.type || 'daily'),
                                status: json.status,
                                expiresAt: (_b = json.expiresAt) !== null && _b !== void 0 ? _b : null,
                                features: json.features || [],
                                remainingDays: typeof json.remainingDays === 'number' ? json.remainingDays : 0,
                            }];
                }
            });
        });
    };
    var _a;
    _a = User;
    // Hook antes de crear usuario
    User.beforeCreateHook = function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var _b;
        return __generator(_a, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(user.passwordHash && !user.passwordHash.startsWith("$2"))) return [3 /*break*/, 2];
                    _b = user;
                    return [4 /*yield*/, _a.hashPassword(user.passwordHash)];
                case 1:
                    _b.passwordHash = _c.sent();
                    _c.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    // Hook antes de actualizar usuario
    User.beforeUpdateHook = function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var _b;
        return __generator(_a, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(user.changed("passwordHash") &&
                        user.passwordHash &&
                        !user.passwordHash.startsWith("$2"))) return [3 /*break*/, 2];
                    _b = user;
                    return [4 /*yield*/, _a.hashPassword(user.passwordHash)];
                case 1:
                    _b.passwordHash = _c.sent();
                    _c.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    return User;
}(sequelize_1.Model));
exports.User = User;
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
            is: /^[a-zA-Z0-9_]+$/, // Allow letters, numbers, and underscores (matches middleware validation)
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
    approved: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "approved",
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
    emailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "email_verified",
    },
    verificationToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: "verification_token",
    },
    verificationExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "verification_expires",
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
