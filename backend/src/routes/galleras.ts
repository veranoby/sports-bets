// backend/src/routes/galleras.ts
// API para la nueva entidad Gallera

import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { User, Subscription } from "../models";
import { body, validationResult } from "express-validator";
import { getOrSet, invalidatePattern } from "../config/redis";
import { Op } from "sequelize";

const router = Router();

// GET /api/galleras - Listar todas las galleras
router.get(
  "/",
  optionalAuth, // O `authenticate` si solo usuarios logueados pueden verlas
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, ownerApproved, ownerSubscription, search } = req.query as any;
    const userRole = req.user?.role || 'public';

    // ⚡ Redis cache key
    const cacheKey = `galleras:list:${userRole}:${ownerApproved || 'all'}:${ownerSubscription || 'all'}:${search || 'all'}:${limit}:${offset}`;

    const data = await getOrSet(cacheKey, async () => {
      // ✅ CONSOLIDATED ARCHITECTURE: Query from users table (source of truth)
      // Galleras table ELIMINATED - all data in User.profileInfo
      const userWhere: any = {
        role: 'gallera',
        isActive: true
      };

      // Add owner approval filter
      if (ownerApproved !== undefined) {
        userWhere.approved = ownerApproved === "true";
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
      let subscriptionInclude = [];
      if (ownerSubscription === 'free') {
        // Find users WITH NO active subscription OR with status='free'
        subscriptionInclude = [{
          model: Subscription,
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
      } else if (ownerSubscription === 'monthly') {
        subscriptionInclude = [{
          model: Subscription,
          attributes: ['type', 'status', 'expiresAt'],
          required: true, // INNER JOIN - only users WITH matching subscription
          where: {
            type: 'monthly',
            status: 'active',
            expiresAt: { [Op.gt]: new Date() }
          }
        }];
      } else if (ownerSubscription === 'daily') {
        subscriptionInclude = [{
          model: Subscription,
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
        userWhere[Op.and] = conditions;
      }

      const { count, rows } = await User.findAndCountAll({
        where: userWhere,
        attributes: ["id", "username", "email", "profileInfo", "approved", "isActive", "createdAt", "updatedAt"],
        include: [
          // Include Subscription for filtering only
          ...subscriptionInclude,
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        subQuery: false,
      });

      // ✅ Transform response to match expected format
      // CONSOLIDATED ARCHITECTURE: Data comes ONLY from User.profileInfo
      const transformedRows = rows.map((user: any) => {
        const profile = user.profileInfo || {};
        // Status is CALCULATED: (isActive && approved) determines status
        const calculatedStatus =
          user.isActive && user.approved ? 'active' :
          user.isActive && !user.approved ? 'pending' :
          'inactive';

        return {
          id: user.id,
          name: (profile as any).galleraName || user.username,
          location: (profile as any).galleraLocation || '',
          description: (profile as any).galleraDescription || '',
          status: calculatedStatus,
          isVerified: false,
          images: (profile as any).images || [],
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

      return {
        success: true,
        data: {
          users: transformedRows,
          total: count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      };
    }, 300); // 5 min TTL (galleras change rarely)

    res.json(data);
  })
);

// GET /api/galleras/:id - Obtener gallera específica (usuario con rol='gallera')
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const userRole = req.user?.role || 'public';
    const cacheKey = `gallera:${req.params.id}:${userRole}`;

    const data = await getOrSet(cacheKey, async () => {
      // CONSOLIDATED ARCHITECTURE: Get user with role='gallera' instead of Gallera table
      const user = await User.findOne({
        where: { id: req.params.id, role: 'gallera' },
        attributes: ["id", "username", "email", "profileInfo", "approved", "isActive", "createdAt", "updatedAt"],
      });

      if (!user) {
        throw errors.notFound("Gallera not found");
      }

      // Transform user to gallera response format
      const profile = user.profileInfo || {};
      const calculatedStatus =
        user.isActive && user.approved ? 'active' :
        user.isActive && !user.approved ? 'pending' :
        'inactive';

      const galleraData = {
        id: user.id,
        name: (profile as any).galleraName || user.username,
        location: (profile as any).galleraLocation || '',
        description: (profile as any).galleraDescription || '',
        status: calculatedStatus,
        isVerified: false,
        images: (profile as any).images || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        owner: {
          id: user.id,
          username: user.username,
          email: user.email,
          profileInfo: user.profileInfo,
        },
      };

      return {
        success: true,
        data: galleraData,
      };
    }, 300); // 5 min TTL

    res.json(data);
  })
);

// NOTE 2025-10-30: POST, PUT, DELETE endpoints removed
// CONSOLIDATED ARCHITECTURE: Gallera data is now managed through User endpoints
// Instead of /galleras POST/PUT/DELETE, use /users POST/PUT endpoints
// Gallera profile data is stored in User.profileInfo (galleraName, galleraLocation, etc.)

export default router;
