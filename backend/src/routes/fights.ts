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
        { model: Event, as: "event" },
        {
          model: Bet,
          as: "bets",
          include: [
            { model: User, as: "user", attributes: ["id", "username"] },
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

// POST /api/fights - Crear nueva pelea (operador)
router.post(
  "/",
  authenticate,
  authorize("operator", "admin"),
  [
    body("eventId").isUUID().withMessage("Valid event ID is required"),
    body("number")
      .isInt({ min: 1, max: 999 })
      .withMessage("Fight number must be between 1 and 999"),
    body("redCorner")
      .isLength({ min: 2, max: 255 })
      .withMessage("Red corner name must be between 2 and 255 characters"),
    body("blueCorner")
      .isLength({ min: 2, max: 255 })
      .withMessage("Blue corner name must be between 2 and 255 characters"),
    body("weight")
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
      number,
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

      // Verificar que no existe una pelea con el mismo número en el evento
      const existingFight = await Fight.findOne({
        where: { eventId, number },
        transaction: t,
      });

      if (existingFight) {
        throw errors.conflict(
          "A fight with this number already exists in the event"
        );
      }

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
      .isIn(["upcoming", "betting", "live", "completed", "cancelled"])
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

    // Verificar si la pelea puede ser editada
    if (fight.status === "completed") {
      throw errors.badRequest("Completed fights cannot be edited");
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

// POST /api/fights/:id/open-betting - Abrir apuestas para una pelea
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
    if (fight.status !== "upcoming") {
      throw errors.badRequest("Betting can only be opened for upcoming fights");
    }

    // Abrir apuestas con timestamp
    fight.status = "betting";
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
    if (fight.status !== "betting") {
      throw errors.badRequest("Betting is not currently open for this fight");
    }

    // Cerrar apuestas con timestamps
    fight.status = "live";
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
      if (fight.status !== "live") {
        throw errors.badRequest("Can only record results for live fights");
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

export default router;
