// Create sample tasks for testing
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskhive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define schemas (same as in server.js)
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

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    timeWindow: {
        type: Number,
        required: true,
        min: 5
    },
    location: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['delivery', 'errand', 'assistance', 'repairs', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['available', 'in-progress', 'awaiting-verification', 'verified', 'completed'],
        default: 'available'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    startTime: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

async function createSampleTasks() {
    try {
        console.log('🏗️ Creating sample tasks...');
        
        // Find any existing user or create a sample user
        let sampleUser = await User.findOne();
        
        if (!sampleUser) {
            console.log('No users found, creating sample user...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('sample123', salt);
            
            sampleUser = new User({
                name: 'Sample TaskHive User',
                email: 'sample@taskhive.com',
                password: hashedPassword
            });
            
            await sampleUser.save();
            console.log('✅ Sample user created');
        }
        
        // Check if sample tasks already exist
        const existingTasks = await Task.find({ title: { $regex: /^Sample/ } });
        if (existingTasks.length > 0) {
            console.log('Sample tasks already exist. Deleting old ones...');
            await Task.deleteMany({ title: { $regex: /^Sample/ } });
        }
        
        // Create sample tasks
        const sampleTasks = [
            {
                title: 'Sample: Pick up groceries from store',
                description: 'Need someone to pick up my grocery order from Whole Foods. It\'s already paid for, just need pickup. Should take about 30 minutes including travel time.',
                timeWindow: 30,
                location: '123 Main St, Downtown',
                type: 'errand',
                status: 'available',
                createdBy: sampleUser._id
            },
            {
                title: 'Sample: Deliver package to post office',
                description: 'Need someone to take my pre-paid package to the post office. It\'s not heavy, just a small box with important documents.',
                timeWindow: 45,
                location: 'Post Office, 456 Oak Ave',
                type: 'delivery',
                status: 'available',
                createdBy: sampleUser._id
            },
            {
                title: 'Sample: Return library books',
                description: 'Need someone to return three books to the university library before closing time at 6pm. They\'re not overdue yet but close to it.',
                timeWindow: 60,
                location: 'University Library, Campus Center',
                type: 'errand',
                status: 'available',
                createdBy: sampleUser._id
            },
            {
                title: 'Sample: Help move furniture',
                description: 'Need help moving a small couch and coffee table to a friend\'s apartment. It\'s just one floor up and both locations have parking.',
                timeWindow: 90,
                location: '789 Pine St, Apartment 2B',
                type: 'assistance',
                status: 'in-progress',
                createdBy: sampleUser._id
            },
            {
                title: 'Sample: Fix leaky faucet',
                description: 'Kitchen faucet has been dripping constantly. I have the replacement parts, just need someone with basic plumbing skills to install them.',
                timeWindow: 120,
                location: '321 Elm Dr, House #4',
                type: 'repairs',
                status: 'awaiting-verification',
                createdBy: sampleUser._id
            },
            {
                title: 'Sample: Walk my dog',
                description: 'My golden retriever needs a 30-minute walk while I\'m in a meeting. He\'s very friendly and well-behaved. I\'ll provide leash and treats.',
                timeWindow: 30,
                location: '555 Maple Ave, Apt 12',
                type: 'assistance',
                status: 'available',
                createdBy: sampleUser._id
            }
        ];
        
        // Insert sample tasks
        const createdTasks = await Task.insertMany(sampleTasks);
        console.log(`✅ Created ${createdTasks.length} sample tasks`);
        
        // Display created tasks
        const tasks = await Task.find({ title: { $regex: /^Sample/ } }).populate('createdBy', 'name email');
        console.log('\n📋 Sample tasks created:');
        tasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.title}`);
            console.log(`   Status: ${task.status} | Time: ${task.timeWindow} min | Type: ${task.type}`);
            console.log(`   Created by: ${task.createdBy.name}`);
        });
        
        console.log('\n🎉 Sample tasks setup complete!');
        console.log('You can now test the dashboard task loading functionality.');
        
    } catch (error) {
        console.error('❌ Error creating sample tasks:', error);
    } finally {
        mongoose.disconnect();
    }
}

createSampleTasks();
