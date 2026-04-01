const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { profileUpdateValidation } = require('../middleware/validators');
const { handleValidationErrors } = require('../middleware/validation');
const { getUserProfile, updateUserProfile, getUserRides, getRideHistory } = require('../controllers/user.controller');

// GET /api/users/:id - Get user profile
router.get('/:id', authenticate, getUserProfile);

// PUT /api/users/:id - Update user profile
router.put('/:id', authenticate, profileUpdateValidation, handleValidationErrors, updateUserProfile);

// GET /api/users/:id/rides - Get rides offered by user
router.get('/:id/rides', authenticate, getUserRides);

// GET /api/users/:id/history - Get ride history
router.get('/:id/history', authenticate, getRideHistory);

module.exports = router;
