// Create sample tasks for testing my-tasks functionality
const fetch = require('node-fetch');

async function createSampleTasks() {
    try {
        console.log('Creating sample tasks for testing...');
        
        // Login first to get token
        const loginResponse = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword'
            })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed');
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful');
          // Create sample tasks
        const sampleTasks = [
            {
                title: "Fix Leaky Faucet",
                description: "Need someone to fix a leaky kitchen faucet",
                timeWindow: 120, // 2 hours in minutes
                type: "repairs",
                location: "123 Main St, Anytown, USA"
            },
            {
                title: "Grocery Shopping",
                description: "Need someone to pick up groceries from the store",
                timeWindow: 60, // 1 hour in minutes
                type: "errand",
                location: "456 Oak Ave, Anytown, USA"
            },
            {
                title: "Dog Walking",
                description: "Need someone to walk my dog for 30 minutes",
                timeWindow: 30, // 30 minutes
                type: "assistance",
                location: "789 Pine Rd, Anytown, USA"
            }
        ];
        
        for (let i = 0; i < sampleTasks.length; i++) {
            const task = sampleTasks[i];
            console.log(`Creating task ${i + 1}: ${task.title}...`);
            
            const response = await fetch('http://localhost:3000/api/tasks', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });
            
            if (response.ok) {
                const createdTask = await response.json();
                console.log(`✅ Created task: ${createdTask.title}`);
            } else {
                const error = await response.text();
                console.log(`❌ Failed to create task: ${error}`);
            }
        }
        
        // Test the my-tasks endpoint again
        console.log('\nTesting my-tasks endpoint with sample data...');
        const myTasksResponse = await fetch('http://localhost:3000/api/tasks/my-tasks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (myTasksResponse.ok) {
            const tasks = await myTasksResponse.json();
            console.log(`✅ My-tasks endpoint returned ${tasks.length} tasks`);
            tasks.forEach((task, index) => {
                console.log(`  ${index + 1}. ${task.title} (${task.status})`);
            });
        } else {
            console.log('❌ My-tasks endpoint failed');
        }
        
    } catch (error) {
        console.error('Error creating sample tasks:', error);
    }
}

createSampleTasks();
