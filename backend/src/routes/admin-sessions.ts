import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { SessionService } from '../services/sessionService';

const router = Router();

/**
 * GET /api/admin/sessions/active-users
 * Get list of currently active users (with valid sessions)
 * Returns: { activeUserIds: string[], userSessions: Array<{userId, username, lastActivity}> }
 */
router.get('/admin/sessions/active-users', authenticate, authorize('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const { ActiveSession, User } = require('../models');

    // Get all active sessions that haven't expired
    const activeSessions = await ActiveSession.findAll({
      where: {
        isActive: true,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
          required: true
        }
      ],
      attributes: ['userId', 'lastActivity', 'createdAt'],
      raw: false
    });

    // Extract unique user IDs
    const activeUserIds = [...new Set(activeSessions.map((s: any) => s.userId))];

    // Build user sessions response
    const userSessions = activeSessions.map((session: any) => ({
      userId: session.userId,
      username: session.User?.username,
      lastActivity: session.lastActivity,
      connectedAt: session.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        activeUserIds,
        userSessions,
        totalActiveSessions: activeSessions.length
      }
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching active users'
    });
  }
});

/**
 * DELETE /api/admin/sessions/:userId
 * Force logout all sessions for a specific user
 */
router.delete('/admin/sessions/:userId', authenticate, authorize('admin', 'operator'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Invalidate all sessions for the user
    const result = await SessionService.invalidateAllUserSessions(userId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        userId: userId,
        count: result.count
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to invalidate user sessions'
      });
    }
  } catch (error) {
    console.error('Error invalidating user sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while invalidating user sessions'
    });
  }
});

export default router;