// Archivo de exportación central para todos los modelos
// Este archivo centraliza las importaciones y exportaciones de modelos
// IMPORTANTE: Las asociaciones se definen SOLO aquí para evitar duplicados

import { User } from './User';
import { Venue } from './Venue';
import { Event } from './Event';
import { Fight } from './Fight';
import { Bet } from './Bet';
import { Wallet, Transaction } from './Wallet';
import { Subscription } from './Subscription';
import { connectDatabase } from '../config/database';

// ========================================
// ASOCIACIONES ÚNICAS - DEFINIDAS SOLO AQUÍ
// ========================================

console.log('🔗 Configurando asociaciones de modelos...');

// User -> Wallet (One-to-One)
User.hasOne(Wallet, { 
  foreignKey: 'userId', 
  as: 'wallet' 
});

// User -> Venues (One-to-Many) 
User.hasMany(Venue, { 
  foreignKey: 'ownerId', 
  as: 'venues' 
});

// User -> Events as Operator (One-to-Many)
User.hasMany(Event, { 
  foreignKey: 'operatorId', 
  as: 'operatedEvents' 
});

// User -> Events as Creator (One-to-Many)
User.hasMany(Event, { 
  foreignKey: 'createdBy', 
  as: 'createdEvents' 
});

// User -> Bets (One-to-Many)
User.hasMany(Bet, { 
  foreignKey: 'userId', 
  as: 'bets' 
});

// User -> Subscriptions (One-to-Many)
User.hasMany(Subscription, { 
  foreignKey: 'userId', 
  as: 'subscriptions' 
});

// Wallet -> User (Inverse)
Wallet.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Wallet -> Transactions (One-to-Many)
Wallet.hasMany(Transaction, { 
  foreignKey: 'walletId', 
  as: 'transactions' 
});

// Transaction -> Wallet (Inverse)
Transaction.belongsTo(Wallet, { 
  foreignKey: 'walletId', 
  as: 'wallet' 
});

// Venue -> User (Inverse)
Venue.belongsTo(User, { 
  foreignKey: 'ownerId', 
  as: 'owner' 
});

// Venue -> Events (One-to-Many)
Venue.hasMany(Event, { 
  foreignKey: 'venueId', 
  as: 'events' 
});

// Event -> Venue (Inverse)
Event.belongsTo(Venue, { 
  foreignKey: 'venueId', 
  as: 'venue' 
});

// Event -> User (Operator - Inverse)
Event.belongsTo(User, { 
  foreignKey: 'operatorId', 
  as: 'operator' 
});

// Event -> User (Creator - Inverse)
Event.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// Event -> Fights (One-to-Many)
Event.hasMany(Fight, { 
  foreignKey: 'eventId', 
  as: 'fights' 
});

// Fight -> Event (Inverse)
Fight.belongsTo(Event, { 
  foreignKey: 'eventId', 
  as: 'event' 
});

// Fight -> Bets (One-to-Many)
Fight.hasMany(Bet, { 
  foreignKey: 'fightId', 
  as: 'bets' 
});

// Bet -> Fight (Inverse)
Bet.belongsTo(Fight, { 
  foreignKey: 'fightId', 
  as: 'fight' 
});

// Bet -> User (Inverse)
Bet.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Bet -> Bet (Self-referencing for matched bets)
Bet.belongsTo(Bet, { 
  foreignKey: 'matchedWith', 
  as: 'matchedBet' 
});

// Subscription -> User (Inverse)
Subscription.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

console.log('✅ Asociaciones configuradas correctamente');

// Exportar todos los modelos
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

// Función para sincronizar todos los modelos
export const syncModels = async (force: boolean = false): Promise<void> => {
  try {
    console.log('🔄 Synchronizing models...');
    
    // Orden de sincronización respetando dependencias
    await User.sync({ force });
    console.log('✅ User model synchronized');
    
    await Wallet.sync({ force });
    console.log('✅ Wallet model synchronized');
    
    await Transaction.sync({ force });
    console.log('✅ Transaction model synchronized');
    
    await Venue.sync({ force });
    console.log('✅ Venue model synchronized');
    
    await Event.sync({ force });
    console.log('✅ Event model synchronized');
    
    await Fight.sync({ force });
    console.log('✅ Fight model synchronized');
    
    await Bet.sync({ force });
    console.log('✅ Bet model synchronized');
    
    await Subscription.sync({ force });
    console.log('✅ Subscription model synchronized');
    
    console.log('✅ All models synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
    throw error;
  }
};

// Función para verificar asociaciones
export const checkAssociations = (): void => {
  console.log('🔗 Checking model associations...');
  
  try {
    // Verificar asociaciones de User
    console.log('User associations:', Object.keys(User.associations));
    
    // Verificar asociaciones de Wallet
    console.log('Wallet associations:', Object.keys(Wallet.associations));
    
    // Verificar asociaciones de Event
    console.log('Event associations:', Object.keys(Event.associations));
    
    // Verificar asociaciones de Fight  
    console.log('Fight associations:', Object.keys(Fight.associations));
    
    // Verificar asociaciones de Bet
    console.log('Bet associations:', Object.keys(Bet.associations));
    
    console.log('✅ All associations checked');
  } catch (error) {
    console.error('❌ Error checking associations:', error);
  }
};

// Funciones de utilidad para consultas comunes
export const ModelUtils = {
  // Buscar usuario con su wallet
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
  },

  // Buscar evento con todos sus datos relacionados
  async findEventWithDetails(eventId: string) {
    return Event.findByPk(eventId, {
      include: [
        {
          model: Venue,
          as: 'venue'
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Fight,
          as: 'fights',
          include: [
            {
              model: Bet,
              as: 'bets'
            }
          ]
        }
      ]
    });
  },

  // Buscar peleas activas con apuestas
  async findActiveFightsWithBets() {
    return Fight.findAll({
      where: {
        status: ['betting', 'live']
      },
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: Venue,
              as: 'venue'
            }
          ]
        },
        {
          model: Bet,
          as: 'bets',
          where: {
            status: ['pending', 'active']
          },
          required: false
        }
      ]
    });
  },

  // Buscar apuestas de un usuario con detalles
  async findUserBetsWithDetails(userId: string) {
    return Bet.findAll({
      where: { userId },
      include: [
        {
          model: Fight,
          as: 'fight',
          include: [
            {
              model: Event,
              as: 'event',
              include: [
                {
                  model: Venue,
                  as: 'venue'
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  },

  // Buscar suscripción activa de un usuario
  async findActiveUserSubscription(userId: string) {
    return Subscription.findOne({
      where: {
        userId,
        status: 'active'
      },
      order: [['endDate', 'DESC']]
    });
  }
};

// Exportar por defecto un objeto con todos los modelos
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