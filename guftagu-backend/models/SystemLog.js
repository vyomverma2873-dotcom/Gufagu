const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema(
  {
    // Log Details
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
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

    // Admin who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Target user (if applicable)
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Additional details
    details: mongoose.Schema.Types.Mixed,

    // Request Information (optional)
    ip: String,
    userAgent: String,
    endpoint: String,
    method: String,

    // Error Information (optional)
    errorMessage: String,
    errorStack: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
systemLogSchema.index({ level: 1, createdAt: -1 });
systemLogSchema.index({ action: 1, createdAt: -1 });
systemLogSchema.index({ performedBy: 1, createdAt: -1 });

// TTL index: auto-delete logs older than 90 days
systemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const SystemLog = mongoose.model('SystemLog', systemLogSchema);

module.exports = SystemLog;
