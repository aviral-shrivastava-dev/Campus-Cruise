const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');
const {
  startTracking,
  stopTracking,
  updateRideLocation,
  getRideLocation
} = require('../controllers/location.controller');

// Validation rules for location update
const locationValidation = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
];

// POST /api/rides/:id/start-tracking - Start location tracking (driver only)
router.post('/:id/start-tracking', authenticate, authorize('driver'), startTracking);

// POST /api/rides/:id/stop-tracking - Stop location tracking (driver only)
router.post('/:id/stop-tracking', authenticate, authorize('driver'), stopTracking);

// PUT /api/rides/:id/location - Update location (driver only)
router.put('/:id/location', authenticate, authorize('driver'), locationValidation, handleValidationErrors, updateRideLocation);

// GET /api/rides/:id/location - Get current location
router.get('/:id/location', getRideLocation);

module.exports = router;
