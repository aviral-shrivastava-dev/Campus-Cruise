const db = require('../models');
const { Op } = require('sequelize');
const { withTransaction } = require('../utils/transaction');
const { logInfo } = require('../utils/logger');

const PAYMENT_TIMEOUT_MINUTES = 15; // 15 minutes to complete payment

class BookingService {
  /**
   * Auto-cancel bookings that haven't been paid within the timeout period
   */
  async cancelUnpaidBookings() {
    const timeoutDate = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

    return await withTransaction(async (transaction) => {
      // Find all pending bookings older than timeout
      const unpaidBookings = await db.Booking.findAll({
        where: {
          status: 'pending',
          createdAt: {
            [Op.lt]: timeoutDate
          }
        },
        include: [
          {
            model: db.Ride,
            as: 'ride',
            where: {
              status: 'active' // Only cancel bookings for active rides
            }
          }
        ],
        transaction
      });

      if (unpaidBookings.length === 0) {
        return { cancelledCount: 0, bookings: [] };
      }

      const cancelledBookings = [];

      for (const booking of unpaidBookings) {
        // Cancel the booking
        await booking.update({
          status: 'cancelled',
          isLateCancellation: false
        }, { transaction });

        // Release the seat back to the ride
        await booking.ride.increment('availableSeats', { by: 1, transaction });

        cancelledBookings.push({
          bookingId: booking.id,
          rideId: booking.rideId,
          passengerId: booking.passengerId
        });

        logInfo(`Auto-cancelled unpaid booking ${booking.id} after ${PAYMENT_TIMEOUT_MINUTES} minutes`);
      }

      return {
        cancelledCount: cancelledBookings.length,
        bookings: cancelledBookings
      };
    });
  }

  /**
   * Check if a user has any unpaid bookings
   */
  async hasUnpaidBookings(userId) {
    const unpaidBooking = await db.Booking.findOne({
      where: {
        passengerId: userId,
        status: 'pending'
      },
      include: [{
        model: db.Ride,
        as: 'ride',
        where: {
          status: 'active'
        }
      }]
    });

    return !!unpaidBooking;
  }

  /**
   * Get unpaid bookings for a user
   */
  async getUnpaidBookings(userId) {
    return await db.Booking.findAll({
      where: {
        passengerId: userId,
        status: 'pending'
      },
      include: [{
        model: db.Ride,
        as: 'ride',
        where: {
          status: 'active'
        },
        include: [{
          model: db.User,
          as: 'driver',
          attributes: ['id', 'name', 'email']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new BookingService();
