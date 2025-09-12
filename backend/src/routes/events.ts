import { Router } from "express";
import { authenticate, authorize, optionalAuth, filterByOperatorAssignment } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Event, Venue, User, Fight, EventConnection } from "../models";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { getCache, setCache, delCache as cacheDel, } from "../config/redis";
import notificationService from "../services/notificationService";
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

// GET /api/events - Listar eventos con filtros
router.get(
  "/",
  optionalAuth,
  filterByOperatorAssignment,
  asyncHandler(async (req, res) => {
    const { venueId, status, upcoming, limit = 20, offset = 0 } = req.query;
    const userRole = req.user?.role || 'public';

    // Create a unique cache key based on query params and user role
    const cacheKey = `events:list:${userRole}:${venueId || ''}:${status || ''}:${upcoming || ''}:${limit}:${offset}`;

    // Try to get data from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const where: any = { ...req.queryFilter };
    if (venueId) where.venueId = venueId;
    if (status) where.status = status;
    if (upcoming === "true") {
      where.scheduledDate = {
        [Op.gte]: new Date(),
      };
      where.status = "scheduled";
    }
    const attributes = getEventAttributes(req.user?.role, "list");

    const events = await Event.findAndCountAll({
      where,
      attributes,
      include: [
        {
          model: Venue,
          as: "venue",
          attributes: ["id", "name", "location"],
        },
        {
          model: User,
          as: "operator",
          attributes: ["id", "username"],
        },
      ],
      order: [["scheduledDate", "ASC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const responseData = {
      success: true,
      data: {
        events: events.rows.map((e) => e.toJSON({ attributes })),
        total: events.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
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

    const event = await Event.findOne({
      where: { id: req.params.id, ...req.queryFilter },
      attributes,
      include: [
        { model: Venue, as: "venue" },
        { model: User, as: "operator", attributes: ["id", "username"] },
        { model: User, as: "creator", attributes: ["id", "username"] },
        {
          model: Fight,
          as: "fights",
          order: [["number", "ASC"]],
        },
      ],
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

    res.json({
      success: true,
      message: "Event updated successfully",
      data: event.toJSON(),
    });
  })
);

// POST /api/events/:id/activate - Activar evento para transmisión
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
      sseService.broadcastToEvent(event.id, {
        type: "EVENT_ACTIVATED",
        data: {
          eventId: event.id,
          streamUrl: event.streamUrl,
          timestamp: new Date()
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

    if (event.status !== "in-progress") {
      throw errors.badRequest("Event must be activated first");
    }

    if (event.streamUrl) {
      throw errors.conflict("Stream is already active");
    }

    if (!event.streamKey) {
      event.streamKey = event.generateStreamKey();
    }

    event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
    await event.save();

    try {
      const streamHealthy = true;
      if (!streamHealthy) {
        throw new Error("Streaming server is not available");
      }
    } catch (error) {
      throw errors.conflict("Streaming server is not available");
    }

    const sseService = req.app.get("sseService");
    if (sseService) {
      sseService.broadcastToEvent(event.id, {
        type: "STREAM_STARTED",
        data: {
          eventId: event.id,
          streamUrl: event.streamUrl,
          timestamp: new Date()
        }
      });
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
      message: "Stream started successfully",
      data: {
        event: event.toJSON(),
        streamKey: event.streamKey,
        streamUrl: event.streamUrl,
        rtmpUrl: `rtmp://${
          process.env.STREAM_SERVER_HOST || "localhost"
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

    if (!event.streamUrl) {
      throw errors.badRequest("No active stream found");
    }

    event.streamUrl = null;
    await event.save();

    const sseService = req.app.get("sseService");
    if (sseService) {
      sseService.broadcastToEvent(event.id, {
        type: "STREAM_STOPPED",
        data: {
          eventId: event.id,
          timestamp: new Date()
        }
      });
    }
    
    try {
        await notificationService.createStreamNotification('stream_stopped', event.id, []);
    } catch (notificationError) {
        console.error('Error creating stream stop notification:', notificationError);
    }

    res.json({
      success: true,
      message: "Stream stopped successfully",
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
      sseService.broadcastToEvent(event.id, {
        type: "EVENT_COMPLETED",
        data: {
          eventId: event.id,
          timestamp: new Date()
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

// DELETE /api/events/:id - Cancelar evento (solo admin)
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

    res.json({
      success: true,
      message: "Event cancelled successfully",
      data: event.toJSON(),
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