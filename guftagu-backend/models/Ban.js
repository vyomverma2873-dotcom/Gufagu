const mongoose = require('mongoose');

const banSchema = new mongoose.Schema(
  {
    // Banned User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: String,
    userId7Digit: String,
    email: String,

    // Ban Details
    reason: {
      type: String,
      enum: [
        'inappropriate_content',
        'harassment',
        'spam',
        'nudity',
        'violence',
        'hate_speech',
        'scam',
        'multiple_reports',
        'admin_discretion',
        'underage',
        'impersonation',
        'terms_violation',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    banType: {
      type: String,
      enum: ['permanent', 'temporary'],
      required: true,
    },

    // Ban Dates
    bannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bannedByUsername: String,
    banUntil: {
      type: Date,
      index: true,
    },

    // Ban Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Unban Information
    unbannedAt: Date,
    unbannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    unbannedByUsername: String,
    unbanReason: String,

    // Related Information
    relatedReportIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    }],
    relatedMatchIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    }],

    // Appeal Information
    appealSubmitted: {
      type: Boolean,
      default: false,
    },
    appealText: String,
    appealDate: Date,
    appealStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
banSchema.index({ userId: 1, isActive: 1 });
banSchema.index({ isActive: 1, banUntil: 1 });

const Ban = mongoose.model('Ban', banSchema);

module.exports = Ban;
