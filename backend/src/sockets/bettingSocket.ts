import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

interface BettingSocketData {
  userId?: string;
  fightId?: string;
  role?: 'user' | 'admin' | 'operator';
}

interface PendingBet {
  betId: string;
  userId: string;
  fightId: string;
  type: 'PAGO' | 'DOY';
  amount: number;
  details: any;
  timestamp: Date;
  timeout?: NodeJS.Timeout;
}

// Store active betting connections and pending bets
const activeBettors = new Map<string, {
  socketId: string;
  userId: string;
  fightId?: string;
  joinedAt: Date;
  lastActivity: Date;
}>();

const pendingBets = new Map<string, PendingBet>();

export const setupBettingSocket = (io: Server) => {
  // Middleware for betting authentication
  io.of('/betting').use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      socket.data = {
        userId: decoded.userId,
        fightId: decoded.fightId,
        role: decoded.role || 'user'
      } as BettingSocketData;

      next();
    } catch (error) {
      logger.error('Betting socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Handle betting namespace connections
  io.of('/betting').on('connection', (socket) => {
    const { userId, fightId, role } = socket.data as BettingSocketData;
    
    logger.info(`Betting user connected: ${userId} for fight ${fightId || 'none'}`);

    // Join user to fight-specific betting room
    if (fightId) {
      socket.join(`fight:${fightId}`);
    }
    socket.join(`user:${userId}`);

    // Track active bettor
    if (userId) {
      activeBettors.set(socket.id, {
        socketId: socket.id,
        userId,
        fightId,
        joinedAt: new Date(),
        lastActivity: new Date()
      });
    }

    // Handle PAGO bet creation (bidirectional timeout workflow)
    socket.on('create_pago_bet', async (data: {
      fightId: string;
      amount: number;
      details: any;
      timeoutMs?: number;
    }) => {
      try {
        const betId = `pago_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timeout = data.timeoutMs || 30000; // Default 30 seconds
        
        const pendingBet: PendingBet = {
          betId,
          userId: userId!,
          fightId: data.fightId,
          type: 'PAGO',
          amount: data.amount,
          details: data.details,
          timestamp: new Date()
        };

        // Set timeout for auto-cancellation
        pendingBet.timeout = setTimeout(() => {
          pendingBets.delete(betId);
          
          // Notify user of timeout
          socket.emit('bet_timeout', {
            betId,
            message: 'PAGO bet offer expired'
          });
          
          // Notify other users in fight room
          socket.to(`fight:${data.fightId}`).emit('pago_bet_expired', {
            betId,
            userId,
            timestamp: new Date()
          });
          
          logger.info(`PAGO bet ${betId} expired due to timeout`);
        }, timeout);

        pendingBets.set(betId, pendingBet);

        // Emit to all users in fight room about new PAGO bet
        io.of('/betting').to(`fight:${data.fightId}`).emit('new_pago_bet', {
          betId,
          userId,
          amount: data.amount,
          details: data.details,
          expiresAt: new Date(Date.now() + timeout),
          timestamp: new Date()
        });

        // Confirm creation to betting user
        socket.emit('pago_bet_created', {
          betId,
          fightId: data.fightId,
          expiresAt: new Date(Date.now() + timeout)
        });

        logger.info(`PAGO bet ${betId} created by user ${userId}`);
      } catch (error) {
        logger.error('Error creating PAGO bet:', error);
        socket.emit('bet_error', { message: 'Failed to create PAGO bet' });
      }
    });

    // Handle DOY bet response (accepting a PAGO bet)
    socket.on('accept_pago_bet', async (data: {
      betId: string;
      acceptingUserId: string;
    }) => {
      try {
        const pendingBet = pendingBets.get(data.betId);
        
        if (!pendingBet) {
          socket.emit('bet_error', { message: 'PAGO bet not found or expired' });
          return;
        }

        if (pendingBet.userId === userId) {
          socket.emit('bet_error', { message: 'Cannot accept your own PAGO bet' });
          return;
        }

        // Clear timeout
        if (pendingBet.timeout) {
          clearTimeout(pendingBet.timeout);
        }

        // Remove from pending
        pendingBets.delete(data.betId);

        // Create matched bet (this would integrate with your betting system)
        const matchedBet = {
          betId: data.betId,
          pagoUserId: pendingBet.userId,
          doyUserId: userId!,
          fightId: pendingBet.fightId,
          amount: pendingBet.amount,
          details: pendingBet.details,
          matchedAt: new Date()
        };

        // Notify both users about successful match
        io.of('/betting').to(`user:${pendingBet.userId}`).emit('pago_bet_accepted', {
          betId: data.betId,
          doyUserId: userId,
          matchedAt: new Date()
        });

        socket.emit('doy_bet_confirmed', {
          betId: data.betId,
          pagoUserId: pendingBet.userId,
          matchedAt: new Date()
        });

        // Notify fight room about matched bet
        io.of('/betting').to(`fight:${pendingBet.fightId}`).emit('bet_matched', {
          betId: data.betId,
          pagoUserId: pendingBet.userId,
          doyUserId: userId,
          amount: pendingBet.amount,
          timestamp: new Date()
        });

        logger.info(`PAGO bet ${data.betId} accepted by user ${userId}`);
      } catch (error) {
        logger.error('Error accepting PAGO bet:', error);
        socket.emit('bet_error', { message: 'Failed to accept PAGO bet' });
      }
    });

    // Handle bet cancellation
    socket.on('cancel_bet', (data: { betId: string }) => {
      const pendingBet = pendingBets.get(data.betId);
      
      if (pendingBet && pendingBet.userId === userId) {
        // Clear timeout
        if (pendingBet.timeout) {
          clearTimeout(pendingBet.timeout);
        }
        
        pendingBets.delete(data.betId);
        
        // Notify fight room
        socket.to(`fight:${pendingBet.fightId}`).emit('bet_cancelled', {
          betId: data.betId,
          userId,
          timestamp: new Date()
        });

        socket.emit('bet_cancelled_confirmed', {
          betId: data.betId
        });

        logger.info(`Bet ${data.betId} cancelled by user ${userId}`);
      } else {
        socket.emit('bet_error', { message: 'Cannot cancel this bet' });
      }
    });

    // Handle heartbeat for active betting
    socket.on('betting_heartbeat', () => {
      const bettor = activeBettors.get(socket.id);
      if (bettor) {
        bettor.lastActivity = new Date();
      }
    });

    // Handle fight room joins
    socket.on('join_fight_betting', (data: { fightId: string }) => {
      socket.join(`fight:${data.fightId}`);
      
      const bettor = activeBettors.get(socket.id);
      if (bettor) {
        bettor.fightId = data.fightId;
      }

      // Send current pending bets for this fight
      const fightPendingBets = Array.from(pendingBets.values())
        .filter(bet => bet.fightId === data.fightId && bet.userId !== userId)
        .map(bet => ({
          betId: bet.betId,
          userId: bet.userId,
          amount: bet.amount,
          details: bet.details,
          timestamp: bet.timestamp
        }));

      socket.emit('fight_pending_bets', {
        fightId: data.fightId,
        pendingBets: fightPendingBets
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Betting user disconnected: ${userId} - ${reason}`);

      const bettor = activeBettors.get(socket.id);
      if (bettor) {
        // Cancel any pending bets from this user
        for (const [betId, bet] of pendingBets.entries()) {
          if (bet.userId === userId) {
            if (bet.timeout) {
              clearTimeout(bet.timeout);
            }
            pendingBets.delete(betId);
            
            // Notify fight room
            if (bet.fightId) {
              socket.to(`fight:${bet.fightId}`).emit('bet_cancelled', {
                betId,
                userId,
                reason: 'user_disconnected',
                timestamp: new Date()
              });
            }
          }
        }

        activeBettors.delete(socket.id);
      }
    });
  });

  // Cleanup function for expired bets (run periodically)
  setInterval(() => {
    const now = Date.now();
    
    for (const [betId, bet] of pendingBets.entries()) {
      const elapsed = now - bet.timestamp.getTime();
      
      // Auto-expire bets older than 2 minutes regardless of timeout
      if (elapsed > 120000) {
        if (bet.timeout) {
          clearTimeout(bet.timeout);
        }
        pendingBets.delete(betId);
        
        logger.info(`Auto-expired old pending bet: ${betId}`);
      }
    }
  }, 30000); // Run every 30 seconds
};

// Export functions for external use
export const getBettingStats = () => ({
  activeBettors: activeBettors.size,
  pendingBets: pendingBets.size,
  bettorsByFight: Array.from(activeBettors.values()).reduce((acc, bettor) => {
    if (bettor.fightId) {
      acc[bettor.fightId] = (acc[bettor.fightId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>)
});

export const forceCancelBet = (betId: string, reason: string = 'admin_action') => {
  const bet = pendingBets.get(betId);
  if (bet) {
    if (bet.timeout) {
      clearTimeout(bet.timeout);
    }
    pendingBets.delete(betId);
    return true;
  }
  return false;
};