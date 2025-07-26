// TaskHive Rewards System Test Script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Testing the enhanced rewards integration...');
    
    // Array to track test results
    const testResults = [];
    
    // Function to add test result
    function addTestResult(name, passed, message) {
        console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
        testResults.push({ name, passed, message });
        
        // Add to UI if container exists
        const container = document.getElementById('test-results-container');
        if (container) {
            const resultElement = document.createElement('div');
            resultElement.className = `test-result ${passed ? 'test-pass' : 'test-fail'}`;
            resultElement.innerHTML = `
                <span class="test-icon">${passed ? '✅' : '❌'}</span>
                <span class="test-name">${name}</span>
                <span class="test-message">${message}</span>
            `;
            container.appendChild(resultElement);
        }
    }
    
    // Test login functionality first
    async function testLogin() {
        try {
            console.log('Testing login...');
            // Try with test user credentials
            const email = 'test@example.com';
            const password = 'password123';
            
            const result = await Auth.login(email, password);
            
            if (!result || !result.token) {
                throw new Error('Login failed or no token received');
            }
            
            addTestResult('User Authentication', true, `Logged in successfully as ${result.user.name}`);
            return result.user;
        } catch (error) {
            console.error('Login test failed:', error.message);
            addTestResult('User Authentication', false, `Login failed: ${error.message}`);
            
            // Try to create a test user if login failed
            try {
                console.log('Attempting to register a test user...');
                const result = await Auth.register('Test User', 'test@example.com', 'password123');
                
                if (!result || !result.token) {
                    throw new Error('Registration failed');
                }
                
                addTestResult('User Registration', true, 'Created test user successfully');
                return result.user;
            } catch (regError) {
                addTestResult('User Registration', false, `Failed to create test user: ${regError.message}`);
                return null;
            }
        }
    }
    
    // Test reward initialization
    async function testRewardsInitialization() {
        try {
            console.log('Testing rewards initialization...');
            
            // Check if RewardsSystem is available
            if (typeof RewardsSystem === 'undefined') {
                throw new Error('RewardsSystem not found in global scope');
            }
            
            // Initialize rewards system
            await RewardsSystem.init();
            
            // Get rewards data
            const rewardsData = await RewardsSystem.getUserRewardsData();
            
            if (!rewardsData) {
                throw new Error('Failed to get rewards data');
            }
            
            addTestResult('Rewards Initialization', true, 'Rewards system initialized successfully');
            return rewardsData;
        } catch (error) {
            console.error('Rewards initialization test failed:', error.message);
            addTestResult('Rewards Initialization', false, `Initialization failed: ${error.message}`);
            return null;
        }
    }
    
    // Test reward calculation
    async function testRewardCalculation() {
        try {
            console.log('Testing reward calculation...');
            
            // Create a sample task to test reward calculation
            const sampleTask = {
                _id: 'test_task_id',
                title: 'Test Task for Reward Calculation',
                description: 'This is a test task to check if the reward calculation works properly.',
                type: 'errand',
                createdAt: new Date(Date.now() - 3600000), // 1 hour ago
                completedAt: new Date(),
                completionNote: 'Task completed successfully for testing'
            };
            
            const rewardAmount = await RewardsSystem.calculateReward(sampleTask);
            
            if (isNaN(rewardAmount) || rewardAmount <= 0) {
                throw new Error(`Invalid reward amount calculated: ${rewardAmount}`);
            }
            
            addTestResult('Reward Calculation', true, `Calculated reward amount: $${rewardAmount.toFixed(2)}`);
            return rewardAmount;
        } catch (error) {
            console.error('Reward calculation test failed:', error.message);
            addTestResult('Reward Calculation', false, `Calculation failed: ${error.message}`);
            return null;
        }
    }
    
    // Test reward processing
    async function testRewardProcessing() {
        try {
            console.log('Testing reward processing...');
            
            // Create a sample verified task
            const sampleTask = {
                _id: 'test_task_id_' + Date.now(),
                title: 'Test Task for Reward Processing',
                description: 'This is a test task to check if reward processing works properly.',
                type: 'errand',
                createdAt: new Date(Date.now() - 3600000), // 1 hour ago
                completedAt: new Date(),
                completionNote: 'Task completed successfully for testing',
                verified: true,
                verifiedAt: new Date()
            };
            
            // Process the reward
            const result = await RewardsSystem.processTaskCompletion(sampleTask);
            
            if (!result) {
                throw new Error('No result returned from processTaskCompletion');
            }
            
            addTestResult('Reward Processing', true, 'Successfully processed reward for task completion');
            return result;
        } catch (error) {
            console.error('Reward processing test failed:', error.message);
            addTestResult('Reward Processing', false, `Processing failed: ${error.message}`);
            return null;
        }
    }
    
    // Test rewards UI updates
    async function testRewardsUIUpdates() {
        try {
            console.log('Testing rewards UI updates...');
            
            // Check if necessary UI elements exist
            const rewardsSummary = document.querySelector('.rewards-summary-panel');
            const rewardsLevel = document.getElementById('rewards-level');
            const availableBalance = document.getElementById('available-balance');
            const totalEarned = document.getElementById('total-earned');
            
            if (!rewardsSummary || !rewardsLevel || !availableBalance || !totalEarned) {
                throw new Error('Required rewards UI elements not found in the DOM');
            }
            
            // Try to update the UI
            if (typeof Dashboard !== 'undefined' && Dashboard.updateRewardsDisplay) {
                await Dashboard.updateRewardsDisplay();
                addTestResult('Rewards UI Updates', true, 'Successfully updated rewards UI elements');
                return true;
            } else if (typeof RewardsSystem !== 'undefined' && RewardsSystem.updateUserRewardsDisplay) {
                await RewardsSystem.updateUserRewardsDisplay();
                addTestResult('Rewards UI Updates', true, 'Successfully updated rewards UI elements');
                return true;
            } else {
                throw new Error('No method found to update rewards UI');
            }
        } catch (error) {
            console.error('Rewards UI updates test failed:', error.message);
            addTestResult('Rewards UI Updates', false, `UI updates failed: ${error.message}`);
            return false;
        }
    }
    
    // Test rewards history modal
    async function testRewardsModal() {
        try {
            console.log('Testing rewards history modal...');
            
            // Check if the modal exists
            const modal = document.getElementById('rewards-history-modal');
            if (!modal) {
                throw new Error('Rewards history modal not found in the DOM');
            }
            
            // Check if the function to open the modal exists
            if (typeof Dashboard !== 'undefined' && Dashboard.openRewardsHistoryModal) {
                // Open the modal
                Dashboard.openRewardsHistoryModal();
                
                // Check if the modal is displayed
                const isDisplayed = modal.style.display === 'flex';
                
                if (!isDisplayed) {
                    throw new Error('Modal was not displayed after calling openRewardsHistoryModal');
                }
                
                // Check for key elements inside the modal
                const historyTable = modal.querySelector('.rewards-history-table');
                const redemptionOptions = modal.querySelector('.redemption-options');
                const leaderboard = modal.querySelector('.leaderboard-table');
                
                if (!historyTable || !redemptionOptions || !leaderboard) {
                    throw new Error('Key components missing from rewards modal');
                }
                
                // Close the modal after test
                const closeBtn = modal.querySelector('.close-modal');
                if (closeBtn) {
                    closeBtn.click();
                }
                
                addTestResult('Rewards Modal', true, 'Successfully opened and displayed rewards modal');
                return true;
            } else {
                throw new Error('openRewardsHistoryModal method not found');
            }
        } catch (error) {
            console.error('Rewards modal test failed:', error.message);
            addTestResult('Rewards Modal', false, `Modal test failed: ${error.message}`);
            return false;
        }
    }
    
    // Run all tests in sequence
    async function runAllTests() {
        // Clear previous results
        const container = document.getElementById('test-results-container');
        if (container) {
            container.innerHTML = '<h3>Running Rewards System Tests...</h3>';
        }
        
        const user = await testLogin();
        if (!user) return;
        
        const rewardsData = await testRewardsInitialization();
        await testRewardCalculation();
        await testRewardProcessing();
        await testRewardsUIUpdates();
        await testRewardsModal();
        
        // Display summary
        const passedTests = testResults.filter(t => t.passed).length;
        const totalTests = testResults.length;
        
        const summaryElement = document.createElement('div');
        summaryElement.className = 'test-summary';
        summaryElement.innerHTML = `
            <h3>Test Summary</h3>
            <p>${passedTests} of ${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)</p>
        `;
        
        if (container) {
            container.appendChild(summaryElement);
        }
        
        console.log(`Test Summary: ${passedTests} of ${totalTests} tests passed`);
    }
    
    // Add a test button if we're on a test page
    const testButton = document.getElementById('run-rewards-tests');
    if (testButton) {
        testButton.addEventListener('click', runAllTests);
    } else {
        // Create a floating test panel if we're on the main dashboard
        const isDashboard = window.location.pathname.includes('dashboard');
        if (isDashboard) {
            const testPanel = document.createElement('div');
            testPanel.className = 'rewards-test-panel';
            testPanel.innerHTML = `
                <h3>Rewards System Test</h3>
                <button id="run-tests-btn" class="primary-button">Run Tests</button>
                <div id="test-results-container"></div>
            `;
            testPanel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                max-width: 400px;
                overflow-y: auto;
                max-height: 80vh;
            `;
            
            document.body.appendChild(testPanel);
            
            // Add test button event listener
            document.getElementById('run-tests-btn').addEventListener('click', runAllTests);
            
            // Add styles for test results
            const style = document.createElement('style');
            style.textContent = `
                .test-result { margin: 10px 0; padding: 8px; border-radius: 4px; display: flex; align-items: center; }
                .test-pass { background-color: rgba(46, 204, 113, 0.1); border-left: 3px solid #2ecc71; }
                .test-fail { background-color: rgba(231, 76, 60, 0.1); border-left: 3px solid #e74c3c; }
                .test-icon { margin-right: 10px; font-size: 18px; }
                .test-name { font-weight: bold; margin-right: 10px; }
                .test-message { font-size: 14px; color: #555; }
                .test-summary { margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
            `;
            document.head.appendChild(style);
        }
    }
});
