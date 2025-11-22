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
var router = (0, express_1.Router)();
// GET /api/fights - Listar peleas con filtros
router.get("/", (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, eventId, status, where, fights;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, eventId = _a.eventId, status = _a.status;
                where = {};
                if (eventId)
                    where.eventId = eventId;
                if (status)
                    where.status = status;
                return [4 /*yield*/, models_1.Fight.findAll({
                        where: where,
                        include: [
                            {
                                model: models_1.Event,
                                as: "event",
                                attributes: ["id", "name", "status"],
                            },
                        ],
                        order: [["number", "ASC"]],
                    })];
            case 1:
                fights = _b.sent();
                res.json({
                    success: true,
                    data: fights.map(function (fight) { return fight.toPublicJSON(); }),
                });
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/fights/:id - Obtener pelea específica
router.get("/:id", (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fight, fightData, operatorId;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.id, {
                    include: [
                        { model: models_1.Event, as: "event", separate: false },
                        {
                            model: models_1.Bet,
                            as: "bets",
                            separate: false,
                            include: [
                                { model: models_1.User, as: "user", attributes: ["id", "username"], separate: false },
                            ],
                        },
                    ],
                })];
            case 1:
                fight = _b.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                fightData = fight.toJSON();
                operatorId = (_a = fightData.event) === null || _a === void 0 ? void 0 : _a.operatorId;
                res.json({
                    success: true,
                    data: {
                        fight: fightData,
                        operatorId: operatorId,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
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
    (0, express_validator_1.body)("initialOdds")
        .optional()
        .isObject()
        .withMessage("Initial odds must be an object"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, eventId, number, redCorner, blueCorner, weight, notes, initialOdds;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, eventId = _a.eventId, number = _a.number, redCorner = _a.redCorner, blueCorner = _a.blueCorner, weight = _a.weight, notes = _a.notes, initialOdds = _a.initialOdds;
                // Usar transacción para operaciones múltiples
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var event, eventData, existingFight, fight, io;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Event.findByPk(eventId, { transaction: t })];
                                case 1:
                                    event = _a.sent();
                                    if (!event) {
                                        throw errorHandler_1.errors.notFound("Event not found");
                                    }
                                    eventData = event.toJSON();
                                    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                                        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                                    }
                                    return [4 /*yield*/, models_1.Fight.findOne({
                                            where: { eventId: eventId, number: number },
                                            transaction: t,
                                        })];
                                case 2:
                                    existingFight = _a.sent();
                                    if (existingFight) {
                                        throw errorHandler_1.errors.conflict("A fight with this number already exists in the event");
                                    }
                                    // Verificar que los criaderos son diferentes
                                    if (redCorner.toLowerCase() === blueCorner.toLowerCase()) {
                                        throw errorHandler_1.errors.badRequest("Red and blue corners cannot be the same");
                                    }
                                    return [4 /*yield*/, models_1.Fight.create({
                                            eventId: eventId,
                                            number: number,
                                            redCorner: redCorner,
                                            blueCorner: blueCorner,
                                            weight: weight,
                                            notes: notes,
                                            initialOdds: initialOdds || { red: 1.0, blue: 1.0 },
                                            totalBets: 0,
                                            totalAmount: 0,
                                        }, { transaction: t })];
                                case 3:
                                    fight = _a.sent();
                                    // Actualizar contador en evento
                                    event.totalFights += 1;
                                    return [4 /*yield*/, event.save({ transaction: t })];
                                case 4:
                                    _a.sent();
                                    io = req.app.get("io");
                                    if (io) {
                                        io.to("event_".concat(eventId)).emit("fight_created", {
                                            fight: fight.toPublicJSON(),
                                        });
                                    }
                                    res.status(201).json({
                                        success: true,
                                        message: "Fight created successfully",
                                        data: fight.toPublicJSON(),
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                // Usar transacción para operaciones múltiples
                _b.sent();
                return [2 /*return*/];
        }
    });
}); }));
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
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, fight, fightData, allowedFields, io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                return [4 /*yield*/, models_1.Fight.findByPk(req.params.id, {
                        include: [
                            {
                                model: models_1.Event,
                                as: "event",
                            },
                        ],
                    })];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                fightData = fight.toJSON();
                if (req.user.role === "operator" &&
                    fightData.event &&
                    fightData.event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                // Verificar si la pelea puede ser editada
                if (fight.status === "completed") {
                    throw errorHandler_1.errors.badRequest("Completed fights cannot be edited");
                }
                allowedFields = [
                    "redCorner",
                    "blueCorner",
                    "weight",
                    "notes",
                    "status",
                ];
                allowedFields.forEach(function (field) {
                    if (req.body[field] !== undefined) {
                        fight[field] = req.body[field];
                    }
                });
                // Verificar que los criaderos siguen siendo diferentes
                if (fight.redCorner.toLowerCase() === fight.blueCorner.toLowerCase()) {
                    throw errorHandler_1.errors.badRequest("Red and blue corners cannot be the same");
                }
                return [4 /*yield*/, fight.save()];
            case 2:
                _a.sent();
                io = req.app.get("io");
                if (io) {
                    io.to("event_".concat(fight.eventId)).emit("fight_updated", {
                        fight: fight.toPublicJSON(),
                    });
                }
                res.json({
                    success: true,
                    message: "Fight updated successfully",
                    data: fight.toPublicJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// PATCH /api/fights/:id/status - Fight status transitions with workflow logic
router.patch("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("status")
        .isIn(["upcoming", "betting", "live", "completed"])
        .withMessage("Status must be upcoming, betting, live, or completed"),
    (0, express_validator_1.body)("result")
        .optional()
        .isIn(["red", "blue", "draw"])
        .withMessage("Result must be red, blue, or draw")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, status, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, status = _a.status, result = _a.result;
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var fight, fightData, currentStatus, _a, event_1, activeBets, _i, activeBets_1, bet, betResult, sseService, eventType;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.id, {
                                        include: [
                                            {
                                                model: models_1.Event,
                                                as: "event",
                                            },
                                            {
                                                model: models_1.Bet,
                                                as: "bets",
                                                required: false
                                            }
                                        ],
                                        transaction: t
                                    })];
                                case 1:
                                    fight = _b.sent();
                                    if (!fight) {
                                        throw errorHandler_1.errors.notFound("Fight not found");
                                    }
                                    fightData = fight.toJSON();
                                    if (req.user.role === "operator" &&
                                        fightData.event.operatorId !== req.user.id) {
                                        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                                    }
                                    // Verify event is in-progress
                                    if (fightData.event.status !== "in-progress") {
                                        throw errorHandler_1.errors.badRequest("Event must be in progress to manage fights");
                                    }
                                    // Validate status transition using Fight model method
                                    if (!fight.canTransitionTo(status)) {
                                        throw errorHandler_1.errors.badRequest("Invalid transition from ".concat(fight.status, " to ").concat(status));
                                    }
                                    currentStatus = fight.status;
                                    _a = status;
                                    switch (_a) {
                                        case "betting": return [3 /*break*/, 2];
                                        case "live": return [3 /*break*/, 3];
                                        case "completed": return [3 /*break*/, 5];
                                    }
                                    return [3 /*break*/, 14];
                                case 2:
                                    fight.bettingStartTime = new Date();
                                    return [3 /*break*/, 14];
                                case 3:
                                    fight.bettingEndTime = new Date();
                                    fight.startTime = new Date();
                                    // Auto-cancel any pending unmatched bets
                                    return [4 /*yield*/, models_1.Bet.update({ status: "cancelled" }, {
                                            where: {
                                                fightId: fight.id,
                                                status: "pending"
                                            },
                                            transaction: t
                                        })];
                                case 4:
                                    // Auto-cancel any pending unmatched bets
                                    _b.sent();
                                    return [3 /*break*/, 14];
                                case 5:
                                    if (!result) {
                                        throw errorHandler_1.errors.badRequest("Result is required when completing a fight");
                                    }
                                    fight.result = result;
                                    fight.endTime = new Date();
                                    return [4 /*yield*/, models_1.Event.findByPk(fight.eventId, { transaction: t })];
                                case 6:
                                    event_1 = _b.sent();
                                    if (!event_1) return [3 /*break*/, 8];
                                    event_1.completedFights += 1;
                                    return [4 /*yield*/, event_1.save({ transaction: t })];
                                case 7:
                                    _b.sent();
                                    _b.label = 8;
                                case 8: return [4 /*yield*/, models_1.Bet.findAll({
                                        where: {
                                            fightId: fight.id,
                                            status: "active"
                                        },
                                        transaction: t
                                    })];
                                case 9:
                                    activeBets = _b.sent();
                                    _i = 0, activeBets_1 = activeBets;
                                    _b.label = 10;
                                case 10:
                                    if (!(_i < activeBets_1.length)) return [3 /*break*/, 13];
                                    bet = activeBets_1[_i];
                                    betResult = "loss";
                                    if (result === "draw") {
                                        betResult = "draw";
                                    }
                                    else if ((result === "red" && bet.side === "red") ||
                                        (result === "blue" && bet.side === "blue")) {
                                        betResult = "win";
                                    }
                                    bet.result = betResult;
                                    bet.status = "completed";
                                    return [4 /*yield*/, bet.save({ transaction: t })];
                                case 11:
                                    _b.sent();
                                    _b.label = 12;
                                case 12:
                                    _i++;
                                    return [3 /*break*/, 10];
                                case 13: return [3 /*break*/, 14];
                                case 14:
                                    // Update fight status
                                    fight.status = status;
                                    return [4 /*yield*/, fight.save({ transaction: t })];
                                case 15:
                                    _b.sent();
                                    sseService = req.app.get("sseService");
                                    if (sseService) {
                                        eventType = status === "betting" ? "BETTING_WINDOW_OPENED" :
                                            status === "live" ? "BETTING_WINDOW_CLOSED" :
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
                                        message: "Fight status updated to ".concat(status, " successfully"),
                                        data: {
                                            fight: fight.toPublicJSON(),
                                            result: result,
                                            statusTransition: "".concat(currentStatus, " \u2192 ").concat(status)
                                        }
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/fights/:id/open-betting - Abrir apuestas para una pelea (DEPRECATED - use PATCH /api/fights/:id/status)
router.post("/:id/open-betting", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fight, fightData, io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.id, {
                    include: [
                        {
                            model: models_1.Event,
                            as: "event",
                        },
                    ],
                })];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                fightData = fight.toJSON();
                if (req.user.role === "operator" &&
                    fightData.event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                // Verificar que la pelea puede abrir apuestas
                if (fight.status !== "upcoming") {
                    throw errorHandler_1.errors.badRequest("Betting can only be opened for upcoming fights");
                }
                // Abrir apuestas con timestamp
                fight.status = "betting";
                fight.bettingStartTime = new Date();
                return [4 /*yield*/, fight.save()];
            case 2:
                _a.sent();
                io = req.app.get("io");
                if (io) {
                    io.to("event_".concat(fight.eventId)).emit("betting_opened", {
                        fightId: fight.id,
                        fight: fight.toPublicJSON(),
                    });
                }
                res.json({
                    success: true,
                    message: "Betting opened successfully",
                    data: fight.toPublicJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/fights/:id/close-betting - Cerrar apuestas para una pelea
router.post("/:id/close-betting", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fight, fightData, io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.id, {
                    include: [
                        {
                            model: models_1.Event,
                            as: "event",
                        },
                    ],
                })];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                fightData = fight.toJSON();
                if (req.user.role === "operator" &&
                    fightData.event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                // Verificar que las apuestas están abiertas
                if (fight.status !== "betting") {
                    throw errorHandler_1.errors.badRequest("Betting is not currently open for this fight");
                }
                // Cerrar apuestas con timestamps
                fight.status = "live";
                fight.bettingEndTime = new Date();
                fight.startTime = new Date();
                return [4 /*yield*/, fight.save()];
            case 2:
                _a.sent();
                // Activar apuestas pendientes
                return [4 /*yield*/, models_1.Bet.update({ status: "active" }, {
                        where: {
                            fightId: fight.id,
                            status: "pending",
                        },
                    })];
            case 3:
                // Activar apuestas pendientes
                _a.sent();
                io = req.app.get("io");
                if (io) {
                    io.to("event_".concat(fight.eventId)).emit("betting_closed", {
                        fightId: fight.id,
                        fight: fight.toPublicJSON(),
                    });
                }
                res.json({
                    success: true,
                    message: "Betting closed successfully",
                    data: fight.toPublicJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/fights/:id/result - Registrar resultado de pelea
router.post("/:id/result", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), [
    (0, express_validator_1.body)("result")
        .isIn(["red", "blue", "draw", "cancelled"])
        .withMessage("Result must be red, blue, draw, or cancelled"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                result = req.body.result;
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var fight, fightData, event, bets, _i, bets_1, betData, bet, betResult, wallet, io;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.id, {
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
                                        transaction: t,
                                    })];
                                case 1:
                                    fight = _a.sent();
                                    if (!fight) {
                                        throw errorHandler_1.errors.notFound("Fight not found");
                                    }
                                    fightData = fight.toJSON();
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
                                    return [4 /*yield*/, fight.save({ transaction: t })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, models_1.Event.findByPk(fight.eventId, { transaction: t })];
                                case 3:
                                    event = _a.sent();
                                    if (!event) return [3 /*break*/, 5];
                                    event.completedFights += 1;
                                    return [4 /*yield*/, event.save({ transaction: t })];
                                case 4:
                                    _a.sent();
                                    _a.label = 5;
                                case 5:
                                    bets = fightData.bets || [];
                                    if (!(bets.length > 0)) return [3 /*break*/, 13];
                                    _i = 0, bets_1 = bets;
                                    _a.label = 6;
                                case 6:
                                    if (!(_i < bets_1.length)) return [3 /*break*/, 13];
                                    betData = bets_1[_i];
                                    return [4 /*yield*/, models_1.Bet.findByPk(betData.id, { transaction: t })];
                                case 7:
                                    bet = _a.sent();
                                    if (!bet)
                                        return [3 /*break*/, 12];
                                    betResult = "loss";
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
                                    return [4 /*yield*/, bet.save({ transaction: t })];
                                case 8:
                                    _a.sent();
                                    return [4 /*yield*/, models_1.Wallet.findOne({
                                            where: { userId: bet.userId },
                                            transaction: t,
                                        })];
                                case 9:
                                    wallet = _a.sent();
                                    if (!wallet) return [3 /*break*/, 12];
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
                                    return [4 /*yield*/, wallet.save({ transaction: t })];
                                case 10:
                                    _a.sent();
                                    // Crear transacción
                                    return [4 /*yield*/, models_1.Transaction.create({
                                            walletId: wallet.id,
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
                                            description: "".concat(betResult === "win"
                                                ? "Won"
                                                : betResult === "cancelled" || betResult === "draw"
                                                    ? "Refund for"
                                                    : "Lost", " bet on fight ").concat(fight.number),
                                            metadata: {
                                                fightId: fight.id,
                                                betId: bet.id,
                                                result: result,
                                            },
                                        }, { transaction: t })];
                                case 11:
                                    // Crear transacción
                                    _a.sent();
                                    _a.label = 12;
                                case 12:
                                    _i++;
                                    return [3 /*break*/, 6];
                                case 13:
                                    io = req.app.get("io");
                                    if (io) {
                                        io.to("event_".concat(fight.eventId)).emit("fight_completed", {
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
// =============================================
// BETTING WINDOWS MANAGEMENT ENDPOINTS
// =============================================
// POST /api/fights/:fightId/open-betting - Open betting window
router.post("/:fightId/open-betting", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fight, sseService;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.fightId, {
                    include: [{ model: models_1.Event, as: "event" }]
                })];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                // Verify fight status
                if (fight.status !== "upcoming") {
                    throw errorHandler_1.errors.badRequest("Cannot open betting for fight with status: ".concat(fight.status));
                }
                // Open betting window
                fight.status = "betting";
                return [4 /*yield*/, fight.save()];
            case 2:
                _a.sent();
                sseService = req.app.get("sseService");
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
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/fights/:fightId/close-betting - Close betting window
router.post("/:fightId/close-betting", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fight, sseService;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Fight.findByPk(req.params.fightId)];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                // Verify fight status
                if (fight.status !== "betting") {
                    throw errorHandler_1.errors.badRequest("Cannot close betting for fight with status: ".concat(fight.status));
                }
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var pendingBets, _i, pendingBets_1, bet, _a, pendingBets_2, bet, wallet;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    // Close betting window
                                    fight.status = "live";
                                    return [4 /*yield*/, fight.save({ transaction: t })];
                                case 1:
                                    _b.sent();
                                    return [4 /*yield*/, models_1.Bet.findAll({
                                            where: {
                                                fightId: fight.id,
                                                status: "pending"
                                            },
                                            transaction: t
                                        })];
                                case 2:
                                    pendingBets = _b.sent();
                                    _i = 0, pendingBets_1 = pendingBets;
                                    _b.label = 3;
                                case 3:
                                    if (!(_i < pendingBets_1.length)) return [3 /*break*/, 6];
                                    bet = pendingBets_1[_i];
                                    bet.status = "cancelled";
                                    return [4 /*yield*/, bet.save({ transaction: t })];
                                case 4:
                                    _b.sent();
                                    _b.label = 5;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 3];
                                case 6:
                                    _a = 0, pendingBets_2 = pendingBets;
                                    _b.label = 7;
                                case 7:
                                    if (!(_a < pendingBets_2.length)) return [3 /*break*/, 12];
                                    bet = pendingBets_2[_a];
                                    if (!(bet.userId && bet.amount)) return [3 /*break*/, 11];
                                    return [4 /*yield*/, models_1.Wallet.findOne({
                                            where: { userId: bet.userId },
                                            transaction: t
                                        })];
                                case 8:
                                    wallet = _b.sent();
                                    if (!wallet) return [3 /*break*/, 11];
                                    return [4 /*yield*/, models_1.Transaction.create({
                                            walletId: wallet.id,
                                            type: "bet-refund",
                                            amount: bet.amount,
                                            description: "Refund for cancelled bet on fight ".concat(fight.number),
                                            status: "completed"
                                        }, { transaction: t })];
                                case 9:
                                    _b.sent();
                                    wallet.balance += bet.amount;
                                    return [4 /*yield*/, wallet.save({ transaction: t })];
                                case 10:
                                    _b.sent();
                                    _b.label = 11;
                                case 11:
                                    _a++;
                                    return [3 /*break*/, 7];
                                case 12: return [2 /*return*/];
                            }
                        });
                    }); })];
            case 2:
                _a.sent();
                sseService = req.app.get("sseService");
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
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/events/:eventId/current-betting - Get current active betting fight
router.get("/events/:eventId/current-betting", (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var eventId, currentFight, availableBets;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                eventId = req.params.eventId;
                return [4 /*yield*/, models_1.Fight.findOne({
                        where: {
                            eventId: eventId,
                            status: "betting"
                        },
                        include: [
                            { model: models_1.Event, as: "event" },
                            {
                                model: models_1.Bet,
                                as: "bets",
                                where: { status: "pending" },
                                required: false,
                                include: [
                                    {
                                        model: models_1.User,
                                        as: "user",
                                        attributes: ["id", "username"]
                                    }
                                ]
                            }
                        ],
                        order: [["number", "ASC"]]
                    })];
            case 1:
                currentFight = _a.sent();
                if (!currentFight) {
                    return [2 /*return*/, res.json({
                            success: true,
                            data: {
                                currentFight: null,
                                availableBets: [],
                                bettingOpen: false
                            }
                        })];
                }
                return [4 /*yield*/, models_1.Bet.findAll({
                        where: {
                            fightId: currentFight.id,
                            status: "pending"
                        },
                        include: [
                            {
                                model: models_1.User,
                                as: "user",
                                attributes: ["id", "username"]
                            }
                        ],
                        order: [["createdAt", "DESC"]]
                    })];
            case 2:
                availableBets = _a.sent();
                res.json({
                    success: true,
                    data: {
                        currentFight: currentFight.toPublicJSON(),
                        availableBets: availableBets.map(function (bet) { return bet.toPublicJSON(); }),
                        bettingOpen: true
                    }
                });
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/bets/available/:fightId - Get available bets for specific fight
router.get("/bets/available/:fightId", (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fightId, fight, availableBets;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fightId = req.params.fightId;
                return [4 /*yield*/, models_1.Fight.findByPk(fightId)];
            case 1:
                fight = _a.sent();
                if (!fight) {
                    throw errorHandler_1.errors.notFound("Fight not found");
                }
                // Verify betting is open
                if (fight.status !== "betting") {
                    throw errorHandler_1.errors.forbidden("Betting is not open for this fight");
                }
                return [4 /*yield*/, models_1.Bet.findAll({
                        where: {
                            fightId: fightId,
                            status: "pending"
                        },
                        include: [
                            {
                                model: models_1.User,
                                as: "user",
                                attributes: ["id", "username"]
                            }
                        ],
                        order: [["createdAt", "DESC"]]
                    })];
            case 2:
                availableBets = _a.sent();
                res.json({
                    success: true,
                    data: {
                        fightId: fightId,
                        fightStatus: fight.status,
                        availableBets: availableBets.map(function (bet) { return bet.toPublicJSON(); })
                    }
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
