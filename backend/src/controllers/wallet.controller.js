const walletService = require('../services/wallet.service');
const { ValidationError } = require('../utils/errors');

exports.getWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await walletService.getWalletBalance(userId);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
};

exports.addFunds = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Valid amount is required');
    }

    const result = await walletService.addFunds(userId, parseFloat(amount), description);

    res.status(201).json({
      message: 'Funds added successfully',
      wallet: result.wallet,
      transaction: result.transaction
    });
  } catch (error) {
    next(error);
  }
};

exports.purchaseCredits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { credits } = req.body;

    if (!credits || credits <= 0) {
      throw new ValidationError('Valid credit amount is required');
    }

    const result = await walletService.purchaseCredits(userId, parseInt(credits));

    res.status(201).json({
      message: 'Credits purchased successfully',
      wallet: result.wallet,
      transaction: result.transaction
    });
  } catch (error) {
    next(error);
  }
};

exports.redeemRewardPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { points } = req.body;

    if (!points || points <= 0) {
      throw new ValidationError('Valid points amount is required');
    }

    const result = await walletService.redeemRewardPoints(userId, parseInt(points));

    res.status(201).json({
      message: 'Reward points redeemed successfully',
      wallet: result.wallet,
      transaction: result.transaction
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await walletService.getTransactionHistory(userId, limit, offset);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
