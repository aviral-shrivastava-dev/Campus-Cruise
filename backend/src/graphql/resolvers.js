const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const db = require('../models');

const { User, Ride, Booking, Review } = db;

const resolvers = {
  Query: {
    // Get current authenticated user
    me: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });
    },

    // Get user by ID
    user: async (_, { id }) => {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      if (!user) {
        throw new UserInputError('User not found');
      }
      return user;
    },

    // Get rides with optional filters
    rides: async (_, { source, destination, date }) => {
      const where = {
        status: 'active',
        availableSeats: { [db.Sequelize.Op.gt]: 0 },
        departureTime: { [db.Sequelize.Op.gt]: new Date() }
      };

      if (source) {
        where.source = source;
      }
      if (destination) {
        where.destination = destination;
      }
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        where.departureTime = {
          [db.Sequelize.Op.between]: [startOfDay, endOfDay]
        };
      }

      return await Ride.findAll({
        where,
        include: [
          {
            model: User,
            as: 'driver',
            attributes: { exclude: ['password'] }
          }
        ],
        order: [['departureTime', 'ASC']]
      });
    },

    // Get ride by ID
    ride: async (_, { id }) => {
      const ride = await Ride.findByPk(id, {
        include: [
          {
            model: User,
            as: 'driver',
            attributes: { exclude: ['password'] }
          },
          {
            model: Booking,
            as: 'bookings',
            include: [
              {
                model: User,
                as: 'passenger',
                attributes: { exclude: ['password'] }
              }
            ]
          }
        ]
      });
      if (!ride) {
        throw new UserInputError('Ride not found');
      }
      return ride;
    },

    // Get booking by ID
    booking: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: Ride,
            as: 'ride',
            include: [
              {
                model: User,
                as: 'driver',
                attributes: { exclude: ['password'] }
              }
            ]
          },
          {
            model: User,
            as: 'passenger',
            attributes: { exclude: ['password'] }
          }
        ]
      });
      if (!booking) {
        throw new UserInputError('Booking not found');
      }
      return booking;
    },

    // Get current user's bookings
    myBookings: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      return await Booking.findAll({
        where: { passengerId: user.id },
        include: [
          {
            model: Ride,
            as: 'ride',
            include: [
              {
                model: User,
                as: 'driver',
                attributes: { exclude: ['password'] }
              }
            ]
          },
          {
            model: User,
            as: 'passenger',
            attributes: { exclude: ['password'] }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    },

    // Get reviews for a driver
    driverReviews: async (_, { driverId }) => {
      return await Review.findAll({
        where: { driverId },
        include: [
          {
            model: Ride,
            as: 'ride'
          },
          {
            model: User,
            as: 'reviewer',
            attributes: { exclude: ['password'] }
          },
          {
            model: User,
            as: 'driver',
            attributes: { exclude: ['password'] }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }
  },

  Mutation: {
    // Register new user
    register: async (_, { input }) => {
      const { name, email, password, college, phone, role, vehicleInfo } = input;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new UserInputError('Email already registered');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        college,
        phone,
        role,
        vehicleMake: vehicleInfo?.make,
        vehicleModel: vehicleInfo?.model,
        vehicleColor: vehicleInfo?.color,
        licensePlate: vehicleInfo?.licensePlate
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return user without password
      const userWithoutPassword = user.toJSON();
      delete userWithoutPassword.password;

      return {
        token,
        user: userWithoutPassword
      };
    },

    // Login user
    login: async (_, { email, password }) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Update online status
      await user.update({
        isOnline: true,
        lastSeen: new Date()
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return user without password
      const userWithoutPassword = user.toJSON();
      delete userWithoutPassword.password;

      return {
        token,
        user: userWithoutPassword
      };
    },

    // Update user profile
    updateProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const userRecord = await User.findByPk(user.id);
      if (!userRecord) {
        throw new UserInputError('User not found');
      }

      const updateData = {};
      if (input.name) updateData.name = input.name;
      if (input.college) updateData.college = input.college;
      if (input.phone) updateData.phone = input.phone;
      if (input.vehicleInfo) {
        if (input.vehicleInfo.make) updateData.vehicleMake = input.vehicleInfo.make;
        if (input.vehicleInfo.model) updateData.vehicleModel = input.vehicleInfo.model;
        if (input.vehicleInfo.color) updateData.vehicleColor = input.vehicleInfo.color;
        if (input.vehicleInfo.licensePlate) updateData.licensePlate = input.vehicleInfo.licensePlate;
      }

      await userRecord.update(updateData);

      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });

      return updatedUser;
    },

    // Create ride
    createRide: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { source, destination, departureTime, availableSeats } = input;

      // Validate departure time is in the future
      if (new Date(departureTime) <= new Date()) {
        throw new UserInputError('Departure time must be in the future');
      }

      // Validate available seats
      if (availableSeats <= 0) {
        throw new UserInputError('Available seats must be a positive integer');
      }

      const ride = await Ride.create({
        driverId: user.id,
        source,
        destination,
        departureTime,
        availableSeats,
        totalSeats: availableSeats,
        status: 'active'
      });

      return await Ride.findByPk(ride.id, {
        include: [
          {
            model: User,
            as: 'driver',
            attributes: { exclude: ['password'] }
          }
        ]
      });
    },

    // Cancel ride
    cancelRide: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const ride = await Ride.findByPk(id);
      if (!ride) {
        throw new UserInputError('Ride not found');
      }

      if (ride.driverId !== user.id) {
        throw new AuthenticationError('Not authorized to cancel this ride');
      }

      await ride.update({ status: 'cancelled' });

      return await Ride.findByPk(id, {
        include: [
          {
            model: User,
            as: 'driver',
            attributes: { exclude: ['password'] }
          }
        ]
      });
    },

    // Book ride
    bookRide: async (_, { rideId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        throw new UserInputError('Ride not found');
      }

      if (ride.availableSeats <= 0) {
        throw new UserInputError('No available seats');
      }

      // Check for duplicate booking
      const existingBooking = await Booking.findOne({
        where: { rideId, passengerId: user.id }
      });
      if (existingBooking) {
        throw new UserInputError('Already booked this ride');
      }

      // Create booking and decrement seats
      const booking = await Booking.create({
        rideId,
        passengerId: user.id,
        status: 'confirmed'
      });

      await ride.update({
        availableSeats: ride.availableSeats - 1
      });

      return await Booking.findByPk(booking.id, {
        include: [
          {
            model: Ride,
            as: 'ride',
            include: [
              {
                model: User,
                as: 'driver',
                attributes: { exclude: ['password'] }
              }
            ]
          },
          {
            model: User,
            as: 'passenger',
            attributes: { exclude: ['password'] }
          }
        ]
      });
    },

    // Cancel booking
    cancelBooking: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const booking = await Booking.findByPk(id, {
        include: [{ model: Ride, as: 'ride' }]
      });

      if (!booking) {
        throw new UserInputError('Booking not found');
      }

      if (booking.passengerId !== user.id) {
        throw new AuthenticationError('Not authorized to cancel this booking');
      }

      // Check if late cancellation
      const timeDiff = new Date(booking.ride.departureTime) - new Date();
      const isLateCancellation = timeDiff < 2 * 60 * 60 * 1000; // 2 hours

      await booking.update({
        status: 'cancelled',
        isLateCancellation
      });

      // Increment available seats
      await booking.ride.update({
        availableSeats: booking.ride.availableSeats + 1
      });

      return await Booking.findByPk(id, {
        include: [
          {
            model: Ride,
            as: 'ride',
            include: [
              {
                model: User,
                as: 'driver',
                attributes: { exclude: ['password'] }
              }
            ]
          },
          {
            model: User,
            as: 'passenger',
            attributes: { exclude: ['password'] }
          }
        ]
      });
    },

    // Create review
    createReview: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { rideId, driverId, rating, comment } = input;

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new UserInputError('Rating must be between 1 and 5');
      }

      // Check if user was a passenger on this ride
      const booking = await Booking.findOne({
        where: { rideId, passengerId: user.id }
      });
      if (!booking) {
        throw new UserInputError('You must be a passenger on this ride to review');
      }

      // Check for duplicate review
      const existingReview = await Review.findOne({
        where: { rideId, reviewerId: user.id }
      });
      if (existingReview) {
        throw new UserInputError('You have already reviewed this ride');
      }

      const review = await Review.create({
        rideId,
        reviewerId: user.id,
        driverId,
        rating,
        comment
      });

      return await Review.findByPk(review.id, {
        include: [
          {
            model: Ride,
            as: 'ride'
          },
          {
            model: User,
            as: 'reviewer',
            attributes: { exclude: ['password'] }
          },
          {
            model: User,
            as: 'driver',
            attributes: { exclude: ['password'] }
          }
        ]
      });
    }
  },

  User: {
    vehicleInfo: (user) => {
      if (!user.vehicleMake && !user.vehicleModel && !user.vehicleColor && !user.licensePlate) {
        return null;
      }
      return {
        make: user.vehicleMake,
        model: user.vehicleModel,
        color: user.vehicleColor,
        licensePlate: user.licensePlate
      };
    },
    averageRating: async (user) => {
      const reviews = await Review.findAll({
        where: { driverId: user.id }
      });
      if (reviews.length === 0) return null;
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      return sum / reviews.length;
    }
  }
};

module.exports = resolvers;
