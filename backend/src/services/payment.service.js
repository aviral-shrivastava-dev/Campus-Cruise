const db = require('../models');
const { withTransaction } = require('../utils/transaction');
const { ValidationError } = require('../utils/errors');
const walletService = require('./wallet.service');

const CASHBACK_RATE = 0.05; // 5%
const REWARD_POINTS_RATE = 10; // 10 points per dollar
const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

class PaymentService {
  async processRidePayment(bookingId, paymentOptions = {}) {
    const { useCredits = false, useRewardPoints = 0, splitPaymentId = null } = paymentOptions;

    return await withTransaction(async (transaction) => {
      const booking = await db.Booking.findByPk(bookingId, {
        include: [
          { model: db.Ride, as: 'ride', include: [{ model: db.User, as: 'driver' }] },
          { model: db.User, as: 'passenger' }
        ],
        transaction
      });

      if (!booking) {
        throw new ValidationError('Booking not found');
      }

      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        throw new ValidationError('Booking must be pending or confirmed to process payment');
      }

      const existingPayment = await db.RidePayment.findOne({
        where: { bookingId },
        transaction
      });

      if (existingPayment) {
        throw new ValidationError('Payment already exists for this booking');
      }

      const ride = booking.ride;
      const totalAmount = parseFloat(ride.pricePerSeat);
      const passengerWallet = await walletService.getOrCreateWallet(booking.passengerId, transaction);
      const driverWallet = await walletService.getOrCreateWallet(ride.driverId, transaction);

      let remainingAmount = totalAmount;
      let creditsUsed = 0;
      let rewardPointsUsed = 0;
      let paymentMethod = 'wallet';

      // Apply reward points discount
      if (useRewardPoints > 0) {
        const maxPointsToUse = Math.min(useRewardPoints, passengerWallet.rewardPoints);
        const pointsDiscount = maxPointsToUse * 0.01;
        rewardPointsUsed = maxPointsToUse;
        remainingAmount = Math.max(0, remainingAmount - pointsDiscount);
      }

      // Apply credits
      if (useCredits && passengerWallet.credits > 0) {
        const creditsNeeded = Math.ceil(remainingAmount / 0.10);
        creditsUsed = Math.min(creditsNeeded, passengerWallet.credits);
        const creditsDiscount = creditsUsed * 0.10;
        remainingAmount = Math.max(0, remainingAmount - creditsDiscount);
        paymentMethod = remainingAmount > 0 ? 'mixed' : 'credits';
      }

      // Check if passenger has sufficient funds
      if (parseFloat(passengerWallet.balance) < remainingAmount) {
        throw new ValidationError('Insufficient wallet balance');
      }

      // Calculate rewards
      const cashbackEarned = totalAmount * CASHBACK_RATE;
      const rewardPointsEarned = Math.floor(totalAmount * REWARD_POINTS_RATE);
      const platformFee = totalAmount * PLATFORM_FEE_RATE;
      const driverEarning = totalAmount - platformFee;

      // Deduct from passenger wallet
      const passengerBalanceBefore = parseFloat(passengerWallet.balance);
      const passengerBalanceAfter = passengerBalanceBefore - remainingAmount;

      await passengerWallet.update({
        balance: passengerBalanceAfter,
        credits: passengerWallet.credits - creditsUsed,
        rewardPoints: passengerWallet.rewardPoints - rewardPointsUsed + rewardPointsEarned,
        totalSpent: parseFloat(passengerWallet.totalSpent) + totalAmount
      }, { transaction });

      // Create escrow transaction (hold funds)
      const escrowTxn = await db.Transaction.create({
        walletId: passengerWallet.id,
        type: 'escrow_hold',
        amount: -remainingAmount,
        credits: -creditsUsed,
        rewardPoints: -rewardPointsUsed + rewardPointsEarned,
        status: 'held',
        description: `Payment held for ride from ${ride.source} to ${ride.destination}`,
        referenceId: ride.id,
        referenceType: 'ride',
        balanceBefore: passengerBalanceBefore,
        balanceAfter: passengerBalanceAfter,
        metadata: {
          cashbackEarned,
          rewardPointsEarned
        }
      }, { transaction });

      // Create ride payment record
      const ridePayment = await db.RidePayment.create({
        rideId: ride.id,
        bookingId: booking.id,
        passengerId: booking.passengerId,
        driverId: ride.driverId,
        totalAmount,
        paidAmount: remainingAmount,
        creditsUsed,
        rewardPointsUsed,
        cashbackEarned,
        rewardPointsEarned,
        paymentMethod: splitPaymentId ? 'split' : paymentMethod,
        status: 'held',
        splitPaymentId,
        escrowTransactionId: escrowTxn.id
      }, { transaction });

      // Confirm the booking after successful payment
      if (booking.status === 'pending') {
        await booking.update({ status: 'confirmed' }, { transaction });
      }

      return {
        payment: ridePayment,
        escrowTransaction: escrowTxn,
        passengerWallet,
        driverWallet
      };
    });
  }

  async releaseEscrowPayment(ridePaymentId) {
    return await withTransaction(async (transaction) => {
      const payment = await db.RidePayment.findByPk(ridePaymentId, {
        include: [
          { model: db.Ride, as: 'ride' },
          { model: db.User, as: 'driver' }
        ],
        transaction
      });

      if (!payment) {
        throw new ValidationError('Payment not found');
      }

      if (payment.status !== 'held') {
        throw new ValidationError('Payment is not in held status');
      }

      const driverWallet = await walletService.getOrCreateWallet(payment.driverId, transaction);
      const platformFee = parseFloat(payment.totalAmount) * PLATFORM_FEE_RATE;
      const driverEarning = parseFloat(payment.totalAmount) - platformFee;

      const driverBalanceBefore = parseFloat(driverWallet.balance);
      const driverBalanceAfter = driverBalanceBefore + driverEarning;

      await driverWallet.update({
        balance: driverBalanceAfter,
        totalEarnings: parseFloat(driverWallet.totalEarnings) + driverEarning
      }, { transaction });

      // Update escrow transaction
      await db.Transaction.update({
        status: 'completed'
      }, {
        where: { id: payment.escrowTransactionId },
        transaction
      });

      // Create earning transaction for driver
      await db.Transaction.create({
        walletId: driverWallet.id,
        type: 'ride_earning',
        amount: driverEarning,
        status: 'completed',
        description: `Earnings from ride to ${payment.ride.destination}`,
        referenceId: payment.rideId,
        referenceType: 'ride',
        balanceBefore: driverBalanceBefore,
        balanceAfter: driverBalanceAfter,
        metadata: {
          platformFee,
          grossAmount: payment.totalAmount
        }
      }, { transaction });

      // Apply cashback to passenger
      const passengerWallet = await walletService.getOrCreateWallet(payment.passengerId, transaction);
      const passengerBalanceBefore = parseFloat(passengerWallet.balance);
      const passengerBalanceAfter = passengerBalanceBefore + parseFloat(payment.cashbackEarned);

      await passengerWallet.update({
        balance: passengerBalanceAfter
      }, { transaction });

      await db.Transaction.create({
        walletId: passengerWallet.id,
        type: 'cashback',
        amount: payment.cashbackEarned,
        status: 'completed',
        description: `Cashback from ride payment`,
        referenceId: payment.rideId,
        referenceType: 'ride',
        balanceBefore: passengerBalanceBefore,
        balanceAfter: passengerBalanceAfter
      }, { transaction });

      await payment.update({
        status: 'completed',
        completedAt: new Date()
      }, { transaction });

      return payment;
    });
  }

  async refundPayment(ridePaymentId, reason = 'Ride cancelled') {
    return await withTransaction(async (transaction) => {
      const payment = await db.RidePayment.findByPk(ridePaymentId, { transaction });

      if (!payment) {
        throw new ValidationError('Payment not found');
      }

      if (payment.status === 'refunded') {
        throw new ValidationError('Payment already refunded');
      }

      if (payment.status === 'completed') {
        throw new ValidationError('Cannot refund completed payment');
      }

      const passengerWallet = await walletService.getOrCreateWallet(payment.passengerId, transaction);

      const balanceBefore = parseFloat(passengerWallet.balance);
      const balanceAfter = balanceBefore + parseFloat(payment.paidAmount);

      await passengerWallet.update({
        balance: balanceAfter,
        credits: passengerWallet.credits + payment.creditsUsed,
        rewardPoints: passengerWallet.rewardPoints + payment.rewardPointsUsed - payment.rewardPointsEarned,
        totalSpent: Math.max(0, parseFloat(passengerWallet.totalSpent) - parseFloat(payment.totalAmount))
      }, { transaction });

      await db.Transaction.create({
        walletId: passengerWallet.id,
        type: 'refund',
        amount: payment.paidAmount,
        credits: payment.creditsUsed,
        rewardPoints: payment.rewardPointsUsed - payment.rewardPointsEarned,
        status: 'completed',
        description: `Refund: ${reason}`,
        referenceId: payment.rideId,
        referenceType: 'ride',
        balanceBefore,
        balanceAfter
      }, { transaction });

      await payment.update({
        status: 'refunded',
        refundedAt: new Date()
      }, { transaction });

      return payment;
    });
  }

  async createSplitPayment(rideId, initiatorId, participantIds) {
    return await withTransaction(async (transaction) => {
      const ride = await db.Ride.findByPk(rideId, { transaction });

      if (!ride) {
        throw new ValidationError('Ride not found');
      }

      const totalAmount = parseFloat(ride.pricePerSeat);
      const participantCount = participantIds.length;
      const amountPerPerson = totalAmount / participantCount;

      const participants = participantIds.map(userId => ({
        userId,
        amount: amountPerPerson,
        paid: false,
        paidAt: null
      }));

      const splitPayment = await db.SplitPayment.create({
        rideId,
        initiatorId,
        totalAmount,
        participantCount,
        amountPerPerson,
        paidCount: 0,
        status: 'pending',
        participants
      }, { transaction });

      return splitPayment;
    });
  }

  async paySplitShare(splitPaymentId, userId) {
    return await withTransaction(async (transaction) => {
      const splitPayment = await db.SplitPayment.findByPk(splitPaymentId, {
        include: [{ model: db.Ride, as: 'ride' }],
        transaction
      });

      if (!splitPayment) {
        throw new ValidationError('Split payment not found');
      }

      const participant = splitPayment.participants.find(p => p.userId === userId);

      if (!participant) {
        throw new ValidationError('User is not a participant in this split payment');
      }

      if (participant.paid) {
        throw new ValidationError('User has already paid their share');
      }

      const wallet = await walletService.getOrCreateWallet(userId, transaction);

      if (parseFloat(wallet.balance) < participant.amount) {
        throw new ValidationError('Insufficient balance');
      }

      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore - participant.amount;

      await wallet.update({
        balance: balanceAfter,
        totalSpent: parseFloat(wallet.totalSpent) + participant.amount
      }, { transaction });

      await db.Transaction.create({
        walletId: wallet.id,
        type: 'split_payment',
        amount: -participant.amount,
        status: 'completed',
        description: `Split payment for ride to ${splitPayment.ride.destination}`,
        referenceId: splitPayment.rideId,
        referenceType: 'ride',
        balanceBefore,
        balanceAfter,
        metadata: {
          splitPaymentId,
          totalParticipants: splitPayment.participantCount
        }
      }, { transaction });

      participant.paid = true;
      participant.paidAt = new Date();

      const paidCount = splitPayment.paidCount + 1;
      const newStatus = paidCount === splitPayment.participantCount ? 'completed' : 'partial';

      await splitPayment.update({
        participants: splitPayment.participants,
        paidCount,
        status: newStatus
      }, { transaction });

      return splitPayment;
    });
  }

  async calculateRidePrice(distance, duration, surge = 1.0) {
    const basePrice = 5.00;
    const pricePerMile = 1.50;
    const pricePerMinute = 0.25;

    const price = (basePrice + (distance * pricePerMile) + (duration * pricePerMinute)) * surge;
    return Math.round(price * 100) / 100;
  }

  async getPaymentSummary(userId) {
    const wallet = await walletService.getOrCreateWallet(userId);

    const recentTransactions = await db.Transaction.findAll({
      where: { walletId: wallet.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const pendingPayments = await db.RidePayment.findAll({
      where: {
        passengerId: userId,
        status: ['pending', 'held']
      }
    });

    const pendingSplits = await db.SplitPayment.findAll({
      where: {
        status: ['pending', 'partial']
      }
    });

    const userPendingSplits = pendingSplits.filter(split =>
      split.participants.some(p => p.userId === userId && !p.paid)
    );

    return {
      wallet: {
        balance: parseFloat(wallet.balance),
        credits: wallet.credits,
        rewardPoints: wallet.rewardPoints,
        totalEarnings: parseFloat(wallet.totalEarnings),
        totalSpent: parseFloat(wallet.totalSpent)
      },
      recentTransactions,
      pendingPayments,
      pendingSplits: userPendingSplits
    };
  }
}

module.exports = new PaymentService();
