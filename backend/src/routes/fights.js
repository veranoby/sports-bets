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
const router = (0, express_1.Router)();
// GET /api/fights - Listar peleas con filtros
router.get("/", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId, status } = req.query;
    const where = {};
    if (eventId)
        where.eventId = eventId;
    if (status)
        where.status = status;
    const fights = yield models_1.Fight.findAll({
        where,
        include: [
            {
                model: models_1.Event,
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
})));
// GET /api/fights/:id - Obtener pelea específica
router.get("/:id", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fight = yield models_1.Fight.findByPk(req.params.id, {
        include: [
            { model: models_1.Event, as: "event" },
            {
                model: models_1.Bet,
                as: "bets",
                include: [
                    { model: models_1.User, as: "user", attributes: ["id", "username"] },
                ],
            },
        ],
    });
    if (!fight) {
        throw errorHandler_1.errors.notFound("Fight not found");
    }
    const fightData = fight.toJSON();
    const operatorId = (_a = fightData.event) === null || _a === void 0 ? void 0 : _a.operatorId;
    res.json({
        success: true,
        data: {
            fight: fightData,
            operatorId,
        },
    });
})));
// POST /api/fights - Crear nueva pelea (operador)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID is required"),
    (0, express_validator_1.body)("number")
        .isInt({ min: 1, max: 999 })
        .withMessage("Fight number must be between 1 and 999"),
    (0, express_validator_1.body)("redCorner")
        .isLength({ min: 2, max: 255 })
        .withMessage("Red corner name must be between 2 and 255 characters"),
    (0, express_validator_1.body)("blueCorner")
        .isLength({ min: 2, max: 255 })
        .withMessage("Blue corner name must be between 2 and 255 characters"),
    (0, express_validator_1.body)("weight")
        .isFloat({ min: 1.0, max: 10.0 })
        .withMessage("Weight must be between 1.0 and 10.0"),
    (0, express_validator_1.body)("notes")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Notes must not exceed 1000 characters"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { eventId, number, redCorner, blueCorner, weight, notes } = req.body;
    // Verificar que el evento existe
    const event = yield models_1.Event.findByPk(eventId);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    // Verificar permisos del operador
    const eventData = event.toJSON();
    if (req.user.role === "operator" && eventData.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que no existe una pelea con el mismo número en el evento
    const existingFight = yield models_1.Fight.findOne({
        where: { eventId, number },
    });
    if (existingFight) {
        throw errorHandler_1.errors.conflict("A fight with this number already exists in the event");
    }
    // Verificar que los criaderos son diferentes
    if (redCorner.toLowerCase() === blueCorner.toLowerCase()) {
        throw errorHandler_1.errors.badRequest("Red and blue corners cannot be the same");
    }
    // Crear pelea
    const fight = yield models_1.Fight.create({
        eventId,
        number,
        redCorner,
        blueCorner,
        weight,
        notes,
    });
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
})));
// PUT /api/fights/:id - Actualizar pelea (operador)
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), [
    (0, express_validator_1.body)("redCorner")
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage("Red corner name must be between 2 and 255 characters"),
    (0, express_validator_1.body)("blueCorner")
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage("Blue corner name must be between 2 and 255 characters"),
    (0, express_validator_1.body)("weight")
        .optional()
        .isFloat({ min: 1.0, max: 10.0 })
        .withMessage("Weight must be between 1.0 and 10.0"),
    (0, express_validator_1.body)("notes")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Notes must not exceed 1000 characters"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["upcoming", "betting", "live", "completed", "cancelled"])
        .withMessage("Invalid status"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const fight = yield models_1.Fight.findByPk(req.params.id, {
        include: [
            {
                model: models_1.Event,
                as: "event",
            },
        ],
    });
    if (!fight) {
        throw errorHandler_1.errors.notFound("Fight not found");
    }
    // Verificar permisos del operador
    const fightData = fight.toJSON();
    if (req.user.role === "operator" &&
        fightData.event &&
        fightData.event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar si la pelea puede ser editada
    if (fight.status === "completed") {
        throw errorHandler_1.errors.badRequest("Completed fights cannot be edited");
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
            fight[field] = req.body[field];
        }
    });
    // Verificar que los criaderos siguen siendo diferentes
    if (fight.redCorner.toLowerCase() === fight.blueCorner.toLowerCase()) {
        throw errorHandler_1.errors.badRequest("Red and blue corners cannot be the same");
    }
    yield fight.save();
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
})));
// POST /api/fights/:id/open-betting - Abrir apuestas para una pelea
router.post("/:id/open-betting", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fight = yield models_1.Fight.findByPk(req.params.id, {
        include: [
            {
                model: models_1.Event,
                as: "event",
            },
        ],
    });
    if (!fight) {
        throw errorHandler_1.errors.notFound("Fight not found");
    }
    // Verificar permisos del operador
    const fightData = fight.toJSON();
    if (req.user.role === "operator" &&
        fightData.event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que la pelea puede abrir apuestas
    if (fight.status !== "upcoming") {
        throw errorHandler_1.errors.badRequest("Betting can only be opened for upcoming fights");
    }
    // Abrir apuestas
    fight.status = "betting";
    yield fight.save();
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
})));
// POST /api/fights/:id/close-betting - Cerrar apuestas para una pelea
router.post("/:id/close-betting", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fight = yield models_1.Fight.findByPk(req.params.id, {
        include: [
            {
                model: models_1.Event,
                as: "event",
            },
        ],
    });
    if (!fight) {
        throw errorHandler_1.errors.notFound("Fight not found");
    }
    // Verificar permisos del operador
    const fightData = fight.toJSON();
    if (req.user.role === "operator" &&
        fightData.event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que las apuestas están abiertas
    if (fight.status !== "betting") {
        throw errorHandler_1.errors.badRequest("Betting is not currently open for this fight");
    }
    // Cerrar apuestas y pasar a en vivo
    fight.status = "live";
    fight.startTime = new Date();
    yield fight.save();
    // Activar apuestas pendientes
    yield models_1.Bet.update({ status: "active" }, {
        where: {
            fightId: fight.id,
            status: "pending",
        },
    });
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
})));
// POST /api/fights/:id/result - Registrar resultado de pelea
router.post("/:id/result", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), [
    (0, express_validator_1.body)("result")
        .isIn(["red", "blue", "draw", "cancelled"])
        .withMessage("Result must be red, blue, draw, or cancelled"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { result } = req.body;
    const fight = yield models_1.Fight.findByPk(req.params.id, {
        include: [
            {
                model: models_1.Event,
                as: "event",
            },
            {
                model: models_1.Bet,
                as: "bets",
                where: { status: "active" },
                required: false,
            },
        ],
    });
    if (!fight) {
        throw errorHandler_1.errors.notFound("Fight not found");
    }
    // Verificar permisos del operador
    const fightData = fight.toJSON();
    if (req.user.role === "operator" &&
        fightData.event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que la pelea está en vivo
    if (fight.status !== "live") {
        throw errorHandler_1.errors.badRequest("Can only record results for live fights");
    }
    // Completar pelea
    fight.status = "completed";
    fight.result = result;
    fight.endTime = new Date();
    yield fight.save();
    // Procesar resultados de apuestas
    const bets = fightData.bets || [];
    if (bets.length > 0) {
        for (const betData of bets) {
            const bet = yield models_1.Bet.findByPk(betData.id);
            if (!bet)
                continue;
            let betResult = "loss";
            if (result === "cancelled") {
                betResult = "cancelled";
            }
            else if (result === "draw") {
                betResult = "draw";
            }
            else if ((result === "red" && bet.side === "red") ||
                (result === "blue" && bet.side === "blue")) {
                betResult = "win";
            }
            bet.result = betResult;
            bet.status = "completed";
            yield bet.save();
            // Actualizar wallet del usuario
            const { Wallet, Transaction } = require("../models/Wallet");
            const wallet = yield Wallet.findOne({
                where: { userId: bet.userId },
            });
            if (wallet) {
                // Liberar cantidad congelada
                wallet.frozenAmount -= bet.amount;
                // Si ganó, agregar ganancia
                if (betResult === "win") {
                    wallet.balance += bet.potentialWin;
                }
                else if (betResult === "cancelled" || betResult === "draw") {
                    // Devolver apuesta original
                    wallet.balance += bet.amount;
                }
                yield wallet.save();
                // Crear transacción
                yield Transaction.create({
                    walletId: wallet.userId,
                    type: betResult === "win"
                        ? "bet-win"
                        : betResult === "cancelled" || betResult === "draw"
                            ? "bet-refund"
                            : "bet-loss",
                    amount: betResult === "win"
                        ? bet.potentialWin
                        : betResult === "cancelled" || betResult === "draw"
                            ? bet.amount
                            : bet.amount,
                    status: "completed",
                    description: `${betResult === "win"
                        ? "Won"
                        : betResult === "cancelled" || betResult === "draw"
                            ? "Refund for"
                            : "Lost"} bet on fight ${fight.number}`,
                    metadata: {
                        fightId: fight.id,
                        betId: bet.id,
                        result: result,
                    },
                });
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
})));
exports.default = router;
