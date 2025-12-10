const mongoose = require('mongoose');

const onlineUserSchema = new mongoose.Schema(
  {
    // Connection Details
    socketId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    username: {
      type: String,
      default: 'Anonymous',
    },
    userId7Digit: String,

    // Connection Type
    isAnonymous: {
      type: Boolean,
      default: true,
    },

    // Connection Timestamps
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastPing: {
      type: Date,
      default: Date.now,
    },

    // Client Info
    userAgent: String,
    ip: String,
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete documents if no ping for 1 hour
onlineUserSchema.index({ lastPing: 1 }, { expireAfterSeconds: 3600 });

const OnlineUser = mongoose.model('OnlineUser', onlineUserSchema);

module.exports = OnlineUser;
