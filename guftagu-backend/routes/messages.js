const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/messages/conversations - Get all conversations
router.get('/conversations', getConversations);

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', getUnreadCount);

// PUT /api/messages/read - Mark messages as read
router.put('/read', markAsRead);

// POST /api/messages/send - Send message
router.post('/send', sendMessage);

// GET /api/messages/:userId - Get messages with specific user
router.get('/:userId', getMessages);

module.exports = router;
