const { updateLocation } = require('../services/location.service');

/**
 * Handle location update from driver
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.io server instance
 * @param {object} data - Location data
 */
const handleLocationUpdate = async (socket, io, data) => {
  try {
    const { rideId, latitude, longitude } = data;

    if (!rideId || latitude === undefined || longitude === undefined) {
      socket.emit('error', { message: 'Invalid location data' });
      return;
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      socket.emit('error', { message: 'Invalid coordinates' });
      return;
    }

    // Update location in Firebase and broadcast
    await updateLocation(rideId, latitude, longitude, io);

    // Confirm to sender
    socket.emit('location_updated', {
      rideId,
      latitude,
      longitude,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling location update:', error);
    socket.emit('error', { message: 'Failed to update location' });
  }
};

/**
 * Register location-related socket event handlers
 * @param {Socket} socket - Socket instance
 * @param {Server} io - Socket.io server instance
 */
const registerLocationEvents = (socket, io) => {
  // Handle location updates from driver
  socket.on('update_location', (data) => {
    handleLocationUpdate(socket, io, data);
  });
};

module.exports = {
  registerLocationEvents,
  handleLocationUpdate
};
