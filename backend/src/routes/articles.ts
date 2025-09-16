// 2. backend/src/routes/articles.ts
import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { sanitizeArticleContent } from "../middleware/sanitization";
import { Article } from "../models/Article";
import { User } from "../models/User";
import { Venue } from "../models/Venue";
import { body, query, validationResult } from "express-validator";
import { Op } from "sequelize";

import { UserRole } from "../../../shared/types";

function getArticleAttributes(role: UserRole | undefined, type: "list" | "detail") {
  const publicAttributes = [
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

  const authenticatedAttributes = [
    ...publicAttributes,
    "content",
    "tags",
    "venue_id",
    "view_count",
  ];

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

const router = Router();

// GET /api/articles - Listar artículos con sanitización por rol
router.get(
  "/",
  optionalAuth,
  [
    // Accept empty strings as "not provided" with checkFalsy to avoid 500s from UI sending ''
    query("search").optional({ checkFalsy: true }).isString(),
    query("venueId").optional({ checkFalsy: true }).isUUID(),
    query("status").optional({ checkFalsy: true }).isIn(["published", "pending", "draft", "archived"]),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 1000 }).toInt(),
    query("author_id").optional({ checkFalsy: true }).isUUID(),
    query("includeAuthor").optional({ checkFalsy: true }).isString().custom((value) => {
      if (value === 'true' || value === 'false') {
        return true;
      }
      throw new Error('includeAuthor must be true or false');
    }),
    query("includeVenue").optional({ checkFalsy: true }).isString().custom((value) => {
      if (value === 'true' || value === 'false') {
        return true;
      }
      throw new Error('includeVenue must be true or false');
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      // Return 400 instead of 500 when query params are invalid
      throw errors.badRequest("Invalid parameters");
    }

    const {
      search,
      venueId,
      status: rawStatus = "published",
      page = 1,
      limit = 10,
      author_id,
      includeAuthor = true,
      includeVenue = true,
    } = req.query as any;
    
    // Convert string values to boolean
    const includeAuthorBool = includeAuthor === 'true' || includeAuthor === true;
    const includeVenueBool = includeVenue === 'true' || includeVenue === true;
    
    const isPrivileged = !!req.user && ["admin", "operator"].includes(req.user.role);
    const status = isPrivileged ? rawStatus : "published"; // Solo admin/operator puede listar no publicados
    const offset = (page - 1) * limit;

    const whereClause: any = { status };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (venueId) {
      whereClause.venue_id = venueId;
    }

    if (author_id) {
      whereClause.author_id = author_id;
    }

    // Patrón attributes por rol: público ve campos mínimos
    const attributes = getArticleAttributes(req.user?.role, "list");

    const { count, rows } = await Article.findAndCountAll({
      where: whereClause,
      attributes,
      include: [
        includeAuthorBool && {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
        includeVenueBool && {
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
        // Lista: usar payload "lite"
        articles: rows.map((article) => article.toJSON({ attributes })),
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
  optionalAuth,
  asyncHandler(async (req, res) => {
    const attributes = getArticleAttributes(req.user?.role, "detail");
    const article = await Article.findByPk(req.params.id, {
      attributes,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username"],
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

    const isAdmin = !!req.user && req.user.role === "admin";
    const isAuthor = !!req.user && req.user.id === article.author_id;

    // Solo mostrar artículos no publicados a admin o autor
    if (article.status !== "published" && !isAdmin && !isAuthor) {
      throw errors.forbidden("Article not available");
    }

    res.json({
      success: true,
      data: article.toJSON({ attributes }),
    });
  })
);

// POST /api/articles - Crear artículo (solo admin/gallera)
router.post(
  "/",
  authenticate,
  authorize("admin", "gallera", "user"),
  [
    body("title").isString().isLength({ min: 5, max: 255 }),
    body("content").isString().isLength({ min: 10 }),
    body("excerpt").isString().isLength({ min: 10, max: 500 }),
    body("venue_id").optional().isUUID(),
    body("featured_image").optional().isURL(),
    body("featured_image_url").optional().isURL(),
  ],
  sanitizeArticleContent,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Validation failed");
    }

    const { title, content, excerpt, venue_id, featured_image, featured_image_url } = req.body;
    const featuredImage = featured_image || featured_image_url;

    // Galleras can only create articles in draft status
    let articleStatus: "draft" | "pending" | "published" | "archived" =
      "published";
    let publishedAt = new Date();

    if (req.user!.role === "gallera" || req.user!.role === "user") {
      articleStatus = "pending";
      publishedAt = undefined as any;
    }

    const article = await Article.create({
      title,
      content,
      excerpt,
      author_id: req.user!.id,
      venue_id,
      featured_image: featuredImage,
      status: articleStatus,
      published_at: publishedAt,
    });

    res.status(201).json({
      success: true,
      data: article.toJSON(),
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
      data: article.toJSON(),
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
      data: article.toJSON(),
    });
  })
);

export default router;
