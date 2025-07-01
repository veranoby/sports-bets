// 2. backend/src/routes/articles.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Article } from "../models/Article";
import { User } from "../models/User";
import { Venue } from "../models/Venue";
import { body, query, validationResult } from "express-validator";
import { Op } from "sequelize";

const router = Router();

// GET /api/articles - Listar artículos públicos
router.get(
  "/",
  [
    query("search").optional().isString(),
    query("venueId").optional().isUUID(),
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

    const { count, rows } = await Article.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "profile_info"],
        },
        {
          model: Venue,
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
  })
);

// GET /api/articles/:id - Obtener artículo específico
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const article = await Article.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "profile_info"],
        },
        {
          model: Venue,
          as: "venue",
          attributes: ["id", "name"],
        },
      ],
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

// POST /api/articles - Crear artículo (solo admin/operator/venue)
router.post(
  "/",
  authenticate,
  authorize(["admin", "operator", "venue"]),
  [
    body("title").isString().isLength({ min: 5, max: 255 }),
    body("content").isString().isLength({ min: 10 }),
    body("summary").isString().isLength({ min: 10, max: 500 }),
    body("venue_id").optional().isUUID(),
    body("featured_image_url").optional().isURL(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Validation failed");
    }

    const { title, content, summary, venue_id, featured_image_url } = req.body;

    // Venues solo pueden crear artículos para sus propias galleras
    if (req.user!.role === "venue" && venue_id) {
      const venue = await Venue.findOne({
        where: { id: venue_id, owner_id: req.user!.id },
      });
      if (!venue) {
        throw errors.forbidden("Can only create articles for your own venues");
      }
    }

    const article = await Article.create({
      title,
      content,
      summary,
      author_id: req.user!.id,
      venue_id,
      featured_image_url,
      status: req.user!.role === "venue" ? "pending" : "published",
      published_at: req.user!.role === "venue" ? undefined : new Date(),
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
  authorize(["admin", "operator"]),
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

export default router;
