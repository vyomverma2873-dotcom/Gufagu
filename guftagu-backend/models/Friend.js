const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema(
  {
    // Friend Pair (bidirectional - each friendship creates TWO documents)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Friendship Details
    friendsSince: {
      type: Date,
      default: Date.now,
    },

    // Interaction Stats
    totalMessages: {
      type: Number,
      default: 0,
    },
    lastInteraction: Date,
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicates
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;
