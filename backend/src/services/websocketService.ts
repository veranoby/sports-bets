/**
 * Minimal WebSocket Service for PAGO/DOY Proposals
 *
 * This service handles ONLY PAGO/DOY proposal communications with 3-minute timeout.
 * All other real-time communication should use SSE service.
 *
 * Architecture Decision:
 * - SSE: Admin updates, fight status, general real-time data
 * - WebSocket: ONLY for PAGO/DOY proposals (requires immediate user interaction)
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logger } from '../config/logger';

interface ProposalData {
  id: string;
  type: 'PAGO' | 'DOY';
  fightId: string;
  betId: string;
  proposedBy: string;
  proposedTo: string;
  amount: number;
  proposalAmount: number; // pagoAmount or doyAmount
  side: 'red' | 'blue';
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout';
}

interface SocketUser {
  id: string;
  username: string;
  role: string;
  socketId: string;
  connectedAt: Date;
}

class MinimalWebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private activeProposals: Map<string, ProposalData> = new Map();
  private proposalTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Configuration
  private readonly PROPOSAL_TIMEOUT = 180000; // 3 minutes
  private readonly MAX_PROPOSALS_PER_USER = 5;
  private readonly CONNECTION_TIMEOUT = 300000; // 5 minutes idle timeout

  constructor() {
    logger.info('🔌 Minimal WebSocket Service initialized (PAGO/DOY only)');
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupAuthentication();
    this.setupEventHandlers();

    logger.info('🔌 WebSocket server initialized for PAGO/DOY proposals');
  }

  /**
   * Setup authentication middleware
   */
  private setupAuthentication(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          throw new Error('No authentication token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
          throw new Error('Invalid user or inactive account');
        }

        // Attach user to socket
        socket.data.user = {
          id: user.id,
          username: user.username,
          role: user.role
        };

        next();
      } catch (error) {
        logger.warn('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const user = socket.data.user;

      // Register connected user
      this.connectedUsers.set(user.id, {
        id: user.id,
        username: user.username,
        role: user.role,
        socketId: socket.id,
        connectedAt: new Date()
      });

      logger.info(`🔌 User connected to WebSocket: ${user.username} (${socket.id})`);

      // Send any pending proposals for this user
      this.sendPendingProposals(user.id);

      // Handle PAGO proposal
      socket.on('create_pago_proposal', (data) => {
        this.handlePagoProposal(socket, data);
      });

      // Handle DOY proposal
      socket.on('create_doy_proposal', (data) => {
        this.handleDoyProposal(socket, data);
      });

      // Handle proposal response
      socket.on('respond_to_proposal', (data) => {
        this.handleProposalResponse(socket, data);
      });

      // Handle proposal cancellation
      socket.on('cancel_proposal', (data) => {
        this.handleProposalCancellation(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(user.id);
        logger.info(`🔌 User disconnected from WebSocket: ${user.username} (${socket.id})`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });
    });
  }

  /**
   * Handle PAGO proposal creation
   */
  private handlePagoProposal(socket: any, data: any): void {
    try {
      const user = socket.data.user;
      const { fightId, betId, proposedTo, pagoAmount, side, amount } = data;

      // Validate proposal data
      if (!fightId || !betId || !proposedTo || !pagoAmount || !side || !amount) {
        socket.emit('proposal_error', { message: 'Missing required proposal data' });
        return;
      }

      // Check if user has too many active proposals
      const userProposals = Array.from(this.activeProposals.values())
        .filter(p => p.proposedBy === user.id && p.status === 'pending');

      if (userProposals.length >= this.MAX_PROPOSALS_PER_USER) {
        socket.emit('proposal_error', { message: 'Too many active proposals' });
        return;
      }

      // Create proposal
      const proposalId = `pago_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + this.PROPOSAL_TIMEOUT);

      const proposal: ProposalData = {
        id: proposalId,
        type: 'PAGO',
        fightId,
        betId,
        proposedBy: user.id,
        proposedTo,
        amount,
        proposalAmount: pagoAmount,
        side,
        expiresAt,
        status: 'pending'
      };

      this.activeProposals.set(proposalId, proposal);

      // Set timeout for proposal
      const timeout = setTimeout(() => {
        this.handleProposalTimeout(proposalId);
      }, this.PROPOSAL_TIMEOUT);

      this.proposalTimeouts.set(proposalId, timeout);

      // Send proposal to target user
      this.sendProposalToUser(proposedTo, proposal);

      // Confirm to proposer
      socket.emit('proposal_created', {
        proposalId,
        type: 'PAGO',
        expiresAt: expiresAt.toISOString(),
        status: 'pending'
      });

      logger.info(`🔌 PAGO proposal created: ${proposalId} by ${user.username} to user ${proposedTo}`);

    } catch (error) {
      logger.error('Error handling PAGO proposal:', error);
      socket.emit('proposal_error', { message: 'Failed to create PAGO proposal' });
    }
  }

  /**
   * Handle DOY proposal creation
   */
  private handleDoyProposal(socket: any, data: any): void {
    try {
      const user = socket.data.user;
      const { fightId, betId, proposedTo, doyAmount, side, amount } = data;

      // Validate proposal data
      if (!fightId || !betId || !proposedTo || !doyAmount || !side || !amount) {
        socket.emit('proposal_error', { message: 'Missing required proposal data' });
        return;
      }

      // Check active proposals limit
      const userProposals = Array.from(this.activeProposals.values())
        .filter(p => p.proposedBy === user.id && p.status === 'pending');

      if (userProposals.length >= this.MAX_PROPOSALS_PER_USER) {
        socket.emit('proposal_error', { message: 'Too many active proposals' });
        return;
      }

      // Create proposal
      const proposalId = `doy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + this.PROPOSAL_TIMEOUT);

      const proposal: ProposalData = {
        id: proposalId,
        type: 'DOY',
        fightId,
        betId,
        proposedBy: user.id,
        proposedTo,
        amount,
        proposalAmount: doyAmount,
        side,
        expiresAt,
        status: 'pending'
      };

      this.activeProposals.set(proposalId, proposal);

      // Set timeout
      const timeout = setTimeout(() => {
        this.handleProposalTimeout(proposalId);
      }, this.PROPOSAL_TIMEOUT);

      this.proposalTimeouts.set(proposalId, timeout);

      // Send to target user
      this.sendProposalToUser(proposedTo, proposal);

      // Confirm to proposer
      socket.emit('proposal_created', {
        proposalId,
        type: 'DOY',
        expiresAt: expiresAt.toISOString(),
        status: 'pending'
      });

      logger.info(`🔌 DOY proposal created: ${proposalId} by ${user.username} to user ${proposedTo}`);

    } catch (error) {
      logger.error('Error handling DOY proposal:', error);
      socket.emit('proposal_error', { message: 'Failed to create DOY proposal' });
    }
  }

  /**
   * Handle proposal response (accept/reject)
   */
  private handleProposalResponse(socket: any, data: any): void {
    try {
      const user = socket.data.user;
      const { proposalId, response } = data; // response: 'accept' | 'reject'

      const proposal = this.activeProposals.get(proposalId);
      if (!proposal) {
        socket.emit('proposal_error', { message: 'Proposal not found' });
        return;
      }

      // Verify user is the target of the proposal
      if (proposal.proposedTo !== user.id) {
        socket.emit('proposal_error', { message: 'Not authorized to respond to this proposal' });
        return;
      }

      // Check if proposal is still pending
      if (proposal.status !== 'pending') {
        socket.emit('proposal_error', { message: 'Proposal is no longer active' });
        return;
      }

      // Update proposal status
      proposal.status = response === 'accept' ? 'accepted' : 'rejected';
      this.activeProposals.set(proposalId, proposal);

      // Clear timeout
      const timeout = this.proposalTimeouts.get(proposalId);
      if (timeout) {
        clearTimeout(timeout);
        this.proposalTimeouts.delete(proposalId);
      }

      // Notify both users
      this.notifyProposalResult(proposal, response === 'accept' ? 'accepted' : 'rejected');

      // Clean up proposal after notification
      setTimeout(() => {
        this.activeProposals.delete(proposalId);
      }, 5000); // 5 second delay for clients to process

      logger.info(`🔌 Proposal ${response}: ${proposalId} by user ${user.username}`);

    } catch (error) {
      logger.error('Error handling proposal response:', error);
      socket.emit('proposal_error', { message: 'Failed to process proposal response' });
    }
  }

  /**
   * Handle proposal cancellation by proposer
   */
  private handleProposalCancellation(socket: any, data: any): void {
    try {
      const user = socket.data.user;
      const { proposalId } = data;

      const proposal = this.activeProposals.get(proposalId);
      if (!proposal) {
        socket.emit('proposal_error', { message: 'Proposal not found' });
        return;
      }

      // Verify user is the proposer
      if (proposal.proposedBy !== user.id) {
        socket.emit('proposal_error', { message: 'Not authorized to cancel this proposal' });
        return;
      }

      // Update status
      proposal.status = 'timeout'; // Use timeout status for cancellation
      this.activeProposals.set(proposalId, proposal);

      // Clear timeout
      const timeout = this.proposalTimeouts.get(proposalId);
      if (timeout) {
        clearTimeout(timeout);
        this.proposalTimeouts.delete(proposalId);
      }

      // Notify both users
      this.notifyProposalResult(proposal, 'cancelled');

      // Clean up
      setTimeout(() => {
        this.activeProposals.delete(proposalId);
      }, 2000);

      logger.info(`🔌 Proposal cancelled: ${proposalId} by user ${user.username}`);

    } catch (error) {
      logger.error('Error handling proposal cancellation:', error);
      socket.emit('proposal_error', { message: 'Failed to cancel proposal' });
    }
  }

  /**
   * Handle proposal timeout
   */
  private handleProposalTimeout(proposalId: string): void {
    try {
      const proposal = this.activeProposals.get(proposalId);
      if (!proposal) return;

      proposal.status = 'timeout';
      this.activeProposals.set(proposalId, proposal);

      // Notify users about timeout
      this.notifyProposalResult(proposal, 'timeout');

      // Clean up
      this.proposalTimeouts.delete(proposalId);
      setTimeout(() => {
        this.activeProposals.delete(proposalId);
      }, 5000);

      logger.info(`🔌 Proposal timeout: ${proposalId}`);

    } catch (error) {
      logger.error('Error handling proposal timeout:', error);
    }
  }

  /**
   * Send proposal to specific user
   */
  private sendProposalToUser(userId: string, proposal: ProposalData): void {
    const user = this.connectedUsers.get(userId);
    if (!user) {
      logger.warn(`Cannot send proposal to offline user: ${userId}`);
      return;
    }

    const socket = this.io?.sockets.sockets.get(user.socketId);
    if (socket) {
      socket.emit('proposal_received', {
        proposalId: proposal.id,
        type: proposal.type,
        fightId: proposal.fightId,
        betId: proposal.betId,
        proposedBy: proposal.proposedBy,
        amount: proposal.amount,
        proposalAmount: proposal.proposalAmount,
        side: proposal.side,
        expiresAt: proposal.expiresAt.toISOString()
      });
    }
  }

  /**
   * Send pending proposals to user on connection
   */
  private sendPendingProposals(userId: string): void {
    const pendingProposals = Array.from(this.activeProposals.values())
      .filter(p => p.proposedTo === userId && p.status === 'pending');

    if (pendingProposals.length > 0) {
      const user = this.connectedUsers.get(userId);
      if (user) {
        const socket = this.io?.sockets.sockets.get(user.socketId);
        if (socket) {
          socket.emit('pending_proposals', pendingProposals.map(p => ({
            proposalId: p.id,
            type: p.type,
            fightId: p.fightId,
            betId: p.betId,
            proposedBy: p.proposedBy,
            amount: p.amount,
            proposalAmount: p.proposalAmount,
            side: p.side,
            expiresAt: p.expiresAt.toISOString()
          })));
        }
      }
    }
  }

  /**
   * Notify both users about proposal result
   */
  private notifyProposalResult(proposal: ProposalData, result: string): void {
    const proposer = this.connectedUsers.get(proposal.proposedBy);
    const target = this.connectedUsers.get(proposal.proposedTo);

    const resultData = {
      proposalId: proposal.id,
      type: proposal.type,
      result,
      fightId: proposal.fightId,
      betId: proposal.betId,
      timestamp: new Date().toISOString()
    };

    // Notify proposer
    if (proposer) {
      const proposerSocket = this.io?.sockets.sockets.get(proposer.socketId);
      if (proposerSocket) {
        proposerSocket.emit('proposal_result', { ...resultData, role: 'proposer' });
      }
    }

    // Notify target
    if (target) {
      const targetSocket = this.io?.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('proposal_result', { ...resultData, role: 'target' });
      }
    }
  }

  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      connectedUsers: this.connectedUsers.size,
      activeProposals: this.activeProposals.size,
      proposalsByType: {
        PAGO: Array.from(this.activeProposals.values()).filter(p => p.type === 'PAGO').length,
        DOY: Array.from(this.activeProposals.values()).filter(p => p.type === 'DOY').length
      },
      proposalsByStatus: {
        pending: Array.from(this.activeProposals.values()).filter(p => p.status === 'pending').length,
        accepted: Array.from(this.activeProposals.values()).filter(p => p.status === 'accepted').length,
        rejected: Array.from(this.activeProposals.values()).filter(p => p.status === 'rejected').length,
        timeout: Array.from(this.activeProposals.values()).filter(p => p.status === 'timeout').length
      },
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown service gracefully
   */
  shutdown(): void {
    logger.info('🔌 Shutting down WebSocket service...');

    // Clear all timeouts
    for (const timeout of this.proposalTimeouts.values()) {
      clearTimeout(timeout);
    }

    // Close all connections
    if (this.io) {
      this.io.close();
    }

    this.connectedUsers.clear();
    this.activeProposals.clear();
    this.proposalTimeouts.clear();

    logger.info('✅ WebSocket service shutdown completed');
  }
}

// Export singleton instance
export const websocketService = new MinimalWebSocketService();
export default websocketService;