const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema(
  {
    // Log Details
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },

    // Related Entities
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Request Information
    ip: String,
    userAgent: String,
    endpoint: String,
    method: String,

    // Additional Data
    metadata: mongoose.Schema.Types.Mixed,

    // Error Information
    errorMessage: String,
    errorStack: String,

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ action: 1, timestamp: -1 });

// TTL index: auto-delete logs older than 90 days
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const SystemLog = mongoose.model('SystemLog', systemLogSchema);

module.exports = SystemLog;
