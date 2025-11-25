// backend/src/services/betService.ts
// Service layer for betting functionality
// Extracted business logic from bets.ts routes for better maintainability

import { Bet, Fight, Event, User, Wallet, Transaction } from '../models';
import { transaction, sequelize } from '../config/database';
import { errors } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { logger } from '../config/logger';

// Interfaces for service methods
interface CreateBetInput {
  fightId: string;
  userId: string;
  side: 'red' | 'blue';
  amount: number;
  betType?: 'flat' | 'doy' | 'pago';
  ratio?: number;
  isOffer?: boolean;
  terms?: any;
}

interface PagoProposalInput {
  betId: string;
  userId: string;
  pagoAmount: number;
}

interface AcceptPagoInput {
  originalBetId: string;
  userId: string;
}

interface AutoMatchResult {
  bet: Bet;
  oppositeBet: Bet;
}

interface AcceptBetResult {
  yourBet: Bet;
  matchedBet: Bet;
}

export class BetService {
  /**
   * Create a new bet with validation and wallet operations
   */
  static async createBet(input: CreateBetInput): Promise<Bet> {
    return await transaction(async (t) => {
      const { fightId, userId, side, amount, betType = 'flat', ratio = 2.0, isOffer = true, terms } = input;

      // Verify fight exists and betting is open
      const fight = await Fight.findByPk(fightId, {
        include: [{ model: Event, as: "event" }],
        transaction: t,
      });
      if (!fight) {
        throw errors.notFound("Fight not found");
      }

      if (!fight.canAcceptBets()) {
        throw errors.badRequest("Betting is not open for this fight");
      }

      // Verify user doesn't already have a bet on this fight
      const existingBet = await Bet.findOne({
        where: {
          fightId,
          userId,
        },
        transaction: t,
      });

      if (existingBet) {
        throw errors.conflict("You already have a bet on this fight");
      }

      // Verify user wallet and balance
      const wallet = await Wallet.findOne({
        where: { userId },
        transaction: t,
      });

      if (!wallet) {
        throw errors.notFound("Wallet not found");
      }

      if (!wallet.canBet(amount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      // Calculate potential win
      const potentialWin = amount * ratio;

      // Create the bet
      const bet = await Bet.create(
        {
          fightId,
          userId,
          side,
          amount,
          potentialWin,
          betType,
          status: "pending",
          terms: {
            ratio,
            isOffer,
            ...terms,
          },
        },
        { transaction: t }
      );

      // Freeze funds in the wallet
      await wallet.freezeAmount(amount);
      await wallet.save({ transaction: t });

      // Update fight counters
      fight.totalBets += 1;
      fight.totalAmount += amount;
      await fight.save({ transaction: t });

      // Update event counters
      const event = await Event.findByPk(fight.eventId, { transaction: t });
      if (event) {
        event.totalBets += 1;
        event.totalPrizePool += amount;
        await event.save({ transaction: t });
      }

      // Create transaction record
      await Transaction.create(
        {
          walletId: wallet.id,
          type: "bet-loss", // Mark as loss initially
          amount: amount,
          status: "pending",
          description: `Bet placed on fight ${fight.number}`,
          metadata: {
            betId: bet.id,
            fightId: fight.id,
          },
        },
        { transaction: t }
      );

      return bet;
    });
  }

  /**
   * Get available compatible bets for a fight
   */
  static async getCompatibleBets(fightId: string, side: 'red' | 'blue', amount: number, userId: string) {
    const oppositeSide = side === 'red' ? 'blue' : 'red';
    
    // Calculate range (±20% of entered amount)
    const lowerBound = amount * 0.8;
    const upperBound = amount * 1.2;

    const where: any = {
      fightId,
      side: oppositeSide,
      status: 'pending',
      userId: { [Op.ne]: userId }, // Exclude own bets
      matchedWith: null,
      betType: 'flat', // Only match flat bets by default
    };

    // Add amount range filter
    where.amount = {
      [Op.gte]: lowerBound,
      [Op.lte]: upperBound
    };

    return await Bet.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profileInfo'],
        },
      ],
      order: [['createdAt', 'ASC']], // Order by oldest first to match
    });
  }

  /**
   * Accept an existing bet
   */
  static async acceptBet(betId: string, acceptingUserId: string, io: any): Promise<AcceptBetResult> {
    return await transaction(async (t) => {
      // Get the bet that was offered
      const offerBet = await Bet.findByPk(betId, {
        include: [
          { model: Fight, as: "fight" },
          { model: User, as: "user" },
          { model: Wallet, as: "wallet" }
        ],
        transaction: t,
      });

      if (!offerBet) {
        throw errors.notFound("Bet not found");
      }

      if (!offerBet.canBeMatched()) {
        throw errors.badRequest("This bet cannot be accepted");
      }

      if (offerBet.userId === acceptingUserId) {
        throw errors.badRequest("You cannot accept your own bet");
      }

      const fight = await offerBet.getFight();
      if (!fight.canAcceptBets()) {
        throw errors.badRequest("Betting is closed for this fight");
      }

      // Check if user already has a bet on this fight
      const existingBet = await Bet.findOne({
        where: {
          fightId: fight.id,
          userId: acceptingUserId,
        },
        transaction: t,
      });

      if (existingBet) {
        throw errors.conflict("You already have a bet on this fight");
      }

      // Verify accepting user's wallet
      const wallet = await Wallet.findOne({
        where: { userId: acceptingUserId },
        transaction: t,
      });

      if (!wallet) {
        throw errors.notFound("Wallet not found");
      }

      // Calculate required amount based on offer terms
      const requiredAmount = Number(offerBet.amount) / (offerBet.terms?.ratio || 2.0);

      if (!wallet.canBet(requiredAmount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      // Create accepting user's bet
      const acceptBet = await Bet.create(
        {
          fightId: fight.id,
          userId: acceptingUserId,
          side: offerBet.side === "red" ? "blue" : "red", // Opposite side
          amount: requiredAmount,
          potentialWin: Number(offerBet.amount) + requiredAmount,
          status: "active",
          matchedWith: offerBet.id,
          terms: {
            ratio: 1 / (offerBet.terms?.ratio || 2.0),
            isOffer: false,
          },
        },
        { transaction: t }
      );

      // Update original offer bet
      offerBet.status = "active";
      offerBet.matchedWith = acceptBet.id;
      await offerBet.save({ transaction: t });

      // Freeze funds for accepting user
      await wallet.freezeAmount(requiredAmount);
      await wallet.save({ transaction: t });

      // Update fight counters
      fight.totalBets += 1;
      fight.totalAmount += requiredAmount;
      await fight.save({ transaction: t });

      // Update event counters
      const event = await Event.findByPk(fight.eventId, { transaction: t });
      if (event) {
        event.totalBets += 1;
        event.totalPrizePool += requiredAmount;
        await event.save({ transaction: t });
      }

      // Create transaction for accepting user
      await Transaction.create(
        {
          walletId: wallet.id,
          type: "bet-loss",
          amount: requiredAmount,
          status: "pending",
          description: `Bet accepted on fight ${fight.number}`,
          metadata: {
            betId: acceptBet.id,
            fightId: fight.id,
            matchedBetId: offerBet.id,
          },
        },
        { transaction: t }
      );

      // Emit WebSocket event
      if (io) {
        io.to(`event_${fight.eventId}`).emit("bet_matched", {
          offerBet: offerBet.toPublicJSON(),
          acceptBet: acceptBet.toPublicJSON(),
          fightId: fight.id,
        });
      }

      return {
        yourBet: acceptBet,
        matchedBet: offerBet
      };
    });
  }

  /**
   * Edit a pending bet
   */
  static async updateBet(betId: string, userId: string, updateData: Partial<{ amount: number, side: 'red' | 'blue', betType: string, terms: any }>): Promise<Bet> {
    const bet = await Bet.findByPk(betId, {
      include: [
        { model: Wallet, as: "wallet" },
        { model: Fight, as: "fight" }
      ],
    });

    if (!bet) {
      throw errors.notFound("Bet not found");
    }

    if (bet.userId !== userId) {
      throw errors.forbidden("You can only edit your own bets");
    }

    if (bet.status !== 'pending') {
      throw errors.badRequest("Only pending bets can be edited");
    }

    // Handle wallet adjustments if amount changes
    if (updateData.amount !== undefined && updateData.amount !== Number(bet.amount)) {
      const oldAmount = Number(bet.amount);
      const newAmount = updateData.amount;
      const difference = newAmount - oldAmount;
      const wallet = await Wallet.findOne({ where: { userId } });

      if (wallet) {
        if (difference > 0) {
          // Need more funds
          if (!wallet.canBet(difference)) {
            throw errors.badRequest("Insufficient available balance for increased amount");
          }
          await wallet.freezeAmount(difference);
        } else {
          // Releasing excess funds
          await wallet.unfreezeAmount(Math.abs(difference));
        }
        await wallet.save();
      }
    }

    // Update allowed fields
    if (updateData.amount !== undefined) bet.amount = updateData.amount;
    if (updateData.side !== undefined) bet.side = updateData.side;
    if (updateData.betType !== undefined) bet.betType = updateData.betType as any;
    if (updateData.terms !== undefined) bet.terms = { ...bet.terms, ...updateData.terms };

    await bet.save();

    return bet;
  }

  /**
   * Cancel a pending bet
   */
  static async cancelBet(betId: string, userId: string, io: any): Promise<Bet> {
    return await transaction(async (t) => {
      const bet = await Bet.findOne({
        where: {
          id: betId,
          userId,
        },
        include: [{ model: Fight, as: "fight" }],
        transaction: t,
      });

      if (!bet) {
        throw errors.notFound("Bet not found or not yours");
      }

      if (bet.status !== "pending") {
        throw errors.badRequest("Only pending bets can be cancelled");
      }

      // Update bet status
      bet.status = "cancelled";
      await bet.save({ transaction: t });

      // Release funds and update wallet
      const wallet = await Wallet.findOne({
        where: { userId },
        transaction: t,
      });

      if (wallet) {
        await wallet.unfreezeAmount(Number(bet.amount));
        wallet.balance = Number(wallet.balance) + Number(bet.amount);
        await wallet.save({ transaction: t });

        // Create refund transaction
        await Transaction.create(
          {
            walletId: wallet.id,
            type: "bet-refund",
            amount: Number(bet.amount),
            status: "completed",
            description: `Refund for cancelled bet on fight ${bet.fightId}`,
            metadata: {
              betId: bet.id,
              fightId: bet.fightId,
            },
          },
          { transaction: t }
        );
      }

      // Update counters
      const fight = await Fight.findByPk(bet.fightId, { transaction: t });
      if (fight) {
        fight.totalBets -= 1;
        fight.totalAmount -= Number(bet.amount);
        await fight.save({ transaction: t });

        const event = await Event.findByPk(fight.eventId, { transaction: t });
        if (event) {
          event.totalBets -= 1;
          event.totalPrizePool -= Number(bet.amount);
          await event.save({ transaction: t });
        }
      }

      // Emit WebSocket event
      if (io) {
        io.to(`event_${fight?.eventId}`).emit("bet_cancelled", {
          bet: bet.toPublicJSON(),
          fightId: fight?.id,
        });
      }

      return bet;
    });
  }

  /**
   * Auto-match flat bets with compatible opposite bets
   */
  static async autoMatchFlatBet(bet: Bet, io: any): Promise<AutoMatchResult | null> {
    if (bet.betType !== 'flat' || bet.status !== 'pending') {
      return null; // Only flat, pending bets are eligible for auto-match
    }

    return await transaction(async (t) => {
      // Look for an opposite-side, exact amount flat bet that is still pending
      const oppositeBet = await Bet.findOne({
        where: {
          fightId: bet.fightId,
          side: bet.side === 'red' ? 'blue' : 'red', // Opposite side
          amount: bet.amount, // Exact amount match
          status: 'pending',
          betType: 'flat', // Only flat bets match each other
        },
        include: [
          { model: User, as: "user" },
          { model: Wallet, as: "wallet" },
        ],
        transaction: t,
      });

      if (!oppositeBet) {
        return null; // No matching bet found
      }

      // Get the wallets for both users
      const bettorWallet = await Wallet.findOne({
        where: { userId: bet.userId },
        transaction: t,
      });

      const oppositeWallet = await Wallet.findOne({
        where: { userId: oppositeBet.userId },
        transaction: t,
      });

      if (!bettorWallet || !oppositeWallet) {
        throw errors.notFound("Wallet not found for one of the bettors");
      }

      // Check if both users have sufficient available balance
      if (!bettorWallet.canBet(Number(bet.amount)) || !oppositeWallet.canBet(Number(oppositeBet.amount))) {
        return null; // One of the wallets doesn't have enough balance
      }

      // Mark both bets as active and matched with each other
      bet.status = 'active';
      bet.matchedWith = oppositeBet.id;
      await bet.save({ transaction: t });

      oppositeBet.status = 'active';
      oppositeBet.matchedWith = bet.id;
      await oppositeBet.save({ transaction: t });

      // Update fight counters since both bets are now matched
      const fight = await Fight.findByPk(bet.fightId, { transaction: t });
      if (fight) {
        // Increment by 1 for the matched pair (instead of 2 individual bets)
        fight.totalBets += 1;
        fight.totalAmount += Number(bet.amount) + Number(oppositeBet.amount);
        await fight.save({ transaction: t });

        // Update event counters
        const event = await Event.findByPk(fight.eventId, { transaction: t });
        if (event) {
          event.totalBets += 1; // Increment by 1 for the matched pair
          event.totalPrizePool += Number(bet.amount) + Number(oppositeBet.amount);
          await event.save({ transaction: t });
        }
      }

      // Create transaction records for both bets
      await Transaction.create(
        {
          walletId: bettorWallet.id,
          type: "bet-loss",
          amount: Number(bet.amount),
          status: "pending",
          description: `Auto-matched bet on fight ${fight?.number}`,
          metadata: {
            betId: bet.id,
            fightId: bet.fightId,
            matchedBetId: oppositeBet.id,
          },
        },
        { transaction: t }
      );

      await Transaction.create(
        {
          walletId: oppositeWallet.id,
          type: "bet-loss",
          amount: Number(oppositeBet.amount),
          status: "pending",
          description: `Auto-matched bet on fight ${fight?.number}`,
          metadata: {
            betId: oppositeBet.id,
            fightId: oppositeBet.fightId,
            matchedBetId: bet.id,
          },
        },
        { transaction: t }
      );

      // Emit WebSocket event for bet matching
      if (io) {
        io.to(`event_${fight?.eventId}`).emit("bet_matched", {
          offerBet: bet.toPublicJSON(),
          acceptBet: oppositeBet.toPublicJSON(),
          fightId: bet.fightId,
        });
      }

      return { bet, oppositeBet };
    });
  }

  /**
   * Propose a PAGO for an existing bet
   */
  static async proposePago(input: PagoProposalInput, io: any): Promise<Bet> {
    const { betId, userId, pagoAmount } = input;

    return await transaction(async (t) => {
      const originalBet = await Bet.findByPk(betId, { transaction: t });
      if (
        !originalBet ||
        originalBet.betType !== "flat" ||
        !originalBet.isPending()
      ) {
        throw errors.badRequest("Invalid bet for PAGO proposal");
      }
      if (pagoAmount >= Number(originalBet.amount)) {
        throw errors.badRequest("PAGO amount must be less than original bet amount");
      }

      const wallet = await Wallet.findOne({
        where: { userId },
        transaction: t,
      });
      if (!wallet || !wallet.canBet(pagoAmount)) {
        throw errors.badRequest("Insufficient available balance");
      }

      const pagoBet = await Bet.create(
        {
          fightId: originalBet.fightId,
          userId,
          side: originalBet.side,
          amount: pagoAmount,
          betType: "pago",
          proposalStatus: "pending",
          parentBetId: originalBet.id,
          terms: {
            ratio: 2.0,
            isOffer: false,
            pagoAmount,
            proposedBy: userId,
          },
        },
        { transaction: t }
      );

      await wallet.freezeAmount(pagoAmount);
      await wallet.save({ transaction: t });

      // Emit notification to original bettor
      if (io) {
        io.to(`user_${originalBet.userId}`).emit("pago_proposed", {
          originalBet: originalBet.toPublicJSON(),
          pagoBet: pagoBet.toPublicJSON(),
        });
      }

      return pagoBet;
    });
  }

  /**
   * Accept a PAGO proposal
   */
  static async acceptPago(originalBetId: string, userId: string, io: any): Promise<Bet> {
    return await transaction(async (t) => {
      const originalBet = await Bet.findByPk(originalBetId, { transaction: t });
      if (
        !originalBet ||
        originalBet.userId !== userId ||
        originalBet.proposalStatus !== "pending"
      ) {
        throw errors.badRequest("Invalid bet for accepting PAGO proposal");
      }

      const pagoBet = await Bet.findOne({
        where: { parentBetId: originalBet.id, proposalStatus: "pending" },
        transaction: t,
      });
      if (!pagoBet) {
        throw errors.notFound("PAGO proposal not found");
      }

      // Validate both users' wallets
      const originalWallet = await Wallet.findOne({
        where: { userId: originalBet.userId },
        transaction: t,
      });
      const pagoWallet = await Wallet.findOne({
        where: { userId: pagoBet.userId },
        transaction: t,
      });

      if (!originalWallet || !pagoWallet) {
        throw errors.notFound("Wallet not found for one of the bettors");
      }

      if (!originalWallet.canBet(Number(originalBet.amount)) || !pagoWallet.canBet(Number(pagoBet.amount))) {
        throw errors.badRequest("One of the bettors has insufficient balance for the matched amount");
      }

      // Update both bets to active and mark as matched
      originalBet.proposalStatus = "accepted";
      pagoBet.proposalStatus = "accepted";
      originalBet.status = "active";
      pagoBet.status = "active";
      await Promise.all([
        originalBet.save({ transaction: t }),
        pagoBet.save({ transaction: t }),
      ]);

      // Emit WebSocket event
      if (io) {
        io.to(`user_${pagoBet.userId}`).emit("pago_accepted", {
          originalBet: originalBet.toPublicJSON(),
          pagoBet: pagoBet.toPublicJSON(),
        });
      }

      return originalBet;
    });
  }

  /**
   * Reject a PAGO proposal
   */
  static async rejectPago(originalBetId: string, userId: string, io: any): Promise<Bet> {
    return await transaction(async (t) => {
      const originalBet = await Bet.findByPk(originalBetId, { transaction: t });
      if (
        !originalBet ||
        originalBet.userId !== userId ||
        originalBet.proposalStatus !== "pending"
      ) {
        throw errors.badRequest("Invalid bet for rejecting PAGO proposal");
      }

      const pagoBet = await Bet.findOne({
        where: { parentBetId: originalBet.id, proposalStatus: "pending" },
        transaction: t,
      });
      if (!pagoBet) {
        throw errors.notFound("PAGO proposal not found");
      }

      // Release funds from pago bet
      const pagoWallet = await Wallet.findOne({
        where: { userId: pagoBet.userId },
        transaction: t,
      });
      if (pagoWallet) {
        await pagoWallet.unfreezeAmount(Number(pagoBet.amount));
        await pagoWallet.save({ transaction: t });
      }

      // Update original bet status
      originalBet.proposalStatus = "rejected";
      await originalBet.save({ transaction: t });

      // Remove the pago bet proposal
      await pagoBet.destroy({ transaction: t });

      // Emit WebSocket event
      if (io) {
        io.to(`user_${pagoBet.userId}`).emit("pago_rejected", {
          originalBet: originalBet.toPublicJSON(),
        });
      }

      return originalBet;
    });
  }
}

export default BetService;