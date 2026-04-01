const { Review, Ride, Booking, User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Create a new review
 * POST /api/reviews
 */
const createReview = async (req, res) => {
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

    const { rideId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    // Fetch the ride with driver information
    const ride = await Ride.findByPk(rideId, {
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email']
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

    const driverId = ride.driverId;

    // Verify user was a passenger on this ride
    const booking = await Booking.findOne({
      where: {
        rideId,
        passengerId: reviewerId,
        status: 'confirmed'
      }
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only review rides you were a passenger on',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({
      where: {
        rideId,
        reviewerId
      }
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REVIEW',
          message: 'You have already reviewed this ride',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Create the review
    const review = await Review.create({
      rideId,
      reviewerId,
      driverId,
      rating,
      comment: comment || null
    });

    // Fetch the complete review with associations
    const completeReview = await Review.findByPk(review.id, {
      include: [
        {
          model: Ride,
          as: 'ride',
          attributes: ['id', 'source', 'destination', 'departureTime']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'college']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeReview
    });
  } catch (error) {
    console.error('Error creating review:', error);

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

    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REVIEW',
          message: 'You have already reviewed this ride',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create review',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Get all reviews for a driver
 * GET /api/reviews/driver/:driverId
 */
const getDriverReviews = async (req, res) => {
  try {
    const { driverId } = req.params;

    // Verify driver exists
    const driver = await User.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Driver not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Fetch all reviews for the driver
    const reviews = await Review.findAll({
      where: { driverId },
      include: [
        {
          model: Ride,
          as: 'ride',
          attributes: ['id', 'source', 'destination', 'departureTime']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'college']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    res.status(200).json({
      success: true,
      data: {
        driverId,
        driverName: driver.name,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching driver reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reviews',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  createReview,
  getDriverReviews
};
