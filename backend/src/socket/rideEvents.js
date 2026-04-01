/**
 * Ride-related WebSocket event handlers and broadcasters
 */

/**
 * Broadcast new ride creation to all connected users
 * @param {Server} io - Socket.io server instance
 * @param {Object} ride - Created ride object
 */
const broadcastNewRide = (io, ride) => {
  io.emit('ride_created', {
    ride,
    timestamp: new Date()
  });
  console.log(`Broadcasted new ride: ${ride.id}`);
};

/**
 * Broadcast ride update to all users in ride room
 * @param {Server} io - Socket.io server instance
 * @param {string} rideId - Ride ID
 * @param {Object} updates - Updated ride data
 */
const broadcastRideUpdate = (io, rideId, updates) => {
  io.to(`ride_${rideId}`).emit('ride_updated', {
    rideId,
    updates,
    timestamp: new Date()
  });
  
  // Also broadcast to general audience for ride list updates
  io.emit('ride_updated', {
    rideId,
    updates,
    timestamp: new Date()
  });
  
  console.log(`Broadcasted ride update: ${rideId}`);
};

/**
 * Broadcast ride cancellation to all users
 * @param {Server} io - Socket.io server instance
 * @param {string} rideId - Ride ID
 * @param {Object} ride - Cancelled ride object
 */
const broadcastRideCancellation = (io, rideId, ride) => {
  // Notify users in ride room
  io.to(`ride_${rideId}`).emit('ride_cancelled', {
    rideId,
    ride,
    timestamp: new Date()
  });
  
  // Also broadcast to general audience
  io.emit('ride_cancelled', {
    rideId,
    ride,
    timestamp: new Date()
  });
  
  console.log(`Broadcasted ride cancellation: ${rideId}`);
};

/**
 * Broadcast seat availability change
 * @param {Server} io - Socket.io server instance
 * @param {string} rideId - Ride ID
 * @param {number} availableSeats - New available seats count
 */
const broadcastSeatChange = (io, rideId, availableSeats) => {
  io.to(`ride_${rideId}`).emit('seat_change', {
    rideId,
    availableSeats,
    timestamp: new Date()
  });
  
  // Also broadcast to general audience for ride list updates
  io.emit('seat_change', {
    rideId,
    availableSeats,
    timestamp: new Date()
  });
  
  console.log(`Broadcasted seat change for ride ${rideId}: ${availableSeats} seats`);
};

/**
 * Send initial state to newly connected user
 * @param {Socket} socket - Socket instance
 * @param {Object} state - Initial state data (rides, messages, etc.)
 */
const sendInitialState = (socket, state) => {
  socket.emit('initial_state', {
    ...state,
    timestamp: new Date()
  });
  console.log(`Sent initial state to user: ${socket.userId}`);
};

module.exports = {
  broadcastNewRide,
  broadcastRideUpdate,
  broadcastRideCancellation,
  broadcastSeatChange,
  sendInitialState
};
