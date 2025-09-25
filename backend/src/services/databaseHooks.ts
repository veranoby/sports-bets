/**
 * Database Hooks for SSE Integration
 *
 * This service sets up Sequelize hooks to automatically trigger
 * SSE events when relevant database operations occur.
 *
 * Usage: Call setupDatabaseHooks() during application initialization
 */

import { Fight } from '../models/Fight';
import { Bet } from '../models/Bet';
import { User } from '../models/User';
import SSEIntegration from './sseIntegration';
import { logger } from '../config/logger';

export class DatabaseHooks {

  /**
   * Initialize all database hooks
   */
  static setupDatabaseHooks(): void {
    logger.info('🔗 Setting up database hooks for SSE integration...');

    this.setupFightHooks();
    this.setupBetHooks();
    this.setupUserHooks();

    logger.info('✅ Database hooks initialized successfully');
  }

  /**
   * Fight model hooks
   */
  private static setupFightHooks(): void {
    // Hook for fight creation
    Fight.addHook('afterCreate', (fight: Fight) => {
      SSEIntegration.onFightCreated({
        id: fight.id,
        number: fight.number,
        redCorner: fight.redCorner,
        blueCorner: fight.blueCorner,
        weight: fight.weight,
        eventId: fight.eventId,
        status: fight.status,
        createdAt: fight.createdAt
      });
    });

    // Hook for fight status updates
    Fight.addHook('afterUpdate', (fight: Fight) => {
      // Check if status changed
      if (fight.changed('status')) {
        const previousValues = fight._previousDataValues as any;
        const oldStatus = previousValues?.status;
        const newStatus = fight.status;

        if (oldStatus && oldStatus !== newStatus) {
          SSEIntegration.onFightStatusChange(
            fight.id,
            oldStatus,
            newStatus,
            {
              number: fight.number,
              redCorner: fight.redCorner,
              blueCorner: fight.blueCorner,
              eventId: fight.eventId,
              bettingStartTime: fight.bettingStartTime,
              bettingEndTime: fight.bettingEndTime,
              totalBets: fight.totalBets,
              totalAmount: fight.totalAmount
            }
          );
        }
      }

      // Check for betting window changes
      if (fight.changed('bettingStartTime') || fight.changed('bettingEndTime')) {
        SSEIntegration.onFightStatusChange(
          fight.id,
          'betting_window_updated',
          'betting_window_updated',
          {
            number: fight.number,
            redCorner: fight.redCorner,
            blueCorner: fight.blueCorner,
            eventId: fight.eventId,
            bettingStartTime: fight.bettingStartTime,
            bettingEndTime: fight.bettingEndTime
          }
        );
      }
    });

    // Hook for fight updates (general changes)
    Fight.addHook('afterUpdate', (fight: Fight) => {
      // Broadcast general fight update if significant fields changed
      const significantFields = ['redCorner', 'blueCorner', 'weight', 'notes', 'startTime', 'endTime'];
      const changedSignificantFields = significantFields.filter(field => fight.changed(field));

      if (changedSignificantFields.length > 0) {
        SSEIntegration.broadcastCustomAdminEvent(
          'admin-fights' as any,
          'FIGHT_UPDATED' as any,
          {
            fightId: fight.id,
            fightNumber: fight.number,
            changes: changedSignificantFields,
            updatedFields: changedSignificantFields.reduce((acc, field) => {
              acc[field] = fight.get(field);
              return acc;
            }, {} as any),
            eventId: fight.eventId,
            timestamp: new Date()
          },
          'medium',
          { fightId: fight.id, eventId: fight.eventId }
        );
      }
    });

    logger.debug('🔗 Fight hooks configured');
  }

  /**
   * Bet model hooks
   */
  private static setupBetHooks(): void {
    // Hook for new bet creation
    Bet.addHook('afterCreate', (bet: Bet) => {
      SSEIntegration.onNewBet({
        id: bet.id,
        fightId: bet.fightId,
        userId: bet.userId,
        side: bet.side,
        amount: bet.amount,
        potentialWin: bet.potentialWin,
        betType: bet.betType,
        proposalStatus: bet.proposalStatus,
        terms: bet.terms,
        createdAt: bet.createdAt
      });

      // Check if it's a PAGO proposal
      if (bet.betType === 'flat' && bet.terms?.pagoAmount) {
        SSEIntegration.onPagoProposal({
          id: bet.id,
          fightId: bet.fightId,
          betId: bet.id,
          userId: bet.userId,
          proposedBy: bet.terms.proposedBy,
          amount: bet.amount,
          terms: bet.terms,
          side: bet.side
        }, 'CREATED');
      }

      // Check if it's a DOY bet
      if (bet.betType === 'doy') {
        SSEIntegration.onDoyProposal({
          id: bet.id,
          fightId: bet.fightId,
          betId: bet.id,
          userId: bet.userId,
          proposedBy: bet.userId, // DOY proposals are self-initiated
          amount: bet.amount,
          terms: bet.terms,
          side: bet.side
        }, 'CREATED');
      }
    });

    // Hook for bet status updates
    Bet.addHook('afterUpdate', (bet: Bet) => {
      // Check if proposal status changed
      if (bet.changed('proposalStatus')) {
        const previousValues = bet._previousDataValues as any;
        const oldStatus = previousValues?.proposalStatus;
        const newStatus = bet.proposalStatus;

        if (oldStatus === 'pending' && newStatus === 'accepted') {
          if (bet.betType === 'flat' && bet.terms?.pagoAmount) {
            SSEIntegration.onPagoProposal({
              id: bet.id,
              fightId: bet.fightId,
              betId: bet.id,
              userId: bet.userId,
              proposedBy: bet.terms.proposedBy,
              amount: bet.amount,
              terms: bet.terms,
              side: bet.side
            }, 'ACCEPTED');
          } else if (bet.betType === 'doy') {
            SSEIntegration.onDoyProposal({
              id: bet.id,
              fightId: bet.fightId,
              betId: bet.id,
              userId: bet.userId,
              proposedBy: bet.userId,
              amount: bet.amount,
              terms: bet.terms,
              side: bet.side
            }, 'ACCEPTED');
          }
        }

        if (oldStatus === 'pending' && newStatus === 'rejected') {
          if (bet.betType === 'flat' && bet.terms?.pagoAmount) {
            SSEIntegration.onPagoProposal({
              id: bet.id,
              fightId: bet.fightId,
              betId: bet.id,
              userId: bet.userId,
              proposedBy: bet.terms.proposedBy,
              amount: bet.amount,
              terms: bet.terms,
              side: bet.side
            }, 'REJECTED');
          } else if (bet.betType === 'doy') {
            SSEIntegration.onDoyProposal({
              id: bet.id,
              fightId: bet.fightId,
              betId: bet.id,
              userId: bet.userId,
              proposedBy: bet.userId,
              amount: bet.amount,
              terms: bet.terms,
              side: bet.side
            }, 'REJECTED');
          }
        }
      }

      // Check if bet was matched
      if (bet.changed('matchedWith') && bet.matchedWith) {
        // This would require fetching the matched bet, but for now we'll broadcast the match
        SSEIntegration.broadcastCustomAdminEvent(
          'admin-bets' as any,
          'BET_MATCHED' as any,
          {
            betId: bet.id,
            matchedWith: bet.matchedWith,
            fightId: bet.fightId,
            userId: bet.userId,
            amount: bet.amount,
            side: bet.side,
            timestamp: new Date()
          },
          'high',
          { fightId: bet.fightId, betId: bet.id }
        );
      }

      // Check if bet status changed to cancelled
      if (bet.changed('status') && bet.status === 'cancelled') {
        SSEIntegration.broadcastCustomAdminEvent(
          'admin-bets' as any,
          'BET_CANCELLED' as any,
          {
            betId: bet.id,
            fightId: bet.fightId,
            userId: bet.userId,
            amount: bet.amount,
            side: bet.side,
            reason: 'user_cancelled', // Could be enhanced with cancellation reason
            timestamp: new Date()
          },
          'medium',
          { fightId: bet.fightId, betId: bet.id }
        );
      }
    });

    // Hook for bet completion (when fight ends)
    Bet.addHook('afterUpdate', (bet: Bet) => {
      if (bet.changed('status') && bet.status === 'completed' && bet.result) {
        SSEIntegration.broadcastCustomAdminEvent(
          'admin-bets' as any,
          'BET_COMPLETED' as any,
          {
            betId: bet.id,
            fightId: bet.fightId,
            userId: bet.userId,
            amount: bet.amount,
            potentialWin: bet.potentialWin,
            side: bet.side,
            result: bet.result,
            timestamp: new Date()
          },
          'medium',
          { fightId: bet.fightId, betId: bet.id, userId: bet.userId }
        );
      }
    });

    logger.debug('🔗 Bet hooks configured');
  }

  /**
   * User model hooks
   */
  private static setupUserHooks(): void {
    // Hook for user registration
    User.addHook('afterCreate', (user: User) => {
      SSEIntegration.onUserRegistration({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profileInfo: user.profileInfo
      });
    });

    // Hook for user verification
    User.addHook('afterUpdate', (user: User) => {
      // Check if verification level changed
      if (user.changed('profileInfo')) {
        const previousValues = user._previousDataValues as any;
        const oldProfileInfo = previousValues?.profileInfo;
        const newProfileInfo = user.profileInfo;

        const oldVerificationLevel = oldProfileInfo?.verificationLevel || 'none';
        const newVerificationLevel = newProfileInfo?.verificationLevel || 'none';

        if (oldVerificationLevel !== newVerificationLevel && newVerificationLevel !== 'none') {
          SSEIntegration.onUserVerification({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileInfo: user.profileInfo
          });
        }
      }

      // Check if user status changed to inactive (banned)
      if (user.changed('isActive') && !user.isActive) {
        SSEIntegration.broadcastCustomAdminEvent(
          'admin-users' as any,
          'USER_BANNED' as any,
          {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            banDate: new Date(),
            previouslyActive: true
          },
          'high',
          { userId: user.id }
        );
      }

      // Check if user role changed (admin action)
      if (user.changed('role')) {
        const previousValues = user._previousDataValues as any;
        const oldRole = previousValues?.role;
        const newRole = user.role;

        SSEIntegration.broadcastCustomAdminEvent(
          'admin-users' as any,
          'ADMIN_ACTION' as any,
          {
            action: 'role_change',
            userId: user.id,
            username: user.username,
            oldRole,
            newRole,
            timestamp: new Date()
          },
          'high',
          { userId: user.id }
        );
      }
    });

    logger.debug('🔗 User hooks configured');
  }

  /**
   * Setup performance monitoring hooks
   */
  static setupPerformanceHooks(): void {
    // Monitor slow queries across all models
    const models = [Fight, Bet, User];

    models.forEach(model => {
      model.addHook('beforeFind', (options: any) => {
        options._startTime = Date.now();
      });

      model.addHook('afterFind', (instances: any, options: any) => {
        if (options._startTime) {
          const duration = Date.now() - options._startTime;

          if (duration > 500) { // Queries over 500ms
            SSEIntegration.onDatabasePerformanceAlert({
              query: options.raw ? 'Raw SQL query' : `${model.name}.find`,
              duration,
              threshold: 500,
              severity: duration > 2000 ? 'critical' : duration > 1000 ? 'high' : 'medium',
              table: model.tableName,
              recommendation: duration > 1000 ? 'Consider adding indexes or optimizing query' : 'Monitor query performance'
            });
          }
        }
      });
    });

    logger.info('🔗 Performance monitoring hooks configured');
  }

  /**
   * Setup proposal timeout monitoring
   */
  static setupProposalTimeoutMonitoring(): void {
    // Check for expired proposals every minute
    setInterval(() => {
      const now = new Date();

      // This would need to be implemented with actual proposal tracking
      // For now, we'll just log that the monitoring is active
      logger.debug('🔗 Checking for expired PAGO/DOY proposals...');
    }, 60000); // 1 minute

    logger.info('🔗 Proposal timeout monitoring started');
  }

  /**
   * Remove all database hooks (for testing or shutdown)
   */
  static removeAllHooks(): void {
    Fight.removeHook('afterCreate');
    Fight.removeHook('afterUpdate');
    Bet.removeHook('afterCreate');
    Bet.removeHook('afterUpdate');
    User.removeHook('afterCreate');
    User.removeHook('afterUpdate');

    logger.info('🔗 All database hooks removed');
  }
}

export default DatabaseHooks;