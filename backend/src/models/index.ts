// Archivo de exportación central para todos los modelos
// Define asociaciones únicas manteniendo compatibilidad con rutas existentes

import { User } from './User';
import { Venue } from './Venue';
import { Event } from './Event';
import { Fight } from './Fight';
import { Bet } from './Bet';
import { Wallet, Transaction } from './Wallet';
import { Subscription } from './Subscription';
import { connectDatabase } from '../config/database';

console.log('📦 Configurando modelos y asociaciones...');

// ========================================
// ASOCIACIONES PRINCIPALES - COMPATIBLES CON RUTAS
// ========================================

// User -> Wallet (usado en users.ts y auth.ts)
User.hasOne(Wallet, { 
  foreignKey: 'userId', 
  as: 'wallet' 
});
Wallet.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Wallet -> Transactions (usado en wallet.ts)
Wallet.hasMany(Transaction, { 
  foreignKey: 'walletId', 
  as: 'transactions' 
});
Transaction.belongsTo(Wallet, { 
  foreignKey: 'walletId', 
  as: 'wallet' 
});

// User -> Venues
User.hasMany(Venue, { 
  foreignKey: 'ownerId', 
  as: 'venues' 
});
Venue.belongsTo(User, { 
  foreignKey: 'ownerId', 
  as: 'owner' 
});

// Venue -> Events
Venue.hasMany(Event, { 
  foreignKey: 'venueId', 
  as: 'events' 
});
Event.belongsTo(Venue, { 
  foreignKey: 'venueId', 
  as: 'venue' 
});

// User -> Events (DOS RELACIONES DIFERENTES - ALIASES ÚNICOS)
User.hasMany(Event, { 
  foreignKey: 'operatorId', 
  as: 'operatedEvents' 
});
User.hasMany(Event, { 
  foreignKey: 'createdBy', 
  as: 'createdEvents' 
});

// Event -> User (INVERSAS CON ALIASES ÚNICOS)
Event.belongsTo(User, { 
  foreignKey: 'operatorId', 
  as: 'operator' 
});
Event.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// Event -> Fights (usado en fights.ts)
Event.hasMany(Fight, { 
  foreignKey: 'eventId', 
  as: 'fights' 
});
Fight.belongsTo(Event, { 
  foreignKey: 'eventId', 
  as: 'event' 
});

// Fight -> Bets (usado en fights.ts)
Fight.hasMany(Bet, { 
  foreignKey: 'fightId', 
  as: 'bets' 
});
Bet.belongsTo(Fight, { 
  foreignKey: 'fightId', 
  as: 'fight' 
});

// User -> Bets
User.hasMany(Bet, { 
  foreignKey: 'userId', 
  as: 'bets' 
});
Bet.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Bet -> Bet (Self-referencing)
Bet.belongsTo(Bet, { 
  foreignKey: 'matchedWith', 
  as: 'matchedBet' 
});

// User -> Subscriptions
User.hasMany(Subscription, { 
  foreignKey: 'userId', 
  as: 'subscriptions' 
});
Subscription.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

console.log('✅ Asociaciones configuradas sin duplicados');

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
  connectDatabase
};

// Función para sincronizar modelos
export const syncModels = async (force: boolean = false): Promise<void> => {
  try {
    console.log('🔄 Synchronizing models...');
    
    // Orden respetando dependencias
    await User.sync({ force });
    console.log('✅ User');
    
    await Venue.sync({ force });
    console.log('✅ Venue');
    
    await Wallet.sync({ force });
    console.log('✅ Wallet');
    
    await Subscription.sync({ force });
    console.log('✅ Subscription');
    
    await Event.sync({ force });
    console.log('✅ Event');
    
    await Fight.sync({ force });
    console.log('✅ Fight');
    
    await Bet.sync({ force });
    console.log('✅ Bet');
    
    await Transaction.sync({ force });
    console.log('✅ Transaction');
    
    console.log('✅ All models synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
    throw error;
  }
};

// Función para verificar asociaciones
export const checkAssociations = (): void => {
  console.log('🔗 Checking associations...');
  
  try {
    const associations = {
      User: Object.keys(User.associations),
      Venue: Object.keys(Venue.associations),
      Event: Object.keys(Event.associations),
      Fight: Object.keys(Fight.associations),
      Bet: Object.keys(Bet.associations),
      Wallet: Object.keys(Wallet.associations),
      Transaction: Object.keys(Transaction.associations),
      Subscription: Object.keys(Subscription.associations)
    };
    
    console.log('📋 Associations summary:', associations);
    console.log('✅ All associations verified');
  } catch (error) {
    console.error('❌ Error checking associations:', error);
  }
};

// Funciones de utilidad
export const ModelUtils = {
  async findUserWithWallet(userId: string) {
    return User.findByPk(userId, {
      include: [
        {
          model: Wallet,
          as: 'wallet',
          include: [
            {
              model: Transaction,
              as: 'transactions',
              limit: 10,
              order: [['createdAt', 'DESC']]
            }
          ]
        }
      ]
    });
  }
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
  syncModels,
  checkAssociations,
  ModelUtils
};