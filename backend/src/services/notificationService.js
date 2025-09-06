// backend/src/services/notificationService.js
// Servicio automatizado para creación de notificaciones del sistema
// Integraciones con eventos, peleas, transacciones y apuestas

const { Notification } = require('../models');

class NotificationService {
  /**
   * Crear notificación para evento
   * @param {string} eventType - Tipo de evento (event_created, event_activated, event_completed)
   * @param {string} eventId - ID del evento
   * @param {Array} userIds - IDs de usuarios a notificar (opcional)
   * @param {Object} additionalData - Datos adicionales
   */
  async createEventNotification(eventType, eventId, userIds = [], additionalData = {}) {
    try {
      const eventNotifications = {
        event_created: {
          title: 'Nuevo Evento Creado',
          message: 'Se ha creado un nuevo evento en el sistema',
          type: 'info',
          priority: 'medium'
        },
        event_activated: {
          title: 'Evento Activado',
          message: 'Un evento ha sido activado para transmisión',
          type: 'success',
          priority: 'high'
        },
        event_completed: {
          title: 'Evento Completado',
          message: 'Un evento ha finalizado',
          type: 'info',
          priority: 'medium'
        },
        event_cancelled: {
          title: 'Evento Cancelado',
          message: 'Un evento ha sido cancelado',
          type: 'warning',
          priority: 'high'
        }
      };

      const notificationConfig = eventNotifications[eventType];
      if (!notificationConfig) {
        throw new Error(`Tipo de evento no soportado: ${eventType}`);
      }

      // Crear notificación
      const notification = await Notification.create({
        title: notificationConfig.title,
        message: notificationConfig.message,
        type: notificationConfig.type,
        priority: notificationConfig.priority,
        targetUsers: userIds.length > 0 ? userIds : null,
        targetRoles: userIds.length > 0 ? null : ['admin', 'operator', 'venue'],
        metadata: {
          eventType,
          eventId,
          ...additionalData
        },
        status: 'sent'
      });

      // Aquí se enviaría la notificación a través de WebSocket/SSE
      // En una implementación real, esto enviaría mensajes a los clientes conectados
      
      return notification;
    } catch (error) {
      console.error('Error creando notificación de evento:', error);
      throw error;
    }
  }

  /**
   * Crear notificación para transmisión
   * @param {string} streamEventType - Tipo de evento de transmisión (stream_started, stream_stopped)
   * @param {string} eventId - ID del evento
   * @param {Object} streamData - Datos de la transmisión
   */
  async createStreamNotification(streamEventType, eventId, streamData = {}) {
    try {
      const streamNotifications = {
        stream_started: {
          title: 'Transmisión Iniciada',
          message: 'La transmisión del evento ha comenzado',
          type: 'success',
          priority: 'high'
        },
        stream_stopped: {
          title: 'Transmisión Detenida',
          message: 'La transmisión del evento ha sido detenida',
          type: 'warning',
          priority: 'medium'
        }
      };

      const notificationConfig = streamNotifications[streamEventType];
      if (!notificationConfig) {
        throw new Error(`Tipo de evento de transmisión no soportado: ${streamEventType}`);
      }

      // Crear notificación
      const notification = await Notification.create({
        title: notificationConfig.title,
        message: notificationConfig.message,
        type: notificationConfig.type,
        priority: notificationConfig.priority,
        targetRoles: ['admin', 'operator'],
        metadata: {
          streamEventType,
          eventId,
          ...streamData
        },
        status: 'sent'
      });

      return notification;
    } catch (error) {
      console.error('Error creando notificación de transmisión:', error);
      throw error;
    }
  }

  /**
   * Crear notificación para apuesta
   * @param {string} betEventType - Tipo de evento de apuesta (bet_placed, bet_accepted, bet_rejected)
   * @param {string} betId - ID de la apuesta
   * @param {string} userId - ID del usuario
   * @param {Object} betData - Datos de la apuesta
   */
  async createBetNotification(betEventType, betId, userId, betData = {}) {
    try {
      const betNotifications = {
        bet_placed: {
          title: 'Nueva Apuesta Realizada',
          message: 'Se ha realizado una nueva apuesta',
          type: 'info',
          priority: 'medium'
        },
        bet_accepted: {
          title: 'Apuesta Aceptada',
          message: 'Tu apuesta ha sido aceptada',
          type: 'success',
          priority: 'medium'
        },
        bet_rejected: {
          title: 'Apuesta Rechazada',
          message: 'Tu apuesta ha sido rechazada',
          type: 'warning',
          priority: 'high'
        }
      };

      const notificationConfig = betNotifications[betEventType];
      if (!notificationConfig) {
        throw new Error(`Tipo de evento de apuesta no soportado: ${betEventType}`);
      }

      // Crear notificación para el usuario específico
      const notification = await Notification.create({
        title: notificationConfig.title,
        message: notificationConfig.message,
        type: notificationConfig.type,
        priority: notificationConfig.priority,
        targetUsers: [userId],
        metadata: {
          betEventType,
          betId,
          userId,
          ...betData
        },
        status: 'sent'
      });

      return notification;
    } catch (error) {
      console.error('Error creando notificación de apuesta:', error);
      throw error;
    }
  }

  /**
   * Crear notificación para wallet
   * @param {string} walletEventType - Tipo de evento de wallet (deposit, withdrawal, transaction)
   * @param {string} userId - ID del usuario
   * @param {Object} walletData - Datos de la wallet
   */
  async createWalletNotification(walletEventType, userId, walletData = {}) {
    try {
      const walletNotifications = {
        deposit: {
          title: 'Depósito Realizado',
          message: 'Se ha realizado un depósito en tu cuenta',
          type: 'success',
          priority: 'medium'
        },
        withdrawal: {
          title: 'Retiro Solicitado',
          message: 'Se ha solicitado un retiro de tu cuenta',
          type: 'info',
          priority: 'medium'
        },
        transaction: {
          title: 'Transacción Completada',
          message: 'Se ha completado una transacción en tu cuenta',
          type: 'info',
          priority: 'medium'
        }
      };

      const notificationConfig = walletNotifications[walletEventType];
      if (!notificationConfig) {
        throw new Error(`Tipo de evento de wallet no soportado: ${walletEventType}`);
      }

      // Crear notificación para el usuario específico
      const notification = await Notification.create({
        title: notificationConfig.title,
        message: notificationConfig.message,
        type: notificationConfig.type,
        priority: notificationConfig.priority,
        targetUsers: [userId],
        metadata: {
          walletEventType,
          userId,
          ...walletData
        },
        status: 'sent'
      });

      return notification;
    } catch (error) {
      console.error('Error creando notificación de wallet:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación personalizada
   * @param {Object} notificationData - Datos de la notificación
   */
  async sendCustomNotification(notificationData) {
    try {
      const notification = await Notification.create({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        targetUsers: notificationData.targetUsers || null,
        targetRoles: notificationData.targetRoles || null,
        metadata: notificationData.metadata || {},
        scheduledAt: notificationData.scheduledAt || null,
        status: notificationData.scheduledAt ? 'scheduled' : 'sent'
      });

      return notification;
    } catch (error) {
      console.error('Error enviando notificación personalizada:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones para un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;
      
      const where = {
        [sequelize.Op.or]: [
          { targetUsers: { [sequelize.Op.contains]: [userId] } },
          { targetUsers: null } // Notificaciones globales
        ],
        status: 'sent'
      };

      if (unreadOnly) {
        where.readBy = { [sequelize.Op.notContains]: [userId] };
      }

      const notifications = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return notifications;
    } catch (error) {
      console.error('Error obteniendo notificaciones del usuario:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   * @param {string} notificationId - ID de la notificación
   * @param {string} userId - ID del usuario
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (!notification) {
        throw new Error('Notificación no encontrada');
      }

      // Agregar usuario a la lista de lectores
      if (!notification.readBy) {
        notification.readBy = [userId];
      } else if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
      }

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();