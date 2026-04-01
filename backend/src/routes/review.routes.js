const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validators');
const { handleValidationErrors } = require('../middleware/validation');
const { createReview, getDriverReviews } = require('../controllers/review.controller');

// POST /api/reviews - Create new review
router.post('/', authenticate, reviewValidation, handleValidationErrors, createReview);

// GET /api/reviews/driver/:driverId - Get all reviews for a driver
router.get('/driver/:driverId', getDriverReviews);

module.exports = router;
