const express = require('express');
const router = express.Router();
const { 
  getSessions, 
  getSessionCount, 
  revokeSession, 
  logoutAllSessions, 
  verifySession 
} = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/sessions - Get all active sessions for current user
router.get('/', getSessions);

// GET /api/sessions/count - Get session count for navbar badge
router.get('/count', getSessionCount);

// GET /api/sessions/verify - Verify current session is still valid
router.get('/verify', verifySession);

// DELETE /api/sessions/logout-all - Logout from all devices except current
router.delete('/logout-all', logoutAllSessions);

// DELETE /api/sessions/:sessionId - Revoke specific session
router.delete('/:sessionId', revokeSession);

module.exports = router;
