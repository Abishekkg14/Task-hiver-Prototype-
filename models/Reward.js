const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  history: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    taskTitle: {
      type: String,
      default: 'Task'
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['earned', 'spent'],
      default: 'earned'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', RewardSchema);
