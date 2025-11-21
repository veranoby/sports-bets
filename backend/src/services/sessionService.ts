// backend/src/services/sessionService.ts - PRODUCTION READY
// Session management service for concurrent login prevention
// Author: QWEN - Security Enhancement Specialist

import crypto from 'crypto';
import { ActiveSession } from '../models';
import { User } from '../models';
import { Op, Transaction } from 'sequelize';
import { logger } from '../config/logger';

export class SessionService {
  /**
   * Generate device fingerprint from request information
   * @param userAgent - User agent string
   * @param ipAddress - IP address
   * @returns Device fingerprint hash
   */
  static generateDeviceFingerprint(
    userAgent: string,
    ipAddress: string
  ): string {
    // Create a hash of user agent and IP address for device fingerprinting
    return crypto
      .createHash('sha256')
      .update(`${userAgent}:${ipAddress}`)
      .digest('hex')
      .substring(0, 64);
  }

  /**
   * Create new session ONLY if no active session exists
   * Implements concurrent login prevention by REJECTING login attempts
   * @param userId - User ID
   * @param sessionToken - JWT session token
   * @param req - Request object containing user agent and IP
   * @returns Created ActiveSession instance
   * @throws Error if active session already exists
   */
  static async createSession(
    userId: string,
    sessionToken: string,
    req: any
  ): Promise<ActiveSession> {
    const { sequelize } = require('../config/database');

    try {
      const userAgent = req.get('User-Agent') || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const deviceFingerprint = this.generateDeviceFingerprint(
        userAgent,
        ipAddress
      );

      // ⚡ STRICT SECURITY: Check for existing active sessions
      const session = await sequelize.transaction(async (t: any) => {
        // Lock and check for any active sessions
        const existingSessions = await ActiveSession.findAll({
          where: {
            userId,
            isActive: true,
            expiresAt: { [Op.gt]: new Date() }
          },
          lock: Transaction.LOCK.UPDATE,
          transaction: t
        });

        // 🧹 AUTO-CLEANUP: Remove stale sessions (>30 min without activity)
        const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
        const staleSessions = existingSessions.filter(
          s => s.lastActivity < staleThreshold
        );

        if (staleSessions.length > 0) {
          const staleIds = staleSessions.map(s => s.id);
          await ActiveSession.destroy({
            where: { id: staleIds },
            transaction: t
          });
          logger.info(`Auto-cleaned ${staleSessions.length} stale sessions for user ${userId}`);
        }

        // Check if there are still active sessions after cleanup
        const activeSessions = existingSessions.filter(
          s => s.lastActivity >= staleThreshold
        );

        // ❌ REJECT login if active session exists (not stale)
        if (activeSessions.length > 0) {
          const lastSession = activeSessions[0];
          const error: any = new Error('Ya existe una sesión activa para este usuario. Cierra la sesión anterior antes de iniciar una nueva.');
          error.code = 'SESSION_CONFLICT';
          error.statusCode = 409;
          error.existingSession = {
            deviceFingerprint: lastSession.deviceFingerprint,
            ipAddress: lastSession.ipAddress,
            lastActivity: lastSession.lastActivity
          };
          throw error;
        }

        // Calculate expiration date (24 hours from now)
        // CHANGED: Reduced from 7 days to 24 hours for better security
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours TTL

        // Create new active session (no existing sessions, safe to proceed)
        const newSession = await ActiveSession.create({
          userId,
          sessionToken,
          deviceFingerprint,
          ipAddress,
          userAgent,
          expiresAt,
          isActive: true
        }, { transaction: t });

        return newSession;
      });

      logger.info(`Created new active session for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Validate if session is active and not expired
   * @param sessionToken - JWT session token to validate
   * @returns ActiveSession if valid, null otherwise
   */
  static async validateSession(
    sessionToken: string
  ): Promise<ActiveSession | null> {
    try {
      const session = await ActiveSession.findOne({
        where: {
          sessionToken,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() } // Not expired
        }
      });

      if (session) {
        // Update last activity timestamp
        await session.updateActivity();
        return session;
      }

      return null;
    } catch (error) {
      logger.error('Error validating session:', error);
      return null;
    }
  }

  /**
   * Invalidate specific session (logout)
   * CHANGED: DELETE session instead of UPDATE to ensure immediate cleanup
   * @param sessionToken - Session token to invalidate
   */
  static async invalidateSession(sessionToken: string): Promise<void> {
    try {
      const deleted = await ActiveSession.destroy({
        where: { sessionToken }
      });

      if (deleted > 0) {
        logger.info(`Deleted session on logout: ${sessionToken}`);
      } else {
        logger.warn(`Session not found for deletion: ${sessionToken}`);
      }
    } catch (error) {
      logger.error('Error invalidating session:', error);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a specific user
   * Used for forced logout or security purposes
   * @param userId - User ID whose sessions to invalidate
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const result = await ActiveSession.update(
        { isActive: false },
        { 
          where: { 
            userId, 
            isActive: true 
          } 
        }
      );

      logger.info(`Invalidated all ${result[0]} sessions for user ${userId}`);
    } catch (error) {
      logger.error('Error invalidating all user sessions:', error);
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   * Used for session management UI
   * @param userId - User ID
   * @returns Array of active sessions
   */
  static async getUserActiveSessions(
    userId: string
  ): Promise<ActiveSession[]> {
    try {
      return await ActiveSession.findAll({
        where: {
          userId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        order: [['lastActivity', 'DESC']],
        limit: 10 // Limit to prevent excessive data transfer
      });
    } catch (error) {
      logger.error('Error getting user active sessions:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired sessions (periodic maintenance)
   * DELETES sessions that are expired or inactive for >30 days
   * @returns Number of sessions deleted
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // DELETE (not UPDATE) sessions that are:
      // 1. Expired (expiresAt < now) OR
      // 2. Inactive AND older than 30 days
      const deleted = await ActiveSession.destroy({
        where: {
          [Op.or]: [
            { expiresAt: { [Op.lt]: new Date() } },
            {
              isActive: false,
              createdAt: { [Op.lt]: thirtyDaysAgo }
            }
          ]
        }
      });

      logger.info(`Deleted ${deleted} expired/old sessions (reduces table bloat)`);
      return deleted;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Check for suspicious activity patterns
   * Detects potential account sharing or unauthorized access
   * @param userId - User ID to check
   * @returns Object with suspicious activity information
   */
  static async checkSuspiciousActivity(userId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    sessions: ActiveSession[];
  }> {
    try {
      // Get recent active sessions for this user
      const recentSessions = await ActiveSession.findAll({
        where: {
          userId,
          isActive: true,
          lastActivity: {
            [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        order: [['lastActivity', 'DESC']]
      });

      const reasons: string[] = [];
      
      // Check for concurrent sessions from different IPs
      const ipAddresses = new Set(recentSessions.map(s => s.ipAddress));
      if (ipAddresses.size > 1) {
        reasons.push(`Active sessions from ${ipAddresses.size} different IP addresses`);
      }

      // Check for concurrent sessions from different devices
      const fingerprints = new Set(recentSessions.map(s => s.deviceFingerprint));
      if (fingerprints.size > 1) {
        reasons.push(`Active sessions from ${fingerprints.size} different devices`);
      }

      // Check for sessions with very close activity times (potential automation)
      if (recentSessions.length > 1) {
        let concurrentCount = 0;
        for (let i = 0; i < recentSessions.length - 1; i++) {
          const timeDiff = recentSessions[i].lastActivity.getTime() - 
                          recentSessions[i + 1].lastActivity.getTime();
          if (Math.abs(timeDiff) < 5000) { // Within 5 seconds
            concurrentCount++;
          }
        }
        if (concurrentCount > 0) {
          reasons.push(`Possible concurrent automated sessions (${concurrentCount} within 5 seconds)`);
        }
      }

      return {
        isSuspicious: reasons.length > 0,
        reasons,
        sessions: recentSessions
      };
    } catch (error) {
      logger.error('Error checking suspicious activity:', error);
      return {
        isSuspicious: false,
        reasons: ['Error checking suspicious activity'],
        sessions: []
      };
    }
  }

  /**
   * Get session statistics for monitoring
   * @returns Session statistics
   */
  static async getSessionStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    usersWithMultipleSessions: number;
  }> {
    try {
      const totalSessions = await ActiveSession.count();
      const activeSessions = await ActiveSession.count({
        where: {
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        }
      });
      const expiredSessions = await ActiveSession.count({
        where: {
          [Op.or]: [
            { isActive: false },
            { expiresAt: { [Op.lt]: new Date() } }
          ]
        }
      });

      // Count users with multiple active sessions (should be 0 in strict mode)
      const usersWithMultipleSessionsResult = await ActiveSession.sequelize?.query(`
        SELECT COUNT(*) as count
        FROM (
          SELECT user_id
          FROM active_sessions
          WHERE is_active = true AND expires_at > NOW()
          GROUP BY user_id
          HAVING COUNT(*) > 1
        ) multiple_sessions
      `, {
        type: 'SELECT'
      });

      const usersWithMultipleSessions = usersWithMultipleSessionsResult && usersWithMultipleSessionsResult.length > 0 
        ? (usersWithMultipleSessionsResult[0] as any).count 
        : 0;

      return {
        totalSessions,
        activeSessions,
        expiredSessions,
        usersWithMultipleSessions
      };
    } catch (error) {
      logger.error('Error getting session statistics:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        usersWithMultipleSessions: 0
      };
    }
  }
}

export default SessionService;