const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { messageValidation } = require('../middleware/validators');
const { handleValidationErrors } = require('../middleware/validation');
const {
  sendMessage,
  getConversation,
  getRideMessages,
  markMessagesAsRead
} = require('../controllers/message.controller');

// All message routes require authentication
router.use(authenticate);

// POST /api/messages - Send a message
router.post('/', messageValidation, handleValidationErrors, sendMessage);

// GET /api/messages/conversation/:userId - Get conversation with a user
router.get('/conversation/:userId', getConversation);

// GET /api/messages/ride/:rideId - Get group chat messages for a ride
router.get('/ride/:rideId', getRideMessages);

// PUT /api/messages/read - Mark messages as read
router.put('/read', markMessagesAsRead);

module.exports = router;
