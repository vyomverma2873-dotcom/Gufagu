const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    // User Information
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
    isAnonymous: {
      type: Boolean,
      default: true,
    },

    // Matching Preferences
    interests: [String],
    preferredGender: {
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any',
    },
    preferredLocation: String,

    // Queue Status
    status: {
      type: String,
      enum: ['waiting', 'matched', 'expired'],
      default: 'waiting',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    matchedAt: Date,

    // Queue Position
    position: Number,

    // TTL
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
queueEntrySchema.index({ status: 1, joinedAt: 1 });

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

module.exports = QueueEntry;
