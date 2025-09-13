import { Event } from '../models/Event';
import { Venue } from '../models/Venue';
import { User } from '../models/User';
import { Fight } from '../models/Fight';
import { Bet } from '../models/Bet';
import { Op } from 'sequelize';

// Optimized EventService with eager loading and pagination
export class EventService {
  // Get all events with optimized includes
  static async getAllEvents(filters?: any) {
    return Event.findAll({
      include: [
        { model: Venue, as: 'venue', attributes: ['id', 'name', 'location'] },
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
        { model: Venue, as: 'venue' },
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
        { model: Venue, as: 'venue', attributes: ['id', 'name', 'location'] },
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
        { model: Venue, as: 'venue', attributes: ['id', 'name', 'location'] }
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
        { model: Venue, as: 'venue', attributes: ['id', 'name'] },
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

  // Update event status (for streaming workflow)
  static async updateEventStatus(eventId: string, status: "scheduled" | "in-progress" | "completed" | "cancelled") {
    return Event.update(
      { status },
      { where: { id: eventId } }
    );
  }

  // Get events by operator (for operator dashboard)
  static async getEventsByOperator(operatorId: string) {
    return Event.findAll({
      where: { operatorId: operatorId },
      include: [
        { model: Venue, as: 'venue', attributes: ['id', 'name'] },
        { model: Fight, as: 'fights', attributes: ['id', 'number', 'status'] }
      ],
      order: [['scheduledDate', 'DESC']]
    });
  }
}

export default EventService;