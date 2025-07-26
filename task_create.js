// This file contains fixed task creation functionality to be included in app.js

// Helper function to save tasks to localStorage and dispatch event for cross-tab sync
function saveTasksToLocalStorage(tasks) {
    localStorage.setItem('taskhive_tasks', JSON.stringify(tasks));
    
    // Dispatch a storage event to notify other tabs
    const event = new Event('taskhive_tasks_updated');
    window.dispatchEvent(event);
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

// Create a new task
function setupTaskCreation() {
    const createTaskForm = document.getElementById('create-task-form');
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!Auth.isAuthenticated()) {
                alert("You must be logged in to create tasks.");
                return;
            }
            
            const title = document.getElementById('task-title').value;
            const description = document.getElementById('task-description').value;
            const timeWindow = parseInt(document.getElementById('task-time').value);
            const location = document.getElementById('task-location').value;
            const taskType = document.getElementById('task-type').value;
            
            // Get selected location coordinates from task location manager
            let locationCoords = null;
            if (window.taskLocationManager) {
                const selectedLocation = window.taskLocationManager.getSelectedLocation();
                if (selectedLocation) {
                    locationCoords = {
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                        address: selectedLocation.address
                    };
                }
            }
            
            try {
                // Create task using API
                const newTask = await TasksAPI.createTask({
                    title,
                    description,
                    timeWindow,
                    location,
                    locationCoords,
                    type: taskType
                });
                
                showToast("Task created successfully!", 'success');
                createTaskForm.reset();
                
                // Reset location manager
                if (window.taskLocationManager) {
                    window.taskLocationManager.resetLocation();
                }
                
                loadTasks();
                
                // Close the modal if it's open
                const createTaskModal = document.getElementById('create-task-modal');
                if (createTaskModal) {
                    createTaskModal.style.display = 'none';
                }
            } catch (error) {
                console.error('Error creating task:', error);
                showToast(error.message || "Failed to create task. Please try again.", 'error');
            }
        });
    }
}

// Load tasks from API
async function loadTasks() {
    console.log("Loading tasks from API...");
    
    const taskGrid = document.getElementById('task-grid');
    if (!taskGrid) {
        console.error("Task grid element not found!");
        return;
    }
    
    try {
        // Get tasks from API
        const tasks = await TasksAPI.getTasks();
        console.log("Tasks loaded from API:", tasks.length);
        
        // Clear existing content with fade-out effect
        const existingCards = taskGrid.querySelectorAll('.task-card');
        if (existingCards.length > 0) {
            existingCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            });
            
            // Wait for animation before removing cards
            setTimeout(() => {
                taskGrid.innerHTML = '';
                renderTasks(tasks, taskGrid);
            }, 300);
        } else {
            taskGrid.innerHTML = '';
            renderTasks(tasks, taskGrid);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        taskGrid.innerHTML = `
            <div class="no-tasks-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Tasks</h3>
                <p>Failed to load tasks. Please check your connection and try again.</p>
                <button class="primary-button" onclick="loadTasks()">Retry</button>
            </div>
        `;
    }
}

// Render tasks to the task grid
function renderTasks(tasks, taskGrid) {
    if (tasks.length === 0) {
        taskGrid.innerHTML = `
            <div class="no-tasks-message">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Tasks Yet</h3>
                <p>Click the "Create Task" button to add your first task</p>
            </div>
        `;
        return;
    }
    
    // Create a task card for each task
    tasks.forEach((task, index) => {
        const taskCard = createTaskCard(task);
        taskGrid.appendChild(taskCard);
        
        // Add fade-in animation
        setTimeout(() => {
            taskCard.style.opacity = '1';
            taskCard.style.transform = 'translateY(0)';
        }, index * 100);
        
        // Initialize map for tasks with location
        if (task.location) {
            setTimeout(() => {
                try {
                    initializeMap(`map-${task.id}`, task.location);
                } catch (e) {
                    console.error(`Error initializing map for task ${task.id}:`, e);
                }
            }, 500);
        }
    });
}

// Initialize the page after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    TaskHive.init();
    setupTaskCreation();
    
    // Load tasks if on the dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        loadTasks();
    }
});
