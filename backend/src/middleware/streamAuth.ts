import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Event } from '../models/Event';

export interface StreamTokenPayload {
  userId: string;
  eventId: string;
  streamUrl: string;
  subscriptionId: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to validate stream access tokens
 */
export const validateStreamToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token as string;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Stream access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify JWT token
    let decoded: StreamTokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as StreamTokenPayload;
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: 'Invalid stream token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        success: false,
        message: 'Stream token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Verify user exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify subscription is still valid
    const subscription = await Subscription.findOne({
      where: {
        id: decoded.subscriptionId,
        userId: decoded.userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Subscription not found or inactive',
        code: 'SUBSCRIPTION_INVALID'
      });
    }

    // Check subscription expiry
    if (new Date(subscription.expiresAt) <= new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    // Verify event is still live
    const event = await Event.findByPk(decoded.eventId);
    if (!event || event.status !== 'live') {
      return res.status(403).json({
        success: false,
        message: 'Event is not currently live',
        code: 'EVENT_NOT_LIVE'
      });
    }

    // Add decoded token data to request
    req.streamToken = decoded;
    req.user = user;

    next();
  } catch (error) {
    console.error('Stream auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware to check if user has streaming permissions
 */
export const requireStreamingPermission = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const userRole = req.user.role;
  const allowedRoles = ['admin', 'operator'];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for streaming operations',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  next();
};

/**
 * Middleware to validate stream key format
 */
export const validateStreamKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const streamKey = req.params.streamKey || req.body.streamKey || req.query.streamKey;
  
  if (!streamKey) {
    return res.status(400).json({
      success: false,
      message: 'Stream key is required',
      code: 'STREAM_KEY_REQUIRED'
    });
  }

  // Validate stream key format: stream_timestamp_randomhex
  const streamKeyRegex = /^stream_\d+_[a-f0-9]+$/;
  if (!streamKeyRegex.test(streamKey)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stream key format',
      code: 'INVALID_STREAM_KEY'
    });
  }

  req.streamKey = streamKey;
  next();
};

/**
 * Rate limiting specifically for stream access
 */
export const streamAccessRateLimit = (maxRequests: number = 3, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip;
    const now = Date.now();
    
    let userRequests = requests.get(identifier);
    
    // Reset window if expired
    if (!userRequests || now > userRequests.resetTime) {
      userRequests = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    userRequests.count++;
    requests.set(identifier, userRequests);

    if (userRequests.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many stream access requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * Middleware to log stream access for analytics
 */
export const logStreamAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`Stream access: ${req.method} ${req.path}`, {
    userId: req.user?.id,
    eventId: req.streamToken?.eventId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    
    console.log(`Stream response: ${res.statusCode}`, {
      userId: req.user?.id,
      eventId: req.streamToken?.eventId,
      duration,
      success: data.success,
      timestamp: new Date().toISOString()
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Extend Request interface to include stream-specific properties
 */
declare global {
  namespace Express {
    interface Request {
      streamToken?: StreamTokenPayload;
      streamKey?: string;
    }
  }
}