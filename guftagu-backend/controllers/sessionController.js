const Session = require('../models/Session');
const { hashSessionToken } = require('../utils/session');
const logger = require('../utils/logger');

/**
 * Get all active sessions for current user
 * GET /api/sessions
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      isActive: true,
    }).sort({ lastActivity: -1 });

    // Get current session token from request
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.split(' ')[1];
    const currentSessionHash = currentToken ? hashSessionToken(currentToken) : null;

    // Mark current session
    const sessionsWithCurrent = sessions.map(session => {
      const sessionData = session.toJSON();
      sessionData.isCurrent = session.sessionToken === currentSessionHash;
      return sessionData;
    });

    res.json({
      sessions: sessionsWithCurrent,
      totalActive: sessions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session count for navbar badge
 * GET /api/sessions/count
 */
const getSessionCount = async (req, res, next) => {
  try {
    const count = await Session.getActiveCount(req.user._id);
    res.json({ activeCount: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke specific session
 * DELETE /api/sessions/:sessionId
 */
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Get current session token to prevent revoking current session
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.split(' ')[1];
    const currentSessionHash = currentToken ? hashSessionToken(currentToken) : null;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if trying to revoke current session
    if (session.sessionToken === currentSessionHash) {
      return res.status(400).json({ error: 'Cannot revoke current session. Use logout instead.' });
    }

    // Revoke the session
    session.isActive = false;
    session.revokedAt = new Date();
    session.revokeReason = 'user_revoked';
    await session.save();

    logger.info(`Session revoked: ${sessionId} by user ${req.user._id}`);

    res.json({ 
      success: true, 
      message: 'Session terminated successfully' 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices except current
 * DELETE /api/sessions/logout-all
 */
const logoutAllSessions = async (req, res, next) => {
  try {
    // Get current session token
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.split(' ')[1];
    const currentSessionHash = currentToken ? hashSessionToken(currentToken) : null;

    // Find all active sessions except current
    const result = await Session.updateMany(
      {
        userId: req.user._id,
        isActive: true,
        sessionToken: { $ne: currentSessionHash },
      },
      {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'logout_all',
      }
    );

    logger.info(`Logout all: ${result.modifiedCount} sessions terminated for user ${req.user._id}`);

    res.json({
      success: true,
      sessionsTerminated: result.modifiedCount,
      message: `Successfully logged out from ${result.modifiedCount} other device(s)`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify current session is still valid
 * GET /api/sessions/verify
 */
const verifySession = async (req, res, next) => {
  try {
    // Get current session token
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.split(' ')[1];
    const currentSessionHash = currentToken ? hashSessionToken(currentToken) : null;

    const session = await Session.findOne({
      userId: req.user._id,
      sessionToken: currentSessionHash,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({ valid: false, error: 'Session not found or expired' });
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    res.json({
      valid: true,
      sessionId: session._id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getSessionCount,
  revokeSession,
  logoutAllSessions,
  verifySession,
};
