const jwt = require('jsonwebtoken');
const db = require('../models');
const { deliverQueuedNotifications } = require('./notifications');
const { registerLocationEvents } = require('./locationEvents');
const { logError, logWarning, logInfo } = require('../utils/logger');

const { User } = db;

// Store connected users: userId -> socketId
const connectedUsers = new Map();

// Store user disconnection timeouts for 30-second grace period
const disconnectionTimeouts = new Map();

/**
 * Initialize Socket.io server with authentication and event handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  // Middleware for JWT authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logWarning('WebSocket authentication failed: No token provided', {
          socketId: socket.id
        });
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      logError(error, {
        context: 'WebSocket authentication failed',
        socketId: socket.id
      });
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    logInfo(`User connected: ${socket.userId}`, { socketId: socket.id });

    try {
      // Clear any pending disconnection timeout
      if (disconnectionTimeouts.has(socket.userId)) {
        clearTimeout(disconnectionTimeouts.get(socket.userId));
        disconnectionTimeouts.delete(socket.userId);
      }

      // Store connected user
      connectedUsers.set(socket.userId, socket.id);

      // Update user online status
      await User.update(
        { isOnline: true, lastSeen: new Date() },
        { where: { id: socket.userId } }
      );

      // Broadcast user online status to relevant users
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'online',
        timestamp: new Date()
      });

      // Send authenticated confirmation
      socket.emit('authenticated', {
        userId: socket.userId,
        message: 'Successfully authenticated'
      });

      // Deliver any queued notifications
      try {
        deliverQueuedNotifications(io, socket.userId);
      } catch (error) {
        logError(error, {
          context: 'Failed to deliver queued notifications',
          userId: socket.userId
        });
      }

      // Register location event handlers
      try {
        registerLocationEvents(socket, io);
      } catch (error) {
        logError(error, {
          context: 'Failed to register location events',
          userId: socket.userId
        });
      }

      // Handle joining ride rooms
      socket.on('join_ride', (rideId) => {
        try {
          socket.join(`ride_${rideId}`);
          logInfo(`User joined ride room`, { userId: socket.userId, rideId });
        } catch (error) {
          logError(error, {
            context: 'Failed to join ride room',
            userId: socket.userId,
            rideId
          });
          socket.emit('error', {
            message: 'Failed to join ride room',
            code: 'JOIN_RIDE_ERROR'
          });
        }
      });

      // Handle leaving ride rooms
      socket.on('leave_ride', (rideId) => {
        try {
          socket.leave(`ride_${rideId}`);
          logInfo(`User left ride room`, { userId: socket.userId, rideId });
        } catch (error) {
          logError(error, {
            context: 'Failed to leave ride room',
            userId: socket.userId,
            rideId
          });
        }
      });

      // Handle typing indicators for direct messages
      socket.on('typing_start', (data) => {
        try {
          const { recipientId, conversationType, rideId } = data;
          
          if (conversationType === 'direct' && recipientId) {
            // Send typing indicator to specific recipient
            const recipientSocketId = getUserSocket(recipientId);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('typing_indicator', {
                userId: socket.userId,
                isTyping: true,
                conversationType: 'direct',
                timestamp: new Date()
              });
            }
          } else if (conversationType === 'group' && rideId) {
            // Broadcast typing indicator to ride group chat
            socket.to(`ride_${rideId}`).emit('typing_indicator', {
              userId: socket.userId,
              isTyping: true,
              conversationType: 'group',
              rideId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          logError(error, {
            context: 'Failed to handle typing_start event',
            userId: socket.userId
          });
        }
      });

      socket.on('typing_stop', (data) => {
        try {
          const { recipientId, conversationType, rideId } = data;
          
          if (conversationType === 'direct' && recipientId) {
            // Send typing stopped to specific recipient
            const recipientSocketId = getUserSocket(recipientId);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('typing_indicator', {
                userId: socket.userId,
                isTyping: false,
                conversationType: 'direct',
                timestamp: new Date()
              });
            }
          } else if (conversationType === 'group' && rideId) {
            // Broadcast typing stopped to ride group chat
            socket.to(`ride_${rideId}`).emit('typing_indicator', {
              userId: socket.userId,
              isTyping: false,
              conversationType: 'group',
              rideId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          logError(error, {
            context: 'Failed to handle typing_stop event',
            userId: socket.userId
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logInfo(`User disconnecting`, { 
          userId: socket.userId, 
          socketId: socket.id,
          reason 
        });

        // Set 30-second grace period before marking offline
        const timeout = setTimeout(async () => {
          try {
            // Check if user hasn't reconnected
            if (connectedUsers.get(socket.userId) === socket.id) {
              connectedUsers.delete(socket.userId);

              // Update user offline status
              await User.update(
                { isOnline: false, lastSeen: new Date() },
                { where: { id: socket.userId } }
              );

              // Broadcast user offline status
              io.emit('user_status', {
                userId: socket.userId,
                status: 'offline',
                timestamp: new Date()
              });

              logInfo(`User marked as offline after grace period`, { userId: socket.userId });
            }
          } catch (error) {
            logError(error, {
              context: 'Failed to update user offline status',
              userId: socket.userId
            });
          } finally {
            disconnectionTimeouts.delete(socket.userId);
          }
        }, 30000); // 30-second grace period

        disconnectionTimeouts.set(socket.userId, timeout);
      });

      // Handle socket errors
      socket.on('error', (error) => {
        logError(error, {
          context: 'Socket error',
          userId: socket.userId,
          socketId: socket.id
        });
        
        // Attempt to recover by sending error to client
        try {
          socket.emit('error', {
            message: 'An error occurred',
            code: 'SOCKET_ERROR',
            timestamp: new Date()
          });
        } catch (emitError) {
          logError(emitError, {
            context: 'Failed to emit error to client',
            userId: socket.userId
          });
        }
      });

    } catch (error) {
      logError(error, {
        context: 'Error in connection handler',
        userId: socket.userId,
        socketId: socket.id
      });
      
      // Attempt to notify client before disconnecting
      try {
        socket.emit('error', {
          message: 'Connection initialization failed',
          code: 'CONNECTION_ERROR'
        });
      } catch (emitError) {
        logError(emitError, {
          context: 'Failed to emit connection error',
          userId: socket.userId
        });
      }
      
      socket.disconnect();
    }
  });

  // Handle global Socket.io errors
  io.engine.on('connection_error', (error) => {
    logError(error, {
      context: 'Socket.io connection error',
      code: error.code,
      message: error.message
    });
  });

  return io;
};

/**
 * Get socket ID for a connected user
 * @param {string} userId - User ID
 * @returns {string|null} Socket ID or null if not connected
 */
const getUserSocket = (userId) => {
  return connectedUsers.get(userId) || null;
};

/**
 * Check if user is currently connected
 * @param {string} userId - User ID
 * @returns {boolean} True if user is connected
 */
const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

/**
 * Get all connected user IDs
 * @returns {Array<string>} Array of connected user IDs
 */
const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

module.exports = {
  initializeSocket,
  getUserSocket,
  isUserConnected,
  getConnectedUsers
};
