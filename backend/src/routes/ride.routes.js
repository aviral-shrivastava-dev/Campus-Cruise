const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { rideValidation, rideQueryValidation } = require('../middleware/validators');
const { handleValidationErrors } = require('../middleware/validation');
const { createRide, getRides, getRideById, cancelRide, getSuggestedRides } = require('../controllers/ride.controller');

// POST /api/rides - Create new ride (driver only)
router.post('/', authenticate, authorize('driver'), rideValidation, handleValidationErrors, createRide);

// GET /api/rides/suggestions - Get suggested rides (must be before /:id)
router.get('/suggestions', rideQueryValidation, handleValidationErrors, getSuggestedRides);

// GET /api/rides - Get all available rides with optional filters
router.get('/', rideQueryValidation, handleValidationErrors, getRides);

// GET /api/rides/:id - Get ride by ID
router.get('/:id', getRideById);

// DELETE /api/rides/:id - Cancel ride (driver only)
router.delete('/:id', authenticate, authorize('driver'), cancelRide);

module.exports = router;
