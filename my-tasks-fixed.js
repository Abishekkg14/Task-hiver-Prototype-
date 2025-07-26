// Fixed version of loadTasks function for My Tasks page

// This function will be called from the My Tasks page
async function fixedLoadTasks() {
    console.log('Running fixed version of loadTasks...');
    
    // Show loading state
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('tasks-grid').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    
    try {
        // Check if user is authenticated
        const token = localStorage.getItem('taskhive_token');
        const userData = localStorage.getItem('taskhive_user');
        
        if (!token || !userData) {
            console.warn('User not authenticated - no token or user data');
            showError('You need to login first. Click "Test Login" to use test credentials.');
            return;
        }
        
        const user = JSON.parse(userData);
        console.log('Auth token:', token);
        console.log('User data:', user);
        
        // Fetch tasks from server API
        console.log('Fetching tasks from API...');
        const response = await fetch('http://localhost:5000/api/tasks', {
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        });

        console.log('API response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.warn('Unauthorized - invalid or expired token');
                showError('Your session has expired. Please login again.');
                // Clear invalid token
                localStorage.removeItem('taskhive_token');
                setTimeout(() => {
                    window.location.href = 'welcomepage1.html';
                }, 2000);
                return;
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse the response
        const tasks = await response.json();
        console.log('Tasks loaded:', tasks.length);
        
        if (tasks.length === 0) {
            console.log('No tasks found');
            document.getElementById('empty-state').style.display = 'flex';
            document.getElementById('loading-state').style.display = 'none';
            return;
        }
        
        // Render tasks to the grid
        renderTasks(tasks, user);
    } catch (error) {
        console.error('Error loading tasks:', error);
        
        let errorMessage = 'Failed to load your tasks. Please check your connection and try again.';
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            errorMessage = 'Network error: Could not connect to the server. Please check your internet connection.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Authentication error: Please log in again.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error: The server encountered an issue. Please try again later.';
        }
        
        showError(errorMessage);
    }
}

// Show error message
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').style.display = 'flex';
    document.getElementById('tasks-grid').style.display = 'none';
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
}

// Render tasks to the grid
function renderTasks(tasks, currentUser) {
    const taskGrid = document.getElementById('tasks-grid');
    if (!taskGrid) return;
    
    taskGrid.innerHTML = '';
    
    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.taskId = task._id;
        
        const statusClass = getStatusClass(task.status);
        const statusText = formatStatus(task.status);
        
        taskCard.innerHTML = `
            <div class="task-status ${statusClass}">${statusText}</div>
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <p class="task-description">${escapeHtml(task.description || 'No description provided')}</p>
            <div class="task-meta">
                <div class="task-time">
                    <i class="fas fa-clock"></i>
                    <span>${task.timeWindow || 60} minutes</span>
                </div>
                <div class="task-creator">
                    <i class="fas fa-user"></i>
                    <span>By ${task.createdBy?.name || 'Unknown User'}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="secondary-button view-task-btn" data-task-id="${task._id}">View Details</button>
                ${task.status === 'available' ? 
                    `<button class="primary-button accept-task-btn" data-task-id="${task._id}">Accept Task</button>` : ''}
                ${task.status === 'in-progress' && task.assignedTo && task.assignedTo._id === currentUser.id ? 
                    `<button class="primary-button complete-task-btn" data-task-id="${task._id}">Mark Completed</button>` : ''}
                ${task.status === 'awaiting-verification' && task.createdBy._id === currentUser.id ? 
                    `<button class="primary-button verify-task-btn" data-task-id="${task._id}">Verify</button>` : ''}
            </div>
        `;
        
        taskGrid.appendChild(taskCard);
    });
    
    document.getElementById('tasks-grid').style.display = 'grid';
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    
    // Add event listeners to task cards
    addTaskEventListeners();
}

// Helper functions
function getStatusClass(status) {
    const statusMap = {
        'available': 'status-available',
        'in-progress': 'status-in-progress',
        'awaiting-verification': 'status-awaiting',
        'verified': 'status-verified',
        'completed': 'status-completed'
    };
    return statusMap[status] || 'status-available';
}

function formatStatus(status) {
    const statusMap = {
        'available': 'Available',
        'in-progress': 'In Progress',
        'awaiting-verification': 'Awaiting Verification',
        'verified': 'Verified',
        'completed': 'Completed'
    };
    return statusMap[status] || 'Available';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addTaskEventListeners() {
    // Add event listeners to task buttons here
    console.log('Adding event listeners to task buttons');
}

// Login test function
async function testLogin() {
    try {
        console.log('Attempting test login...');
        
        // Call the login endpoint
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Login failed');
        }
        
        // Store token and user data
        localStorage.setItem('taskhive_token', data.token);
        localStorage.setItem('taskhive_user', JSON.stringify(data.user));
        
        console.log('Test login successful!');
        showToast('Login successful! Loading tasks...', 'success');
        
        // Load tasks after successful login
        setTimeout(fixedLoadTasks, 1000);
        
    } catch (error) {
        console.error('Test login failed:', error);
        showToast('Login failed: ' + error.message, 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
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
    
    // Force reflow for animation
    toast.offsetHeight;
    
    // Show toast
    toast.classList.add('show');
    
    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Fixed script loaded!');
    
    // Add event listener to refresh button
    const refreshBtn = document.getElementById('refresh-tasks-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fixedLoadTasks);
    }
    
    // Add event listener to test login button
    const testLoginBtn = document.getElementById('test-login-btn');
    if (testLoginBtn) {
        testLoginBtn.addEventListener('click', testLogin);
    }
    
    // Load tasks on page load
    fixedLoadTasks();
});
