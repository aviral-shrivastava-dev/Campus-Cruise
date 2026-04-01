const db = require('../models');
const { withTransaction } = require('../utils/transaction');
const { DatabaseError, ValidationError } = require('../utils/errors');

const CREDIT_TO_MONEY_RATE = 0.10; // 1 credit = $0.10
const REWARD_POINTS_TO_MONEY_RATE = 0.01; // 1 point = $0.01
const CASHBACK_RATE = 0.05; // 5% cashback
const REWARD_POINTS_RATE = 10; // 10 points per dollar spent

class WalletService {
  async getOrCreateWallet(userId, transaction = null) {
    const wallet = await db.Wallet.findOne({
      where: { userId },
      transaction
    });

    if (wallet) {
      return wallet;
    }

    return await db.Wallet.create({
      userId,
      balance: 0.00,
      credits: 0,
      rewardPoints: 0,
      totalEarnings: 0.00,
      totalSpent: 0.00
    }, { transaction });
  }

  async getWalletBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: parseFloat(wallet.balance),
      credits: wallet.credits,
      rewardPoints: wallet.rewardPoints,
      totalEarnings: parseFloat(wallet.totalEarnings),
      totalSpent: parseFloat(wallet.totalSpent),
      isLocked: wallet.isLocked
    };
  }

  async addFunds(userId, amount, description = 'Wallet top-up') {
    if (amount <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    return await withTransaction(async (transaction) => {
      const wallet = await this.getOrCreateWallet(userId, transaction);

      if (wallet.isLocked) {
        throw new ValidationError('Wallet is locked');
      }

      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await wallet.update({
        balance: balanceAfter
      }, { transaction });

      const txn = await db.Transaction.create({
        walletId: wallet.id,
        type: 'deposit',
        amount,
        status: 'completed',
        description,
        balanceBefore,
        balanceAfter
      }, { transaction });

      return { wallet, transaction: txn };
    });
  }

  async purchaseCredits(userId, creditAmount) {
    if (creditAmount <= 0) {
      throw new ValidationError('Credit amount must be positive');
    }

    const cost = creditAmount * CREDIT_TO_MONEY_RATE;

    return await withTransaction(async (transaction) => {
      const wallet = await this.getOrCreateWallet(userId, transaction);

      if (wallet.isLocked) {
        throw new ValidationError('Wallet is locked');
      }

      if (parseFloat(wallet.balance) < cost) {
        throw new ValidationError('Insufficient balance');
      }

      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore - cost;

      await wallet.update({
        balance: balanceAfter,
        credits: wallet.credits + creditAmount,
        totalSpent: parseFloat(wallet.totalSpent) + cost
      }, { transaction });

      const txn = await db.Transaction.create({
        walletId: wallet.id,
        type: 'credit_purchase',
        amount: -cost,
        credits: creditAmount,
        status: 'completed',
        description: `Purchased ${creditAmount} ride credits`,
        balanceBefore,
        balanceAfter
      }, { transaction });

      return { wallet, transaction: txn };
    });
  }

  async redeemRewardPoints(userId, points) {
    if (points <= 0) {
      throw new ValidationError('Points must be positive');
    }

    const cashValue = points * REWARD_POINTS_TO_MONEY_RATE;

    return await withTransaction(async (transaction) => {
      const wallet = await this.getOrCreateWallet(userId, transaction);

      if (wallet.isLocked) {
        throw new ValidationError('Wallet is locked');
      }

      if (wallet.rewardPoints < points) {
        throw new ValidationError('Insufficient reward points');
      }

      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + cashValue;

      await wallet.update({
        balance: balanceAfter,
        rewardPoints: wallet.rewardPoints - points
      }, { transaction });

      const txn = await db.Transaction.create({
        walletId: wallet.id,
        type: 'reward_redemption',
        amount: cashValue,
        rewardPoints: -points,
        status: 'completed',
        description: `Redeemed ${points} reward points for $${cashValue.toFixed(2)}`,
        balanceBefore,
        balanceAfter
      }, { transaction });

      return { wallet, transaction: txn };
    });
  }

  async getTransactionHistory(userId, limit = 50, offset = 0) {
    const wallet = await this.getOrCreateWallet(userId);

    const transactions = await db.Transaction.findAll({
      where: { walletId: wallet.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const total = await db.Transaction.count({
      where: { walletId: wallet.id }
    });

    return {
      transactions,
      total,
      limit,
      offset
    };
  }
}

module.exports = new WalletService();
