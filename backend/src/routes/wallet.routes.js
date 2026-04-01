const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', walletController.getWallet);
router.post('/add-funds', walletController.addFunds);
router.post('/purchase-credits', walletController.purchaseCredits);
router.post('/redeem-points', walletController.redeemRewardPoints);
router.get('/transactions', walletController.getTransactionHistory);

module.exports = router;
