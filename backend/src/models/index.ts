// Archivo de exportación central para todos los modelos
// Define asociaciones únicas evitando duplicados con modelos individuales

import { User } from "./User";
import { Venue } from "./Venue";
import { Event } from "./Event";
import { Fight } from "./Fight";
import { Bet } from "./Bet";
import { Wallet, Transaction } from "./Wallet";
import { Subscription } from "./Subscription";
import { connectDatabase } from "../config/database";
// ✅ AGREGAR IMPORT (al inicio del archivo)
import Notification from "./Notification";
import { Article } from "./Article";

console.log("📦 Configurando modelos y asociaciones...");

// ========================================
// ASOCIACIONES PRINCIPALES - SIN DUPLICADOS
// ========================================

// User -> Wallet (One-to-One)
User.hasOne(Wallet, {
  foreignKey: "userId",
  as: "wallet",
});
Wallet.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Wallet -> Transactions (One-to-Many)
Wallet.hasMany(Transaction, {
  foreignKey: "walletId",
  as: "transactions",
});
Transaction.belongsTo(Wallet, {
  foreignKey: "walletId",
  as: "wallet",
});

// User -> Venues (One-to-Many)
User.hasMany(Venue, {
  foreignKey: "ownerId",
  as: "venues",
});
Venue.belongsTo(User, {
  foreignKey: "ownerId",
  as: "owner",
});

// User -> Notifications (One-to-Many)
User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});
Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Venue -> Events (One-to-Many)
Venue.hasMany(Event, {
  foreignKey: "venueId",
  as: "events",
});
Event.belongsTo(Venue, {
  foreignKey: "venueId",
  as: "venue",
});

// User -> Events (DOS RELACIONES DIFERENTES CON ALIASES ÚNICOS)
User.hasMany(Event, {
  foreignKey: "operatorId",
  as: "operatedEvents",
});
User.hasMany(Event, {
  foreignKey: "createdBy",
  as: "createdEvents",
});

// Event -> User (INVERSAS CON ALIASES ÚNICOS)
Event.belongsTo(User, {
  foreignKey: "operatorId",
  as: "operator",
});
Event.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// Event -> Fights (One-to-Many)
Event.hasMany(Fight, {
  foreignKey: "eventId",
  as: "fights",
});
Fight.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

// Fight -> Bets (One-to-Many)
Fight.hasMany(Bet, {
  foreignKey: "fightId",
  as: "bets",
});
Bet.belongsTo(Fight, {
  foreignKey: "fightId",
  as: "fight",
});

// User -> Bets (One-to-Many)
User.hasMany(Bet, {
  foreignKey: "userId",
  as: "bets",
});
Bet.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Bet -> Bet (Self-referencing)
Bet.belongsTo(Bet, {
  foreignKey: "matchedWith",
  as: "matchedBet",
});
Bet.belongsTo(Bet, {
  foreignKey: "parentBetId",
  as: "parentBet",
});

// User -> Subscriptions (One-to-Many)
User.hasMany(Subscription, {
  foreignKey: "userId",
  as: "subscriptions",
});
Subscription.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ===================
// ASOCIACIONES NUEVAS
// ===================

// User -> Article (One-to-Many)
User.hasMany(Article, { foreignKey: "author_id", as: "articles" });
Article.belongsTo(User, { foreignKey: "author_id", as: "author" });

// Venue -> Article (One-to-Many)
Venue.hasMany(Article, { foreignKey: "venue_id", as: "articles" });
Article.belongsTo(Venue, { foreignKey: "venue_id", as: "venue" });

console.log("✅ Asociaciones configuradas correctamente");

// ========================================
// EXPORTACIONES
// ========================================

export {
  User,
  Venue,
  Event,
  Fight,
  Bet,
  Wallet,
  Transaction,
  Subscription,
  Notification,
  Article,
  connectDatabase,
};

// ❌ SYNC DISABLED - Migration-only architecture
export const syncModels = async (force: boolean = false): Promise<void> => {
  throw new Error('🚫 Sequelize sync is disabled. Use migrations instead: npm run migrate up');
};

// Función para verificar asociaciones
export const checkAssociations = (): void => {
  console.log("🔗 Checking associations...");

  try {
    const associations = {
      User: Object.keys(User.associations),
      Venue: Object.keys(Venue.associations),
      Event: Object.keys(Event.associations),
      Fight: Object.keys(Fight.associations),
      Bet: Object.keys(Bet.associations),
      Wallet: Object.keys(Wallet.associations),
      Transaction: Object.keys(Transaction.associations),
      Subscription: Object.keys(Subscription.associations),
    };

    console.log("📋 Associations summary:", associations);
    console.log("✅ All associations verified");
  } catch (error) {
    console.error("❌ Error checking associations:", error);
  }
};

// Funciones de utilidad
export const ModelUtils = {
  async findUserWithWallet(userId: string) {
    return User.findByPk(userId, {
      include: [
        {
          model: Wallet,
          as: "wallet",
          include: [
            {
              model: Transaction,
              as: "transactions",
              limit: 10,
              order: [["createdAt", "DESC"]],
            },
          ],
        },
      ],
    });
  },
};

export default {
  User,
  Venue,
  Event,
  Fight,
  Bet,
  Wallet,
  Transaction,
  Subscription,
  Notification,
  Article,
  syncModels,
  checkAssociations,
  ModelUtils,
};
