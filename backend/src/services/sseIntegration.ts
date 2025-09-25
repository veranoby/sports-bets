/**
 * SSE Integration Service
 *
 * This service provides integration points for triggering SSE events
 * from various parts of the GalloBets application (fights, bets, users, etc.)
 *
 * Usage: Import and call these functions when relevant events occur
 * in controllers, services, or model hooks.
 */

import { sseService, SSEEventType, AdminChannel } from './sseService';
import { logger } from '../config/logger';

export class SSEIntegration {

  /**
   * FIGHT MANAGEMENT INTEGRATIONS
   */

  // Trigger when fight status changes
  static onFightStatusChange(fightId: string, oldStatus: string, newStatus: string, fightData: any) {
    try {
      sseService.broadcastFightUpdate(fightId, newStatus, {
        oldStatus,
        newStatus,
        fightNumber: fightData.number,
        redCorner: fightData.redCorner,
        blueCorner: fightData.blueCorner,
        eventId: fightData.eventId,
        timestamp: new Date()
      });

      // Specific event types for betting windows
      if (oldStatus === 'upcoming' && newStatus === 'betting') {
        sseService.broadcastToAllAdmin({
          id: Date.now().toString(),
          type: SSEEventType.BETTING_WINDOW_OPENED,
          data: {
            fightId,
            fightNumber: fightData.number,
            redCorner: fightData.redCorner,
            blueCorner: fightData.blueCorner,
            bettingStartTime: fightData.bettingStartTime,
            bettingEndTime: fightData.bettingEndTime
          },
          timestamp: new Date(),
          priority: 'high',
          metadata: { fightId, eventId: fightData.eventId }
        });
      }

      if (oldStatus === 'betting' && newStatus === 'live') {
        sseService.broadcastToAllAdmin({
          id: Date.now().toString(),
          type: SSEEventType.BETTING_WINDOW_CLOSED,
          data: {
            fightId,
            fightNumber: fightData.number,
            finalBetCount: fightData.totalBets,
            finalAmount: fightData.totalAmount
          },
          timestamp: new Date(),
          priority: 'high',
          metadata: { fightId, eventId: fightData.eventId }
        });
      }

      logger.info(`📡 SSE: Fight status change broadcasted - ${fightId}: ${oldStatus} → ${newStatus}`);
    } catch (error) {
      logger.error('Failed to broadcast fight status change:', error);
    }
  }

  // Trigger when new fight is created
  static onFightCreated(fightData: any) {
    try {
      sseService.broadcastToAllAdmin({
        id: Date.now().toString(),
        type: SSEEventType.FIGHT_CREATED,
        data: {
          fightId: fightData.id,
          fightNumber: fightData.number,
          redCorner: fightData.redCorner,
          blueCorner: fightData.blueCorner,
          weight: fightData.weight,
          eventId: fightData.eventId,
          status: fightData.status,
          createdAt: fightData.createdAt
        },
        timestamp: new Date(),
        priority: 'medium',
        metadata: { fightId: fightData.id, eventId: fightData.eventId }
      });

      logger.info(`📡 SSE: New fight created - ${fightData.id} (Fight #${fightData.number})`);
    } catch (error) {
      logger.error('Failed to broadcast fight creation:', error);
    }
  }

  /**
   * BETTING INTEGRATIONS
   */

  // Trigger when new bet is placed
  static onNewBet(betData: any) {
    try {
      sseService.broadcastBettingEvent(SSEEventType.NEW_BET, {
        betId: betData.id,
        fightId: betData.fightId,
        userId: betData.userId,
        side: betData.side,
        amount: betData.amount,
        potentialWin: betData.potentialWin,
        betType: betData.betType,
        timestamp: new Date()
      });

      logger.info(`📡 SSE: New bet placed - ${betData.id} (${betData.side}, $${betData.amount})`);
    } catch (error) {
      logger.error('Failed to broadcast new bet:', error);
    }
  }

  // Trigger when bets are matched
  static onBetMatched(bet1Data: any, bet2Data: any) {
    try {
      sseService.broadcastBettingEvent(SSEEventType.BET_MATCHED, {
        bet1Id: bet1Data.id,
        bet2Id: bet2Data.id,
        fightId: bet1Data.fightId,
        totalAmount: bet1Data.amount + bet2Data.amount,
        sides: [bet1Data.side, bet2Data.side],
        timestamp: new Date()
      });

      logger.info(`📡 SSE: Bets matched - ${bet1Data.id} ↔ ${bet2Data.id}`);
    } catch (error) {
      logger.error('Failed to broadcast bet match:', error);
    }
  }

  // Trigger PAGO/DOY proposal events
  static onPagoProposal(proposalData: any, action: 'CREATED' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT' = 'CREATED') {
    try {
      sseService.broadcastProposalEvent('PAGO', action, {
        proposalId: proposalData.id || Date.now().toString(),
        fightId: proposalData.fightId,
        betId: proposalData.betId || proposalData.id,
        userId: proposalData.userId,
        proposedBy: proposalData.proposedBy,
        pagoAmount: proposalData.terms?.pagoAmount || proposalData.pagoAmount,
        originalAmount: proposalData.amount,
        side: proposalData.side,
        action,
        timestamp: new Date()
      });

      logger.info(`📡 SSE: PAGO proposal ${action} - ${proposalData.id}`);
    } catch (error) {
      logger.error('Failed to broadcast PAGO proposal:', error);
    }
  }

  static onDoyProposal(proposalData: any, action: 'CREATED' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT' = 'CREATED') {
    try {
      sseService.broadcastProposalEvent('DOY', action, {
        proposalId: proposalData.id || Date.now().toString(),
        fightId: proposalData.fightId,
        betId: proposalData.betId || proposalData.id,
        userId: proposalData.userId,
        proposedBy: proposalData.proposedBy,
        doyAmount: proposalData.terms?.doyAmount || proposalData.doyAmount,
        originalAmount: proposalData.amount,
        side: proposalData.side,
        action,
        timestamp: new Date()
      });

      logger.info(`📡 SSE: DOY proposal ${action} - ${proposalData.id}`);
    } catch (error) {
      logger.error('Failed to broadcast DOY proposal:', error);
    }
  }

  /**
   * USER MANAGEMENT INTEGRATIONS
   */

  // Trigger when new user registers
  static onUserRegistration(userData: any) {
    try {
      sseService.sendToAdminChannel(AdminChannel.USER_MANAGEMENT, {
        id: Date.now().toString(),
        type: SSEEventType.USER_REGISTERED,
        data: {
          userId: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          registrationDate: userData.createdAt || new Date(),
          verificationLevel: userData.profileInfo?.verificationLevel || 'none'
        },
        timestamp: new Date(),
        priority: 'low',
        metadata: { userId: userData.id }
      });

      logger.info(`📡 SSE: User registration - ${userData.username}`);
    } catch (error) {
      logger.error('Failed to broadcast user registration:', error);
    }
  }

  // Trigger when user is verified
  static onUserVerification(userData: any) {
    try {
      sseService.sendToAdminChannel(AdminChannel.USER_MANAGEMENT, {
        id: Date.now().toString(),
        type: SSEEventType.USER_VERIFIED,
        data: {
          userId: userData.id,
          username: userData.username,
          email: userData.email,
          verificationLevel: userData.profileInfo?.verificationLevel,
          verificationDate: new Date()
        },
        timestamp: new Date(),
        priority: 'medium',
        metadata: { userId: userData.id }
      });

      logger.info(`📡 SSE: User verified - ${userData.username}`);
    } catch (error) {
      logger.error('Failed to broadcast user verification:', error);
    }
  }

  /**
   * FINANCIAL INTEGRATIONS
   */

  // Trigger on wallet transactions
  static onWalletTransaction(transactionData: any) {
    try {
      sseService.sendToAdminChannel(AdminChannel.FINANCIAL_MONITORING, {
        id: Date.now().toString(),
        type: SSEEventType.WALLET_TRANSACTION,
        data: {
          transactionId: transactionData.id,
          userId: transactionData.userId,
          type: transactionData.type,
          amount: transactionData.amount,
          status: transactionData.status,
          description: transactionData.description,
          timestamp: new Date()
        },
        timestamp: new Date(),
        priority: transactionData.amount > 1000 ? 'high' : 'medium',
        metadata: {
          userId: transactionData.userId,
          amount: transactionData.amount
        }
      });

      logger.info(`📡 SSE: Wallet transaction - ${transactionData.type} $${transactionData.amount}`);
    } catch (error) {
      logger.error('Failed to broadcast wallet transaction:', error);
    }
  }

  // Trigger on payment processing
  static onPaymentProcessed(paymentData: any) {
    try {
      sseService.sendToAdminChannel(AdminChannel.FINANCIAL_MONITORING, {
        id: Date.now().toString(),
        type: SSEEventType.PAYMENT_PROCESSED,
        data: {
          paymentId: paymentData.id,
          userId: paymentData.userId,
          method: paymentData.method,
          amount: paymentData.amount,
          status: paymentData.status,
          provider: paymentData.provider || 'kushki',
          timestamp: new Date()
        },
        timestamp: new Date(),
        priority: paymentData.amount > 500 ? 'high' : 'medium',
        metadata: {
          userId: paymentData.userId,
          amount: paymentData.amount
        }
      });

      logger.info(`📡 SSE: Payment processed - $${paymentData.amount} via ${paymentData.method}`);
    } catch (error) {
      logger.error('Failed to broadcast payment processing:', error);
    }
  }

  /**
   * SYSTEM MONITORING INTEGRATIONS
   */

  // Trigger on database performance issues
  static onDatabasePerformanceAlert(alertData: any) {
    try {
      const priority = alertData.severity === 'critical' ? 'critical' :
                      alertData.severity === 'high' ? 'high' : 'medium';

      sseService.broadcastSystemEvent(
        SSEEventType.DATABASE_PERFORMANCE,
        {
          query: alertData.query,
          duration: alertData.duration,
          threshold: alertData.threshold,
          severity: alertData.severity,
          table: alertData.table,
          timestamp: new Date(),
          recommendation: alertData.recommendation
        },
        priority
      );

      logger.warn(`📡 SSE: Database performance alert - ${alertData.query} (${alertData.duration}ms)`);
    } catch (error) {
      logger.error('Failed to broadcast database performance alert:', error);
    }
  }

  // Trigger on system maintenance mode
  static onSystemMaintenance(maintenanceData: any) {
    try {
      sseService.broadcastSystemEvent(
        SSEEventType.SYSTEM_MAINTENANCE,
        {
          status: maintenanceData.status, // 'enabled' | 'disabled'
          message: maintenanceData.message,
          estimatedDuration: maintenanceData.estimatedDuration,
          scheduledBy: maintenanceData.scheduledBy,
          timestamp: new Date()
        },
        'critical'
      );

      logger.info(`📡 SSE: System maintenance ${maintenanceData.status}`);
    } catch (error) {
      logger.error('Failed to broadcast system maintenance:', error);
    }
  }

  /**
   * STREAMING INTEGRATIONS
   */

  // Trigger when stream starts/stops
  static onStreamStatusChange(streamData: any) {
    try {
      const eventType = streamData.status === 'live' ? SSEEventType.STREAM_STARTED :
                       streamData.status === 'ended' ? SSEEventType.STREAM_ENDED :
                       SSEEventType.STREAM_ERROR;

      sseService.sendToAdminChannel(AdminChannel.STREAMING_MONITORING, {
        id: Date.now().toString(),
        type: eventType,
        data: {
          streamId: streamData.id,
          eventId: streamData.eventId,
          status: streamData.status,
          quality: streamData.quality,
          viewerCount: streamData.viewerCount || 0,
          streamUrl: streamData.streamUrl,
          timestamp: new Date()
        },
        timestamp: new Date(),
        priority: eventType === SSEEventType.STREAM_ERROR ? 'high' : 'medium',
        metadata: {
          eventId: streamData.eventId,
          streamId: streamData.id
        }
      });

      logger.info(`📡 SSE: Stream status change - ${streamData.status}`);
    } catch (error) {
      logger.error('Failed to broadcast stream status:', error);
    }
  }

  /**
   * UTILITY METHODS
   */

  // Generic method to broadcast custom admin events
  static broadcastCustomAdminEvent(
    channel: AdminChannel,
    eventType: SSEEventType,
    data: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: any
  ) {
    try {
      sseService.sendToAdminChannel(channel, {
        id: Date.now().toString(),
        type: eventType,
        data,
        timestamp: new Date(),
        priority,
        metadata
      });

      logger.info(`📡 SSE: Custom admin event - ${eventType} to ${channel}`);
    } catch (error) {
      logger.error('Failed to broadcast custom admin event:', error);
    }
  }

  // Send critical system alert to all admin channels
  static broadcastCriticalAlert(message: string, data?: any) {
    try {
      sseService.broadcastToAllAdmin({
        id: Date.now().toString(),
        type: SSEEventType.ERROR,
        data: {
          level: 'critical',
          message,
          ...data,
          timestamp: new Date()
        },
        timestamp: new Date(),
        priority: 'critical'
      });

      logger.error(`📡 SSE: Critical alert broadcasted - ${message}`);
    } catch (error) {
      logger.error('Failed to broadcast critical alert:', error);
    }
  }
}

export default SSEIntegration;