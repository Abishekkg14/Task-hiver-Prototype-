const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Generate JWT token - ensure id is included directly in the payload
    const payload = {
      id: user.id,  // This is critical - the id must be in the root of the payload
      name: user.name,
      email: user.email
    };

    // Log the payload for debugging
    console.log('Creating JWT with payload for registration:', payload);

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        // Log the token
        console.log('Token generated after registration:', token.substring(0, 20) + '...');
        
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }    // Generate JWT token - ensure id is included directly in the payload
    const payload = {
      id: user.id,  // This is critical - the id must be in the root of the payload
      name: user.name,
      email: user.email
    };

    // Log the payload for debugging
    console.log('Creating JWT with payload for login:', payload);

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        // Log the token
        console.log('Token generated after login:', token.substring(0, 20) + '...');
        
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', async (req, res) => {
  try {
    // Get user from database without password
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
