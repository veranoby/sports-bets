"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// GET /api/bets - Listar apuestas del usuario
router.get("/", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, fightId, eventId, limit = 20, offset = 0 } = req.query;
    const where = { userId: req.user.id };
    if (status)
        where.status = status;
    if (fightId)
        where.fightId = fightId;
    const bets = yield models_1.Bet.findAndCountAll({
        where,
        include: [
            {
                model: models_1.Fight,
                as: "fight",
                include: [
                    {
                        model: models_1.Event,
                        as: "event",
                        where: eventId ? { id: eventId } : {},
                    },
                ],
            },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
    res.json({
        success: true,
        data: {
            bets: bets.rows.map((bet) => bet.toPublicJSON()),
            total: bets.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
})));
// GET /api/bets/available/:fightId - Obtener apuestas disponibles para aceptar
router.get("/available/:fightId", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fight = yield models_1.Fight.findByPk(req.params.fightId);
    if (!fight) {
        throw errorHandler_1.errors.notFound("Fight not found");
    }
    if (!fight.canAcceptBets()) {
        throw errorHandler_1.errors.badRequest("Betting is not open for this fight");
    }
    // Buscar apuestas pendientes que el usuario puede aceptar
    const availableBets = yield models_1.Bet.findAll({
        where: {
            fightId: req.params.fightId,
            status: "pending",
            userId: { [sequelize_1.Op.ne]: req.user.id }, // No mostrar propias apuestas
            matchedWith: null,
            terms: {
                isOffer: true,
            },
        },
        include: [
            {
                model: models_1.User,
                as: "user",
                attributes: ["id", "username"],
            },
        ],
        order: [["createdAt", "DESC"]],
    });
    res.json({
        success: true,
        data: availableBets.map((bet) => bet.toPublicJSON()),
    });
})));
// POST /api/bets - Crear nueva apuesta
router.post("/", auth_1.authenticate, [
    (0, express_validator_1.body)("fightId").isUUID().withMessage("Valid fight ID is required"),
    (0, express_validator_1.body)("side").isIn(["red", "blue"]).withMessage("Side must be red or blue"),
    (0, express_validator_1.body)("amount")
        .isFloat({ min: 10, max: 10000 })
        .withMessage("Amount must be between 10 and 10000"),
    (0, express_validator_1.body)("ratio")
        .optional()
        .isFloat({ min: 1.01, max: 100 })
        .withMessage("Ratio must be between 1.01 and 100"),
    (0, express_validator_1.body)("isOffer")
        .optional()
        .isBoolean()
        .withMessage("isOffer must be a boolean"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { fightId, side, amount, ratio = 2.0, isOffer = true } = req.body;
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Verificar pelea
        const fight = yield models_1.Fight.findByPk(fightId, {
            include: [{ model: models_1.Event, as: "event" }],
            transaction: t,
        });
        if (!fight) {
            throw errorHandler_1.errors.notFound("Fight not found");
        }
        if (!fight.canAcceptBets()) {
            throw errorHandler_1.errors.badRequest("Betting is not open for this fight");
        }
        // Verificar si el usuario ya tiene una apuesta en esta pelea
        const existingBet = yield models_1.Bet.findOne({
            where: {
                fightId,
                userId: req.user.id,
            },
            transaction: t,
        });
        if (existingBet) {
            throw errorHandler_1.errors.conflict("You already have a bet on this fight");
        }
        // Verificar wallet del usuario
        const wallet = yield models_1.Wallet.findOne({
            where: { userId: req.user.id },
            transaction: t,
        });
        if (!wallet) {
            throw errorHandler_1.errors.notFound("Wallet not found");
        }
        if (!wallet.canBet(amount)) {
            throw errorHandler_1.errors.badRequest("Insufficient available balance");
        }
        // Calcular ganancia potencial
        const potentialWin = amount * ratio;
        // Crear apuesta
        const bet = yield models_1.Bet.create({
            fightId,
            userId: req.user.id,
            side,
            amount,
            potentialWin,
            status: "pending",
            terms: {
                ratio,
                isOffer,
            },
        }, { transaction: t });
        // Congelar fondos
        yield wallet.freezeAmount(amount);
        yield wallet.save({ transaction: t });
        // Actualizar contadores en Fight
        fight.totalBets += 1;
        fight.totalAmount += amount;
        yield fight.save({ transaction: t });
        // Actualizar contadores en Event
        const event = yield models_1.Event.findByPk(fight.eventId, { transaction: t });
        if (event) {
            event.totalBets += 1;
            event.totalPrizePool += amount;
            yield event.save({ transaction: t });
        }
        // Crear transacción de apuesta
        yield models_1.Transaction.create({
            walletId: wallet.id,
            type: "bet-loss", // Se marca como pérdida inicialmente
            amount: amount,
            status: "pending",
            description: `Bet placed on fight ${fight.number}`,
            metadata: {
                betId: bet.id,
                fightId: fight.id,
            },
        }, { transaction: t });
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
    }));
})));
// POST /api/bets/:id/accept - Aceptar una apuesta existente
router.post("/:id/accept", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        // Buscar la apuesta a aceptar
        const offerBet = yield models_1.Bet.findByPk(req.params.id, {
            include: [
                { model: models_1.Fight, as: "fight" },
                { model: models_1.User, as: "user" },
            ],
            transaction: t,
        });
        if (!offerBet) {
            throw errorHandler_1.errors.notFound("Bet not found");
        }
        if (!offerBet.canBeMatched()) {
            throw errorHandler_1.errors.badRequest("This bet cannot be accepted");
        }
        if (offerBet.userId === req.user.id) {
            throw errorHandler_1.errors.badRequest("You cannot accept your own bet");
        }
        const fight = yield offerBet.getFight();
        if (!fight.canAcceptBets()) {
            throw errorHandler_1.errors.badRequest("Betting is closed for this fight");
        }
        // Verificar si el usuario ya tiene una apuesta en esta pelea
        const existingBet = yield models_1.Bet.findOne({
            where: {
                fightId: fight.id,
                userId: req.user.id,
            },
            transaction: t,
        });
        if (existingBet) {
            throw errorHandler_1.errors.conflict("You already have a bet on this fight");
        }
        // Verificar wallet del usuario
        const wallet = yield models_1.Wallet.findOne({
            where: { userId: req.user.id },
            transaction: t,
        });
        if (!wallet) {
            throw errorHandler_1.errors.notFound("Wallet not found");
        }
        // Calcular el monto necesario basado en el ratio
        const requiredAmount = offerBet.amount / (((_a = offerBet.terms) === null || _a === void 0 ? void 0 : _a.ratio) || 2.0);
        if (!wallet.canBet(requiredAmount)) {
            throw errorHandler_1.errors.badRequest("Insufficient available balance");
        }
        // Crear apuesta complementaria
        const acceptBet = yield models_1.Bet.create({
            fightId: fight.id,
            userId: req.user.id,
            side: offerBet.side === "red" ? "blue" : "red", // Lado opuesto
            amount: requiredAmount,
            potentialWin: offerBet.amount + requiredAmount,
            status: "active",
            matchedWith: offerBet.id,
            terms: {
                ratio: 1 / (((_b = offerBet.terms) === null || _b === void 0 ? void 0 : _b.ratio) || 2.0),
                isOffer: false,
            },
        }, { transaction: t });
        // Actualizar apuesta original
        offerBet.status = "active";
        offerBet.matchedWith = acceptBet.id;
        yield offerBet.save({ transaction: t });
        // Congelar fondos del aceptante
        yield wallet.freezeAmount(requiredAmount);
        yield wallet.save({ transaction: t });
        // Actualizar contadores
        fight.totalBets += 1;
        fight.totalAmount += requiredAmount;
        yield fight.save({ transaction: t });
        const event = yield models_1.Event.findByPk(fight.eventId, { transaction: t });
        if (event) {
            event.totalBets += 1;
            event.totalPrizePool += requiredAmount;
            yield event.save({ transaction: t });
        }
        // Crear transacción
        yield models_1.Transaction.create({
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
        }, { transaction: t });
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
    }));
})));
// PUT /api/bets/:id/cancel - Cancelar apuesta pendiente
router.put("/:id/cancel", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        const bet = yield models_1.Bet.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
            include: [{ model: models_1.Fight, as: "fight" }],
            transaction: t,
        });
        if (!bet) {
            throw errorHandler_1.errors.notFound("Bet not found");
        }
        if (bet.status !== "pending") {
            throw errorHandler_1.errors.badRequest("Only pending bets can be cancelled");
        }
        // Cancelar apuesta
        bet.status = "cancelled";
        yield bet.save({ transaction: t });
        // Liberar fondos congelados
        const wallet = yield models_1.Wallet.findOne({
            where: { userId: req.user.id },
            transaction: t,
        });
        if (wallet) {
            yield wallet.unfreezeAmount(bet.amount);
            wallet.balance += bet.amount;
            yield wallet.save({ transaction: t });
            // Crear transacción de reembolso
            const fight = yield bet.getFight();
            yield models_1.Transaction.create({
                walletId: wallet.id,
                type: "bet-refund",
                amount: bet.amount,
                status: "completed",
                description: `Refund for cancelled bet on fight ${fight.number}`,
                metadata: {
                    betId: bet.id,
                    fightId: fight.id,
                },
            }, { transaction: t });
        }
        // Actualizar contadores
        const fight = yield models_1.Fight.findByPk(bet.fightId, { transaction: t });
        if (fight) {
            fight.totalBets -= 1;
            fight.totalAmount -= bet.amount;
            yield fight.save({ transaction: t });
            const event = yield models_1.Event.findByPk(fight.eventId, { transaction: t });
            if (event) {
                event.totalBets -= 1;
                event.totalPrizePool -= bet.amount;
                yield event.save({ transaction: t });
            }
        }
        res.json({
            success: true,
            message: "Bet cancelled successfully",
            data: bet.toPublicJSON(),
        });
    }));
})));
// GET /api/bets/stats - Estadísticas de apuestas del usuario
router.get("/stats", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const [totalBets, wonBets, lostBets, totalWon, totalLost] = yield Promise.all([
        models_1.Bet.count({ where: { userId, status: "completed" } }),
        models_1.Bet.count({ where: { userId, status: "completed", result: "win" } }),
        models_1.Bet.count({ where: { userId, status: "completed", result: "loss" } }),
        models_1.Bet.sum("potentialWin", { where: { userId, result: "win" } }) || 0,
        models_1.Bet.sum("amount", { where: { userId, result: "loss" } }) || 0,
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
})));
exports.default = router;
