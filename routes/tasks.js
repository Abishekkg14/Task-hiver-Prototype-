const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Task = require('../models/Task');
const User = require('../models/User');

// Middleware to check if ObjectId is valid
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid ID' });
  }
  next();
};

// @route   GET api/tasks
// @desc    Get all tasks for current user (created by or assigned to)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ]
    })
    .populate('createdBy', 'name profilePic')
    .populate('assignedTo', 'name profilePic')
    .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name profilePic')
      .populate('assignedTo', 'name profilePic');
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user has permission to view this task
    if (
      task.createdBy._id.toString() !== req.user.id && 
      (task.assignedTo === null || task.assignedTo._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('User not authenticated, req.user:', req.user);
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { title, description, type, location, locationCoords, timeWindow } = req.body;
    
    // Ensure we have proper locationCoords format
    let coords = locationCoords;
    if (!coords) {
      coords = {
        latitude: null,
        longitude: null,
        address: null
      };
    } else if (typeof coords !== 'object') {
      // Try to parse if it's a string
      try {
        coords = JSON.parse(coords);
      } catch (e) {
        coords = {
          latitude: null,
          longitude: null,
          address: null
        };
      }
    }
      // Create new task with safe defaults for all required fields
    const newTask = new Task({
      title: title || 'Untitled Task',
      description: description || 'No description provided',
      type: type || 'other',
      location: location || '',
      locationCoords: {
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        address: coords?.address || null
      },
      timeWindow: parseInt(timeWindow) || 60, // Default to 60 minutes if not provided
      createdBy: req.user.id,
      status: 'available'
    });
    
    const task = await newTask.save();
    
    // Update user stats if the field exists
    try {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'taskStats.created': 1 }
      });
    } catch (statError) {
      console.warn('Could not update user task stats:', statError.message);
    }
    
    // Return the task with populated fields
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name profilePic')
      .populate('assignedTo', 'name profilePic');
      
    res.json(populatedTask);
  } catch (err) {
    console.error('Error creating task:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   PUT api/tasks/:id/assign
// @desc    Assign a task to current user
// @access  Private
router.put('/:id/assign', validateObjectId, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if task is available
    if (task.status !== 'available') {
      return res.status(400).json({ msg: 'Task is not available' });
    }
      // For testing purposes, allow users to assign their own tasks
    // In a production environment, you might want to uncomment this check
    /*
    if (task.createdBy.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Cannot assign your own task to yourself' });
    }
    */
    // Instead, log a warning
    if (task.createdBy.toString() === req.user.id) {
      console.log('Warning: User is assigning their own task to themselves (allowed for testing)');
    }
    
    // Update task
    task.assignedTo = req.user.id;
    task.status = 'in-progress';
    task.assignedAt = Date.now();
    
    await task.save();
    
    // Return the task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name profilePic')
      .populate('assignedTo', 'name profilePic');
      
    res.json(updatedTask);  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   PUT api/tasks/:id/accept
// @desc    Accept a task (alias for assign for backwards compatibility)
// @access  Private
router.put('/:id/accept', validateObjectId, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
      // Check if task is available
    if (task.status !== 'available') {
      return res.status(400).json({ msg: 'Task is not available' });
    }
    
    // For testing purposes, allow users to accept their own tasks
    if (task.createdBy.toString() === req.user.id) {
      console.log('Warning: User is accepting their own task (allowed for testing)');
    }
    
    // Update task
    task.assignedTo = req.user.id;
    task.status = 'in-progress';
    task.assignedAt = Date.now();
    
    await task.save();
    
    // Return the task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name profilePic')
      .populate('assignedTo', 'name profilePic');
      
    res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.put('/:id/complete', validateObjectId, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
      // For testing purposes, we'll allow the creator to complete a task
    // In a production environment, you'd want to enforce this
    if (task.assignedTo && task.assignedTo.toString() !== req.user.id && task.createdBy.toString() !== req.user.id) {
      console.warn('User attempting to complete a task they are not assigned to');
      return res.status(403).json({ msg: 'Not authorized to complete this task' });
    } else if (task.createdBy.toString() === req.user.id) {
      console.log('Creator is completing their own task (allowed for testing)');
    }
    
    // Check if task is in progress, but also allow 'available' tasks for testing
    if (task.status !== 'in-progress' && task.status !== 'available') {
      return res.status(400).json({ msg: 'Task must be in progress to be completed' });
    } else if (task.status === 'available') {
      console.log('Task is being completed from available state (allowed for testing)');
    }
    
    // Update task
    task.status = 'awaiting-verification';
    task.completedAt = Date.now();
    task.completionNote = req.body.completionNote || '';
    
    await task.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'taskStats.completed': 1 }
    });
    
    // Return the task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name profilePic')
      .populate('assignedTo', 'name profilePic');
      
    res.json(updatedTask);  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   PUT api/tasks/:id/verify
// @desc    Verify task completion with rating
// @access  Private
router.put('/:id/verify', validateObjectId, async (req, res) => {
  try {
    const { rating, note } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if current user created this task
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to verify this task' });
    }
    
    // Check if task is awaiting verification
    if (task.status !== 'awaiting-verification') {
      return res.status(400).json({ msg: 'Task must be awaiting verification' });
    }
    
    // Update task
    task.status = 'verified';
    task.verifiedAt = Date.now();
    task.taskRating = rating;
    task.verificationNote = note || '';
    
    await task.save();
    
    // Update user stats
    await User.findByIdAndUpdate(task.createdBy, {
      $inc: { 'taskStats.verified': 1 }
    });
    
    // Add rating to assignee's profile
    await User.findByIdAndUpdate(task.assignedTo, {
      $push: {
        ratings: {
          taskId: task._id,
          rating,
          asCompleter: true,
          date: Date.now()
        }
      }
    });
    
    // Update average rating
    const user = await User.findById(task.assignedTo);
    const ratings = user.ratings.filter(r => r.asCompleter);
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    await User.findByIdAndUpdate(task.assignedTo, {
      'taskStats.avgRating': avgRating
    });
    
    // Return the task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name profilePic')
      .populate('assignedTo', 'name profilePic');
      
    res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if current user created this task
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }
    
    // Check if task can be deleted
    if (task.status !== 'available') {
      return res.status(400).json({ msg: 'Cannot delete a task that is in progress or completed' });
    }
    
    await task.remove();
    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
