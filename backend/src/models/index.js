"use strict";
// Archivo de exportación central para todos los modelos
// Define asociaciones únicas evitando duplicados con modelos individuales
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUtils = exports.checkAssociations = exports.syncModels = exports.connectDatabase = exports.ActiveSession = exports.MembershipChangeRequest = exports.EventConnection = exports.SystemSetting = exports.Article = exports.Notification = exports.Subscription = exports.Transaction = exports.Wallet = exports.Bet = exports.Fight = exports.Event = exports.User = void 0;
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
var Event_1 = require("./Event");
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return Event_1.Event; } });
var Fight_1 = require("./Fight");
Object.defineProperty(exports, "Fight", { enumerable: true, get: function () { return Fight_1.Fight; } });
var Bet_1 = require("./Bet");
Object.defineProperty(exports, "Bet", { enumerable: true, get: function () { return Bet_1.Bet; } });
var Wallet_1 = require("./Wallet");
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return Wallet_1.Wallet; } });
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return Wallet_1.Transaction; } });
var Subscription_1 = require("./Subscription");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return Subscription_1.Subscription; } });
var database_1 = require("../config/database");
Object.defineProperty(exports, "connectDatabase", { enumerable: true, get: function () { return database_1.connectDatabase; } });
// ✅ AGREGAR IMPORT (al inicio del archivo)
var Notification_1 = __importDefault(require("./Notification"));
exports.Notification = Notification_1.default;
var Article_1 = require("./Article");
Object.defineProperty(exports, "Article", { enumerable: true, get: function () { return Article_1.Article; } });
var SystemSetting_1 = require("./SystemSetting");
Object.defineProperty(exports, "SystemSetting", { enumerable: true, get: function () { return SystemSetting_1.SystemSetting; } });
var EventConnection_1 = require("./EventConnection");
Object.defineProperty(exports, "EventConnection", { enumerable: true, get: function () { return EventConnection_1.EventConnection; } });
var MembershipChangeRequest_1 = require("./MembershipChangeRequest");
Object.defineProperty(exports, "MembershipChangeRequest", { enumerable: true, get: function () { return MembershipChangeRequest_1.MembershipChangeRequest; } });
var ActiveSession_1 = require("./ActiveSession");
Object.defineProperty(exports, "ActiveSession", { enumerable: true, get: function () { return ActiveSession_1.ActiveSession; } });
console.log("📦 Configurando modelos y asociaciones...");
// ========================================
// ASOCIACIONES PRINCIPALES - SIN DUPLICADOS
// ========================================
// User -> Wallet (One-to-One)
User_1.User.hasOne(Wallet_1.Wallet, {
    foreignKey: "userId",
    as: "wallet",
});
Wallet_1.Wallet.belongsTo(User_1.User, {
    foreignKey: "userId",
    as: "user",
});
// Wallet -> Transactions (One-to-Many)
Wallet_1.Wallet.hasMany(Wallet_1.Transaction, {
    foreignKey: "walletId",
    as: "transactions",
});
Wallet_1.Transaction.belongsTo(Wallet_1.Wallet, {
    foreignKey: "walletId",
    as: "wallet",
});
// User -> Venues (One-to-Many)
// REMOVED IN FASE 5: Venues table eliminated, data now in User.profileInfo
// User.hasMany(Venue, {
//   foreignKey: "ownerId",
//   as: "venues",
// });
// Venue.belongsTo(User, {
//   foreignKey: "ownerId",
//   as: "owner",
// });
// User -> Galleras (One-to-Many) - DEPRECATED: Gallera model consolidated into User.profileInfo
// User.hasMany(Gallera, {
//   foreignKey: "ownerId",
//   as: "galleras",
// });
// Gallera.belongsTo(User, {
//   foreignKey: "ownerId",
//   as: "owner",
// });
// User -> Notifications (One-to-Many)
User_1.User.hasMany(Notification_1.default, {
    foreignKey: "userId",
    as: "notifications",
});
Notification_1.default.belongsTo(User_1.User, {
    foreignKey: "userId",
    as: "user",
});
// Venue -> Events (One-to-Many)
// REMOVED IN FASE 5: Events now associated with User where role='venue'
// Venue.hasMany(Event, {
//   foreignKey: "venueId",
//   as: "events",
// });
// Event.belongsTo(Venue, {
//   foreignKey: "venueId",
//   as: "venue",
// });
// User -> Events (Three relationships with unique aliases)
// 1. Venue events (User with role='venue')
User_1.User.hasMany(Event_1.Event, {
    foreignKey: "venueId",
    as: "venueEvents",
});
// 2. Operator events
User_1.User.hasMany(Event_1.Event, {
    foreignKey: "operatorId",
    as: "operatedEvents",
});
// 3. Created events
User_1.User.hasMany(Event_1.Event, {
    foreignKey: "createdBy",
    as: "createdEvents",
});
// Event -> User (INVERSE RELATIONSHIPS WITH UNIQUE ALIASES)
// 1. Venue (User with role='venue')
Event_1.Event.belongsTo(User_1.User, {
    foreignKey: "venueId",
    as: "venue",
});
// 2. Operator
Event_1.Event.belongsTo(User_1.User, {
    foreignKey: "operatorId",
    as: "operator",
});
// 3. Creator
Event_1.Event.belongsTo(User_1.User, {
    foreignKey: "createdBy",
    as: "creator",
});
// Event -> Fights (One-to-Many)
Event_1.Event.hasMany(Fight_1.Fight, {
    foreignKey: "eventId",
    as: "fights",
});
Fight_1.Fight.belongsTo(Event_1.Event, {
    foreignKey: "eventId",
    as: "event",
});
// Fight -> Bets (One-to-Many)
Fight_1.Fight.hasMany(Bet_1.Bet, {
    foreignKey: "fightId",
    as: "bets",
});
Bet_1.Bet.belongsTo(Fight_1.Fight, {
    foreignKey: "fightId",
    as: "fight",
});
// User -> Bets (One-to-Many)
User_1.User.hasMany(Bet_1.Bet, {
    foreignKey: "userId",
    as: "bets",
});
Bet_1.Bet.belongsTo(User_1.User, {
    foreignKey: "userId",
    as: "user",
});
// Bet -> Bet (Self-referencing)
Bet_1.Bet.belongsTo(Bet_1.Bet, {
    foreignKey: "matchedWith",
    as: "matchedBet",
});
Bet_1.Bet.belongsTo(Bet_1.Bet, {
    foreignKey: "parentBetId",
    as: "parentBet",
});
// User -> Subscriptions (One-to-Many)
User_1.User.hasMany(Subscription_1.Subscription, {
    foreignKey: "userId",
    as: "subscriptions",
});
Subscription_1.Subscription.belongsTo(User_1.User, {
    foreignKey: "userId",
    as: "user",
});
// ===================
// ASOCIACIONES NUEVAS
// ===================
// User -> Article (One-to-Many)
User_1.User.hasMany(Article_1.Article, { foreignKey: "author_id", as: "articles" });
Article_1.Article.belongsTo(User_1.User, { foreignKey: "author_id", as: "author" });
// Venue -> Article (One-to-Many)
// REMOVED IN FASE 5: Articles now associated with User where role='venue'
// Venue.hasMany(Article, { foreignKey: "venue_id", as: "articles" });
// Article.belongsTo(Venue, { foreignKey: "venue_id", as: "venue" });
// User -> SystemSetting (One-to-Many)
User_1.User.hasMany(SystemSetting_1.SystemSetting, { foreignKey: "updated_by", as: "updatedSettings" });
SystemSetting_1.SystemSetting.belongsTo(User_1.User, { foreignKey: "updated_by", as: "updatedByUser" });
// User -> MembershipChangeRequest (One-to-Many)
User_1.User.hasMany(MembershipChangeRequest_1.MembershipChangeRequest, { foreignKey: "userId", as: "membershipRequests" });
MembershipChangeRequest_1.MembershipChangeRequest.belongsTo(User_1.User, { foreignKey: "userId", as: "user" });
// User -> MembershipChangeRequest processor (One-to-Many)
User_1.User.hasMany(MembershipChangeRequest_1.MembershipChangeRequest, { foreignKey: "processedBy", as: "processedMembershipRequests" });
MembershipChangeRequest_1.MembershipChangeRequest.belongsTo(User_1.User, { foreignKey: "processedBy", as: "processor" });
// User -> ActiveSession (One-to-Many) - Session tracking for concurrent login prevention
User_1.User.hasMany(ActiveSession_1.ActiveSession, { foreignKey: "userId", as: "activeSessions" });
ActiveSession_1.ActiveSession.belongsTo(User_1.User, { foreignKey: "userId", as: "user" });
console.log("✅ Asociaciones configuradas correctamente");
// ❌ SYNC DISABLED - Migration-only architecture
var syncModels = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (force) {
        if (force === void 0) { force = false; }
        return __generator(this, function (_a) {
            throw new Error('🚫 Sequelize sync is disabled. Use migrations instead: npm run migrate up');
        });
    });
};
exports.syncModels = syncModels;
// Función para verificar asociaciones
var checkAssociations = function () {
    console.log("🔗 Checking associations...");
    try {
        var associations = {
            User: Object.keys(User_1.User.associations),
            Event: Object.keys(Event_1.Event.associations),
            Fight: Object.keys(Fight_1.Fight.associations),
            Bet: Object.keys(Bet_1.Bet.associations),
            Wallet: Object.keys(Wallet_1.Wallet.associations),
            Transaction: Object.keys(Wallet_1.Transaction.associations),
            Subscription: Object.keys(Subscription_1.Subscription.associations),
        };
        console.log("📋 Associations summary:", associations);
        console.log("✅ All associations verified");
    }
    catch (error) {
        console.error("❌ Error checking associations:", error);
    }
};
exports.checkAssociations = checkAssociations;
// Funciones de utilidad
exports.ModelUtils = {
    findUserWithWallet: function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, User_1.User.findByPk(userId, {
                        include: [
                            {
                                model: Wallet_1.Wallet,
                                as: "wallet",
                                include: [
                                    {
                                        model: Wallet_1.Transaction,
                                        as: "transactions",
                                        limit: 10,
                                        order: [["createdAt", "DESC"]],
                                    },
                                ],
                            },
                        ],
                    })];
            });
        });
    },
};
exports.default = {
    User: User_1.User,
    Event: Event_1.Event,
    Fight: Fight_1.Fight,
    Bet: Bet_1.Bet,
    Wallet: Wallet_1.Wallet,
    Transaction: Wallet_1.Transaction,
    Subscription: Subscription_1.Subscription,
    Notification: Notification_1.default,
    Article: Article_1.Article,
    SystemSetting: SystemSetting_1.SystemSetting,
    EventConnection: EventConnection_1.EventConnection,
    MembershipChangeRequest: MembershipChangeRequest_1.MembershipChangeRequest,
    ActiveSession: ActiveSession_1.ActiveSession,
    syncModels: exports.syncModels,
    checkAssociations: exports.checkAssociations,
    ModelUtils: exports.ModelUtils,
};
