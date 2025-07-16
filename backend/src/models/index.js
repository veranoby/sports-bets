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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUtils = exports.checkAssociations = exports.syncModels = exports.connectDatabase = exports.Article = exports.Notification = exports.Subscription = exports.Transaction = exports.Wallet = exports.Bet = exports.Fight = exports.Event = exports.Venue = exports.User = void 0;
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Venue_1 = require("./Venue");
Object.defineProperty(exports, "Venue", { enumerable: true, get: function () { return Venue_1.Venue; } });
const Event_1 = require("./Event");
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return Event_1.Event; } });
const Fight_1 = require("./Fight");
Object.defineProperty(exports, "Fight", { enumerable: true, get: function () { return Fight_1.Fight; } });
const Bet_1 = require("./Bet");
Object.defineProperty(exports, "Bet", { enumerable: true, get: function () { return Bet_1.Bet; } });
const Wallet_1 = require("./Wallet");
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return Wallet_1.Wallet; } });
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return Wallet_1.Transaction; } });
const Subscription_1 = require("./Subscription");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return Subscription_1.Subscription; } });
const database_1 = require("../config/database");
Object.defineProperty(exports, "connectDatabase", { enumerable: true, get: function () { return database_1.connectDatabase; } });
// ✅ AGREGAR IMPORT (al inicio del archivo)
const Notification_1 = __importDefault(require("./Notification"));
exports.Notification = Notification_1.default;
const Article_1 = require("./Article");
Object.defineProperty(exports, "Article", { enumerable: true, get: function () { return Article_1.Article; } });
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
User_1.User.hasMany(Venue_1.Venue, {
    foreignKey: "ownerId",
    as: "venues",
});
Venue_1.Venue.belongsTo(User_1.User, {
    foreignKey: "ownerId",
    as: "owner",
});
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
Venue_1.Venue.hasMany(Event_1.Event, {
    foreignKey: "venueId",
    as: "events",
});
Event_1.Event.belongsTo(Venue_1.Venue, {
    foreignKey: "venueId",
    as: "venue",
});
// User -> Events (DOS RELACIONES DIFERENTES CON ALIASES ÚNICOS)
User_1.User.hasMany(Event_1.Event, {
    foreignKey: "operatorId",
    as: "operatedEvents",
});
User_1.User.hasMany(Event_1.Event, {
    foreignKey: "createdBy",
    as: "createdEvents",
});
// Event -> User (INVERSAS CON ALIASES ÚNICOS)
Event_1.Event.belongsTo(User_1.User, {
    foreignKey: "operatorId",
    as: "operator",
});
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
Venue_1.Venue.hasMany(Article_1.Article, { foreignKey: "venue_id", as: "articles" });
Article_1.Article.belongsTo(Venue_1.Venue, { foreignKey: "venue_id", as: "venue" });
console.log("✅ Asociaciones configuradas correctamente");
// Función para sincronizar modelos
const syncModels = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (force = false) {
    try {
        console.log("🔄 Synchronizing models...");
        // Orden respetando dependencias
        yield User_1.User.sync({ force });
        console.log("✅ User");
        yield Venue_1.Venue.sync({ force });
        console.log("✅ Venue");
        yield Wallet_1.Wallet.sync({ force });
        console.log("✅ Wallet");
        yield Subscription_1.Subscription.sync({ force });
        console.log("✅ Subscription");
        yield Event_1.Event.sync({ force });
        console.log("✅ Event");
        yield Fight_1.Fight.sync({ force });
        console.log("✅ Fight");
        yield Bet_1.Bet.sync({ force });
        console.log("✅ Bet");
        yield Wallet_1.Transaction.sync({ force });
        console.log("✅ Transaction");
        yield Notification_1.default.sync({ force });
        console.log("✅ Notification");
        yield Article_1.Article.sync({ force });
        console.log("✅ Article");
        console.log("✅ All models synchronized successfully");
    }
    catch (error) {
        console.error("❌ Error synchronizing models:", error);
        throw error;
    }
});
exports.syncModels = syncModels;
// Función para verificar asociaciones
const checkAssociations = () => {
    console.log("🔗 Checking associations...");
    try {
        const associations = {
            User: Object.keys(User_1.User.associations),
            Venue: Object.keys(Venue_1.Venue.associations),
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
    findUserWithWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return User_1.User.findByPk(userId, {
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
            });
        });
    },
};
exports.default = {
    User: User_1.User,
    Venue: Venue_1.Venue,
    Event: Event_1.Event,
    Fight: Fight_1.Fight,
    Bet: Bet_1.Bet,
    Wallet: Wallet_1.Wallet,
    Transaction: Wallet_1.Transaction,
    Subscription: Subscription_1.Subscription,
    Notification: Notification_1.default,
    Article: Article_1.Article,
    syncModels: exports.syncModels,
    checkAssociations: exports.checkAssociations,
    ModelUtils: exports.ModelUtils,
};
