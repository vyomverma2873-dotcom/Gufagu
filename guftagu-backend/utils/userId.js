const User = require('../models/User');

/**
 * Generate a unique 7-digit user ID
 * Format: 1000000 - 9999999
 * Ensures uniqueness by checking database
 */
async function generateUniqueUserId() {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random 7-digit number
    const userId = Math.floor(1000000 + Math.random() * 9000000).toString();

    // Check if already exists in database
    const existingUser = await User.findOne({ userId });

    if (!existingUser) {
      return userId; // Unique ID found
    }

    attempts++;
  }

  // Fallback: use timestamp-based ID if random generation fails
  const timestamp = Date.now().toString().slice(-7);
  return timestamp;
}

/**
 * Validate 7-digit user ID format
 */
function isValidUserId(userId) {
  // Must be exactly 7 digits
  const regex = /^\d{7}$/;
  return regex.test(userId);
}

/**
 * Format user ID with separators for display (optional)
 * e.g., "1234567" → "123-4567"
 */
function formatUserId(userId) {
  if (!isValidUserId(userId)) return userId;
  return `${userId.slice(0, 3)}-${userId.slice(3)}`;
}

module.exports = {
  generateUniqueUserId,
  isValidUserId,
  formatUserId,
};
