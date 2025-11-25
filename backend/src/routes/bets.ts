import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Bet, Fight, Event, User, Wallet, Transaction } from "../models";
import { body, validationResult } from "express-validator";
import { transaction, retryOperation, cache } from "../config/database";
import { sequelize } from "../config/database";
import { Op } from "sequelize";
import { requireBetting, enforceBetLimits, injectCommissionSettings } from "../middleware/settingsMiddleware";
import { BetService } from "../services/betService";

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

// GET /api/bets/suggestions - Get matching bets for suggestions panel (when user types amount)
router.get('/suggestions/:fightId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { fightId } = req.params;
    const { side, amount } = req.query;

    if (!side || !['red', 'blue'].includes(side as string)) {
      throw errors.badRequest("Valid side (red or blue) is required");
    }

    const oppositeSide = side === 'red' ? 'blue' : 'red';

    // Build query filters
    const where: any = {
      fightId,
      side: oppositeSide,
      status: 'pending',
      betType: 'flat', // Only match flat bets by default
    };

    // If amount is provided, filter within ±20% range
    if (amount) {
      const numAmount = parseFloat(amount as string);
      if (isNaN(numAmount)) {
        throw errors.badRequest("Amount must be a valid number");
      }

      const lowerBound = numAmount * 0.8; // 20% lower
      const upperBound = numAmount * 1.2; // 20% higher

      where.amount = {
        [Op.gte]: lowerBound,
        [Op.lte]: upperBound
      };
    }

    const suggestions = await Bet.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profileInfo'],
        },
      ],
      order: [['createdAt', 'ASC']], // Order by oldest first to match
    });

    res.json({
      success: true,
      data: suggestions.map(bet => bet.toPublicJSON()),
    });
  })
);

// PUT /api/bets/:id/edit - Edit pending bet (only if status is pending)
router.put('/:id/edit',
  authenticate,
  [
    body('amount')
      .optional()
      .isFloat({ min: 10, max: 10000 })
      .withMessage('Amount must be between 10 and 10000'),
    body('side')
      .optional()
      .isIn(['red', 'blue'])
      .withMessage('Side must be red or blue'),
    body('betType')
      .optional()
      .isIn(['flat', 'doy', 'pago'])
      .withMessage('betType must be flat, doy, or pago'),
    body('terms')
      .optional()
      .isObject()
      .withMessage('Terms must be an object'),
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

    const { id } = req.params;
    const { amount, side, betType, terms } = req.body;

    const bet = await Bet.findByPk(id, {
      include: [
        { model: Fight, as: "fight" },
        { model: Wallet, as: "wallet" }
      ],
    });

    if (!bet) {
      throw errors.notFound("Bet not found");
    }

    if (bet.userId !== req.user!.id) {
      throw errors.forbidden("You can only edit your own bets");
    }

    if (bet.status !== 'pending') {
      throw errors.badRequest("Only pending bets can be edited");
    }

    // Update allowed fields
    if (amount !== undefined) bet.amount = amount;
    if (side !== undefined) bet.side = side;
    if (betType !== undefined) bet.betType = betType;
    if (terms !== undefined) bet.terms = { ...bet.terms, ...terms };

    await bet.save();

    res.json({
      success: true,
      message: "Bet updated successfully",
      data: bet.toPublicJSON(),
    });
  })
);

// POST /api/bets/:id/auto-match - Check for and match flat bets after creation (for auto-matching)
// This will be called internally from the POST / endpoint
async function autoMatchFlatBet(bet: Bet, t: any, io: any) {
  if (bet.betType !== 'flat' || bet.status !== 'pending') {
    return null; // Only flat, pending bets are eligible for auto-match
  }

  // Look for an opposite-side, exact amount flat bet that is still pending
  const oppositeBet = await Bet.findOne({
    where: {
      fightId: bet.fightId,
      side: bet.side === 'red' ? 'blue' : 'red', // Opposite side
      amount: bet.amount, // Exact amount match
      status: 'pending',
      betType: 'flat', // Only flat bets match each other
    },
    include: [
      { model: User, as: "user" },
      { model: Wallet, as: "wallet" },
    ],
    transaction: t,
  });

  if (!oppositeBet) {
    return null; // No matching bet found
  }

  // Get the wallets for both users
  const bettorWallet = await Wallet.findOne({
    where: { userId: bet.userId },
    transaction: t,
  });

  const oppositeWallet = await Wallet.findOne({
    where: { userId: oppositeBet.userId },
    transaction: t,
  });

  if (!bettorWallet || !oppositeWallet) {
    throw errors.notFound("Wallet not found for one of the bettors");
  }

  // Check if both users have sufficient available balance
  if (!bettorWallet.canBet(bet.amount) || !oppositeWallet.canBet(oppositeBet.amount)) {
    return null; // One of the wallets doesn't have enough balance
  }

  // Mark both bets as active and matched with each other
  bet.status = 'active';
  bet.matchedWith = oppositeBet.id;
  await bet.save({ transaction: t });

  oppositeBet.status = 'active';
  oppositeBet.matchedWith = bet.id;
  await oppositeBet.save({ transaction: t });

  // Update wallet frozen amounts (they should already be frozen when bet was created)
  // but make sure they're properly set for both bets
  await bettorWallet.reload({ transaction: t });
  await oppositeWallet.reload({ transaction: t });

  // The amounts should already be frozen when the bets were created, so no additional freezing needed

  // Update fight counters
  const fight = await Fight.findByPk(bet.fightId, { transaction: t });
  if (fight) {
    fight.totalBets += 1; // Only increment by 1 since it's one matched bet pair
    fight.totalAmount += bet.amount + oppositeBet.amount;
    await fight.save({ transaction: t });

    // Update event counters
    const event = await Event.findByPk(fight.eventId, { transaction: t });
    if (event) {
      event.totalBets += 1; // Only increment by 1 since it's one matched bet pair
      event.totalPrizePool += bet.amount + oppositeBet.amount;
      await event.save({ transaction: t });
    }
  }

  // Create transactions for both bets
  await Transaction.create(
    {
      walletId: bettorWallet.id,
      type: "bet-loss", // Amount is frozen initially
      amount: bet.amount,
      status: "pending",
      description: `Auto-matched bet on fight ${fight?.number}`,
      metadata: {
        betId: bet.id,
        fightId: bet.fightId,
        matchedBetId: oppositeBet.id,
      },
    },
    { transaction: t }
  );

  await Transaction.create(
    {
      walletId: oppositeWallet.id,
      type: "bet-loss", // Amount is frozen initially
      amount: oppositeBet.amount,
      status: "pending",
      description: `Auto-matched bet on fight ${fight?.number}`,
      metadata: {
        betId: oppositeBet.id,
        fightId: oppositeBet.fightId,
        matchedBetId: bet.id,
      },
    },
    { transaction: t }
  );

  // Emit WebSocket event
  if (io) {
    io.to(`event_${fight?.eventId}`).emit("bet_matched", {
      offerBet: bet.toPublicJSON(),
      acceptBet: oppositeBet.toPublicJSON(),
      fightId: bet.fightId,
    });
  }

  return { bet, oppositeBet };
}

// POST /api/bets - Crear nueva apuesta (enhanced with auto-match)
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
    body("betType")
      .optional()
      .isIn(["flat", "doy"])
      .withMessage("betType must be flat or doy"),
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

    const { fightId, side, amount, betType = 'flat', ratio = 2.0, isOffer = true, terms } = req.body;

    try {
      // Use BetService to handle the core business logic
      const bet = await BetService.createBet({
        fightId,
        userId: req.user!.id,
        side,
        amount,
        betType,
        ratio,
        isOffer,
        terms
      });

      // Try to auto-match for flat bets using BetService
      const io = req.app.get("io");
      const matchedBets = await BetService.autoMatchFlatBet(bet, io);

      if (matchedBets) {
        res.status(201).json({
          success: true,
          message: "Bet created and auto-matched successfully",
          data: {
            yourBet: matchedBets.bet.toPublicJSON(),
            matchedBet: matchedBets.oppositeBet.toPublicJSON(),
          },
        });
      } else {
        res.status(201).json({
          success: true,
          message: "Bet created successfully",
          data: bet.toPublicJSON(),
        });
      }
    } catch (error) {
      console.error("Error creating bet:", error);
      throw error;
    }
  })
);

// POST /api/bets/:id/accept - Aceptar una apuesta existente
// POST /api/bets/:id/accept - Accept an existing bet
router.post(
  "/:id/accept",
  authenticate,
  injectCommissionSettings,
  asyncHandler(async (req, res) => {
    try {
      // Use BetService to handle the acceptance logic
      const io = req.app.get("io");
      const result = await BetService.acceptBet(req.params.id, req.user!.id, io);

      res.json({
        success: true,
        message: "Bet accepted successfully",
        data: {
          yourBet: result.yourBet.toPublicJSON(),
          matchedBet: result.matchedBet.toPublicJSON(),
        },
      });
    } catch (error) {
      console.error("Error accepting bet:", error);
      throw error;
    }
  })
);

// PUT /api/bets/:id/cancel - Cancelar apuesta pendiente
router.put(
  "/:id/cancel",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      // Use BetService to handle the cancellation logic
      const io = req.app.get("io");
      const cancelledBet = await BetService.cancelBet(req.params.id, req.user!.id, io);

      res.json({
        success: true,
        message: "Bet cancelled successfully",
        data: cancelledBet.toPublicJSON(),
      });
    } catch (error) {
      console.error("Error cancelling bet:", error);
      throw error;
    }
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

    try {
      // Use BetService to handle the PAGO proposal logic
      const io = req.app.get("io");
      const pagoBet = await BetService.proposePago({
        betId: req.params.id,
        userId: req.user!.id,
        pagoAmount
      }, io);

      res.status(201).json({
        success: true,
        message: "PAGO proposal created",
        data: pagoBet.toPublicJSON(),
      });
    } catch (error) {
      console.error("Error proposing PAGO:", error);
      throw error;
    }
  })
);

// PUT /api/bets/:id/accept-pago - Aceptar una propuesta de PAGO
router.put(
  "/:id/accept-pago",
  authenticate,
  authorize("user", "admin"),
  asyncHandler(async (req, res) => {
    try {
      // Use BetService to handle the PAGO acceptance logic
      const io = req.app.get("io");
      const originalBet = await BetService.acceptPago(req.params.id, req.user!.id, io);

      res.json({
        success: true,
        message: "PAGO proposal accepted",
        data: {
          originalBet: originalBet.toPublicJSON(),
        },
      });
    } catch (error) {
      console.error("Error accepting PAGO:", error);
      throw error;
    }
  })
);

// PUT /api/bets/:id/reject-pago - Rechazar una propuesta de PAGO
router.put(
  "/:id/reject-pago",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      // Use BetService to handle the PAGO rejection logic
      const io = req.app.get("io");
      const result = await BetService.rejectPago(req.params.id, req.user!.id, io);

      res.json({
        success: true,
        message: "PAGO proposal rejected",
        data: result
      });
    } catch (error) {
      console.error("Error rejecting PAGO:", error);
      throw error;
    }
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
