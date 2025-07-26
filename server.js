// TaskHive Backend Server
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Middleware
app.use(express.json());
app.use(cors());

// Error Handler - ensure all errors are returned as JSON
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    msg: 'Server error',
    error: err.message || 'Internal server error'
  });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Define API routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes with auth middleware
const auth = require('./middleware/auth');
app.use('/api/tasks', auth, require('./routes/tasks'));
app.use('/api/rewards', auth, require('./routes/rewards'));

// Specific route for welcomepage1.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcomepage1.html'));
});

// Additional route for welcome page
app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'welcomepage1.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskhive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// JWT middleware is now in middleware/auth.js

// Routes are now in separate files in the routes directory

// Health Check / Status endpoint
app.get('/api/status', (req, res) => {
    const state = mongoose.connection.readyState;
    let status;
    
    switch (state) {
        case 0: status = 'Disconnected'; break;
        case 1: status = 'Connected'; break;
        case 2: status = 'Connecting'; break;
        case 3: status = 'Disconnecting'; break;
        default: status = 'Unknown';
    }
    
    res.json({
        connected: state === 1,
        status: status,
        database: mongoose.connection.name || 'Not connected',
        host: mongoose.connection.host || 'Not connected',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
