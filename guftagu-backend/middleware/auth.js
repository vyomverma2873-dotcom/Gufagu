const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ban = require('../models/Ban');
const Session = require('../models/Session');

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
    
    console.log(`[Auth] Auto-unban: User ${user.email} ban expired`);
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
 * Hash a session token
 */
const hashSessionToken = (token) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Authenticate JWT token middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check ban status and auto-unban if expired
    const banStatus = await checkAndAutoUnban(user);
    
    if (banStatus.isBanned) {
      return res.status(403).json({
        error: 'account_banned',
        message: 'Your account has been banned',
        banDetails: {
          type: banStatus.banType,
          reason: banStatus.banReason,
          banUntil: banStatus.banUntil,
          remainingMs: banStatus.remainingMs || null
        }
      });
    }

    // Verify session is active and update last activity
    const sessionHash = hashSessionToken(token);
    const session = await Session.findOneAndUpdate(
      { userId: user._id, sessionToken: sessionHash, isActive: true },
      { lastActivity: new Date() }
    );

    if (!session) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }

    req.user = user;
    req.sessionId = session._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-__v');
      if (user) {
        // Check and auto-unban if expired
        const banStatus = await checkAndAutoUnban(user);
        if (!banStatus.isBanned) {
          req.user = user;
        }
      }
    }
    next();
  } catch {
    next();
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  auth: authenticateToken,
  optionalAuth,
  generateToken,
};
