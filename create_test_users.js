// Script to create test users for TaskHive
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskhive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Test users to create
const testUsers = [
    {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        bio: 'This is a test user account'
    },
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        bio: 'This is an admin test account'
    }
];

// Create users
async function createUsers() {
    try {
        console.log('Creating test users...');
        
        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            
            if (existingUser) {
                console.log(`User ${userData.email} already exists - skipping`);
                continue;
            }
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            
            // Create user
            const user = new User({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role || 'user',
                bio: userData.bio || '',
                profilePic: userData.profilePic || `https://placehold.co/100x100/orange/white?text=${userData.name[0]}`,
                taskStats: {
                    created: 0,
                    completed: 0,
                    verified: 0,
                    avgRating: 0
                },
                ratings: []
            });
            
            await user.save();
            console.log(`Created user: ${userData.email}`);
        }
        
        console.log('Test users created successfully');
    } catch (err) {
        console.error('Error creating test users:', err);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
}

// Run the function
createUsers();
