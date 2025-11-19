import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { errors } from './errorHandler';
import { SessionService } from '../services/sessionService';

// ⚡ CRITICAL OPTIMIZATION: User cache to prevent N+1 queries on authentication
interface CachedUser {
  user: User;
  expires: number;
}

const userCache = new Map<string, CachedUser>();
const USER_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for authenticated users

// ⚡ OPTIMIZATION: Periodic cache cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, cached] of userCache.entries()) {
    if (now >= cached.expires) {
      userCache.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Extender Request interface para incluir user y queryFilter
declare global {
  namespace Express {
    interface Request {
      user?: User;
      queryFilter?: any;
    }
  }
}

/**
 * ⚡ CRITICAL: Subscription expiration check (PRD:149-153)
 *
 * Automatically expires subscriptions on each authenticated request if:
 * - subscription.expiresAt < current_time
 * - subscription.status === 'active'
 *
 * Changes subscription to 'expired' and invalidates user cache.
 * This ensures immediate access control update.
 */
async function checkAndExpireSubscription(userId: string): Promise<void> {
  try {
    const subscription = await Subscription.findOne({
      where: { userId, status: 'active' },
      order: [['createdAt', 'DESC']]
    });

    if (subscription && subscription.isExpired()) {
      console.log(`⏰ Expiring subscription for user ${userId}`);

      // Mark subscription as expired
      await subscription.markAsExpired();

      // Invalidate user cache to force re-fetch on next request
      userCache.delete(userId);

      console.log(`✅ Subscription expired and cache invalidated for user ${userId}`);
    }
  } catch (error) {
    console.error('Error checking subscription expiration:', error);
    // Don't throw - allow request to continue
    // Subscription check is important but shouldn't block authentication
  }
}

// Middleware de autenticación
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw errors.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // ⚡ SECURITY: Validate active session (concurrent login prevention)
    const activeSession = await SessionService.validateSession(token);
    if (!activeSession) {
      throw errors.unauthorized('Session expired or invalidated. Please login again.');
    }

    // ⚡ CRITICAL OPTIMIZATION: Check user cache first to prevent N+1 queries
    const now = Date.now();
    let user: User;

    const cached = userCache.get(decoded.userId);
    if (cached && now < cached.expires) {
      user = cached.user;
    } else {
      // Fetch from database only if not cached or expired
      const fetchedUser = await User.findByPk(decoded.userId);

      if (!fetchedUser || !fetchedUser.isActive) {
        throw errors.unauthorized('Invalid token or user inactive');
      }

      // ⚡ CRITICAL: Cache user for 2 minutes to prevent repeated DB calls
      userCache.set(decoded.userId, {
        user: fetchedUser,
        expires: now + USER_CACHE_DURATION
      });

      user = fetchedUser;
    }

    if (!user || !user.isActive) {
      throw errors.unauthorized('Invalid token or user inactive');
    }

    // ⚡ CRITICAL: Check subscription expiration (PRD:149-153)
    // Auto-expire subscriptions on each authenticated request
    await checkAndExpireSubscription(user.id);

    // ⚠️ Check if user account is approved (except for admins/operators who are auto-approved)
    if (["venue", "gallera"].includes(user.role) && !user.approved) {
      throw errors.forbidden(
        `Your ${user.role} account is pending admin approval. Please check your email for status updates.`
      );
    }

    // lastLogin is only updated during actual login in auth.ts
    // Removed excessive database updates per request

    req.user = user;
    next();
  } catch (error: any) {
    console.log('Authentication error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(errors.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

// Middleware de autorización por rol
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(errors.unauthorized('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(errors.forbidden('Insufficient permissions'));
    }

    next();
  };
};

// Función para extraer token del header
const extractToken = (req: Request): string | null => {
  // Check for authorization header in multiple possible formats
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for token in query parameters (for SSE connections)
  // SSE cannot send custom headers, so token is passed as ?token=...
  if (req.query && req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // También buscar en cookies si es necesario
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

// Middleware para rutas opcionales de autenticación
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // ⚡ CRITICAL OPTIMIZATION: Check user cache first for optional auth too
      const now = Date.now();
      let user: User | null = null;

      const cached = userCache.get(decoded.userId);
      if (cached && now < cached.expires) {
        user = cached.user;
      } else {
        // Fetch from database only if not cached or expired
        const fetchedUser = await User.findByPk(decoded.userId);

        if (fetchedUser && fetchedUser.isActive) {
          // ⚡ CRITICAL: Cache user for optional auth too
          userCache.set(decoded.userId, {
            user: fetchedUser,
            expires: now + USER_CACHE_DURATION
          });
          user = fetchedUser;
        }
      }

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // En autenticación opcional, continuamos sin usuario si hay error
    next();
  }
};

// Middleware para filtrar datos para operadores
export const filterByOperatorAssignment = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si el usuario es un operador, añadimos un filtro para sus consultas.
  // Este filtro será usado en los controladores para limitar los resultados
  // a los eventos/datos que le han sido asignados.
  if (req.user?.role === 'operator') {
    // Se adjunta el filtro al objeto de la petición.
    // Los controladores deben estar preparados para usar este filtro.
    req.queryFilter = { operatorId: req.user.id };
  }

  // Si el rol es 'admin' o cualquier otro, no se aplica ningún filtro,
  // permitiendo acceso completo (según lo definido en 'authorize').
  next();
};
