const mongoose = require('mongoose');

const roomParticipantSchema = new mongoose.Schema(
  {
    // Room reference (using room code for easy lookup)
    roomCode: {
      type: String,
      required: true,
      index: true,
    },

    // Room ObjectId reference
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },

    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Participant status
    isHost: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isKicked: {
      type: Boolean,
      default: false,
    },
    // Kick count for protection (3 strikes = permanent ban from room)
    kickCount: {
      type: Number,
      default: 0,
    },
    isVideoOff: {
      type: Boolean,
      default: false,
    },

    // Timestamps
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
roomParticipantSchema.index({ roomCode: 1, userId: 1 });
roomParticipantSchema.index({ userId: 1, leftAt: 1 });
roomParticipantSchema.index({ roomId: 1, isKicked: 1 });

// Static method to get active participants in a room
roomParticipantSchema.statics.getActiveParticipants = async function(roomCode) {
  return this.find({
    roomCode,
    leftAt: null,
    isKicked: false,
  }).populate('userId', 'username displayName profilePicture isOnline');
};

// Static method to check if user is in room
roomParticipantSchema.statics.isUserInRoom = async function(roomCode, userId) {
  const participant = await this.findOne({
    roomCode,
    userId,
    leftAt: null,
    isKicked: false,
  });
  return !!participant;
};

// Static method to get user's kick count for a room
roomParticipantSchema.statics.getKickCount = async function(roomCode, userId) {
  const participants = await this.find({
    roomCode,
    userId,
    isKicked: true,
  });
  // Sum up all kick counts
  return participants.reduce((total, p) => total + (p.kickCount || 1), 0);
};

// Static method to check if user is permanently banned (3+ kicks)
roomParticipantSchema.statics.isPermanentlyBanned = async function(roomCode, userId) {
  const kickCount = await this.getKickCount(roomCode, userId);
  return kickCount >= 3;
};

// Static method to get user's active rooms
roomParticipantSchema.statics.getUserActiveRooms = async function(userId) {
  return this.find({
    userId,
    leftAt: null,
    isKicked: false,
  }).populate('roomId');
};

const RoomParticipant = mongoose.model('RoomParticipant', roomParticipantSchema);

module.exports = RoomParticipant;
