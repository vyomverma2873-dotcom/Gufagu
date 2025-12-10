const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Recipient
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Notification Details
    type: {
      type: String,
      enum: [
        'friend_request',
        'friend_accepted',
        'new_message',
        'system',
        'account_warning',
        'premium_expired',
        'match_report_resolved',
      ],
      required: true,
      index: true,
    },

    // Related Entities
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedUsername: String,
    relatedUserId7Digit: String,
    relatedId: mongoose.Schema.Types.ObjectId,

    // Notification Content
    title: {
      type: String,
      maxlength: 100,
      required: true,
    },
    content: {
      type: String,
      maxlength: 300,
    },

    // Action Link
    actionUrl: String,

    // Read Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,

    // Push Notification Status
    isPushed: {
      type: Boolean,
      default: false,
    },
    pushedAt: Date,

    // Expiry
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
