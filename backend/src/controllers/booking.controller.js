const { Booking, Ride, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { broadcastSeatChange } = require('../socket/rideEvents');
const { 
  notifyDriverOfBooking, 
  notifyDriverOfCancellation,
  notifyPassengerOfBookingConfirmation,
  notifyDriverOfFullCapacity
} = require('../socket/notifications');
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require('../services/email.service');
const { withTransaction } = require('../utils/transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, AuthorizationError, ConflictError } = require('../middleware/errorHandler');
const { logError } = require('../utils/logger');
const paymentService = require('../services/payment.service');
const bookingService = require('../services/booking.service');

/**
 * Create a new booking (join a ride)
 * POST /api/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid input data', errors.array());
  }

  const { rideId } = req.body;
  const passengerId = req.user.id;

  // Check if user has any unpaid bookings for THIS specific ride
  const existingPendingBooking = await Booking.findOne({
    where: {
      rideId,
      passengerId,
      status: 'pending'
    },
    include: [{
      model: Ride,
      as: 'ride'
    }]
  });

  // If there's a pending booking for this ride, auto-cancel it and allow rebooking
  if (existingPendingBooking) {
    const updatedRide = await withTransaction(async (t) => {
      // Cancel the old pending booking
      await existingPendingBooking.update({ status: 'cancelled' }, { transaction: t });
      
      // Release the seat
      await existingPendingBooking.ride.increment('availableSeats', { by: 1, transaction: t });
      
      // Reload the ride to get updated seat count
      await existingPendingBooking.ride.reload({ transaction: t });
      
      return existingPendingBooking.ride;
    });
    
    // Broadcast seat update immediately after cancelling old booking
    const io = req.app.get('io');
    if (io) {
      broadcastSeatChange(io, rideId, updatedRide.availableSeats);
    }
    
    console.log('Auto-cancelled previous pending booking and released seat:', {
      bookingId: existingPendingBooking.id,
      rideId,
      passengerId,
      newAvailableSeats: updatedRide.availableSeats
    });
  }

  // Check if user has any OTHER unpaid bookings (different rides)
  const otherUnpaidBookings = await bookingService.getUnpaidBookings(passengerId);
  const otherUnpaidForDifferentRide = otherUnpaidBookings.filter(b => b.rideId !== rideId);
  
  if (otherUnpaidForDifferentRide.length > 0) {
    const unpaidBooking = otherUnpaidForDifferentRide[0];
    throw new ValidationError(
      `Please complete payment for your existing booking (${unpaidBooking.ride.source} → ${unpaidBooking.ride.destination}) before creating a new one`,
      { bookingId: unpaidBooking.id }
    );
  }

  // Fetch the ride
  const ride = await Ride.findByPk(rideId, {
    include: [{
      model: User,
      as: 'driver',
      attributes: ['id', 'name', 'email']
    }]
  });

  if (!ride) {
    throw new NotFoundError('Ride not found');
  }

  // Check if ride is active
  if (ride.status !== 'active') {
    throw new ValidationError('Cannot book a cancelled or completed ride');
  }

  // Check if ride has available seats
  if (ride.availableSeats <= 0) {
    throw new ValidationError('No available seats for this ride');
  }

  // Check for duplicate confirmed booking (pending bookings are already handled above)
  const existingConfirmedBooking = await Booking.findOne({
    where: {
      rideId,
      passengerId,
      status: 'confirmed'
    }
  });

  console.log('Checking for existing confirmed booking:', {
    rideId,
    passengerId,
    existingConfirmedBooking: existingConfirmedBooking ? {
      id: existingConfirmedBooking.id,
      status: existingConfirmedBooking.status,
      createdAt: existingConfirmedBooking.createdAt
    } : null
  });

  if (existingConfirmedBooking) {
    throw new ConflictError('You have already booked this ride');
  }

  // Create booking with pending status (will be confirmed after payment)
  const result = await withTransaction(async (t) => {
    // Create the booking with pending status
    const booking = await Booking.create({
      rideId,
      passengerId,
      status: 'pending'
    }, { transaction: t });

    // Decrement available seats (reserve the seat)
    await ride.decrement('availableSeats', { by: 1, transaction: t });

    // Fetch the updated ride
    await ride.reload({ transaction: t });

    return { booking, ride };
  });

  // Fetch the complete booking with associations
  const completeBooking = await Booking.findByPk(result.booking.id, {
    include: [
      {
        model: Ride,
        as: 'ride',
        include: [{
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'college', 'phone']
        }]
      },
      {
        model: User,
        as: 'passenger',
        attributes: ['id', 'name', 'email', 'college', 'phone']
      }
    ]
  });

  // Broadcast booking creation via WebSocket
  const io = req.app.get('io');
  if (io) {
    // Notify driver
    notifyDriverOfBooking(io, ride.driver.id, {
      rideId: ride.id,
      bookingId: completeBooking.id,
      passengerId: passengerId,
      passengerName: completeBooking.passenger.name
    });

    // Notify passenger of confirmation
    notifyPassengerOfBookingConfirmation(io, passengerId, {
      rideId: ride.id,
      bookingId: completeBooking.id,
      driverName: ride.driver.name,
      source: ride.source,
      destination: ride.destination,
      departureTime: ride.departureTime
    });

    // Broadcast seat update
    broadcastSeatChange(io, ride.id, result.ride.availableSeats);

    // Check if ride is now full and notify driver
    if (result.ride.availableSeats === 0) {
      notifyDriverOfFullCapacity(io, ride.driver.id, {
        rideId: ride.id,
        source: ride.source,
        destination: ride.destination,
        totalSeats: ride.totalSeats
      });
    }

    // Add passenger to ride group chat room
    const { getUserSocket } = require('../socket');
    const passengerSocketId = getUserSocket(passengerId);
    if (passengerSocketId) {
      const passengerSocket = io.sockets.sockets.get(passengerSocketId);
      if (passengerSocket) {
        passengerSocket.join(`ride_${ride.id}`);
        
        // Notify group chat that new passenger joined
        io.to(`ride_${ride.id}`).emit('passenger_joined_chat', {
          rideId: ride.id,
          passengerId: passengerId,
          passengerName: completeBooking.passenger.name,
          timestamp: new Date()
        });
      }
    }
  }

  // Send email notifications to both driver and passenger (async, don't wait)
  const driverEmailPromise = sendBookingConfirmationEmail(
    ride.driver.email,
    ride.driver.name,
    {
      source: ride.source,
      destination: ride.destination,
      departureTime: ride.departureTime,
      driverName: ride.driver.name,
      passengerName: completeBooking.passenger.name,
      isDriver: true
    }
  );
  
  const passengerEmailPromise = sendBookingConfirmationEmail(
    completeBooking.passenger.email,
    completeBooking.passenger.name,
    {
      source: ride.source,
      destination: ride.destination,
      departureTime: ride.departureTime,
      driverName: ride.driver.name
    }
  );

  // Handle email errors without blocking response
  if (driverEmailPromise && typeof driverEmailPromise.catch === 'function') {
    driverEmailPromise.catch(err => {
      logError(err, { context: 'Failed to send booking confirmation email to driver' });
    });
  }
  
  if (passengerEmailPromise && typeof passengerEmailPromise.catch === 'function') {
    passengerEmailPromise.catch(err => {
      logError(err, { context: 'Failed to send booking confirmation email to passenger' });
    });
  }

  res.status(201).json({
    success: true,
    data: completeBooking,
    message: 'Seat reserved. Please complete payment within 15 minutes to confirm your booking.',
    requiresPayment: true,
    paymentUrl: `/payment/${completeBooking.id}`
  });
});

/**
 * Cancel a booking
 * DELETE /api/bookings/:id
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Fetch the booking with ride information
  const booking = await Booking.findByPk(id, {
    include: [{
      model: Ride,
      as: 'ride',
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email']
      }]
    }]
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Verify user is the passenger
  if (booking.passengerId !== userId) {
    throw new AuthorizationError('Only the passenger can cancel this booking');
  }

  // Check if booking is already cancelled
  if (booking.status === 'cancelled') {
    console.log('Booking already cancelled:', {
      bookingId: booking.id,
      status: booking.status,
      passengerId: booking.passengerId
    });
    throw new ValidationError('This booking is already cancelled');
  }

  console.log('Cancelling booking:', {
    bookingId: booking.id,
    currentStatus: booking.status,
    passengerId: booking.passengerId,
    rideId: booking.rideId
  });

  // Check if cancellation is within 2 hours of departure
  const ride = booking.ride;
  const now = new Date();
  const departureTime = new Date(ride.departureTime);
  const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntilDeparture <= 2;

  // Update booking and increment available seats in a transaction
  const result = await withTransaction(async (t) => {
    // Update booking status
    booking.status = 'cancelled';
    booking.isLateCancellation = isLateCancellation;
    await booking.save({ transaction: t });

    // Check if there's a payment for this booking and refund it
    const db = require('../models');
    const ridePayment = await db.RidePayment.findOne({
      where: { bookingId: booking.id },
      transaction: t
    });

    if (ridePayment && (ridePayment.status === 'held' || ridePayment.status === 'pending')) {
      // Refund the payment
      await paymentService.refundPayment(ridePayment.id, isLateCancellation ? 'Late cancellation' : 'Booking cancelled');
    }

    // Increment available seats
    await ride.increment('availableSeats', { by: 1, transaction: t });

    // Fetch the updated ride
    await ride.reload({ transaction: t });

    return { booking, ride, refunded: !!ridePayment };
  });

  // Broadcast cancellation via WebSocket
  const io = req.app.get('io');
  if (io) {
    // Fetch passenger info for notification
    const passenger = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });

    // Notify driver
    notifyDriverOfCancellation(io, ride.driver.id, {
      rideId: ride.id,
      bookingId: booking.id,
      passengerId: userId,
      passengerName: passenger?.name || 'Passenger'
    });

    // Broadcast seat update
    broadcastSeatChange(io, ride.id, result.ride.availableSeats);

    // Remove passenger from ride group chat room
    const { getUserSocket } = require('../socket');
    const passengerSocketId = getUserSocket(userId);
    if (passengerSocketId) {
      const passengerSocket = io.sockets.sockets.get(passengerSocketId);
      if (passengerSocket) {
        passengerSocket.leave(`ride_${ride.id}`);
        
        // Notify group chat that passenger left
        io.to(`ride_${ride.id}`).emit('passenger_left_chat', {
          rideId: ride.id,
          passengerId: userId,
          passengerName: passenger?.name || 'Passenger',
          timestamp: new Date()
        });
      }
    }

    // Send email notification to driver (async, don't wait)
    if (passenger) {
      const driverEmailPromise = sendBookingCancellationEmail(
        ride.driver.email,
        ride.driver.name,
        {
          source: ride.source,
          destination: ride.destination,
          departureTime: ride.departureTime,
          passengerName: passenger.name,
          isDriver: true
        }
      );

      if (driverEmailPromise && typeof driverEmailPromise.catch === 'function') {
        driverEmailPromise.catch(err => {
          logError(err, { context: 'Failed to send booking cancellation email to driver' });
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    message: result.refunded ? 'Booking cancelled and payment refunded successfully' : 'Booking cancelled successfully',
    data: {
      booking: result.booking,
      isLateCancellation,
      refunded: result.refunded
    }
  });
});

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Fetch the booking with ride and passenger information
  const booking = await Booking.findByPk(id, {
    include: [
      {
        model: Ride,
        as: 'ride',
        include: [{
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
        }]
      },
      {
        model: User,
        as: 'passenger',
        attributes: ['id', 'name', 'email', 'college', 'phone']
      }
    ]
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Verify user is the passenger or driver
  if (booking.passengerId !== userId && booking.ride.driverId !== userId) {
    throw new AuthorizationError('You can only view your own bookings');
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * Get all bookings for a user
 * GET /api/users/:id/bookings
 */
const getUserBookings = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify user is requesting their own bookings or is admin
  if (req.user.id !== id) {
    throw new AuthorizationError('You can only view your own bookings');
  }

  // Fetch all bookings for the user
  const bookings = await Booking.findAll({
    where: { passengerId: id },
    include: [
      {
        model: Ride,
        as: 'ride',
        include: [{
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
        }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: bookings,
    count: bookings.length
  });
});

/**
 * Cancel a pending booking (for when user abandons payment)
 * POST /api/bookings/:id/cancel-pending
 */
const cancelPendingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Fetch the booking with ride information
  const booking = await Booking.findByPk(id, {
    include: [{
      model: Ride,
      as: 'ride'
    }]
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Verify user is the passenger
  if (booking.passengerId !== userId) {
    throw new AuthorizationError('Only the passenger can cancel this booking');
  }

  // Only allow cancelling pending bookings
  if (booking.status !== 'pending') {
    throw new ValidationError('Only pending bookings can be cancelled this way');
  }

  // Cancel booking and release seat
  const result = await withTransaction(async (t) => {
    // Update booking status
    await booking.update({ status: 'cancelled' }, { transaction: t });

    // Increment available seats
    await booking.ride.increment('availableSeats', { by: 1, transaction: t });

    // Fetch the updated ride
    await booking.ride.reload({ transaction: t });

    return { booking, ride: booking.ride };
  });

  // Broadcast seat update
  const io = req.app.get('io');
  if (io) {
    broadcastSeatChange(io, booking.rideId, result.ride.availableSeats);
  }

  res.status(200).json({
    success: true,
    message: 'Pending booking cancelled successfully',
    data: {
      booking: result.booking,
      availableSeats: result.ride.availableSeats
    }
  });
});

module.exports = {
  createBooking,
  getBookingById,
  cancelBooking,
  cancelPendingBooking,
  getUserBookings
};
