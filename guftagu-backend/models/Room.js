const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    // Unique 8-character room code
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 8,
      maxlength: 8,
    },

    // Room name (optional, default: "{username}'s Room")
    roomName: {
      type: String,
      maxlength: 50,
      trim: true,
    },

    // Host user reference
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Room capacity
    maxParticipants: {
      type: Number,
      default: 5,
      min: 2,
      max: 10,
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Room status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },

    // Password protection (optional)
    passwordHash: {
      type: String,
      default: null,
    },

    // Jitsi Meet integration (free, no API key needed)
    jitsiRoomUrl: {
      type: String,
      default: null,
    },
    jitsiRoomName: {
      type: String,
      default: null,
    },
    jitsiDomain: {
      type: String,
      default: 'meet.jit.si',
    },

    // Room settings
    settings: {
      videoEnabled: {
        type: Boolean,
        default: true,
      },
      audioEnabled: {
        type: Boolean,
        default: true,
      },
      screenShareEnabled: {
        type: Boolean,
        default: true,
      },
      chatEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // Timestamps
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
roomSchema.index({ hostUserId: 1, isActive: 1 });
roomSchema.index({ createdAt: -1 });
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Static method to generate unique room code
roomSchema.statics.generateRoomCode = async function() {
  // Characters that are easy to read (excluding confusing ones like 0/O, 1/I/l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    const existingRoom = await this.findOne({ roomCode: code });
    if (!existingRoom) {
      isUnique = true;
    }
  }
  
  return code;
};

// Method to check if room is full
roomSchema.methods.isFull = function() {
  return this.currentParticipants >= this.maxParticipants;
};

// Method to check if room is expired
roomSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
