"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var express_validator_1 = require("express-validator");
var sequelize_1 = require("sequelize");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var models_1 = require("../models");
var redis_1 = require("../config/redis");
var router = (0, express_1.Router)();
/**
 * ⚡ Helper: Create or update user subscription
 * Consolidates subscription creation/update logic used by multiple endpoints
 * @param userId - User ID
 * @param type - Subscription type ('daily' | 'monthly')
 * @param expiresAt - Expiration date
 * @param metadata - Additional metadata to store
 * @returns Created or updated subscription
 */
function createOrUpdateUserSubscription(userId_1, type_1, expiresAt_1) {
    return __awaiter(this, arguments, void 0, function (userId, type, expiresAt, metadata) {
        var subscription, subscriptionData;
        if (metadata === void 0) { metadata = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, models_1.Subscription.findOne({
                        where: { userId: userId },
                        order: [['created_at', 'DESC']]
                    })];
                case 1:
                    subscription = _a.sent();
                    subscriptionData = {
                        type: type,
                        status: 'active',
                        manual_expires_at: expiresAt,
                        expiresAt: expiresAt,
                        paymentMethod: 'cash',
                        autoRenew: false,
                        amount: 0,
                        currency: 'USD',
                        metadata: metadata
                    };
                    if (!subscription) return [3 /*break*/, 3];
                    return [4 /*yield*/, subscription.update(subscriptionData)];
                case 2:
                    _a.sent();
                    console.log("\u2705 Updated existing subscription for user ".concat(userId, " to ").concat(type));
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, models_1.Subscription.create(__assign({ userId: userId }, subscriptionData))];
                case 4:
                    subscription = _a.sent();
                    console.log("\u2705 Created new subscription for user ".concat(userId, " with type ").concat(type));
                    _a.label = 5;
                case 5: return [2 /*return*/, subscription];
            }
        });
    });
}
/**
 * @route   POST /api/membership-requests
 * @desc    Create a new membership change request
 * @access  Private (any authenticated user)
 */
router.post('/', auth_1.authenticate, [
    (0, express_validator_1.body)('requestedMembershipType')
        .isString()
        .withMessage('El tipo de membresía es requerido')
        .isLength({ min: 1, max: 50 })
        .withMessage('El tipo de membresía no puede exceder los 50 caracteres'),
    (0, express_validator_1.body)('requestNotes')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Las notas no pueden exceder los 1000 caracteres'),
    (0, express_validator_1.body)('paymentProofUrl')
        .optional()
        .isURL()
        .withMessage('La URL del comprobante de pago no es válida')
        .isLength({ max: 500 })
        .withMessage('La URL no puede exceder los 500 caracteres'),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, user, _a, requestedMembershipType, requestNotes, paymentProofUrl, existingPendingRequest, currentMembershipType, newRequest;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest('Error de validación');
                }
                user = req.user;
                _a = req.body, requestedMembershipType = _a.requestedMembershipType, requestNotes = _a.requestNotes, paymentProofUrl = _a.paymentProofUrl;
                // Requirement 1: Only users with registered phone numbers can request changes
                if (!((_b = user.profileInfo) === null || _b === void 0 ? void 0 : _b.phoneNumber)) {
                    throw errorHandler_1.errors.badRequest('Debes tener un número de teléfono registrado para solicitar cambios de membresía');
                }
                return [4 /*yield*/, models_1.MembershipChangeRequest.findOne({
                        where: {
                            userId: user.id,
                            status: 'pending',
                        },
                    })];
            case 1:
                existingPendingRequest = _d.sent();
                if (existingPendingRequest) {
                    throw errorHandler_1.errors.conflict('Ya tienes una solicitud pendiente');
                }
                currentMembershipType = ((_c = user.subscription) === null || _c === void 0 ? void 0 : _c.type) || null;
                return [4 /*yield*/, models_1.MembershipChangeRequest.create({
                        userId: user.id,
                        currentMembershipType: currentMembershipType,
                        requestedMembershipType: requestedMembershipType,
                        requestNotes: requestNotes,
                        paymentProofUrl: paymentProofUrl,
                        status: 'pending',
                        requestedAt: new Date(),
                    })];
            case 2:
                newRequest = _d.sent();
                // ⚡ Invalidate admin dashboard cache
                return [4 /*yield*/, (0, redis_1.invalidatePattern)('membership:requests:admin:*')];
            case 3:
                // ⚡ Invalidate admin dashboard cache
                _d.sent();
                res.status(201).json({ success: true, data: newRequest.toPublicJSON() });
                return [2 /*return*/];
        }
    });
}); }));
/**
 * @route   GET /api/membership-requests/my-requests
 * @desc    Get current user's membership change requests
 * @access  Private (any authenticated user)
 */
router.get('/my-requests', auth_1.authenticate, [
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'completed', 'rejected']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, status, _b, limit, _c, offset, where, limitNum, offsetNum, _d, rows, count;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest('Error de validación');
                }
                _a = req.query, status = _a.status, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                where = { userId: req.user.id };
                if (status) {
                    where.status = status;
                }
                limitNum = parseInt(limit, 10) || 20;
                offsetNum = parseInt(offset, 10) || 0;
                return [4 /*yield*/, models_1.MembershipChangeRequest.findAndCountAll({
                        where: where,
                        include: [
                            {
                                model: models_1.User,
                                as: 'processor',
                                attributes: ['id', 'username'],
                                separate: false,
                            },
                        ],
                        order: [['requestedAt', 'DESC']],
                        limit: limitNum,
                        offset: offsetNum,
                    })];
            case 1:
                _d = _e.sent(), rows = _d.rows, count = _d.count;
                res.json({
                    success: true,
                    data: {
                        requests: rows.map(function (r) { return r.toPublicJSON(); }),
                        total: count,
                        limit: limitNum,
                        offset: offsetNum
                    }
                });
                return [2 /*return*/];
        }
    });
}); }));
/**
 * @route   GET /api/membership-requests/pending
 * @desc    Admin: Get all membership requests (supports status filter)
 * @access  Private (admin, operator)
 */
router.get('/pending', auth_1.authenticate, (0, auth_1.authorize)('admin', 'operator'), [
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'completed', 'rejected', 'all']),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, search, _b, limit, _c, status, cacheKey, data;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest('Error de validación');
                }
                _a = req.query, search = _a.search, _b = _a.limit, limit = _b === void 0 ? 100 : _b, _c = _a.status, status = _c === void 0 ? 'pending' : _c;
                cacheKey = "membership:requests:admin:".concat(status, ":").concat(search || 'all', ":").concat(limit);
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var where, userWhere, searchTerm, limitNum, _a, rows, count;
                        var _b, _c, _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    where = {};
                                    // Apply status filter
                                    if (status && status !== 'all') {
                                        where.status = status;
                                    }
                                    userWhere = {};
                                    if (search) {
                                        searchTerm = "%".concat(search, "%");
                                        userWhere = (_b = {},
                                            _b[sequelize_1.Op.or] = [
                                                { username: (_c = {}, _c[sequelize_1.Op.iLike] = searchTerm, _c) },
                                                { email: (_d = {}, _d[sequelize_1.Op.iLike] = searchTerm, _d) },
                                            ],
                                            _b);
                                    }
                                    limitNum = parseInt(limit, 10) || 100;
                                    return [4 /*yield*/, models_1.MembershipChangeRequest.findAndCountAll({
                                            where: where,
                                            include: [
                                                {
                                                    model: models_1.User,
                                                    as: 'user',
                                                    attributes: ['id', 'username', 'email', 'profileInfo'],
                                                    where: userWhere,
                                                    separate: false,
                                                    include: [
                                                        {
                                                            model: models_1.Subscription,
                                                            as: 'subscriptions',
                                                            attributes: ['id', 'status', 'type', 'manual_expires_at'],
                                                            limit: 1,
                                                            order: [['created_at', 'DESC']],
                                                            separate: true,
                                                        },
                                                    ],
                                                },
                                            ],
                                            order: [['requestedAt', 'ASC']],
                                            limit: limitNum,
                                        })];
                                case 1:
                                    _a = _e.sent(), rows = _a.rows, count = _a.count;
                                    return [2 /*return*/, {
                                            success: true,
                                            data: {
                                                requests: rows.map(function (r) { return (__assign(__assign({}, r.toPublicJSON()), { user: r.user ? {
                                                        id: r.user.id,
                                                        username: r.user.username,
                                                        email: r.user.email,
                                                        profileInfo: r.user.profileInfo,
                                                        subscription: r.user.subscriptions && r.user.subscriptions.length > 0 ? {
                                                            status: r.user.subscriptions[0].status,
                                                            type: r.user.subscriptions[0].type,
                                                            manual_expires_at: r.user.subscriptions[0].manual_expires_at,
                                                        } : null,
                                                    } : null })); }),
                                                total: count
                                            }
                                        }];
                            }
                        });
                    }); }, 60)];
            case 1:
                data = _d.sent();
                res.json(data);
                return [2 /*return*/];
        }
    });
}); }));
/**
 * @route   PATCH /api/membership-requests/:id/complete
 * @desc    Mark request as completed
 * @access  Private (admin)
 */
router.patch('/:id/complete', auth_1.authenticate, (0, auth_1.authorize)('admin'), [(0, express_validator_1.body)('adminNotes').optional().isString().isLength({ max: 500 })], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, id, adminNotes, request, user, now, expiresAt, subscriptionType, metadata, subscription;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest('Error de validación');
                }
                id = req.params.id;
                adminNotes = req.body.adminNotes;
                return [4 /*yield*/, models_1.MembershipChangeRequest.findByPk(id)];
            case 1:
                request = _a.sent();
                if (!request) {
                    throw errorHandler_1.errors.notFound('Solicitud no encontrada');
                }
                if (request.status !== 'pending') {
                    throw errorHandler_1.errors.conflict("La solicitud ya ha sido procesada (estado: ".concat(request.status, ")"));
                }
                return [4 /*yield*/, models_1.User.findByPk(request.userId)];
            case 2:
                user = _a.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound('Usuario no encontrado');
                }
                now = new Date();
                expiresAt = null;
                if (request.requestedMembershipType === '24-hour') {
                    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                }
                else if (request.requestedMembershipType === 'monthly') {
                    expiresAt = new Date(now);
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                }
                else {
                    // If requested type is not recognized, default to free
                    throw errorHandler_1.errors.badRequest('Tipo de membresía solicitado no válido');
                }
                subscriptionType = (request.requestedMembershipType === '24-hour' ? 'daily' : 'monthly');
                metadata = {
                    assignedBy: req.user.username,
                    assignedAt: new Date().toISOString(),
                    manualAssignment: true,
                    fromRequest: request.id
                };
                return [4 /*yield*/, createOrUpdateUserSubscription(user.id, subscriptionType, expiresAt, metadata)];
            case 3:
                subscription = _a.sent();
                // Update the request status to completed
                request.status = 'completed';
                request.processedAt = new Date();
                request.processedBy = req.user.id;
                if (adminNotes) {
                    request.adminNotes = adminNotes;
                }
                return [4 /*yield*/, request.save()];
            case 4:
                _a.sent();
                // ⚡ Invalidate admin dashboard cache
                return [4 /*yield*/, (0, redis_1.invalidatePattern)('membership:requests:admin:*')];
            case 5:
                // ⚡ Invalidate admin dashboard cache
                _a.sent();
                // ⚡ Invalidate user profile cache to reflect new subscription
                return [4 /*yield*/, (0, redis_1.invalidatePattern)("user:profile:".concat(user.id))];
            case 6:
                // ⚡ Invalidate user profile cache to reflect new subscription
                _a.sent();
                res.json({ success: true, data: request.toPublicJSON() });
                return [2 /*return*/];
        }
    });
}); }));
/**
 * @route   PATCH /api/membership-requests/:id/reject
 * @desc    Admin: Reject a membership change request
 * @access  Private (admin)
 */
router.patch('/:id/reject', auth_1.authenticate, (0, auth_1.authorize)('admin'), [
    (0, express_validator_1.body)('rejectionReason')
        .isString()
        .withMessage('Se requiere un motivo de rechazo')
        .isLength({ min: 10, max: 1000 })
        .withMessage('El motivo de rechazo debe tener entre 10 y 1000 caracteres'),
    (0, express_validator_1.body)('adminNotes').optional().isString().isLength({ max: 500 }),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, id, _a, rejectionReason, adminNotes, request;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest('Error de validación');
                }
                id = req.params.id;
                _a = req.body, rejectionReason = _a.rejectionReason, adminNotes = _a.adminNotes;
                return [4 /*yield*/, models_1.MembershipChangeRequest.findByPk(id)];
            case 1:
                request = _b.sent();
                if (!request) {
                    throw errorHandler_1.errors.notFound('Solicitud no encontrada');
                }
                if (request.status !== 'pending') {
                    throw errorHandler_1.errors.conflict("La solicitud ya ha sido procesada (estado: ".concat(request.status, ")"));
                }
                request.status = 'rejected';
                request.processedAt = new Date();
                request.processedBy = req.user.id;
                request.rejectionReason = rejectionReason;
                if (adminNotes) {
                    request.adminNotes = adminNotes;
                }
                return [4 /*yield*/, request.save()];
            case 2:
                _b.sent();
                // ⚡ Invalidate admin dashboard cache
                return [4 /*yield*/, (0, redis_1.invalidatePattern)('membership:requests:admin:*')];
            case 3:
                // ⚡ Invalidate admin dashboard cache
                _b.sent();
                res.json({ success: true, data: request.toPublicJSON() });
                return [2 /*return*/];
        }
    });
}); }));
/**
 * @route   DELETE /api/membership-requests/:id
 * @desc    Admin: Delete a membership change request (only completed/rejected)
 * @access  Private (admin)
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, request;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = req.params.id;
                return [4 /*yield*/, models_1.MembershipChangeRequest.findByPk(id)];
            case 1:
                request = _a.sent();
                if (!request) {
                    throw errorHandler_1.errors.notFound('Solicitud no encontrada');
                }
                // Only allow deletion of completed or rejected requests
                if (request.status === 'pending') {
                    throw errorHandler_1.errors.conflict('No se puede eliminar una solicitud pendiente. Rechazala primero.');
                }
                return [4 /*yield*/, request.destroy()];
            case 2:
                _a.sent();
                // ⚡ Invalidate admin dashboard cache
                return [4 /*yield*/, (0, redis_1.invalidatePattern)('membership:requests:admin:*')];
            case 3:
                // ⚡ Invalidate admin dashboard cache
                _a.sent();
                res.json({ success: true, message: 'Solicitud eliminada correctamente' });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
