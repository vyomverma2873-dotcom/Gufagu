const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// All routes require authentication and admin role
router.use(auth);
router.use(admin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.get('/users/:userId/sessions', adminController.getUserSessions);
router.get('/users/:userId/messages/:friendId', adminController.getUserMessages);
router.post('/users/:userId/ban', adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

// Reports
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId', adminController.updateReportStatus);

// Bans
router.get('/bans', adminController.getActiveBans);

// Logs
router.get('/logs', adminController.getSystemLogs);

// Contact Queries
router.get('/contact-queries', adminController.getContactQueries);
router.put('/contact-queries/:queryId', adminController.resolveContactQuery);

// Chat Export
router.get('/chats/stats', adminController.getChatStats);
router.get('/chats/conversations', adminController.getConversationsList);
router.get('/chats/export', adminController.exportChatMessages);

module.exports = router;
