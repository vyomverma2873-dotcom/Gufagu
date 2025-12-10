const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserByUsername,
  getUserById,
  getUserByObjectId,
  checkUsername,
  uploadProfilePicture,
  setUsername,
  reportUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// GET /api/user/profile - Get own profile
router.get('/profile', authenticateToken, getProfile);

// PUT /api/user/profile - Update own profile
router.put('/profile', authenticateToken, updateProfile);

// GET /api/user/check-username - Check username availability
router.get('/check-username', checkUsername);

// POST /api/user/profile-picture - Upload profile picture
router.post('/profile-picture', authenticateToken, uploadProfilePicture);

// POST /api/user/set-username - Set username (onboarding)
router.post('/set-username', authenticateToken, setUsername);

// POST /api/user/report - Report a user
router.post('/report', authenticateToken, reportUser);

// POST /api/user/block - Block a user
router.post('/block', authenticateToken, blockUser);

// POST /api/user/unblock - Unblock a user
router.post('/unblock', authenticateToken, unblockUser);

// GET /api/user/blocked - Get blocked users list
router.get('/blocked', authenticateToken, getBlockedUsers);

// GET /api/user/id/:userId - Get user by 7-digit ID
router.get('/id/:userId', optionalAuth, getUserById);

// GET /api/user/oid/:objectId - Get user by MongoDB ObjectId
router.get('/oid/:objectId', optionalAuth, getUserByObjectId);

// GET /api/user/:username - Get user by username
router.get('/:username', optionalAuth, getUserByUsername);

module.exports = router;
