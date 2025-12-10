const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    // Participants
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Request Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },

    // Request Message
    message: {
      type: String,
      maxlength: 200,
    },

    // Timestamps
    sentAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
friendRequestSchema.index({ receiverId: 1, status: 1 });
friendRequestSchema.index({ senderId: 1, status: 1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
