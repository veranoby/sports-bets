// 2. backend/src/routes/articles.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { sanitizeArticleContent } from "../middleware/sanitization";
import { Article } from "../models/Article";
import { User } from "../models/User";
import { Venue } from "../models/Venue";
import { body, query, validationResult } from "express-validator";
import validator from 'validator';
import { Op } from "sequelize";

const router = Router();

// GET /api/articles - Listar artículos públicos
router.get(
  "/",
  [
    query("search").optional().isString(),
    query("venueId").optional().custom((value) => !value || validator.isUUID(value)),
    query("status").optional().isIn(["published", "pending", "draft"]),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Invalid parameters");
    }

    const {
      search,
      venueId,
      status = "published",
      page = 1,
      limit = 10,
    } = req.query as any;
    const offset = (page - 1) * limit;

    const whereClause: any = { status };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (venueId) {
      whereClause.venue_id = venueId;
    }

    const includeAuthor = true;
    const includeVenue = true;
    const { count, rows } = await Article.findAndCountAll({
      where: whereClause,
      include: [
        includeAuthor && {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
        includeVenue && {
          model: Venue,
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
        articles: rows.map((article) => article.toPublicJSON()),
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    });
  })
);

// GET /api/articles/:id - Obtener artículo específico
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const includeAuthor = true;
    const includeVenue = true;
    const article = await Article.findByPk(req.params.id, {
      include: [
        includeAuthor && {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
        includeVenue && {
          model: Venue,
          as: "venue",
          attributes: ["id", "name"],
        },
      ].filter(Boolean),
    });

    if (!article) {
      throw errors.notFound("Article not found");
    }

    // Solo mostrar artículos publicados a usuarios no autenticados
    if (article.status !== "published") {
      throw errors.forbidden("Article not available");
    }

    res.json({
      success: true,
      data: article.toPublicJSON(),
    });
  })
);

// POST /api/articles - Crear artículo (solo admin/gallera)
router.post(
  "/",
  authenticate,
  authorize("admin", "gallera"),
  [
    body("title").isString().isLength({ min: 5, max: 255 }),
    body("content").isString().isLength({ min: 10 }),
    body("excerpt").isString().isLength({ min: 10, max: 500 }),
    body("venue_id").optional().isUUID(),
    body("featured_image_url").optional().isURL(),
  ],
  sanitizeArticleContent,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Validation failed");
    }

    const { title, content, excerpt, venue_id, featured_image_url } = req.body;

    // Galleras can only create articles in draft status
    let articleStatus: "draft" | "pending" | "published" | "archived" =
      "published";
    let publishedAt = new Date();

    if (req.user!.role === "gallera") {
      articleStatus = "pending";
      publishedAt = undefined as any;
    }

    const article = await Article.create({
      title,
      content,
      excerpt,
      author_id: req.user!.id,
      venue_id,
      featured_image_url,
      status: articleStatus,
      published_at: publishedAt,
    });

    res.status(201).json({
      success: true,
      data: article.toPublicJSON(),
    });
  })
);

// PUT /api/articles/:id/status - Aprobar/rechazar artículo (admin/operator)
router.put(
  "/:id/status",
  authenticate,
  authorize("admin", "operator"),
  [body("status").isIn(["published", "archived", "pending"])],
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    const article = await Article.findByPk(req.params.id);
    if (!article) {
      throw errors.notFound("Article not found");
    }

    article.status = status;
    if (status === "published" && !article.published_at) {
      article.published_at = new Date();
    }

    await article.save();

    res.json({
      success: true,
      data: article.toPublicJSON(),
    });
  })
);

// PUT /api/articles/:id/publish - Publish article (admin only)
router.put(
  "/:id/publish",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      throw errors.notFound("Article not found");
    }

    article.status = "published";
    if (!article.published_at) {
      article.published_at = new Date();
    }

    await article.save();

    res.json({
      success: true,
      data: article.toPublicJSON(),
    });
  })
);

export default router;
