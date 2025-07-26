// Test task loading functionality
async function testTaskLoading() {
    console.log('🧪 Testing task loading functionality...');
    
    try {
        console.log('1. Testing API endpoint directly...');
        
        const response = await fetch('http://localhost:3000/api/tasks');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const tasks = await response.json();
        console.log(`✅ Successfully loaded ${tasks.length} tasks from API`);
        
        console.log('\n📋 Tasks loaded:');
        tasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.title}`);
            console.log(`   Status: ${task.status} | Time: ${task.timeWindow} min`);
            console.log(`   Created by: ${task.createdBy ? task.createdBy.name : 'Unknown'}`);
            console.log(`   ID: ${task._id}`);
            console.log('');
        });
        
        console.log('2. Testing status endpoint...');
        const statusResponse = await fetch('http://localhost:3000/api/status');
        const statusData = await statusResponse.json();
        console.log('✅ Status endpoint working:', statusData);
        
        console.log('\n🎉 All API tests passed!');
        console.log('The dashboard should now be able to load tasks successfully.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Make sure the server is running on port 3000');
    }
}

testTaskLoading();
