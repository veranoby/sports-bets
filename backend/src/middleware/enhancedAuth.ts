// backend/src/middleware/enhancedAuth.ts - PRODUCTION READY
// Enhanced authentication middleware with session validation
// Author: QWEN - Security Enhancement Specialist

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { User } from '../models';
import { ActiveSession } from '../models';
import { SessionService } from '../services/sessionService';
import { logger } from '../config/logger';
import { errors } from '../middleware/errorHandler';

// User cache to prevent N+1 queries on authentication
interface CachedUser {
  user: User;
  expires: number;
}

const userCache = new Map<string, CachedUser>();
const USER_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for authenticated users

/**
 * Extract token from request headers
 * @param req - Express request object
 * @returns Token string or null
 */
const extractToken = (req: Request): string | null => {
  // Check for authorization header in multiple possible formats
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also search in cookies if needed
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Enhanced authentication middleware with session validation
 * Validates JWT token and checks for active session to prevent concurrent logins
 */
export const enhancedAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw errors.unauthorized('No token provided');
    }

    // Verify JWT token first
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    logger.debug('Token verified successfully');

    // Check user cache first to prevent N+1 queries
    const now = Date.now();
    let user: User;

    const cached = userCache.get(decoded.userId);
    if (cached && now < cached.expires) {
      user = cached.user;
      logger.debug(`🧠 User cache hit for userId: ${decoded.userId}`);
    } else {
      // Fetch from database only if not cached or expired
      const fetchedUser = await User.findByPk(decoded.userId);

      if (!fetchedUser || !fetchedUser.isActive) {
        throw errors.unauthorized('Invalid token or user inactive');
      }

      // Cache user for 2 minutes to prevent repeated DB calls
      userCache.set(decoded.userId, {
        user: fetchedUser,
        expires: now + USER_CACHE_DURATION
      });

      user = fetchedUser;
      logger.debug(`🔍 Database fetch for userId: ${decoded.userId}`);
    }

    if (!user || !user.isActive) {
      throw errors.unauthorized('Invalid token or user inactive');
    }

    // Enhanced security: Validate active session exists and is not expired
    // This prevents concurrent login by checking session is still active
    const session = await SessionService.validateSession(token);
    if (!session) {
      logger.warn(`🔒 Session validation failed for user ${user.username} (${user.id})`);
      throw errors.unauthorized('Session expired or invalidated. Please login again.');
    }

    // Additional security check: Verify session hasn't expired
    if (session.isExpired()) {
      logger.warn(`⏰ Session expired for user ${user.username} (${user.id})`);
      await session.invalidate(); // Clean up expired session
      throw errors.unauthorized('Session expired. Please login again.');
    }

    // Update last login is only updated during actual login in auth.ts
    // Removed excessive database updates per request

    req.user = user;
    req.sessionToken = token; // Attach for logout functionality
    next();
  } catch (error: any) {
    logger.error('Authentication error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(errors.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware with session validation
 * For endpoints that can be accessed by both authenticated and non-authenticated users
 */
export const enhancedOptionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Enhanced security: Check user cache first for optional auth too
      const now = Date.now();
      let user: User | null = null;

      const cached = userCache.get(decoded.userId);
      if (cached && now < cached.expires) {
        user = cached.user;
        logger.debug(`🧠 User cache hit for optional auth, userId: ${decoded.userId}`);
      } else {
        // Fetch from database only if not cached or expired
        const fetchedUser = await User.findByPk(decoded.userId);

        if (fetchedUser && fetchedUser.isActive) {
          // Enhanced security: Cache user for optional auth too
          userCache.set(decoded.userId, {
            user: fetchedUser,
            expires: now + USER_CACHE_DURATION
          });
          user = fetchedUser;
          logger.debug(`🔍 Database fetch for optional auth, userId: ${decoded.userId}`);
        }
      }

      if (user && user.isActive) {
        // Additional security: Validate session for authenticated optional users
        const session = await SessionService.validateSession(token);
        if (session && !session.isExpired()) {
          req.user = user;
          req.sessionToken = token;
        } else if (session) {
          // Clean up expired session
          await session.invalidate();
        }
      }
    }

    next();
  } catch (error) {
    // In optional authentication, continue without user if there's an error
    next();
  }
};

/**
 * Session management endpoints
 */
export const sessionEndpoints = {
  /**
   * Get all active sessions for current user
   * @route GET /api/auth/sessions
   */
  getActiveSessions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw errors.unauthorized('User not authenticated');
      }

      const sessions = await SessionService.getUserActiveSessions(req.user.id);

      res.json({
        success: true,
        data: {
          userId: req.user.id,
          sessions: sessions.map(session => ({
            id: session.id,
            deviceFingerprint: session.deviceFingerprint,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt,
            isActive: session.isActive
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Terminate specific session
   * @route DELETE /api/auth/sessions/:sessionId
   */
  terminateSession: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw errors.unauthorized('User not authenticated');
      }

      const { sessionId } = req.params;

      // Verify session belongs to user
      const session = await ActiveSession.findOne({
        where: {
          id: sessionId,
          userId: req.user.id
        }
      });

      if (!session) {
        throw errors.notFound('Session not found');
      }

      await SessionService.invalidateSession(session.sessionToken);

      res.json({
        success: true,
        message: 'Session terminated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Terminate all sessions except current
   * @route DELETE /api/auth/sessions/all-other
   */
  terminateAllOtherSessions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.sessionToken) {
        throw errors.unauthorized('User not authenticated');
      }

      // Get all active sessions for user except current session
      const otherSessions = await ActiveSession.findAll({
        where: {
          userId: req.user.id,
          sessionToken: { [Op.ne]: req.sessionToken }, // Not current session
          isActive: true
        }
      });

      // Invalidate all other sessions
      for (const session of otherSessions) {
        await SessionService.invalidateSession(session.sessionToken);
      }

      res.json({
        success: true,
        message: `Terminated ${otherSessions.length} other sessions successfully`,
        data: {
          terminatedCount: otherSessions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default {
  authenticate: enhancedAuthenticate,
  optionalAuth: enhancedOptionalAuth,
  sessionEndpoints
};