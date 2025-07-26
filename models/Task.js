const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'in-progress', 'awaiting-verification', 'verified'],
    default: 'available'
  },
  type: {
    type: String,
    enum: ['urgent', 'important', 'routine', 'delivery', 'assistance', 'repairs', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    default: null
  },  locationCoords: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: null }
  },
  timeWindow: {
    type: Number,
    default: 60 // Default 60 minutes
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completionNote: {
    type: String,
    default: ''
  },
  verificationNote: {
    type: String,
    default: ''
  },
  taskRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  rewardAmount: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Task', TaskSchema);
