// backend/src/services/subscriptionUpdateService.ts
// Service for updating user subscriptions when membership requests are approved

import { Subscription } from "../models";
import { User } from "../models/User";
import { logger } from "../config/logger";
import { errors } from "../middleware/errorHandler";

/**
 * Update user subscription when membership request is approved
 * @param userId - User ID
 * @param requestedMembershipType - Requested membership type ('24-hour' | 'monthly')
 * @param adminId - Admin who approved the request
 * @param requestId - Membership request ID
 */
export async function updateUserSubscription(
  userId: string,
  requestedMembershipType: '24-hour' | 'monthly',
  adminId: string,
  requestId: string
): Promise<Subscription> {
  try {
    // Get the user
    const user = await User.findByPk(userId);
    if (!user) {
      throw errors.notFound('Usuario no encontrado');
    }

    // Calculate expiry date based on requested membership type
    const now = new Date();
    let expiresAt: Date | null = null;

    if (requestedMembershipType === '24-hour') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (requestedMembershipType === 'monthly') {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      // If requested type is not recognized, default to free
      throw errors.badRequest('Tipo de membresía solicitado no válido');
    }

    // Create or update subscription based on the requested membership type
    const [subscription, created] = await Subscription.findOrCreate({
      where: { userId: user.id, status: 'active' },
      defaults: {
        userId: user.id,
        type: requestedMembershipType === '24-hour' ? 'daily' : 'monthly',
        status: 'active',
        manual_expires_at: expiresAt,
        expiresAt: expiresAt!,
        paymentMethod: 'cash', // Admin manual assignment
        autoRenew: false,
        amount: 0,
        currency: 'USD',
        metadata: {
          assignedBy: adminId,
          assignedAt: new Date().toISOString(),
          manualAssignment: true,
          fromRequest: requestId
        }
      }
    });

    if (!created && subscription.status === 'active') {
      // Update existing subscription if it's active
      await subscription.update({
        type: requestedMembershipType === '24-hour' ? 'daily' : 'monthly',
        manual_expires_at: expiresAt,
        expiresAt: expiresAt!,
        metadata: {
          ...subscription.metadata,
          lastAssignedBy: adminId,
          lastAssignedAt: new Date().toISOString(),
          fromRequest: requestId
        }
      });
    }

    logger.info(`✅ Subscription updated for user ${userId}: ${requestedMembershipType} (${created ? 'created' : 'updated'})`);

    return subscription;
  } catch (error) {
    logger.error(`❌ Failed to update subscription for user ${userId}:`, error);
    throw error;
  }
}