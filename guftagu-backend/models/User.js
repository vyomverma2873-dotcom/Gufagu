const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // 7-Digit Unique User ID
    userId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      match: /^\d{7}$/,
    },

    // Authentication
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Profile Information
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
      index: true,
    },
    displayName: {
      type: String,
      maxlength: 50,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    interests: [{
      type: String,
      maxlength: 20,
    }],

    // Account Status
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    socketId: {
      type: String,
      default: null,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },

    // Statistics
    totalMatches: {
      type: Number,
      default: 0,
    },
    friendsCount: {
      type: Number,
      default: 0,
    },
    totalMessagesSent: {
      type: Number,
      default: 0,
    },

    // Roles & Premium
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumUntil: {
      type: Date,
      default: null,
    },
    premiumPlan: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime', null],
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Ban Information
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    banReason: {
      type: String,
      default: null,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    banUntil: {
      type: Date,
      default: null,
    },

    // Blocked Users
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Privacy Settings
    privacy: {
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
      allowFriendRequests: {
        type: String,
        enum: ['everyone', 'nobody'],
        default: 'everyone',
      },
      showMatchCount: {
        type: Boolean,
        default: true,
      },
    },

    // Username Change Tracking
    usernameLastChanged: {
      type: Date,
      default: null,
    },
    usernameHistory: [{
      oldUsername: String,
      changedAt: Date,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActive: -1 });

// Virtual for checking if username can be changed
userSchema.virtual('canChangeUsername').get(function() {
  if (!this.usernameLastChanged) return true;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.usernameLastChanged < thirtyDaysAgo;
});

// Method to check if user is premium
userSchema.methods.isPremiumActive = function() {
  if (this.premiumPlan === 'lifetime') return true;
  if (!this.premiumUntil) return false;
  return new Date() < this.premiumUntil;
};

// Method to check if ban is active
userSchema.methods.isBanActive = function() {
  if (!this.isBanned) return false;
  if (!this.banUntil) return true; // Permanent ban
  return new Date() < this.banUntil;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
