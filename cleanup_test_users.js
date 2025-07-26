// Clean up test users from MongoDB
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskhive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define User Schema (same as in server.js)
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

async function cleanupTestUsers() {
    try {
        console.log('🧹 Cleaning up test users...');
        
        // Delete test users (those with test emails)
        const testEmailPatterns = [
            /test@example\.com/,
            /debug@example\.com/,
            /networktest@example\.com/,
            /comprehensive\.test\./,
            /auth\./,
            /\.test\./
        ];
        
        let totalDeleted = 0;
        
        for (const pattern of testEmailPatterns) {
            const result = await User.deleteMany({ email: { $regex: pattern } });
            console.log(`Deleted ${result.deletedCount} users matching pattern: ${pattern}`);
            totalDeleted += result.deletedCount;
        }
        
        console.log(`✅ Total test users deleted: ${totalDeleted}`);
        
        // List remaining users
        const remainingUsers = await User.find({}, 'name email createdAt').limit(20);
        console.log(`\n📋 Remaining users (${remainingUsers.length} shown):`)
        remainingUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - ${user.createdAt.toLocaleDateString()}`);
        });
        
    } catch (error) {
        console.error('❌ Error cleaning up test users:', error);
    } finally {
        mongoose.disconnect();
    }
}

cleanupTestUsers();
