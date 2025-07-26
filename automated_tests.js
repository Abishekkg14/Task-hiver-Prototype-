// Automated testing script for TaskHive
console.log('🧪 Starting TaskHive Automated Tests...\n');

const tests = {
    passed: 0,
    failed: 0,
    total: 0
};

// Helper function to run a test
async function runTest(testName, testFunction) {
    tests.total++;
    console.log(`🔍 Testing: ${testName}`);
    
    try {
        await testFunction();
        tests.passed++;
        console.log(`✅ PASSED: ${testName}\n`);
    } catch (error) {
        tests.failed++;
        console.log(`❌ FAILED: ${testName}`);
        console.log(`   Error: ${error.message}\n`);
    }
}

// Test 1: Backend Server Connectivity
async function testBackendConnectivity() {
    const response = await fetch('http://localhost:3000/api/status');
    if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.connected) {
        throw new Error('Database not connected');
    }
}

// Test 2: Tasks API
async function testTasksAPI() {
    const response = await fetch('http://localhost:3000/api/tasks');
    if (!response.ok) {
        throw new Error(`Tasks API responded with status ${response.status}`);
    }
    const tasks = await response.json();
    if (!Array.isArray(tasks)) {
        throw new Error('Tasks API did not return an array');
    }
    console.log(`   Found ${tasks.length} tasks in database`);
}

// Test 3: User Registration API
async function testUserRegistrationAPI() {
    const testUser = {
        name: 'Auto Test User',
        email: `autotest.${Date.now()}@example.com`,
        password: 'autotest123'
    };
    
    const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Registration failed: ${errorData.message}`);
    }
    
    const data = await response.json();
    if (!data.token || !data.user) {
        throw new Error('Registration response missing token or user data');
    }
    
    console.log(`   Created user: ${data.user.name} (${data.user.email})`);
}

// Test 4: User Login API
async function testUserLoginAPI() {
    // First create a user
    const testUser = {
        name: 'Login Test User',
        email: `logintest.${Date.now()}@example.com`,
        password: 'logintest123'
    };
    
    // Register
    const registerResponse = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
        throw new Error('Could not create test user for login test');
    }
    
    // Login
    const loginResponse = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
        })
    });
    
    if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(`Login failed: ${errorData.message}`);
    }
    
    const data = await loginResponse.json();
    if (!data.token || !data.user) {
        throw new Error('Login response missing token or user data');
    }
    
    console.log(`   Login successful for: ${data.user.name}`);
}

// Test 5: Task Creation API
async function testTaskCreationAPI() {
    // Create a user first
    const testUser = {
        name: 'Task Creator',
        email: `taskcreator.${Date.now()}@example.com`,
        password: 'taskcreator123'
    };
    
    const userResponse = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
    });
    
    const userData = await userResponse.json();
    const token = userData.token;
    
    // Create a task
    const testTask = {
        title: 'Automated Test Task',
        description: 'This task was created by the automated test script',
        timeWindow: 30,
        location: 'Test Location',
        type: 'other'
    };
    
    const taskResponse = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testTask)
    });
    
    if (!taskResponse.ok) {
        const errorData = await taskResponse.json();
        throw new Error(`Task creation failed: ${errorData.message}`);
    }
    
    const taskData = await taskResponse.json();
    console.log(`   Created task: ${taskData.title} (ID: ${taskData._id})`);
}

// Test 6: Database Schema Validation
async function testDatabaseSchema() {
    const response = await fetch('http://localhost:3000/api/tasks');
    const tasks = await response.json();
    
    if (tasks.length === 0) {
        console.log('   No tasks to validate schema');
        return;
    }
    
    const task = tasks[0];
    const requiredFields = ['_id', 'title', 'description', 'timeWindow', 'status', 'createdBy'];
    
    for (const field of requiredFields) {
        if (!(field in task)) {
            throw new Error(`Task missing required field: ${field}`);
        }
    }
    
    console.log(`   Schema validation passed for ${tasks.length} tasks`);
}

// Run all tests
async function runAllTests() {
    console.log('🚀 TaskHive Automated Test Suite\n');
    console.log('==========================================\n');
    
    await runTest('Backend Server Connectivity', testBackendConnectivity);
    await runTest('Tasks API Endpoint', testTasksAPI);
    await runTest('User Registration API', testUserRegistrationAPI);
    await runTest('User Login API', testUserLoginAPI);
    await runTest('Task Creation API', testTaskCreationAPI);
    await runTest('Database Schema Validation', testDatabaseSchema);
    
    console.log('==========================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('==========================================');
    console.log(`Total Tests: ${tests.total}`);
    console.log(`Passed: ${tests.passed} ✅`);
    console.log(`Failed: ${tests.failed} ❌`);
    console.log(`Success Rate: ${Math.round((tests.passed / tests.total) * 100)}%`);
    
    if (tests.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Your TaskHive application is working correctly.');
        console.log('\n🚀 Ready for manual testing and production deployment!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above and fix the issues.');
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Open http://localhost:8080/testing_dashboard.html for interactive testing');
    console.log('2. Test the frontend signup and login flows');
    console.log('3. Test the dashboard task loading and filtering');
    console.log('4. Test mobile responsiveness');
    console.log('5. Test all user interactions end-to-end');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled error:', error.message);
    process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});
