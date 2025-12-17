import { Router } from "express";
import { authenticate, authorize, optionalAuth, filterByOperatorAssignment } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Event, User, Fight, Bet, EventConnection } from "../models";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { getCache, setCache, delCache as cacheDel, } from "../config/redis";
import { transaction } from "../config/database";
import notificationService from "../services/notificationService";
import * as streamingService from "../services/streamingService";
import { UserRole } from "../../../shared/types";

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

// Add pagination method for events
export const getEventsPaginated = async (page: number = 1, limit: number = 20, filters?: any) => {
  const offset = (page - 1) * limit;
  return Event.findAndCountAll({
    offset,
    limit,
    include: [
      { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
      { model: User, as: 'operator', attributes: ['id', 'username'] },
      { model: User, as: 'creator', attributes: ['id', 'username'] },
      { model: Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'] }
    ],
    where: filters || {},
    order: [['scheduledDate', 'DESC']]
  });
};

// GET /api/events - Listar eventos con filtros
router.get(
  "/",
  optionalAuth,
  filterByOperatorAssignment,
  asyncHandler(async (req, res) => {
    const { venueId, status, upcoming, dateRange, category } = req.query;
    const userRole = req.user?.role || 'public';

    // ⚡ SAFE PAGINATION: Enforce safe limits
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // Create a unique cache key based on query params and user role
    const cacheKey = `events:list:${userRole}:${venueId || ''}:${status || ''}:${upcoming || ''}:${dateRange || ''}:${category || ''}:${limit}:${offset}`;

    // Try to get data from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const where: any = { ...req.queryFilter };
    if (venueId) where.venueId = venueId;
    if (status) where.status = status;

    // Enhanced date-based filtering for cost optimization
    if (dateRange === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);
      where.scheduledDate = { [Op.between]: [todayStart, todayEnd] };
    } else if (dateRange === "tomorrow") {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);
      where.scheduledDate = { [Op.between]: [tomorrowStart, tomorrowEnd] };
    } else if (dateRange === "this-week") {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      where.scheduledDate = { [Op.between]: [weekStart, weekEnd] };
    } else if (upcoming === "true") {
      where.scheduledDate = { [Op.gte]: new Date() };
      where.status = "scheduled";
    } else if (category === "past") {
      // Show ALL past events regardless of status (completed, cancelled, etc.)
      where.scheduledDate = { [Op.lt]: new Date() };
    } else if (category === "live") {
      where.status = "in-progress";
    } else if (category === "upcoming") {
      // Show all future events
      where.scheduledDate = { [Op.gte]: new Date() };
    }
    const attributes = getEventAttributes(req.user?.role, "list");

    const events = await Event.findAndCountAll({
      where,
      attributes,
      include: [
        { model: User, as: 'venue', attributes: ['id', 'username', 'profileInfo'], separate: false },
        { model: User, as: 'operator', attributes: ['id', 'username'], separate: false },
        { model: User, as: 'creator', attributes: ['id', 'username'], separate: false },
        { model: Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'], separate: false }
      ],
      order: [["scheduledDate", "DESC"]],
      limit,
      offset,
    });

    // ⚡ ENHANCED PAGINATION METADATA
    const totalPages = Math.ceil(events.count / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const responseData = {
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

    // Store data in cache for 5 minutes (300 seconds)
    await setCache(cacheKey, JSON.stringify(responseData), 300);

    res.json(responseData);
  })
);

// GET /api/events/:id - Obtener evento específico
router.get(
  "/:id",
  optionalAuth,
  filterByOperatorAssignment,
  asyncHandler(async (req, res) => {
    const attributes = getEventAttributes(req.user?.role, "detail");

    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: 'venue' },
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

    res.json({
      success: true,
      data: event.toJSON({ attributes }),
    });
  })
);

// POST /api/events - Crear nuevo evento (admin/venue)
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

    const venue = await User.findOne({ where: { id: venueId, role: 'venue' } });
    if (!venue) {
      throw errors.notFound("Venue (User with role='venue') not found");
    }

    if (req.user!.role === "venue" && venue.id !== req.user!.id) {
      throw errors.forbidden("You can only create events for your own venue");
    }

    if (operatorId) {
      const operator = await User.findByPk(operatorId);
      if (!operator || (operator.role !== "operator" && operator.role !== "admin")) {
        throw errors.badRequest("Invalid operator specified. Must be operator or admin.");
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
        { model: User, as: "venue" },
        { model: User, as: "operator", attributes: ["id", "username"] },
      ],
    });

    // Invalidate all events list cache
    await cacheDel("events:list:*");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event.toJSON(),
    });
  })
);

// PUT /api/events/:id - Actualizar evento
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

    // Invalidate cache
    await cacheDel("events:list:*");

    res.json({
      success: true,
      message: "Event updated successfully",
      data: event.toJSON(),
    });
  })
);

// PATCH /api/events/:id/status - Event status transitions with workflow logic
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "operator"),
  [
    body("action")
      .isIn(["schedule", "activate", "complete", "cancel"])
      .withMessage("Action must be schedule, activate, complete, or cancel")
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
        { model: User, as: "venue" },
        { model: User, as: "operator", attributes: ["id", "username"] }
      ],
    });

    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // No validation - admin can change to any state they want
    let newStatus: string;

    switch (action) {
      case "activate":
        newStatus = "in-progress";

        // Generate stream key if needed
        if (!event.streamKey) {
          event.streamKey = event.generateStreamKey();
        }
        event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
        break;

      case "complete":
        newStatus = "completed";
        event.endDate = new Date();
        // Clean up streaming data
        if (event.streamUrl) {
          event.streamUrl = null;
        }
        event.streamKey = null;
        break;

      case "cancel":
        newStatus = "cancelled";
        // Clean up streaming data
        if (event.streamUrl) {
          event.streamUrl = null;
        }
        event.streamKey = null;
        break;

      case "schedule":
        newStatus = "scheduled";
        // Clear endDate when rescheduling
        event.endDate = null;
        // Keep existing streamKey/streamUrl if they exist (admin can regenerate if needed)
        break;

      default:
        throw errors.badRequest("Invalid action");
    }

    event.status = newStatus as any;
    await event.save();

    // Reload event with all associations to ensure complete data
    await event.reload({
      include: [
        { model: Fight, as: "fights" },
        { model: User, as: "venue" },
        { model: User, as: "operator", attributes: ["id", "username"] },
        { model: User, as: "creator", attributes: ["id", "username"] }
      ]
    });

    // Broadcast via SSE
    const sseService = req.app.get("sseService");
    if (sseService) {
      const { randomUUID } = await import('crypto');
      const { AdminChannel } = await import('../services/sseService');
      const eventPayload = {
        id: randomUUID(),
        type: `EVENT_${action.toUpperCase()}D`,
        data: {
          eventId: event.id,
          id: event.id, // ✅ Include id for frontend reconciliation
          status: newStatus,
          streamUrl: event.streamUrl,
          streamKey: event.streamKey,
          name: event.name, // ✅ Include name for UI display
          scheduledDate: event.scheduledDate,
          venue: event.venue,
          operator: event.operator,
        },
        timestamp: new Date(),
        priority: 'high',
        metadata: {
          eventId: event.id
        }
      };

      // ✅ OPTIMIZED: Broadcast to both event-specific AND global admin channel
      sseService.broadcastToEvent(event.id, eventPayload);
      sseService.broadcastToChannel(AdminChannel.GLOBAL, eventPayload);
    }

    // Create notification
    try {
      const notificationType = action === "activate" ? "event_activated" :
        action === "complete" ? "event_completed" :
          action === "cancel" ? "event_cancelled" :
            action === "schedule" ? "event_scheduled" : "event_updated";
      const metadata = {
        eventName: event.name,
        ...(event.streamUrl && { streamUrl: event.streamUrl })
      };

      await notificationService.createEventNotification(notificationType, event.id, [], metadata);
    } catch (notificationError) {
      console.error(`Error creating ${action} notification:`, notificationError);
    }

    // Invalidate cache
    await cacheDel("events:list:*");

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

// POST /api/events/:id/activate - Activar evento para transmisión (DEPRECATED - use PATCH /api/events/:id/status)
router.post(
  "/:id/activate",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: Fight,
          as: "fights",
        },
      ],
    });

    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    if (event.status !== "scheduled") {
      throw errors.badRequest("Only scheduled events can be activated");
    }

    const eventData = event.toJSON() as any;
    if (!eventData.fights || eventData.fights.length === 0) {
      throw errors.badRequest("Event must have at least one fight scheduled");
    }

    event.status = "in-progress";
    event.streamKey = event.generateStreamKey();
    event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
    await event.save();

    const sseService = req.app.get("sseService");
    if (sseService) {
      const { randomUUID } = await import('crypto');
      sseService.broadcastToEvent(event.id, {
        id: randomUUID(),
        type: "EVENT_ACTIVATED",
        data: {
          eventId: event.id,
          streamUrl: event.streamUrl
        },
        timestamp: new Date(),
        priority: 'high',
        metadata: {
          eventId: event.id
        }
      });
    }

    try {
      await notificationService.createEventNotification('event_activated', event.id, [], {
        eventName: event.name,
        streamUrl: event.streamUrl
      });
    } catch (notificationError) {
      console.error('Error creating event activation notification:', notificationError);
    }

    res.json({
      success: true,
      message: "Event activated successfully",
      data: {
        event: event.toJSON(),
        streamKey: event.streamKey,
      },
    });
  })
);

// POST /api/events/:id/stream/start - Iniciar transmisión
router.post(
  "/:id/stream/start",
  authenticate,
  authorize("operator", "admin"),
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // ✅ REMOVED: Stream can start in any event status (scheduled, in-progress, etc)
    // This allows technical pre-testing and decouples stream from event lifecycle

    // ✅ GENERATE STREAM KEY FIRST before checking health
    if (!event.streamKey) {
      event.streamKey = event.generateStreamKey();
    }

    const streamInfo = await streamingService.getStreamInfo(event.streamKey);

    // ✅ FIX: Use actual stream status from getStreamInfo
    const streamAlreadyActive = streamInfo.isActive;

    // ✅ CRITICAL: Only set 'connected' if stream ACTUALLY exists
    if (streamAlreadyActive) {
      event.streamStatus = 'connected';
      event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}.m3u8`;
      await event.save();
    } else {
      // ⚠️ Stream not ready yet - set to waiting state
      event.streamStatus = 'offline';
      event.streamUrl = null;
      await event.save();

      // Return 202 Accepted - operation initiated, waiting for OBS connection
      return res.status(202).json({
        success: true,
        pending: true,
        message: 'Stream event prepared. Waiting for OBS connection to RTMP server.',
        estimatedReadyIn: 5000, // Suggest checking again in 5 seconds
        data: {
          id: event.id,
          name: event.name,
          streamKey: event.streamKey,
          streamStatus: 'offline',
          rtmpUrl: `rtmp://${req.get('host') || 'localhost'}:1935/live`,
        }
      });
    }

    // ✅ Broadcast STREAM_STARTED only if stream is actually active
    const sseService = req.app.get("sseService");
    if (sseService) {
      const { randomUUID } = await import('crypto');
      const { AdminChannel } = await import('../services/sseService');
      const streamPayload = {
        id: randomUUID(),
        type: "STREAM_STARTED",
        data: {
          eventId: event.id,
          id: event.id,
          streamUrl: event.streamUrl, // Will be the actual URL since we're past the early return
          streamStatus: event.streamStatus, // Use actual status from event
          name: event.name,
          venue: event.venue,
          operator: event.operator,
        },
        timestamp: new Date(),
        priority: 'high',
        metadata: {
          eventId: event.id,
          streamId: event.streamKey
        }
      };

      sseService.broadcastToEvent(event.id, streamPayload);
      sseService.broadcastToChannel(AdminChannel.GLOBAL, streamPayload);
    }

    try {
      await notificationService.createStreamNotification('stream_started', event.id, [], {
        streamUrl: event.streamUrl,
        rtmpUrl: `rtmp://${process.env.STREAM_SERVER_HOST || "localhost"}/live/${event.streamKey}`
      });
    } catch (notificationError) {
      console.error('Error creating stream start notification:', notificationError);
    }

    res.json({
      success: true,
      message: streamAlreadyActive
        ? "Stream registered successfully (OBS already connected)"
        : "Stream started successfully",
      data: {
        event: event.toJSON(),
        streamKey: event.streamKey,
        streamUrl: event.streamUrl,
        streamAlreadyActive,
        rtmpUrl: `rtmp://${process.env.STREAM_SERVER_HOST || "localhost"
          }/live/${event.streamKey}`,
      },
    });
  })
);

// POST /api/events/:id/stream/stop - Detener transmisión
router.post(
  "/:id/stream/stop",
  authenticate,
  authorize("operator", "admin"),
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // ✅ CHANGED: If stream is already stopped, just return success (idempotent operation)
    const streamWasActive = event.streamUrl !== null && event.streamStatus !== 'offline';

    event.streamUrl = null;
    event.streamStatus = 'offline'; // ✅ UPDATE stream status in DB
    await event.save();

    const sseService = req.app.get("sseService");
    if (sseService) {
      const { randomUUID } = await import('crypto');
      const { AdminChannel } = await import('../services/sseService');
      const stopStreamPayload = {
        id: randomUUID(),
        type: "STREAM_STOPPED",
        data: {
          eventId: event.id,
          id: event.id, // ✅ Include id for frontend reconciliation
          streamStatus: 'offline', // ✅ Include streamStatus for UI update
          streamUrl: null,
          name: event.name,
          venue: event.venue,
          operator: event.operator,
        },
        timestamp: new Date(),
        priority: 'medium',
        metadata: {
          eventId: event.id
        }
      };

      // ✅ OPTIMIZED: Broadcast to both event-specific AND global admin channel
      sseService.broadcastToEvent(event.id, stopStreamPayload);
      sseService.broadcastToChannel(AdminChannel.GLOBAL, stopStreamPayload);
    }

    try {
      await notificationService.createStreamNotification('stream_stopped', event.id, []);
    } catch (notificationError) {
      console.error('Error creating stream stop notification:', notificationError);
    }

    res.json({
      success: true,
      message: streamWasActive
        ? "Stream stopped successfully"
        : "Stream already stopped (idempotent operation)",
      data: event.toJSON(),
    });
  })
);

// GET /api/events/:id/stream/status - Obtener estado del stream
router.get(
  "/:id/stream/status",
  authenticate,
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw errors.notFound("Event not found");
    }

    const isStreaming = !!event.streamUrl;
    const streamHealth = isStreaming ? "healthy" : "offline";

    res.json({
      success: true,
      data: {
        isStreaming,
        streamHealth,
        streamUrl: event.streamUrl,
        viewers: 0,
      },
    });
  })
);

// POST /api/events/:id/complete - Completar evento
router.post(
  "/:id/complete",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
      throw errors.forbidden("You are not assigned to this event");
    }

    if (event.status !== "in-progress") {
      throw errors.badRequest("Only active events can be completed");
    }

    if (event.streamUrl) {
      event.streamUrl = null;
    }

    event.status = "completed";
    event.endDate = new Date();
    event.streamKey = null;
    await event.save();

    const sseService = req.app.get("sseService");
    if (sseService) {
      const { randomUUID } = await import('crypto');
      sseService.broadcastToEvent(event.id, {
        id: randomUUID(),
        type: "EVENT_COMPLETED",
        data: {
          eventId: event.id
        },
        timestamp: new Date(),
        priority: 'medium',
        metadata: {
          eventId: event.id
        }
      });
    }

    try {
      await notificationService.createEventNotification('event_completed', event.id, [], {
        eventName: event.name
      });
    } catch (notificationError) {
      console.error('Error creating event completion notification:', notificationError);
    }

    res.json({
      success: true,
      message: "Event completed successfully",
      data: event.toJSON(),
    });
  })
);

// GET /api/events/:id/stats - Obtener estadísticas del evento
router.get(
  "/:id/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    const stats = {
      totalFights: event.totalFights,
      completedFights: event.completedFights,
      totalBets: event.totalBets,
      totalPrizePool: event.totalPrizePool,
      progress:
        event.totalFights > 0
          ? Math.round((event.completedFights / event.totalFights) * 100)
          : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

// DELETE /api/events/:id - Cancelar evento (solo admin) - soft delete
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    if (event.status === "in-progress") {
      throw errors.badRequest("Cannot delete an active event");
    }

    event.status = "cancelled";
    await event.save();

    // Invalidate cache
    await cacheDel("events:list:*");

    res.json({
      success: true,
      message: "Event cancelled successfully",
      data: event.toJSON(),
    });
  })
);

// DELETE /api/events/:id/permanent - Eliminar evento permanentemente (solo admin) - hard delete
router.delete(
  "/:id/permanent",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    await transaction(async (t) => {
      const event = await Event.findByPk(req.params.id, {
        include: [
          {
            model: Fight,
            as: "fights",
            include: [
              {
                model: Bet,
                as: "bets",
                required: false
              }
            ],
            required: false
          }
        ],
        transaction: t
      });

      if (!event) {
        throw errors.notFound("Event not found");
      }

      if (event.status === "in-progress") {
        throw errors.badRequest("Cannot permanently delete an active event");
      }

      const eventData = event.toJSON() as any;

      // Check if event has active bets
      const hasActiveBets = eventData.fights?.some((fight: any) =>
        fight.bets?.some((bet: any) => bet.status === "active" || bet.status === "pending")
      );

      if (hasActiveBets) {
        throw errors.badRequest("Cannot delete event with active bets");
      }

      // Delete associated bets first
      if (eventData.fights && eventData.fights.length > 0) {
        for (const fight of eventData.fights) {
          await Bet.destroy({ where: { fightId: fight.id }, transaction: t });
        }

        // Delete associated fights
        await Fight.destroy({ where: { eventId: event.id }, transaction: t });
      }

      // Finally delete the event
      await event.destroy({ transaction: t });

      // Invalidate cache
      await cacheDel("events:list:*");

      res.json({
        success: true,
        message: "Event permanently deleted successfully"
      });
    });
  })
);

const invalidateEventCache = async () => {
  await cacheDel("events:in-progress");
};

async function init() {
  await invalidateEventCache();
}
init();

// Get live viewer count
router.get('/:id/viewers', asyncHandler(async (req, res) => {
  const eventId = req.params.id;

  const activeConnections = await EventConnection.count({
    where: {
      event_id: eventId,
      disconnected_at: null
    }
  });

  res.json({
    success: true,
    data: {
      currentViewers: activeConnections,
      eventId
    }
  });
}));

// Get event analytics
router.get('/:id/analytics', authorize('admin', 'operator'), asyncHandler(async (req, res) => {
  const eventId = req.params.id;

  const analytics = await EventConnection.findAll({
    where: { event_id: eventId },
    include: [
      {
        model: User,
        attributes: ['id', 'username']
      }
    ],
    order: [['connected_at', 'DESC']]
  });

  const totalConnections = analytics.length;
  const uniqueViewers = new Set(analytics.map(a => a.user_id)).size;
  const avgDuration = analytics
    .filter(a => a.duration_seconds)
    .reduce((sum, a) => sum + a.duration_seconds, 0) / analytics.filter(a => a.duration_seconds).length;

  res.json({
    success: true,
    data: {
      totalConnections,
      uniqueViewers,
      averageDurationSeconds: Math.round(avgDuration || 0),
      connections: analytics
    }
  });
}));

export default router;