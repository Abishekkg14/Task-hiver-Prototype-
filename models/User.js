const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // User stats
  taskStats: {
    created: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 }
  },
  // Ratings history
  ratings: [{
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    rating: { type: Number, min: 1, max: 5 },
    asCompleter: { type: Boolean, default: true },
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);
