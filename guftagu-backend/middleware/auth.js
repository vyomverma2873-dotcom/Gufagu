const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ban = require('../models/Ban');
const Session = require('../models/Session');
const crypto = require('crypto');

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
    // If session not found but JWT is valid, auto-create a new session (graceful handling)
    const sessionHash = hashSessionToken(token);
    let session = await Session.findOneAndUpdate(
      { userId: user._id, sessionToken: sessionHash, isActive: true },
      { lastActivity: new Date() }
    );

    if (!session) {
      // Session not found - auto-create a new session for valid JWT
      // This ensures users stay logged in even if their session was lost
      try {
        session = await Session.create({
          userId: user._id,
          sessionToken: sessionHash,
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceType: 'unknown',
          loginTime: new Date(),
          lastActivity: new Date(),
          isActive: true,
        });
        console.log(`[Auth] Auto-created session for user ${user.email} (session was missing)`);
      } catch (sessionError) {
        // If session creation fails (e.g., duplicate key), try to find existing
        session = await Session.findOne({ sessionToken: sessionHash });
        if (!session) {
          console.error(`[Auth] Failed to create/find session for user ${user.email}:`, sessionError.message);
          // Still allow access - JWT is valid
        }
      }
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
    { expiresIn: process.env.JWT_EXPIRES_IN || '365d' } // 1 year for persistent login
  );
};

module.exports = {
  authenticateToken,
  auth: authenticateToken,
  optionalAuth,
  generateToken,
};
