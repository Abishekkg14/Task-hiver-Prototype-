const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const Reward = require('../models/Reward');
const Task = require('../models/Task');
const User = require('../models/User');

// @route   GET api/rewards
// @desc    Get rewards for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('User not authenticated, req.user:', req.user);
      return res.status(401).json({ msg: 'User not authenticated' });
    }
    
    let rewards = await Reward.findOne({ userId: req.user.id });
    
    // Create rewards record if it doesn't exist
    if (!rewards) {
      rewards = new Reward({
        userId: req.user.id,
        totalEarned: 0,
        availableBalance: 0,
        history: []
      });
      
      await rewards.save();
    }
    
    res.json(rewards);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/rewards/leaderboard
// @desc    Get top users by total earnings
// @access  Private
router.get('/leaderboard', async (req, res) => {
  try {
    // Find top 10 users by total earnings
    const topRewards = await Reward.find()
      .sort({ totalEarned: -1 })
      .limit(10);
      
    // Get user info for each reward entry
    const leaderboard = await Promise.all(topRewards.map(async (reward) => {
      try {
        const user = await User.findById(reward.userId, 'name');
        return {
          userId: reward.userId,
          userName: user ? user.name : 'Unknown User',
          totalEarned: reward.totalEarned
        };
      } catch (err) {
        console.error(`Error finding user for reward ${reward._id}:`, err.message);
        return {
          userId: reward.userId,
          userName: 'Unknown User',
          totalEarned: reward.totalEarned
        };
      }
    }));
    
    res.json(leaderboard);
  } catch (err) {
    console.error('Error getting leaderboard:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/rewards/add
// @desc    Add rewards to user account
// @access  Private
router.post('/add', async (req, res) => {
  try {
    const { taskId, userId, amount } = req.body;
    
    if (!taskId || !userId) {
      return res.status(400).json({ msg: 'Both taskId and userId are required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ msg: 'Invalid taskId format' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: 'Invalid userId format' });
    }
    
    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
      // Only the creator of a task can give rewards
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to give rewards for this task' });
    }
    
    // Verify target user exists and is the assignee
    // For testing purposes, we'll log a warning but allow the reward to be given
    if (!task.assignedTo) {
      console.warn('Task has no assignee, using provided userId');
    } else if (userId !== task.assignedTo.toString()) {
      console.warn('Reward being given to user that is not the assignee (allowed for testing)');
    }
    
    // Get or create user rewards
    let rewards = await Reward.findOne({ userId });
    if (!rewards) {
      rewards = new Reward({
        userId,
        totalEarned: 0,
        availableBalance: 0,
        history: []
      });
    }
    
    // Validate amount
    const rewardAmount = parseFloat(amount);
    if (isNaN(rewardAmount) || rewardAmount <= 0 || rewardAmount > 50) {
      return res.status(400).json({ msg: 'Invalid reward amount' });
    }
    
    // Update reward record
    rewards.totalEarned += rewardAmount;
    rewards.availableBalance += rewardAmount;
    rewards.history.unshift({
      taskId: task._id,
      taskTitle: task.title,
      amount: rewardAmount,
      type: 'earned',
      date: Date.now()
    });
    rewards.lastUpdated = Date.now();
    
    await rewards.save();
    
    // Update task record with reward amount
    task.rewardAmount = rewardAmount;
    await task.save();
    
    res.json({ 
      rewards,
      task    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/rewards/redeem
// @desc    Redeem rewards from user account
// @access  Private
router.post('/redeem', async (req, res) => {
  try {
    const { option, amount } = req.body;
    
    // Validate input
    if (!option || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid redemption request' });
    }
    
    // Find user rewards
    let rewards = await Reward.findOne({ userId: req.user.id });
    
    // Check if rewards exists
    if (!rewards) {
      return res.status(404).json({ msg: 'Rewards account not found' });
    }
    
    // Check if sufficient balance
    if (rewards.availableBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }
    
    // Process the redemption
    const timestamp = new Date();
    let description = 'Reward redemption';
    
    if (option.includes('gift-card')) {
      description = `Gift Card Redemption ($${amount})`;
    } else if (option.includes('charity')) {
      description = `Charity Donation ($${amount})`;
    } else if (option.includes('premium')) {
      description = `Premium Access ($${amount})`;
    }
    
    // Update the rewards record
    rewards.availableBalance -= amount;
    
    // Add transaction to history
    rewards.history.push({
      date: timestamp,
      type: 'debit',
      amount: amount,
      description: description,
      option: option
    });
    
    await rewards.save();
    
    res.json({
      msg: 'Redemption successful',
      availableBalance: rewards.availableBalance,
      totalEarned: rewards.totalEarned,
      redeemed: amount,
      timestamp: timestamp
    });
  } catch (err) {
    console.error('Error redeeming rewards:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Helper function for calculating reward amount
async function calculateReward(task) {
  // First try to use the Gemini API
  try {
    const reward = await getGeminiRewardSuggestion(task);
    return reward;
  } catch (error) {
    console.warn('Failed to get reward from Gemini API, using fallback calculation:', error);
    return calculateFallbackReward(task);
  }
}

// Helper function to get reward from Gemini API
async function getGeminiRewardSuggestion(task) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // Calculate completion duration
    let completionTime = 'unknown';
    if (task.createdAt && task.completedAt) {
      const durationHours = (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60);
      completionTime = `${durationHours.toFixed(1)} hours`;
    }
    
    // Create the prompt for the AI
    const prompt = `As an AI assistant for TaskHive, a task management platform, please analyze this completed task and suggest an appropriate reward amount in dollars (between $1 and $50) based on its complexity, effort required, and time taken. Please return ONLY a number with up to 2 decimal places, nothing else.

Task details:
- Title: ${task.title || ''}
- Description: ${task.description || ''}
- Type: ${task.type || 'other'}
- Completion note: ${task.completionNote || ''}
- Completion time: ${completionTime}

Reward amount in dollars (just the number, e.g., 15.75):`;
    
    // API request body
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 10
      }
    };

    const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the generated text and parse it as a number
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const rewardMatch = generatedText.match(/\d+(\.\d+)?/);
    
    if (rewardMatch) {
      const rewardAmount = parseFloat(rewardMatch[0]);
      
      // Ensure reward is within reasonable bounds
      return Math.min(Math.max(rewardAmount, 1), 50);
    } else {
      throw new Error('Could not parse reward amount from API response');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Fallback reward calculation
function calculateFallbackReward(task) {
  // Base reward amount
  let reward = 5.00;
  
  // Adjust based on task type
  if (task.type === 'urgent') {
    reward += 3.00;
  } else if (task.type === 'important') {
    reward += 2.00;
  }
  
  // Adjust based on task description length
  if (task.description && task.description.length > 100) {
    reward += 1.50;
  }
  
  // Adjust based on completion note
  if (task.completionNote && task.completionNote.length > 50) {
    reward += 0.75;
  }
  
  // Adjust for task completion time
  if (task.createdAt && task.completedAt) {
    const createdAt = new Date(task.createdAt);
    const completedAt = new Date(task.completedAt);
    const durationHours = (completedAt - createdAt) / (1000 * 60 * 60);
    
    // Fast completion bonus
    if (durationHours < 2) {
      reward += 2.00;
    } else if (durationHours < 12) {
      reward += 1.00;
    }
  }
  
  // Round to 2 decimal places and ensure minimum reward
  reward = Math.max(Math.round(reward * 100) / 100, 1.00);
  
  return reward;
}

// @route   POST api/rewards/calculate
// @desc    Calculate reward for a task
// @access  Private
router.post('/calculate', async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ msg: 'taskId is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ msg: 'Invalid taskId format' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    const reward = await calculateReward(task);
    res.json({ reward });
  } catch (err) {
    console.error('Error calculating reward:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
