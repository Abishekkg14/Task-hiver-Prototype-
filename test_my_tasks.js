// Test script for my-tasks endpoint
const fetch = require('node-fetch');

async function testMyTasks() {
    try {
        console.log('Testing my-tasks endpoint...');
          // First, try to login to get a valid token
        console.log('1. Attempting to login...');
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
            console.log('Login failed, creating test user...');
            
            // Try to create a test user
            const signupResponse = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'testpassword'
                })
            });
            
            if (signupResponse.ok) {
                console.log('Test user created successfully');
                
                // Try login again
                const secondLoginResponse = await fetch('http://localhost:3000/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'testpassword'
                    })
                });
                
                if (secondLoginResponse.ok) {
                    const loginData = await secondLoginResponse.json();
                    console.log('Login successful after signup');
                    await testMyTasksEndpoint(loginData.token);
                } else {
                    console.log('Login failed after signup');
                }
            } else {
                const signupError = await signupResponse.text();
                console.log('Signup failed:', signupError);
            }
        } else {
            const loginData = await loginResponse.json();
            console.log('Login successful');
            await testMyTasksEndpoint(loginData.token);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

async function testMyTasksEndpoint(token) {
    try {
        console.log('2. Testing my-tasks endpoint...');
        
        const response = await fetch('http://localhost:3000/api/tasks/my-tasks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const tasks = await response.json();
            console.log('✅ My-tasks endpoint working!');
            console.log('Number of tasks returned:', tasks.length);
            if (tasks.length > 0) {
                console.log('Sample task:', JSON.stringify(tasks[0], null, 2));
            }
        } else {
            const errorText = await response.text();
            console.log('❌ My-tasks endpoint failed:');
            console.log('Error:', errorText);
        }
        
    } catch (error) {
        console.error('My-tasks test error:', error);
    }
}

// Run the test
testMyTasks();
