// backend/src/routes/enhancedEvents.ts - PRODUCTION READY
// Enhanced events routes with proper date-based filtering and caching
// Author: QWEN - Performance Optimization Specialist

import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Event, Venue, User, Fight, Bet, EventConnection } from "../models";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { getOrSet, invalidatePattern } from "../config/redis";
import notificationService from "../services/notificationService";
import { UserRole } from "../../../shared/types";

// Helper function to get appropriate event attributes based on user role
function getEventAttributes(role: UserRole | undefined, type: "list" | "detail") {
  const publicAttributes = [
    "id",
    "name",
    "scheduledDate",
    "status",
    "venueId",
    "createdAt",
    "updatedAt",
    "endDate",
  ];

  const authenticatedAttributes = [
    ...publicAttributes,
    "totalFights",
    "completedFights",
  ];

  const operatorAttributes = [
    ...authenticatedAttributes,
    "streamKey",
    "streamUrl",
    "operatorId",
  ];

  switch (role) {
    case "admin":
      return undefined; // Return all attributes
    case "operator":
      return operatorAttributes;
    case "user":
    case "gallera":
    case "venue":
      return authenticatedAttributes;
    default:
      return publicAttributes;
  }
}

const router = Router();

// GET /api/events - Listar eventos con filtros y date-based categorization
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { venueId, status, upcoming, dateRange, category } = req.query;

    // ⚡ SAFE PAGINATION: Enforce safe limits
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // Create a unique cache key based on query params and user role
    const cacheKey = `events:list:${req.user?.role || 'public'}:${venueId || ''}:${status || ''}:${upcoming || ''}:${dateRange || ''}:${category || ''}:${limit}:${offset}`;

    // Try to get data from cache
    const cachedData = await getOrSet(cacheKey, async () => {
      const where: any = {};
      
      // Apply basic filters
      if (venueId) where.venueId = venueId;
      if (status) where.status = status;
      
      // Enhanced date-based filtering
      if (dateRange === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setHours(23, 59, 59, 999);
        
        where.scheduledDate = {
          [Op.between]: [todayStart, todayEnd]
        };
      } else if (dateRange === "tomorrow") {
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);
        
        where.scheduledDate = {
          [Op.between]: [tomorrowStart, tomorrowEnd]
        };
      } else if (dateRange === "this-week") {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        where.scheduledDate = {
          [Op.between]: [weekStart, weekEnd]
        };
      } else if (upcoming === "true") {
        // Enhanced upcoming events filter
        where.scheduledDate = {
          [Op.gte]: new Date(),
        };
        where.status = "scheduled";
      } else if (category === "past") {
        // New: Past events filter
        where.scheduledDate = {
          [Op.lt]: new Date(),
        };
        where.status = "completed";
      } else if (category === "live") {
        // New: Live events filter
        where.status = "in-progress";
      }

      const attributes = getEventAttributes(req.user?.role, "list");

      const events = await Event.findAndCountAll({
        where,
        attributes,
        include: [
          { 
            model: Venue, 
            as: 'venue', 
            attributes: ['id', 'name', 'location'], 
            separate: false 
          },
          { 
            model: User, 
            as: 'operator', 
            attributes: ['id', 'username'], 
            separate: false 
          },
          { 
            model: User, 
            as: 'creator', 
            attributes: ['id', 'username'], 
            separate: false 
          },
          { 
            model: Fight, 
            as: 'fights', 
            attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'], 
            separate: false 
          }
        ],
        order: [["scheduledDate", "ASC"]],
        limit,
        offset,
      });

      // ⚡ ENHANCED PAGINATION METADATA
      const totalPages = Math.ceil(events.count / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        success: true,
        data: {
          events: events.rows.map((e) => e.toJSON({ attributes })),
          pagination: {
            limit,
            offset,
            total: events.count,
            totalPages,
            currentPage,
            hasNext: offset + limit < events.count,
            hasPrev: offset > 0,
            nextOffset: offset + limit < events.count ? offset + limit : null,
            prevOffset: offset > 0 ? Math.max(0, offset - limit) : null
          }
        },
      };
    }, 300); // ⚡ 5 minute cache for event lists (frequently accessed)

    res.json(cachedData);
  })
);

// GET /api/events/:id - Obtener evento específico con caching
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const attributes = getEventAttributes(req.user?.role, "detail");
    const cacheKey = `event_detail_${req.params.id}_${req.user?.role || 'public'}`;

    const eventData = await getOrSet(cacheKey, async () => {
      const event = await Event.findByPk(req.params.id, {
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

      if (!event) {
        throw errors.notFound("Event not found");
      }

      return {
        success: true,
        data: event.toJSON({ attributes }),
      };
    }, 300); // ⚡ 5 minute cache for individual events

    res.json(eventData);
  })
);

// GET /api/events/categories - Get event categories with date-based grouping
router.get(
  "/categories",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const cacheKey = `events:categories:${req.user?.role || 'public'}`;
    
    const categoryData = await getOrSet(cacheKey, async () => {
      const now = new Date();
      
      // Get all events and categorize them
      const allEvents = await Event.findAll({
        attributes: ['id', 'name', 'scheduledDate', 'status'],
        order: [["scheduledDate", "ASC"]]
      });

      // Categorize events by date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const categories = {
        live: allEvents.filter(e => e.status === "in-progress"),
        today: allEvents.filter(e => {
          const eventDate = new Date(e.scheduledDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === today.getTime() && e.status === "scheduled";
        }),
        tomorrow: allEvents.filter(e => {
          const eventDate = new Date(e.scheduledDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === tomorrow.getTime() && e.status === "scheduled";
        }),
        thisWeek: allEvents.filter(e => {
          const eventDate = new Date(e.scheduledDate);
          eventDate.setHours(0, 0, 0, 0);
          const startOfWeek = new Date(today);
          return eventDate >= startOfWeek && eventDate <= endOfWeek && 
                 eventDate > tomorrow && e.status === "scheduled";
        }),
        future: allEvents.filter(e => {
          const eventDate = new Date(e.scheduledDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate > endOfWeek && e.status === "scheduled";
        }),
        past: allEvents.filter(e => e.status === "completed" || new Date(e.scheduledDate) < today)
      };

      return {
        success: true,
        data: {
          liveCount: categories.live.length,
          todayCount: categories.today.length,
          tomorrowCount: categories.tomorrow.length,
          thisWeekCount: categories.thisWeek.length,
          futureCount: categories.future.length,
          pastCount: categories.past.length,
          categories
        }
      };
    }, 180); // ⚡ 3 minute cache for categories

    res.json(categoryData);
  })
);

// POST /api/events - Crear nuevo evento (admin/venue) with cache invalidation
router.post(
  "/",
  authenticate,
  authorize("admin", "venue"),
  [
    body("name")
      .isLength({ min: 3, max: 255 })
      .withMessage("Name must be between 3 and 255 characters")
      .trim()
      .escape(),
    body("venueId").isUUID().withMessage("Valid venue ID is required"),
    body("scheduledDate")
      .isISO8601()
      .withMessage("Valid date is required")
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("Scheduled date must be in the future");
        }
        return true;
      }),
    body("operatorId")
      .optional()
      .isUUID()
      .withMessage("Valid operator ID is required"),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { name, venueId, scheduledDate, operatorId } = req.body;

    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      throw errors.notFound("Venue not found");
    }

    if (req.user!.role === "venue" && venue.ownerId !== req.user!.id) {
      throw errors.forbidden("You can only create events for your own venues");
    }

    if (operatorId) {
      const operator = await User.findByPk(operatorId);
      if (!operator || operator.role !== "operator") {
        throw errors.badRequest("Invalid operator specified");
      }
    }

    const event = await Event.create({
      name,
      venueId,
      scheduledDate,
      operatorId,
      createdBy: req.user!.id,
      totalFights: 0,
      completedFights: 0,
      totalBets: 0,
      totalPrizePool: 0,
    });

    await event.reload({
      include: [
        { model: Venue, as: "venue" },
        { model: User, as: "operator", attributes: ["id", "username"] },
      ],
    });

    // ⚡ INVALIDATE CACHE: Clear events list cache when new event is created
    await invalidatePattern('events:list:*');

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event.toJSON(),
    });
  })
);

// PUT /api/events/:id - Actualizar evento with cache invalidation
router.put(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  [
    body("name")
      .optional()
      .isLength({ min: 3, max: 255 })
      .withMessage("Name must be between 3 and 255 characters")
      .trim()
      .escape(),
    body("scheduledDate")
      .optional()
      .isISO8601()
      .withMessage("Valid date is required"),
    body("operatorId")
      .optional()
      .isUUID()
      .withMessage("Valid operator ID is required"),
    body("status")
      .optional()
      .isIn(["scheduled", "in-progress", "completed", "cancelled"])
      .withMessage("Invalid status"),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    const allowedFields = ["name", "scheduledDate", "operatorId", "status"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (event as any)[field] = req.body[field];
      }
    });

    await event.save();

    // ⚡ INVALIDATE CACHE: Clear both specific event cache and event list cache
    await Promise.all([
      invalidatePattern(`event_detail_${event.id}_*`),
      invalidatePattern('events:list:*')
    ]);

    res.json({
      success: true,
      message: "Event updated successfully",
      data: event.toJSON(),
    });
  })
);

// PATCH /api/events/:id/status - Event status transitions with workflow logic and cache invalidation
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "operator"),
  [
    body("action")
      .isIn(["activate", "complete", "cancel"])
      .withMessage("Action must be activate, complete, or cancel")
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { action } = req.body;
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Fight, as: "fights" },
        { model: Venue, as: "venue" },
        { model: User, as: "operator", attributes: ["id", "username"] }
      ],
    });

    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // Validate transition logic
    const currentStatus = event.status;
    let newStatus: string;

    switch (action) {
      case "activate":
        if (currentStatus !== "scheduled") {
          throw errors.badRequest("Only scheduled events can be activated");
        }

        const eventData = event.toJSON() as any;
        if (!eventData.fights || eventData.fights.length === 0) {
          throw errors.badRequest("Event must have at least one fight scheduled");
        }

        newStatus = "in-progress";

        // Generate stream key with improved format
        if (!event.streamKey) {
          event.streamKey = event.generateStreamKey();
        }
        event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
        break;

      case "complete":
        if (currentStatus !== "in-progress") {
          throw errors.badRequest("Only active events can be completed");
        }
        newStatus = "completed";
        event.endDate = new Date();
        if (event.streamUrl) {
          event.streamUrl = null;
        }
        event.streamKey = null;
        break;

      case "cancel":
        if (currentStatus === "completed") {
          throw errors.badRequest("Completed events cannot be cancelled");
        }
        newStatus = "cancelled";
        if (event.streamUrl) {
          event.streamUrl = null;
        }
        event.streamKey = null;
        break;

      default:
        throw errors.badRequest("Invalid action");
    }

    event.status = newStatus as any;
    await event.save();

    // Broadcast via SSE
    const sseService = req.app.get("sseService");
    if (sseService) {
      sseService.broadcastToEvent(event.id, {
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
      const notificationType = action === "activate" ? "event_activated" :
                              action === "complete" ? "event_completed" : "event_cancelled";
      const metadata = {
        eventName: event.name,
        ...(event.streamUrl && { streamUrl: event.streamUrl })
      };

      await notificationService.createEventNotification(notificationType, event.id, [], metadata);
    } catch (notificationError) {
      console.error(`Error creating ${action} notification:`, notificationError);
    }

    // ⚡ INVALIDATE CACHE: Clear all related caches when event status changes
    await Promise.all([
      invalidatePattern(`event_detail_${event.id}_*`),
      invalidatePattern('events:list:*'),
      invalidatePattern('events:categories:*')
    ]);

    res.json({
      success: true,
      message: `Event ${action}d successfully`,
      data: {
        event: event.toJSON(),
        streamKey: event.streamKey,
        streamUrl: event.streamUrl
      },
    });
  })
);

export default router;