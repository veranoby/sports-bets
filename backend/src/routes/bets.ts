import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Bet, Fight, Event, User, Wallet, Transaction } from "../models";
import { body, validationResult } from "express-validator";
import { transaction, retryOperation, cache } from "../config/database";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import { requireBetting, enforceBetLimits, injectCommissionSettings } from "../middleware/settingsMiddleware";

const router = Router();

// 🔐 ADMIN ENDPOINT: Get all bets (must be BEFORE role restriction middleware)
router.get(
  "/all",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const { userId, status, fightId, eventId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query filters
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (fightId) where.fightId = fightId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom as string);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo as string);
    }

    // Query with pagination and includes
    const { rows: bets, count: total } = await Bet.findAndCountAll({
      where,
      include: [
        {
          model: Fight,
          as: "fight",
          include: [
            {
              model: Event,
              as: "event",
              where: eventId ? { id: eventId } : {},
              attributes: ['id', 'title', 'status', 'scheduledDate'],
            },
          ],
          attributes: ['id', 'number', 'status', 'redCorner', 'blueCorner', 'eventId'],
        },
        {
          model: User,
          as: "user",
          attributes: ['id', 'username', 'email', 'role'],
        },
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        bets,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        offset: Number(offset),
      },
    });
  })
);

// Apply betting feature gate to all routes below (excludes admin endpoint above)
router.use(requireBetting);

// 🔒 ROLE RESTRICTION: Only 'user' and 'gallera' roles can access betting
router.use((req, res, next) => {
  if (!['user', 'gallera'].includes(req.user?.role || '')) {
    return res.status(403).json({
      success: false,
      error: 'Betting access denied',
      message: 'Your role cannot place bets'
    });
  }
  next();
});

// GET /api/bets - Listar apuestas del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, fightId, eventId, limit = 20, offset = 0 } = req.query;

    const where: any = { userId: req.user!.id };
    if (status) where.status = status;
    if (fightId) where.fightId = fightId;

    // Optimized query with caching for frequently accessed data
    const cacheKey = `user_bets_${req.user!.id}_${status || 'all'}_${eventId || 'all'}_${limit}_${offset}`;
    const bets = await retryOperation(async () => {
      return await cache.getOrSet(cacheKey, async () => {
        return await Bet.findAndCountAll({
          where,
          include: [
            {
              model: Fight,
              as: "fight",
              separate: false,
              include: [
                {
                  model: Event,
                  as: "event",
                  where: eventId ? { id: eventId } : {},
                  attributes: ['id', 'title', 'status', 'scheduledDate'], // Only select needed fields
                  separate: false
                },
              ],
              attributes: ['id', 'number', 'status', 'redCorner', 'blueCorner'] // Only select needed fields
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        });
      }, 60); // Cache for 1 minute
    });

    res.json({
      success: true,
      data: {
        bets: bets.rows.map((bet) => bet.toPublicJSON()),
        total: bets.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

// GET /api/bets/available/:fightId - Obtener apuestas disponibles para aceptar
router.get(
  "/available/:fightId",
  authenticate,
  asyncHandler(async (req, res) => {
    // ⚡ N+1 OPTIMIZATION: Include Event for canAcceptBets() method
    const fight = await Fight.findByPk(req.params.fightId, {
      include: [
        {
          model: Event,
          as: "event",
          attributes: ['id', 'status', 'scheduledDate'] // Only needed fields for canAcceptBets()
        }
      ]
    });

    if (!fight) {
      throw errors.notFound("Fight not found");
    }

    if (!fight.canAcceptBets()) {
      throw errors.badRequest("Betting is not open for this fight");
    }

    // Buscar apuestas pendientes que el usuario puede aceptar with caching
    const cacheKey = `available_bets_${req.params.fightId}_${req.user!.id}`;
    const availableBets = await retryOperation(async () => {
      return await cache.getOrSet(cacheKey, async () => {
        return await Bet.findAll({
          where: {
            fightId: req.params.fightId,
            status: "pending",
            userId: { [Op.ne]: req.user!.id }, // No mostrar propias apuestas
            matchedWith: null,
            terms: {
              isOffer: true,
            },
          },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
      }, 30); // Cache for 30 seconds
    });

    res.json({
      success: true,
      data: availableBets.map((bet) => bet.toPublicJSON()),
    });
  })
);

// POST /api/bets - Crear nueva apuesta
router.post(
  "/",
  authenticate,
  enforceBetLimits,
  injectCommissionSettings,
  [
    body("fightId").isUUID().withMessage("Valid fight ID is required"),
    body("side").isIn(["red", "blue"]).withMessage("Side must be red or blue"),
    body("amount")
      .isFloat({ min: 10, max: 10000 })
      .withMessage("Amount must be between 10 and 10000"),
    body("ratio")
      .optional()
      .isFloat({ min: 1.01, max: 100 })
      .withMessage("Ratio must be between 1.01 and 100"),
    body("isOffer")
      .optional()
      .isBoolean()
      .withMessage("isOffer must be a boolean"),
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

    const { fightId, side, amount, ratio = 2.0, isOffer = true } = req.body;

    await transaction(async (t) => {
      // Verificar pelea
      const fight = await Fight.findByPk(fightId, {
        include: [{ model: Event, as: "event" }],
        transaction: t,
      });
      if (!fight) {
        throw errors.notFound("Fight not found");
      }

      if (!fight.canAcceptBets()) {
        throw errors.badRequest("Betting is not open for this fight");
      }

      // Verificar si el usuario ya tiene una apuesta en esta pelea
      const existingBet = await Bet.findOne({
        where: {
          fightId,
          userId: req.user!.id,
        },
        transaction: t,
      });

      if (existingBet) {
        throw errors.conflict("You already have a bet on this fight");
      }

      // Verificar wallet del usuario
      const wallet = await Wallet.findOne({
        where: { userId: req.user!.id },
        transaction: t,
      });

      if (!wallet) {
        throw errors.notFound("Wallet not found");
      }

      if (!wallet.canBet(amount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      // Calcular ganancia potencial
      const potentialWin = amount * ratio;

      // Crear apuesta
      const bet = await Bet.create(
        {
          fightId,
          userId: req.user!.id,
          side,
          amount,
          potentialWin,
          status: "pending",
          terms: {
            ratio,
            isOffer,
          },
        },
        { transaction: t }
      );

      // Congelar fondos
      await wallet.freezeAmount(amount);
      await wallet.save({ transaction: t });

      // Actualizar contadores en Fight
      fight.totalBets += 1;
      fight.totalAmount += amount;
      await fight.save({ transaction: t });

      // Actualizar contadores en Event
      const event = await Event.findByPk(fight.eventId, { transaction: t });
      if (event) {
        event.totalBets += 1;
        event.totalPrizePool += amount;
        await event.save({ transaction: t });
      }

      // Crear transacción de apuesta
      await Transaction.create(
        {
          walletId: wallet.id,
          type: "bet-loss", // Se marca como pérdida inicialmente
          amount: amount,
          status: "pending",
          description: `Bet placed on fight ${fight.number}`,
          metadata: {
            betId: bet.id,
            fightId: fight.id,
          },
        },
        { transaction: t }
      );

      // Emitir evento via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`event_${fight.eventId}`).emit("new_bet", {
          bet: bet.toPublicJSON(),
          fightId: fight.id,
        });
      }

      res.status(201).json({
        success: true,
        message: "Bet created successfully",
        data: bet.toPublicJSON(),
      });
    });
  })
);

// POST /api/bets/:id/accept - Aceptar una apuesta existente
router.post(
  "/:id/accept",
  authenticate,
  injectCommissionSettings,
  asyncHandler(async (req, res) => {
    await transaction(async (t) => {
      // Buscar la apuesta a aceptar
      const offerBet = await Bet.findByPk(req.params.id, {
        include: [
          { model: Fight, as: "fight" },
          { model: User, as: "user" },
        ],
        transaction: t,
      });

      if (!offerBet) {
        throw errors.notFound("Bet not found");
      }

      if (!offerBet.canBeMatched()) {
        throw errors.badRequest("This bet cannot be accepted");
      }

      if (offerBet.userId === req.user!.id) {
        throw errors.badRequest("You cannot accept your own bet");
      }

      const fight = await offerBet.getFight();
      if (!fight.canAcceptBets()) {
        throw errors.badRequest("Betting is closed for this fight");
      }

      // Verificar si el usuario ya tiene una apuesta en esta pelea
      const existingBet = await Bet.findOne({
        where: {
          fightId: fight.id,
          userId: req.user!.id,
        },
        transaction: t,
      });

      if (existingBet) {
        throw errors.conflict("You already have a bet on this fight");
      }

      // Verificar wallet del usuario
      const wallet = await Wallet.findOne({
        where: { userId: req.user!.id },
        transaction: t,
      });

      if (!wallet) {
        throw errors.notFound("Wallet not found");
      }

      // Calcular el monto necesario basado en el ratio
      const requiredAmount = offerBet.amount / (offerBet.terms?.ratio || 2.0);

      if (!wallet.canBet(requiredAmount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      // Crear apuesta complementaria
      const acceptBet = await Bet.create(
        {
          fightId: fight.id,
          userId: req.user!.id,
          side: offerBet.side === "red" ? "blue" : "red", // Lado opuesto
          amount: requiredAmount,
          potentialWin: offerBet.amount + requiredAmount,
          status: "active",
          matchedWith: offerBet.id,
          terms: {
            ratio: 1 / (offerBet.terms?.ratio || 2.0),
            isOffer: false,
          },
        },
        { transaction: t }
      );

      // Actualizar apuesta original
      offerBet.status = "active";
      offerBet.matchedWith = acceptBet.id;
      await offerBet.save({ transaction: t });

      // Congelar fondos del aceptante
      await wallet.freezeAmount(requiredAmount);
      await wallet.save({ transaction: t });

      // Actualizar contadores
      fight.totalBets += 1;
      fight.totalAmount += requiredAmount;
      await fight.save({ transaction: t });

      const event = await Event.findByPk(fight.eventId, { transaction: t });
      if (event) {
        event.totalBets += 1;
        event.totalPrizePool += requiredAmount;
        await event.save({ transaction: t });
      }

      // Crear transacción
      await Transaction.create(
        {
          walletId: wallet.id,
          type: "bet-loss",
          amount: requiredAmount,
          status: "pending",
          description: `Bet accepted on fight ${fight.number}`,
          metadata: {
            betId: acceptBet.id,
            matchedBetId: offerBet.id,
            fightId: fight.id,
          },
        },
        { transaction: t }
      );

      // Emitir eventos via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`event_${fight.eventId}`).emit("bet_matched", {
          offerBet: offerBet.toPublicJSON(),
          acceptBet: acceptBet.toPublicJSON(),
          fightId: fight.id,
        });
      }

      res.json({
        success: true,
        message: "Bet accepted successfully",
        data: {
          yourBet: acceptBet.toPublicJSON(),
          matchedBet: offerBet.toPublicJSON(),
        },
      });
    });
  })
);

// PUT /api/bets/:id/cancel - Cancelar apuesta pendiente
router.put(
  "/:id/cancel",
  authenticate,
  asyncHandler(async (req, res) => {
    await transaction(async (t) => {
      const bet = await Bet.findOne({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
        include: [{ model: Fight, as: "fight" }],
        transaction: t,
      });

      if (!bet) {
        throw errors.notFound("Bet not found");
      }

      if (bet.status !== "pending") {
        throw errors.badRequest("Only pending bets can be cancelled");
      }

      // Cancelar apuesta
      bet.status = "cancelled";
      await bet.save({ transaction: t });

      // Liberar fondos congelados
      const wallet = await Wallet.findOne({
        where: { userId: req.user!.id },
        transaction: t,
      });

      if (wallet) {
        await wallet.unfreezeAmount(bet.amount);
        wallet.balance += bet.amount;
        await wallet.save({ transaction: t });

        // Crear transacción de reembolso
        const fight = await bet.getFight();
        await Transaction.create(
          {
            walletId: wallet.id,
            type: "bet-refund",
            amount: bet.amount,
            status: "completed",
            description: `Refund for cancelled bet on fight ${fight.number}`,
            metadata: {
              betId: bet.id,
              fightId: fight.id,
            },
          },
          { transaction: t }
        );
      }

      // Actualizar contadores
      const fight = await Fight.findByPk(bet.fightId, { transaction: t });
      if (fight) {
        fight.totalBets -= 1;
        fight.totalAmount -= bet.amount;
        await fight.save({ transaction: t });

        const event = await Event.findByPk(fight.eventId, { transaction: t });
        if (event) {
          event.totalBets -= 1;
          event.totalPrizePool -= bet.amount;
          await event.save({ transaction: t });
        }
      }

      res.json({
        success: true,
        message: "Bet cancelled successfully",
        data: bet.toPublicJSON(),
      });
    });
  })
);

// GET /api/bets/stats - Estadísticas de apuestas del usuario
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [totalBets, wonBets, lostBets, totalWon, totalLost] =
      await Promise.all([
        Bet.count({ where: { userId, status: "completed" } }),
        Bet.count({ where: { userId, status: "completed", result: "win" } }),
        Bet.count({ where: { userId, status: "completed", result: "loss" } }),
        Bet.sum("potentialWin", { where: { userId, result: "win" } }) || 0,
        Bet.sum("amount", { where: { userId, result: "loss" } }) || 0,
      ]);

    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
    const netProfit = totalWon - totalLost;

    res.json({
      success: true,
      data: {
        totalBets,
        wonBets,
        lostBets,
        winRate: Math.round(winRate * 100) / 100,
        totalWon,
        totalLost,
        netProfit,
      },
    });
  })
);

// POST /api/bets/:id/propose-pago - Proponer un PAGO para una apuesta
router.post(
  "/:id/propose-pago",
  authenticate,
  enforceBetLimits,
  [
    body("pagoAmount")
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage("PAGO amount must be between 0.01 and 10000"),
  ],
  asyncHandler(async (req, res) => {
    const { pagoAmount } = req.body;
    await transaction(async (t) => {
      const originalBet = await Bet.findByPk(req.params.id, { transaction: t });
      if (
        !originalBet ||
        originalBet.betType !== "flat" ||
        !originalBet.isPending()
      ) {
        throw errors.badRequest("Invalid bet for PAGO proposal");
      }
      if (pagoAmount >= originalBet.amount) {
        throw errors.badRequest("PAGO amount must be less than original bet");
      }

      const wallet = await Wallet.findOne({
        where: { userId: req.user!.id },
        transaction: t,
      });
      if (!wallet || !wallet.canBet(pagoAmount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      const pagoBet = await Bet.create(
        {
          fightId: originalBet.fightId,
          userId: req.user!.id,
          side: originalBet.side,
          amount: pagoAmount,
          betType: "flat",
          proposalStatus: "pending",
          parentBetId: originalBet.id,
          terms: {
            ratio: 2.0, // Valor por defecto
            isOffer: false, // Es una propuesta, no una oferta
            pagoAmount,
            proposedBy: req.user!.id,
          },
        },
        { transaction: t }
      );

      await wallet.freezeAmount(pagoAmount);
      await wallet.save({ transaction: t });

      // Emitir evento WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${originalBet.userId}`).emit("pago_proposed", {
          originalBet: originalBet.toPublicJSON(),
          pagoBet: pagoBet.toPublicJSON(),
        });
      }

      res.status(201).json({
        success: true,
        message: "PAGO proposal created",
        data: pagoBet.toPublicJSON(),
      });
    });
  })
);

// PUT /api/bets/:id/accept-proposal - Aceptar una propuesta de PAGO
router.put(
  "/:id/accept-proposal",
  authenticate,
  authorize("user", "admin"),
  asyncHandler(async (req, res) => {
    await transaction(async (t) => {
      const originalBet = await Bet.findByPk(req.params.id, { transaction: t });
      if (
        !originalBet ||
        originalBet.userId !== req.user!.id ||
        originalBet.proposalStatus !== "pending"
      ) {
        throw errors.badRequest("Invalid bet for accepting PAGO proposal");
      }

      const pagoBet = await Bet.findOne({
        where: { parentBetId: originalBet.id, proposalStatus: "pending" },
        transaction: t,
      });
      if (!pagoBet) {
        throw errors.notFound("PAGO proposal not found");
      }

      // Validar saldos
      const originalWallet = await Wallet.findOne({
        where: { userId: originalBet.userId },
        transaction: t,
      });
      if (!originalWallet || !originalWallet.canBet(originalBet.amount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      // Activar apuestas
      originalBet.proposalStatus = "accepted";
      pagoBet.proposalStatus = "accepted";
      originalBet.status = "active";
      pagoBet.status = "active";
      await Promise.all([
        originalBet.save({ transaction: t }),
        pagoBet.save({ transaction: t }),
      ]);

      // Emitir evento WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${pagoBet.userId}`).emit("pago_accepted", {
          originalBet: originalBet.toPublicJSON(),
          pagoBet: pagoBet.toPublicJSON(),
        });
      }

      res.json({
        success: true,
        message: "PAGO proposal accepted",
        data: {
          originalBet: originalBet.toPublicJSON(),
          pagoBet: pagoBet.toPublicJSON(),
        },
      });
    });
  })
);

// PUT /api/bets/:id/reject-proposal - Rechazar una propuesta de PAGO
router.put(
  "/:id/reject-proposal",
  authenticate,
  asyncHandler(async (req, res) => {
    await transaction(async (t) => {
      const originalBet = await Bet.findByPk(req.params.id, { transaction: t });
      if (
        !originalBet ||
        originalBet.userId !== req.user!.id ||
        originalBet.proposalStatus !== "pending"
      ) {
        throw errors.badRequest("Invalid bet for rejecting PAGO proposal");
      }

      const pagoBet = await Bet.findOne({
        where: { parentBetId: originalBet.id, proposalStatus: "pending" },
        transaction: t,
      });
      if (!pagoBet) {
        throw errors.notFound("PAGO proposal not found");
      }

      // Liberar fondos
      const pagoWallet = await Wallet.findOne({
        where: { userId: pagoBet.userId },
        transaction: t,
      });
      if (pagoWallet) {
        await pagoWallet.unfreezeAmount(pagoBet.amount);
        await pagoWallet.save({ transaction: t });
      }

      // Eliminar propuesta
      await pagoBet.destroy({ transaction: t });

      // Emitir evento WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${pagoBet.userId}`).emit("pago_rejected", {
          originalBet: originalBet.toPublicJSON(),
        });
      }

      res.json({
        success: true,
        message: "PAGO proposal rejected",
      });
    });
  })
);

// GET /api/bets/pending-proposals - Obtener propuestas de PAGO pendientes del usuario
router.get(
  "/pending-proposals",
  authenticate,
  asyncHandler(async (req, res) => {
    const pendingProposals = await Bet.findAll({
      where: {
        parentBetId: { [Op.not]: null },
        proposalStatus: "pending",
        userId: req.user!.id,
      },
      include: [
        {
          model: Bet,
          as: "parentBet",
          include: [
            { model: User, as: "user", attributes: ["id", "username"] },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: pendingProposals.map((proposal) => proposal.toPublicJSON()),
    });
  })
);

export default router;
