const { validationResult } = require('express-validator');
const { User, Ride, Booking } = require('../models');
const { Op } = require('sequelize');

/**
 * Get user profile by ID
 * GET /api/users/:id
 */
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user profile',
        code: 'PROFILE_FETCH_ERROR'
      }
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
const updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const { name, email, college, phone, vehicleMake, vehicleModel, vehicleColor, licensePlate } = req.body;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Check authorization - users can only update their own profile
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only update your own profile',
          code: 'UNAUTHORIZED_UPDATE'
        }
      });
    }

    // If email is being changed, check for duplicates
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Email already in use',
            code: 'EMAIL_DUPLICATE'
          }
        });
      }
    }

    // Update user fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (college !== undefined) updateData.college = college;
    if (phone !== undefined) updateData.phone = phone;
    if (vehicleMake !== undefined) updateData.vehicleMake = vehicleMake;
    if (vehicleModel !== undefined) updateData.vehicleModel = vehicleModel;
    if (vehicleColor !== undefined) updateData.vehicleColor = vehicleColor;
    if (licensePlate !== undefined) updateData.licensePlate = licensePlate;

    await user.update(updateData);

    // Fetch updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update user profile',
        code: 'PROFILE_UPDATE_ERROR'
      }
    });
  }
};

/**
 * Get rides offered by a user (as driver)
 * GET /api/users/:id/rides
 */
const getUserRides = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Get rides where user is the driver
    const rides = await Ride.findAll({
      where: {
        driverId: id,
        status: {
          [Op.in]: ['active', 'scheduled']
        }
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
        },
        {
          model: Booking,
          as: 'bookings',
          where: { status: 'confirmed' },
          required: false,
          include: [
            {
              model: User,
              as: 'passenger',
              attributes: ['id', 'name', 'email', 'college', 'phone']
            }
          ]
        }
      ],
      order: [['departureTime', 'ASC']]
    });

    res.json({
      success: true,
      data: rides,
      count: rides.length
    });
  } catch (error) {
    console.error('Error fetching user rides:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user rides',
        code: 'RIDES_FETCH_ERROR'
      }
    });
  }
};

/**
 * Get ride history for a user
 * GET /api/users/:id/history
 */
const getRideHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.departureTime = {};
      if (startDate) {
        dateFilter.departureTime[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.departureTime[Op.lte] = new Date(endDate);
      }
    }

    // Get rides where user was the driver
    const ridesAsDriver = await Ride.findAll({
      where: {
        driverId: id,
        ...dateFilter
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Booking,
          as: 'bookings',
          include: [
            {
              model: User,
              as: 'passenger',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ],
      order: [['departureTime', 'DESC']]
    });

    // Get bookings where user was a passenger
    const bookingsAsPassenger = await Booking.findAll({
      where: {
        passengerId: id
      },
      include: [
        {
          model: Ride,
          as: 'ride',
          where: dateFilter,
          include: [
            {
              model: User,
              as: 'driver',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    // Format rides as driver
    const driverHistory = ridesAsDriver.map(ride => ({
      id: ride.id,
      role: 'driver',
      source: ride.source,
      destination: ride.destination,
      departureTime: ride.departureTime,
      status: ride.status,
      totalSeats: ride.totalSeats,
      availableSeats: ride.availableSeats,
      driver: ride.driver,
      passengers: ride.bookings.map(b => b.passenger),
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt
    }));

    // Format rides as passenger
    const passengerHistory = bookingsAsPassenger.map(booking => ({
      id: booking.ride.id,
      bookingId: booking.id,
      role: 'passenger',
      source: booking.ride.source,
      destination: booking.ride.destination,
      departureTime: booking.ride.departureTime,
      status: booking.ride.status,
      bookingStatus: booking.status,
      isLateCancellation: booking.isLateCancellation,
      totalSeats: booking.ride.totalSeats,
      availableSeats: booking.ride.availableSeats,
      driver: booking.ride.driver,
      createdAt: booking.ride.createdAt,
      updatedAt: booking.ride.updatedAt
    }));

    // Combine and sort by departure time descending
    const allHistory = [...driverHistory, ...passengerHistory].sort((a, b) => {
      return new Date(b.departureTime) - new Date(a.departureTime);
    });

    res.json({
      success: true,
      data: {
        history: allHistory,
        count: allHistory.length
      }
    });
  } catch (error) {
    console.error('Error fetching ride history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch ride history',
        code: 'HISTORY_FETCH_ERROR'
      }
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserRides,
  getRideHistory
};
