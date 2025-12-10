const User = require('../models/User');
const { generateOTP, isValidOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/brevo');
const { storeOTP, getOTP, deleteOTP } = require('../config/redis');
const { generateToken } = require('../middleware/auth');
const { generateUniqueUserId } = require('../utils/userId');
const logger = require('../utils/logger');

/**
 * Send OTP to email
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is banned
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isBanActive()) {
      return res.status(403).json({
        error: 'Account banned',
        banReason: existingUser.banReason,
        banUntil: existingUser.banUntil,
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp, 600); // 10 minutes

    logger.info(`Generated OTP for ${normalizedEmail}: ${otp}`);

    // Send OTP via email
    await sendOTPEmail(normalizedEmail, otp);

    logger.info(`OTP sent to ${normalizedEmail}`);

    res.json({
      message: 'OTP sent successfully',
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and login/register
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Normalize OTP to string and trim whitespace
    const normalizedOTP = String(otp).trim();

    if (!isValidOTP(normalizedOTP)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const storedOTP = await getOTP(normalizedEmail);

    logger.info(`OTP verification attempt for ${normalizedEmail}: stored=${storedOTP}, received=${normalizedOTP}`);

    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new code.' });
    }

    // Compare as strings
    if (String(storedOTP).trim() !== normalizedOTP) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Delete used OTP
    await deleteOTP(normalizedEmail);

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      // Create new user
      const userId = await generateUniqueUserId();
      user = new User({
        email: normalizedEmail,
        userId,
        isVerified: true,
        joinDate: new Date(),
      });
      await user.save();
      isNewUser = true;
      logger.info(`New user registered: ${normalizedEmail} (${userId})`);
    } else {
      // Update existing user
      user.isVerified = true;
      user.lastActive = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
        isPremium: user.isPremium,
        needsOnboarding: !user.username,
      },
      isNewUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        interests: user.interests,
        isAdmin: user.isAdmin,
        isPremium: user.isPremium,
        premiumUntil: user.premiumUntil,
        joinDate: user.joinDate,
        totalMatches: user.totalMatches,
        friendsCount: user.friendsCount,
        privacy: user.privacy,
        needsOnboarding: !user.username,
        canChangeUsername: user.canChangeUsername,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Update user online status
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        socketId: null,
        lastActive: new Date(),
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getMe,
  logout,
};
