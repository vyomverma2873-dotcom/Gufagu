const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved'],
    default: 'open',
  },
  adminComments: {
    type: String,
    default: '',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
contactQuerySchema.index({ status: 1, createdAt: -1 });
contactQuerySchema.index({ email: 1 });

module.exports = mongoose.model('ContactQuery', contactQuerySchema);
