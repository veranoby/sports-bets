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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var models_1 = require("../models");
var express_validator_1 = require("express-validator");
var database_1 = require("../config/database");
var sequelize_1 = require("sequelize");
var settingsMiddleware_1 = require("../middleware/settingsMiddleware");
var router = (0, express_1.Router)();
// 🔐 ADMIN ENDPOINT: Get all bets (must be BEFORE role restriction middleware)
router.get("/all", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, status, fightId, eventId, dateFrom, dateTo, _b, page, _c, limit, offset, where, _d, bets, total;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _a = req.query, userId = _a.userId, status = _a.status, fightId = _a.fightId, eventId = _a.eventId, dateFrom = _a.dateFrom, dateTo = _a.dateTo, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c;
                offset = (Number(page) - 1) * Number(limit);
                where = {};
                if (userId)
                    where.userId = userId;
                if (status)
                    where.status = status;
                if (fightId)
                    where.fightId = fightId;
                if (dateFrom || dateTo) {
                    where.createdAt = {};
                    if (dateFrom)
                        where.createdAt[sequelize_1.Op.gte] = new Date(dateFrom);
                    if (dateTo)
                        where.createdAt[sequelize_1.Op.lte] = new Date(dateTo);
                }
                return [4 /*yield*/, models_1.Bet.findAndCountAll({
                        where: where,
                        include: [
                            {
                                model: models_1.Fight,
                                as: "fight",
                                include: [
                                    {
                                        model: models_1.Event,
                                        as: "event",
                                        where: eventId ? { id: eventId } : {},
                                        attributes: ['id', 'title', 'status', 'scheduledDate'],
                                    },
                                ],
                                attributes: ['id', 'number', 'status', 'redCorner', 'blueCorner', 'eventId'],
                            },
                            {
                                model: models_1.User,
                                as: "user",
                                attributes: ['id', 'username', 'email', 'role'],
                            },
                        ],
                        limit: Number(limit),
                        offset: Number(offset),
                        order: [['createdAt', 'DESC']],
                    })];
            case 1:
                _d = _e.sent(), bets = _d.rows, total = _d.count;
                res.json({
                    success: true,
                    data: {
                        bets: bets,
                        total: total,
                        page: Number(page),
                        totalPages: Math.ceil(total / Number(limit)),
                        offset: Number(offset),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// Apply betting feature gate to all routes below (excludes admin endpoint above)
router.use(settingsMiddleware_1.requireBetting);
// 🔒 ROLE RESTRICTION: Only 'user' and 'gallera' roles can access betting
router.use(function (req, res, next) {
    var _a;
    if (!['user', 'gallera'].includes(((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || '')) {
        return res.status(403).json({
            success: false,
            error: 'Betting access denied',
            message: 'Your role cannot place bets'
        });
    }
    next();
});
// GET /api/bets - Listar apuestas del usuario
router.get("/", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status, fightId, eventId, _b, limit, _c, offset, where, cacheKey, bets;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = req.query, status = _a.status, fightId = _a.fightId, eventId = _a.eventId, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                where = { userId: req.user.id };
                if (status)
                    where.status = status;
                if (fightId)
                    where.fightId = fightId;
                cacheKey = "user_bets_".concat(req.user.id, "_").concat(status || 'all', "_").concat(eventId || 'all', "_").concat(limit, "_").concat(offset);
                return [4 /*yield*/, (0, database_1.retryOperation)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, models_1.Bet.findAndCountAll({
                                                        where: where,
                                                        include: [
                                                            {
                                                                model: models_1.Fight,
                                                                as: "fight",
                                                                separate: false,
                                                                include: [
                                                                    {
                                                                        model: models_1.Event,
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
                                                        limit: parseInt(limit),
                                                        offset: parseInt(offset),
                                                    })];
                                                case 1: return [2 /*return*/, _a.sent()];
                                            }
                                        });
                                    }); }, 60)];
                                case 1: return [2 /*return*/, _a.sent()]; // Cache for 1 minute
                            }
                        });
                    }); })];
            case 1:
                bets = _d.sent();
                res.json({
                    success: true,
                    data: {
                        bets: bets.rows.map(function (bet) { return bet.toPublicJSON(); }),
                        total: bets.count,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/bets/available/:fightId - Obtener apuestas disponibles para aceptar
router.get("/available/:fightId", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fight, cacheKey, availableBets;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.fightId, {
                    include: [
                        {
                            model: models_1.Event,
                            as: "event",
                            attributes: ['id', 'status', 'scheduledDate'] // Only needed fields for canAcceptBets()
                        }
                    ]
                })];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                if (!fight.canAcceptBets()) {
                    throw errorHandler_1.errors.badRequest("Betting is not open for this fight");
                }
                cacheKey = "available_bets_".concat(req.params.fightId, "_").concat(req.user.id);
                return [4 /*yield*/, (0, database_1.retryOperation)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0: return [4 /*yield*/, models_1.Bet.findAll({
                                                        where: {
                                                            fightId: req.params.fightId,
                                                            status: "pending",
                                                            userId: (_a = {}, _a[sequelize_1.Op.ne] = req.user.id, _a), // No mostrar propias apuestas
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
                                                    })];
                                                case 1: return [2 /*return*/, _b.sent()];
                                            }
                                        });
                                    }); }, 30)];
                                case 1: return [2 /*return*/, _a.sent()]; // Cache for 30 seconds
                            }
                        });
                    }); })];
            case 2:
                availableBets = _a.sent();
                res.json({
                    success: true,
                    data: availableBets.map(function (bet) { return bet.toPublicJSON(); }),
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/bets - Crear nueva apuesta
router.post("/", auth_1.authenticate, settingsMiddleware_1.enforceBetLimits, settingsMiddleware_1.injectCommissionSettings, [
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
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, fightId, side, amount, _b, ratio, _c, isOffer;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, fightId = _a.fightId, side = _a.side, amount = _a.amount, _b = _a.ratio, ratio = _b === void 0 ? 2.0 : _b, _c = _a.isOffer, isOffer = _c === void 0 ? true : _c;
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var fight, existingBet, wallet, potentialWin, bet, event, io;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Fight.findByPk(fightId, {
                                        include: [{ model: models_1.Event, as: "event" }],
                                        transaction: t,
                                    })];
                                case 1:
                                    fight = _a.sent();
                                    if (!fight) {
                                        throw errorHandler_1.errors.notFound("Fight not found");
                                    }
                                    if (!fight.canAcceptBets()) {
                                        throw errorHandler_1.errors.badRequest("Betting is not open for this fight");
                                    }
                                    return [4 /*yield*/, models_1.Bet.findOne({
                                            where: {
                                                fightId: fightId,
                                                userId: req.user.id,
                                            },
                                            transaction: t,
                                        })];
                                case 2:
                                    existingBet = _a.sent();
                                    if (existingBet) {
                                        throw errorHandler_1.errors.conflict("You already have a bet on this fight");
                                    }
                                    return [4 /*yield*/, models_1.Wallet.findOne({
                                            where: { userId: req.user.id },
                                            transaction: t,
                                        })];
                                case 3:
                                    wallet = _a.sent();
                                    if (!wallet) {
                                        throw errorHandler_1.errors.notFound("Wallet not found");
                                    }
                                    if (!wallet.canBet(amount)) {
                                        throw errorHandler_1.errors.badRequest("Insufficient available balance");
                                    }
                                    potentialWin = amount * ratio;
                                    return [4 /*yield*/, models_1.Bet.create({
                                            fightId: fightId,
                                            userId: req.user.id,
                                            side: side,
                                            amount: amount,
                                            potentialWin: potentialWin,
                                            status: "pending",
                                            terms: {
                                                ratio: ratio,
                                                isOffer: isOffer,
                                            },
                                        }, { transaction: t })];
                                case 4:
                                    bet = _a.sent();
                                    // Congelar fondos
                                    return [4 /*yield*/, wallet.freezeAmount(amount)];
                                case 5:
                                    // Congelar fondos
                                    _a.sent();
                                    return [4 /*yield*/, wallet.save({ transaction: t })];
                                case 6:
                                    _a.sent();
                                    // Actualizar contadores en Fight
                                    fight.totalBets += 1;
                                    fight.totalAmount += amount;
                                    return [4 /*yield*/, fight.save({ transaction: t })];
                                case 7:
                                    _a.sent();
                                    return [4 /*yield*/, models_1.Event.findByPk(fight.eventId, { transaction: t })];
                                case 8:
                                    event = _a.sent();
                                    if (!event) return [3 /*break*/, 10];
                                    event.totalBets += 1;
                                    event.totalPrizePool += amount;
                                    return [4 /*yield*/, event.save({ transaction: t })];
                                case 9:
                                    _a.sent();
                                    _a.label = 10;
                                case 10: 
                                // Crear transacción de apuesta
                                return [4 /*yield*/, models_1.Transaction.create({
                                        walletId: wallet.id,
                                        type: "bet-loss", // Se marca como pérdida inicialmente
                                        amount: amount,
                                        status: "pending",
                                        description: "Bet placed on fight ".concat(fight.number),
                                        metadata: {
                                            betId: bet.id,
                                            fightId: fight.id,
                                        },
                                    }, { transaction: t })];
                                case 11:
                                    // Crear transacción de apuesta
                                    _a.sent();
                                    io = req.app.get("io");
                                    if (io) {
                                        io.to("event_".concat(fight.eventId)).emit("new_bet", {
                                            bet: bet.toPublicJSON(),
                                            fightId: fight.id,
                                        });
                                    }
                                    res.status(201).json({
                                        success: true,
                                        message: "Bet created successfully",
                                        data: bet.toPublicJSON(),
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                _d.sent();
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/bets/:id/accept - Aceptar una apuesta existente
router.post("/:id/accept", auth_1.authenticate, settingsMiddleware_1.injectCommissionSettings, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                    var offerBet, fight, existingBet, wallet, requiredAmount, acceptBet, event, io;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, models_1.Bet.findByPk(req.params.id, {
                                    include: [
                                        { model: models_1.Fight, as: "fight" },
                                        { model: models_1.User, as: "user" },
                                    ],
                                    transaction: t,
                                })];
                            case 1:
                                offerBet = _c.sent();
                                if (!offerBet) {
                                    throw errorHandler_1.errors.notFound("Bet not found");
                                }
                                if (!offerBet.canBeMatched()) {
                                    throw errorHandler_1.errors.badRequest("This bet cannot be accepted");
                                }
                                if (offerBet.userId === req.user.id) {
                                    throw errorHandler_1.errors.badRequest("You cannot accept your own bet");
                                }
                                return [4 /*yield*/, offerBet.getFight()];
                            case 2:
                                fight = _c.sent();
                                if (!fight.canAcceptBets()) {
                                    throw errorHandler_1.errors.badRequest("Betting is closed for this fight");
                                }
                                return [4 /*yield*/, models_1.Bet.findOne({
                                        where: {
                                            fightId: fight.id,
                                            userId: req.user.id,
                                        },
                                        transaction: t,
                                    })];
                            case 3:
                                existingBet = _c.sent();
                                if (existingBet) {
                                    throw errorHandler_1.errors.conflict("You already have a bet on this fight");
                                }
                                return [4 /*yield*/, models_1.Wallet.findOne({
                                        where: { userId: req.user.id },
                                        transaction: t,
                                    })];
                            case 4:
                                wallet = _c.sent();
                                if (!wallet) {
                                    throw errorHandler_1.errors.notFound("Wallet not found");
                                }
                                requiredAmount = offerBet.amount / (((_a = offerBet.terms) === null || _a === void 0 ? void 0 : _a.ratio) || 2.0);
                                if (!wallet.canBet(requiredAmount)) {
                                    throw errorHandler_1.errors.badRequest("Insufficient available balance");
                                }
                                return [4 /*yield*/, models_1.Bet.create({
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
                                    }, { transaction: t })];
                            case 5:
                                acceptBet = _c.sent();
                                // Actualizar apuesta original
                                offerBet.status = "active";
                                offerBet.matchedWith = acceptBet.id;
                                return [4 /*yield*/, offerBet.save({ transaction: t })];
                            case 6:
                                _c.sent();
                                // Congelar fondos del aceptante
                                return [4 /*yield*/, wallet.freezeAmount(requiredAmount)];
                            case 7:
                                // Congelar fondos del aceptante
                                _c.sent();
                                return [4 /*yield*/, wallet.save({ transaction: t })];
                            case 8:
                                _c.sent();
                                // Actualizar contadores
                                fight.totalBets += 1;
                                fight.totalAmount += requiredAmount;
                                return [4 /*yield*/, fight.save({ transaction: t })];
                            case 9:
                                _c.sent();
                                return [4 /*yield*/, models_1.Event.findByPk(fight.eventId, { transaction: t })];
                            case 10:
                                event = _c.sent();
                                if (!event) return [3 /*break*/, 12];
                                event.totalBets += 1;
                                event.totalPrizePool += requiredAmount;
                                return [4 /*yield*/, event.save({ transaction: t })];
                            case 11:
                                _c.sent();
                                _c.label = 12;
                            case 12: 
                            // Crear transacción
                            return [4 /*yield*/, models_1.Transaction.create({
                                    walletId: wallet.id,
                                    type: "bet-loss",
                                    amount: requiredAmount,
                                    status: "pending",
                                    description: "Bet accepted on fight ".concat(fight.number),
                                    metadata: {
                                        betId: acceptBet.id,
                                        matchedBetId: offerBet.id,
                                        fightId: fight.id,
                                    },
                                }, { transaction: t })];
                            case 13:
                                // Crear transacción
                                _c.sent();
                                io = req.app.get("io");
                                if (io) {
                                    io.to("event_".concat(fight.eventId)).emit("bet_matched", {
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
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/bets/:id/cancel - Cancelar apuesta pendiente
router.put("/:id/cancel", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                    var bet, wallet, fight_1, fight, event_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, models_1.Bet.findOne({
                                    where: {
                                        id: req.params.id,
                                        userId: req.user.id,
                                    },
                                    include: [{ model: models_1.Fight, as: "fight" }],
                                    transaction: t,
                                })];
                            case 1:
                                bet = _a.sent();
                                if (!bet) {
                                    throw errorHandler_1.errors.notFound("Bet not found");
                                }
                                if (bet.status !== "pending") {
                                    throw errorHandler_1.errors.badRequest("Only pending bets can be cancelled");
                                }
                                // Cancelar apuesta
                                bet.status = "cancelled";
                                return [4 /*yield*/, bet.save({ transaction: t })];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, models_1.Wallet.findOne({
                                        where: { userId: req.user.id },
                                        transaction: t,
                                    })];
                            case 3:
                                wallet = _a.sent();
                                if (!wallet) return [3 /*break*/, 8];
                                return [4 /*yield*/, wallet.unfreezeAmount(bet.amount)];
                            case 4:
                                _a.sent();
                                wallet.balance += bet.amount;
                                return [4 /*yield*/, wallet.save({ transaction: t })];
                            case 5:
                                _a.sent();
                                return [4 /*yield*/, bet.getFight()];
                            case 6:
                                fight_1 = _a.sent();
                                return [4 /*yield*/, models_1.Transaction.create({
                                        walletId: wallet.id,
                                        type: "bet-refund",
                                        amount: bet.amount,
                                        status: "completed",
                                        description: "Refund for cancelled bet on fight ".concat(fight_1.number),
                                        metadata: {
                                            betId: bet.id,
                                            fightId: fight_1.id,
                                        },
                                    }, { transaction: t })];
                            case 7:
                                _a.sent();
                                _a.label = 8;
                            case 8: return [4 /*yield*/, models_1.Fight.findByPk(bet.fightId, { transaction: t })];
                            case 9:
                                fight = _a.sent();
                                if (!fight) return [3 /*break*/, 13];
                                fight.totalBets -= 1;
                                fight.totalAmount -= bet.amount;
                                return [4 /*yield*/, fight.save({ transaction: t })];
                            case 10:
                                _a.sent();
                                return [4 /*yield*/, models_1.Event.findByPk(fight.eventId, { transaction: t })];
                            case 11:
                                event_1 = _a.sent();
                                if (!event_1) return [3 /*break*/, 13];
                                event_1.totalBets -= 1;
                                event_1.totalPrizePool -= bet.amount;
                                return [4 /*yield*/, event_1.save({ transaction: t })];
                            case 12:
                                _a.sent();
                                _a.label = 13;
                            case 13:
                                res.json({
                                    success: true,
                                    message: "Bet cancelled successfully",
                                    data: bet.toPublicJSON(),
                                });
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/bets/stats - Estadísticas de apuestas del usuario
router.get("/stats", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, totalBets, wonBets, lostBets, totalWon, totalLost, winRate, netProfit;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.user.id;
                return [4 /*yield*/, Promise.all([
                        models_1.Bet.count({ where: { userId: userId, status: "completed" } }),
                        models_1.Bet.count({ where: { userId: userId, status: "completed", result: "win" } }),
                        models_1.Bet.count({ where: { userId: userId, status: "completed", result: "loss" } }),
                        models_1.Bet.sum("potentialWin", { where: { userId: userId, result: "win" } }) || 0,
                        models_1.Bet.sum("amount", { where: { userId: userId, result: "loss" } }) || 0,
                    ])];
            case 1:
                _a = _b.sent(), totalBets = _a[0], wonBets = _a[1], lostBets = _a[2], totalWon = _a[3], totalLost = _a[4];
                winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
                netProfit = totalWon - totalLost;
                res.json({
                    success: true,
                    data: {
                        totalBets: totalBets,
                        wonBets: wonBets,
                        lostBets: lostBets,
                        winRate: Math.round(winRate * 100) / 100,
                        totalWon: totalWon,
                        totalLost: totalLost,
                        netProfit: netProfit,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/bets/:id/propose-pago - Proponer un PAGO para una apuesta
router.post("/:id/propose-pago", auth_1.authenticate, settingsMiddleware_1.enforceBetLimits, [
    (0, express_validator_1.body)("pagoAmount")
        .isFloat({ min: 0.01, max: 10000 })
        .withMessage("PAGO amount must be between 0.01 and 10000"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var pagoAmount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pagoAmount = req.body.pagoAmount;
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var originalBet, wallet, pagoBet, io;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Bet.findByPk(req.params.id, { transaction: t })];
                                case 1:
                                    originalBet = _a.sent();
                                    if (!originalBet ||
                                        originalBet.betType !== "flat" ||
                                        !originalBet.isPending()) {
                                        throw errorHandler_1.errors.badRequest("Invalid bet for PAGO proposal");
                                    }
                                    if (pagoAmount >= originalBet.amount) {
                                        throw errorHandler_1.errors.badRequest("PAGO amount must be less than original bet");
                                    }
                                    return [4 /*yield*/, models_1.Wallet.findOne({
                                            where: { userId: req.user.id },
                                            transaction: t,
                                        })];
                                case 2:
                                    wallet = _a.sent();
                                    if (!wallet || !wallet.canBet(pagoAmount)) {
                                        throw errorHandler_1.errors.badRequest("Insufficient available balance");
                                    }
                                    return [4 /*yield*/, models_1.Bet.create({
                                            fightId: originalBet.fightId,
                                            userId: req.user.id,
                                            side: originalBet.side,
                                            amount: pagoAmount,
                                            betType: "flat",
                                            proposalStatus: "pending",
                                            parentBetId: originalBet.id,
                                            terms: {
                                                ratio: 2.0, // Valor por defecto
                                                isOffer: false, // Es una propuesta, no una oferta
                                                pagoAmount: pagoAmount,
                                                proposedBy: req.user.id,
                                            },
                                        }, { transaction: t })];
                                case 3:
                                    pagoBet = _a.sent();
                                    return [4 /*yield*/, wallet.freezeAmount(pagoAmount)];
                                case 4:
                                    _a.sent();
                                    return [4 /*yield*/, wallet.save({ transaction: t })];
                                case 5:
                                    _a.sent();
                                    io = req.app.get("io");
                                    if (io) {
                                        io.to("user_".concat(originalBet.userId)).emit("pago_proposed", {
                                            originalBet: originalBet.toPublicJSON(),
                                            pagoBet: pagoBet.toPublicJSON(),
                                        });
                                    }
                                    res.status(201).json({
                                        success: true,
                                        message: "PAGO proposal created",
                                        data: pagoBet.toPublicJSON(),
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/bets/:id/accept-proposal - Aceptar una propuesta de PAGO
router.put("/:id/accept-proposal", auth_1.authenticate, (0, auth_1.authorize)("user", "admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                    var originalBet, pagoBet, originalWallet, io;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, models_1.Bet.findByPk(req.params.id, { transaction: t })];
                            case 1:
                                originalBet = _a.sent();
                                if (!originalBet ||
                                    originalBet.userId !== req.user.id ||
                                    originalBet.proposalStatus !== "pending") {
                                    throw errorHandler_1.errors.badRequest("Invalid bet for accepting PAGO proposal");
                                }
                                return [4 /*yield*/, models_1.Bet.findOne({
                                        where: { parentBetId: originalBet.id, proposalStatus: "pending" },
                                        transaction: t,
                                    })];
                            case 2:
                                pagoBet = _a.sent();
                                if (!pagoBet) {
                                    throw errorHandler_1.errors.notFound("PAGO proposal not found");
                                }
                                return [4 /*yield*/, models_1.Wallet.findOne({
                                        where: { userId: originalBet.userId },
                                        transaction: t,
                                    })];
                            case 3:
                                originalWallet = _a.sent();
                                if (!originalWallet || !originalWallet.canBet(originalBet.amount)) {
                                    throw errorHandler_1.errors.badRequest("Insufficient available balance");
                                }
                                // Activar apuestas
                                originalBet.proposalStatus = "accepted";
                                pagoBet.proposalStatus = "accepted";
                                originalBet.status = "active";
                                pagoBet.status = "active";
                                return [4 /*yield*/, Promise.all([
                                        originalBet.save({ transaction: t }),
                                        pagoBet.save({ transaction: t }),
                                    ])];
                            case 4:
                                _a.sent();
                                io = req.app.get("io");
                                if (io) {
                                    io.to("user_".concat(pagoBet.userId)).emit("pago_accepted", {
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
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/bets/:id/reject-proposal - Rechazar una propuesta de PAGO
router.put("/:id/reject-proposal", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                    var originalBet, pagoBet, pagoWallet, io;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, models_1.Bet.findByPk(req.params.id, { transaction: t })];
                            case 1:
                                originalBet = _a.sent();
                                if (!originalBet ||
                                    originalBet.userId !== req.user.id ||
                                    originalBet.proposalStatus !== "pending") {
                                    throw errorHandler_1.errors.badRequest("Invalid bet for rejecting PAGO proposal");
                                }
                                return [4 /*yield*/, models_1.Bet.findOne({
                                        where: { parentBetId: originalBet.id, proposalStatus: "pending" },
                                        transaction: t,
                                    })];
                            case 2:
                                pagoBet = _a.sent();
                                if (!pagoBet) {
                                    throw errorHandler_1.errors.notFound("PAGO proposal not found");
                                }
                                return [4 /*yield*/, models_1.Wallet.findOne({
                                        where: { userId: pagoBet.userId },
                                        transaction: t,
                                    })];
                            case 3:
                                pagoWallet = _a.sent();
                                if (!pagoWallet) return [3 /*break*/, 6];
                                return [4 /*yield*/, pagoWallet.unfreezeAmount(pagoBet.amount)];
                            case 4:
                                _a.sent();
                                return [4 /*yield*/, pagoWallet.save({ transaction: t })];
                            case 5:
                                _a.sent();
                                _a.label = 6;
                            case 6: 
                            // Eliminar propuesta
                            return [4 /*yield*/, pagoBet.destroy({ transaction: t })];
                            case 7:
                                // Eliminar propuesta
                                _a.sent();
                                io = req.app.get("io");
                                if (io) {
                                    io.to("user_".concat(pagoBet.userId)).emit("pago_rejected", {
                                        originalBet: originalBet.toPublicJSON(),
                                    });
                                }
                                res.json({
                                    success: true,
                                    message: "PAGO proposal rejected",
                                });
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/bets/pending-proposals - Obtener propuestas de PAGO pendientes del usuario
router.get("/pending-proposals", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var pendingProposals;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, models_1.Bet.findAll({
                    where: {
                        parentBetId: (_a = {}, _a[sequelize_1.Op.not] = null, _a),
                        proposalStatus: "pending",
                        userId: req.user.id,
                    },
                    include: [
                        {
                            model: models_1.Bet,
                            as: "parentBet",
                            include: [
                                { model: models_1.User, as: "user", attributes: ["id", "username"] },
                            ],
                        },
                    ],
                })];
            case 1:
                pendingProposals = _b.sent();
                res.json({
                    success: true,
                    data: pendingProposals.map(function (proposal) { return proposal.toPublicJSON(); }),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
