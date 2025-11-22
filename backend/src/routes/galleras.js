"use strict";
// backend/src/routes/galleras.ts
// API para la nueva entidad Gallera
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var models_1 = require("../models");
var redis_1 = require("../config/redis");
var sequelize_1 = require("sequelize");
var router = (0, express_1.Router)();
// GET /api/galleras - Listar todas las galleras
router.get("/", auth_1.optionalAuth, // O `authenticate` si solo usuarios logueados pueden verlas
(0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, limit, _c, offset, ownerApproved, ownerSubscription, search, userRole, cacheKey, data;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, ownerApproved = _a.ownerApproved, ownerSubscription = _a.ownerSubscription, search = _a.search;
                userRole = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) || 'public';
                cacheKey = "galleras:list:".concat(userRole, ":").concat(ownerApproved || 'all', ":").concat(ownerSubscription || 'all', ":").concat(search || 'all', ":").concat(limit, ":").concat(offset);
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var userWhere, conditions, subscriptionInclude, _a, count, rows, transformedRows;
                        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                        return __generator(this, function (_o) {
                            switch (_o.label) {
                                case 0:
                                    userWhere = {
                                        role: 'gallera',
                                        isActive: true
                                    };
                                    // Add owner approval filter
                                    if (ownerApproved !== undefined) {
                                        userWhere.approved = ownerApproved === "true";
                                    }
                                    conditions = [];
                                    // Add search filter
                                    if (search) {
                                        conditions.push((_b = {},
                                            _b[sequelize_1.Op.or] = [
                                                { username: (_c = {}, _c[sequelize_1.Op.iLike] = "%".concat(search, "%"), _c) },
                                                { email: (_d = {}, _d[sequelize_1.Op.iLike] = "%".concat(search, "%"), _d) },
                                            ],
                                            _b));
                                    }
                                    subscriptionInclude = [];
                                    if (ownerSubscription === 'free') {
                                        // Find users WITH NO active subscription OR with status='free'
                                        subscriptionInclude = [{
                                                model: models_1.Subscription,
                                                attributes: ['type', 'status', 'expiresAt'],
                                                required: false, // LEFT JOIN to include users without subscriptions
                                                where: (_e = {},
                                                    _e[sequelize_1.Op.or] = [
                                                        { status: 'free' },
                                                        (_f = {},
                                                            _f[sequelize_1.Op.and] = [
                                                                { expiresAt: (_g = {}, _g[sequelize_1.Op.lte] = new Date(), _g) },
                                                                { status: 'active' }
                                                            ],
                                                            _f)
                                                    ],
                                                    _e)
                                            }];
                                        // Then filter to only include users where the subscription is NULL (no subscription) OR matches the free criteria
                                        conditions.push((_h = {},
                                            _h[sequelize_1.Op.or] = [
                                                { '$subscriptions.id$': null }, // Users with no subscription (free by default)
                                                { '$subscriptions.status$': 'free' },
                                                (_j = {},
                                                    _j[sequelize_1.Op.and] = [
                                                        { '$subscriptions.expiresAt$': (_k = {}, _k[sequelize_1.Op.lte] = new Date(), _k) },
                                                        { '$subscriptions.status$': 'active' }
                                                    ],
                                                    _j)
                                            ],
                                            _h));
                                    }
                                    else if (ownerSubscription === 'monthly') {
                                        subscriptionInclude = [{
                                                model: models_1.Subscription,
                                                attributes: ['type', 'status', 'expiresAt'],
                                                required: true, // INNER JOIN - only users WITH matching subscription
                                                where: {
                                                    type: 'monthly',
                                                    status: 'active',
                                                    expiresAt: (_l = {}, _l[sequelize_1.Op.gt] = new Date(), _l)
                                                }
                                            }];
                                    }
                                    else if (ownerSubscription === 'daily') {
                                        subscriptionInclude = [{
                                                model: models_1.Subscription,
                                                attributes: ['type', 'status', 'expiresAt'],
                                                required: true, // INNER JOIN - only users WITH matching subscription
                                                where: {
                                                    type: 'daily',
                                                    status: 'active',
                                                    expiresAt: (_m = {}, _m[sequelize_1.Op.gt] = new Date(), _m)
                                                }
                                            }];
                                    }
                                    // Combine all conditions if any exist
                                    if (conditions.length > 0) {
                                        userWhere[sequelize_1.Op.and] = conditions;
                                    }
                                    return [4 /*yield*/, models_1.User.findAndCountAll({
                                            where: userWhere,
                                            attributes: ["id", "username", "email", "profileInfo", "approved", "isActive", "createdAt", "updatedAt"],
                                            include: __spreadArray([], subscriptionInclude, true),
                                            order: [["createdAt", "DESC"]],
                                            limit: parseInt(limit),
                                            offset: parseInt(offset),
                                            subQuery: false,
                                        })];
                                case 1:
                                    _a = _o.sent(), count = _a.count, rows = _a.rows;
                                    transformedRows = rows.map(function (user) {
                                        var profile = user.profileInfo || {};
                                        // Status is CALCULATED: (isActive && approved) determines status
                                        var calculatedStatus = user.isActive && user.approved ? 'active' :
                                            user.isActive && !user.approved ? 'pending' :
                                                'inactive';
                                        return {
                                            id: user.id,
                                            name: profile.galleraName || user.username,
                                            location: profile.galleraLocation || '',
                                            description: profile.galleraDescription || '',
                                            status: calculatedStatus,
                                            isVerified: false,
                                            profileImage: profile.imageUrl || '',
                                            images: profile.images || [],
                                            createdAt: user.createdAt,
                                            updatedAt: user.updatedAt,
                                            owner: {
                                                id: user.id,
                                                username: user.username,
                                                email: user.email,
                                                profileInfo: user.profileInfo,
                                            },
                                        };
                                    });
                                    return [2 /*return*/, {
                                            success: true,
                                            data: {
                                                users: transformedRows,
                                                total: count,
                                                limit: parseInt(limit),
                                                offset: parseInt(offset),
                                            },
                                        }];
                            }
                        });
                    }); }, 300)];
            case 1:
                data = _e.sent();
                res.json(data);
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/galleras/:id - Obtener gallera específica (usuario con rol='gallera')
router.get("/:id", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userRole, cacheKey, data;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userRole = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || 'public';
                cacheKey = "gallera:".concat(req.params.id, ":").concat(userRole);
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var user, profile, calculatedStatus, galleraData;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.User.findOne({
                                        where: { id: req.params.id, role: 'gallera' },
                                        attributes: ["id", "username", "email", "profileInfo", "approved", "isActive", "createdAt", "updatedAt"],
                                    })];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        throw errorHandler_1.errors.notFound("Gallera not found");
                                    }
                                    profile = user.profileInfo || {};
                                    calculatedStatus = user.isActive && user.approved ? 'active' :
                                        user.isActive && !user.approved ? 'pending' :
                                            'inactive';
                                    galleraData = {
                                        id: user.id,
                                        name: profile.galleraName || user.username,
                                        location: profile.galleraLocation || '',
                                        description: profile.galleraDescription || '',
                                        status: calculatedStatus,
                                        isVerified: false,
                                        profileImage: profile.imageUrl || '',
                                        images: profile.images || [],
                                        createdAt: user.createdAt,
                                        updatedAt: user.updatedAt,
                                        owner: {
                                            id: user.id,
                                            username: user.username,
                                            email: user.email,
                                            profileInfo: user.profileInfo,
                                        },
                                    };
                                    return [2 /*return*/, {
                                            success: true,
                                            data: galleraData,
                                        }];
                            }
                        });
                    }); }, 300)];
            case 1:
                data = _b.sent();
                res.json(data);
                return [2 /*return*/];
        }
    });
}); }));
// NOTE 2025-10-30: POST, PUT, DELETE endpoints removed
// CONSOLIDATED ARCHITECTURE: Gallera data is now managed through User endpoints
// Instead of /galleras POST/PUT/DELETE, use /users POST/PUT endpoints
// Gallera profile data is stored in User.profileInfo (galleraName, galleraLocation, etc.)
exports.default = router;
