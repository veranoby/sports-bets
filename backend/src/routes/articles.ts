// 2. backend/src/routes/articles.ts
import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { sanitizeArticleContent } from "../middleware/sanitization";
import { Article } from "../models/Article";
import { User } from "../models/User";
import { body, query, validationResult } from "express-validator";
import { Op } from "sequelize";
import { getOrSet, invalidatePattern } from "../config/redis"; // ⚡ OPTIMIZATION: Redis caching

import { UserRole } from "../../../shared/types";

// ⚡ HELPER: Serialize article (handles both Sequelize instances and plain objects from cache)
function serializeArticle(article: any, attributes?: string[]) {
  // If it's a Sequelize instance with toJSON method
  if (typeof article.toJSON === 'function') {
    return article.toJSON({ attributes });
  }

  // If it's a plain object from cache
  const result: { [key: string]: any } = {};

  if (attributes) {
    // Filter by requested attributes
    for (const attr of attributes) {
      if (article[attr] !== undefined) {
        result[attr] = article[attr];
      }
    }
  } else {
    // Return all attributes
    Object.assign(result, article);
  }

  // Apply same transformations as Article.toJSON()
  if (article.author && !result.author_name) {
    result.author_name = article.author.username;
  }
  if (article.venue && !result.venue_name) {
    result.venue_name = article.venue.profileInfo?.venueName || article.venue.username;
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
  } else if (article.author && !result.author_subscription) {
    // Default to free content if no subscription info
    result.is_premium_content = false;
  }

  return result;
}

function getArticleAttributes(role: UserRole | undefined, type: "list" | "detail") {
  const publicAttributes = [
    "id",
    "title",
    "slug",
    "excerpt",
    "content",  // ✅ Include content for detail views
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

// ⚡ PERFORMANCE OPTIMIZED: Articles list with aggressive caching
router.get(
  "/",
  optionalAuth,
  [
    // Accept empty strings as "not provided" with checkFalsy to avoid 500s from UI sending ''
    query("search").optional({ checkFalsy: true }).isString(),
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
      author_id,
      status: requestedStatus,
      includeAuthor = true,
      includeVenue = true,
    } = req.query as any;

    // ⚡ SAFE PAGINATION: Enforce safe limits (consistent with events.ts)
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // Convert string values to boolean
    const includeAuthorBool = includeAuthor === 'true' || includeAuthor === true;
    const includeVenueBool = includeVenue === 'true' || includeVenue === true;

    const isPrivileged = !!req.user && ["admin", "operator"].includes(req.user.role);

    // ⚡ CRITICAL OPTIMIZATION: Generate cache key for query results
    // Cache key includes user_id for proper filtering of personal articles
    const cacheKeyPrefix = `articles_list_${limit}_${offset}_${search || 'none'}_${author_id || 'none'}_${includeAuthorBool}_${includeVenueBool}${req.user ? `_user_${req.user.id}` : ''}`;

    // Determine which articles user can see
    const whereClause: any = {};

    // Build visibility filter
    if (isPrivileged) {
      // Admin/operator: see requested status (default to published if not specified)
      whereClause.status = requestedStatus || "published";
    } else if (requestedStatus) {
      // Non-admin user explicitly requested a status
      // Only allow if requesting "published"
      if (requestedStatus === "published") {
        whereClause.status = "published";
      } else {
        // Non-admin cannot request draft/pending/archived of others
        // Show only own articles with that status + published from others
        whereClause[Op.or] = [
          req.user ? { author_id: req.user.id, status: requestedStatus } : null,
          { status: "published" }
        ].filter(Boolean);
      }
    } else if (req.user) {
      // Authenticated user, no status requested: see own articles (any status) + published articles from others
      whereClause[Op.or] = [
        { author_id: req.user.id },  // Own articles (any status)
        { status: "published" }       // Published articles from others
      ];
    } else {
      // Unauthenticated: only published
      whereClause.status = "published";
    }

    const cacheKey = `${cacheKeyPrefix}_${isPrivileged ? (requestedStatus || 'published') : (requestedStatus || (req.user ? 'own_plus_published' : 'published'))}`;

    // Add search filter (combines with visibility using AND)
    if (search) {
      if (whereClause[Op.or]) {
        // If we already have Op.or (for auth users), wrap in Op.and
        const visibilityFilter = whereClause[Op.or];
        whereClause[Op.and] = [
          { [Op.or]: visibilityFilter },
          {
            [Op.or]: [
              { title: { [Op.iLike]: `%${search}%` } },
              { excerpt: { [Op.iLike]: `%${search}%` } },
            ]
          }
        ];
        delete whereClause[Op.or];
      } else {
        // If only status filter, can use simple OR
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
      }
    }

    if (author_id) {
      whereClause.author_id = author_id;
    }

    // Patrón attributes por rol: público ve campos mínimos
    const attributes = getArticleAttributes(req.user?.role, "list");

    // ⚡ MEGA OPTIMIZATION: Cache articles list for 2 minutes (frequently accessed)
    const result = await getOrSet(cacheKey, async () => {
      return await Article.findAndCountAll({
        where: whereClause,
        attributes,
        include: [
          includeAuthorBool && {
            model: User,
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
        limit,
        offset,
      });
    }, 120); // ⚡ 2 minute cache for article lists (heavily accessed)

    const { count, rows } = result;

    // ⚡ ENHANCED PAGINATION METADATA (consistent with events.ts)
    const totalPages = Math.ceil(count / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    res.json({
      success: true,
      data: {
        articles: rows.map((article) => serializeArticle(article, attributes)),
        pagination: {
          limit,
          offset,
          total: count,
          totalPages,
          currentPage,
          hasNext: offset + limit < count,
          hasPrev: offset > 0,
          nextOffset: offset + limit < count ? offset + limit : null,
          prevOffset: offset > 0 ? Math.max(0, offset - limit) : null
        }
      },
    });
  })
);

// ⚡ CRITICAL FIX: Featured articles endpoint MUST come before /:id route
router.get(
  "/featured",
  optionalAuth,
  [
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("type").optional().isIn(["banner", "highlight", "trending"]),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest("Invalid parameters");
    }

    const { limit = 5, type = "banner" } = req.query as any;
    const attributes = getArticleAttributes(req.user?.role, "list");

    // ⚡ OPTIMIZATION: Cache featured articles
    const cacheKey = `articles_featured_${type}_${limit}_${req.user?.role || 'public'}`;

    const featuredArticles = await getOrSet(cacheKey, async () => {
      return await Article.findAll({
        where: {
          status: "published",
          featured_image: { [Op.ne]: null }, // Only articles with images for banners
        },
        attributes,
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username"],
            separate: false,
          },
        ],
        order: [["published_at", "DESC"]],
        limit: parseInt(limit),
      });
    }, 180); // ⚡ 3 minute cache for featured articles

    res.json({
      success: true,
      data: {
        articles: featuredArticles.map((article) => serializeArticle(article, attributes)),
        type,
        total: featuredArticles.length,
      },
    });
  })
);

// ⚡ PERFORMANCE OPTIMIZED: Single article with caching
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const attributes = getArticleAttributes(req.user?.role, "detail");

    // ⚡ OPTIMIZATION: Cache individual articles for 5 minutes
    const cacheKey = `article_detail_${req.params.id}_${req.user?.role || 'public'}`;

    const article = await getOrSet(cacheKey, async () => {
      return await Article.findByPk(req.params.id, {
        attributes,
        include: [
          {
            model: User,
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
      });
    }, 300); // ⚡ 5 minute cache for individual articles

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
      data: serializeArticle(article, attributes),
    });
  })
);

// ⚡ OPTIMIZATION: Article creation with cache invalidation
router.post(
  "/",
  authenticate,
  authorize("admin", "gallera", "user", "venue"),
  [
    body("title").isString().isLength({ min: 5, max: 255 }),
    body("content").isString().isLength({ min: 10 }),
    body("excerpt").isString().isLength({ min: 10, max: 500 }),
    body("featured_image")
      .custom((value) => {
        // Allow empty string, null, or undefined
        if (!value || value === '') return true;
        // If provided, must be valid URL
        return /^https?:\/\//.test(value);
      })
      .withMessage("featured_image must be a valid URL if provided"),
    body("featured_image_url")
      .custom((value) => {
        // Allow empty string, null, or undefined
        if (!value || value === '') return true;
        // If provided, must be valid URL
        return /^https?:\/\//.test(value);
      })
      .withMessage("featured_image_url must be a valid URL if provided"),
    body("status").optional().isIn(["draft", "pending", "published", "archived"]),
  ],
  sanitizeArticleContent,
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { title, content, excerpt, venue_id, featured_image, featured_image_url, status: requestedStatus } = req.body;
    const featuredImage = featured_image || featured_image_url;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')       // Replace spaces with dashes
      .replace(/-+/g, '-')        // Replace multiple dashes with single dash
      .replace(/^-+|-+$/g, '');   // Remove leading/trailing dashes

    // Determine article status based on role
    let articleStatus: "draft" | "pending" | "published" | "archived" = "draft";
    let publishedAt: Date | undefined = undefined;

    if (req.user!.role === "admin" || req.user!.role === "operator") {
      // Admins/operators can use any status including published
      articleStatus = requestedStatus || "published";
      publishedAt = (articleStatus === "published") ? new Date() : undefined;
    } else {
      // Regular users (venue, gallera, user): can create drafts or submit for pending review
      // If they request "draft", keep it as draft
      // Otherwise, default to "pending" for review (requires admin approval)
      articleStatus = (requestedStatus === "draft") ? "draft" : "pending";
      publishedAt = undefined;
    }

    const article = await Article.create({
      title,
      slug,
      content,
      excerpt,
      author_id: req.user!.id,
      featured_image: featuredImage,
      status: articleStatus,
      published_at: publishedAt,
    });

    // ⚡ OPTIMIZATION: Invalidate articles list and featured cache after creation
    await Promise.all([
      invalidatePattern('articles_list_*'),
      invalidatePattern('articles_featured_*')
    ]);

    res.status(201).json({
      success: true,
      data: serializeArticle(article),
    });
  })
);

// ⚡ OPTIMIZATION: Generic article update with cache invalidation
router.put(
  "/:id",
  authenticate,
  [
    body("title").optional().isString().isLength({ min: 5, max: 255 }),
    body("content").optional().isString().isLength({ min: 10 }),
    body("excerpt").optional().isString().isLength({ min: 10, max: 500 }),
    body("featured_image")
      .custom((value) => {
        // Allow empty string, null, or undefined
        if (!value || value === '') return true;
        // If provided, must be valid URL
        return /^https?:\/\//.test(value);
      })
      .withMessage("featured_image must be a valid URL if provided"),
    body("featured_image_url")
      .custom((value) => {
        // Allow empty string, null, or undefined
        if (!value || value === '') return true;
        // If provided, must be valid URL
        return /^https?:\/\//.test(value);
      })
      .withMessage("featured_image_url must be a valid URL if provided"),
    body("status").optional().isIn(["draft", "pending", "published", "archived"]),
  ],
  sanitizeArticleContent,
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const article = await Article.findByPk(req.params.id);
    if (!article) {
      throw errors.notFound("Article not found");
    }

    // Check authorization: only author, admin, or operator can update
    if (
      req.user!.id !== article.author_id &&
      req.user!.role !== "admin" &&
      req.user!.role !== "operator"
    ) {
      throw errors.forbidden("You can only update your own articles");
    }

    const { title, content, excerpt, featured_image, featured_image_url, status } = req.body;

    // Update fields if provided
    if (title !== undefined) {
      article.title = title;
      // Regenerate slug if title changes
      article.slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')       // Replace spaces with dashes
        .replace(/-+/g, '-')        // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, '');   // Remove leading/trailing dashes
    }
    if (content !== undefined) article.content = content;
    if (excerpt !== undefined) article.excerpt = excerpt;
    if (featured_image || featured_image_url) {
      article.featured_image = featured_image || featured_image_url;
    }

    // Handle status updates with role-based restrictions
    if (status !== undefined) {
      if (req.user!.role === "gallera" || req.user!.role === "user") {
        // Non-admins can only change between draft and pending
        if (status !== "draft" && status !== "pending") {
          throw errors.forbidden("You can only save as draft or submit for pending review");
        }
        article.status = status;
        if (status !== "published" && status !== "archived") {
          article.published_at = undefined;
        }
      } else {
        // Admins/operators can change to any status
        article.status = status;
        if (status === "published" && !article.published_at) {
          article.published_at = new Date();
        } else if (status !== "published" && status !== "archived") {
          article.published_at = undefined;
        }
      }
    }

    await article.save();

    // ⚡ OPTIMIZATION: Invalidate all relevant caches
    await Promise.all([
      invalidatePattern('articles_list_*'),
      invalidatePattern('articles_featured_*'),
      invalidatePattern(`article_detail_${req.params.id}_*`)
    ]);

    res.json({
      success: true,
      data: serializeArticle(article),
    });
  })
);

export default router;