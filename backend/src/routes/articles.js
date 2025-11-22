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
// 2. backend/src/routes/articles.ts
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var sanitization_1 = require("../middleware/sanitization");
var Article_1 = require("../models/Article");
var User_1 = require("../models/User");
var express_validator_1 = require("express-validator");
var sequelize_1 = require("sequelize");
var redis_1 = require("../config/redis"); // ⚡ OPTIMIZATION: Redis caching
// ⚡ HELPER: Serialize article (handles both Sequelize instances and plain objects from cache)
function serializeArticle(article, attributes) {
    var _a;
    // If it's a Sequelize instance with toJSON method
    if (typeof article.toJSON === 'function') {
        return article.toJSON({ attributes: attributes });
    }
    // If it's a plain object from cache
    var result = {};
    if (attributes) {
        // Filter by requested attributes
        for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
            var attr = attributes_1[_i];
            if (article[attr] !== undefined) {
                result[attr] = article[attr];
            }
        }
    }
    else {
        // Return all attributes
        Object.assign(result, article);
    }
    // Apply same transformations as Article.toJSON()
    if (article.author && !result.author_name) {
        result.author_name = article.author.username;
    }
    if (article.venue && !result.venue_name) {
        result.venue_name = ((_a = article.venue.profileInfo) === null || _a === void 0 ? void 0 : _a.venueName) || article.venue.username;
    }
    // ⚡ KEEP BOTH: featured_image (for frontend) and featured_image_url (for consistency)
    if (result.featured_image && !result.featured_image_url) {
        result.featured_image_url = result.featured_image;
        // DON'T delete featured_image - frontend needs it
    }
    if (result.excerpt !== undefined && result.summary === undefined) {
        result.summary = result.excerpt;
        // DON'T delete excerpt - may be needed
    }
    // ✅ Add author subscription info for premium content detection
    if (article.author && article.author.subscription) {
        result.author_subscription = article.author.subscription;
        // Determine if content is premium based on author's active subscription
        result.is_premium_content = article.author.subscription.status === 'active' &&
            article.author.subscription.type !== 'free';
    }
    else if (article.author && !result.author_subscription) {
        // Default to free content if no subscription info
        result.is_premium_content = false;
    }
    return result;
}
function getArticleAttributes(role, type) {
    var publicAttributes = [
        "id",
        "title",
        "excerpt",
        "category",
        "status",
        "published_at",
        "author_id",
        "featured_image",
        "created_at",
        "updated_at",
    ];
    var authenticatedAttributes = __spreadArray(__spreadArray([], publicAttributes, true), [
        "content",
        "tags",
        "venue_id",
        "view_count",
    ], false);
    switch (role) {
        case "admin":
        case "operator":
            return undefined; // Return all attributes
        case "user":
        case "gallera":
        case "venue":
            return type === "list" ? publicAttributes : authenticatedAttributes;
        default:
            return publicAttributes;
    }
}
var router = (0, express_1.Router)();
// ⚡ PERFORMANCE OPTIMIZED: Articles list with aggressive caching
router.get("/", auth_1.optionalAuth, [
    // Accept empty strings as "not provided" with checkFalsy to avoid 500s from UI sending ''
    (0, express_validator_1.query)("search").optional({ checkFalsy: true }).isString(),
    (0, express_validator_1.query)("status").optional({ checkFalsy: true }).isIn(["published", "pending", "draft", "archived"]),
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1, max: 1000 }).toInt(),
    (0, express_validator_1.query)("author_id").optional({ checkFalsy: true }).isUUID(),
    (0, express_validator_1.query)("includeAuthor").optional({ checkFalsy: true }).isString().custom(function (value) {
        if (value === 'true' || value === 'false') {
            return true;
        }
        throw new Error('includeAuthor must be true or false');
    }),
    (0, express_validator_1.query)("includeVenue").optional({ checkFalsy: true }).isString().custom(function (value) {
        if (value === 'true' || value === 'false') {
            return true;
        }
        throw new Error('includeVenue must be true or false');
    }),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, search, author_id, _b, rawStatus, _c, includeAuthor, _d, includeVenue, limit, offset, includeAuthorBool, includeVenueBool, isPrivileged, status, cacheKey, whereClause, attributes, result, count, rows, totalPages, currentPage;
    var _e, _f;
    var _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    // Return 400 instead of 500 when query params are invalid
                    throw errorHandler_1.errors.badRequest("Invalid parameters");
                }
                _a = req.query, search = _a.search, author_id = _a.author_id, _b = _a.status, rawStatus = _b === void 0 ? "published" : _b, _c = _a.includeAuthor, includeAuthor = _c === void 0 ? true : _c, _d = _a.includeVenue, includeVenue = _d === void 0 ? true : _d;
                limit = Math.min(parseInt(req.query.limit) || 10, 50);
                offset = Math.max(parseInt(req.query.offset) || 0, 0);
                includeAuthorBool = includeAuthor === 'true' || includeAuthor === true;
                includeVenueBool = includeVenue === 'true' || includeVenue === true;
                isPrivileged = !!req.user && ["admin", "operator"].includes(req.user.role);
                status = isPrivileged ? rawStatus : "published";
                cacheKey = "articles_list_".concat(status, "_").concat(limit, "_").concat(offset, "_").concat(search || 'none', "_").concat(author_id || 'none', "_").concat(includeAuthorBool, "_").concat(includeVenueBool);
                whereClause = { status: status };
                if (search) {
                    whereClause[sequelize_1.Op.or] = [
                        { title: (_e = {}, _e[sequelize_1.Op.iLike] = "%".concat(search, "%"), _e) },
                        { excerpt: (_f = {}, _f[sequelize_1.Op.iLike] = "%".concat(search, "%"), _f) },
                    ];
                }
                if (author_id) {
                    whereClause.author_id = author_id;
                }
                attributes = getArticleAttributes((_g = req.user) === null || _g === void 0 ? void 0 : _g.role, "list");
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Article_1.Article.findAndCountAll({
                                        where: whereClause,
                                        attributes: attributes,
                                        include: [
                                            includeAuthorBool && {
                                                model: User_1.User,
                                                as: "author",
                                                attributes: ["id", "username"],
                                                separate: false,
                                                // ✅ Include subscription info for premium content detection
                                                include: [
                                                    {
                                                        model: require('../models/Subscription').Subscription,
                                                        as: "subscriptions",
                                                        attributes: ["id", "type", "status", "expiresAt"],
                                                        where: {
                                                            status: 'active'
                                                        },
                                                        required: false,
                                                    }
                                                ]
                                            },
                                        ].filter(Boolean),
                                        order: [
                                            ["published_at", "DESC"],
                                            ["created_at", "DESC"],
                                        ],
                                        limit: limit,
                                        offset: offset,
                                    })];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); }, 120)];
            case 1:
                result = _h.sent();
                count = result.count, rows = result.rows;
                totalPages = Math.ceil(count / limit);
                currentPage = Math.floor(offset / limit) + 1;
                res.json({
                    success: true,
                    data: {
                        articles: rows.map(function (article) { return serializeArticle(article, attributes); }),
                        pagination: {
                            limit: limit,
                            offset: offset,
                            total: count,
                            totalPages: totalPages,
                            currentPage: currentPage,
                            hasNext: offset + limit < count,
                            hasPrev: offset > 0,
                            nextOffset: offset + limit < count ? offset + limit : null,
                            prevOffset: offset > 0 ? Math.max(0, offset - limit) : null
                        }
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ CRITICAL FIX: Featured articles endpoint MUST come before /:id route
router.get("/featured", auth_1.optionalAuth, [
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    (0, express_validator_1.query)("type").optional().isIn(["banner", "highlight", "trending"]),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, _b, limit, _c, type, attributes, cacheKey, featuredArticles;
    var _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Invalid parameters");
                }
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 5 : _b, _c = _a.type, type = _c === void 0 ? "banner" : _c;
                attributes = getArticleAttributes((_d = req.user) === null || _d === void 0 ? void 0 : _d.role, "list");
                cacheKey = "articles_featured_".concat(type, "_").concat(limit, "_").concat(((_e = req.user) === null || _e === void 0 ? void 0 : _e.role) || 'public');
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, Article_1.Article.findAll({
                                        where: {
                                            status: "published",
                                            featured_image: (_a = {}, _a[sequelize_1.Op.ne] = null, _a), // Only articles with images for banners
                                        },
                                        attributes: attributes,
                                        include: [
                                            {
                                                model: User_1.User,
                                                as: "author",
                                                attributes: ["id", "username"],
                                                separate: false,
                                            },
                                        ],
                                        order: [["published_at", "DESC"]],
                                        limit: parseInt(limit),
                                    })];
                                case 1: return [2 /*return*/, _b.sent()];
                            }
                        });
                    }); }, 180)];
            case 1:
                featuredArticles = _f.sent();
                res.json({
                    success: true,
                    data: {
                        articles: featuredArticles.map(function (article) { return serializeArticle(article, attributes); }),
                        type: type,
                        total: featuredArticles.length,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ PERFORMANCE OPTIMIZED: Single article with caching
router.get("/:id", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var attributes, cacheKey, article, isAdmin, isAuthor;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                attributes = getArticleAttributes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role, "detail");
                cacheKey = "article_detail_".concat(req.params.id, "_").concat(((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'public');
                return [4 /*yield*/, (0, redis_1.getOrSet)(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Article_1.Article.findByPk(req.params.id, {
                                        attributes: attributes,
                                        include: [
                                            {
                                                model: User_1.User,
                                                as: "author",
                                                attributes: ["id", "username"],
                                                separate: false,
                                                // ✅ Include subscription info for premium content detection
                                                include: [
                                                    {
                                                        model: require('../models/Subscription').Subscription,
                                                        as: "subscriptions",
                                                        attributes: ["id", "type", "status", "expiresAt"],
                                                        where: {
                                                            status: 'active'
                                                        },
                                                        required: false,
                                                    }
                                                ]
                                            },
                                        ],
                                    })];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); }, 300)];
            case 1:
                article = _c.sent();
                if (!article) {
                    throw errorHandler_1.errors.notFound("Article not found");
                }
                isAdmin = !!req.user && req.user.role === "admin";
                isAuthor = !!req.user && req.user.id === article.author_id;
                // Solo mostrar artículos no publicados a admin o autor
                if (article.status !== "published" && !isAdmin && !isAuthor) {
                    throw errorHandler_1.errors.forbidden("Article not available");
                }
                res.json({
                    success: true,
                    data: serializeArticle(article, attributes),
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZATION: Article creation with cache invalidation
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "gallera", "user", "venue"), [
    (0, express_validator_1.body)("title").isString().isLength({ min: 5, max: 255 }),
    (0, express_validator_1.body)("content").isString().isLength({ min: 10 }),
    (0, express_validator_1.body)("excerpt").isString().isLength({ min: 10, max: 500 }),
    (0, express_validator_1.body)("featured_image").optional({ checkFalsy: true }).isURL(),
    (0, express_validator_1.body)("featured_image_url").optional({ checkFalsy: true }).isURL(),
    (0, express_validator_1.body)("status").optional().isIn(["draft", "pending", "published", "archived"]),
], sanitization_1.sanitizeArticleContent, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, title, content, excerpt, venue_id, featured_image, featured_image_url, requestedStatus, featuredImage, articleStatus, publishedAt, article;
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
                _a = req.body, title = _a.title, content = _a.content, excerpt = _a.excerpt, venue_id = _a.venue_id, featured_image = _a.featured_image, featured_image_url = _a.featured_image_url, requestedStatus = _a.status;
                featuredImage = featured_image || featured_image_url;
                articleStatus = "published";
                publishedAt = new Date();
                if (req.user.role === "gallera" || req.user.role === "user") {
                    // Galleras/users can create drafts or pending articles
                    // If they request "draft", keep it as draft
                    // Otherwise, default to "pending" for review
                    articleStatus = (requestedStatus === "draft") ? "draft" : "pending";
                    publishedAt = undefined;
                }
                else if (req.user.role === "admin" || req.user.role === "operator") {
                    // Admins/operators can use any status including published
                    articleStatus = requestedStatus || "published";
                    publishedAt = (articleStatus === "published") ? new Date() : undefined;
                }
                return [4 /*yield*/, Article_1.Article.create({
                        title: title,
                        content: content,
                        excerpt: excerpt,
                        author_id: req.user.id,
                        featured_image: featuredImage,
                        status: articleStatus,
                        published_at: publishedAt,
                    })];
            case 1:
                article = _b.sent();
                // ⚡ OPTIMIZATION: Invalidate articles list and featured cache after creation
                return [4 /*yield*/, Promise.all([
                        (0, redis_1.invalidatePattern)('articles_list_*'),
                        (0, redis_1.invalidatePattern)('articles_featured_*')
                    ])];
            case 2:
                // ⚡ OPTIMIZATION: Invalidate articles list and featured cache after creation
                _b.sent();
                res.status(201).json({
                    success: true,
                    data: serializeArticle(article),
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZATION: Generic article update with cache invalidation
router.put("/:id", auth_1.authenticate, [
    (0, express_validator_1.body)("title").optional().isString().isLength({ min: 5, max: 255 }),
    (0, express_validator_1.body)("content").optional().isString().isLength({ min: 10 }),
    (0, express_validator_1.body)("excerpt").optional().isString().isLength({ min: 10, max: 500 }),
    (0, express_validator_1.body)("featured_image").optional({ checkFalsy: true }).isURL(),
    (0, express_validator_1.body)("featured_image_url").optional({ checkFalsy: true }).isURL(),
    (0, express_validator_1.body)("status").optional().isIn(["draft", "pending", "published", "archived"]),
], sanitization_1.sanitizeArticleContent, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, article, _a, title, content, excerpt, featured_image, featured_image_url, status;
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
                return [4 /*yield*/, Article_1.Article.findByPk(req.params.id)];
            case 1:
                article = _b.sent();
                if (!article) {
                    throw errorHandler_1.errors.notFound("Article not found");
                }
                // Check authorization: only author, admin, or operator can update
                if (req.user.id !== article.author_id &&
                    req.user.role !== "admin" &&
                    req.user.role !== "operator") {
                    throw errorHandler_1.errors.forbidden("You can only update your own articles");
                }
                _a = req.body, title = _a.title, content = _a.content, excerpt = _a.excerpt, featured_image = _a.featured_image, featured_image_url = _a.featured_image_url, status = _a.status;
                // Update fields if provided
                if (title !== undefined)
                    article.title = title;
                if (content !== undefined)
                    article.content = content;
                if (excerpt !== undefined)
                    article.excerpt = excerpt;
                if (featured_image || featured_image_url) {
                    article.featured_image = featured_image || featured_image_url;
                }
                // Handle status updates with role-based restrictions
                if (status !== undefined) {
                    if (req.user.role === "gallera" || req.user.role === "user") {
                        // Non-admins can only change between draft and pending
                        if (status !== "draft" && status !== "pending") {
                            throw errorHandler_1.errors.forbidden("You can only save as draft or submit for pending review");
                        }
                        article.status = status;
                        if (status !== "published" && status !== "archived") {
                            article.published_at = undefined;
                        }
                    }
                    else {
                        // Admins/operators can change to any status
                        article.status = status;
                        if (status === "published" && !article.published_at) {
                            article.published_at = new Date();
                        }
                        else if (status !== "published" && status !== "archived") {
                            article.published_at = undefined;
                        }
                    }
                }
                return [4 /*yield*/, article.save()];
            case 2:
                _b.sent();
                // ⚡ OPTIMIZATION: Invalidate all relevant caches
                return [4 /*yield*/, Promise.all([
                        (0, redis_1.invalidatePattern)('articles_list_*'),
                        (0, redis_1.invalidatePattern)('articles_featured_*'),
                        (0, redis_1.invalidatePattern)("article_detail_".concat(req.params.id, "_*"))
                    ])];
            case 3:
                // ⚡ OPTIMIZATION: Invalidate all relevant caches
                _b.sent();
                res.json({
                    success: true,
                    data: serializeArticle(article),
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
