// Test script for rewards API integration

// Wait for the DOM to be loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Testing rewards API integration...');
    
    // Create a test container
    const container = document.createElement('div');
    container.className = 'test-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff;
        border: 2px solid #333;
        padding: 20px;
        width: 300px;
        z-index: 9999;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border-radius: 8px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    container.innerHTML = `
        <h3>Rewards API Test</h3>
        <div id="test-results"></div>
        <button id="run-tests" class="primary-button">Run Tests</button>
    `;
    
    document.body.appendChild(container);
    
    // Add test results
    const resultsContainer = document.getElementById('test-results');
    const runTestsButton = document.getElementById('run-tests');
    
    // Test functions
    const tests = {        async testLogin() {
            const email = 'test@example.com';
            const password = 'password123';
              try {
                // Two-pass strategy: try login first, if that fails try registration
                try {
                    // First attempt: Log in
                    console.log('Attempting to login with:', email);
                    const result = await Auth.login(email, password);
                      // Ensure token is properly stored
                    if (!result.token) {
                        console.error('No token received from login');
                        throw new Error('Login successful but no token received');
                    }
                    
                    // Analyze token structure for debugging
                    try {
                        const parts = result.token.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            console.log('Token payload:', payload);
                            if (!payload.id) {
                                console.warn('WARNING: Token payload is missing id property');
                            }
                        } else {
                            console.warn('WARNING: Token is not in expected JWT format');
                        }
                    } catch (e) {
                        console.error('Error analyzing token:', e);
                    }
                    
                    localStorage.setItem('taskhive_token', result.token);
                    localStorage.setItem('taskhive_user', JSON.stringify(result.user));
                    
                    console.log('Login successful');
                    return {
                        success: true,
                        message: `Login successful: ${result.user.name}`,
                        data: result
                    };
                } catch (loginError) {
                    console.log('Login failed:', loginError.message);
                    
                    // Second attempt: Register a new account
                    try {
                        console.log('Attempting to register new account');
                        const registerResult = await Auth.register('Test User', email, password);
                        
                        localStorage.setItem('taskhive_token', registerResult.token);
                        localStorage.setItem('taskhive_user', JSON.stringify(registerResult.user));
                        
                        console.log('Registration successful');
                        return {
                            success: true,
                            message: `Created new test account: ${registerResult.user.name}`,
                            data: registerResult
                        };
                    } catch (registerError) {
                        // If we get "already exists" error, the issue is with the password
                        if (registerError.message && registerError.message.includes('already exists')) {
                            console.log('Account exists but credentials are wrong, using default password');
                            
                            // Try with a known password for testing
                            const forcedLoginResult = await Auth.login(email, 'password123');
                            
                            localStorage.setItem('taskhive_token', forcedLoginResult.token);
                            localStorage.setItem('taskhive_user', JSON.stringify(forcedLoginResult.user));
                            
                            return {
                                success: true,
                                message: `Forced login successful: ${forcedLoginResult.user.name}`,
                                data: forcedLoginResult
                            };
                        } else {
                            throw registerError;
                        }
                    }
                }
            } catch (finalError) {
                console.error('All login/register attempts failed:', finalError);
                return {
                    success: false,
                    message: `Failed to login/register: ${finalError.message}`
                };
            }
        },
        
        async testGetRewards() {
            try {
                if (!Auth.isAuthenticated()) {
                    const loginResult = await this.testLogin();
                    if (!loginResult.success) {
                        return {
                            success: false,
                            message: 'Authentication required: ' + loginResult.message
                        };
                    }
                }
                  const response = await fetch(`http://localhost:5000/api/rewards`, {
                    headers: Auth.getAuthHeaders()
                });
                
                let data;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        const text = await response.text();
                        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
                    }
                } catch (parseError) {
                    throw new Error(`Failed to parse response: ${parseError.message}`);
                }
                
                return {
                    success: response.ok,
                    message: `Fetched rewards data: ${JSON.stringify(data).substring(0, 100)}...`,
                    data: data
                };
            } catch (error) {
                return {
                    success: false,
                    message: `Failed to get rewards: ${error.message}`
                };
            }
        },
        
        async testCalculateReward() {
            try {
                if (!Auth.isAuthenticated()) {
                    const loginResult = await this.testLogin();
                    if (!loginResult.success) {
                        return {
                            success: false,
                            message: 'Authentication required: ' + loginResult.message
                        };
                    }
                }                // Create a test task to calculate reward for
                const headers = Auth.getAuthHeaders();
                console.log('Auth headers being sent:', headers);
                
                if (!headers['x-auth-token']) {
                    console.error('No auth token found in headers!');
                    throw new Error('Authentication token is missing - please login again');
                }
                
                const taskResponse = await fetch(`http://localhost:5000/api/tasks`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        title: 'Test Task for Reward Calculation',
                        description: 'This is a test task to calculate rewards for',
                        timeWindow: 60,
                        type: 'delivery',
                        locationCoords: {
                            latitude: null,
                            longitude: null,
                            address: null
                        }
                    })
                });
                
                if (!taskResponse.ok) {
                    const contentType = taskResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await taskResponse.json();
                        throw new Error(`Failed to create test task: ${errorData.msg || taskResponse.status}`);
                    } else {
                        const text = await taskResponse.text();
                        throw new Error(`Failed to create test task: ${taskResponse.status} - ${text.substring(0, 100)}`);
                    }
                }
                
                let task;
                try {
                    task = await taskResponse.json();
                } catch (parseError) {
                    throw new Error(`Failed to parse task response: ${parseError.message}`);
                }
                
                // Calculate reward for the task
                const rewardResponse = await fetch(`http://localhost:5000/api/rewards/calculate`, {
                    method: 'POST',
                    headers: Auth.getAuthHeaders(),
                    body: JSON.stringify({
                        taskId: task._id
                    })
                });
                
                if (!rewardResponse.ok) {
                    throw new Error(`Failed to calculate reward: ${rewardResponse.status}`);
                }
                
                const rewardData = await rewardResponse.json();
                
                return {
                    success: true,
                    message: `Calculated reward: $${rewardData.reward}`,
                    data: { task, reward: rewardData.reward }
                };
            } catch (error) {
                return {
                    success: false,
                    message: `Failed to calculate reward: ${error.message}`
                };
            }
        },
        
        async testAddReward() {
            try {
                if (!Auth.isAuthenticated()) {
                    const loginResult = await this.testLogin();
                    if (!loginResult.success) {
                        return {
                            success: false,
                            message: 'Authentication required: ' + loginResult.message
                        };
                    }
                }
                
                const userId = Auth.getCurrentUser().id;
                  // First create a task
                const taskResponse = await fetch(`http://localhost:5000/api/tasks`, {
                    method: 'POST',
                    headers: Auth.getAuthHeaders(),
                    body: JSON.stringify({
                        title: 'Test Task for Adding Reward',
                        description: 'This is a test task to add rewards for',
                        timeWindow: 60,
                        type: 'delivery',
                        locationCoords: {
                            latitude: null,
                            longitude: null,
                            address: null
                        }
                    })
                });
                
                if (!taskResponse.ok) {
                    const contentType = taskResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await taskResponse.json();
                        throw new Error(`Failed to create test task: ${errorData.msg || taskResponse.status}`);
                    } else {
                        const text = await taskResponse.text();
                        throw new Error(`Failed to create test task: ${taskResponse.status} - ${text.substring(0, 100)}`);
                    }
                }
                
                let task;
                try {
                    task = await taskResponse.json();
                } catch (parseError) {
                    throw new Error(`Failed to parse task response: ${parseError.message}`);
                }
                  // Assign the task to the current user (hack for testing)
                const updateResponse = await fetch(`http://localhost:5000/api/tasks/${task._id}/accept`, {
                    method: 'PUT',
                    headers: Auth.getAuthHeaders()
                });
                
                if (!updateResponse.ok) {
                    // Try to get more information about the error
                    try {
                        const contentType = updateResponse.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const errorData = await updateResponse.json();
                            throw new Error(`Failed to assign task: ${updateResponse.status} - ${errorData.msg || 'Unknown error'}`);
                        } else {
                            const text = await updateResponse.text();
                            throw new Error(`Failed to assign task: ${updateResponse.status} - ${text.substring(0, 100)}`);
                        }
                    } catch (detailError) {
                        throw new Error(`Failed to assign task: ${updateResponse.status}`);
                    }
                }
                
                // Complete the task
                const completeResponse = await fetch(`http://localhost:5000/api/tasks/${task._id}/complete`, {
                    method: 'PUT',
                    headers: Auth.getAuthHeaders(),
                    body: JSON.stringify({
                        completionNote: 'Completed for testing'
                    })
                });
                
                if (!completeResponse.ok) {
                    throw new Error(`Failed to complete task: ${completeResponse.status}`);
                }
                
                // Add reward (requires task to be completed)
                const rewardAmount = 10.50;
                const rewardResponse = await fetch(`http://localhost:5000/api/rewards/add`, {
                    method: 'POST',
                    headers: Auth.getAuthHeaders(),
                    body: JSON.stringify({
                        taskId: task._id,
                        userId: userId,
                        amount: rewardAmount
                    })
                });
                
                if (!rewardResponse.ok) {
                    throw new Error(`Failed to add reward: ${rewardResponse.status}`);
                }
                
                const rewardData = await rewardResponse.json();
                
                return {
                    success: true,
                    message: `Added reward: $${rewardAmount}`,
                    data: rewardData
                };
            } catch (error) {
                return {
                    success: false,
                    message: `Failed to add reward: ${error.message}`
                };
            }
        },
        
        // Test that the RewardsSystem on the client works as expected
        async testRewardsSystem() {
            try {
                if (!window.RewardsSystem) {
                    return {
                        success: false,
                        message: 'RewardsSystem not found in window'
                    };
                }
                
                if (!Auth.isAuthenticated()) {
                    const loginResult = await this.testLogin();
                    if (!loginResult.success) {
                        return {
                            success: false,
                            message: 'Authentication required: ' + loginResult.message
                        };
                    }
                }
                  // Test getUserRewardsData method
                const currentUser = Auth.getCurrentUser();
                console.log('Test rewards system with user:', currentUser);
                
                if (!currentUser || !currentUser.id) {
                    console.error('Current user is missing or has no id');
                    return {
                        success: false,
                        message: 'Invalid current user data'
                    };
                }
                
                const rewards = await RewardsSystem.getUserRewardsData(currentUser.id);
                
                if (!rewards) {
                    return {
                        success: false,
                        message: 'Failed to get user rewards data'
                    };
                }
                
                return {
                    success: true,
                    message: `RewardsSystem integration working: Balance $${rewards.availableBalance.toFixed(2)}`,
                    data: rewards
                };
            } catch (error) {
                return {
                    success: false,
                    message: `RewardsSystem test failed: ${error.message}`
                };
            }
        }
    };
    
    // Run all tests
    async function runTests() {
        resultsContainer.innerHTML = '<p>Running tests...</p>';
        
        const testResults = [];
        for (const [testName, testFunction] of Object.entries(tests)) {
            resultsContainer.innerHTML += `<p>Running ${testName}...</p>`;
            console.log(`Running test: ${testName}`);
            
            try {
                const result = await testFunction.call(tests);
                testResults.push({
                    name: testName,
                    ...result
                });
                
                resultsContainer.innerHTML += `
                    <div class="test-result ${result.success ? 'success' : 'failure'}">
                        <h4>${testName}</h4>
                        <p>${result.message}</p>
                    </div>
                `;
                
                console.log(`Test ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
                console.log(result.message);
                if (result.data) console.log(result.data);
            } catch (error) {
                testResults.push({
                    name: testName,
                    success: false,
                    message: `Error: ${error.message}`
                });
                
                resultsContainer.innerHTML += `
                    <div class="test-result failure">
                        <h4>${testName}</h4>
                        <p>Error: ${error.message}</p>
                    </div>
                `;
                
                console.error(`Test ${testName} error:`, error);
            }
        }
        
        // Add summary
        const successCount = testResults.filter(r => r.success).length;
        const totalCount = testResults.length;
        
        resultsContainer.innerHTML += `
            <div class="test-summary">
                <h4>Summary</h4>
                <p>${successCount} of ${totalCount} tests passed</p>
            </div>
        `;
        
        console.log(`Tests complete: ${successCount}/${totalCount} passed`);
    }
      // Add click handler to run tests
    runTestsButton.addEventListener('click', runTests);
    
    // Add view rewards button handler if it exists
    const viewRewardsButton = document.getElementById('view-rewards');
    if (viewRewardsButton) {
        viewRewardsButton.addEventListener('click', async () => {
            if (window.RewardsSystem && Auth.isAuthenticated()) {
                await RewardsSystem.showRewardsModal();
            } else {
                alert('Please log in first and run tests before viewing rewards.');
            }
        });
    }
    
    // Add some basic styling for test results
    const style = document.createElement('style');
    style.textContent = `
        .test-result {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 4px;
        }
        .test-result.success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
        }
        .test-result.failure {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
        }
        .test-result h4 {
            margin-top: 0;
            margin-bottom: 5px;
        }
        .test-summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #e2e3e5;
            border: 1px solid #d6d8db;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
});
