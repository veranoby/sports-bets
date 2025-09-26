// backend/src/services/notificationService.ts
// Servicio de notificaciones para SSE y alertas del sistema

import { sseService, SSEEventType } from './sseService';

interface NotificationData {
  type: 'event' | 'fight' | 'bet' | 'system';
  message: string;
  data?: any;
  timestamp?: Date;
  userId?: string;
  eventId?: string;
}

class NotificationService {
  // Enviar notificación a través de SSE
  async sendNotification(notification: NotificationData) {
    const notificationWithTimestamp = {
      ...notification,
      timestamp: notification.timestamp || new Date(),
      id: `notification_${Date.now()}`
    };

    // Broadcast notification via SSE
    if (!notification.userId) {
      sseService.broadcastToAllAdmin({
        id: notificationWithTimestamp.id,
        type: SSEEventType.NOTIFICATION,
        data: notificationWithTimestamp,
        timestamp: new Date(),
        priority: 'medium'
      });
    } else {
      // Enviar a usuario específico (implementar cuando sea necesario)
      sseService.broadcastToAllAdmin({
        id: notificationWithTimestamp.id,
        type: SSEEventType.USER_NOTIFICATION,
        data: notificationWithTimestamp,
        timestamp: new Date(),
        priority: 'medium'
      });
    }

    return notificationWithTimestamp;
  }

  // Notificar cambio de estado de evento
  async notifyEventStatusChange(eventId: string, status: string, data?: any) {
    return this.sendNotification({
      type: 'event',
      message: `Event ${eventId} status changed to ${status}`,
      data: { eventId, status, ...data },
      eventId
    });
  }

  // Notificar cambio de estado de pelea
  async notifyFightStatusChange(fightId: string, status: string, eventId?: string, data?: any) {
    return this.sendNotification({
      type: 'fight',
      message: `Fight ${fightId} status changed to ${status}`,
      data: { fightId, status, eventId, ...data },
      eventId
    });
  }

  // Notificar sobre apuestas
  async notifyBetUpdate(betId: string, userId: string, data?: any) {
    return this.sendNotification({
      type: 'bet',
      message: `Bet ${betId} updated`,
      data: { betId, ...data },
      userId
    });
  }

  // Notificaciones del sistema
  async notifySystemAlert(message: string, data?: any) {
    return this.sendNotification({
      type: 'system',
      message,
      data
    });
  }

  // Crear notificación de evento (compatibilidad con events.ts)
  async createEventNotification(type: string, eventId: string, recipients: any[], data?: any) {
    return this.sendNotification({
      type: 'event',
      message: `Event notification: ${type}`,
      data: { type, eventId, ...data },
      eventId
    });
  }

  // Crear notificación de stream (compatibilidad con events.ts)
  async createStreamNotification(type: string, eventId: string, recipients: any[], data?: any) {
    return this.sendNotification({
      type: 'event',
      message: `Stream notification: ${type}`,
      data: { type, eventId, ...data },
      eventId
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;