"use strict";
// Archivo de exportación central para todos los modelos
// Este archivo centraliza las importaciones y exportaciones de modelos
// y configura todas las asociaciones entre modelos
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUtils = exports.checkAssociations = exports.syncModels = exports.connectDatabase = exports.Subscription = exports.Transaction = exports.Wallet = exports.Bet = exports.Fight = exports.Event = exports.Venue = exports.User = void 0;
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
// Configurar asociaciones después de importar todos los modelos
// Esto asegura que todas las asociaciones estén disponibles antes de usar los modelos
// ========================================
// USER ASSOCIATIONS
// ========================================
// User -> Wallet (One-to-One)
User_1.User.hasOne(Wallet_1.Wallet, {
    foreignKey: 'userId',
    as: 'wallet'
});
Wallet_1.Wallet.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
// User -> Venues (One-to-Many)
User_1.User.hasMany(Venue_1.Venue, {
    foreignKey: 'ownerId',
    as: 'venues'
});
Venue_1.Venue.belongsTo(User_1.User, {
    foreignKey: 'ownerId',
    as: 'owner'
});
// User -> Events as Operator (One-to-Many)
User_1.User.hasMany(Event_1.Event, {
    foreignKey: 'operatorId',
    as: 'operatedEvents'
});
Event_1.Event.belongsTo(User_1.User, {
    foreignKey: 'operatorId',
    as: 'operator'
});
// User -> Events as Creator (One-to-Many)
User_1.User.hasMany(Event_1.Event, {
    foreignKey: 'createdBy',
    as: 'createdEvents'
});
Event_1.Event.belongsTo(User_1.User, {
    foreignKey: 'createdBy',
    as: 'creator'
});
// User -> Bets (One-to-Many)
User_1.User.hasMany(Bet_1.Bet, {
    foreignKey: 'userId',
    as: 'bets'
});
Bet_1.Bet.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
// User -> Subscriptions (One-to-Many)
User_1.User.hasMany(Subscription_1.Subscription, {
    foreignKey: 'userId',
    as: 'subscriptions'
});
Subscription_1.Subscription.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
// ========================================
// WALLET ASSOCIATIONS
// ========================================
// Wallet -> Transactions (One-to-Many)
Wallet_1.Wallet.hasMany(Wallet_1.Transaction, {
    foreignKey: 'walletId',
    as: 'transactions'
});
Wallet_1.Transaction.belongsTo(Wallet_1.Wallet, {
    foreignKey: 'walletId',
    as: 'wallet'
});
// ========================================
// VENUE ASSOCIATIONS
// ========================================
// Venue -> Events (One-to-Many)
Venue_1.Venue.hasMany(Event_1.Event, {
    foreignKey: 'venueId',
    as: 'events'
});
Event_1.Event.belongsTo(Venue_1.Venue, {
    foreignKey: 'venueId',
    as: 'venue'
});
// ========================================
// EVENT ASSOCIATIONS
// ========================================
// Event -> Fights (One-to-Many)
Event_1.Event.hasMany(Fight_1.Fight, {
    foreignKey: 'eventId',
    as: 'fights'
});
Fight_1.Fight.belongsTo(Event_1.Event, {
    foreignKey: 'eventId',
    as: 'event'
});
// ========================================
// FIGHT ASSOCIATIONS
// ========================================
// Fight -> Bets (One-to-Many)
Fight_1.Fight.hasMany(Bet_1.Bet, {
    foreignKey: 'fightId',
    as: 'bets'
});
Bet_1.Bet.belongsTo(Fight_1.Fight, {
    foreignKey: 'fightId',
    as: 'fight'
});
// ========================================
// BET ASSOCIATIONS
// ========================================
// Bet -> Bet (Self-referencing for matched bets)
Bet_1.Bet.belongsTo(Bet_1.Bet, {
    foreignKey: 'matchedWith',
    as: 'matchedBet'
});
// Función para sincronizar todos los modelos
const syncModels = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (force = false) {
    try {
        console.log('🔄 Synchronizing models...');
        // Orden de sincronización respetando dependencias
        yield User_1.User.sync({ force });
        yield Venue_1.Venue.sync({ force });
        yield Event_1.Event.sync({ force });
        yield Fight_1.Fight.sync({ force });
        yield Bet_1.Bet.sync({ force });
        yield Wallet_1.Wallet.sync({ force });
        yield Wallet_1.Transaction.sync({ force });
        yield Subscription_1.Subscription.sync({ force });
        console.log('✅ All models synchronized successfully');
    }
    catch (error) {
        console.error('❌ Error synchronizing models:', error);
        throw error;
    }
});
exports.syncModels = syncModels;
// Función para verificar asociaciones
const checkAssociations = () => {
    console.log('🔗 Checking model associations...');
    try {
        // Verificar asociaciones de User
        console.log('User associations:', Object.keys(User_1.User.associations));
        // Verificar asociaciones de Venue
        console.log('Venue associations:', Object.keys(Venue_1.Venue.associations));
        // Verificar asociaciones de Event
        console.log('Event associations:', Object.keys(Event_1.Event.associations));
        // Verificar asociaciones de Fight
        console.log('Fight associations:', Object.keys(Fight_1.Fight.associations));
        // Verificar asociaciones de Bet
        console.log('Bet associations:', Object.keys(Bet_1.Bet.associations));
        // Verificar asociaciones de Wallet
        console.log('Wallet associations:', Object.keys(Wallet_1.Wallet.associations));
        // Verificar asociaciones de Transaction
        console.log('Transaction associations:', Object.keys(Wallet_1.Transaction.associations));
        // Verificar asociaciones de Subscription
        console.log('Subscription associations:', Object.keys(Subscription_1.Subscription.associations));
        console.log('✅ All associations checked');
    }
    catch (error) {
        console.error('❌ Error checking associations:', error);
    }
};
exports.checkAssociations = checkAssociations;
// Funciones de utilidad para consultas comunes
exports.ModelUtils = {
    // Buscar usuario con su wallet
    findUserWithWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return User_1.User.findByPk(userId, {
                include: [
                    {
                        model: Wallet_1.Wallet,
                        as: 'wallet',
                        include: [
                            {
                                model: Wallet_1.Transaction,
                                as: 'transactions',
                                limit: 10,
                                order: [['createdAt', 'DESC']]
                            }
                        ]
                    }
                ]
            });
        });
    },
    // Buscar evento con todos sus datos relacionados
    findEventWithDetails(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Event_1.Event.findByPk(eventId, {
                include: [
                    {
                        model: Venue_1.Venue,
                        as: 'venue'
                    },
                    {
                        model: User_1.User,
                        as: 'operator',
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: Fight_1.Fight,
                        as: 'fights',
                        include: [
                            {
                                model: Bet_1.Bet,
                                as: 'bets'
                            }
                        ]
                    }
                ]
            });
        });
    },
    // Buscar peleas activas con apuestas
    findActiveFightsWithBets() {
        return __awaiter(this, void 0, void 0, function* () {
            return Fight_1.Fight.findAll({
                where: {
                    status: ['betting', 'live']
                },
                include: [
                    {
                        model: Event_1.Event,
                        as: 'event',
                        include: [
                            {
                                model: Venue_1.Venue,
                                as: 'venue'
                            }
                        ]
                    },
                    {
                        model: Bet_1.Bet,
                        as: 'bets',
                        where: {
                            status: ['pending', 'active']
                        },
                        required: false
                    }
                ]
            });
        });
    },
    // Buscar apuestas de un usuario con detalles
    findUserBetsWithDetails(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Bet_1.Bet.findAll({
                where: { userId },
                include: [
                    {
                        model: Fight_1.Fight,
                        as: 'fight',
                        include: [
                            {
                                model: Event_1.Event,
                                as: 'event',
                                include: [
                                    {
                                        model: Venue_1.Venue,
                                        as: 'venue'
                                    }
                                ]
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        });
    },
    // Buscar suscripción activa de un usuario
    findActiveUserSubscription(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Subscription_1.Subscription.findOne({
                where: {
                    userId,
                    status: 'active'
                },
                order: [['endDate', 'DESC']]
            });
        });
    }
};
// Exportar por defecto un objeto con todos los modelos
exports.default = {
    User: User_1.User,
    Venue: Venue_1.Venue,
    Event: Event_1.Event,
    Fight: Fight_1.Fight,
    Bet: Bet_1.Bet,
    Wallet: Wallet_1.Wallet,
    Transaction: Wallet_1.Transaction,
    Subscription: Subscription_1.Subscription,
    syncModels: exports.syncModels,
    checkAssociations: exports.checkAssociations,
    ModelUtils: exports.ModelUtils
};
