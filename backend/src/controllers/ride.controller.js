const { Ride, User } = require('../models');
const { validationResult } = require('express-validator');
const { getSuggestedRides } = require('../services/rideMatching.service');
const { broadcastNewRide, broadcastRideCancellation } = require('../socket/rideEvents');
const { notifyPassengerOfRideCancellation } = require('../socket/notifications');
const { sendRideCancellationEmail } = require('../services/email.service');

/**
 * Create a new ride
 * POST /api/rides
 */
const createRide = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
          timestamp: new Date().toISOString()
        }
      });
    }

    const { source, destination, departureTime, availableSeats, totalSeats, pricePerSeat } = req.body;
    const driverId = req.user.id;

    // Verify user has driver role
    const user = await User.findByPk(driverId);
    if (!user || !user.role.includes('driver')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'User must have driver role to create rides',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate pricePerSeat
    const price = parseFloat(pricePerSeat);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRICE',
          message: 'Price per seat must be a valid positive number',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (price === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRICE',
          message: 'Price per seat must be greater than 0',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create the ride
    const ride = await Ride.create({
      driverId,
      source,
      destination,
      departureTime,
      availableSeats: availableSeats || totalSeats,
      totalSeats,
      pricePerSeat: price,
      status: 'active'
    });

    // Fetch the ride with driver information
    const createdRide = await Ride.findByPk(ride.id, {
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
      }]
    });

    // Broadcast new ride to all connected users via WebSocket
    const io = req.app.get('io');
    if (io) {
      broadcastNewRide(io, createdRide);
    }

    res.status(201).json({
      success: true,
      data: createdRide
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.errors.map(e => ({ field: e.path, message: e.message })),
          timestamp: new Date().toISOString()
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create ride',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Get all available rides with optional filters
 * GET /api/rides
 */
const getRides = async (req, res) => {
  try {
    const { source, destination, dateFrom, dateTo } = req.query;
    const { Op } = require('sequelize');

    // Build query conditions
    const whereConditions = {
      status: 'active',
      availableSeats: { [Op.gt]: 0 },
      departureTime: { [Op.gt]: new Date() }
    };

    // Add source filter if provided
    if (source) {
      whereConditions.source = { [Op.like]: `%${source}%` };
    }

    // Add destination filter if provided
    if (destination) {
      whereConditions.destination = { [Op.like]: `%${destination}%` };
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      const dateConditions = {};
      if (dateFrom) {
        dateConditions[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        dateConditions[Op.lte] = new Date(dateTo);
      }
      whereConditions.departureTime = dateConditions;
    }

    // Fetch rides with driver information
    const rides = await Ride.findAll({
      where: whereConditions,
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
      }],
      order: [['departureTime', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: rides,
      count: rides.length
    });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch rides',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Get ride by ID with driver info and bookings
 * GET /api/rides/:id
 */
const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findByPk(id, {
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
        },
        {
          model: require('../models').Booking,
          as: 'bookings',
          where: { status: 'confirmed' },
          required: false,
          include: [{
            model: User,
            as: 'passenger',
            attributes: ['id', 'name', 'email', 'college', 'phone']
          }]
        }
      ]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ride not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: ride
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch ride',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Cancel a ride
 * DELETE /api/rides/:id
 */
const cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ride = await Ride.findByPk(id, {
      include: [{
        model: require('../models').Booking,
        as: 'bookings',
        where: { status: 'confirmed' },
        required: false,
        include: [{
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email']
        }]
      }]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ride not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify user is the driver
    if (ride.driverId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the driver can cancel this ride',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Mark ride as cancelled
    ride.status = 'cancelled';
    await ride.save();

    // Fetch driver info for email
    const driver = await User.findByPk(userId, {
      attributes: ['id', 'name']
    });

    // Broadcast cancellation to all connected users via WebSocket
    const io = req.app.get('io');
    if (io) {
      broadcastRideCancellation(io, ride.id, ride);
      
      // Notify all passengers with confirmed bookings
      if (ride.bookings && ride.bookings.length > 0) {
        ride.bookings.forEach(booking => {
          // Send WebSocket notification
          notifyPassengerOfRideCancellation(io, booking.passengerId, {
            rideId: ride.id,
            driverName: driver?.name || 'Driver',
            source: ride.source,
            destination: ride.destination,
            departureTime: ride.departureTime
          });

          // Send email notification (async, don't wait)
          const emailPromise = sendRideCancellationEmail(
            booking.passenger.email,
            booking.passenger.name,
            {
              source: ride.source,
              destination: ride.destination,
              departureTime: ride.departureTime,
              reason: 'The driver has cancelled this ride'
            }
          );

          if (emailPromise && typeof emailPromise.catch === 'function') {
            emailPromise.catch(err => {
              console.error(`Failed to send ride cancellation email to passenger ${booking.passengerId}:`, err);
            });
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: ride
    });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to cancel ride',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  createRide,
  getRides,
  getRideById,
  cancelRide,
  getSuggestedRides
};
