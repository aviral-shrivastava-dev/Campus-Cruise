const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { bookingValidation } = require('../middleware/validators');
const { handleValidationErrors } = require('../middleware/validation');
const { createBooking, cancelBooking, cancelPendingBooking, getUserBookings, getBookingById } = require('../controllers/booking.controller');

// POST /api/bookings - Create new booking
router.post('/', authenticate, bookingValidation, handleValidationErrors, createBooking);

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', authenticate, getBookingById);

// POST /api/bookings/:id/cancel-pending - Cancel pending booking (abandon payment)
router.post('/:id/cancel-pending', authenticate, cancelPendingBooking);

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticate, cancelBooking);

// GET /api/users/:id/bookings - Get all bookings for a user
router.get('/users/:id', authenticate, getUserBookings);

module.exports = router;
