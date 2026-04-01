const { Message, User, Ride, Booking } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { getFirebaseDatabase } = require('../config/firebase');
const { isUserConnected, getUserSocket } = require('../socket');

/**
 * Send a direct message
 * POST /api/messages
 */
const sendMessage = async (req, res) => {
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

    const { recipientId, rideId, content, messageType } = req.body;
    const senderId = req.user.id;

    // Validate message type
    if (!['direct', 'group'].includes(messageType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE_TYPE',
          message: 'Message type must be either "direct" or "group"',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate direct message has recipientId
    if (messageType === 'direct' && !recipientId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RECIPIENT',
          message: 'Direct messages must have a recipientId',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validate group message has rideId
    if (messageType === 'group' && !rideId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RIDE',
          message: 'Group messages must have a rideId',
          timestamp: new Date().toISOString()
        }
      });
    }

    // For group messages, verify user is part of the ride
    if (messageType === 'group') {
      const ride = await Ride.findByPk(rideId, {
        include: [{
          model: Booking,
          as: 'bookings',
          where: { status: 'confirmed' },
          required: false
        }]
      });

      if (!ride) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RIDE_NOT_FOUND',
            message: 'Ride not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Check if user is driver or a passenger
      const isDriver = ride.driverId === senderId;
      const isPassenger = ride.bookings.some(b => b.passengerId === senderId);

      if (!isDriver && !isPassenger) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You must be part of this ride to send group messages',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Create message in MySQL
    const message = await Message.create({
      senderId,
      recipientId: messageType === 'direct' ? recipientId : null,
      rideId: messageType === 'group' ? rideId : null,
      content,
      messageType,
      isRead: false
    });

    // Fetch complete message with sender info
    const completeMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Store message in Firebase for redundancy
    try {
      const firebaseDb = getFirebaseDatabase();
      if (firebaseDb) {
        await firebaseDb.ref(`messages/${message.id}`).set({
          senderId,
          recipientId: messageType === 'direct' ? recipientId : null,
          rideId: messageType === 'group' ? rideId : null,
          content,
          messageType,
          timestamp: Date.now()
        });
      }
    } catch (firebaseError) {
      console.error('Firebase storage error:', firebaseError);
      // Continue even if Firebase fails - MySQL is primary storage
    }

    // Deliver via WebSocket if recipient(s) are online
    const io = req.app.get('io');
    if (io) {
      if (messageType === 'direct') {
        // Check if recipient is online
        if (isUserConnected(recipientId)) {
          const recipientSocketId = getUserSocket(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message_received', {
              message: completeMessage,
              timestamp: new Date()
            });
          }
        }
      } else if (messageType === 'group') {
        // Broadcast to all members in the ride room
        io.to(`ride_${rideId}`).emit('message_received', {
          message: completeMessage,
          timestamp: new Date()
        });
      }
    }

    res.status(201).json({
      success: true,
      data: completeMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);

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
        message: 'Failed to send message',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Get conversation between two users
 * GET /api/messages/conversation/:userId
 */
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Fetch all messages between the two users
    const messages = await Message.findAll({
      where: {
        messageType: 'direct',
        [Op.or]: [
          { senderId: currentUserId, recipientId: userId },
          { senderId: userId, recipientId: currentUserId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'isOnline']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email', 'isOnline']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch conversation',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Get group chat messages for a ride
 * GET /api/messages/ride/:rideId
 */
const getRideMessages = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    // Verify user is part of the ride
    const ride = await Ride.findByPk(rideId, {
      include: [{
        model: Booking,
        as: 'bookings',
        where: { status: 'confirmed' },
        required: false
      }]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RIDE_NOT_FOUND',
          message: 'Ride not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if user is driver or a passenger
    const isDriver = ride.driverId === userId;
    const isPassenger = ride.bookings.some(b => b.passengerId === userId);

    if (!isDriver && !isPassenger) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You must be part of this ride to view group messages',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Fetch all group messages for the ride
    const messages = await Message.findAll({
      where: {
        rideId,
        messageType: 'group'
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'isOnline']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching ride messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch ride messages',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Mark messages as read
 * PUT /api/messages/read
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationUserId, rideId } = req.body;
    const currentUserId = req.user.id;

    let updateCount = 0;

    if (conversationUserId) {
      // Mark direct messages as read
      const [count] = await Message.update(
        { isRead: true },
        {
          where: {
            messageType: 'direct',
            senderId: conversationUserId,
            recipientId: currentUserId,
            isRead: false
          }
        }
      );
      updateCount = count;
    } else if (rideId) {
      // Mark group messages as read
      const [count] = await Message.update(
        { isRead: true },
        {
          where: {
            messageType: 'group',
            rideId,
            senderId: { [Op.ne]: currentUserId },
            isRead: false
          }
        }
      );
      updateCount = count;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Either conversationUserId or rideId must be provided',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        updatedCount: updateCount
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark messages as read',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getRideMessages,
  markMessagesAsRead
};
