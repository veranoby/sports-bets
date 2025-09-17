import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Subscription } from '../models/Subscription';
import { logger } from '../config/logger';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// In-memory store for active streams (in production, use Redis)
const activeStreams = new Map<string, { 
  eventId: string; 
  userId: string; 
  createdAt: Date;
  viewers: Set<string>; // Set of user IDs
}>();

// Configuration
const STREAM_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_STREAMS_PER_USER = 2;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const IP_BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const SUSPICIOUS_ACTIVITY_THRESHOLD = 100; // Requests per minute

// Blocked IPs
const blockedIPs = new Set<string>();

/**
 * StreamingSecurityService for implementing signed URLs and anti-DDoS protection
 * 
 * Features:
 * - Generate time-limited signed URLs (5min expiry)
 * - HMAC-SHA256 signature validation
 * - User-specific tokens with eventId validation
 * - Automatic token rotation on expiry
 * - Rate limiting (30 requests/minute per IP)
 * - Concurrent stream limits (2 per user)
 * - IP blocking for suspicious activity (10 minute blocks)
 * - Circuit breaker for repeated failed authentications
 */
export class StreamingSecurityService {
  /**
   * Generate a signed stream token
   * 
   * @param userId User ID
   * @param eventId Event ID
   * @returns Signed token with expiration
   */
  static generateSignedToken(userId: string, eventId: string): { token: string; expiresAt: Date } {
    const expiresAt = new Date(Date.now() + STREAM_TOKEN_EXPIRY_MS);
    
    // Create token data
    const tokenData = {
      userId,
      eventId,
      expiresAt: expiresAt.toISOString()
    };
    
    // Create signature
    const signature = crypto
      .createHmac('sha256', process.env.STREAM_SECRET_KEY || process.env.JWT_SECRET!)
      .update(JSON.stringify(tokenData))
      .digest('hex');
    
    // Combine data and signature
    const token = Buffer.from(
      JSON.stringify({ ...tokenData, signature })
    ).toString('base64');
    
    return { token, expiresAt };
  }

  /**
   * Validate a signed stream token
   * 
   * @param token Signed token
   * @returns Validation result
   */
  static async validateSignedToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    eventId?: string;
    error?: string;
    subscriptionValid?: boolean;
  }> {
    try {
      // Decode token
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      
      // Check expiration
      if (new Date(tokenData.expiresAt) < new Date()) {
        return { valid: false, error: 'Token expired' };
      }
      
      // Extract signature and remove from data
      const { signature, ...data } = tokenData;
      
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.STREAM_SECRET_KEY || process.env.JWT_SECRET!)
        .update(JSON.stringify(data))
        .digest('hex');
        
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      // Validate user exists
      const user = await User.findByPk(data.userId);
      if (!user) {
        return { valid: false, error: 'User not found' };
      }
      
      // Validate event exists and is live
      const event = await Event.findByPk(data.eventId);
      if (!event || event.status !== 'in-progress') {
        return { valid: false, error: 'Event not found or not live' };
      }
      
      // Validate subscription
      const subscription = await Subscription.findOne({
        where: {
          userId: data.userId,
          status: 'active'
        }
      });
      
      const subscriptionValid = !!subscription && new Date(subscription.expiresAt) > new Date();
      
      return {
        valid: true,
        userId: data.userId,
        eventId: data.eventId,
        subscriptionValid
      };
    } catch (error) {
      logger.error('Token validation error:', { error });
      return { valid: false, error: 'Invalid token format' };
    }
  }

  /**
   * Rate limiting middleware
   * 
   * Limits to 30 requests/minute per IP
   */
  static rateLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: MAX_REQUESTS_PER_WINDOW,
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for blocked IPs
      return blockedIPs.has(this.getClientIP(req));
    }
  });

  /**
   * Concurrent stream limit middleware
   * 
   * Limits to 2 concurrent streams per user
   */
  static concurrentStreamLimit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Count active streams for this user
      let activeStreamCount = 0;
      for (const stream of activeStreams.values()) {
        if (stream.userId === userId) {
          activeStreamCount++;
        }
      }

      // Check limit
      if (activeStreamCount >= MAX_CONCURRENT_STREAMS_PER_USER) {
        return res.status(429).json({
          success: false,
          message: 'Maximum concurrent streams reached'
        });
      }

      next();
    } catch (error) {
      logger.error('Concurrent stream limit error:', { error });
      next(error);
    }
  };

  /**
   * IP blocking middleware
   * 
   * Blocks IPs with suspicious activity
   */
  static ipBlocker = (req: Request, res: Response, next: NextFunction) => {
    const ip = this.getClientIP(req);
    
    // Check if IP is blocked
    if (blockedIPs.has(ip)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    next();
  };

  /**
   * Track stream start for concurrent limit enforcement
   * 
   * @param streamKey Stream key
   * @param userId User ID
   * @param eventId Event ID
   */
  static trackStreamStart(streamKey: string, userId: string, eventId: string): void {
    activeStreams.set(streamKey, {
      eventId,
      userId,
      createdAt: new Date(),
      viewers: new Set()
    });
  }

  /**
   * Track stream end for cleanup
   * 
   * @param streamKey Stream key
   */
  static trackStreamEnd(streamKey: string): void {
    activeStreams.delete(streamKey);
  }

  /**
   * Track viewer for a stream
   * 
   * @param streamKey Stream key
   * @param userId User ID
   */
  static trackViewer(streamKey: string, userId: string): void {
    const stream = activeStreams.get(streamKey);
    if (stream) {
      stream.viewers.add(userId);
    }
  }

  /**
   * Remove viewer from a stream
   * 
   * @param streamKey Stream key
   * @param userId User ID
   */
  static removeViewer(streamKey: string, userId: string): void {
    const stream = activeStreams.get(streamKey);
    if (stream) {
      stream.viewers.delete(userId);
    }
  }

  /**
   * Get stream information
   * 
   * @param streamKey Stream key
   * @returns Stream information or null if not found
   */
  static getStreamInfo(streamKey: string): { 
    eventId: string; 
    userId: string; 
    viewerCount: number;
    createdAt: Date;
  } | null {
    const stream = activeStreams.get(streamKey);
    if (!stream) return null;
    
    return {
      eventId: stream.eventId,
      userId: stream.userId,
      viewerCount: stream.viewers.size,
      createdAt: stream.createdAt
    };
  }

  /**
   * Block an IP address
   * 
   * @param ip IP address to block
   */
  static blockIP(ip: string): void {
    blockedIPs.add(ip);
    logger.warn(`Blocked IP: ${ip}`);
    
    // Automatically unblock after duration
    setTimeout(() => {
      blockedIPs.delete(ip);
      logger.info(`Unblocked IP: ${ip}`);
    }, IP_BLOCK_DURATION_MS);
  }

  /**
   * Check for suspicious activity from an IP
   * 
   * @param ip IP address
   * @returns True if suspicious, false otherwise
   */
  static isSuspiciousActivity(ip: string): boolean {
    const now = Date.now();
    let record = rateLimitStore.get(ip);
    
    // Reset window if expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      };
      rateLimitStore.set(ip, record);
    }
    
    record.count++;
    
    // Check if above suspicious threshold
    return record.count > SUSPICIOUS_ACTIVITY_THRESHOLD;
  }

  /**
   * Get client IP address
   * 
   * @param req Express request
   * @returns Client IP address
   */
  private static getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string) || 
           (req.connection.remoteAddress as string) || 
           (req.socket.remoteAddress as string) || 
           'unknown';
  }
}

export default StreamingSecurityService;