const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    // Participants
    user1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    user2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    user1SocketId: {
      type: String,
      index: true,
    },
    user2SocketId: {
      type: String,
      index: true,
    },
    user1Username: {
      type: String,
      default: 'Anonymous',
    },
    user2Username: {
      type: String,
      default: 'Anonymous',
    },
    user1UserId7Digit: String,
    user2UserId7Digit: String,

    // Match Details
    startTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endTime: Date,
    duration: Number,
    status: {
      type: String,
      enum: ['active', 'ended', 'skipped', 'reported'],
      default: 'active',
      index: true,
    },
    endReason: {
      type: String,
      enum: ['user_ended', 'partner_ended', 'user_skipped', 'partner_skipped', 'disconnect', 'report'],
    },

    // Matching Criteria
    interests: [String],
    matchedByInterests: {
      type: Boolean,
      default: false,
    },

    // Chat History
    chatMessages: [{
      senderId: String,
      senderUsername: String,
      message: {
        type: String,
        maxlength: 500,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],

    // WebRTC Connection Info
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'poor', 'failed'],
    },
    iceConnectionState: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
matchSchema.index({ user1Id: 1, startTime: -1 });
matchSchema.index({ user2Id: 1, startTime: -1 });
matchSchema.index({ createdAt: -1 });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
