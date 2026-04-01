const { getUserSocket, isUserConnected } = require('./index');

// Queue for offline user notifications
const offlineNotificationQueue = new Map();

/**
 * Send notification to a specific user
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {Object} notification - Notification data
 * @param {Function} getUserSocketFn - Function to get user socket
 * @param {Function} isUserConnectedFn - Function to check if user is connected
 */
const sendNotification = (io, userId, notification, getUserSocketFn, isUserConnectedFn) => {
  // If helper functions not provided, try to require them (for non-test usage)
  if (!getUserSocketFn || !isUserConnectedFn) {
    const socketHelpers = require('./index');
    getUserSocketFn = socketHelpers.getUserSocket;
    isUserConnectedFn = socketHelpers.isUserConnected;
  }
  
  const socketId = getUserSocketFn(userId);
  
  if (socketId && isUserConnectedFn(userId)) {
    // User is online, send immediately
    io.to(socketId).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
    console.log(`Sent notification to user ${userId}`);
  } else {
    // User is offline, queue notification
    queueNotification(userId, notification);
    console.log(`Queued notification for offline user ${userId}`);
  }
};

/**
 * Queue notification for offline user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
const queueNotification = (userId, notification) => {
  if (!offlineNotificationQueue.has(userId)) {
    offlineNotificationQueue.set(userId, []);
  }
  
  offlineNotificationQueue.get(userId).push({
    ...notification,
    queuedAt: new Date()
  });
};

/**
 * Deliver queued notifications to user upon connection
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - User ID
 * @param {Function} getUserSocketFn - Function to get user socket
 */
const deliverQueuedNotifications = (io, userId, getUserSocketFn) => {
  // If helper function not provided, try to require it (for non-test usage)
  if (!getUserSocketFn) {
    const socketHelpers = require('./index');
    getUserSocketFn = socketHelpers.getUserSocket;
  }
  
  const notifications = offlineNotificationQueue.get(userId);
  
  if (notifications && notifications.length > 0) {
    const socketId = getUserSocketFn(userId);
    
    if (socketId) {
      notifications.forEach(notification => {
        io.to(socketId).emit('notification', {
          ...notification,
          deliveredAt: new Date()
        });
      });
      
      console.log(`Delivered ${notifications.length} queued notifications to user ${userId}`);
      offlineNotificationQueue.delete(userId);
    }
  }
};

/**
 * Send booking notification to driver
 * @param {Server} io - Socket.io server instance
 * @param {string} driverId - Driver user ID
 * @param {Object} bookingData - Booking information
 */
const notifyDriverOfBooking = (io, driverId, bookingData) => {
  const notification = {
    type: 'booking_created',
    title: 'New Booking',
    message: `${bookingData.passengerName} has booked your ride`,
    data: {
      rideId: bookingData.rideId,
      bookingId: bookingData.bookingId,
      passengerId: bookingData.passengerId,
      passengerName: bookingData.passengerName
    }
  };
  
  sendNotification(io, driverId, notification);
};

/**
 * Send booking cancellation notification to driver
 * @param {Server} io - Socket.io server instance
 * @param {string} driverId - Driver user ID
 * @param {Object} cancellationData - Cancellation information
 */
const notifyDriverOfCancellation = (io, driverId, cancellationData) => {
  const notification = {
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `${cancellationData.passengerName} has cancelled their booking`,
    data: {
      rideId: cancellationData.rideId,
      bookingId: cancellationData.bookingId,
      passengerId: cancellationData.passengerId,
      passengerName: cancellationData.passengerName
    }
  };
  
  sendNotification(io, driverId, notification);
};

/**
 * Send ride cancellation notification to passenger
 * @param {Server} io - Socket.io server instance
 * @param {string} passengerId - Passenger user ID
 * @param {Object} rideData - Ride information
 */
const notifyPassengerOfRideCancellation = (io, passengerId, rideData) => {
  const notification = {
    type: 'ride_cancelled',
    title: 'Ride Cancelled',
    message: `Your ride from ${rideData.source} to ${rideData.destination} has been cancelled`,
    data: {
      rideId: rideData.rideId,
      driverName: rideData.driverName,
      source: rideData.source,
      destination: rideData.destination,
      departureTime: rideData.departureTime
    }
  };
  
  sendNotification(io, passengerId, notification);
};

/**
 * Send full capacity notification to driver
 * @param {Server} io - Socket.io server instance
 * @param {string} driverId - Driver user ID
 * @param {Object} rideData - Ride information
 */
const notifyDriverOfFullCapacity = (io, driverId, rideData) => {
  const notification = {
    type: 'ride_full',
    title: 'Ride Full',
    message: `Your ride from ${rideData.source} to ${rideData.destination} is now at full capacity`,
    data: {
      rideId: rideData.rideId,
      source: rideData.source,
      destination: rideData.destination,
      totalSeats: rideData.totalSeats
    }
  };
  
  sendNotification(io, driverId, notification);
};

/**
 * Send booking confirmation to passenger
 * @param {Server} io - Socket.io server instance
 * @param {string} passengerId - Passenger user ID
 * @param {Object} bookingData - Booking information
 */
const notifyPassengerOfBookingConfirmation = (io, passengerId, bookingData) => {
  const notification = {
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: `Your booking for the ride from ${bookingData.source} to ${bookingData.destination} is confirmed`,
    data: {
      rideId: bookingData.rideId,
      bookingId: bookingData.bookingId,
      driverName: bookingData.driverName,
      source: bookingData.source,
      destination: bookingData.destination,
      departureTime: bookingData.departureTime
    }
  };
  
  sendNotification(io, passengerId, notification);
};

module.exports = {
  sendNotification,
  queueNotification,
  deliverQueuedNotifications,
  notifyDriverOfBooking,
  notifyDriverOfCancellation,
  notifyPassengerOfRideCancellation,
  notifyDriverOfFullCapacity,
  notifyPassengerOfBookingConfirmation,
  offlineNotificationQueue
};
