// MongoDB & User Authentication
// We'll use a simple client-side approach with local storage for the frontend
// and create server endpoints to handle user authentication securely

// API endpoints - replace with your actual backend URL when deployed
const API_URL = 'http://localhost:3000/api';

// Initialize app state
const TaskHive = {
    currentUser: null,
    tasks: [],
    
    // Check if user is logged in (from localStorage)
    init() {
        console.log("Initializing TaskHive...");
        console.log("localStorage keys:", Object.keys(localStorage));
        
        const userData = localStorage.getItem('taskhive_user');
        console.log("Raw user data from localStorage:", userData);
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log("User logged in successfully:", this.currentUser);
            } catch (e) {
                console.error("Error parsing user data", e);
                localStorage.removeItem('taskhive_user');
            }
        } else {
            console.log("No user data found in localStorage");
        }
    }
};

// DOM Elements
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.querySelector('.login-btn');
const signupBtn = document.querySelector('.signup-btn');
const showLoginBtn = document.getElementById('show-login');
const showSignupBtn = document.getElementById('show-signup');
const closeModalBtns = document.querySelectorAll('.close-modal');
const getStartedBtn = document.getElementById('get-started-btn');
const signupCtaBtn = document.getElementById('signup-cta');

// Modal Event Listeners
loginBtn?.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

signupBtn?.addEventListener('click', () => {
    signupModal.style.display = 'flex';
});

showLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.style.display = 'none';
    loginModal.style.display = 'flex';
});

showSignupBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    signupModal.style.display = 'flex';
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        signupModal.style.display = 'none';
    });
});

getStartedBtn?.addEventListener('click', () => {
    signupModal.style.display = 'flex';
});

signupCtaBtn?.addEventListener('click', () => {
    signupModal.style.display = 'flex';
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === signupModal) {
        signupModal.style.display = 'none';
    }
});

// Authentication
loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log("Login attempt for:", email);
    
    // Show loading state
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";
    
    // Get users from localStorage
    const demoUsers = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
    console.log("Available users:", demoUsers.length);
    
    // Find user with matching credentials
    const user = demoUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        console.log("User found:", user.name);
        
        // Remove password from user object before storing in local storage
        const { password: pwd, ...safeUserData } = user;
        
        try {
            // Store user data in localStorage
            localStorage.setItem('taskhive_user', JSON.stringify(safeUserData));
            console.log("User data stored in localStorage");
            
            // Update TaskHive state
            TaskHive.currentUser = safeUserData;
            
            // Create a demo task if there are none
            const tasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
            if (tasks.length === 0) {
                const demoTask = {
                    id: 'task_demo_' + Date.now(),
                    title: 'Pick up groceries from the store',
                    description: 'Need someone to pick up my grocery order from Whole Foods. It\'s already paid for, just need pick up.',
                    timeWindow: 30,
                    location: 'Whole Foods Market, Main Street',
                    status: 'available',
                    createdBy: safeUserData.id,
                    creatorName: safeUserData.name,
                    createdAt: new Date().toISOString()
                };
                tasks.push(demoTask);
                localStorage.setItem('taskhive_tasks', JSON.stringify(tasks));
            }
            
            // Redirect to dashboard after successful login
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Error saving user data:", error);
            alert("An error occurred during login. Please try again.");
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } else {
        console.log("User not found");
        alert("Invalid email or password. Please try again.");
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    console.log("Sign up attempt for:", email);
    
    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }
    
    // Show loading state
    const submitButton = signupForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";
    
    try {
        // Get existing users or initialize empty array
        const existingUsers = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
        console.log("Existing users:", existingUsers.length);
        
        // Check if email already exists
        if (existingUsers.some(user => user.email === email)) {
            alert("This email is already registered. Please use another email or login.");
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            name,
            email,
            password, // In production, this would be hashed on the server
            createdAt: new Date().toISOString()
        };
        
        console.log("New user created:", newUser.name);
        
        // Add user to "database" (localStorage for demo)
        existingUsers.push(newUser);
        localStorage.setItem('taskhive_users', JSON.stringify(existingUsers));
        console.log("User added to localStorage");
        
        // Log user in (without password in session)
        const { password: pwd, ...safeUserData } = newUser;
        localStorage.setItem('taskhive_user', JSON.stringify(safeUserData));
        console.log("User logged in and stored in localStorage");
        
        TaskHive.currentUser = safeUserData;
        
        // Create a welcome task for the new user
        const tasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
        const welcomeTask = {
            id: 'task_welcome_' + Date.now(),
            title: 'Welcome to TaskHive!',
            description: 'This is your first task. You can create more tasks or accept tasks from others in your community.',
            timeWindow: 60,
            location: '',
            status: 'available',
            createdBy: safeUserData.id,
            creatorName: safeUserData.name,
            createdAt: new Date().toISOString()
        };
        tasks.push(welcomeTask);
        localStorage.setItem('taskhive_tasks', JSON.stringify(tasks));
        
        // Redirect to dashboard after successful signup
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Error creating user:", error);
        alert("An error occurred during sign up. Please try again.");
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Check auth state on page load
document.addEventListener('DOMContentLoaded', () => {
    TaskHive.init();
    
    // Create test user if we're on the welcome page
    if (window.location.pathname.includes('welcomepage1.html')) {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
        
        // Check if test user already exists
        const testUserExists = users.some(user => user.email === 'demo@example.com');
        
        if (users.length === 0 || !testUserExists) {
            console.log("Creating test user for demonstration...");
            // Create a test user for demonstration
            const testUser = {
                id: 'user_demo',
                name: 'Demo User',
                email: 'demo@example.com',
                password: 'password123',
                createdAt: new Date().toISOString()
            };
            
            // Add test user without overwriting existing users
            const updatedUsers = [...users];
            if (!testUserExists) {
                updatedUsers.push(testUser);
            }
            
            // Save to localStorage
            localStorage.setItem('taskhive_users', JSON.stringify(updatedUsers));
            console.log("Test user created! You can login with:");
            console.log("Email: demo@example.com");
            console.log("Password: password123");
        }
    }
    
    // Update UI based on auth state
    if (TaskHive.currentUser) {
        console.log("User is signed in:", TaskHive.currentUser.id);
        // Update UI elements if needed
        updateUserUIElements();
    } else {
        console.log("User is signed out");
    }
});

// Update the UI elements with user information
function updateUserUIElements() {
    if (!TaskHive.currentUser) return;

    // Update user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = TaskHive.currentUser.name;
    }
    
    // Update user avatar
    const userAvatarImg = document.querySelector('.user-avatar img');
    if (userAvatarImg) {
        const profilePic = TaskHive.currentUser.profilePic || 
            `https://placehold.co/100x100/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
        userAvatarImg.src = profilePic;
    }
    
    // Handle sidebar menu highlighting
    const currentPage = window.location.pathname.includes('profile.html') ? 'profile' : 
                       window.location.pathname.includes('dashboard.html') ? 'dashboard' : '';
    
    if (currentPage) {
        // Remove active class from all menu items
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page link
        const activeLink = currentPage === 'profile' ? 
                          document.querySelector('.sidebar-menu a[href="profile.html"]') : 
                          document.querySelector('.sidebar-menu a[href="dashboard.html"]');
        
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Helper function to save tasks to localStorage and dispatch event for cross-tab sync
function saveTasksToLocalStorage(tasks) {
    localStorage.setItem('taskhive_tasks', JSON.stringify(tasks));
    
    // Dispatch a storage event to notify other tabs
    const event = new Event('taskhive_tasks_updated');
    window.dispatchEvent(event);
}

// Listen for storage events to apply task changes from other tabs
window.addEventListener('storage', function(event) {
    if (event.key === 'taskhive_tasks') {
        console.log('Tasks updated in another tab, refreshing...');
        loadTasks();
    }
});

// Utility function to reset localStorage (for development/testing)
function resetLocalStorage() {
    localStorage.removeItem('taskhive_users');
    localStorage.removeItem('taskhive_user');
    localStorage.removeItem('taskhive_tasks');
    console.log("LocalStorage has been reset");
}

// Only uncomment this when you need to completely reset the app
// resetLocalStorage();

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Check if we're on the dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    console.log("Dashboard detected, initializing...");
    // Dashboard specific code
    loadDashboard();
}

function loadDashboard() {
    console.log("Loading dashboard...");
    
    // Check if user is logged in from localStorage directly
    const userData = localStorage.getItem('taskhive_user');
    console.log("User data from localStorage (dashboard):", userData);
    
    if (!userData) {
        console.log("No user data found, redirecting to welcome page");
        // Redirect to home if not logged in
        window.location.href = 'welcomepage1.html';
        return;
    }
    
    // Parse user data
    try {
        const user = JSON.parse(userData);
        TaskHive.currentUser = user; // Update app state
        
        // Load user data into UI
        updateUserUIElements();
        console.log("User data updated in UI:", user.name);
        
        // Apply any saved settings
        applyUserSettings();
        
        // Load tasks
        loadTasks();
    } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem('taskhive_user');
        window.location.href = 'welcomepage1.html';
    }
}

function loadTasks() {
    console.log("Loading tasks...");
    
    const taskGrid = document.getElementById('task-grid');
    if (!taskGrid) {
        console.error("Task grid element not found!");
        return;
    }
    
    // For the demo, we'll use localStorage to store tasks
    const tasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    console.log("Tasks loaded from localStorage:", tasks.length);
    
    // Clear existing content with fade-out effect
    const existingCards = taskGrid.querySelectorAll('.task-card');
    if (existingCards.length > 0) {
        existingCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
        });
        
        // Small delay before removing cards to allow animation to complete
        setTimeout(() => {
            taskGrid.innerHTML = '';
            displayTasks(tasks, taskGrid);
        }, 300);
    } else {
        taskGrid.innerHTML = '';
        displayTasks(tasks, taskGrid);
    }
}

function displayTasks(tasks, taskGrid) {
    if (tasks.length === 0) {
        console.log("No tasks available");
        taskGrid.innerHTML = '<p class="no-tasks-message"><i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 15px; color: #ddd;"></i><br>No tasks available. Create a new task!</p>';
        return;
    }
    
    // Sort tasks by creation date (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Add tasks to the grid with staggered animations
    tasks.forEach((task, index) => {
        console.log("Creating card for task:", task.title);
        const taskCard = createTaskCard(task.id, task);
        
        // Add staggered animation delay
        taskCard.style.animationDelay = `${0.1 * (index % 10)}s`;
        
        taskGrid.appendChild(taskCard);
    });
    
    console.log("Tasks loaded successfully");
}

function createTaskCard(id, task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    let statusClass = '';
    switch(task.status) {
        case 'available':
            statusClass = 'status-available';
            break;
        case 'in-progress':
            statusClass = 'status-in-progress';
            break;
        case 'awaiting-verification':
            statusClass = 'status-awaiting';
            break;
        case 'verified':
            statusClass = 'status-verified';
            break;
    }
      card.innerHTML = `
        <div class="task-status ${statusClass}">${formatStatus(task.status)}</div>
        <h3 class="task-title">${task.title}</h3>{formatStatus(task.status)}</div>
        <p class="task-details">${truncateText(task.description, 100)}</p>
        <div class="task-meta">>${truncateText(task.description, 100)}</p>
            <div class="task-time">
                <i class="fas fa-clock"></i>
                <span>${formatDuration(task.timeWindow)}</span>
            </div>
            <div class="task-type">
                <i class="fas ${getTypeIcon(task.type)}"></i>ta-id="${id}">View Info</button>
                <span>${formatTaskType(task.type || 'other')}</span>
            </div>button class="primary-button accept-task-btn" data-id="${id}">Accept Task</button>` : ''}
        </div>
        <div class="task-actions">
            <button class="secondary-button view-task-btn" data-id="${id}">View Info</button>
            ${task.status === 'available' ? n
                `<button class="primary-button accept-task-btn" data-id="${id}">Accept Task</button>` : ''}
        </div>skDetails(id);
    `;;
    
    // Add event listener to view task buttonon if it exists
    card.querySelector('.view-task-btn').addEventListener('click', () => {
        openTaskDetails(id);
    }); acceptBtn.addEventListener('click', () => {
            acceptTask(id);
    // Add event listener to accept task button if it exists
    const acceptBtn = card.querySelector('.accept-task-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            acceptTask(id);
        });
    }ion formatStatus(status) {
    switch(status) {
    return card;ailable': return 'Available';
}       case 'in-progress': return 'In Progress';
        case 'awaiting-verification': return 'Awaiting Verification';
function formatStatus(status) { 'Verified';
    switch(status) {urn status;
        case 'available': return 'Available';
        case 'in-progress': return 'In Progress';
        case 'awaiting-verification': return 'Awaiting Verification';
        case 'verified': return 'Verified';
        default: return status;es`;
    }
}
function truncateText(text, maxLength) {urn text;
    return `${timeWindow} minutes`;) + '...';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;askId);
    return text.substr(0, maxLength) + '...';
}   // Get all tasks from localStorage
    const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
function openTaskDetails(taskId) {> t.id === taskId);
    console.log("Opening task details for:", taskId);
    if (!task) {
    // Get all tasks from localStorage", taskId);
    const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    const task = allTasks.find(t => t.id === taskId);
    }
    if (!task) {
        console.error("Task not found:", taskId);
        alert("Task not found!");
        return;odal
    }onst modal = document.createElement('div');
    modal.className = 'modal task-details-modal';
    console.log("Found task:", task);
    
    // Create modal = `
    const modal = document.createElement('div');
    modal.className = 'modal task-details-modal';an>
    modal.style.display = 'flex';k-header">
                <h2>${task.title}</h2>
    modal.innerHTML = `ass="task-status ${getStatusClass(task.status)}">${formatStatus(task.status)}</div>
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-task-header">
                <h2>${task.title}</h2>iption">
                <div class="task-status ${getStatusClass(task.status)}">${formatStatus(task.status)}</div>
            </div>div>
                
            <div class="modal-task-info">
                <div class="task-description">i>
                    <p>${task.description}</p>tDuration(task.timeWindow)}</span>
                </div>
                ${task.location ? `
                <div class="task-time">
                    <i class="fas fa-clock"></i>s="map-container"></div>
                    <span>Time Window: ${formatDuration(task.timeWindow)}</span>
                </div>  <i class="fas fa-map-marker-alt"></i> ${task.location}
                ${task.location ? `
                <div class="task-map">
                    <div id="map-${taskId}" class="map-container"></div>
                    <div class="location-display">
                        <i class="fas fa-map-marker-alt"></i> ${task.location}
                    </div>="task-timer">
                </div>3>Time Remaining</h3>
                ` : ''}v class="timer-display" id="timer-display">00:00:00</div>
                </div>
                ${task.status === 'in-progress' ? `>
                <div class="task-timer"></h3>
                    <h3>Time Remaining</h3>on-map-${taskId}" class="map-container"></div>
                    <div class="timer-display" id="timer-display">00:00:00</div>askId}">Update My Location</button>
                </div>
                <div class="user-location-tracking">
                    <h3>Current Location</h3>
                    <div id="current-location-map-${taskId}" class="map-container"></div>
                    <button class="secondary-button" id="update-location-btn-${taskId}">Update My Location</button>
                </div>askActionButtons(task, taskId)}
                ` : ''}
            </div>
            
            <div class="task-actions">
                ${getTaskActionButtons(task, taskId)}
            </div>
        </div>se button event listener
    `;dal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);sk.location);
    });
    
    // Initialize map if there's a location
    if (task.location) {'in-progress' && task.startTime) {
        initializeMap(`map-${taskId}`, task.location);timer-display'));
    }   
        // Initialize user location tracking if in progress
    // Start timer if task is in progress-location-map-${taskId}`, taskId);
    if (task.status === 'in-progress' && task.startTime) {
        startTaskTimer(task, document.getElementById('timer-display'));
        const updateLocationBtn = document.getElementById(`update-location-btn-${taskId}`);
        // Initialize user location tracking if in progress
        initUserLocationTracking(`current-location-map-${taskId}`, taskId);
                updateUserLocation(taskId, `current-location-map-${taskId}`);
        // Add event listener for location update button
        const updateLocationBtn = document.getElementById(`update-location-btn-${taskId}`);
        if (updateLocationBtn) {
            updateLocationBtn.addEventListener('click', () => {
                updateUserLocation(taskId, `current-location-map-${taskId}`);
            });nBtns = modal.querySelectorAll('.task-action-btn');
        }nBtns.forEach(btn => {
    }   btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
    // Add event listeners for action buttonsdata-id');
    const actionBtns = modal.querySelectorAll('.task-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            const taskId = btn.getAttribute('data-id');
                case 'complete':
            switch(action) {Task(taskId);
                case 'accept':
                    acceptTask(taskId);
                    break;Task(taskId);
                case 'complete':
                    completeTask(taskId);
                    break;
                case 'verify':veChild(modal);
                    verifyTask(taskId);
                    break;
            }
            
            document.body.removeChild(modal);
        });status) {
    }); case 'available': return 'status-available';
}       case 'in-progress': return 'status-in-progress';
        case 'awaiting-verification': return 'status-awaiting';
function getStatusClass(status) {status-verified';
    switch(status) {urn '';
        case 'available': return 'status-available';
        case 'in-progress': return 'status-in-progress';
        case 'awaiting-verification': return 'status-awaiting';
        case 'verified': return 'status-verified';
        default: return '';m localStorage instead of Firebase
    }onst currentUser = TaskHive.currentUser;
}   if (!currentUser) return '';
    
function getTaskActionButtons(task, taskId) {
    // Get current user from localStorage instead of Firebase
    const currentUser = TaskHive.currentUser;tton task-action-btn" data-action="accept" data-id="${taskId}">Accept Task</button>`;
    if (!currentUser) return '';
            if (task.assignedTo === currentUser.id) {
    switch(task.status) {button class="primary-button task-action-btn" data-action="complete" data-id="${taskId}">Complete Task</button>`;
        case 'available':
            return `<button class="primary-button task-action-btn" data-action="accept" data-id="${taskId}">Accept Task</button>`;
        case 'in-progress':fication':
            if (task.assignedTo === currentUser.id) {
                return `<button class="primary-button task-action-btn" data-action="complete" data-id="${taskId}">Complete Task</button>`;`;
            }
            return '';
        case 'awaiting-verification':
            if (task.createdBy === currentUser.id) {
                return `<button class="primary-button task-action-btn" data-action="verify" data-id="${taskId}">Verify Completion</button>`;
            }
            return '';
        default:skTimer(task, timerElement) {
            return '';g date instead of using toDate() from Firebase
    }onst startTime = new Date(task.startTime);
}   const timeWindow = task.timeWindow * 60 * 1000; // Convert to milliseconds
    const endTime = new Date(startTime.getTime() + timeWindow);
function startTaskTimer(task, timerElement) {
    // Parse ISO string date instead of using toDate() from Firebase
    const startTime = new Date(task.startTime);
    const timeWindow = task.timeWindow * 60 * 1000; // Convert to milliseconds
    const endTime = new Date(startTime.getTime() + timeWindow);
        if (diff <= 0) {
    const updateTimer = () => {ntent = "00:00:00";
        const now = new Date();color = "red";
        const diff = endTime - now;
        }
        if (diff <= 0) {
            timerElement.textContent = "00:00:00"; * 60));
            timerElement.style.color = "red";000 * 60 * 60)) / (1000 * 60));
            return;ds = Math.floor((diff % (1000 * 60)) / 1000);
        }
        timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        t timerId = setInterval(updateTimer, 1000);
        timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }; Clean up timer when modal is closed
    const observer = new MutationObserver((mutations) => {
    updateTimer();forEach((mutation) => {
    const timerId = setInterval(updateTimer, 1000);
                clearInterval(timerId);
    // Clean up timer when modal is closed
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.removedNodes.length) {
                clearInterval(timerId);
                observer.disconnect();childList: true });
            }
        });
    });n acceptTask(taskId) {
    if (!TaskHive.currentUser) {
    observer.observe(document.body, { childList: true });
}       return;
    }
function acceptTask(taskId) {
    if (!TaskHive.currentUser) {
        alert("You must be logged in to accept tasks.");skhive_tasks') || '[]');
        return;ndex = allTasks.findIndex(t => t.id === taskId);
    }
    if (taskIndex === -1) {
    // Get all tasksnot found!");
    const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        alert("Task not found!");'in-progress';
        return;skIndex].assignedTo = TaskHive.currentUser.id;
    }llTasks[taskIndex].startTime = new Date().toISOString();
      // Save updated tasks using the helper function
    // Update task statusge(allTasks);
    allTasks[taskIndex].status = 'in-progress';
    allTasks[taskIndex].assignedTo = TaskHive.currentUser.id;
    allTasks[taskIndex].startTime = new Date().toISOString();{
      // Save updated tasks using the helper function
    saveTasksToLocalStorage(allTasks);
        window.location.href = 'dashboard.html';
    alert("Task accepted successfully!");
    if (window.location.pathname.includes('dashboard.html')) {
        loadTasks();
    } else {pleteTask(taskId) {
        window.location.href = 'dashboard.html';
    }onst allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
}   const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
function completeTask(taskId) {
    // Get all tasksnot found!");
    const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        alert("Task not found!");'awaiting-verification';
        return;skIndex].completedAt = new Date().toISOString();
    } // Save updated tasks using the helper function
    saveTasksToLocalStorage(allTasks);
    // Update task status
    allTasks[taskIndex].status = 'awaiting-verification';tion.");
    allTasks[taskIndex].completedAt = new Date().toISOString();
      // Save updated tasks using the helper function
    saveTasksToLocalStorage(allTasks);
    tion verifyTask(taskId) {
    alert("Task marked as completed! Waiting for verification.");
    loadTasks();ks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
}   const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
function verifyTask(taskId) {
    // Get all tasksnot found!");
    const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        alert("Task not found!");'verified';
        return;skIndex].verifiedAt = new Date().toISOString();
    } // Save updated tasks using the helper function
    saveTasksToLocalStorage(allTasks);
    // Update task status
    allTasks[taskIndex].status = 'verified';
    allTasks[taskIndex].verifiedAt = new Date().toISOString();
      // Save updated tasks using the helper function
    saveTasksToLocalStorage(allTasks);
    reate a new task
    alert("Task verified successfully!");tById('create-task-form');
    loadTasks();addEventListener('submit', (e) => {
}   e.preventDefault();
    
// Create a new task
const createTaskForm = document.getElementById('create-task-form');
createTaskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!TaskHive.currentUser) {
        alert("You must be logged in to create tasks.");
        return;
    }
    
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const timeWindow = parseInt(document.getElementById('task-time').value);
    const location = document.getElementById('task-location').value;
    const taskType = document.getElementById('task-type').value;
    
    // Create new task object
    const newTask = {
        id: 'task_' + Date.now(),
        title: title,
        description: description,
        timeWindow: timeWindow,
        location: location,
        type: taskType, // Add task type
        status: 'available',
        createdBy: TaskHive.currentUser.id,
        creatorName: TaskHive.currentUser.name, // Store creator name for display purposes
        createdAt: new Date().toISOString()
    };
    
    // Get existing tasks or initialize empty array
    const existingTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    
    // Add new task
    existingTasks.push(newTask);
    
    // Save tasks - using a helper function that sets localStorage and dispatches an event
    saveTasksToLocalStorage(existingTasks);
    
    alert("Task created successfully!");
    createTaskForm.reset();
    loadTasks();
    
    // Close the modal if it's open
    const createTaskModal = document.getElementById('create-task-modal');
    if (createTaskModal) {
        createTaskModal.style.display = 'none';
    }
});

// OpenStreetMap Integration Functions
    const map = L.map(mapElementId).setView([0, 0], 13);
    loadTasks();
}); // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
// OpenStreetMap Integration Functionshttps://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
function initializeMap(mapElementId, location) {
    // Initialize the map
    const map = L.map(mapElementId).setView([0, 0], 13);
    geocodeLocation(location).then(coords => {
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
            // Add a marker at the location
    // Perform geocoding with Nominatims.lon]).addTo(map)
    geocodeLocation(location).then(coords => {b><br>${location}`).openPopup();
        if (coords) {
            // Set the view to the geocoded locationap
            map.setView([coords.lat, coords.lon], 16);
            document.getElementById(mapElementId).innerHTML = 
            // Add a marker at the location text-align: center;">
            L.marker([coords.lat, coords.lon]).addTo(map)ion}</p>
                .bindPopup(`<b>Task Location</b><br>${location}`).openPopup();
        } else {</div>`;
            // If geocoding failed, show a default map
            map.setView([0, 0], 2);
            document.getElementById(mapElementId).innerHTML = 
                `<div style="padding: 20px; text-align: center;">
                    <p>Couldn't map the location: ${location}</p>
                    <p>Please provide a more specific address</p>rch?format=json&limit=1&q=${encodeURIComponent(location)}`;
                </div>`;
        }n fetch(nominatimUrl)
    }); .then(response => response.json())
}       .then(data => {
            if (data && data.length > 0) {
function geocodeLocation(location) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`;
                    lon: parseFloat(data[0].lon)
    return fetch(nominatimUrl)
        .then(response => response.json())
        .then(data => {;
            if (data && data.length > 0) {
                return {{
                    lat: parseFloat(data[0].lat),on:", error);
                    lon: parseFloat(data[0].lon)
                };
            }
            return null;
        })ation preview functionality for task creation form
        .catch(error => {ument.getElementById('task-location');
            console.error("Error geocoding location:", error);review-map');
            return null;
        });Marker = null;
}et debounceTimer;

// Add location preview functionality for task creation form
const locationInput = document.getElementById('task-location');
const locationPreviewMap = document.getElementById('location-preview-map');
let previewMap = null;= setTimeout(() => {
let previewMarker = null;n = locationInput.value.trim();
let debounceTimer;cation.length > 5) {
                if (!previewMap) {
                    // Initialize map if it doesn't exist yet
                    locationPreviewMap.style.height = '200px';
                    previewMap = L.map('location-preview-map').setView([0, 0], 2);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(previewMap);
                }       // Remove old marker if it exists
                        if (previewMarker) {
                // Geocode the locationremoveLayer(previewMarker);
                geocodeLocation(location).then(coords => {
                    if (coords) {
                        previewMap.setView([coords.lat, coords.lon], 16);
                        previewMarker = L.marker([coords.lat, coords.lon]).addTo(previewMap)
                        // Remove old marker if it exists/b><br>${location}`).openPopup();
                        if (previewMarker) {
                            previewMap.removeLayer(previewMarker);
                        }eviewMap) {
                        map if location is too short
                        // Add a new markeright = '0';
                        previewMarker = L.marker([coords.lat, coords.lon]).addTo(previewMap)
                            .bindPopup(`<b>Task Location</b><br>${location}`).openPopup();
                    }
                });
            } else if (previewMap) {
                // Hide map if location is too short
                locationPreviewMap.style.height = '0';) {
            }og("Initializing user location tracking for task:", taskId);        }, 500); // Debounce for 500ms
    });
}

// Add location tracking functions
function initUserLocationTracking(mapElementId, taskId) {
    console.log("Initializing user location tracking for task:", taskId);
    
    // Initialize the map
    const map = L.map(mapElementId).setView([0, 0], 13);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Update user location initially
    updateUserLocation(taskId, mapElementId, map);
    
    return map;
function updateUserLocation(taskId, mapElementId, existingMap = null) {
    console.log("Updating user location for task:", taskId);
    
    const map = existingMap || document.getElementById(mapElementId)._leaflet_map;
    if (!map) {
        console.error("Map not initialized for location tracking");
        return;
    }
    
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'location-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
    document.getElementById(mapElementId).appendChild(loadingDiv);
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
    document.getElementById(mapElementId).appendChild(loadingDiv);
            console.log("Got user location:", lat, lon);
    navigator.geolocation.getCurrentPosition(
        // Successove any existing markers
            const lon = position.coords.longitude;
                if (layer instanceof L.Marker) {
            console.log("Got user location:", lat, lon);
                }
            // Remove any existing markers
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);t, lon]).addTo(map)
                }bindPopup('You are here').openPopup();
            });
            // Center map on user's location
            // Add new marker at user's location
            const userMarker = L.marker([lat, lon]).addTo(map)
                .bindPopup('You are here').openPopup();
            updateTaskWithUserLocation(taskId, {lat, lon});
            // Center map on user's location
            map.setView([lat, lon], 16);
            if (document.querySelector('.location-loading')) {
            // Store location in taskId(mapElementId).removeChild(loadingDiv);
            updateTaskWithUserLocation(taskId, {lat, lon});
            
            // Remove loading indicator
            if (document.querySelector('.location-loading')) {
                document.getElementById(mapElementId).removeChild(loadingDiv);
            }lert(`Error getting your location: ${error.message}`);
        },  
        // Error callbackding indicator
        (error) => {ment.querySelector('.location-loading')) {
            console.error("Error getting location:", error);Child(loadingDiv);
            alert(`Error getting your location: ${error.message}`);
            
            // Remove loading indicator
            if (document.querySelector('.location-loading')) {
                document.getElementById(mapElementId).removeChild(loadingDiv);
            }imeout: 10000,
        },  maximumAge: 0
        // Options
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0erLocation(taskId, location) {
        }t all tasks
    );nst allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
}   const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
function updateTaskWithUserLocation(taskId, location) {
    // Get all tasksr("Task not found when updating location");
    const allTasks = JSON.parse(localStorage.getItem('taskhive_tasks') || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {ocation in the task
        console.error("Task not found when updating location");
        return;skIndex].locationUpdatedAt = new Date().toISOString();
    }
    // Save updated tasks using helper function for cross-tab sync
    // Add or update user location in the task
    allTasks[taskIndex].userLocation = location;:", location);
    allTasks[taskIndex].locationUpdatedAt = new Date().toISOString();
    
    // Save updated tasks using helper function for cross-tab sync
    saveTasksToLocalStorage(allTasks);yId('logout-btn');
    console.log("Task updated with user location:", location);
}   logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
// Logout button functionalityut user");
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) { user from localStorage
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log("Logging out user");
        window.location.href = 'welcomepage1.html';
        // Clear user from localStorage
        localStorage.removeItem('taskhive_user');
        
        // Redirect to welcome pagety
        window.location.href = 'welcomepage1.html'; {
    });(window.location.pathname.includes('dashboard.html')) {
}       console.log("Setting up dashboard menu functionality");
        
// Profile and Settings functionalityebar menu items
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        console.log("Setting up dashboard menu functionality");
        setupFilters();
        // Add click handlers for sidebar menu items
        setupSidebarMenu();

        // Set up status filter functionality
        setupFilters();tup for profile or settings links - we want default navigation to work
    }/ with our new dedicated pages
}); 
    const logoutLink = document.getElementById('logout-btn');
function setupSidebarMenu() {
    // IMPORTANT: No setup for profile or settings links - we want default navigation to work
    // with our new dedicated pages
    // Explicitly enable navigation for sidebar menu links
    const logoutLink = document.getElementById('logout-btn');').forEach(link => {
        console.log(`Ensuring navigation works for: ${link.getAttribute('href')}`);
    console.log("Navigation setup: Ensuring navigation works for all links");
            const href = this.getAttribute('href');
    // Explicitly enable navigation for sidebar menu links
    document.querySelectorAll('.sidebar-menu a[href$=".html"]').forEach(link => {
        console.log(`Ensuring navigation works for: ${link.getAttribute('href')}`);
        link.onclick = function(e) {
            const href = this.getAttribute('href');
            console.log(`Navigating to: ${href}`);
            window.location.href = href;
            return true;ting up settings link");
        };ttingsLink.addEventListener('click', function(e) {
    });     e.preventDefault();
            openSettingsModal();
    if (settingsLink) {
        console.log("Setting up settings link");
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openSettingsModal();
        });re logout functionality
    } else {utLink) {
        console.warn("Settings link not found");ction(e) {
    }       e.preventDefault();
            console.log("Logging out user");
    // Ensure logout functionalitym('taskhive_user');
    if (logoutLink) {cation.href = 'welcomepage1.html';
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Logging out user");
            localStorage.removeItem('taskhive_user');
            window.location.href = 'welcomepage1.html';
        });.log("Opening profile modal");
    }
}   if (!TaskHive.currentUser) {
        console.error("No user logged in");
function openProfileModal() {
    console.log("Opening profile modal");
    
    if (!TaskHive.currentUser) {
        console.error("No user logged in");iv';
        return;Name = 'modal profile-modal';
    }odal.style.display = 'flex';
    
    // Create modal = getUserTaskStats();
    const modal = document.createElement('div');ilePic || `https://placehold.co/150x150/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
    modal.className = 'modal profile-modal';
    modal.style.display = 'flex';
        <div class="modal-content">
    const userTasks = getUserTaskStats();mes;</span>
    const profilePic = TaskHive.currentUser.profilePic || `https://placehold.co/150x150/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
                <h2>My Profile</h2>
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="profile-header">ar">
                <h2>My Profile</h2>filePic}" alt="User Avatar" id="current-profile-pic">
            </div>  <div class="profile-pic-overlay">
                        <i class="fas fa-camera"></i>
            <div class="profile-info">hoto</span>
                <div class="profile-avatar">
                    <img src="${profilePic}" alt="User Avatar" id="current-profile-pic">
                    <div class="profile-pic-overlay">/h3>
                        <i class="fas fa-camera"></i>> ${TaskHive.currentUser.email}</p>
                        <span>Change Photo</span>></i> Member since: ${new Date(TaskHive.currentUser.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>                <div class="profile-details">
                    <h3>${TaskHive.currentUser.name}</h3>
                    <p><i class="fas fa-envelope"></i> ${TaskHive.currentUser.email}</p>.bio}</p>
                    <p><i class="fas fa-calendar"></i> Member since: ${new Date(TaskHive.currentUser.createdAt).toLocaleDateString()}</p>
                        : ''}
                    ${TaskHive.currentUser.bio ? 
                        `<div class="profile-bio">
                            <p><i class="fas fa-info-circle"></i> ${TaskHive.currentUser.bio}</p>
                        </div>` n class="stat-value">${userTasks.created}</span>
                        : ''}span class="stat-label">Tasks Created</span>
                        </div>
                    <div class="profile-stats">
                        <div class="stat-item">alue">${userTasks.completed}</span>
                            <span class="stat-value">${userTasks.created}</span>
                            <span class="stat-label">Tasks Created</span>
                        </div>lass="stat-item">
                        <div class="stat-item">alue">${userTasks.verified}</span>
                            <span class="stat-value">${userTasks.completed}</span>
                            <span class="stat-label">Tasks Completed</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${userTasks.verified}</span>
                            <span class="stat-label">Tasks Verified</span>
                        </div>e-actions">
                    </div>ass="primary-button" id="edit-profile-btn">Edit Profile</button>
                </div>n class="secondary-button" id="change-password-btn">Change Password</button>
            </div>utton class="secondary-button" id="change-photo-btn">Change Photo</button>
            </div>
            <div class="profile-actions">
                <button class="primary-button" id="edit-profile-btn">Edit Profile</button>
                <button class="secondary-button" id="change-password-btn">Change Password</button>
                <button class="secondary-button" id="change-photo-btn">Change Photo</button>
            </div>
        </div>se button event listener
    `;dal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    }); openEditProfileModal();
    });
    // Add edit profile button event listener
    modal.querySelector('#edit-profile-btn').addEventListener('click', () => {
        document.body.removeChild(modal);-btn').addEventListener('click', () => {
        openEditProfileModal();ld(modal);
    }); openChangePasswordModal();
    });
    // Add change password button event listener
    modal.querySelector('#change-password-btn').addEventListener('click', () => {
        document.body.removeChild(modal);n').addEventListener('click', () => {
        openChangePasswordModal();modal);
    }); openChangePhotoModal();
    });
    // Add change photo button event listener
    modal.querySelector('#change-photo-btn').addEventListener('click', () => {
        document.body.removeChild(modal);).addEventListener('click', () => {
        openChangePhotoModal();ld(modal);
    }); openChangePhotoModal();
    });
    // Also add click handler to the profile picture overlay
    modal.querySelector('.profile-avatar').addEventListener('click', () => {
        document.body.removeChild(modal);
        openChangePhotoModal();rofile modal");
    });
}   if (!TaskHive.currentUser) {
        console.error("No user logged in");
function openEditProfileModal() {
    console.log("Opening edit profile modal");
    
    if (!TaskHive.currentUser) {
        console.error("No user logged in");iv';
        return;Name = 'modal edit-profile-modal';
    }odal.style.display = 'flex';
    
    // Create modalc = TaskHive.currentUser.profilePic || `https://placehold.co/150x150/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
    const modal = document.createElement('div');
    modal.className = 'modal edit-profile-modal';
    modal.style.display = 'flex';">
            <span class="close-modal">&times;</span>
    const profilePic = TaskHive.currentUser.profilePic || `https://placehold.co/150x150/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
                <h2>Edit Profile</h2>
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="profile-header">ar-preview">
                <h2>Edit Profile</h2>lePic}" alt="Profile Picture">
            </div>  <button type="button" class="change-photo-btn">
                        <i class="fas fa-camera"></i> Change Photo
            <form id="edit-profile-form">
                <div class="profile-avatar-preview">
                    <img src="${profilePic}" alt="Profile Picture">
                    <button type="button" class="change-photo-btn">
                        <i class="fas fa-camera"></i> Change Photo
                    </button>pe="text" id="edit-name" value="${TaskHive.currentUser.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-name">Name</label>l>
                    <input type="text" id="edit-name" value="${TaskHive.currentUser.name}" required>ed>
                </div>
                
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" value="${TaskHive.currentUser.email}" required>
                </div>
                
                <div class="form-group">">
                    <label for="edit-bio">Bio</label>ary-button">Save Changes</button>
                    <textarea id="edit-bio" rows="3">${TaskHive.currentUser.bio || ''}</textarea>
                </div>
                rm>
                <div class="form-actions">
                    <button type="submit" class="primary-button">Save Changes</button>
                    <button type="button" class="secondary-button cancel-btn">Cancel</button>
                </div>
            </form>tton event listener
        </div>ySelector('.close-modal').addEventListener('click', () => {
    `;  document.body.removeChild(modal);
      document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    }); openProfileModal();
    });
    // Add cancel button event listener
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);n').addEventListener('click', () => {
        openProfileModal();eChild(modal);
    }); openChangePhotoModal();
    });
    // Add change photo button event listener
    modal.querySelector('.change-photo-btn').addEventListener('click', () => {
        document.body.removeChild(modal);rm').addEventListener('submit', (e) => {
        openChangePhotoModal();
    }); 
        const name = document.getElementById('edit-name').value;
    // Add form submit event listenermentById('edit-email').value;
    modal.querySelector('#edit-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // Update user in localStorage
        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const bio = document.getElementById('edit-bio').value;
        openProfileModal();
        // Update user in localStorage
        updateUserProfile(name, email, bio);
        
        document.body.removeChild(modal);
        openProfileModal();ange password modal");
    });
}   if (!TaskHive.currentUser) {
        console.error("No user logged in");
function openChangePasswordModal() {
    console.log("Opening change password modal");
    
    if (!TaskHive.currentUser) {
        console.error("No user logged in");iv';
        return;Name = 'modal change-password-modal';
    }odal.style.display = 'flex';
    
    // Create modal = `
    const modal = document.createElement('div');
    modal.className = 'modal change-password-modal';
    modal.style.display = 'flex';eader">
                <h2>Change Password</h2>
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="profile-header">
                <h2>Change Password</h2>password">Current Password</label>
            </div>  <input type="password" id="current-password" required>
                </div>
            <form id="change-password-form">
                <div class="form-group">
                    <label for="current-password">Current Password</label>
                    <input type="password" id="current-password" required>
                </div>
                
                <div class="form-group">
                    <label for="new-password">New Password</label>word</label>
                    <input type="password" id="new-password" required>red>
                </div>
                
                <div class="form-group">">
                    <label for="confirm-password">Confirm New Password</label>rd</button>
                    <input type="password" id="confirm-password" required>tn">Cancel</button>
                </div>
                rm>
                <div class="form-actions">
                    <button type="submit" class="primary-button">Change Password</button>
                    <button type="button" class="secondary-button cancel-btn">Cancel</button>
                </div>ndChild(modal);
            </form>
        </div>se button event listener
    `;dal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    }); openProfileModal();
    });
    // Add cancel button event listener
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);-form').addEventListener('submit', (e) => {
        openProfileModal();
    }); 
        const currentPassword = document.getElementById('current-password').value;
    // Add form submit event listenergetElementById('new-password').value;
    modal.querySelector('#change-password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            alert("New passwords don't match!");assword);
            return;
        }document.body.removeChild(modal);
        
        // Update password in localStorage
        updateUserPassword(currentPassword, newPassword);
         openSettingsModal() {
        document.body.removeChild(modal);;
    });
}   // Create modal
    const modal = document.createElement('div');
function openSettingsModal() {ettings-modal';
    console.log("Opening settings modal");
    
    // Create modalsettings
    const modal = document.createElement('div');Item('taskhive_settings') || '{}');
    modal.className = 'modal settings-modal';se;
    modal.style.display = 'flex';s.notifications !== false; // Default to true
    const locationSharing = settings.locationSharing !== false; // Default to true
    // Get current settings
    const settings = JSON.parse(localStorage.getItem('taskhive_settings') || '{}');
    const darkMode = settings.darkMode || false;
    const notifications = settings.notifications !== false; // Default to true
    const locationSharing = settings.locationSharing !== false; // Default to true
                <h2>Settings</h2>
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="settings-header">>
                <h2>Settings</h2>etting-info">
            </div>      <h3>Dark Mode</h3>
                        <p>Enable dark theme for TaskHive</p>
            <div class="settings-options">
                <div class="setting-item">ntrol">
                    <div class="setting-info">
                        <h3>Dark Mode</h3>heckbox" id="dark-mode-toggle" ${darkMode ? 'checked' : ''}>
                        <p>Enable dark theme for TaskHive</p>>
                    </div>label>
                    <div class="setting-control">
                        <label class="switch">
                            <input type="checkbox" id="dark-mode-toggle" ${darkMode ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>setting-info">
                    </div>3>Notifications</h3>
                </div>  <p>Enable notifications for task updates</p>
                    </div>
                <div class="setting-item">ntrol">
                    <div class="setting-info">
                        <h3>Notifications</h3>box" id="notifications-toggle" ${notifications ? 'checked' : ''}>
                        <p>Enable notifications for task updates</p>
                    </div>label>
                    <div class="setting-control">
                        <label class="switch">
                            <input type="checkbox" id="notifications-toggle" ${notifications ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>setting-info">
                    </div>3>Location Sharing</h3>
                </div>  <p>Share your location when working on tasks</p>
                    </div>
                <div class="setting-item">ntrol">
                    <div class="setting-info">
                        <h3>Location Sharing</h3>" id="location-toggle" ${locationSharing ? 'checked' : ''}>
                        <p>Share your location when working on tasks</p>
                    </div>label>
                    <div class="setting-control">
                        <label class="switch">
                            <input type="checkbox" id="location-toggle" ${locationSharing ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>one">
                    </div> Zone</h3>
                </div>n id="clear-data-btn" class="danger-button">Clear All My Data</button>
            </div>
            v>
            <div class="danger-zone">
                <h3>Danger Zone</h3>
                <button id="clear-data-btn" class="danger-button">Clear All My Data</button>
            </div>
        </div>se button event listener
    `;dal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.close-modal').addEventListener('click', () => {, function() {
        document.body.removeChild(modal);hecked);
    }); // Add toggle event listeners
    document.getElementById('dark-mode-toggle').addEventListener('change', function() {() {
        updateSettings('darkMode', this.checked);ked);
        toggleDarkMode(this.checked);
    });
    document.getElementById('location-toggle').addEventListener('change', function() {
    document.getElementById('notifications-toggle').addEventListener('change', function() {
        updateSettings('notifications', this.checked);
    });
    // Add clear data button event listener
    document.getElementById('location-toggle').addEventListener('change', function() {
        updateSettings('locationSharing', this.checked);lete all your tasks and account data. Are you sure?");
    }); 
        if (confirmed) {
    // Add clear data button event listener
    document.getElementById('clear-data-btn').addEventListener('click', function() {
        const confirmed = confirm("WARNING: This will delete all your tasks and account data. Are you sure?");
        }
        if (confirmed) {
            clearUserData();
            document.body.removeChild(modal);
            window.location.href = 'welcomepage1.html';
        }t current settings
   });st settings = JSON.parse(localStorage.getItem('taskhive_settings') || '{}');
}   
    // Update setting
function updateSettings(setting, value) {
    // Get current settings
    const settings = JSON.parse(localStorage.getItem('taskhive_settings') || '{}');
    localStorage.setItem('taskhive_settings', JSON.stringify(settings));
    // Update settingted setting: ${setting} = ${value}`);
    settings[setting] = value;
    
    // Save settingsode(enable) {
    localStorage.setItem('taskhive_settings', JSON.stringify(settings));
    console.log(`Updated setting: ${setting} = ${value}`);
}   if (enable) {
        body.classList.add('dark-mode');
function toggleDarkMode(enable) {
    const body = document.body;dark-mode');
    }
    if (enable) {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Add to DOM
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const newToastContainer = document.createElement('div');
        newToastContainer.className = 'toast-container';
        document.body.appendChild(newToastContainer);
        newToastContainer.appendChild(toast);
    } else {
        toastContainer.appendChild(toast);
    }
    
    // Animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            // Remove container if empty
            if (document.querySelector('.toast-container') && 
                document.querySelector('.toast-container').children.length === 0) {
                document.querySelector('.toast-container').remove();
            }
        }, 300);
    }, 3000);
}

// Change profile photo functionality
function openChangePhotoModal() {
    console.log("Opening change photo modal");
    
    if (!TaskHive.currentUser) {
        console.error("No user logged in");
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal change-photo-modal';
    modal.style.display = 'flex';
    
    const currentProfilePic = TaskHive.currentUser.profilePic || `https://placehold.co/150x150/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="profile-header">
                <h2>Change Profile Picture</h2>
            </div>
            <div class="photo-options">
                <div class="current-photo">
                    <h3>Current Photo</h3>
                    <img src="${currentProfilePic}" alt="Current Profile Picture" id="current-pic-preview">
                </div>
                <div class="new-photo">
                    <h3>New Photo</h3>
                    <div class="photo-preview" id="new-pic-preview">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="photo-input-options">
                        <div class="option">
                            <h4>Upload a photo</h4>
                            <input type="file" id="photo-upload" accept="image/*">
                            <label for="photo-upload" class="secondary-button">Choose File</label>
                        </div>
                        <div class="option">
                            <h4>Use a URL</h4>
                            <input type="text" id="photo-url" placeholder="https://example.com/image.jpg">
                            <button id="preview-url-btn" class="secondary-button">Preview</button>
                        </div>
                        <div class="option">
                            <h4>Use an avatar</h4>
                            <div class="avatar-options">
                                <div class="avatar" data-color="orange" data-text="${TaskHive.currentUser.name.charAt(0)}">
                                    <div class="avatar-preview" style="background-color: #F9A826; color: white;">${TaskHive.currentUser.name.charAt(0)}</div>
                                </div>
                                <div class="avatar" data-color="blue" data-text="${TaskHive.currentUser.name.charAt(0)}">
                                    <div class="avatar-preview" style="background-color: #3498db; color: white;">${TaskHive.currentUser.name.charAt(0)}</div>
                                </div>
                                <div class="avatar" data-color="green" data-text="${TaskHive.currentUser.name.charAt(0)}">
                                    <div class="avatar-preview" style="background-color: #2ecc71; color: white;">${TaskHive.currentUser.name.charAt(0)}</div>
                                </div>
                                <div class="avatar" data-color="red" data-text="${TaskHive.currentUser.name.charAt(0)}">
                                    <div class="avatar-preview" style="background-color: #e74c3c; color: white;">${TaskHive.currentUser.name.charAt(0)}</div>
                                </div>
                                <div class="avatar" data-color="purple" data-text="${TaskHive.currentUser.name.charAt(0)}">
                                    <div class="avatar-preview" style="background-color: #9b59b6; color: white;">${TaskHive.currentUser.name.charAt(0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="primary-button" id="save-photo-btn">Save Changes</button>
                <button type="button" class="secondary-button cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close button event listener
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add cancel button event listener
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
        openProfileModal();
    });
    
    // Handle file upload
    const photoUpload = document.getElementById('photo-upload');
    photoUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('new-pic-preview');
                preview.innerHTML = `<img src="${e.target.result}" alt="New Profile Picture">`;
                preview.dataset.source = 'file';
                preview.dataset.url = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Handle URL preview
    const previewUrlBtn = document.getElementById('preview-url-btn');
    previewUrlBtn.addEventListener('click', function() {
        const url = document.getElementById('photo-url').value.trim();
        if (url) {
            const preview = document.getElementById('new-pic-preview');
            preview.innerHTML = `<img src="${url}" alt="New Profile Picture" onerror="this.onerror=null;this.src='https://placehold.co/150x150/red/white?text=Error';this.title='Invalid image URL';">`;
            preview.dataset.source = 'url';
            preview.dataset.url = url;
        }
    });
    
    // Handle avatar selection
    document.querySelectorAll('.avatar').forEach(avatar => {
        avatar.addEventListener('click', function() {
            const color = this.dataset.color;
            const text = this.dataset.text;
            const preview = document.getElementById('new-pic-preview');
            const avatarPreview = this.querySelector('.avatar-preview');
            const style = window.getComputedStyle(avatarPreview);
            
            preview.innerHTML = `<div class="avatar-preview" style="background-color: ${style.backgroundColor}; color: ${style.color};">${text}</div>`;
            preview.dataset.source = 'avatar';
            preview.dataset.color = color;
        });
    });
    
    // Handle save button
    modal.querySelector('#save-photo-btn').addEventListener('click', () => {
        const preview = document.getElementById('new-pic-preview');
        if (!preview.dataset.source) {
            alert('Please select or upload an image first');
            return;
        }
        
        let profilePic = '';
        
        if (preview.dataset.source === 'file' || preview.dataset.source === 'url') {
            profilePic = preview.dataset.url;
        } else if (preview.dataset.source === 'avatar') {
            const color = preview.dataset.color;
            profilePic = `https://placehold.co/150x150/${color}/white?text=${TaskHive.currentUser.name.charAt(0)}`;
        }
        
        // Update user profile with new photo
        TaskHive.currentUser.profilePic = profilePic;
        localStorage.setItem('taskhive_user', JSON.stringify(TaskHive.currentUser));
        
        // Update in users array too
       
        const users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
        const userIndex = users.findIndex(u => u.id === TaskHive.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].profilePic = profilePic;
            localStorage.setItem('taskhive_users', JSON.stringify(users));
        }
        
        // Update UI
        document.querySelectorAll('.user-avatar img').forEach(img => {
            img.src = profilePic;
        });
        
        document.body.removeChild(modal);
        showToast('Profile picture updated successfully');
        openProfileModal();
    });
}
