const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, getMe, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { otpLimiter, authLimiter } = require('../middleware/rateLimit');

// POST /api/auth/send-otp - Send OTP to email
router.post('/send-otp', otpLimiter, sendOTP);

// POST /api/auth/verify-otp - Verify OTP and login
router.post('/verify-otp', authLimiter, verifyOTP);

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, getMe);

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, logout);

module.exports = router;
