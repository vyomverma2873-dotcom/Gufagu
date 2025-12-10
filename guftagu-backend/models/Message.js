const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
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

    // Message Content
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Delivery Status
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,

    // Message Type
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    editedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
