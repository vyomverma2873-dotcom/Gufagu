const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    // Reporter
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reporterSocketId: String,
    reporterUsername: String,
    reporterUserId7Digit: String,

    // Reported User
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reportedSocketId: String,
    reportedUsername: String,
    reportedUserId7Digit: String,

    // Report Details
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    reason: {
      type: String,
      enum: [
        'inappropriate_content',
        'harassment',
        'spam',
        'nudity',
        'violence',
        'hate_speech',
        'underage',
        'scam',
        'impersonation',
        'other',
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },

    // Status & Review
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByUsername: String,
    reviewedAt: Date,
    actionTaken: String,
    moderatorNotes: String,

    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ status: 1, timestamp: -1 });
reportSchema.index({ reportedUserId: 1, status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
