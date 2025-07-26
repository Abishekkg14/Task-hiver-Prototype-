// TaskHive Rewards System - AI-driven rewards for completing tasks
console.log('Loading TaskHive Rewards System...');

// API Base URL - Same as the one used in auth.js
const API_BASE_URL = 'http://localhost:5000/api';

// Define RewardsSystem as a global variable to ensure it's available across scripts
window.RewardsSystem = {
    // Load Gemini API key from environment/config
    getGeminiApiKey() {
        // For frontend, fetch from backend endpoint or config file
        // Example: fetch('/api/config/gemini-key') or use a build-time injected value
        // For now, return empty string (must be set securely)
        return window.GOOGLE_GEMINI_API_KEY || '';
    },
    
    // Define rewards level thresholds
    levels: [
        { name: "Beginner", threshold: 0, color: "#6c757d" },
        { name: "Bronze", threshold: 50, color: "#cd7f32" },
        { name: "Silver", threshold: 150, color: "#C0C0C0" },
        { name: "Gold", threshold: 300, color: "#FFD700" },
        { name: "Platinum", threshold: 500, color: "#E5E4E2" },
        { name: "Diamond", threshold: 1000, color: "#B9F2FF" }
    ],
    
    // Initialize the rewards system
    async init() {
        console.log('Initializing rewards system...');
        await this.ensureUserRewardsDataExists();
        await this.updateUserRewardsDisplay();
        
        // Set up event listeners for redemption buttons
        this.setupRedemptionListeners();
        
        // Load leaderboard data
        this.loadLeaderboard();
    },
    
    // Ensure user rewards data exists in the backend
    async ensureUserRewardsDataExists() {
        try {
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) return;
            
            const userId = currentUser.id || currentUser._id;
            
            // The backend API will automatically create a rewards record if it doesn't exist
            // We just need to fetch it to ensure it's created
            const rewards = await this.getUserRewardsData(userId);
            
            if (rewards) {
                console.log('Retrieved rewards data for user:', userId);
            } else {
                console.log('Failed to retrieve rewards data for user:', userId);
            }
        } catch (error) {
            console.error('Error ensuring user rewards data exists:', error);
        }
    },
      // Get user rewards data from API
    async getUserRewardsData(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/rewards`, {
                headers: Auth.getAuthHeaders()
            });

            if (!response.ok) {
                console.error('Failed to fetch rewards data:', response.status);
                return null;
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user rewards data:', error);
            return null;
        }
    },
    
    // Save user rewards data to API (not needed anymore as the backend handles this)
    async saveUserRewardsData(userId, rewardsData) {
        // This is now handled by the backend API calls
        // This method is kept for compatibility
        console.log('Rewards data is now managed by the backend API');
    },
      // Calculate reward amount for a completed task using API
    async calculateReward(task) {
        try {
            console.log('Calculating AI-based reward for task:', task.title);
            
            // Use the backend API to calculate the reward
            const response = await fetch(`${API_BASE_URL}/rewards/calculate`, {
                method: 'POST',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify({
                    taskId: task._id || task.id
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to get reward from API, using fallback calculation');
                // Fallback calculation if API call fails
                return this.calculateFallbackReward(task);
            }
            
            const data = await response.json();
            console.log('API reward calculation:', data.reward);
            return data.reward;
        } catch (error) {
            console.error('Error calculating reward:', error);
            // Fallback calculation if API call fails
            return this.calculateFallbackReward(task);
        }
    },
    
    // Get reward suggestion from Gemini API
    async getGeminiRewardSuggestion(task) {
        const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        // Prepare the task data for the API request
        const taskData = {
            title: task.title || '',
            description: task.description || '',
            type: task.type || 'other',
            completionNote: task.completionNote || '',
            status: task.status || '',
            completionTime: task.completedAt ? this.calculateCompletionDuration(task) : 'unknown'
        };
        
        // Create the prompt for the AI
        const prompt = `As an AI assistant for TaskHive, a task management platform, please analyze this completed task and suggest an appropriate reward amount in dollars (between $1 and $50) based on its complexity, effort required, and time taken. Please return ONLY a number with up to 2 decimal places, nothing else.

Task details:
- Title: ${taskData.title}
- Description: ${taskData.description}
- Type: ${taskData.type}
- Completion note: ${taskData.completionNote}
- Completion time: ${taskData.completionTime}

Reward amount in dollars (just the number, e.g., 15.75):`;
        
        // API request body
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 10
            }
        };

        try {
            const apiKey = this.getGeminiApiKey();
            if (!apiKey) throw new Error('Google Gemini API key not set.');
            const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract the generated text and parse it as a number
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const rewardMatch = generatedText.match(/\d+(\.\d+)?/);
            
            if (rewardMatch) {
                const rewardAmount = parseFloat(rewardMatch[0]);
                
                // Ensure reward is within reasonable bounds
                return Math.min(Math.max(rewardAmount, 1), 50);
            } else {
                throw new Error('Could not parse reward amount from API response');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    },
    
    // Calculate the time taken to complete a task
    calculateCompletionDuration(task) {
        try {
            const createdAt = new Date(task.createdAt);
            const completedAt = new Date(task.completedAt);
            
            const durationMs = completedAt - createdAt;
            const durationHours = durationMs / (1000 * 60 * 60);
            
            return `${durationHours.toFixed(1)} hours`;
        } catch (error) {
            return 'unknown';
        }
    },
    
    // Calculate fallback reward for task if AI or API fails
    calculateFallbackReward(task) {
        // Base reward amount
        let reward = 5.00;
        
        // Adjust based on task type
        if (task.type === 'urgent') {
            reward += 3.00;
        } else if (task.type === 'important') {
            reward += 2.00;
        }
        
        // Adjust based on task description length
        if (task.description && task.description.length > 100) {
            reward += 1.50;
        }
        
        // Adjust based on completion note
        if (task.completionNote && task.completionNote.length > 50) {
            reward += 0.75;
        }
        
        // Adjust for task completion time
        if (task.createdAt && task.completedAt) {
            const createdAt = new Date(task.createdAt);
            const completedAt = new Date(task.completedAt);
            const durationHours = (completedAt - createdAt) / (1000 * 60 * 60);
            
            // Fast completion bonus
            if (durationHours < 2) {
                reward += 2.00;
            } else if (durationHours < 12) {
                reward += 1.00;
            }
        }
        
        // Round to 2 decimal places and ensure minimum reward
        reward = Math.max(Math.round(reward * 100) / 100, 1.00);
        
        console.log('Calculated fallback reward:', reward);
        return reward;
    },
    
    // Process rewards for a completed task
    async processTaskCompletion(task) {
        try {
            if (!task) {
                throw new Error('No task provided for reward processing');
            }
            
            console.log('Processing rewards for task completion:', task);
            
            // Calculate the reward amount
            const rewardAmount = await this.calculateReward(task);
            console.log('Calculated reward amount:', rewardAmount);
            
            // Add the reward to the user's account
            const response = await fetch(`${API_BASE_URL}/rewards/add`, {
                method: 'POST',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify({ 
                    taskId: task._id,
                    taskTitle: task.title,
                    amount: rewardAmount
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to process rewards');
            }
            
            const data = await response.json();
            console.log('Reward processed successfully:', data);
            
            // Show success notification
            this.showRewardNotification(rewardAmount, task.title);
            
            return data;
        } catch (error) {
            console.error('Error processing task rewards:', error);
            throw error;
        }
    },
    
    // Show a reward notification to the user
    showRewardNotification(amount, taskTitle) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.innerHTML = `
            <div class="reward-notification-icon">
                <i class="fas fa-coins"></i>
            </div>
            <div class="reward-notification-content">
                <h4>Reward Earned!</h4>
                <p>You earned $${amount.toFixed(2)} for completing: ${taskTitle}</p>
            </div>
            <div class="reward-notification-close">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Force reflow for animation
        notification.offsetHeight;
        
        // Show notification
        notification.classList.add('show');
        
        // Add close button functionality
        notification.querySelector('.reward-notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto hide after 8 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 8000);
    },

    // Update the rewards display in UI elements
    async updateUserRewardsDisplay() {
        try {
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) return;
            
            const userId = currentUser.id || currentUser._id;
            const userRewards = await this.getUserRewardsData(userId);
            
            if (!userRewards) return;
            
            // Update the rewards display elements if they exist
            const balanceDisplay = document.getElementById('user-reward-balance');
            if (balanceDisplay) {
                balanceDisplay.textContent = `$${userRewards.availableBalance.toFixed(2)}`;
            }
            
            // Create or update the rewards icon in the sidebar
            this.ensureRewardsIconExists();
            
            console.log('Updated rewards display for user:', userId);
        } catch (error) {
            console.error('Error updating rewards display:', error);
        }
    },
      // Ensure the rewards icon exists in the sidebar
    async ensureRewardsIconExists() {
        const sidebarMenu = document.querySelector('.sidebar-menu ul');
        if (!sidebarMenu) return;
        
        // Check if rewards menu item already exists
        let rewardsItem = document.getElementById('rewards-menu-item');
        
        if (!rewardsItem) {
            // Create a new rewards menu item
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) return;
            
            const userId = currentUser.id || currentUser._id;
            const userRewards = await this.getUserRewardsData(userId);
            
            if (!userRewards) return;
            
            rewardsItem = document.createElement('li');
            rewardsItem.id = 'rewards-menu-item';
            
            // Insert it before the logout button
            const logoutItem = document.querySelector('.sidebar-menu ul li:last-child');
            
            rewardsItem.innerHTML = `
                <a href="#rewards-modal" class="show-rewards">
                    <i class="fas fa-coins"></i> Rewards 
                    <span class="reward-balance" id="user-reward-balance">$${userRewards.availableBalance.toFixed(2)}</span>
                </a>
            `;
            
            if (logoutItem) {
                sidebarMenu.insertBefore(rewardsItem, logoutItem);
            } else {
                sidebarMenu.appendChild(rewardsItem);
            }
              // Add click handler to show rewards modal
            rewardsItem.querySelector('a').addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showRewardsModal();
            });
        }
    },      // Show rewards modal with history and details
    async showRewardsModal() {
        try {
            // Create modal if it doesn't exist
            this.ensureRewardsModalExists();
            
            // Get user rewards data
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                console.error('No user is currently logged in');
                alert('Please log in to view rewards');
                return;
            }
            
            const userId = currentUser.id || currentUser._id;
            console.log('Getting rewards data for user:', userId);
            
            const userRewards = await this.getUserRewardsData(userId);
            
            if (!userRewards) {
                console.error('Failed to fetch rewards data');
                alert('Could not load rewards data. Please try again.');
                return;
            }
        
        // Update content in the modal
        document.getElementById('rewards-total-earned').textContent = `$${userRewards.totalEarned.toFixed(2)}`;
        document.getElementById('rewards-available-balance').textContent = `$${userRewards.availableBalance.toFixed(2)}`;
        
        // Update rewards history
        const historyContainer = document.getElementById('rewards-history');
        historyContainer.innerHTML = '';
        
        if (!userRewards.history || userRewards.history.length === 0) {
            historyContainer.innerHTML = '<div class="empty-history">No reward history yet.</div>';
        } else {
            userRewards.history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'rewards-history-item';
                
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                historyItem.innerHTML = `
                    <div class="rewards-history-item-info">
                        <div class="rewards-history-task">${item.taskTitle || 'Task'}</div>
                        <div class="rewards-history-date">${formattedDate}</div>
                    </div>
                    <div class="rewards-history-amount ${item.type === 'earned' ? 'earned' : 'spent'}">
                        ${item.type === 'earned' ? '+' : '-'}$${item.amount.toFixed(2)}
                    </div>
                `;
                  historyContainer.appendChild(historyItem);
            });
        }
        
        // Show the modal
        const modal = document.getElementById('rewards-modal');
        modal.style.display = 'flex';
        
        } catch (error) {
            console.error('Error showing rewards modal:', error);
            alert('Error displaying rewards: ' + error.message);
        }
    },
      // Ensure the rewards modal exists in the DOM
    ensureRewardsModalExists() {
        // Check if modal already exists
        if (document.getElementById('rewards-modal')) return;
        
        // Create new rewards modal
        const modal = document.createElement('div');
        modal.id = 'rewards-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content rewards-modal-content">
                <span class="close-modal">&times;</span>
                <h2><i class="fas fa-coins"></i> TaskHive Rewards</h2>
                
                <div class="rewards-summary">
                    <div class="rewards-balance-card">
                        <div class="balance-title">Available Balance</div>
                        <div class="balance-amount" id="rewards-available-balance">$0.00</div>
                    </div>
                    <div class="rewards-balance-card">
                        <div class="balance-title">Total Earned</div>
                        <div class="balance-amount" id="rewards-total-earned">$0.00</div>
                    </div>
                </div>
                
                <div class="rewards-history-section">
                    <h3>Rewards History</h3>
                    <div class="rewards-history" id="rewards-history">
                        <!-- History items will be added here -->
                    </div>
                </div>
                
                <div class="rewards-info">
                    <p><i class="fas fa-info-circle"></i> Complete tasks to earn rewards. The AI determines reward amounts based on task complexity and effort.</p>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="primary-button close-modal">
                        <i class="fas fa-check"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add backdrop click handler
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Add close button handler
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
    },
    
    // Calculate user's rewards level
    calculateLevel(totalEarned) {
        let level = this.levels[0]; // Start with beginner level
        
        for(let i = this.levels.length - 1; i >= 0; i--) {
            if(totalEarned >= this.levels[i].threshold) {
                level = this.levels[i];
                break;
            }
        }
        
        return level;
    },
    
    // Calculate progress to next level
    calculateLevelProgress(totalEarned) {
        let currentLevel = this.calculateLevel(totalEarned);
        let currentIndex = this.levels.findIndex(level => level.name === currentLevel.name);
        
        // If at max level, return 100%
        if(currentIndex === this.levels.length - 1) {
            return 100;
        }
        
        let nextLevel = this.levels[currentIndex + 1];
        let progress = ((totalEarned - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100;
        
        return Math.min(Math.max(progress, 0), 100); // Ensure between 0-100
    },
    
    // Setup listeners for redemption buttons
    setupRedemptionListeners() {
        document.addEventListener('click', async (e) => {
            if(e.target && e.target.classList.contains('redeem-button')) {
                const option = e.target.getAttribute('data-option');
                const amount = parseFloat(e.target.closest('.redemption-option').getAttribute('data-amount'));
                
                if(option && !isNaN(amount)) {
                    this.redeemReward(option, amount);
                }
            }
        });
    },
    
    // Redeem a reward
    async redeemReward(option, amount) {
        try {
            // Get current balance
            const rewardsData = await this.getUserRewardsData();
            
            if(!rewardsData || rewardsData.availableBalance < amount) {
                alert("Insufficient balance to redeem this reward.");
                return;
            }
            
            // Confirm redemption
            const confirmRedeem = confirm(`Are you sure you want to redeem $${amount.toFixed(2)} for this reward?`);
            if(!confirmRedeem) return;
            
            // Process redemption on backend
            const response = await fetch(`${API_BASE_URL}/rewards/redeem`, {
                method: 'POST',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify({ 
                    option: option,
                    amount: amount
                })
            });
            
            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to redeem reward');
            }
            
            const data = await response.json();
            console.log('Reward redeemed successfully:', data);
            
            // Show success notification
            this.showRedeemNotification(amount, option);
            
            // Update rewards display
            await this.updateUserRewardsDisplay();
            
            return data;
        } catch (error) {
            console.error('Error redeeming reward:', error);
            alert(`Failed to redeem reward: ${error.message}`);
        }
    },
    
    // Show redemption notification
    showRedeemNotification(amount, option) {
        let title = "Reward Redeemed";
        let description = `You have successfully redeemed $${amount.toFixed(2)}`;
        
        if(option.includes('gift-card')) {
            description += " for a gift card";
        } else if(option.includes('charity')) {
            description += " donation to charity";
        } else if(option.includes('premium')) {
            description += " for premium access";
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.innerHTML = `
            <div class="reward-notification-icon">
                <i class="fas fa-check"></i>
            </div>
            <div class="reward-notification-content">
                <strong>${title}</strong>
                <span>${description}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if(notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    },
    
    // Load leaderboard data
    async loadLeaderboard() {
        try {
            const leaderboardContainer = document.getElementById('leaderboard-container');
            const leaderboardLoading = document.getElementById('leaderboard-loading');
            const leaderboardTable = document.getElementById('leaderboard-table');
            const leaderboardTbody = document.getElementById('leaderboard-tbody');
            
            if(!leaderboardContainer || !leaderboardTbody) return;
            
            // Show loading state
            if(leaderboardLoading) {
                leaderboardLoading.style.display = 'block';
            }
            if(leaderboardTable) {
                leaderboardTable.style.display = 'none';
            }
            
            // Fetch leaderboard data from backend
            const response = await fetch(`${API_BASE_URL}/rewards/leaderboard`, {
                headers: Auth.getAuthHeaders()
            });
            
            if(!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const leaderboardData = await response.json();
            
            // Hide loading, show table
            if(leaderboardLoading) {
                leaderboardLoading.style.display = 'none';
            }
            if(leaderboardTable) {
                leaderboardTable.style.display = 'table';
            }
            
            // If no data or empty array
            if(!leaderboardData || leaderboardData.length === 0) {
                leaderboardTbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center;">No leaderboard data available</td>
                    </tr>
                `;
                return;
            }
            
            // Populate leaderboard table
            leaderboardTbody.innerHTML = '';
            
            leaderboardData.forEach((entry, index) => {
                const level = this.calculateLevel(entry.totalEarned);
                const row = document.createElement('tr');
                
                // Add rank class for top 3
                if(index < 3) {
                    row.className = `rank-${index + 1}`;
                }
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.userName}</td>
                    <td>${level.name}</td>
                    <td>$${entry.totalEarned.toFixed(2)}</td>
                `;
                
                leaderboardTbody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            
            // Show error message in leaderboard
            const leaderboardTbody = document.getElementById('leaderboard-tbody');
            const leaderboardLoading = document.getElementById('leaderboard-loading');
            const leaderboardTable = document.getElementById('leaderboard-table');
            
            if(leaderboardLoading) {
                leaderboardLoading.style.display = 'none';
            }
            if(leaderboardTable) {
                leaderboardTable.style.display = 'table';
            }
            if(leaderboardTbody) {
                leaderboardTbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center;">Failed to load leaderboard: ${error.message}</td>
                    </tr>
                `;
            }
        }
    }
};

// Initialize rewards system on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        await RewardsSystem.init();
    }
});
