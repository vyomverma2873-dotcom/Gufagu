const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    // Call ID (unique identifier)
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Participants
    callerId: {
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

    // Call Type
    callType: {
      type: String,
      enum: ['voice', 'video'],
      required: true,
    },

    // Call Status
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'answered', 'declined', 'missed', 'ended', 'failed'],
      default: 'initiated',
    },

    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },
    answeredAt: Date,
    endedAt: Date,

    // Duration in seconds (only set when call ends)
    duration: {
      type: Number,
      default: 0,
    },

    // Who ended the call
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Decline/missed reason
    endReason: {
      type: String,
      enum: ['completed', 'declined', 'missed', 'busy', 'failed', 'cancelled'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
callSchema.index({ callerId: 1, receiverId: 1, startedAt: -1 });
callSchema.index({ receiverId: 1, callerId: 1, startedAt: -1 });
callSchema.index({ startedAt: -1 });

// Virtual to get call duration in readable format
callSchema.virtual('durationFormatted').get(function () {
  if (!this.duration) return '0:00';
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const Call = mongoose.model('Call', callSchema);

module.exports = Call;
