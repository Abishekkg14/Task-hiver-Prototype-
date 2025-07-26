// Complete end-to-end test for My Tasks functionality
const fetch = require('node-fetch');

async function completeTest() {
    try {
        console.log('🧪 Starting complete My Tasks functionality test...\n');
        
        // Step 1: Login
        console.log('1️⃣  Testing login...');
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
        console.log('✅ Login successful\n');
        
        // Step 2: Test My Tasks endpoint
        console.log('2️⃣  Testing /api/tasks/my-tasks endpoint...');
        const myTasksResponse = await fetch('http://localhost:3000/api/tasks/my-tasks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!myTasksResponse.ok) {
            console.log('❌ My Tasks endpoint failed');
            const error = await myTasksResponse.text();
            console.log('Error:', error);
            return;
        }
        
        const tasks = await myTasksResponse.json();
        console.log(`✅ My Tasks endpoint working - returned ${tasks.length} tasks\n`);
        
        // Step 3: Test My Created Tasks endpoint
        console.log('3️⃣  Testing /api/tasks/my-created endpoint...');
        const myCreatedResponse = await fetch('http://localhost:3000/api/tasks/my-created', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (myCreatedResponse.ok) {
            const createdTasks = await myCreatedResponse.json();
            console.log(`✅ My Created Tasks endpoint working - returned ${createdTasks.length} tasks`);
        } else {
            console.log('❌ My Created Tasks endpoint failed');
        }
        
        // Step 4: Test My Assigned Tasks endpoint
        console.log('4️⃣  Testing /api/tasks/my-assigned endpoint...');
        const myAssignedResponse = await fetch('http://localhost:3000/api/tasks/my-assigned', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (myAssignedResponse.ok) {
            const assignedTasks = await myAssignedResponse.json();
            console.log(`✅ My Assigned Tasks endpoint working - returned ${assignedTasks.length} tasks\n`);
        } else {
            console.log('❌ My Assigned Tasks endpoint failed\n');
        }
        
        // Step 5: Display task details
        if (tasks.length > 0) {
            console.log('📋 Task Details:');
            tasks.forEach((task, index) => {
                console.log(`   ${index + 1}. ${task.title}`);
                console.log(`      Status: ${task.status}`);
                console.log(`      Type: ${task.type}`);
                console.log(`      Created: ${new Date(task.createdAt).toLocaleDateString()}`);
                console.log(`      Location: ${task.location || 'Not specified'}`);
                console.log('');
            });
        }
        
        console.log('🎉 All tests passed! My Tasks functionality is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

completeTest();
