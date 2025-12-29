import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Fight, Event, Bet, User, Wallet, Transaction } from "../models";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { transaction } from "../config/database";

const router = Router();

// GET /api/fights - Listar peleas con filtros
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { eventId, status } = req.query;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const fights = await Fight.findAll({
      where,
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "name", "status"],
        },
      ],
      order: [["number", "ASC"]],
    });

    res.json({
      success: true,
      data: fights.map((fight) => fight.toPublicJSON()),
    });
  })
);

// GET /api/fights/:id - Obtener pelea específica
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const fight = await Fight.findByPk(req.params.id, {
      include: [
        { model: Event, as: "event", separate: false },
        {
          model: Bet,
          as: "bets",
          separate: false,
          include: [
            { model: User, as: "user", attributes: ["id", "username"], separate: false },
          ],
        },
      ],
    });

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    const fightData = fight.toJSON() as any;
    const operatorId = fightData.event?.operatorId;

    res.json({
      success: true,
      data: {
        fight: fightData,
        operatorId,
      },
    });
  })
);

// POST /api/fights - Crear nueva pelea (operador) - auto-incremental number
router.post(
  "/",
  authenticate,
  authorize("operator", "admin"),
  [
    body("eventId").isUUID().withMessage("Valid event ID is required"),
    body("redCorner")
      .isLength({ min: 2, max: 255 })
      .withMessage("Red corner name must be between 2 and 255 characters"),
    body("blueCorner")
      .isLength({ min: 2, max: 255 })
      .withMessage("Blue corner name must be between 2 and 255 characters"),
    body("weight")
      .optional()
      .isFloat({ min: 1.0, max: 10.0 })
      .withMessage("Weight must be between 1.0 and 10.0"),
    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes must not exceed 1000 characters"),
    body("initialOdds")
      .optional()
      .isObject()
      .withMessage("Initial odds must be an object"),
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

    const {
      eventId,
      redCorner,
      blueCorner,
      weight,
      notes,
      initialOdds,
    } = req.body;

    // Usar transacción para operaciones múltiples
    await transaction(async (t) => {
      // Verificar que el evento existe
      const event = await Event.findByPk(eventId, { transaction: t });
      if (!event) {
        throw errors.notFound("Event not found");
      }

      // Verificar permisos del operador
      const eventData = event.toJSON() as any;
      if (req.user!.role === "operator" && event.operatorId !== req.user!.id) {
        throw errors.forbidden("You are not assigned to this event");
      }

      // Auto-calcular el número de pelea (max + 1)
      const maxFight = await Fight.findOne({
        where: { eventId },
        order: [["number", "DESC"]],
        transaction: t,
      });

      const number = maxFight ? maxFight.number + 1 : 1;

      // Verificar que los criaderos son diferentes
      if (redCorner.toLowerCase() === blueCorner.toLowerCase()) {
        throw errors.badRequest("Red and blue corners cannot be the same");
      }

      // Crear pelea con campos nuevos
      const fight = await Fight.create(
        {
          eventId,
          number,
          redCorner,
          blueCorner,
          weight,
          notes,
          initialOdds: initialOdds || { red: 1.0, blue: 1.0 },
          totalBets: 0,
          totalAmount: 0,
        },
        { transaction: t }
      );

      // Actualizar contador en evento
      event.totalFights += 1;
      await event.save({ transaction: t });

      // Emitir evento via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`event_${eventId}`).emit("fight_created", {
          fight: fight.toPublicJSON(),
        });
      }

      res.status(201).json({
        success: true,
        message: "Fight created successfully",
        data: fight.toPublicJSON(),
      });
    });
  })
);

// PUT /api/fights/:id - Actualizar pelea (operador)
router.put(
  "/:id",
  authenticate,
  authorize("operator", "admin"),
  [
    body("redCorner")
      .optional()
      .isLength({ min: 2, max: 255 })
      .withMessage("Red corner name must be between 2 and 255 characters"),
    body("blueCorner")
      .optional()
      .isLength({ min: 2, max: 255 })
      .withMessage("Blue corner name must be between 2 and 255 characters"),
    body("weight")
      .optional()
      .isFloat({ min: 1.0, max: 10.0 })
      .withMessage("Weight must be between 1.0 and 10.0"),
    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes must not exceed 1000 characters"),
    body("status")
      .optional()
      .isIn(["draft", "scheduled", "ready", "betting_open", "in_progress", "completed", "cancelled"])
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

    const fight = await Fight.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: "event",
        },
      ],
    });

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    // Verificar permisos del operador
    const fightData = fight.toJSON() as any;
    if (
      req.user!.role === "operator" &&
      fightData.event &&
      fightData.event.operatorId !== req.user!.id
    ) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // Verificar si la pelea puede ser editada - Solo permitir cuando está draft o scheduled
    if (fight.status !== "draft" && fight.status !== "scheduled") {
      throw errors.badRequest("Fights can only be edited when in draft or scheduled status");
    }

    // Actualizar campos permitidos
    const allowedFields = [
      "redCorner",
      "blueCorner",
      "weight",
      "notes",
      "status",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (fight as any)[field] = req.body[field];
      }
    });

    // Verificar que los criaderos siguen siendo diferentes
    if (fight.redCorner.toLowerCase() === fight.blueCorner.toLowerCase()) {
      throw errors.badRequest("Red and blue corners cannot be the same");
    }

    await fight.save();

    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`event_${fight.eventId}`).emit("fight_updated", {
        fight: fight.toPublicJSON(),
      });
    }

    res.json({
      success: true,
      message: "Fight updated successfully",
      data: fight.toPublicJSON(),
    });
  })
);

// PATCH /api/fights/:id/status - Fight status transitions with workflow logic
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "operator"),
  [
    body("status")
      .isIn(["draft", "scheduled", "ready", "betting_open", "in_progress", "completed", "cancelled"])
      .withMessage("Status must be draft, scheduled, ready, betting_open, in_progress, completed, or cancelled"),
    body("result")
      .optional()
      .isIn(["red", "blue", "draw"])
      .withMessage("Result must be red, blue, or draw")
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

    const { status, result } = req.body;

    await transaction(async (t) => {
      const fight = await Fight.findByPk(req.params.id, {
        include: [
          {
            model: Event,
            as: "event",
          },
          {
            model: Bet,
            as: "bets",
            required: false
          }
        ],
        transaction: t
      });

      if (!fight) {
        throw errors.notFound("Fight not found");
      }

      // Verify permissions
      const fightData = fight.toJSON() as any;
      if (
        req.user!.role === "operator" &&
        fightData.event.operatorId !== req.user!.id
      ) {
        throw errors.forbidden("You are not assigned to this event");
      }

      // Verify event is in-progress
      if (fightData.event.status !== "in-progress") {
        throw errors.badRequest("Event must be in progress to manage fights");
      }

      // Validate status transition using Fight model method
      if (!fight.canTransitionTo(status)) {
        throw errors.badRequest(
          `Invalid transition from ${fight.status} to ${status}`
        );
      }

      // Save current status for response
      const currentStatus = fight.status;

      // Handle specific status logic
      switch (status) {
        case "betting_open":
          fight.bettingStartTime = new Date();
          break;

        case "in_progress":
          fight.bettingEndTime = new Date();
          fight.startTime = new Date();

          // Auto-cancel any pending unmatched bets
          await Bet.update(
            { status: "cancelled" },
            {
              where: {
                fightId: fight.id,
                status: "pending"
              },
              transaction: t
            }
          );
          break;

        case "completed":
          if (!result) {
            throw errors.badRequest("Result is required when completing a fight");
          }

          fight.result = result;
          fight.endTime = new Date();

          // Update event completed fights count
          const event = await Event.findByPk(fight.eventId, { transaction: t });
          if (event) {
            event.completedFights += 1;
            await event.save({ transaction: t });
          }

          // Process bet results
          const activeBets = await Bet.findAll({
            where: {
              fightId: fight.id,
              status: "active"
            },
            transaction: t
          });

          for (const bet of activeBets) {
            let betResult: "win" | "loss" | "draw" = "loss";

            if (result === "draw") {
              betResult = "draw";
            } else if (
              (result === "red" && bet.side === "red") ||
              (result === "blue" && bet.side === "blue")
            ) {
              betResult = "win";
            }

            bet.result = betResult;
            bet.status = "completed";
            await bet.save({ transaction: t });
          }
          break;
      }

      // Update fight status
      fight.status = status;
      await fight.save({ transaction: t });

      // Broadcast via SSE
      const sseService = req.app.get("sseService");
      if (sseService) {
        const eventType = status === "betting_open" ? "BETTING_WINDOW_OPENED" :
                         status === "in_progress" ? "BETTING_WINDOW_CLOSED" :
                         status === "completed" ? "FIGHT_COMPLETED" : "FIGHT_STATUS_UPDATE";

        sseService.broadcastToSystem(eventType, {
          fightId: fight.id,
          eventId: fight.eventId,
          fightNumber: fight.number,
          status: status,
          result: result,
          redCorner: fight.redCorner,
          blueCorner: fight.blueCorner,
          timestamp: new Date()
        });
      }

      res.json({
        success: true,
        message: `Fight status updated to ${status} successfully`,
        data: {
          fight: fight.toPublicJSON(),
          result: result,
          statusTransition: `${currentStatus} → ${status}`
        }
      });
    });
  })
);

// POST /api/fights/:id/open-betting - Abrir apuestas para una pelea (DEPRECATED - use PATCH /api/fights/:id/status)
router.post(
  "/:id/open-betting",
  authenticate,
  authorize("operator", "admin"),
  asyncHandler(async (req, res) => {
    const fight = await Fight.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: "event",
        },
      ],
    });

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    // Verificar permisos del operador
    const fightData = fight.toJSON() as any;
    if (
      req.user!.role === "operator" &&
      fightData.event.operatorId !== req.user!.id
    ) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // Verificar que la pelea puede abrir apuestas
    if (fight.status !== "ready" && fight.status !== "scheduled") {
      throw errors.badRequest("Betting can only be opened for ready or scheduled fights");
    }

    // Abrir apuestas con timestamp
    fight.status = "betting_open";
    fight.bettingStartTime = new Date();
    await fight.save();

    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`event_${fight.eventId}`).emit("betting_opened", {
        fightId: fight.id,
        fight: fight.toPublicJSON(),
      });
    }

    res.json({
      success: true,
      message: "Betting opened successfully",
      data: fight.toPublicJSON(),
    });
  })
);

// POST /api/fights/:id/close-betting - Cerrar apuestas para una pelea
router.post(
  "/:id/close-betting",
  authenticate,
  authorize("operator", "admin"),
  asyncHandler(async (req, res) => {
    const fight = await Fight.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: "event",
        },
      ],
    });

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    // Verificar permisos del operador
    const fightData = fight.toJSON() as any;
    if (
      req.user!.role === "operator" &&
      fightData.event.operatorId !== req.user!.id
    ) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // Verificar que las apuestas están abiertas
    if (fight.status !== "betting_open") {
      throw errors.badRequest("Betting is not currently open for this fight");
    }

    // Cerrar apuestas con timestamps
    fight.status = "in_progress";
    fight.bettingEndTime = new Date();
    fight.startTime = new Date();
    await fight.save();

    // Activar apuestas pendientes
    await Bet.update(
      { status: "active" },
      {
        where: {
          fightId: fight.id,
          status: "pending",
        },
      }
    );

    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`event_${fight.eventId}`).emit("betting_closed", {
        fightId: fight.id,
        fight: fight.toPublicJSON(),
      });
    }

    res.json({
      success: true,
      message: "Betting closed successfully",
      data: fight.toPublicJSON(),
    });
  })
);

// POST /api/fights/:id/result - Registrar resultado de pelea
router.post(
  "/:id/result",
  authenticate,
  authorize("operator", "admin"),
  [
    body("result")
      .isIn(["red", "blue", "draw", "cancelled"])
      .withMessage("Result must be red, blue, draw, or cancelled"),
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

    const { result } = req.body;

    await transaction(async (t) => {
      const fight = await Fight.findByPk(req.params.id, {
        include: [
          {
            model: Event,
            as: "event",
          },
          {
            model: Bet,
            as: "bets",
            where: { status: "active" },
            required: false,
          },
        ],
        transaction: t,
      });

      if (!fight) {
        throw errors.notFound("Fight not found");
      }

      // Verificar permisos del operador
      const fightData = fight.toJSON() as any;
      if (
        req.user!.role === "operator" &&
        fightData.event.operatorId !== req.user!.id
      ) {
        throw errors.forbidden("You are not assigned to this event");
      }

      // Verificar que la pelea está en vivo
      if (fight.status !== "in_progress") {
        throw errors.badRequest("Can only record results for fights in progress");
      }

      // Completar pelea
      fight.status = "completed";
      fight.result = result;
      fight.endTime = new Date();
      await fight.save({ transaction: t });

      // Actualizar evento
      const event = await Event.findByPk(fight.eventId, { transaction: t });
      if (event) {
        event.completedFights += 1;
        await event.save({ transaction: t });
      }

      // Procesar resultados de apuestas
      const bets = fightData.bets || [];
      if (bets.length > 0) {
        for (const betData of bets) {
          const bet = await Bet.findByPk(betData.id, { transaction: t });
          if (!bet) continue;

          let betResult: "win" | "loss" | "draw" | "cancelled" = "loss";

          if (result === "cancelled") {
            betResult = "cancelled";
          } else if (result === "draw") {
            betResult = "draw";
          } else if (
            (result === "red" && bet.side === "red") ||
            (result === "blue" && bet.side === "blue")
          ) {
            betResult = "win";
          }

          bet.result = betResult;
          bet.status = "completed";
          await bet.save({ transaction: t });

          // Actualizar wallet del usuario
          const wallet = await Wallet.findOne({
            where: { userId: bet.userId },
            transaction: t,
          });

          if (wallet) {
            // Liberar cantidad congelada
            wallet.frozenAmount -= bet.amount;

            // Si ganó, agregar ganancia
            if (betResult === "win") {
              wallet.balance += bet.potentialWin;
            } else if (betResult === "cancelled" || betResult === "draw") {
              // Devolver apuesta original
              wallet.balance += bet.amount;
            }

            await wallet.save({ transaction: t });

            // Crear transacción
            await Transaction.create(
              {
                walletId: wallet.id,
                type:
                  betResult === "win"
                    ? "bet-win"
                    : betResult === "cancelled" || betResult === "draw"
                    ? "bet-refund"
                    : "bet-loss",
                amount:
                  betResult === "win"
                    ? bet.potentialWin
                    : betResult === "cancelled" || betResult === "draw"
                    ? bet.amount
                    : bet.amount,
                status: "completed",
                description: `${
                  betResult === "win"
                    ? "Won"
                    : betResult === "cancelled" || betResult === "draw"
                    ? "Refund for"
                    : "Lost"
                } bet on fight ${fight.number}`,
                metadata: {
                  fightId: fight.id,
                  betId: bet.id,
                  result: result,
                },
              },
              { transaction: t }
            );
          }
        }
      }

      // Emitir evento via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`event_${fight.eventId}`).emit("fight_completed", {
          fightId: fight.id,
          result: result,
          fight: fight.toPublicJSON(),
        });
      }

      res.json({
        success: true,
        message: "Fight result recorded successfully",
        data: fight.toPublicJSON(),
      });
    });
  })
);

// =============================================
// BETTING WINDOWS MANAGEMENT ENDPOINTS
// =============================================

// POST /api/fights/:fightId/open-betting - Open betting window
router.post(
  "/:fightId/open-betting",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const fight = await Fight.findByPk(req.params.fightId, {
      include: [{ model: Event, as: "event" }]
    });

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    // Verify fight status
    if (fight.status !== "ready" && fight.status !== "scheduled") {
      throw errors.badRequest(`Cannot open betting for fight with status: ${fight.status}`);
    }

    // Open betting window
    fight.status = "betting_open";
    await fight.save();

    // Notify via SSE
    const sseService = req.app.get("sseService");
    if (sseService) {
      sseService.broadcastToSystem("betting_opened", {
        fightId: fight.id,
        eventId: fight.eventId,
        fightNumber: fight.number,
        redCorner: fight.redCorner,
        blueCorner: fight.blueCorner,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Betting window opened successfully",
      data: {
        fightId: fight.id,
        status: fight.status,
        fightDetails: fight.toPublicJSON()
      }
    });
  })
);

// POST /api/fights/:fightId/close-betting - Close betting window
router.post(
  "/:fightId/close-betting",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const fight = await Fight.findByPk(req.params.fightId);

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    // Verify fight status
    if (fight.status !== "betting_open") {
      throw errors.badRequest(`Cannot close betting for fight with status: ${fight.status}`);
    }

    await transaction(async (t) => {
      // Close betting window
      fight.status = "in_progress";
      await fight.save({ transaction: t });

      // Auto-cancel any pending unmatched bets
      const pendingBets = await Bet.findAll({
        where: {
          fightId: fight.id,
          status: "pending"
        },
        transaction: t
      });

      for (const bet of pendingBets) {
        bet.status = "cancelled";
        await bet.save({ transaction: t });
      }

      // Refund cancelled bets
      for (const bet of pendingBets) {
        if (bet.userId && bet.amount) {
          const wallet = await Wallet.findOne({
            where: { userId: bet.userId },
            transaction: t
          });

          if (wallet) {
            await Transaction.create({
              walletId: wallet.id,
              type: "bet-refund",
              amount: bet.amount,
              description: `Refund for cancelled bet on fight ${fight.number}`,
              status: "completed"
            }, { transaction: t });

            wallet.balance += bet.amount;
            await wallet.save({ transaction: t });
          }
        }
      }
    });

    // Notify via SSE
    const sseService = req.app.get("sseService");
    if (sseService) {
      sseService.broadcastToSystem("betting_closed", {
        fightId: fight.id,
        eventId: fight.eventId,
        fightNumber: fight.number,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Betting window closed successfully",
      data: {
        fightId: fight.id,
        status: fight.status,
        fightDetails: fight.toPublicJSON()
      }
    });
  })
);

// GET /api/events/:eventId/current-betting - Get current active betting fight
router.get(
  "/events/:eventId/current-betting",
  asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;

    // Find the current fight with betting status
    const currentFight = await Fight.findOne({
      where: {
        eventId,
        status: "betting_open"
      },
      include: [
        { model: Event, as: "event" },
        {
          model: Bet,
          as: "bets",
          where: { status: "pending" },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username"]
            }
          ]
        }
      ],
      order: [["number", "ASC"]]
    });

    if (!currentFight) {
      return res.json({
        success: true,
        data: {
          currentFight: null,
          availableBets: [],
          bettingOpen: false
        }
      });
    }

    // Get available bets for this fight
    const availableBets = await Bet.findAll({
      where: {
        fightId: currentFight.id,
        status: "pending"
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      success: true,
      data: {
        currentFight: currentFight.toPublicJSON(),
        availableBets: availableBets.map(bet => bet.toPublicJSON()),
        bettingOpen: true
      }
    });
  })
);

// GET /api/bets/available/:fightId - Get available bets for specific fight
router.get(
  "/bets/available/:fightId",
  asyncHandler(async (req, res) => {
    const fightId = req.params.fightId;

    const fight = await Fight.findByPk(fightId);
    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    // Verify betting is open
    if (fight.status !== "betting_open") {
      throw errors.forbidden("Betting is not open for this fight");
    }

    const availableBets = await Bet.findAll({
      where: {
        fightId,
        status: "pending"
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      success: true,
      data: {
        fightId,
        fightStatus: fight.status,
        availableBets: availableBets.map(bet => bet.toPublicJSON())
      }
    });
  })
);

// DELETE /api/fights/:id - Delete fight (admin/operator)
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    await transaction(async (t) => {
      const fight = await Fight.findByPk(req.params.id, {
        include: [
          {
            model: Event,
            as: "event",
          },
          {
            model: Bet,
            as: "bets",
            required: false
          }
        ],
        transaction: t
      });

      if (!fight) {
        throw errors.notFound("Fight not found");
      }

      const fightData = fight.toJSON() as any;

      // Verify permissions
      if (
        req.user!.role === "operator" &&
        fightData.event.operatorId !== req.user!.id
      ) {
        throw errors.forbidden("You are not assigned to this event");
      }

      // Cannot delete if fight has active/pending bets
      const hasActiveBets = fightData.bets?.some(
        (bet: any) => bet.status === "active" || bet.status === "pending"
      );

      if (hasActiveBets) {
        throw errors.badRequest("Cannot delete fight with active/pending bets");
      }

      // Cannot delete if fight is in progress
      if (fight.status === "in_progress") {
        throw errors.badRequest("Cannot delete a fight in progress");
      }

      // Delete all associated bets first
      await Bet.destroy({ where: { fightId: fight.id }, transaction: t });

      // Update event totalFights count
      const event = await Event.findByPk(fight.eventId, { transaction: t });
      if (event) {
        event.totalFights = Math.max(0, event.totalFights - 1);
        await event.save({ transaction: t });
      }

      // Delete the fight
      await fight.destroy({ transaction: t });

      res.json({
        success: true,
        message: "Fight deleted successfully"
      });
    });
  })
);

export default router;
