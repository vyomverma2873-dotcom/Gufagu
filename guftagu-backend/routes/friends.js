const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  sendFriendRequestById,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  unfriend,
  getFriends,
  getFriendRequests,
  searchUsers,
  checkFriendship,
} = require('../controllers/friendController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /api/friends/request - Send friend request by username
router.post('/request', sendFriendRequest);

// POST /api/friends/request-by-id - Send friend request by 7-digit ID
router.post('/request-by-id', sendFriendRequestById);

// POST /api/friends/accept - Accept friend request
router.post('/accept', acceptFriendRequest);

// POST /api/friends/reject - Reject friend request
router.post('/reject', rejectFriendRequest);

// DELETE /api/friends/cancel/:requestId - Cancel sent friend request
router.delete('/cancel/:requestId', cancelFriendRequest);

// DELETE /api/friends/:friendId - Unfriend
router.delete('/:friendId', unfriend);

// GET /api/friends - Get friends list
router.get('/', getFriends);

// GET /api/friends/requests - Get friend requests
router.get('/requests', getFriendRequests);

// GET /api/friends/search - Search users
router.get('/search', searchUsers);

// GET /api/friends/check/:userId - Check friendship status
router.get('/check/:userId', checkFriendship);

module.exports = router;
