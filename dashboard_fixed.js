// Dashboard functionality for TaskHive
console.log('Loading Dashboard functionality...');

// Dashboard state management
const Dashboard = {
    currentUser: null,
    tasks: [],
    filters: {
        status: 'all',
        time: 'all',
        search: ''
    },

    // Initialize dashboard
    async init() {
        console.log('Initializing Dashboard...');
        
        // Check authentication
        if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
            console.log('User not authenticated, redirecting to welcome page');
            window.location.href = 'welcomepage1.html';
            return;
        }

        this.currentUser = Auth.getCurrentUser();
        console.log('Dashboard initialized for user:', this.currentUser.name);
        
        // Update UI with user information
        this.updateUserUI();
        
        // Load tasks
        await this.loadTasks();
        
        // Initialize rewards system
        if (typeof RewardsSystem !== 'undefined') {
            await RewardsSystem.init();
            await this.updateRewardsDisplay();
        } else {
            console.warn('RewardsSystem not found, rewards features will be disabled');
        }
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Update rewards display in the dashboard
    async updateRewardsDisplay() {
        try {
            // Get rewards data for the current user
            const rewardsData = await RewardsSystem.getUserRewardsData();
            
            if (!rewardsData) {
                console.warn('No rewards data available');
                return;
            }
            
            console.log('Updating rewards display with data:', rewardsData);
            
            // Format currency amounts
            const formatCurrency = (amount) => {
                return '$' + parseFloat(amount).toFixed(2);
            };
            
            // Update the rewards summary panel
            document.getElementById('available-balance').textContent = formatCurrency(rewardsData.availableBalance);
            document.getElementById('total-earned').textContent = formatCurrency(rewardsData.totalEarned);
            
            // Calculate user level based on total earnings
            const userLevel = RewardsSystem.calculateLevel(rewardsData.totalEarned);
            const levelProgress = RewardsSystem.calculateLevelProgress(rewardsData.totalEarned);
            
            // Update level display
            const rewardsLevelElement = document.getElementById('rewards-level');
            if (rewardsLevelElement) {
                rewardsLevelElement.textContent = userLevel.name;
                rewardsLevelElement.style.color = userLevel.color;
            }
            
            // Update the modal values as well
            document.getElementById('modal-available-balance').textContent = formatCurrency(rewardsData.availableBalance);
            document.getElementById('modal-total-earned').textContent = formatCurrency(rewardsData.totalEarned);
            
            // Update level in modal
            const modalLevelElement = document.getElementById('modal-rewards-level');
            if (modalLevelElement) {
                modalLevelElement.textContent = userLevel.name;
                modalLevelElement.style.color = userLevel.color;
            }
            
            // Update level progress bar
            const levelProgressBar = document.getElementById('level-progress-bar');
            if (levelProgressBar) {
                levelProgressBar.style.width = `${levelProgress}%`;
                
                // Add tooltip to show progress details
                const nextLevelIndex = RewardsSystem.levels.findIndex(level => level.name === userLevel.name) + 1;
                if (nextLevelIndex < RewardsSystem.levels.length) {
                    const nextLevel = RewardsSystem.levels[nextLevelIndex];
                    const remaining = nextLevel.threshold - rewardsData.totalEarned;
                    
                    levelProgressBar.title = `${levelProgress.toFixed(1)}% - Earn $${remaining.toFixed(2)} more to reach ${nextLevel.name} level`;
                }
            }
            
            // Enable/disable redemption options based on available balance
            const redemptionOptions = document.querySelectorAll('.redemption-option');
            redemptionOptions.forEach(option => {
                const amount = parseFloat(option.getAttribute('data-amount'));
                const button = option.querySelector('.redeem-button');
                
                if (rewardsData.availableBalance >= amount) {
                    button.classList.remove('disabled');
                } else {
                    button.classList.add('disabled');
                    button.disabled = true;
                }
            });
            
            // Update rewards history table
            const historyTableBody = document.getElementById('rewards-history-tbody');
            const emptyHistoryMessage = document.getElementById('rewards-history-empty');
            
            if (rewardsData.history && rewardsData.history.length > 0) {
                historyTableBody.innerHTML = '';
                if (emptyHistoryMessage) emptyHistoryMessage.style.display = 'none';
                
                rewardsData.history.forEach(entry => {
                    const row = document.createElement('tr');
                    const date = new Date(entry.date);
                    
                    row.innerHTML = `
                        <td>${date.toLocaleDateString()}</td>
                        <td>${entry.taskTitle || entry.description || 'Unknown Task'}</td>
                        <td>${entry.type === 'credit' ? 'Earned' : 'Withdraw'}</td>
                        <td class="${entry.type === 'credit' ? 'amount-credit' : 'amount-debit'}">${formatCurrency(entry.amount)}</td>
                    `;
                    
                    historyTableBody.appendChild(row);
                });
            } else if (emptyHistoryMessage) {
                emptyHistoryMessage.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error updating rewards display:', error);
        }
    },

    // Update user interface elements
    updateUserUI() {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name;
        }

        const userAvatarImg = document.querySelector('.user-avatar img');
        if (userAvatarImg && this.currentUser) {
            const profilePic = this.currentUser.profilePic || 
                `https://placehold.co/100x100/orange/white?text=${this.currentUser.name.charAt(0)}`;
            userAvatarImg.src = profilePic;
        }
    },
    
    // Load tasks from API
    async loadTasks() {
        console.log('Loading tasks from API...');
        
        try {
            // Verify authentication first
            if (!Auth.isAuthenticated()) {
                console.error('User is not authenticated. Cannot load tasks.');
                this.showError('You must be logged in to view tasks. Please log in and try again.');
                window.location.href = 'welcomepage1.html'; // Redirect to welcome page
                return;
            }
            
            const token = Auth.getToken();
            console.log('Using auth token:', token ? `${token.substring(0, 10)}...` : 'No token');
            
            const response = await fetch('http://localhost:5000/api/tasks', {
                headers: Auth.getAuthHeaders()
            });

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                
                // Try to get more detailed error info from response
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.msg) {
                        errorMsg = errorData.msg;
                    }
                } catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                
                throw new Error(errorMsg);
            }

            const tasksData = await response.json();
            this.tasks = Array.isArray(tasksData) ? tasksData : [];
            console.log('Tasks loaded successfully:', this.tasks.length, 'tasks', this.tasks);
            
            // Ensure we have tasks to display
            if (this.tasks.length === 0) {
                console.log('No tasks returned from API, showing sample tasks');
                this.showSampleTasks();
                this.showInfo('No tasks found. Create a new task or try adjusting your filters.');
                return;
            }
            
            this.renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError(`Failed to load tasks: ${error.message}`);
            
            // Show sample tasks if API fails
            this.showSampleTasks();
        }
    },

    // Load nearby tasks based on user location
    async loadNearbyTasks() {
        if (!window.LocationTracker || !window.LocationTracker.userLocation) {
            console.log('User location not available for nearby tasks');
            return this.loadTasks(); // Fallback to all tasks
        }

        const { latitude, longitude } = window.LocationTracker.userLocation;
        
        try {
            const response = await fetch(`http://localhost:5000/api/tasks/nearby/${latitude}/${longitude}?radius=10`, {
                headers: Auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const nearbyTasks = await response.json();
            console.log('Nearby tasks loaded:', nearbyTasks.length, 'tasks');
            
            // Merge with all tasks and mark nearby ones
            this.tasks = nearbyTasks;
            this.renderTasks();
        } catch (error) {
            console.error('Error loading nearby tasks:', error);
            this.loadTasks(); // Fallback to all tasks
        }
    },

    // Render tasks in the grid
    renderTasks() {
        const taskGrid = document.getElementById('task-grid');
        if (!taskGrid) return;

        // Filter tasks based on current filters
        const filteredTasks = this.filterTasks(this.tasks);

        if (filteredTasks.length === 0) {
            taskGrid.innerHTML = `
                <div class="no-tasks-message">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>No tasks match your current filters. Try adjusting your search criteria or create a new task.</p>
                    <button class="primary-button" onclick="Dashboard.openCreateTaskModal()">Create New Task</button>
                </div>
            `;
            return;
        }

        taskGrid.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');
        
        // Add event listeners to task action buttons
        this.addTaskEventListeners();
    },

    // Create HTML for a task card
    createTaskCard(task) {
        const statusClass = this.getStatusClass(task.status);
        const statusText = this.formatStatus(task.status);
        const timeText = this.formatDuration(task.timeWindow);
        const typeIcon = this.getTypeIcon(task.type || 'other');
        const createdBy = task.createdBy ? task.createdBy.name : 'Unknown User';
        
        // Add distance display if available
        let distanceHtml = '';
        if (task.distance !== undefined) {
            const distance = this.formatDistance(task.distance);
            const distanceClass = task.distance < 1000 ? 'close' : 'far';
            distanceHtml = `
                <div class="distance-display ${distanceClass}">
                    <i class="fas fa-route"></i>
                    <span>${distance} away</span>
                </div>
            `;
        }
        
        // Add location display if available
        let locationHtml = '';
        if (task.location) {
            locationHtml = `
                <div class="task-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${this.escapeHtml(task.location)}</span>
                </div>
            `;
        }
        
        return `
            <div class="task-card" data-task-id="${task._id}">
                <div class="task-status ${statusClass}">${statusText}</div>
                <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                <p class="task-details">${this.escapeHtml(task.description)}</p>
                ${distanceHtml}
                ${locationHtml}
                <div class="task-meta">
                    <div class="task-time">
                        <i class="fas fa-clock"></i>
                        <span>${timeText}</span>
                    </div>
                    <div class="task-type">
                        <i class="fas ${typeIcon}"></i>
                        <span>${this.formatTaskType(task.type || 'other')}</span>
                    </div>
                    <div class="task-creator">
                        <i class="fas fa-user"></i>
                        <span>By ${createdBy}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="secondary-button view-task-btn" data-task-id="${task._id}">View Info</button>
                    ${task.status === 'available' ? 
                        `<button class="primary-button accept-task-btn" data-task-id="${task._id}">Accept Task</button>` : ''}
                    ${task.status === 'in-progress' && task.assignedTo && task.assignedTo._id === this.currentUser?.id ? 
                        `<button class="primary-button complete-task-btn" data-task-id="${task._id}">Mark Completed</button>` : ''}
                    ${task.status === 'awaiting-verification' && task.createdBy._id === this.currentUser?.id ? 
                        `<button class="primary-button verify-task-btn" data-task-id="${task._id}">Verify</button>` : ''}
                </div>
            </div>
        `;
    },

    // Show sample tasks when API is not available
    showSampleTasks() {
        const taskGrid = document.getElementById('task-grid');
        if (!taskGrid) return;

        const sampleTasks = [
            {
                _id: 'sample1',
                title: 'Pick up groceries from the store',
                description: 'Need someone to pick up my grocery order from Whole Foods. It\'s already paid for, just need pick up.',
                status: 'available',
                timeWindow: 30,
                type: 'errand',
                createdBy: { name: 'Sample User' }
            },
            {
                _id: 'sample2',
                title: 'Deliver package to the post office',
                description: 'Need someone to take my pre-paid package to the post office. It\'s not heavy, just a small box.',
                status: 'in-progress',
                timeWindow: 45,
                type: 'delivery',
                createdBy: { name: 'Sample User' }
            },
            {
                _id: 'sample3',
                title: 'Return library books',
                description: 'Need someone to return three books to the university library before closing time at 6pm.',
                status: 'awaiting-verification',
                timeWindow: 60,
                type: 'errand',
                createdBy: { name: 'Sample User' }
            }
        ];

        this.tasks = sampleTasks;
        this.renderTasks();
        
        // Show warning about sample data
        this.showWarning('Showing sample tasks. Connect to the server to see real tasks.');
    },

    // Filter tasks based on current filters
    filterTasks(tasks) {
        return tasks.filter(task => {
            // Status filter
            if (this.filters.status !== 'all' && task.status !== this.filters.status) {
                return false;
            }

            // Time filter
            if (this.filters.time !== 'all') {
                const maxTime = parseInt(this.filters.time);
                if (task.timeWindow > maxTime) {
                    return false;
                }
            }

            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const title = task.title.toLowerCase();
                const description = task.description.toLowerCase();
                if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    },

    // Setup all event listeners
    setupEventListeners() {
        // Filter controls
        const statusFilter = document.getElementById('status-filter');
        const timeFilter = document.getElementById('time-filter');
        const searchInput = document.getElementById('search-tasks');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.renderTasks();
            });
        }

        if (timeFilter) {
            timeFilter.addEventListener('change', (e) => {
                this.filters.time = e.target.value;
                this.renderTasks();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.renderTasks();
            });
        }

        // Create task button
        const createTaskBtn = document.getElementById('create-new-task-btn');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', () => this.openCreateTaskModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // MongoDB check button
        const checkMongoBtn = document.getElementById('check-mongodb-btn');
        if (checkMongoBtn) {
            checkMongoBtn.addEventListener('click', () => this.checkMongoDB());
        }
        
        // Mobile menu toggle
        this.setupMobileMenu();
        
        // Rewards history button
        const viewRewardsBtn = document.getElementById('view-rewards-history-btn');
        if (viewRewardsBtn) {
            viewRewardsBtn.addEventListener('click', () => {
                this.openRewardsHistoryModal();
            });
        }
        
        // Set up all modals
        this.setupModal('rewards-history-modal');
        this.setupModal('create-task-modal');
        
        // Set up form submission for create task
        this.setupCreateTaskForm();
    },
    
    // Open rewards history modal
    openRewardsHistoryModal() {
        const modal = document.getElementById('rewards-history-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateRewardsDisplay(); // Refresh data when opening the modal
            
            // Also load the leaderboard data
            if (typeof RewardsSystem !== 'undefined' && RewardsSystem.loadLeaderboard) {
                RewardsSystem.loadLeaderboard();
            }
        }
    },

    // Add event listeners to task cards
    addTaskEventListeners() {
        // View task buttons
        document.querySelectorAll('.view-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                this.viewTask(taskId);
            });
        });

        // Accept task buttons
        document.querySelectorAll('.accept-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                this.acceptTask(taskId);
            });
        });

        // Complete task buttons
        document.querySelectorAll('.complete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                this.completeTask(taskId);
            });
        });

        // Verify task buttons
        document.querySelectorAll('.verify-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                this.verifyTask(taskId);
            });
        });
    },

    // Open create task modal
    openCreateTaskModal() {
        const modal = document.getElementById('create-task-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    // View task details
    viewTask(taskId) {
        const task = this.tasks.find(t => t._id === taskId);
        if (!task) return;

        // Create and show task details modal
        this.showTaskModal(task);
    },

    // Accept a task
    async acceptTask(taskId) {
        if (taskId.startsWith('sample')) {
            this.showWarning('Cannot accept sample tasks. Connect to the server to interact with real tasks.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/accept`, {
                method: 'PUT',
                headers: Auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to accept task');
            }

            this.showSuccess('Task accepted successfully!');
            await this.loadTasks(); // Reload tasks
        } catch (error) {
            console.error('Error accepting task:', error);
            this.showError('Failed to accept task. Please try again.');
        }
    },
    
    // Complete task (mark as completed by assignee)
    async completeTask(taskId) {
        const completionNote = prompt('Add a completion note (optional):');
        
        try {
            console.log('Attempting to complete task:', taskId);
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/complete`, {
                method: 'PUT',
                headers: {
                    ...Auth.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completionNote: completionNote || '' })
            });
            
            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    // Try to get detailed error message from the response
                    const errorData = await response.json();
                    if (errorData && errorData.msg) {
                        errorMsg = errorData.msg;
                    }
                } catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                throw new Error(errorMsg);
            }

            const updatedTask = await response.json();
            console.log('Task marked as completed:', updatedTask);
            
            this.showSuccess('Task marked as completed! Waiting for verification from task creator.');
            this.loadTasks(); // Refresh tasks
        } catch (error) {
            console.error('Error completing task:', error);
            this.showError(`Failed to mark task as completed: ${error.message}`);
        }
    },
    
    // Verify task completion (by task creator)
    async verifyTask(taskId) {
        const confirmation = window.confirm('Are you sure you want to verify this task as completed?');
        if (!confirmation) return;
        
        try {
            console.log('Attempting to verify task:', taskId);
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/verify`, {
                method: 'PUT',
                headers: {
                    ...Auth.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rating: 5, note: 'Task completed successfully!' })
            });

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    // Try to get detailed error message from the response
                    const errorData = await response.json();
                    if (errorData && errorData.msg) {
                        errorMsg = errorData.msg;
                    }
                } catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                throw new Error(errorMsg);
            }
            
            const verifiedTask = await response.json();
            console.log('Task verified:', verifiedTask);
            
            // Add reward for completing the task
            if (typeof RewardsSystem !== 'undefined') {
                try {
                    await RewardsSystem.processTaskCompletion(verifiedTask);
                    await this.updateRewardsDisplay();
                } catch (rewardsError) {
                    console.error('Error processing rewards:', rewardsError);
                }
            }
            
            this.showSuccess('Task verified successfully!');
            this.loadTasks(); // Refresh tasks
        } catch (error) {
            console.error('Error verifying task:', error);
            this.showError(`Failed to verify task: ${error.message}`);
        }
    },

    // Show task details modal
    showTaskModal(task) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="task-modal-header">
                    <h2>${this.escapeHtml(task.title)}</h2>
                    <div class="task-status ${this.getStatusClass(task.status)}">${this.formatStatus(task.status)}</div>
                </div>
                <div class="task-modal-body">
                    <p><strong>Description:</strong> ${this.escapeHtml(task.description)}</p>
                    <p><strong>Time Window:</strong> ${this.formatDuration(task.timeWindow)}</p>
                    <p><strong>Type:</strong> ${this.formatTaskType(task.type || 'other')}</p>
                    <p><strong>Created by:</strong> ${task.createdBy ? task.createdBy.name : 'Unknown User'}</p>
                    ${task.location ? `<p><strong>Location:</strong> ${this.escapeHtml(task.location)}</p>` : ''}
                    <p><strong>Created:</strong> ${new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="task-modal-actions">
                    ${task.status === 'available' ? 
                        `<button class="primary-button accept-task-modal-btn" data-task-id="${task._id}">Accept Task</button>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Close modal event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Accept task from modal
        const acceptBtn = modal.querySelector('.accept-task-modal-btn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', async (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                await this.acceptTask(taskId);
                document.body.removeChild(modal);
            });
        }
    },

    // Logout functionality
    logout() {
        if (typeof Auth !== 'undefined') {
            Auth.logout();
        }
        window.location.href = 'welcomepage1.html';
    },
    
    // Check MongoDB connection
    async checkMongoDB() {
        console.log('Checking MongoDB connection...');
        const checkBtn = document.getElementById('check-mongodb-btn');
        const originalText = checkBtn.innerHTML;
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';

        try {
            console.log('Fetching API status from http://localhost:5000/api/status');
            const response = await fetch('http://localhost:5000/api/status');
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('MongoDB status response:', data);
            
            this.showSuccess(`MongoDB Status: ${data.status} - Database: ${data.database}`);
        } catch (error) {
            console.error('MongoDB check failed:', error);
            this.showError(`Could not connect to server: ${error.message}`);
        } finally {
            checkBtn.disabled = false;
            checkBtn.innerHTML = originalText;
        }
    },

    // Setup mobile menu
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
                const icon = this.querySelector('i');
                if (sidebar.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }
    },

    // Modal setup helper
    setupModal(modalId, openBtnId = null) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Setup open button if provided
        if (openBtnId) {
            const openBtn = document.getElementById(openBtnId);
            if (openBtn) {
                openBtn.addEventListener('click', () => {
                    modal.style.display = 'flex';
                });
            }
        }
        
        // Setup close button
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Close when clicking outside the modal
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    },

    // Setup create task form
    setupCreateTaskForm() {
        const form = document.getElementById('create-task-form');
        if (!form) {
            console.error('Create task form not found');
            return;
        }
        
        console.log('Setting up create task form');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const title = document.getElementById('task-title').value;
            const description = document.getElementById('task-description').value;
            const timeWindow = document.getElementById('task-time').value;
            const location = document.getElementById('task-location').value;
            const type = document.getElementById('task-type').value;
            
            // Get coordinates if available
            let coords = null;
            if (window.LocationTracker && window.LocationTracker.userLocation) {
                coords = {
                    latitude: window.LocationTracker.userLocation.latitude,
                    longitude: window.LocationTracker.userLocation.longitude
                };
                
                if (location) {
                    coords.address = location;
                }
            }
            
            const formData = {
                title,
                description,
                timeWindow,
                location,
                locationCoords: coords,
                type
            };
            
            const success = await this.createTask(formData);
            
            if (success) {
                // Close the modal and reset form
                document.getElementById('create-task-modal').style.display = 'none';
                form.reset();
                this.showSuccess('Task created successfully!');
            }
        });
    },
    
    // Create a new task
    async createTask(formData) {
        console.log('Creating new task with data:', formData);
        
        try {
            if (!Auth.isAuthenticated()) {
                this.showError('You must be logged in to create tasks.');
                return false;
            }
            
            const response = await fetch('http://localhost:5000/api/tasks', {
                method: 'POST',
                headers: {
                    ...Auth.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.msg) {
                        errorMsg = errorData.msg;
                    }
                } catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                
                throw new Error(errorMsg);
            }
            
            const newTask = await response.json();
            console.log('Task created successfully:', newTask);
            
            // Add the new task to our tasks array at the beginning
            this.tasks.unshift(newTask);
            this.renderTasks();
            
            return true;
        } catch (error) {
            console.error('Error creating task:', error);
            this.showError(`Failed to create task: ${error.message}`);
            return false;
        }
    },

    // Utility functions
    showInfo(message) {
        this.showNotification(message, 'info');
    },
    
    getStatusClass(status) {
        const statusMap = {
            'available': 'status-available',
            'in-progress': 'status-in-progress',
            'awaiting-verification': 'status-awaiting',
            'verified': 'status-verified',
            'completed': 'status-completed'
        };
        return statusMap[status] || 'status-available';
    },

    formatStatus(status) {
        const statusMap = {
            'available': 'Available',
            'in-progress': 'In Progress',
            'awaiting-verification': 'Awaiting Verification',
            'verified': 'Verified',
            'completed': 'Completed'
        };
        return statusMap[status] || 'Available';
    },

    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} minutes`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
        }
    },

    getTypeIcon(type) {
        const iconMap = {
            'delivery': 'fa-truck',
            'errand': 'fa-shopping-bag',
            'assistance': 'fa-hands-helping',
            'repairs': 'fa-tools',
            'other': 'fa-question-circle'
        };
        return iconMap[type] || 'fa-question-circle';
    },

    formatTaskType(type) {
        const typeMap = {
            'delivery': 'Delivery',
            'errand': 'Errand',
            'assistance': 'Assistance',
            'repairs': 'Repairs',
            'other': 'Other'
        };
        return typeMap[type] || 'Other';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Format distance for display
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    },

    // Notification functions
    showSuccess(message) {
        this.showNotification(message, 'success');
    },

    showError(message) {
        this.showNotification(message, 'error');
    },

    showWarning(message) {
        this.showNotification(message, 'warning');
    },
    
    showNotification(message, type) {
        // Create or get toast container
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Remove existing notifications
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
            </div>
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <div class="toast-close">
                <i class="fas fa-times"></i>
            </div>
        `;

        toastContainer.appendChild(toast);
        
        // Force a reflow to ensure the transition works
        toast.offsetHeight;
        
        // Add show class to make the toast visible
        toast.classList.add('show');

        // Add close functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Make Dashboard globally available
window.Dashboard = Dashboard;
