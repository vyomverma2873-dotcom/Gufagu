const UAParser = require('ua-parser-js');
const crypto = require('crypto');

/**
 * Parse user agent string to extract device info
 */
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) {
    return {
      deviceType: 'unknown',
      browser: null,
      browserVersion: null,
      os: null,
      osVersion: null,
      deviceVendor: null,
      deviceModel: null,
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Determine device type
  let deviceType = 'unknown';
  if (result.device.type) {
    deviceType = result.device.type === 'mobile' ? 'mobile' : 
                 result.device.type === 'tablet' ? 'tablet' : 'desktop';
  } else {
    // If no device type, assume desktop
    deviceType = 'desktop';
  }

  return {
    deviceType,
    browser: result.browser.name || null,
    browserVersion: result.browser.version || null,
    os: result.os.name || null,
    osVersion: result.os.version || null,
    deviceVendor: result.device.vendor || null,
    deviceModel: result.device.model || null,
  };
};

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  // Check various headers for proxied requests
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Check socket
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  return req.ip || '0.0.0.0';
};

/**
 * Get geolocation from IP address
 * Uses free ip-api.com service with caching
 */
const geoCache = new Map();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getGeolocation = async (ipAddress) => {
  // Check cache first
  const cached = geoCache.get(ipAddress);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    return cached.data;
  }

  // Skip for localhost/private IPs
  if (isPrivateIP(ipAddress)) {
    return { city: 'Local', country: 'Localhost', countryCode: 'LH' };
  }

  try {
    // Use ip-api.com (free tier - 45 requests per minute)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,city,country,countryCode`);
    const data = await response.json();

    if (data.status === 'success') {
      const geoData = {
        city: data.city || null,
        country: data.country || null,
        countryCode: data.countryCode || null,
      };
      
      // Cache the result
      geoCache.set(ipAddress, { data: geoData, timestamp: Date.now() });
      
      return geoData;
    }
  } catch (error) {
    console.error('[Geolocation] Error fetching location:', error.message);
  }

  return { city: null, country: null, countryCode: null };
};

/**
 * Check if IP is private/local
 */
const isPrivateIP = (ip) => {
  // IPv4 private ranges
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
    return true;
  }
  
  // Check common private IP ranges
  const parts = ip.split('.');
  if (parts.length === 4) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    
    // 10.x.x.x
    if (first === 10) return true;
    
    // 172.16.x.x - 172.31.x.x
    if (first === 172 && second >= 16 && second <= 31) return true;
    
    // 192.168.x.x
    if (first === 192 && second === 168) return true;
  }
  
  return false;
};

/**
 * Generate a secure session token
 */
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a session token for storage
 */
const hashSessionToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  parseUserAgent,
  getClientIP,
  getGeolocation,
  generateSessionToken,
  hashSessionToken,
  isPrivateIP,
};
