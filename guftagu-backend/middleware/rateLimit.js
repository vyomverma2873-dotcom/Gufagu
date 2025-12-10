const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Whitelist for emails that bypass rate limiting
 * Includes admin and development emails
 */
const emailWhitelist = [
  'vyomverma2873@gmail.com',
  // Add more emails here if needed
];

/**
 * Check if email is whitelisted
 */
const isWhitelistedEmail = (email) => {
  if (!email) return false;
  return emailWhitelist.includes(email.toLowerCase().trim());
};

/**
 * Strict rate limiter for OTP sending with whitelist support
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Increased from 3 to 50 requests per minute
  message: {
    error: 'Too many OTP requests. Please wait before requesting again.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for whitelisted emails
  skip: (req) => {
    const email = req.body?.email;
    if (isWhitelistedEmail(email)) {
      console.log(`[Rate Limit] Bypassing OTP rate limit for whitelisted email: ${email}`);
      return true;
    }
    return false;
  },
});

/**
 * Auth route rate limiter with whitelist support
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 20 to 100 attempts per windowMs
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for whitelisted emails
  skip: (req) => {
    const email = req.body?.email;
    if (isWhitelistedEmail(email)) {
      console.log(`[Rate Limit] Bypassing auth rate limit for whitelisted email: ${email}`);
      return true;
    }
    return false;
  },
});

module.exports = {
  apiLimiter,
  otpLimiter,
  authLimiter,
  isWhitelistedEmail,
};
