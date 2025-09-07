// backend/src/middleware/cacheMiddleware.ts
// 🚀 REDIS CACHING MIDDLEWARE - Performance Optimization Phase 3

import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

interface CacheOptions {
  ttl: number; // Time to live in seconds
  keyPrefix?: string;
  varyBy?: string[]; // Request properties to include in cache key
  skipCache?: boolean; // Skip caching for this request
}

export const cache = (options: CacheOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = redisClient;
      
      if (!redis || options.skipCache) {
        return next();
      }

      // Generate cache key
      const cacheKey = generateCacheKey(req, options);
      
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData.toString()));
      }
      
      logger.debug(`Cache MISS: ${cacheKey}`);
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache response
      res.json = (data: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, options.ttl, JSON.stringify(data))
            .catch((err) => {
              logger.error('Redis cache write error:', err);
            });
        }
        
        return originalJson(data);
      };
      
      next();
      
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

const generateCacheKey = (req: Request, options: CacheOptions): string => {
  const prefix = options.keyPrefix || 'api';
  const path = req.path;
  const method = req.method.toLowerCase();
  
  let keyParts = [prefix, method, path];
  
  // Add query parameters
  if (Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    keyParts.push(sortedQuery);
  }
  
  // Add custom vary parameters
  if (options.varyBy) {
    options.varyBy.forEach(property => {
      const value = getPropertyValue(req, property);
      if (value) {
        keyParts.push(`${property}:${value}`);
      }
    });
  }
  
  return keyParts.join(':');
};

const getPropertyValue = (req: Request, property: string): string | undefined => {
  switch (property) {
    case 'userId':
      return (req as any).user?.id?.toString();
    case 'userRole':
      return (req as any).user?.role;
    case 'eventId':
      return req.params.eventId || req.body.eventId;
    case 'fightId':
      return req.params.fightId || req.body.fightId;
    default:
      return undefined;
  }
};

// Cache invalidation helpers
export const invalidateCache = async (pattern: string) => {
  try {
    const redis = redisClient;
    if (!redis) return;
    
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.debug(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

// Invalidate specific cache patterns after updates
export const invalidateEventCache = async (eventId?: string) => {
  const patterns = [
    'api:get:/api/events*',
    'api:get:/api/sse/events*'
  ];
  
  if (eventId) {
    patterns.push(`api:get:/api/events/${eventId}*`);
    patterns.push(`api:get:/api/sse/events/${eventId}*`);
  }
  
  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

export const invalidateFightCache = async (fightId?: string, eventId?: string) => {
  const patterns = [
    'api:get:/api/fights*',
    'api:get:/api/sse/fights*'
  ];
  
  if (fightId) {
    patterns.push(`api:get:/api/fights/${fightId}*`);
  }
  
  if (eventId) {
    patterns.push(`api:get:/api/events/${eventId}*`);
    await invalidateEventCache(eventId);
  }
  
  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

export const invalidateBetCache = async (userId?: string, fightId?: string) => {
  const patterns = [
    'api:get:/api/bets*',
    'api:get:/api/sse/bets*'
  ];
  
  if (userId) {
    patterns.push(`*userId:${userId}*`);
  }
  
  if (fightId) {
    patterns.push(`*fightId:${fightId}*`);
    await invalidateFightCache(fightId);
  }
  
  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

// Predefined cache configurations for common endpoints
export const cacheConfigs = {
  // Events - cache for 5 minutes, vary by user role
  events: {
    ttl: 300,
    keyPrefix: 'events',
    varyBy: ['userRole']
  },
  
  // Event details - cache for 2 minutes
  eventDetails: {
    ttl: 120,
    keyPrefix: 'event-details'
  },
  
  // Fights - cache for 30 seconds during active betting
  fights: {
    ttl: 30,
    keyPrefix: 'fights',
    varyBy: ['eventId']
  },
  
  // User profile - cache for 10 minutes, vary by user
  userProfile: {
    ttl: 600,
    keyPrefix: 'user-profile',
    varyBy: ['userId']
  },
  
  // Venues - cache for 1 hour
  venues: {
    ttl: 3600,
    keyPrefix: 'venues'
  },
  
  // Bets - cache for 10 seconds, vary by user and fight
  bets: {
    ttl: 10,
    keyPrefix: 'bets',
    varyBy: ['userId', 'fightId']
  }
};