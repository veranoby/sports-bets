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
// 2. backend/src/routes/articles.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Article_1 = require("../models/Article");
const User_1 = require("../models/User");
const Venue_1 = require("../models/Venue");
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// GET /api/articles - Listar artículos públicos
router.get("/", [
    (0, express_validator_1.query)("search").optional().isString(),
    (0, express_validator_1.query)("venueId").optional().isUUID(),
    (0, express_validator_1.query)("status").optional().isIn(["published", "pending", "draft"]),
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new Error("Invalid parameters");
    }
    const { search, venueId, status = "published", page = 1, limit = 10, } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = { status };
    if (search) {
        whereClause[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { summary: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    if (venueId) {
        whereClause.venue_id = venueId;
    }
    const { count, rows } = yield Article_1.Article.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: User_1.User,
                as: "author",
                attributes: ["id", "profile_info"],
            },
            {
                model: Venue_1.Venue,
                as: "venue",
                attributes: ["id", "name"],
            },
        ],
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
            articles: rows.map((article) => article.toPublicJSON()),
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        },
    });
})));
// GET /api/articles/:id - Obtener artículo específico
router.get("/:id", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const article = yield Article_1.Article.findByPk(req.params.id, {
        include: [
            {
                model: User_1.User,
                as: "author",
                attributes: ["id", "profile_info"],
            },
            {
                model: Venue_1.Venue,
                as: "venue",
                attributes: ["id", "name"],
            },
        ],
    });
    if (!article) {
        throw errorHandler_1.errors.notFound("Article not found");
    }
    // Solo mostrar artículos publicados a usuarios no autenticados
    if (article.status !== "published") {
        throw errorHandler_1.errors.forbidden("Article not available");
    }
    res.json({
        success: true,
        data: article.toPublicJSON(),
    });
})));
// POST /api/articles - Crear artículo (solo admin/operator/venue)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator", "venue"), [
    (0, express_validator_1.body)("title").isString().isLength({ min: 5, max: 255 }),
    (0, express_validator_1.body)("content").isString().isLength({ min: 10 }),
    (0, express_validator_1.body)("summary").isString().isLength({ min: 10, max: 500 }),
    (0, express_validator_1.body)("venue_id").optional().isUUID(),
    (0, express_validator_1.body)("featured_image_url").optional().isURL(),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new Error("Validation failed");
    }
    const { title, content, summary, venue_id, featured_image_url } = req.body;
    // Venues solo pueden crear artículos para sus propias galleras
    if (req.user.role === "venue" && venue_id) {
        const venue = yield Venue_1.Venue.findOne({
            where: { id: venue_id, ownerId: req.user.id },
        });
        if (!venue) {
            throw new Error("Can only create articles for your own venues");
        }
    }
    const article = yield Article_1.Article.create({
        title,
        content,
        summary,
        author_id: req.user.id,
        venue_id,
        featured_image_url,
        status: req.user.role === "venue" ? "pending" : "published",
        published_at: req.user.role === "venue" ? undefined : new Date(),
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
exports.default = router;
