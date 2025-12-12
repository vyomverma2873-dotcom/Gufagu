const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: null,
    },
    browserVersion: {
      type: String,
      default: null,
    },
    os: {
      type: String,
      default: null,
    },
    osVersion: {
      type: String,
      default: null,
    },
    deviceVendor: {
      type: String,
      default: null,
    },
    deviceModel: {
      type: String,
      default: null,
    },
    // Geolocation from IP
    city: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    countryCode: {
      type: String,
      default: null,
    },
    // Timestamps
    loginTime: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
      enum: ['user_logout', 'user_revoked', 'admin_revoked', 'security', 'expired', 'logout_all', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ sessionToken: 1, isActive: 1 });
sessionSchema.index({ lastActivity: 1 });

// Method to format session for API response
sessionSchema.methods.toJSON = function() {
  const session = this.toObject();
  
  // Format device name
  let deviceName = 'Unknown Device';
  if (session.browser) {
    deviceName = session.browser;
    if (session.os) {
      deviceName += ` on ${session.os}`;
    }
  } else if (session.os) {
    deviceName = session.os;
  }
  
  return {
    id: session._id,
    deviceType: session.deviceType,
    deviceName,
    browser: session.browser,
    browserVersion: session.browserVersion,
    os: session.os,
    osVersion: session.osVersion,
    deviceVendor: session.deviceVendor,
    deviceModel: session.deviceModel,
    ipAddress: session.ipAddress,
    city: session.city,
    country: session.country,
    countryCode: session.countryCode,
    location: session.city && session.country ? `${session.city}, ${session.country}` : session.country || 'Unknown',
    loginTime: session.loginTime,
    lastActivity: session.lastActivity,
    isActive: session.isActive,
  };
};

// Static method to get active session count for a user
sessionSchema.statics.getActiveCount = async function(userId) {
  return await this.countDocuments({ userId, isActive: true });
};

// Static method to clean up old sessions (called periodically)
sessionSchema.statics.cleanupExpiredSessions = async function(daysInactive = 30) {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
  
  const result = await this.updateMany(
    { lastActivity: { $lt: cutoffDate }, isActive: true },
    { 
      isActive: false, 
      revokedAt: new Date(), 
      revokeReason: 'expired' 
    }
  );
  
  return result.modifiedCount;
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
