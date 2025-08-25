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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 2. backend/src/routes/articles.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const sanitization_1 = require("../middleware/sanitization");
const Article_1 = require("../models/Article");
const User_1 = require("../models/User");
const Venue_1 = require("../models/Venue");
const express_validator_1 = require("express-validator");
const validator_1 = __importDefault(require("validator"));
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// GET /api/articles - Listar artículos públicos
router.get("/", auth_1.optionalAuth, [
    (0, express_validator_1.query)("search").optional().isString(),
    (0, express_validator_1.query)("venueId").optional().custom((value) => !value || validator_1.default.isUUID(value)),
    (0, express_validator_1.query)("status").optional().isIn(["published", "pending", "draft", "archived"]),
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new Error("Invalid parameters");
    }
    const { search, venueId, status: rawStatus = "published", page = 1, limit = 10, } = req.query;
    const isAdmin = !!req.user && req.user.role === "admin";
    const status = isAdmin ? rawStatus : "published"; // Solo admin puede listar no publicados
    const offset = (page - 1) * limit;
    const whereClause = { status };
    if (search) {
        whereClause[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { excerpt: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    if (venueId) {
        whereClause.venue_id = venueId;
    }
    const includeAuthor = true;
    const includeVenue = true;
    const attributes = [
        "id",
        "title",
        "slug",
        "excerpt",
        "category",
        "status",
        "featured_image",
        "published_at",
        "created_at",
        "updated_at",
    ];
    const { count, rows } = yield Article_1.Article.findAndCountAll({
        where: whereClause,
        attributes,
        include: [
            includeAuthor && {
                model: User_1.User,
                as: "author",
                attributes: ["id", "username"],
            },
            includeVenue && {
                model: Venue_1.Venue,
                as: "venue",
                attributes: ["id", "name"],
            },
        ].filter(Boolean),
        order: [
            ["published_at", "DESC"],
            ["created_at", "DESC"],
        ],
        limit,
        offset,
    });
    res.json({
        success: true,
        data: {
            // Lista pública: no exponer contenido completo por rendimiento
            articles: rows.map((article) => {
                const a = article.toPublicJSON();
                return {
                    id: a.id,
                    title: a.title,
                    slug: a.slug,
                    summary: a.summary,
                    category: a.category,
                    status: a.status,
                    featured_image_url: a.featured_image_url,
                    published_at: a.published_at,
                    created_at: a.created_at,
                    updated_at: a.updated_at,
                    author_name: a.author_name,
                    venue_name: a.venue_name,
                };
            }),
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
    });
})));
// GET /api/articles/:id - Obtener artículo específico
router.get("/:id", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const includeAuthor = true;
    const includeVenue = true;
    const article = yield Article_1.Article.findByPk(req.params.id, {
        include: [
            includeAuthor && {
                model: User_1.User,
                as: "author",
                attributes: ["id", "username"],
            },
            includeVenue && {
                model: Venue_1.Venue,
                as: "venue",
                attributes: ["id", "name"],
            },
        ].filter(Boolean),
    });
    if (!article) {
        throw errorHandler_1.errors.notFound("Article not found");
    }
    const isAdmin = !!req.user && req.user.role === "admin";
    const isAuthor = !!req.user && req.user.id === article.author_id;
    // Solo mostrar artículos no publicados a admin o autor
    if (article.status !== "published" && !isAdmin && !isAuthor) {
        throw errorHandler_1.errors.forbidden("Article not available");
    }
    res.json({
        success: true,
        data: article.toPublicJSON(),
    });
})));
// POST /api/articles - Crear artículo (solo admin/gallera)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "gallera"), [
    (0, express_validator_1.body)("title").isString().isLength({ min: 5, max: 255 }),
    (0, express_validator_1.body)("content").isString().isLength({ min: 10 }),
    (0, express_validator_1.body)("excerpt").isString().isLength({ min: 10, max: 500 }),
    (0, express_validator_1.body)("venue_id").optional().isUUID(),
    (0, express_validator_1.body)("featured_image").optional().isURL(),
    (0, express_validator_1.body)("featured_image_url").optional().isURL(),
], sanitization_1.sanitizeArticleContent, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new Error("Validation failed");
    }
    const { title, content, excerpt, venue_id, featured_image, featured_image_url } = req.body;
    const featuredImage = featured_image || featured_image_url;
    // Galleras can only create articles in draft status
    let articleStatus = "published";
    let publishedAt = new Date();
    if (req.user.role === "gallera") {
        articleStatus = "pending";
        publishedAt = undefined;
    }
    const article = yield Article_1.Article.create({
        title,
        content,
        excerpt,
        author_id: req.user.id,
        venue_id,
        featured_image: featuredImage,
        status: articleStatus,
        published_at: publishedAt,
    });
    res.status(201).json({
        success: true,
        data: article.toPublicJSON(),
    });
})));
// PUT /api/articles/:id/status - Aprobar/rechazar artículo (admin/operator)
router.put("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [(0, express_validator_1.body)("status").isIn(["published", "archived", "pending"])], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = req.body;
    const article = yield Article_1.Article.findByPk(req.params.id);
    if (!article) {
        throw errorHandler_1.errors.notFound("Article not found");
    }
    article.status = status;
    if (status === "published" && !article.published_at) {
        article.published_at = new Date();
    }
    yield article.save();
    res.json({
        success: true,
        data: article.toPublicJSON(),
    });
})));
// PUT /api/articles/:id/publish - Publish article (admin only)
router.put("/:id/publish", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const article = yield Article_1.Article.findByPk(req.params.id);
    if (!article) {
        throw errorHandler_1.errors.notFound("Article not found");
    }
    article.status = "published";
    if (!article.published_at) {
        article.published_at = new Date();
    }
    yield article.save();
    res.json({
        success: true,
        data: article.toPublicJSON(),
    });
})));
exports.default = router;
