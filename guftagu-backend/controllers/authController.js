const User = require('../models/User');
const Ban = require('../models/Ban');
const Session = require('../models/Session');
const { generateOTP, isValidOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/brevo');
const { storeOTP, getOTP, deleteOTP } = require('../config/redis');
const { generateToken } = require('../middleware/auth');
const { generateUniqueUserId } = require('../utils/userId');
const { parseUserAgent, getClientIP, getGeolocation, hashSessionToken } = require('../utils/session');
const logger = require('../utils/logger');

// Maximum active sessions per user (increased for persistent login across many devices)
const MAX_SESSIONS_PER_USER = 50;

// Helper function to check and auto-unban expired bans
const checkAndAutoUnban = async (user) => {
  if (!user.isBanned) return { isBanned: false };
  
  // If no banUntil, it's a permanent ban
  if (!user.banUntil) {
    return {
      isBanned: true,
      banType: 'permanent',
      banReason: user.banReason,
      banUntil: null
    };
  }
  
  const now = new Date();
  const banExpiry = new Date(user.banUntil);
  
  // Ban has expired - auto-unban
  if (now >= banExpiry) {
    user.isBanned = false;
    user.banReason = undefined;
    user.banUntil = undefined;
    await user.save();
    
    // Update ban record
    await Ban.updateMany(
      { userId: user._id, isActive: true },
      { 
        isActive: false, 
        unbannedAt: new Date(),
        unbanReason: 'automatic_expiry'
      }
    );
    
    logger.info(`Auto-unban: User ${user.email} ban expired`);
    return { isBanned: false, wasUnbanned: true };
  }
  
  // Ban is still active
  return {
    isBanned: true,
    banType: 'temporary',
    banReason: user.banReason,
    banUntil: user.banUntil,
    remainingMs: banExpiry - now
  };
};

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

    // Check if user exists and is banned
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const banStatus = await checkAndAutoUnban(existingUser);
      
      if (banStatus.isBanned) {
        // Get ban details from Ban collection for more info
        const banRecord = await Ban.findOne({ userId: existingUser._id, isActive: true })
          .populate('bannedBy', 'username displayName');
        
        return res.status(403).json({
          error: 'account_banned',
          message: 'Your account has been banned',
          banDetails: {
            type: banStatus.banType,
            reason: banStatus.banReason,
            banUntil: banStatus.banUntil,
            remainingMs: banStatus.remainingMs || null,
            bannedBy: banRecord?.bannedBy?.displayName || banRecord?.bannedBy?.username || 'Admin',
            description: banRecord?.description || null
          }
        });
      }
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
      
      // Grant admin privileges to specific email
      const isAdmin = normalizedEmail === 'vyomverma2873@gmail.com';
      
      user = new User({
        email: normalizedEmail,
        userId,
        isVerified: true,
        isAdmin,
        joinDate: new Date(),
      });
      await user.save();
      isNewUser = true;
      logger.info(`New user registered: ${normalizedEmail} (${userId})${isAdmin ? ' [ADMIN]' : ''}`);
    } else {
      // Update existing user
      user.isVerified = true;
      user.lastActive = new Date();
      
      // Grant admin privileges to specific email if not already set
      if (normalizedEmail === 'vyomverma2873@gmail.com' && !user.isAdmin) {
        user.isAdmin = true;
        logger.info(`Admin privileges granted to: ${normalizedEmail}`);
      }
      
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Create session record
    try {
      // Parse user agent
      const userAgent = req.headers['user-agent'];
      const deviceInfo = parseUserAgent(userAgent);
      
      // Get client IP and geolocation
      const ipAddress = getClientIP(req);
      const geoData = await getGeolocation(ipAddress);

      // Hash the token for secure storage
      const sessionToken = hashSessionToken(token);

      // Create new session
      await Session.create({
        userId: user._id,
        sessionToken,
        ipAddress,
        userAgent,
        ...deviceInfo,
        ...geoData,
        loginTime: new Date(),
        lastActivity: new Date(),
      });

      // Check and limit sessions (remove oldest if exceeds max)
      const sessionCount = await Session.getActiveCount(user._id);
      if (sessionCount > MAX_SESSIONS_PER_USER) {
        const oldestSessions = await Session.find({
          userId: user._id,
          isActive: true,
          sessionToken: { $ne: sessionToken },
        })
          .sort({ lastActivity: 1 })
          .limit(sessionCount - MAX_SESSIONS_PER_USER);

        for (const oldSession of oldestSessions) {
          oldSession.isActive = false;
          oldSession.revokedAt = new Date();
          oldSession.revokeReason = 'expired';
          await oldSession.save();
        }
        
        logger.info(`Removed ${oldestSessions.length} old sessions for user ${user.email}`);
      }

      logger.info(`Session created for ${user.email} from ${ipAddress}`);
    } catch (sessionError) {
      // Log but don't fail login if session creation fails
      logger.error(`Session creation failed for ${user.email}:`, sessionError);
    }

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

      // Revoke current session
      const authHeader = req.headers.authorization;
      const currentToken = authHeader && authHeader.split(' ')[1];
      if (currentToken) {
        const sessionHash = hashSessionToken(currentToken);
        await Session.findOneAndUpdate(
          { userId: req.user._id, sessionToken: sessionHash, isActive: true },
          { 
            isActive: false, 
            revokedAt: new Date(), 
            revokeReason: 'user_logout' 
          }
        );
        logger.info(`Session revoked on logout for user ${req.user._id}`);
      }
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
