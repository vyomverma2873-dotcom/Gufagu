const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, getMe, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/send-otp - Send OTP to email (no rate limiting)
router.post('/send-otp', sendOTP);

// POST /api/auth/verify-otp - Verify OTP and login (no rate limiting)
router.post('/verify-otp', verifyOTP);

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, getMe);

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, logout);

module.exports = router;
