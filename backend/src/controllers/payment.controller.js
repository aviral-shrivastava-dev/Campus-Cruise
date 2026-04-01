const paymentService = require('../services/payment.service');
const { ValidationError } = require('../utils/errors');

exports.processPayment = async (req, res, next) => {
  try {
    const { bookingId, useCredits, useRewardPoints, splitPaymentId } = req.body;

    if (!bookingId) {
      throw new ValidationError('Booking ID is required');
    }

    const result = await paymentService.processRidePayment(bookingId, {
      useCredits,
      useRewardPoints: parseInt(useRewardPoints) || 0,
      splitPaymentId
    });

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: result.payment
    });
  } catch (error) {
    next(error);
  }
};

exports.releasePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.releaseEscrowPayment(paymentId);

    res.json({
      message: 'Payment released to driver',
      payment
    });
  } catch (error) {
    next(error);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await paymentService.refundPayment(paymentId, reason);

    res.json({
      message: 'Payment refunded successfully',
      payment
    });
  } catch (error) {
    next(error);
  }
};

exports.createSplitPayment = async (req, res, next) => {
  try {
    const { rideId, participantIds } = req.body;
    const initiatorId = req.user.id;

    if (!rideId || !participantIds || participantIds.length < 2) {
      throw new ValidationError('Ride ID and at least 2 participants are required');
    }

    const splitPayment = await paymentService.createSplitPayment(rideId, initiatorId, participantIds);

    res.status(201).json({
      message: 'Split payment created successfully',
      splitPayment
    });
  } catch (error) {
    next(error);
  }
};

exports.paySplitShare = async (req, res, next) => {
  try {
    const { splitPaymentId } = req.params;
    const userId = req.user.id;

    const splitPayment = await paymentService.paySplitShare(splitPaymentId, userId);

    res.json({
      message: 'Split payment share paid successfully',
      splitPayment
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await paymentService.getPaymentSummary(userId);

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

exports.calculatePrice = async (req, res, next) => {
  try {
    const { distance, duration, surge } = req.query;

    if (!distance || !duration) {
      throw new ValidationError('Distance and duration are required');
    }

    const price = await paymentService.calculateRidePrice(
      parseFloat(distance),
      parseFloat(duration),
      parseFloat(surge) || 1.0
    );

    res.json({ price });
  } catch (error) {
    next(error);
  }
};
