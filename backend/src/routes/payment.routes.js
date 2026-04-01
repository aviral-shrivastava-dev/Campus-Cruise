const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/process', paymentController.processPayment);
router.post('/:paymentId/release', paymentController.releasePayment);
router.post('/:paymentId/refund', paymentController.refundPayment);
router.post('/split/create', paymentController.createSplitPayment);
router.post('/split/:splitPaymentId/pay', paymentController.paySplitShare);
router.get('/summary', paymentController.getPaymentSummary);
router.get('/calculate-price', paymentController.calculatePrice);

module.exports = router;
