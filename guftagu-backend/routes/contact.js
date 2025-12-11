const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { auth } = require('../middleware/auth');

// Public route - submit contact query
router.post('/submit', contactController.submitQuery);

// Protected routes - require authentication
router.use(auth);

module.exports = router;
