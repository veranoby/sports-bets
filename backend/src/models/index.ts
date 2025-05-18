// Archivo de exportación central para todos los modelos
// Este archivo centraliza las importaciones y exportaciones de modelos
// y configura todas las asociaciones entre modelos

import { User } from './User';
import { Venue } from './Venue';
import { Event } from './Event';
import { Fight } from './Fight';
import { Bet } from './Bet';
import { Wallet, Transaction } from './Wallet';
import { Subscription } from './Subscription';
import { connectDatabase } from '../config/database';

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
    await Venue.sync({ force });
    await Event.sync({ force });
    await Fight.sync({ force });
    await Bet.sync({ force });
    await Wallet.sync({ force });
    await Transaction.sync({ force });
    await Subscription.sync({ force });
    
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
    
    // Verificar asociaciones de Venue
    console.log('Venue associations:', Object.keys(Venue.associations));
    
    // Verificar asociaciones de Event
    console.log('Event associations:', Object.keys(Event.associations));
    
    // Verificar asociaciones de Fight
    console.log('Fight associations:', Object.keys(Fight.associations));
    
    // Verificar asociaciones de Bet
    console.log('Bet associations:', Object.keys(Bet.associations));
    
    // Verificar asociaciones de Wallet
    console.log('Wallet associations:', Object.keys(Wallet.associations));
    
    // Verificar asociaciones de Transaction
    console.log('Transaction associations:', Object.keys(Transaction.associations));
    
    // Verificar asociaciones de Subscription
    console.log('Subscription associations:', Object.keys(Subscription.associations));
    
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