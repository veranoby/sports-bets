import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { User, Subscription, Wallet, Transaction } from "../models"; // ADD Wallet, Transaction
import { body, param, validationResult } from "express-validator";
import { Op } from "sequelize";
import { getOrSet, invalidatePattern } from "../config/redis";
import { transaction, sequelize } from "../config/database"; // ADD transaction, sequelize

const router = Router();

// GET /api/users/profile - Obtener perfil propio (DEBE ir ANTES de rutas con parámetros)
router.get(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // ⚡ Redis cache key
    const cacheKey = `user:profile:${userId}`;

    const data = await getOrSet(cacheKey, async () => {
      const user = await User.findByPk(userId, {
        attributes: {
          exclude: ["passwordHash", "verificationToken"],
        },
      });

      if (!user) {
        throw errors.notFound("User not found");
      }

      // Get the current subscription for this user
      const currentSubscription = await user.getCurrentSubscription();

      return {
        success: true,
        data: { 
          user: await user.toPublicJSON(),
          subscription: currentSubscription
        },
      };
    }, 300); // 5 min TTL (critical path - balance between freshness and performance)

    res.json(data);
  })
);

// GET /api/users - Listar usuarios (admin/operator)
router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, role, isActive, search, approved, subscriptionType } = req.query;

    // Construir filtros
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (approved !== undefined) where.approved = approved === "true";

    // ⚡ PERFORMANCE OPTIMIZATION: Only operators can see non-admin/operator users
    if (req.user!.role === "operator") {
      where.role = { [Op.in]: ["venue", "user", "gallera"] };
    }

    // 🔧 FIX: Use conditions array to combine search and subscription filters WITHOUT overwriting
    const conditions: any[] = [];

    // Add search filter
    if (search) {
      conditions.push({
        [Op.or]: [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ]
      });
    }

    // SUBSCRIPTION FILTERING LOGIC:
    // ✅ ALWAYS include subscriptions (LEFT JOIN) to show current subscription in list
    let subscriptionInclude: any[] = [{
      model: Subscription,
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
        model: Subscription,
        as: "subscriptions",
        attributes: ['type', 'status', 'expiresAt'],
        required: false, // LEFT JOIN to include users without subscriptions
        where: {
          [Op.or]: [
            { status: 'free' },
            {
              [Op.and]: [
                { expiresAt: { [Op.lte]: new Date() } },
                { status: 'active' }
              ]
            }
          ]
        }
      }];
      // Then filter to only include users where the subscription is NULL (no subscription) OR matches the free criteria
      conditions.push({
        [Op.or]: [
          { '$subscriptions.id$': null }, // Users with no subscription (free by default)
          { '$subscriptions.status$': 'free' },
          {
            [Op.and]: [
              { '$subscriptions.expiresAt$': { [Op.lte]: new Date() } },
              { '$subscriptions.status$': 'active' }
            ]
          }
        ]
      });
    } else if (subscriptionType === 'monthly') {
      subscriptionInclude = [{
        model: Subscription,
        as: "subscriptions",
        attributes: ['type', 'status', 'expiresAt'],
        required: true, // INNER JOIN - only users WITH matching subscription
        where: {
          type: 'monthly',
          status: 'active',
          expiresAt: { [Op.gt]: new Date() }
        }
      }];
    } else if (subscriptionType === 'daily') {
      subscriptionInclude = [{
        model: Subscription,
        as: "subscriptions",
        attributes: ['type', 'status', 'expiresAt'],
        required: true, // INNER JOIN - only users WITH matching subscription
        where: {
          type: 'daily',
          status: 'active',
          expiresAt: { [Op.gt]: new Date() }
        }
      }];
    }

    // Combine all conditions if any exist
    if (conditions.length > 0) {
      where[Op.and] = conditions;
    }

    const users = await User.findAndCountAll({
      where,
      limit: Math.min(parseInt(limit as string), 100),
      offset: parseInt(offset as string),
      attributes: {
        exclude: ["passwordHash", "verificationToken"],
      },
      include: subscriptionInclude,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        users: await Promise.all(users.rows.map((u) => u.toPublicJSON())),
        pagination: {
          total: users.count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  })
);

// GET /api/users/:id - Obtener usuario específico (admin/operator/self)
router.get(
  "/:id",
  authenticate,
  param("id").isUUID().withMessage("Valid user ID required"),
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

    const userId = req.params.id;

    // Check permissions
    if (
      req.user!.role !== "admin" &&
      req.user!.role !== "operator" &&
      req.user!.id !== userId
    ) {
      throw errors.forbidden("Insufficient permissions");
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Prevent operators from viewing admin/operator users
    const targetUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["passwordHash", "verificationToken"],
      },
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance", "frozenAmount"],
          required: false,
          as: "wallet",
        },
      ],
    });

    if (!targetUser) {
      throw errors.notFound("User not found");
    }

    if (
      req.user!.role === "operator" &&
      ["admin", "operator"].includes(targetUser.role)
    ) {
      throw errors.forbidden(
        "Operators cannot view admin or operator accounts"
      );
    }

    res.json({
      success: true,
      data: await targetUser.toPublicJSON(),
    });
  })
);

// PUT /api/users/profile - Actualizar perfil propio
router.put(
  "/profile",
  authenticate,
  [
    body("profileInfo")
      .optional()
      .isObject()
      .withMessage("Profile info must be an object"),
    body("profileInfo.fullName")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters")
      .trim()
      .escape(),
    body("profileInfo.phoneNumber")
      .optional({ checkFalsy: true })
      .custom((value) => {
        // If value is empty/falsy, skip validation
        if (!value) return true;
        // If value exists, validate format
        if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
          throw new Error("Invalid phone number format");
        }
        return true;
      }),
    body("profileInfo.address")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Address must be less than 500 characters")
      .trim(),
    body("profileInfo.businessName")
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ min: 2, max: 100 })
      .withMessage("Business name must be between 2 and 100 characters")
      .trim()
      .escape(),
  ],
  asyncHandler(async (req, res) => {
    // 🔒 PROTECTION: Prevent modifications to read-only fields
    if (req.body.username !== undefined || req.body.email !== undefined) {
      throw errors.badRequest("Fields 'username' and 'email' are read-only and cannot be modified");
    }

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

    const { profileInfo } = req.body;
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      throw errors.notFound("User not found");
    }

    // Validate business-specific fields for venue/gallera accounts
    if (profileInfo && ['venue', 'gallera'].includes(user.role)) {
      // Ensure venue/gallera have required business information
      const requiredFields = ['businessName'];
      for (const field of requiredFields) {
        if (profileInfo[field] && profileInfo[field].trim().length < 2) {
          throw errors.badRequest(`${field} is required for ${user.role} accounts`);
        }
      }
    }

    // Validate image array limits for venue and gallera accounts
    if (profileInfo) {
      // Validate gallera images: max 3
      if (profileInfo.galleraImages && Array.isArray(profileInfo.galleraImages)) {
        if (profileInfo.galleraImages.length > 3) {
          throw errors.badRequest("Maximum 3 images allowed for galleras");
        }
      }

      // Validate venue images: max 2
      if (profileInfo.venueImages && Array.isArray(profileInfo.venueImages)) {
        if (profileInfo.venueImages.length > 2) {
          throw errors.badRequest("Maximum 2 images allowed for venues");
        }
      }
    }

    if (profileInfo) {
      // Initialize profileInfo if it doesn't exist
      if (!user.profileInfo) {
        user.profileInfo = { verificationLevel: "none" };
      }

      // Merge profile information, ensuring proper data types
      user.profileInfo = {
        ...user.profileInfo,
        ...profileInfo,
        // Ensure certain fields are properly sanitized
        verificationLevel: user.profileInfo?.verificationLevel || "none"
      };

      console.log('Updated user profileInfo:', JSON.stringify(user.profileInfo, null, 2));
    }

    try {
      await user.save();
      console.log('User saved successfully');

      // Synchronize with venue/gallera tables if role matches
      if (profileInfo && user.role === 'venue' && profileInfo.venueName) {
        try {
          const { Venue } = require('../models');
          let venue = await Venue.findOne({ where: { ownerId: user.id } });

          if (venue) {
            // Update existing venue
            await venue.update({
              name: profileInfo.venueName,
              location: profileInfo.venueLocation || venue.location,
              description: profileInfo.venueDescription || venue.description,
              contactInfo: {
                ...venue.contactInfo,
                email: profileInfo.venueEmail || venue.contactInfo?.email,
                website: profileInfo.venueWebsite || venue.contactInfo?.website,
              }
            });
            console.log('Venue data synchronized with user profile');
          } else if (profileInfo.venueName && profileInfo.venueLocation) {
            // Create new venue record
            await Venue.create({
              name: profileInfo.venueName,
              location: profileInfo.venueLocation,
              description: profileInfo.venueDescription || '',
              ownerId: user.id,
              contactInfo: {
                email: profileInfo.venueEmail,
                website: profileInfo.venueWebsite,
              }
            });
            console.log('New venue record created from user profile');
          }
        } catch (venueError) {
          console.error('Error synchronizing venue data:', venueError);
          // Don't fail the whole request if venue sync fails
        }
      }

      if (profileInfo && user.role === 'gallera' && profileInfo.galleraName) {
        try {
          const { Gallera } = require('../models');
          let gallera = await Gallera.findOne({ where: { ownerId: user.id } });

          if (gallera) {
            // Update existing gallera
            await gallera.update({
              name: profileInfo.galleraName,
              location: profileInfo.galleraLocation || gallera.location,
              description: profileInfo.galleraDescription || gallera.description,
              specialties: profileInfo.galleraSpecialties ? { specialties: profileInfo.galleraSpecialties } : gallera.specialties,
              activeRoosters: profileInfo.galleraActiveRoosters || gallera.activeRoosters,
              contactInfo: {
                ...gallera.contactInfo,
                email: profileInfo.galleraEmail || gallera.contactInfo?.email,
                website: profileInfo.galleraWebsite || gallera.contactInfo?.website,
              }
            });
            console.log('Gallera data synchronized with user profile');
          } else if (profileInfo.galleraName && profileInfo.galleraLocation) {
            // Create new gallera record
            await Gallera.create({
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
            });
            console.log('New gallera record created from user profile');
          }
        } catch (galleraError) {
          console.error('Error synchronizing gallera data:', galleraError);
          // Don't fail the whole request if gallera sync fails
        }
      }

      // ⚡ Invalidate cache after successful update
      await invalidatePattern(`user:profile:${req.user!.id}`);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: await user.toPublicJSON(),
      });
    } catch (error) {
      console.error('Error saving user:', error);
      throw errors.internal("Failed to save user profile");
    }
  })
);

// PUT /api/users/:userId/profile-info - Update profile info for any user (admin/operator only)
router.put(
  "/:userId/profile-info",
  authenticate,
  authorize("admin", "operator"),
  [
    param("userId").isUUID().withMessage("Invalid user ID required"),
    body("venueName")
      .optional()
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage("Venue name must be between 3 and 100 characters")
      .trim()
      .escape(),
    body("venueLocation")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("Venue location must be less than 200 characters")
      .trim()
      .escape(),
    body("venueDescription")
      .optional()
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Venue description must be between 10 and 1000 characters")
      .trim(),
    body("venueEmail")
      .optional()
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail(),
    body("venueWebsite")
      .optional()
      .isURL()
      .withMessage("Valid URL required")
      .trim(),
    body("galleraName")
      .optional()
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage("Gallera name must be between 3 and 100 characters")
      .trim()
      .escape(),
    body("galleraLocation")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("Gallera location must be less than 200 characters")
      .trim()
      .escape(),
    body("galleraDescription")
      .optional()
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Gallera description must be between 10 and 1000 characters")
      .trim(),
    body("galleraEmail")
      .optional()
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail(),
    body("galleraWebsite")
      .optional()
      .isURL()
      .withMessage("Valid URL required")
      .trim(),
    body("businessName")
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ min: 2, max: 100 })
      .withMessage("Business name must be between 2 and 100 characters")
      .trim()
      .escape(),
    body("location")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("Location must be less than 200 characters")
      .trim()
      .escape(),
    body("description")
      .optional()
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters")
      .trim(),
    body("establishedDate")
      .optional()
      .isISO8601()
      .withMessage("Valid ISO date required"),
    body("certified")
      .optional()
      .isBoolean()
      .withMessage("Certified must be a boolean"),
    body("imageUrl")
      .optional()
      .isURL()
      .withMessage("Valid URL required")
      .trim(),
    body("images")
      .optional()
      .isArray()
      .withMessage("Images must be an array"),
    body("images.*")
      .optional()
      .isURL()
      .withMessage("Each image must be a valid URL")
  ],
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

    const { userId } = req.params;
    const profileInfoUpdate = req.body;

    // Authorization check: Admin can update any user, operator can only update non-admin/operator users
    if (req.user!.role === "operator") {
      const targetUser = await User.findByPk(userId);
      if (!targetUser || ["admin", "operator"].includes(targetUser.role)) {
        throw errors.forbidden("Operators can only update venue/gallera/user roles");
      }
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw errors.notFound("User not found");
    }

    // Merge new profileInfo with existing
    const updatedProfileInfo = {
      ...user.profileInfo,
      ...profileInfoUpdate
    };

    // Update user
    await user.update({ profileInfo: updatedProfileInfo });

    // ⚡ CRITICAL: Invalidate cache
    await invalidatePattern(`user:${userId}:*`);

    // ✅ FASE 5: Venue/Gallera models consolidated into User.profileInfo
    // All business entity data now stored directly in profileInfo field

    res.json({
      success: true,
      message: "Profile info updated successfully",
      data: { user: await user.toPublicJSON() }
    });
  })
);

// POST /api/users - Crear usuario (admin/operator)
router.post(
  "/",
  authenticate,
  authorize("admin", "operator"),
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username must contain only letters, numbers, and underscores")
      .trim()
      .toLowerCase(),
    body("email")
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail()
      .trim()
      .toLowerCase(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .isIn(["admin", "operator", "venue", "user", "gallera"])
      .withMessage("Invalid role"),
  ],
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

    const { username, email, password, role, profileInfo } = req.body;

    // ⚡ SECURITY: Operators can only create venue/user/gallera accounts
    if (req.user!.role === "operator" && !["venue", "user", "gallera"].includes(role)) {
      throw errors.forbidden("Operators can only create venue, user, or gallera accounts");
    }

    // ⚡ SECURITY: Only admins can create admin/operator accounts
    if (["admin", "operator"].includes(role) && req.user!.role !== "admin") {
      throw errors.forbidden("Only admins can create admin/operator accounts");
    }

    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw errors.conflict("User with this email already exists");
      } else {
        throw errors.conflict("User with this username already exists");
      }
    }

    await transaction(async (t) => {
      const user = await User.create({
        username,
        email,
        passwordHash: password,
        role,
        isActive: true,
        approved: true, // ✅ Admin-created users are auto-approved
        profileInfo: {
          verificationLevel: "none",
          ...(profileInfo || {}), // ✅ Merge incoming business fields (venue/gallera data)
        },
      }, { transaction: t });

      // ✅ CREATE WALLET FOR NEW USER - Critical for balance adjustments
      await Wallet.create({
        userId: user.id,
        balance: 0,
        frozenAmount: 0,
      }, { transaction: t });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: await user.toPublicJSON(),
      });
    });
  })
);

// PUT /api/users/:id - Actualizar usuario (admin/operator)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  [
    param("id").isUUID().withMessage("Valid user ID required"),
    body("role")
      .optional()
      .isIn(["admin", "operator", "venue", "user", "gallera"])
      .withMessage("Invalid role"),
    body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
  ],
  asyncHandler(async (req, res) => {
    // 🔒 PROTECTION: Only allow role and isActive modifications via this endpoint
    const allowedFields = ["role", "isActive"];
    const invalidFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (invalidFields.length > 0) {
      throw errors.badRequest(
        `Only 'role' and 'isActive' fields can be modified. Invalid fields: ${invalidFields.join(", ")}`
      );
    }

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

    const userId = req.params.id;
    const { role, isActive } = req.body;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      throw errors.notFound("User not found");
    }

    // ⚡ SECURITY: Operators cannot modify admin/operator accounts
    if (req.user!.role === "operator") {
      if (["admin", "operator"].includes(targetUser.role)) {
        throw errors.forbidden("Operators cannot modify admin or operator accounts");
      }
      if (role && ["admin", "operator"].includes(role)) {
        throw errors.forbidden("Operators cannot assign admin or operator roles");
      }
    }

    // Update allowed fields
    let roleChanged = false;
    if (role !== undefined && targetUser.role !== role) {
      targetUser.role = role;
      roleChanged = true;
    }
    if (isActive !== undefined) targetUser.isActive = isActive;

    await targetUser.save();

    // ⚡ CRITICAL: Invalidate user cache if role changed to ensure new permissions take effect immediately
    if (roleChanged) {
      // Remove from local cache
      import('../middleware/auth').then(authModule => {
        authModule.clearUserCache(targetUser.id);
      }).catch(console.error);

      // Remove from Redis cache if applicable
      import('../config/redis').then(redisModule => {
        if (redisModule.delCache) {
          redisModule.delCache(`user_${targetUser.id}`)
            .catch(error => console.error('Error clearing user cache:', error));
        }
      }).catch(console.error);
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: await targetUser.toPublicJSON(),
    });
  })
);

// DELETE /api/users/:id - Desactivar usuario (solo admin)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  param("id").isUUID().withMessage("Valid user ID required"),
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

    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw errors.notFound("User not found");
    }

    // Don't allow deleting other admins
    if (user.role === "admin" && user.id !== req.user!.id) {
      throw errors.forbidden("Cannot delete other admin accounts");
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deactivated successfully",
      data: await user.toPublicJSON(),
    });
  })
);

// GET /api/users/:id/business-entity - Obtener entidad de negocio asociada (optimización)
router.get(
  "/:id/business-entity",
  optionalAuth,
  [
    param("id").isUUID().withMessage("Valid user ID required"),
  ],
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

    const userId = req.params.id;

    // ⚡ Redis cache key
    const cacheKey = `user:business-entity:${userId}`;

    const data = await getOrSet(cacheKey, async () => {
      const user = await User.findByPk(userId);

      if (!user) {
        throw errors.notFound("User not found");
      }

      // Check if user is venue or gallera
      // UPDATED: Venue/Gallera data now in user.profileInfo
      if (user.role === "venue") {
        return {
          success: true,
          data: {
            type: "venue",
            entity: {
              id: user.id,
              ownerId: user.id,
              name: user.profileInfo?.venueName || null,
              location: user.profileInfo?.venueLocation || null,
              description: user.profileInfo?.venueDescription || null,
              ...user.profileInfo
            },
          },
        };
      } else if (user.role === "gallera") {
        return {
          success: true,
          data: {
            type: "gallera",
            entity: {
              id: user.id,
              ownerId: user.id,
              name: user.profileInfo?.galleraName || null,
              location: user.profileInfo?.galleraLocation || null,
              description: user.profileInfo?.galleraDescription || null,
              ...user.profileInfo
            },
          },
        };
      } else {
        // User is not a business entity
        return {
          success: true,
          data: {
            type: null,
            entity: null,
          },
        };
      }
    }, 300); // 5 min TTL

    res.json(data);
  })
);

// PUT /api/users/:id/approve - Aprobar usuario (solo admin)
router.put(
  "/:id/approve",
  authenticate,
  authorize("admin"),
  param("id").isUUID().withMessage("Valid user ID required"),
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

    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw errors.notFound("User not found");
    }

    if (user.approved) {
      throw errors.badRequest("User is already approved");
    }

    user.approved = true;
    await user.save();

    res.json({
      success: true,
      message: "User approved successfully",
      data: await user.toPublicJSON(),
    });
  })
);

// PUT /api/users/:id/reject - Rechazar usuario (solo admin)
router.put(
  "/:id/reject",
  authenticate,
  authorize("admin"),
  [
    param("id").isUUID().withMessage("Valid user ID required"),
    body("reason").optional().isString().trim(),
  ],
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

    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw errors.notFound("User not found");
    }

    if (user.approved) {
      throw errors.badRequest("Cannot reject already approved user");
    }

    // Desactivar usuario al rechazar
    user.isActive = false;
    await user.save();

    // TODO: Enviar email de rechazo a usuario

    res.json({
      success: true,
      message: "User rejected successfully",
      data: await user.toPublicJSON(),
    });
  })
);

// POST /api/admin/users/:userId/adjust-balance - Ajuste manual de saldo (solo admin)
router.post(
  "/:userId/adjust-balance",
  authenticate,
  authorize("admin"),
  [
    param("userId").isUUID().withMessage("Valid user ID required"),
    body("type")
      .isIn(["credit", "debit"])
      .withMessage("Type must be 'credit' or 'debit'"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be a positive number"),
    body("reason")
      .isString()
      .isLength({ min: 10, max: 255 })
      .withMessage("Reason must be between 10 and 255 characters"),
  ],
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

    const { userId } = req.params;
    const { type, amount, reason } = req.body;
    const adminId = req.user!.id; // ID del administrador que realiza la acción

    await transaction(async (t) => {
      const user = await User.findByPk(userId, { transaction: t });
      if (!user) {
        throw errors.notFound("User not found");
      }

      const wallet = await Wallet.findOne({ where: { userId: user.id }, transaction: t });
      if (!wallet) {
        throw errors.notFound("User wallet not found");
      }

      let currentBalance = parseFloat(String(wallet.balance));
      let currentFrozen = parseFloat(String(wallet.frozenAmount));
      let newBalance = currentBalance;
      let transactionType: 'admin_credit' | 'admin_debit';
      let description: string;

      if (type === "credit") {
        newBalance += amount;
        transactionType = 'admin_credit';
        description = `Admin Credit: ${reason}`;
      } else { // type === "debit"
        const availableBalance = currentBalance - currentFrozen;
        if (availableBalance < amount) {
          throw errors.badRequest(
            `Insufficient available balance. Balance: $${currentBalance.toFixed(2)}, Frozen: $${currentFrozen.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`
          );
        }
        newBalance -= amount;
        transactionType = 'admin_debit';
        description = `Admin Debit: ${reason}`;
      }

      const originalBalance = currentBalance; // Capture original balance BEFORE update
      wallet.balance = newBalance;
      await wallet.save({ transaction: t });

      // Create transaction record
      await Transaction.create({
        walletId: wallet.id,
        type: transactionType,
        amount: amount,
        status: 'completed',
        description: description,
        metadata: {
          adminId: adminId,
          reason: reason,
          previousBalance: originalBalance, // Use original balance
          newBalance: newBalance,
        },
      }, { transaction: t });

      // Invalidate user profile cache to reflect new balance
      await invalidatePattern(`user:profile:${userId}`);

      // Attach wallet to user for toPublicJSON serialization
      (user as any).wallet = wallet;

      res.json({
        success: true,
        message: `Wallet ${type} adjusted successfully`,
        data: { user: await user.toPublicJSON(), wallet: wallet.toPublicJSON() },
      });
    });
  })
);

export default router;