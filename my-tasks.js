// My Tasks functionality for TaskHive
console.log('Loading My Tasks functionality...');

const MyTasks = {
    currentUser: null,
    allTasks: [],
    filteredTasks: [],
    filters: {
        type: 'all', // all, created, assigned
        status: 'all',
        search: ''
    },    async init() {
        console.log('Initializing My Tasks page...');
        
        // Check authentication
        if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
            console.log('User not authenticated, redirecting to welcome page');
            window.location.href = 'welcomepage1.html';
            return;
        }

        this.currentUser = Auth.getCurrentUser();
        console.log('My Tasks initialized for user:', this.currentUser.name);
        
        // Update user UI
        this.updateUserUI();
        
        // Setup event listeners (do this before loading tasks so events are ready)
        this.setupEventListeners();
        
        // Load tasks
        await this.loadTasks();
        
        // Add test buttons for rating system
        this.addTestButtons();
        
        // Create a sample task for testing if there are no tasks
        if (this.allTasks.length === 0) {
            console.log('No tasks found, creating a sample task for testing');
            this.createSampleTask();
        }
    },
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Global delegated event listener for verify buttons
        document.body.addEventListener('click', e => {
            const btn = e.target.closest('.verify-task-btn');
            if (btn) {
                console.log('Verify button clicked via global delegate:', btn);
                e.preventDefault();
                const taskId = btn.getAttribute('data-task-id');
                this.openVerificationModal(taskId);
            }
        });
        
        // Setup filter listeners
        document.getElementById('task-type-filter').addEventListener('change', e => {
            this.filters.type = e.target.value;
            this.applyFilters();
            this.renderTasks();
        });
        
        document.getElementById('status-filter').addEventListener('change', e => {
            this.filters.status = e.target.value;
            this.applyFilters();
            this.renderTasks();
        });
        
        document.getElementById('search-tasks').addEventListener('input', e => {
            this.filters.search = e.target.value;
            this.applyFilters();
            this.renderTasks();
        });
        
        // Setup modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });
        
        // Refresh button        document.getElementById('refresh-tasks-btn').addEventListener('click', () => {
            this.loadTasks();
        });
        
        // Test login button
        const testLoginBtn = document.getElementById('test-login-btn');
        if (testLoginBtn) {
            testLoginBtn.addEventListener('click', () => {
                this.checkAuthStatus();
                this.testLogin();
            });
        }
        
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (typeof Auth !== 'undefined') {
                Auth.logout();
                window.location.href = 'welcomepage1.html';
            }
        });
        
        console.log('Event listeners setup complete');
    },

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
    },    async loadTasks() {
        console.log('Loading user tasks...');
        this.showLoading();
        
        // First check if we're authenticated
        if (!Auth.isAuthenticated()) {
            console.log('User not authenticated, showing login prompt');
            this.showError('You need to log in to view tasks. Click "Test Login" to try with test credentials.');
            return;
        }
        
        try {
            console.log('Auth headers:', Auth.getAuthHeaders());
            // Fetch tasks from server API
            const response = await fetch('http://localhost:5000/api/tasks', {
                headers: Auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Parse the response
            const allTasks = await response.json();
            
            // Filter tasks that involve the current user (created by or assigned to)
            this.allTasks = allTasks.filter(task => {
                const isCreatedByMe = task.createdBy === this.currentUser.id || 
                                    (task.createdBy && task.createdBy._id === this.currentUser.id);
                const isAssignedToMe = task.assignedTo === this.currentUser.id || 
                                     (task.assignedTo && task.assignedTo._id === this.currentUser.id);
                return isCreatedByMe || isAssignedToMe;
            });
            
            // Ensure task objects have the right structure
            this.allTasks = this.allTasks.map(task => ({
                ...task,
                _id: task._id || task.id,
                createdBy: typeof task.createdBy === 'string' ? 
                    { _id: task.createdBy, name: this.getUserName(task.createdBy) } : 
                    task.createdBy,
                assignedTo: typeof task.assignedTo === 'string' ? 
                    { _id: task.assignedTo, name: this.getUserName(task.assignedTo) } : 
                    task.assignedTo
            }));
            
            console.log('Tasks loaded successfully:', this.allTasks.length, 'tasks');
            
            this.applyFilters();
            this.renderTasks();
            this.hideLoading();        } catch (error) {
            console.error('Error loading tasks:', error);
            
            let errorMessage = 'Failed to load your tasks. Please check your connection and try again.';
            
            // Provide more specific error message if possible
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Network error: Could not connect to the server. Please check your internet connection.';
            } else if (error.message.includes('HTTP 401')) {
                errorMessage = 'Authentication error: Please log in again.';
                setTimeout(() => {
                    Auth.logout();
                    window.location.href = 'welcomepage1.html';
                }, 2000);
            } else if (error.message.includes('HTTP 5')) {
                errorMessage = 'Server error: The server encountered an issue. Please try again later.';
            }
            
            this.showError(errorMessage);
        }
    },

    showLoading() {
        document.getElementById('loading-state').style.display = 'flex';
        document.getElementById('tasks-grid').style.display = 'none';
        document.getElementById('error-state').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
    },

    hideLoading() {
        document.getElementById('loading-state').style.display = 'none';
    },

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-state').style.display = 'flex';
        document.getElementById('tasks-grid').style.display = 'none';
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
    },

    applyFilters() {
        this.filteredTasks = this.allTasks.filter(task => {
            // Filter by task type (created vs assigned)
            if (this.filters.type === 'created' && task.createdBy._id !== this.currentUser.id) {
                return false;
            }
            if (this.filters.type === 'assigned' && (!task.assignedTo || task.assignedTo._id !== this.currentUser.id)) {
                return false;
            }

            // Filter by status
            if (this.filters.status !== 'all' && task.status !== this.filters.status) {
                return false;
            }

            // Filter by search
            if (this.filters.search) {
                const searchLower = this.filters.search.toLowerCase();
                return task.title.toLowerCase().includes(searchLower) ||
                       task.description.toLowerCase().includes(searchLower);
            }

            return true;
        });
    },

    renderTasks() {
        const taskGrid = document.getElementById('tasks-grid');
        const emptyState = document.getElementById('empty-state');
        if (this.filteredTasks.length === 0) {
            taskGrid.style.display = 'none'; emptyState.style.display = 'flex'; return;
        }
        taskGrid.style.display = 'grid'; emptyState.style.display = 'none';
        taskGrid.innerHTML = this.filteredTasks.map(task => this.createTaskCard(task)).join('');
        this.addTaskEventListeners();
    },    createTaskCard(task) {
        const isCreatedByMe = task.createdBy._id === this.currentUser.id;
        const isAssignedToMe = task.assignedTo && task.assignedTo._id === this.currentUser.id;
        
        let actionButtons = '';
        if (isAssignedToMe && task.status === 'in-progress') {
            actionButtons = `
                <button type="button" class="primary-button complete-task-btn" data-task-id="${task._id}">
                    <i class="fas fa-check"></i> Mark Completed
                </button>
            `;
        } else if (isCreatedByMe && task.status === 'awaiting-verification') {
            actionButtons = `
                <button type="button" class="primary-button verify-task-btn" data-task-id="${task._id}">
                    <i class="fas fa-award"></i> Verify Completion
                </button>
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
        
        // Add reward badge if available
        let rewardBadgeHtml = '';
        if (task.rewardAmount && task.status === 'verified' && isAssignedToMe) {
            rewardBadgeHtml = `
                <div class="task-reward-badge">
                    <i class="fas fa-coins"></i> $${task.rewardAmount.toFixed(2)}
                </div>
            `;
        }
        
        // Add completion note if available
        let completionNoteHtml = '';
        if (task.completionNote && task.status === 'awaiting-verification') {
            completionNoteHtml = `
                <div class="completion-note">
                    <i class="fas fa-sticky-note"></i>
                    <strong>Completion Note:</strong> ${this.escapeHtml(task.completionNote)}
                </div>
            `;
        }
        
        // Generate star rating display for completed tasks
        const ratingHtml = task.taskRating ? this.generateStarRating(task.taskRating) : '';
          return `
            <div class="task-card my-task-card" data-task-id="${task._id}">
                <div class="task-header">
                    <div class="task-status ${statusClass}">${statusText}</div>
                    <div class="task-role ${isCreatedByMe ? 'creator' : 'assignee'}">
                        ${isCreatedByMe ? '<i class="fas fa-user-tie"></i> Creator' : '<i class="fas fa-user-check"></i> Assignee'}
                    </div>
                </div>
                ${rewardBadgeHtml}
                <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                <p class="task-details">${this.escapeHtml(task.description)}</p>
                ${locationHtml}
                ${completionNoteHtml}
                <div class="task-meta">
                    <div class="task-time">
                        <i class="fas fa-clock"></i>
                        <span>${timeText}</span>
                    </div>
                    <div class="task-type">
                        <i class="fas ${typeIcon}"></i>
                        <span>${this.formatTaskType(task.type || 'other')}</span>
                    </div>
                    <div class="task-other-user">
                        <i class="fas ${isCreatedByMe ? 'fa-user-check' : 'fa-user-tie'}"></i>
                        <span>${isCreatedByMe ? 'Assignee' : 'Creator'}: ${otherUser}</span>
                    </div>
                </div>
                <div class="task-timestamps">
                    <div class="created-at">
                        <i class="fas fa-calendar-plus"></i>
                        Created: ${this.formatDate(task.createdAt)}
                    </div>
                    ${task.completedAt ? `
                        <div class="completed-at">
                            <i class="fas fa-check-circle"></i>
                            Completed: ${this.formatDate(task.completedAt)}
                        </div>
                    ` : ''}
                    ${task.verifiedAt ? `
                        <div class="verified-at">
                            <i class="fas fa-award"></i>
                            Verified: ${this.formatDate(task.verifiedAt)}
                        </div>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button type="button" class="secondary-button" onclick="MyTasks.viewTaskDetails('${task._id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${actionButtons}
                </div>
                ${task.taskRating ? `
                    <div class="task-card-rating">
                        ${this.generateStarRating(task.taskRating)}
                        <span class="rating-value">${task.taskRating}/5 stars</span>
                    </div>
                ` : ''}
            </div>
        `;
    },    addTaskEventListeners() {
        console.log('Adding task-specific event listeners to cards');
        
        // Direct listeners for Verify buttons on the visible cards
        document.querySelectorAll('.verify-task-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                console.log('Verify button clicked directly:', btn);
                e.preventDefault();
                const taskId = btn.getAttribute('data-task-id');
                console.log('Opening verification modal for task:', taskId);
                this.openVerificationModal(taskId);
            });
        });

        // Complete task buttons
        document.querySelectorAll('.complete-task-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                const taskId = btn.getAttribute('data-task-id');
                this.openCompletionModal(taskId);
            });
        });

        // View task buttons
        document.querySelectorAll('.view-task-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                const taskId = btn.getAttribute('data-task-id');
                this.viewTaskDetails(taskId);
            });
        });
        
        console.log('Task event listeners added');
    },

    openCompletionModal(taskId) {
        const modal = document.getElementById('completion-modal');
        const form = document.getElementById('completion-form');
        
        modal.style.display = 'flex';
        modal.setAttribute('data-task-id', taskId);
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.completeTask(taskId);
        });
    },    async completeTask(taskId) {
        const completionNote = document.getElementById('completion-note').value;
        
        try {
            // Update task in localStorage instead of API
            const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
            const taskIndex = allTasks.findIndex(t => t._id === taskId || t.id === taskId);
            
            if (taskIndex !== -1) {
                allTasks[taskIndex].status = 'awaiting-verification';
                allTasks[taskIndex].completedAt = new Date().toISOString();
                allTasks[taskIndex].completionNote = completionNote;
                
                localStorage.setItem('taskhive_tasks', JSON.stringify(allTasks));
            }
            
            this.showToast('Task marked as completed! Waiting for verification.', 'success');
            this.closeModal('completion-modal');
            this.loadTasks(); // Refresh tasks
        } catch (error) {
            console.error('Error completing task:', error);
            this.showToast('Failed to mark task as completed. Please try again.', 'error');        }    },
    
    createSampleTask() {
        console.log('Creating sample task for testing verification...');
        const userId = this.currentUser.id || this.currentUser._id;
        
        // Create a task that's awaiting verification (status)
        const sampleTask = {
            _id: `sample_task_${Date.now()}`,
            title: 'Sample Task for Verification Testing',
            description: 'This is a sample task created to test the verification and rating system.',
            status: 'awaiting-verification',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            completedAt: new Date().toISOString(),
            createdBy: {
                _id: userId,
                name: this.currentUser.name
            },
            assignedTo: {
                _id: `tester_${Date.now()}`,
                name: 'Test User'
            },
            type: 'other',
            completionNote: 'This task was completed successfully. Please verify and rate.'
        };
        
        // Save to localStorage
        const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
        allTasks.push(sampleTask);
        localStorage.setItem('taskhive_tasks', JSON.stringify(allTasks));
        
        // Add to the current tasks array
        this.allTasks.push(sampleTask);
        
        // Refresh the display
        this.applyFilters();
        this.renderTasks();
        
        console.log('Sample task created:', sampleTask);
        return sampleTask;
    },
    
    openVerificationModal(taskId) {
        console.log('Opening verification modal for task:', taskId);
        const task = this.allTasks.find(t => t._id === taskId || t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }
        
        const modal = document.getElementById('verification-modal');
        const detailsDiv = document.getElementById('verification-task-details');
        
        // Get completer name
        const completerName = task.assignedTo && task.assignedTo.name ? 
            task.assignedTo.name : 
            this.getUserName(task.assignedTo);
        
        detailsDiv.innerHTML = `
            <div class="verification-task-info">
                <h3><i class="fas fa-clipboard-check"></i> ${this.escapeHtml(task.title)}</h3>
                <div class="task-info-grid">
                    <div class="info-item">
                        <strong>Completed by:</strong> ${completerName}
                    </div>
                    <div class="info-item">
                        <strong>Completed on:</strong> ${this.formatDate(task.completedAt)}
                    </div>
                    <div class="info-item">
                        <strong>Task Type:</strong> ${this.formatTaskType(task.type || 'other')}
                    </div>
                </div>
                ${task.completionNote ? `
                    <div class="completion-note-display">
                        <strong><i class="fas fa-sticky-note"></i> Completion Note:</strong>
                        <p>${this.escapeHtml(task.completionNote)}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Always show the modal and ensure it's not hidden
        modal.style.display = 'flex';
        modal.setAttribute('data-task-id', taskId);
        
        // Always reset and initialize the rating system
        console.log('Initializing rating system for task:', taskId);
        RatingSystem.reset();
        RatingSystem.initializeStarRating();
        
        // Clear any previous note
        document.getElementById('verification-note').value = '';
        
        // Reset and setup verify button handler
        const verifyBtn = document.getElementById('verify-task-btn');
        verifyBtn.disabled = true;
        verifyBtn.onclick = () => {
            const rating = RatingSystem.getRating();
            const note = document.getElementById('verification-note').value;
            
            if (rating < 1 || rating > 5) {
                alert('Please select a star rating before verifying.');
                return;
            }
            
            this.verifyTaskWithRating(taskId, rating, note);
        };
    },    async verifyTaskWithRating(taskId, rating, note = '') {
        try {
            console.log(`Verifying task ${taskId} with rating ${rating}`);
            
            // Update task in localStorage
            const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
            const taskIndex = allTasks.findIndex(t => t._id === taskId || t.id === taskId);
            
            if (taskIndex !== -1) {
                // Update task with verification details
                allTasks[taskIndex].status = 'verified';
                allTasks[taskIndex].verifiedAt = new Date().toISOString();
                allTasks[taskIndex].taskRating = rating;
                allTasks[taskIndex].verificationNote = note;
                
                // Calculate reward using AI if rewards system is available
                if (window.RewardsSystem) {
                    try {
                        console.log('Calculating reward for task completion...');
                        const task = allTasks[taskIndex];
                        const reward = await RewardsSystem.calculateReward(task);
                        
                        // Store the reward amount in the task
                        allTasks[taskIndex].rewardAmount = reward;
                        
                        // Add reward to the user's account
                        const completerId = task.assignedTo._id || task.assignedTo;
                        await RewardsSystem.addReward(completerId, taskId, reward, task.title);
                        
                        // Show reward notification
                        this.showRewardNotification(reward, task.title);
                    } catch (error) {
                        console.error('Error processing reward:', error);
                    }
                }
                
                // Save tasks back to localStorage
                localStorage.setItem('taskhive_tasks', JSON.stringify(allTasks));
                
                // Update user profiles with rating
                const task = allTasks[taskIndex];
                const completerId = task.assignedTo._id || task.assignedTo;
                this.addRatingToUserProfile(completerId, rating, 'asCompleter');
                
                // Update profile statistics
                this.updateProfileStatistics(task);
                
                console.log(`Task verified successfully with ${rating} stars`);
            }
            
            this.showToast(`Task verified successfully with ${rating} star${rating !== 1 ? 's' : ''}!`, 'success');
            this.closeModal('verification-modal');
            this.loadTasks(); // Refresh tasks
        } catch (error) {
            console.error('Error verifying task:', error);
            this.showToast('Failed to verify task. Please try again.', 'error');
        }
    },
    
    updateLocalTaskWithRating(taskId, rating) {
        // Get tasks from localStorage
        const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
        const taskIndex = allTasks.findIndex(t => t.id === taskId || t._id === taskId);
        
        if (taskIndex === -1) {
            console.error('Could not find task in localStorage:', taskId);
            return;
        }
        
        // Update task with rating and verification timestamp
        allTasks[taskIndex].taskRating = rating;
        allTasks[taskIndex].verifiedAt = new Date().toISOString();
        allTasks[taskIndex].status = 'verified';
        
        // Add rating to task completer's profile
        const completerId = allTasks[taskIndex].assignedTo;
        this.addRatingToUserProfile(completerId, rating, 'asCompleter');
        
        // Save back to localStorage
        localStorage.setItem('taskhive_tasks', JSON.stringify(allTasks));
        
        console.log(`Added ${rating}-star rating to task ${taskId}`);
    },
    
    addRatingToUserProfile(userId, rating, ratingType) {
        // For tasks array-style user objects
        if (typeof userId === 'object' && userId.id) {
            userId = userId.id;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
        const userIndex = users.findIndex(u => String(u.id) === String(userId));
        
        if (userIndex === -1) {
            console.error('User not found:', userId);
            return;
        }
        
        // Initialize ratings object if it doesn't exist
        if (!users[userIndex].ratings) {
            users[userIndex].ratings = {
                asCreator: [],
                asCompleter: []
            };
        }
        
        // Add rating to the appropriate category
        users[userIndex].ratings[ratingType].push(rating);
        
        // Save back to localStorage
        localStorage.setItem('taskhive_users', JSON.stringify(users));
        
        console.log(`Added ${rating}-star rating to user ${userId} as ${ratingType}`);
    },
    
    updateProfileStatistics(task) {
        // Get current user - this will be the task creator in verification context
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;
        
        // Get users from localStorage to update statistics
        const users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
        
        // Update creator's stats (current user)
        const creatorIndex = users.findIndex(u => String(u.id) === String(currentUser.id));
        if (creatorIndex !== -1) {
            // Increment tasksCreated count
            users[creatorIndex].tasksCreated = (users[creatorIndex].tasksCreated || 0) + 1;
            
            // Update average rating as creator
            this.updateAverageRating(users[creatorIndex], 'asCreator');
        }
        
        // Update completer's stats (task assignee)
        const completerId = task.assignedTo._id || task.assignedTo;
        const completerIndex = users.findIndex(u => String(u.id) === String(completerId));
        if (completerIndex !== -1) {
            // Increment tasksCompleted count
            users[completerIndex].tasksCompleted = (users[completerIndex].tasksCompleted || 0) + 1;
            
            // Update average rating as completer
            this.updateAverageRating(users[completerIndex], 'asCompleter');
        }
        
        // Save updated users array to localStorage
        localStorage.setItem('taskhive_users', JSON.stringify(users));
    },
    
    updateAverageRating(user, role) {
        if (!user.ratings || user.ratings.length === 0) return;
        
        // Calculate average rating for the given role
        const totalRating = user.ratings[role].reduce((sum, r) => sum + r, 0);
        const averageRating = totalRating / user.ratings[role].length;
        
        // Update user's average rating
        user[`averageRating${role === 'asCreator' ? 'Creator' : 'Completer'}`] = parseFloat(averageRating.toFixed(2));
    },
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return new Date(dateString).toLocaleString('en-US', options).replace(',', '');
    },

    highlightStars(rating) {
        const stars = document.querySelectorAll('#verification-star-rating i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far', 'fa-star');
                star.classList.add('fas', 'fa-star');
            } else {
                star.classList.remove('fas', 'fa-star');
                star.classList.add('far', 'fa-star');
            }
        });
    },    showToast(message, type = 'success') {
        // Create or get toast container
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
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
    },    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            
            // Reset verification modal specifically
            if (modalId === 'verification-modal') {
                RatingSystem.reset();
                const noteField = document.getElementById('verification-note');
                if (noteField) noteField.value = '';
            }
            
            // Reset completion modal
            if (modalId === 'completion-modal') {
                const form = document.getElementById('completion-form');
                if (form) form.reset();
            }
        }
    },

    viewTaskDetails(taskId) {
        const task = this.allTasks.find(t => t._id === taskId || t.id === taskId);
        if (!task) return;
        
        // Fill in the task details in the modal
        document.getElementById('task-detail-title').textContent = this.escapeHtml(task.title);
        document.getElementById('task-detail_description').textContent = this.escapeHtml(task.description);
        
        // Show location if available
        const taskLocation = document.getElementById('task-detail-location');
        if (task.location) {
            taskLocation.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                ${this.escapeHtml(task.location)}
            `;
            taskLocation.style.display = 'flex';
        } else {
            taskLocation.style.display = 'none';
        }
        
        // Show completion note if available
        const completionNote = document.getElementById('task-detail-completion-note');
        if (task.completionNote) {
            completionNote.innerHTML = `
                <i class="fas fa-sticky-note"></i>
                <strong>Completion Note:</strong> ${this.escapeHtml(task.completionNote)}
            `;
            completionNote.style.display = 'flex';
        } else {
            completionNote.style.display = 'none';
        }
        
        // Set up timestamps
        document.getElementById('task-detail-created-at').innerHTML = `
            <i class="fas fa-calendar-plus"></i>
            Created: ${this.formatDate(task.createdAt)}
        `;
        if (task.completedAt) {
            document.getElementById('task-detail-completed-at').innerHTML = `
                <i class="fas fa-check-circle"></i>
                Completed: ${this.formatDate(task.completedAt)}
            `;
            document.getElementById('task-detail-completed-at').style.display = 'flex';
        } else {
            document.getElementById('task-detail-completed-at').style.display = 'none';
        }
        if (task.verifiedAt) {
            document.getElementById('task-detail-verified-at').innerHTML = `
                <i class="fas fa-award"></i>
                Verified: ${this.formatDate(task.verifiedAt)}
            `;
            document.getElementById('task-detail-verified-at').style.display = 'flex';
        } else {
            document.getElementById('task-detail-verified-at').style.display = 'none';
        }
        
        // Show task type and time estimates
        document.getElementById('task-detail-type').innerHTML = `
            <i class="fas ${typeIcon}"></i>
            ${this.formatTaskType(task.type || 'other')}
        `;
        document.getElementById('task-detail-time-estimate').innerHTML = `
            <i class="fas fa-clock"></i>
            ${task.timeEstimate || 'N/A'}
        `;
        
        // Show/hide action buttons
        const actionButtons = document.getElementById('task-detail-actions');
        actionButtons.innerHTML = '';
        if (task.status === 'in-progress' && task.assignedTo._id === this.currentUser.id) {
            actionButtons.innerHTML += `
                <button class="primary-button" id="complete-task-detail-btn">
                    <i class="fas fa-check"></i> Mark Completed
                </button>
            `;
        } else if (task.status === 'awaiting-verification' && task.createdBy._id === this.currentUser.id) {
            actionButtons.innerHTML += `
                <button class="primary-button" id="verify-task-detail-btn">
                    <i class="fas fa-award"></i> Verify Completion
                </button>
            `;
        }
        actionButtons.innerHTML += `
            <button class="secondary-button" id="close-task-detail-btn">
                <i class="fas fa-times"></i> Close
            </button>
        `;
        
        // Open the modal
        const modal = document.getElementById('task-detail-modal');
        modal.style.display = 'flex';
        modal.setAttribute('data-task-id', taskId);
        
        // Add event listeners for task detail actions
        document.getElementById('close-task-detail-btn').onclick = () => {
            this.closeModal('task-detail-modal');
        };
        if (task.status === 'in-progress' && task.assignedTo._id === this.currentUser.id) {
            document.getElementById('complete-task-detail-btn').onclick = () => {
                this.openCompletionModal(taskId);
            };
        } else if (task.status === 'awaiting-verification' && task.createdBy._id === this.currentUser.id) {
            document.getElementById('verify-task-detail-btn').onclick = () => {
                this.openVerificationModal(taskId);
            };
        }
    },

    formatTaskType(type) {
        const typeMapping = {
            'design': 'palette',
            'development': 'code',
            'marketing': 'bullhorn',
            'sales': 'dollar-sign',
            'support': 'headset',
            'other': 'cogs'
        };
        return typeMapping[type] || 'cogs';
    },    getUserName(userId) {
        const users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Unknown User';
    },    // Debug authentication status
    checkAuthStatus() {
        console.log('Checking auth status...');
        const token = localStorage.getItem('taskhive_token');
        const user = localStorage.getItem('taskhive_user');
        
        console.log('Token exists:', !!token);
        console.log('User exists:', !!user);
        
        if (token) {
            try {
                // Simple check - see if it's a valid JWT format
                const parts = token.split('.');
                if (parts.length !== 3) {
                    console.warn('Token does not appear to be a valid JWT (wrong number of segments)');
                    return false;
                }
                
                // Try to decode the payload to check for user.id
                const payload = JSON.parse(atob(parts[1]));
                console.log('Token payload:', payload);
                return true;
            } catch (e) {
                console.error('Error parsing token:', e);
                return false;
            }
        }
        return false;
    },

    // Test login function
    async testLogin() {
        try {
            const loginResult = await Auth.login('test@example.com', 'password123');
            console.log('Test login successful:', loginResult);
            this.showToast('Test login successful', 'success');
            setTimeout(() => this.loadTasks(), 1000);
            return true;
        } catch (error) {
            console.error('Test login failed:', error);
            this.showToast('Test login failed: ' + error.message, 'error');
            return false;
        }
    },
    
    // Create sample task for testing
    async createSampleTask() {
        if (!this.currentUser) return;
        
        try {
            console.log('Creating sample task...');
            
            // Create the sample task with the API
            const sampleTask = {
                title: '🧪 Test Verification Task',
                description: 'This task is ready for verification with star rating.',
                type: 'delivery',
                timeWindow: 60,
                location: 'Sample Location'
            };
            
            const response = await fetch('http://localhost:5000/api/tasks', {
                method: 'POST',
                headers: {
                    ...Auth.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sampleTask)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create sample task: ${response.status}`);
            }
            
            console.log('Sample task created successfully');
            this.showToast('Sample task created! Look for "🧪 Test Verification Task"', 'success');
            
            // Refresh task list
            this.loadTasks();
        } catch (error) {
            console.error('Error creating sample task:', error);
            this.showToast('Failed to create sample task: ' + error.message, 'error');
        }
        this.loadTasks();
    },

    // Generate star rating display for completed tasks
    generateStarRating(rating) {
        if (!rating) return '';
        
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '★';
            } else {
                stars += '☆';
            }
        }
        return `<span class="stars">${stars}</span>`;
    },    addTestButtons() {
        console.log('Adding test buttons to the interface');
        const dashboardActions = document.querySelector('.dashboard-actions');
        if (!dashboardActions) {
            console.warn('Dashboard actions not found, can\'t add test buttons');
            return;
        }
        
        // Add test rating button
        if (!document.getElementById('test-rating-btn')) {
            const testRatingButton = document.createElement('button');
            testRatingButton.id = 'test-rating-btn';
            testRatingButton.className = 'secondary-button';
            testRatingButton.innerHTML = '<i class="fas fa-star"></i> Test Rating';
            testRatingButton.onclick = () => {
                console.log('Testing rating system...');
                window.testRatingSystemNow();
            };
            dashboardActions.appendChild(testRatingButton);
        }
        
        // Add create sample task button
        if (!document.getElementById('create-sample-btn')) {
            const createSampleButton = document.createElement('button');
            createSampleButton.id = 'create-sample-btn';
            createSampleButton.className = 'secondary-button';
            createSampleButton.innerHTML = '<i class="fas fa-plus"></i> Sample Task';
            createSampleButton.onclick = () => {
                console.log('Creating sample task...');
                this.createSampleTask();
            };
            dashboardActions.appendChild(createSampleButton);
        }
        
        // Add test modal button
        if (!document.getElementById('test-modal-btn')) {
            const testModalButton = document.createElement('button');
            testModalButton.id = 'test-modal-btn';
            testModalButton.className = 'secondary-button';
            testModalButton.innerHTML = '<i class="fas fa-window-restore"></i> Test Modal';
            testModalButton.onclick = () => {
                console.log('Testing verification modal...');
                window.testModal();
            };
            dashboardActions.appendChild(testModalButton);
        }
        
        console.log('Test buttons added to interface');
    },

    showRewardNotification(amount, taskTitle) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.reward-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'reward-notification';
            notification.innerHTML = `
                <div class="reward-notification-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="reward-notification-content">
                    <div class="reward-notification-title">Task Reward!</div>
                    <div class="reward-notification-text">You earned</div>
                    <div class="reward-notification-amount">$0.00</div>
                </div>
            `;
            document.body.appendChild(notification);
        }
        
        // Update notification content
        notification.querySelector('.reward-notification-text').textContent = 
            `For completing: ${taskTitle.length > 30 ? taskTitle.substring(0, 30) + '...' : taskTitle}`;
        notification.querySelector('.reward-notification-amount').textContent = 
            `$${amount.toFixed(2)}`;
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
            
            // Hide after 5 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
        }, 300);
    },
};

// Rating System
const RatingSystem = {
    currentRating: 0,
    
    initializeStarRating() {
        console.log('Initializing star rating system...');
        const stars = document.querySelectorAll('#verification-star-rating .star');
        const ratingText = document.getElementById('rating-text');
        const verifyBtn = document.getElementById('verify-task-btn');
        
        // Reset rating
        this.currentRating = 0;
        this.updateStarDisplay(0);
        if (verifyBtn) {
            verifyBtn.disabled = true;
        } else {
            console.error('Verify button not found in the DOM');
        }
        
        if (stars.length === 0) {
            console.error('No stars found in the DOM');
            return;
        }
        
        console.log('Found', stars.length, 'stars in the rating system');
        
        // Remove any existing event listeners first (to avoid duplicates)
        stars.forEach(star => {
            const newStar = star.cloneNode(true);
            star.parentNode.replaceChild(newStar, star);
        });
        
        // Re-query after cloning
        const freshStars = document.querySelectorAll('#verification-star-rating .star');
        
        // Add event listeners
        freshStars.forEach((star, index) => {
            const rating = index + 1;
            
            star.addEventListener('mouseenter', () => {
                this.updateStarDisplay(rating, true);
                this.updateRatingText(rating);
            });
            
            star.addEventListener('mouseleave', () => {
                this.updateStarDisplay(this.currentRating);
                this.updateRatingText(this.currentRating);
            });
            
            star.addEventListener('click', () => {
                console.log('Star clicked, setting rating to:', rating);
                this.currentRating = rating;
                this.updateStarDisplay(rating);
                this.updateRatingText(rating);
                
                const freshVerifyBtn = document.getElementById('verify-task-btn');
                if (freshVerifyBtn) {
                    freshVerifyBtn.disabled = false;
                    console.log('Verify button enabled');
                }
                
                console.log('Rating selected:', rating);
            });
        });
        
        console.log('Star rating system initialized');
    },
    
    updateStarDisplay(rating, isHover = false) {
        const stars = document.querySelectorAll('#verification-star-rating .star');
        stars.forEach((star, index) => {
            star.classList.remove('active');
            if (index < rating) {
                star.classList.add('active');
            }
        });
    },
    
    updateRatingText(rating) {
        const ratingText = document.getElementById('rating-text');
        if (!ratingText) return;
        
        const texts = {
            0: 'Click to rate',
            1: '1 Star - Poor',
            2: '2 Stars - Fair',
            3: '3 Stars - Good',
            4: '4 Stars - Very Good',
            5: '5 Stars - Excellent'
        };
        
        ratingText.textContent = texts[rating] || 'Click to rate';
    },
    
    getRating() {
        return this.currentRating;
    },
    
    reset() {
        this.currentRating = 0;
        this.updateStarDisplay(0);
        this.updateRatingText(0);
        const verifyBtn = document.getElementById('verify-task-btn');
        if (verifyBtn) verifyBtn.disabled = true;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MyTasks.init();
    
    // Add a global test function for the rating system
    window.testRatingSystemNow = function() {
        console.log('=== TESTING RATING SYSTEM ===');
        
        // 1. Check if modal exists
        const modal = document.getElementById('verification-modal');
        console.log('Modal exists:', !!modal);
        
        // 2. Show the modal
        if (modal) {
            modal.style.display = 'flex';
            console.log('Modal displayed');
            
            // 3. Check if stars exist
            setTimeout(() => {
                const stars = document.querySelectorAll('#verification-star-rating .star');
                console.log('Stars found:', stars.length);
                
                if (stars.length > 0) {
                    console.log('Initializing rating system...');
                    RatingSystem.initializeStarRating();
                    
                    // 4. Test clicking a star
                    setTimeout(() => {
                        console.log('Testing star click...');
                        const firstStar = stars[0];
                        firstStar.click();
                        console.log('First star clicked, current rating:', RatingSystem.getRating());
                        
                        const verifyBtn = document.getElementById('verify-task-btn');
                        console.log('Verify button enabled:', !verifyBtn.disabled);
                    }, 500);
                } else {
                    console.log('ERROR: No stars found!');
                }
            }, 200);
        } else {
            console.log('ERROR: Modal not found!');
        }
    };
    
    console.log('Test function added. Run testRatingSystemNow() in console to test.');
});

// Debug and test functions
window.testModal = function() {
    console.log('Testing modal...');
    const modal = document.getElementById('verification-modal');
    if (modal) {
        console.log('Modal found');
        modal.style.display = 'flex';
        setTimeout(() => {
            RatingSystem.initializeStarRating();
        }, 100);
    } else {
        console.log('Modal not found!');
    }
};

window.testRating = function() {
    console.log('Testing rating system...');
    console.log('RatingSystem:', RatingSystem);
    const stars = document.querySelectorAll('#verification-star-rating .star');
    console.log('Found stars:', stars.length);
    stars.forEach((star, i) => {
        console.log(`Star ${i+1}:`, star);
    });
};
