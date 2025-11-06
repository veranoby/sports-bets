import { Event } from '../models/Event';
import { User } from '../models/User';
import { Fight } from '../models/Fight';
import { Bet } from '../models/Bet';
import { Op } from 'sequelize';
import notificationService from './notificationService';

// Enhanced EventService with workflow logic and SSE integration
export class EventService {
  // Generate improved stream key with venue name, date, and event ID
  static generateStreamKey(event: Event): string {
    const venueName = event.venue ? (event.venue.profileInfo?.venueName || event.venue.username).replace(/\s+/g, '_').toLowerCase() : 'unknown';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const eventId = event.id.substring(0, 8); // First 8 chars of event ID
    return `${venueName}_${date}_${eventId}`;
  }

  // Validate event status transitions
  static validateEventStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'scheduled': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Update event status with workflow logic
  static async updateEventStatus(eventId: string, action: 'activate' | 'complete' | 'cancel', sseServiceInstance?: any): Promise<Event | null> {
    const event = await Event.findByPk(eventId, {
      include: [
        { model: Fight, as: 'fights' },
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
        { model: User, as: 'operator', attributes: ['id', 'username'] }
      ]
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Validate transition logic
    const currentStatus = event.status;
    let newStatus: string;

    switch (action) {
      case 'activate':
        if (currentStatus !== 'scheduled') {
          throw new Error('Only scheduled events can be activated');
        }

        const eventData = event.toJSON() as any;
        if (!eventData.fights || eventData.fights.length === 0) {
          throw new Error('Event must have at least one fight scheduled');
        }

        newStatus = 'in-progress';

        // Generate stream key with improved format
        if (!event.streamKey) {
          event.streamKey = this.generateStreamKey(event);
        }
        event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
        break;

      case 'complete':
        if (currentStatus !== 'in-progress') {
          throw new Error('Only active events can be completed');
        }
        newStatus = 'completed';
        event.endDate = new Date();
        if (event.streamUrl) {
          event.streamUrl = null;
        }
        event.streamKey = null;
        break;

      case 'cancel':
        if (currentStatus === 'completed') {
          throw new Error('Completed events cannot be cancelled');
        }
        newStatus = 'cancelled';
        if (event.streamUrl) {
          event.streamUrl = null;
        }
        event.streamKey = null;
        break;

      default:
        throw new Error('Invalid action');
    }

    event.status = newStatus as any;
    await event.save();

    // Broadcast via SSE
    if (sseServiceInstance) {
      sseServiceInstance.broadcastToEvent(event.id, {
        type: `EVENT_${action.toUpperCase()}D`,
        data: {
          eventId: event.id,
          status: newStatus,
          streamUrl: event.streamUrl,
          streamKey: event.streamKey,
          timestamp: new Date()
        }
      });
    }

    // Create notification
    try {
      const notificationType = action === 'activate' ? 'event_activated' :
                              action === 'complete' ? 'event_completed' : 'event_cancelled';
      const metadata = {
        eventName: event.name,
        ...(event.streamUrl && { streamUrl: event.streamUrl })
      };

      await notificationService.createEventNotification(notificationType, event.id, [], metadata);
    } catch (notificationError) {
      console.error(`Error creating ${action} notification:`, notificationError);
    }

    return event;
  }
  // Get all events with optimized includes
  static async getAllEvents(filters?: any) {
    return Event.findAll({
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
        { model: User, as: 'operator', attributes: ['id', 'username'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'] }
      ],
      where: filters || {},
      order: [['scheduledDate', 'DESC']],
      limit: 50 // Default limit to prevent large queries
    });
  }

  // Get single event with full data in one query
  static async getEventById(eventId: string) {
    return Event.findByPk(eventId, {
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
        { model: User, as: 'operator', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { 
          model: Fight, 
          as: 'fights',
          include: [{ model: Bet, as: 'bets', attributes: ['id', 'amount', 'status'] }]
        }
      ]
    });
  }

  // Paginated events for admin interface
  static async getEventsPaginated(page: number = 1, limit: number = 20, filters?: any) {
    const offset = (page - 1) * limit;
    return Event.findAndCountAll({
      offset,
      limit,
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
        { model: User, as: 'operator', attributes: ['id', 'username'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ],
      where: filters || {},
      order: [['scheduledDate', 'DESC']]
    });
  }

  // Get upcoming events (optimized for homepage)
  static async getUpcomingEvents(limit: number = 10) {
    return Event.findAll({
      where: {
        status: 'scheduled',
        scheduledDate: {
          [Op.gte]: new Date()
        }
      },
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] }
      ],
      order: [['scheduledDate', 'ASC']],
      limit
    });
  }

  // Get live events (for streaming)
  static async getLiveEvents() {
    return Event.findAll({
      where: { status: 'in-progress' },
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
        {
          model: Fight,
          as: 'fights',
          where: { status: 'live' },
          required: false
        }
      ],
      order: [['scheduledDate', 'ASC']]
    });
  }

  // Create event with transaction
  static async createEvent(eventData: any) {
    return Event.create(eventData);
  }


  // Get events by operator (for operator dashboard)
  static async getEventsByOperator(operatorId: string) {
    return Event.findAll({
      where: { operatorId: operatorId },
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
        { model: Fight, as: 'fights', attributes: ['id', 'number', 'status'] }
      ],
      order: [['scheduledDate', 'DESC']]
    });
  }
}

export default EventService;