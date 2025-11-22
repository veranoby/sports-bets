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
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var models_1 = require("../models");
var express_validator_1 = require("express-validator");
var sequelize_1 = require("sequelize");
var redis_1 = require("../config/redis");
var router = (0, express_1.Router)();
// GET /api/users/profile - Obtener perfil propio (DEBE ir ANTES de rutas con parámetros)
router.get("/profile", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, cacheKey, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.user.id;
                cacheKey = "user:profile:".concat(userId);
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var user, currentSubscription;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, models_1.User.findByPk(userId, {
                                        attributes: {
                                            exclude: ["passwordHash", "verificationToken"],
                                        },
                                    })];
                                case 1:
                                    user = _c.sent();
                                    if (!user) {
                                        throw errorHandler_1.errors.notFound("User not found");
                                    }
                                    return [4 /*yield*/, user.getCurrentSubscription()];
                                case 2:
                                    currentSubscription = _c.sent();
                                    _a = {
                                        success: true
                                    };
                                    _b = {};
                                    return [4 /*yield*/, user.toPublicJSON()];
                                case 3: return [2 /*return*/, (_a.data = (_b.user = _c.sent(),
                                        _b.subscription = currentSubscription,
                                        _b),
                                        _a)];
                            }
                        });
                    }); }, 300)];
            case 1:
                data = _a.sent();
                res.json(data);
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/users - Listar usuarios (admin/operator)
router.get("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, limit, _c, offset, role, isActive, search, approved, subscriptionType, where, conditions, subscriptionInclude, users, _d, _e;
    var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    return __generator(this, function (_v) {
        switch (_v.label) {
            case 0:
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, role = _a.role, isActive = _a.isActive, search = _a.search, approved = _a.approved, subscriptionType = _a.subscriptionType;
                where = {};
                if (role)
                    where.role = role;
                if (isActive !== undefined)
                    where.isActive = isActive === "true";
                if (approved !== undefined)
                    where.approved = approved === "true";
                // ⚡ PERFORMANCE OPTIMIZATION: Only operators can see non-admin/operator users
                if (req.user.role === "operator") {
                    where.role = (_f = {}, _f[sequelize_1.Op.in] = ["venue", "user", "gallera"], _f);
                }
                conditions = [];
                // Add search filter
                if (search) {
                    conditions.push((_g = {},
                        _g[sequelize_1.Op.or] = [
                            { username: (_h = {}, _h[sequelize_1.Op.iLike] = "%".concat(search, "%"), _h) },
                            { email: (_j = {}, _j[sequelize_1.Op.iLike] = "%".concat(search, "%"), _j) },
                        ],
                        _g));
                }
                subscriptionInclude = [{
                        model: models_1.Subscription,
                        as: "subscriptions", // Must specify alias as defined in User.hasMany(Subscription, { as: "subscriptions" })
                        attributes: ['type', 'status', 'expiresAt', 'manual_expires_at', 'createdAt'],
                        required: false, // LEFT JOIN - include users with or without subscriptions
                        separate: true, // Fetch separately to get latest subscription only
                        order: [['createdAt', 'DESC']],
                        limit: 1, // Get only the most recent subscription
                    }];
                // Apply subscription type filters ONLY if specified
                if (subscriptionType === 'free') {
                    // Find users WITH NO active subscription OR with status='free'
                    subscriptionInclude = [{
                            model: models_1.Subscription,
                            as: "subscriptions",
                            attributes: ['type', 'status', 'expiresAt'],
                            required: false, // LEFT JOIN to include users without subscriptions
                            where: (_k = {},
                                _k[sequelize_1.Op.or] = [
                                    { status: 'free' },
                                    (_l = {},
                                        _l[sequelize_1.Op.and] = [
                                            { expiresAt: (_m = {}, _m[sequelize_1.Op.lte] = new Date(), _m) },
                                            { status: 'active' }
                                        ],
                                        _l)
                                ],
                                _k)
                        }];
                    // Then filter to only include users where the subscription is NULL (no subscription) OR matches the free criteria
                    conditions.push((_o = {},
                        _o[sequelize_1.Op.or] = [
                            { '$subscriptions.id$': null }, // Users with no subscription (free by default)
                            { '$subscriptions.status$': 'free' },
                            (_p = {},
                                _p[sequelize_1.Op.and] = [
                                    { '$subscriptions.expiresAt$': (_q = {}, _q[sequelize_1.Op.lte] = new Date(), _q) },
                                    { '$subscriptions.status$': 'active' }
                                ],
                                _p)
                        ],
                        _o));
                }
                else if (subscriptionType === 'monthly') {
                    subscriptionInclude = [{
                            model: models_1.Subscription,
                            as: "subscriptions",
                            attributes: ['type', 'status', 'expiresAt'],
                            required: true, // INNER JOIN - only users WITH matching subscription
                            where: {
                                type: 'monthly',
                                status: 'active',
                                expiresAt: (_r = {}, _r[sequelize_1.Op.gt] = new Date(), _r)
                            }
                        }];
                }
                else if (subscriptionType === 'daily') {
                    subscriptionInclude = [{
                            model: models_1.Subscription,
                            as: "subscriptions",
                            attributes: ['type', 'status', 'expiresAt'],
                            required: true, // INNER JOIN - only users WITH matching subscription
                            where: {
                                type: 'daily',
                                status: 'active',
                                expiresAt: (_s = {}, _s[sequelize_1.Op.gt] = new Date(), _s)
                            }
                        }];
                }
                // Combine all conditions if any exist
                if (conditions.length > 0) {
                    where[sequelize_1.Op.and] = conditions;
                }
                return [4 /*yield*/, models_1.User.findAndCountAll({
                        where: where,
                        limit: Math.min(parseInt(limit), 100),
                        offset: parseInt(offset),
                        attributes: {
                            exclude: ["passwordHash", "verificationToken"],
                        },
                        include: subscriptionInclude,
                        order: [["createdAt", "DESC"]],
                    })];
            case 1:
                users = _v.sent();
                _e = (_d = res).json;
                _t = {
                    success: true
                };
                _u = {};
                return [4 /*yield*/, Promise.all(users.rows.map(function (u) { return u.toPublicJSON(); }))];
            case 2:
                _e.apply(_d, [(_t.data = (_u.users = _v.sent(),
                        _u.pagination = {
                            total: users.count,
                            limit: parseInt(limit),
                            offset: parseInt(offset),
                        },
                        _u),
                        _t)]);
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/users/:id - Obtener usuario específico (admin/operator/self)
router.get("/:id", auth_1.authenticate, (0, express_validator_1.param)("id").isUUID().withMessage("Valid user ID required"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, targetUser, _a, _b;
    var _c;
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
                userId = req.params.id;
                // Check permissions
                if (req.user.role !== "admin" &&
                    req.user.role !== "operator" &&
                    req.user.id !== userId) {
                    throw errorHandler_1.errors.forbidden("Insufficient permissions");
                }
                return [4 /*yield*/, models_1.User.findByPk(userId, {
                        attributes: {
                            exclude: ["passwordHash", "verificationToken"],
                        },
                    })];
            case 1:
                targetUser = _d.sent();
                if (!targetUser) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                if (req.user.role === "operator" &&
                    ["admin", "operator"].includes(targetUser.role)) {
                    throw errorHandler_1.errors.forbidden("Operators cannot view admin or operator accounts");
                }
                _b = (_a = res).json;
                _c = {
                    success: true
                };
                return [4 /*yield*/, targetUser.toPublicJSON()];
            case 2:
                _b.apply(_a, [(_c.data = _d.sent(),
                        _c)]);
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/users/profile - Actualizar perfil propio
router.put("/profile", auth_1.authenticate, [
    (0, express_validator_1.body)("profileInfo")
        .optional()
        .isObject()
        .withMessage("Profile info must be an object"),
    (0, express_validator_1.body)("profileInfo.fullName")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("profileInfo.phoneNumber")
        .optional({ checkFalsy: true })
        .custom(function (value) {
        // If value is empty/falsy, skip validation
        if (!value)
            return true;
        // If value exists, validate format
        if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
            throw new Error("Invalid phone number format");
        }
        return true;
    }),
    (0, express_validator_1.body)("profileInfo.address")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Address must be less than 500 characters")
        .trim(),
    (0, express_validator_1.body)("profileInfo.businessName")
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage("Business name must be between 2 and 100 characters")
        .trim()
        .escape(),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, profileInfo, user, requiredFields, _i, requiredFields_1, field, Venue, venue, venueError_1, Gallera, gallera, galleraError_1, _a, _b, error_1;
    var _c;
    var _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                // 🔒 PROTECTION: Prevent modifications to read-only fields
                if (req.body.username !== undefined || req.body.email !== undefined) {
                    throw errorHandler_1.errors.badRequest("Fields 'username' and 'email' are read-only and cannot be modified");
                }
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                profileInfo = req.body.profileInfo;
                return [4 /*yield*/, models_1.User.findByPk(req.user.id)];
            case 1:
                user = _j.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                // Validate business-specific fields for venue/gallera accounts
                if (profileInfo && ['venue', 'gallera'].includes(user.role)) {
                    requiredFields = ['businessName'];
                    for (_i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
                        field = requiredFields_1[_i];
                        if (profileInfo[field] && profileInfo[field].trim().length < 2) {
                            throw errorHandler_1.errors.badRequest("".concat(field, " is required for ").concat(user.role, " accounts"));
                        }
                    }
                }
                // Validate image array limits for venue and gallera accounts
                if (profileInfo) {
                    // Validate gallera images: max 3
                    if (profileInfo.galleraImages && Array.isArray(profileInfo.galleraImages)) {
                        if (profileInfo.galleraImages.length > 3) {
                            throw errorHandler_1.errors.badRequest("Maximum 3 images allowed for galleras");
                        }
                    }
                    // Validate venue images: max 2
                    if (profileInfo.venueImages && Array.isArray(profileInfo.venueImages)) {
                        if (profileInfo.venueImages.length > 2) {
                            throw errorHandler_1.errors.badRequest("Maximum 2 images allowed for venues");
                        }
                    }
                }
                if (profileInfo) {
                    // Initialize profileInfo if it doesn't exist
                    if (!user.profileInfo) {
                        user.profileInfo = { verificationLevel: "none" };
                    }
                    // Merge profile information, ensuring proper data types
                    user.profileInfo = __assign(__assign(__assign({}, user.profileInfo), profileInfo), { 
                        // Ensure certain fields are properly sanitized
                        verificationLevel: ((_d = user.profileInfo) === null || _d === void 0 ? void 0 : _d.verificationLevel) || "none" });
                    console.log('Updated user profileInfo:', JSON.stringify(user.profileInfo, null, 2));
                }
                _j.label = 2;
            case 2:
                _j.trys.push([2, 22, , 23]);
                return [4 /*yield*/, user.save()];
            case 3:
                _j.sent();
                console.log('User saved successfully');
                if (!(profileInfo && user.role === 'venue' && profileInfo.venueName)) return [3 /*break*/, 11];
                _j.label = 4;
            case 4:
                _j.trys.push([4, 10, , 11]);
                Venue = require('../models').Venue;
                return [4 /*yield*/, Venue.findOne({ where: { ownerId: user.id } })];
            case 5:
                venue = _j.sent();
                if (!venue) return [3 /*break*/, 7];
                // Update existing venue
                return [4 /*yield*/, venue.update({
                        name: profileInfo.venueName,
                        location: profileInfo.venueLocation || venue.location,
                        description: profileInfo.venueDescription || venue.description,
                        contactInfo: __assign(__assign({}, venue.contactInfo), { email: profileInfo.venueEmail || ((_e = venue.contactInfo) === null || _e === void 0 ? void 0 : _e.email), website: profileInfo.venueWebsite || ((_f = venue.contactInfo) === null || _f === void 0 ? void 0 : _f.website) })
                    })];
            case 6:
                // Update existing venue
                _j.sent();
                console.log('Venue data synchronized with user profile');
                return [3 /*break*/, 9];
            case 7:
                if (!(profileInfo.venueName && profileInfo.venueLocation)) return [3 /*break*/, 9];
                // Create new venue record
                return [4 /*yield*/, Venue.create({
                        name: profileInfo.venueName,
                        location: profileInfo.venueLocation,
                        description: profileInfo.venueDescription || '',
                        ownerId: user.id,
                        contactInfo: {
                            email: profileInfo.venueEmail,
                            website: profileInfo.venueWebsite,
                        }
                    })];
            case 8:
                // Create new venue record
                _j.sent();
                console.log('New venue record created from user profile');
                _j.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                venueError_1 = _j.sent();
                console.error('Error synchronizing venue data:', venueError_1);
                return [3 /*break*/, 11];
            case 11:
                if (!(profileInfo && user.role === 'gallera' && profileInfo.galleraName)) return [3 /*break*/, 19];
                _j.label = 12;
            case 12:
                _j.trys.push([12, 18, , 19]);
                Gallera = require('../models').Gallera;
                return [4 /*yield*/, Gallera.findOne({ where: { ownerId: user.id } })];
            case 13:
                gallera = _j.sent();
                if (!gallera) return [3 /*break*/, 15];
                // Update existing gallera
                return [4 /*yield*/, gallera.update({
                        name: profileInfo.galleraName,
                        location: profileInfo.galleraLocation || gallera.location,
                        description: profileInfo.galleraDescription || gallera.description,
                        specialties: profileInfo.galleraSpecialties ? { specialties: profileInfo.galleraSpecialties } : gallera.specialties,
                        activeRoosters: profileInfo.galleraActiveRoosters || gallera.activeRoosters,
                        contactInfo: __assign(__assign({}, gallera.contactInfo), { email: profileInfo.galleraEmail || ((_g = gallera.contactInfo) === null || _g === void 0 ? void 0 : _g.email), website: profileInfo.galleraWebsite || ((_h = gallera.contactInfo) === null || _h === void 0 ? void 0 : _h.website) })
                    })];
            case 14:
                // Update existing gallera
                _j.sent();
                console.log('Gallera data synchronized with user profile');
                return [3 /*break*/, 17];
            case 15:
                if (!(profileInfo.galleraName && profileInfo.galleraLocation)) return [3 /*break*/, 17];
                // Create new gallera record
                return [4 /*yield*/, Gallera.create({
                        name: profileInfo.galleraName,
                        location: profileInfo.galleraLocation,
                        description: profileInfo.galleraDescription || '',
                        ownerId: user.id,
                        specialties: profileInfo.galleraSpecialties ? { specialties: profileInfo.galleraSpecialties } : null,
                        activeRoosters: profileInfo.galleraActiveRoosters || 0,
                        contactInfo: {
                            email: profileInfo.galleraEmail,
                            website: profileInfo.galleraWebsite,
                        }
                    })];
            case 16:
                // Create new gallera record
                _j.sent();
                console.log('New gallera record created from user profile');
                _j.label = 17;
            case 17: return [3 /*break*/, 19];
            case 18:
                galleraError_1 = _j.sent();
                console.error('Error synchronizing gallera data:', galleraError_1);
                return [3 /*break*/, 19];
            case 19: 
            // ⚡ Invalidate cache after successful update
            return [4 /*yield*/, (0, redis_1.invalidatePattern)("user:profile:".concat(req.user.id))];
            case 20:
                // ⚡ Invalidate cache after successful update
                _j.sent();
                _b = (_a = res).json;
                _c = {
                    success: true,
                    message: "Profile updated successfully"
                };
                return [4 /*yield*/, user.toPublicJSON()];
            case 21:
                _b.apply(_a, [(_c.data = _j.sent(),
                        _c)]);
                return [3 /*break*/, 23];
            case 22:
                error_1 = _j.sent();
                console.error('Error saving user:', error_1);
                throw errorHandler_1.errors.internal("Failed to save user profile");
            case 23: return [2 /*return*/];
        }
    });
}); }));
// PUT /api/users/:userId/profile-info - Update profile info for any user (admin/operator only)
router.put("/:userId/profile-info", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("userId").isUUID().withMessage("Invalid user ID required"),
    (0, express_validator_1.body)("venueName")
        .optional()
        .isString()
        .isLength({ min: 3, max: 100 })
        .withMessage("Venue name must be between 3 and 100 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("venueLocation")
        .optional()
        .isString()
        .isLength({ max: 200 })
        .withMessage("Venue location must be less than 200 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("venueDescription")
        .optional()
        .isString()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Venue description must be between 10 and 1000 characters")
        .trim(),
    (0, express_validator_1.body)("venueEmail")
        .optional()
        .isEmail()
        .withMessage("Valid email required")
        .normalizeEmail(),
    (0, express_validator_1.body)("venueWebsite")
        .optional()
        .isURL()
        .withMessage("Valid URL required")
        .trim(),
    (0, express_validator_1.body)("galleraName")
        .optional()
        .isString()
        .isLength({ min: 3, max: 100 })
        .withMessage("Gallera name must be between 3 and 100 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("galleraLocation")
        .optional()
        .isString()
        .isLength({ max: 200 })
        .withMessage("Gallera location must be less than 200 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("galleraDescription")
        .optional()
        .isString()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Gallera description must be between 10 and 1000 characters")
        .trim(),
    (0, express_validator_1.body)("galleraEmail")
        .optional()
        .isEmail()
        .withMessage("Valid email required")
        .normalizeEmail(),
    (0, express_validator_1.body)("galleraWebsite")
        .optional()
        .isURL()
        .withMessage("Valid URL required")
        .trim(),
    (0, express_validator_1.body)("businessName")
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ min: 2, max: 100 })
        .withMessage("Business name must be between 2 and 100 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("location")
        .optional()
        .isString()
        .isLength({ max: 200 })
        .withMessage("Location must be less than 200 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("description")
        .optional()
        .isString()
        .isLength({ min: 10, max: 1000 })
        .withMessage("Description must be between 10 and 1000 characters")
        .trim(),
    (0, express_validator_1.body)("establishedDate")
        .optional()
        .isISO8601()
        .withMessage("Valid ISO date required"),
    (0, express_validator_1.body)("certified")
        .optional()
        .isBoolean()
        .withMessage("Certified must be a boolean"),
    (0, express_validator_1.body)("imageUrl")
        .optional()
        .isURL()
        .withMessage("Valid URL required")
        .trim(),
    (0, express_validator_1.body)("images")
        .optional()
        .isArray()
        .withMessage("Images must be an array"),
    (0, express_validator_1.body)("images.*")
        .optional()
        .isURL()
        .withMessage("Each image must be a valid URL")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, profileInfoUpdate, targetUser, user, updatedProfileInfo, _a, _b;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                userId = req.params.userId;
                profileInfoUpdate = req.body;
                if (!(req.user.role === "operator")) return [3 /*break*/, 2];
                return [4 /*yield*/, models_1.User.findByPk(userId)];
            case 1:
                targetUser = _e.sent();
                if (!targetUser || ["admin", "operator"].includes(targetUser.role)) {
                    throw errorHandler_1.errors.forbidden("Operators can only update venue/gallera/user roles");
                }
                _e.label = 2;
            case 2: return [4 /*yield*/, models_1.User.findByPk(userId)];
            case 3:
                user = _e.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                updatedProfileInfo = __assign(__assign({}, user.profileInfo), profileInfoUpdate);
                // Update user
                return [4 /*yield*/, user.update({ profileInfo: updatedProfileInfo })];
            case 4:
                // Update user
                _e.sent();
                // ⚡ CRITICAL: Invalidate cache
                return [4 /*yield*/, (0, redis_1.invalidatePattern)("user:".concat(userId, ":*"))];
            case 5:
                // ⚡ CRITICAL: Invalidate cache
                _e.sent();
                // ✅ FASE 5: Venue/Gallera models consolidated into User.profileInfo
                // All business entity data now stored directly in profileInfo field
                _b = (_a = res).json;
                _c = {
                    success: true,
                    message: "Profile info updated successfully"
                };
                _d = {};
                return [4 /*yield*/, user.toPublicJSON()];
            case 6:
                // ✅ FASE 5: Venue/Gallera models consolidated into User.profileInfo
                // All business entity data now stored directly in profileInfo field
                _b.apply(_a, [(_c.data = (_d.user = _e.sent(), _d),
                        _c)]);
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/users - Crear usuario (admin/operator)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("username")
        .isLength({ min: 3, max: 50 })
        .withMessage("Username must be between 3 and 50 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username must contain only letters, numbers, and underscores")
        .trim()
        .toLowerCase(),
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Valid email required")
        .normalizeEmail()
        .trim()
        .toLowerCase(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
    (0, express_validator_1.body)("role")
        .isIn(["admin", "operator", "venue", "user", "gallera"])
        .withMessage("Invalid role"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, username, email, password, role, profileInfo, existingUser, user, _b, _c;
    var _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, username = _a.username, email = _a.email, password = _a.password, role = _a.role, profileInfo = _a.profileInfo;
                // ⚡ SECURITY: Operators can only create venue/user/gallera accounts
                if (req.user.role === "operator" && !["venue", "user", "gallera"].includes(role)) {
                    throw errorHandler_1.errors.forbidden("Operators can only create venue, user, or gallera accounts");
                }
                // ⚡ SECURITY: Only admins can create admin/operator accounts
                if (["admin", "operator"].includes(role) && req.user.role !== "admin") {
                    throw errorHandler_1.errors.forbidden("Only admins can create admin/operator accounts");
                }
                return [4 /*yield*/, models_1.User.findOne({
                        where: (_d = {},
                            _d[sequelize_1.Op.or] = [{ email: email }, { username: username }],
                            _d),
                    })];
            case 1:
                existingUser = _f.sent();
                if (existingUser) {
                    throw errorHandler_1.errors.conflict("User with this email or username already exists");
                }
                return [4 /*yield*/, models_1.User.create({
                        username: username,
                        email: email,
                        passwordHash: password,
                        role: role,
                        isActive: true,
                        approved: true, // ✅ Admin-created users are auto-approved
                        profileInfo: __assign({ verificationLevel: "none" }, (profileInfo || {})),
                    })];
            case 2:
                user = _f.sent();
                _c = (_b = res.status(201)).json;
                _e = {
                    success: true,
                    message: "User created successfully"
                };
                return [4 /*yield*/, user.toPublicJSON()];
            case 3:
                _c.apply(_b, [(_e.data = _f.sent(),
                        _e)]);
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/users/:id - Actualizar usuario (admin/operator)
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("id").isUUID().withMessage("Valid user ID required"),
    (0, express_validator_1.body)("role")
        .optional()
        .isIn(["admin", "operator", "venue", "user", "gallera"])
        .withMessage("Invalid role"),
    (0, express_validator_1.body)("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allowedFields, invalidFields, validationErrors, userId, _a, role, isActive, targetUser, _b, _c;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                allowedFields = ["role", "isActive"];
                invalidFields = Object.keys(req.body).filter(function (key) { return !allowedFields.includes(key); });
                if (invalidFields.length > 0) {
                    throw errorHandler_1.errors.badRequest("Only 'role' and 'isActive' fields can be modified. Invalid fields: ".concat(invalidFields.join(", ")));
                }
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                userId = req.params.id;
                _a = req.body, role = _a.role, isActive = _a.isActive;
                return [4 /*yield*/, models_1.User.findByPk(userId)];
            case 1:
                targetUser = _e.sent();
                if (!targetUser) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                // ⚡ SECURITY: Operators cannot modify admin/operator accounts
                if (req.user.role === "operator") {
                    if (["admin", "operator"].includes(targetUser.role)) {
                        throw errorHandler_1.errors.forbidden("Operators cannot modify admin or operator accounts");
                    }
                    if (role && ["admin", "operator"].includes(role)) {
                        throw errorHandler_1.errors.forbidden("Operators cannot assign admin or operator roles");
                    }
                }
                // Update allowed fields
                if (role !== undefined)
                    targetUser.role = role;
                if (isActive !== undefined)
                    targetUser.isActive = isActive;
                return [4 /*yield*/, targetUser.save()];
            case 2:
                _e.sent();
                _c = (_b = res).json;
                _d = {
                    success: true,
                    message: "User updated successfully"
                };
                return [4 /*yield*/, targetUser.toPublicJSON()];
            case 3:
                _c.apply(_b, [(_d.data = _e.sent(),
                        _d)]);
                return [2 /*return*/];
        }
    });
}); }));
// DELETE /api/users/:id - Desactivar usuario (solo admin)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, express_validator_1.param)("id").isUUID().withMessage("Valid user ID required"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, user, _a, _b;
    var _c;
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
                userId = req.params.id;
                return [4 /*yield*/, models_1.User.findByPk(userId)];
            case 1:
                user = _d.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                // Don't allow deleting other admins
                if (user.role === "admin" && user.id !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("Cannot delete other admin accounts");
                }
                user.isActive = false;
                return [4 /*yield*/, user.save()];
            case 2:
                _d.sent();
                _b = (_a = res).json;
                _c = {
                    success: true,
                    message: "User deactivated successfully"
                };
                return [4 /*yield*/, user.toPublicJSON()];
            case 3:
                _b.apply(_a, [(_c.data = _d.sent(),
                        _c)]);
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/users/:id/business-entity - Obtener entidad de negocio asociada (optimización)
router.get("/:id/business-entity", auth_1.optionalAuth, [
    (0, express_validator_1.param)("id").isUUID().withMessage("Valid user ID required"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, cacheKey, data;
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
                userId = req.params.id;
                cacheKey = "user:business-entity:".concat(userId);
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var user;
                        var _a, _b, _c, _d, _e, _f;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0: return [4 /*yield*/, models_1.User.findByPk(userId)];
                                case 1:
                                    user = _g.sent();
                                    if (!user) {
                                        throw errorHandler_1.errors.notFound("User not found");
                                    }
                                    // Check if user is venue or gallera
                                    // UPDATED: Venue/Gallera data now in user.profileInfo
                                    if (user.role === "venue") {
                                        return [2 /*return*/, {
                                                success: true,
                                                data: {
                                                    type: "venue",
                                                    entity: __assign({ id: user.id, ownerId: user.id, name: ((_a = user.profileInfo) === null || _a === void 0 ? void 0 : _a.venueName) || null, location: ((_b = user.profileInfo) === null || _b === void 0 ? void 0 : _b.venueLocation) || null, description: ((_c = user.profileInfo) === null || _c === void 0 ? void 0 : _c.venueDescription) || null }, user.profileInfo),
                                                },
                                            }];
                                    }
                                    else if (user.role === "gallera") {
                                        return [2 /*return*/, {
                                                success: true,
                                                data: {
                                                    type: "gallera",
                                                    entity: __assign({ id: user.id, ownerId: user.id, name: ((_d = user.profileInfo) === null || _d === void 0 ? void 0 : _d.galleraName) || null, location: ((_e = user.profileInfo) === null || _e === void 0 ? void 0 : _e.galleraLocation) || null, description: ((_f = user.profileInfo) === null || _f === void 0 ? void 0 : _f.galleraDescription) || null }, user.profileInfo),
                                                },
                                            }];
                                    }
                                    else {
                                        // User is not a business entity
                                        return [2 /*return*/, {
                                                success: true,
                                                data: {
                                                    type: null,
                                                    entity: null,
                                                },
                                            }];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); }, 300)];
            case 1:
                data = _a.sent();
                res.json(data);
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/users/:id/approve - Aprobar usuario (solo admin)
router.put("/:id/approve", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, express_validator_1.param)("id").isUUID().withMessage("Valid user ID required"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, user, _a, _b;
    var _c;
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
                userId = req.params.id;
                return [4 /*yield*/, models_1.User.findByPk(userId)];
            case 1:
                user = _d.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                if (user.approved) {
                    throw errorHandler_1.errors.badRequest("User is already approved");
                }
                user.approved = true;
                return [4 /*yield*/, user.save()];
            case 2:
                _d.sent();
                _b = (_a = res).json;
                _c = {
                    success: true,
                    message: "User approved successfully"
                };
                return [4 /*yield*/, user.toPublicJSON()];
            case 3:
                _b.apply(_a, [(_c.data = _d.sent(),
                        _c)]);
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/users/:id/reject - Rechazar usuario (solo admin)
router.put("/:id/reject", auth_1.authenticate, (0, auth_1.authorize)("admin"), [
    (0, express_validator_1.param)("id").isUUID().withMessage("Valid user ID required"),
    (0, express_validator_1.body)("reason").optional().isString().trim(),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, user, _a, _b;
    var _c;
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
                userId = req.params.id;
                return [4 /*yield*/, models_1.User.findByPk(userId)];
            case 1:
                user = _d.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                if (user.approved) {
                    throw errorHandler_1.errors.badRequest("Cannot reject already approved user");
                }
                // Desactivar usuario al rechazar
                user.isActive = false;
                return [4 /*yield*/, user.save()];
            case 2:
                _d.sent();
                // TODO: Enviar email de rechazo a usuario
                _b = (_a = res).json;
                _c = {
                    success: true,
                    message: "User rejected successfully"
                };
                return [4 /*yield*/, user.toPublicJSON()];
            case 3:
                // TODO: Enviar email de rechazo a usuario
                _b.apply(_a, [(_c.data = _d.sent(),
                        _c)]);
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
