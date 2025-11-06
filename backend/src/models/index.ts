// Archivo de exportación central para todos los modelos
// Define asociaciones únicas evitando duplicados con modelos individuales

import { User } from "./User";
import { Event } from "./Event";
import { Fight } from "./Fight";
import { Bet } from "./Bet";
import { Wallet, Transaction } from "./Wallet";
import { Subscription } from "./Subscription";
import { connectDatabase } from "../config/database";
// ✅ AGREGAR IMPORT (al inicio del archivo)
import Notification from "./Notification";
import { Article } from "./Article";
import { SystemSetting } from './SystemSetting';
import { EventConnection } from "./EventConnection";
import { MembershipChangeRequest } from "./MembershipChangeRequest";
import { ActiveSession } from "./ActiveSession";

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
User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});
Notification.belongsTo(User, {
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
User.hasMany(Event, {
  foreignKey: "venueId",
  as: "venueEvents",
});
Event.belongsTo(User, {
  foreignKey: "venueId",
  as: "venue",
});
// 2. Operator events
User.hasMany(Event, {
  foreignKey: "operatorId",
  as: "operatedEvents",
});
// 3. Created events
User.hasMany(Event, {
  foreignKey: "createdBy",
  as: "createdEvents",
});

// Event -> User (INVERSE RELATIONSHIPS WITH UNIQUE ALIASES)
// 1. Venue (User with role='venue')
Event.belongsTo(User, {
  foreignKey: "venueId",
  as: "venue",
});
// 2. Operator
Event.belongsTo(User, {
  foreignKey: "operatorId",
  as: "operator",
});
// 3. Creator
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
// REMOVED IN FASE 5: Articles now associated with User where role='venue'
// Venue.hasMany(Article, { foreignKey: "venue_id", as: "articles" });
// Article.belongsTo(Venue, { foreignKey: "venue_id", as: "venue" });

// User -> SystemSetting (One-to-Many)
User.hasMany(SystemSetting, { foreignKey: "updated_by", as: "updatedSettings" });
SystemSetting.belongsTo(User, { foreignKey: "updated_by", as: "updatedByUser" });

// User -> MembershipChangeRequest (One-to-Many)
User.hasMany(MembershipChangeRequest, { foreignKey: "userId", as: "membershipRequests" });
MembershipChangeRequest.belongsTo(User, { foreignKey: "userId", as: "user" });

// User -> MembershipChangeRequest processor (One-to-Many)
User.hasMany(MembershipChangeRequest, { foreignKey: "processedBy", as: "processedMembershipRequests" });
MembershipChangeRequest.belongsTo(User, { foreignKey: "processedBy", as: "processor" });

// User -> ActiveSession (One-to-Many) - Session tracking for concurrent login prevention
User.hasMany(ActiveSession, { foreignKey: "userId", as: "activeSessions" });
ActiveSession.belongsTo(User, { foreignKey: "userId", as: "user" });

console.log("✅ Asociaciones configuradas correctamente");

// ========================================
// EXPORTACIONES
// ========================================

export {
  User,
  Event,
  Fight,
  Bet,
  Wallet,
  Transaction,
  Subscription,
  Notification,
  Article,
  SystemSetting,
  EventConnection,
  MembershipChangeRequest,
  ActiveSession,
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
  Event,
  Fight,
  Bet,
  Wallet,
  Transaction,
  Subscription,
  Notification,
  Article,
  SystemSetting,
  EventConnection,
  MembershipChangeRequest,
  ActiveSession,
  syncModels,
  checkAssociations,
  ModelUtils,
};
