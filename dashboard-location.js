// Enhanced dashboard with location tracking
class DashboardLocationManager {
    constructor() {
        this.locationTracker = window.LocationTracker;
        this.userLocation = null;
        this.dashboardMap = null;
        this.taskMaps = new Map();
        this.isLocationEnabled = false;
    }

    async init() {
        try {
            await this.locationTracker.init();
            this.setupLocationUI();
            this.setupLocationTracking();
            console.log('Dashboard location manager initialized');
        } catch (error) {
            console.error('Error initializing location manager:', error);
            this.showLocationError(error.message);
        }
    }

    setupLocationUI() {
        // Add location status to dashboard header
        this.addLocationStatusToHeader();
        
        // Add location controls to the dashboard
        this.addLocationControls();
        
        // Setup location callbacks
        this.locationTracker.onLocationUpdate((location) => {
            this.userLocation = location;
            this.updateLocationDisplay(location);
            this.updateTaskDistances();
        });
    }

    addLocationStatusToHeader() {
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (!dashboardHeader) return;

        const locationStatus = document.createElement('div');
        locationStatus.className = 'location-status inactive';
        locationStatus.id = 'location-status';
        locationStatus.innerHTML = `
            <i class="fas fa-location-slash"></i>
            <span>Location tracking disabled</span>
        `;

        dashboardHeader.appendChild(locationStatus);
    }

    addLocationControls() {
        const dashboardActions = document.querySelector('.dashboard-actions');
        if (!dashboardActions) return;

        const locationControls = document.createElement('div');
        locationControls.className = 'location-controls';
        locationControls.innerHTML = `
            <button class="location-btn" id="enable-location-btn">
                <i class="fas fa-map-marker-alt"></i>
                Enable Location
            </button>
            <button class="location-btn secondary" id="show-map-btn" style="display: none;">
                <i class="fas fa-map"></i>
                Show Map
            </button>
        `;

        dashboardActions.appendChild(locationControls);

        // Setup event listeners
        document.getElementById('enable-location-btn').addEventListener('click', () => {
            this.enableLocationTracking();
        });

        document.getElementById('show-map-btn').addEventListener('click', () => {
            this.toggleDashboardMap();
        });
    }

    async enableLocationTracking() {
        const enableBtn = document.getElementById('enable-location-btn');
        const statusEl = document.getElementById('location-status');

        try {
            enableBtn.disabled = true;
            enableBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
            
            statusEl.className = 'location-status loading';
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Getting your location...</span>';

            // Get current location
            const location = await this.locationTracker.getCurrentLocation();
            
            // Start continuous tracking
            this.locationTracker.startTracking();
            
            this.isLocationEnabled = true;
            this.userLocation = location;

            // Update UI
            enableBtn.style.display = 'none';
            document.getElementById('show-map-btn').style.display = 'flex';
            
            statusEl.className = 'location-status active';
            statusEl.innerHTML = '<i class="fas fa-map-marker-alt"></i> <span>Location tracking active</span>';

            // Show location info
            this.showLocationInfo(location);
            
            // Update all task displays with distances
            this.updateTaskDistances();

            console.log('Location tracking enabled');
        } catch (error) {
            console.error('Error enabling location:', error);
            
            enableBtn.disabled = false;
            enableBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Enable Location';
            
            statusEl.className = 'location-status inactive';
            statusEl.innerHTML = '<i class="fas fa-location-slash"></i> <span>Location access denied</span>';
            
            this.showLocationError(error.message);
        }
    }

    showLocationInfo(location) {
        // Check if location info already exists
        let locationInfo = document.getElementById('location-info');
        if (!locationInfo) {
            locationInfo = document.createElement('div');
            locationInfo.id = 'location-info';
            locationInfo.className = 'location-info';
            
            const tasksGrid = document.querySelector('.tasks-grid');
            if (tasksGrid) {
                tasksGrid.parentNode.insertBefore(locationInfo, tasksGrid);
            }
        }

        const accuracy = location.accuracy ? this.locationTracker.formatDistance(location.accuracy) : 'Unknown';
        const timestamp = new Date(location.timestamp).toLocaleTimeString();

        locationInfo.innerHTML = `
            <h4><i class="fas fa-map-marker-alt"></i> Your Location</h4>
            <div class="location-details">
                <div class="location-detail">
                    <i class="fas fa-crosshairs"></i>
                    <span>Accuracy: ${accuracy}</span>
                </div>
                <div class="location-detail">
                    <i class="fas fa-clock"></i>
                    <span>Updated: ${timestamp}</span>
                </div>
            </div>
        `;
    }

    toggleDashboardMap() {
        const mapContainer = document.getElementById('dashboard-map-container');
        
        if (mapContainer) {
            // Hide map
            mapContainer.remove();
            this.dashboardMap = null;
            document.getElementById('show-map-btn').innerHTML = '<i class="fas fa-map"></i> Show Map';
        } else {
            // Show map
            this.showDashboardMap();
            document.getElementById('show-map-btn').innerHTML = '<i class="fas fa-eye-slash"></i> Hide Map';
        }
    }

    showDashboardMap() {
        const locationInfo = document.getElementById('location-info');
        if (!locationInfo) return;

        const mapContainer = document.createElement('div');
        mapContainer.id = 'dashboard-map-container';
        mapContainer.className = 'location-container';
        mapContainer.innerHTML = `
            <div class="map-container" id="dashboard-map"></div>
        `;

        locationInfo.parentNode.insertBefore(mapContainer, locationInfo.nextSibling);

        // Initialize map
        setTimeout(() => {
            this.dashboardMap = this.locationTracker.createMap('dashboard-map');
            
            // Add nearby tasks to map
            this.addTasksToMap();
        }, 100);
    }

    addTasksToMap() {
        if (!this.dashboardMap) return;

        const taskElements = document.querySelectorAll('.task-card');
        taskElements.forEach(taskEl => {
            const taskId = taskEl.dataset.taskId;
            const taskTitle = taskEl.querySelector('.task-title')?.textContent || 'Task';
            
            // Try to get location from task data (if available)
            const taskLocation = this.getTaskLocation(taskId);
            if (taskLocation) {
                this.locationTracker.addTaskMarker('dashboard-map', taskId, taskLocation, taskTitle);
            }
        });
    }

    getTaskLocation(taskId) {
        // This would typically come from the task data
        // For now, return null - would need to be implemented based on your task storage
        return null;
    }

    updateTaskDistances() {
        if (!this.userLocation) return;

        const taskElements = document.querySelectorAll('.task-card');
        taskElements.forEach(taskEl => {
            const taskId = taskEl.dataset.taskId;
            const taskLocation = this.getTaskLocation(taskId);
            
            if (taskLocation) {
                const distance = this.locationTracker.getDistance(
                    this.userLocation.latitude,
                    this.userLocation.longitude,
                    taskLocation.latitude,
                    taskLocation.longitude
                );

                this.addDistanceToTaskCard(taskEl, distance);
            }
        });
    }

    addDistanceToTaskCard(taskEl, distance) {
        // Remove existing distance display
        const existingDistance = taskEl.querySelector('.distance-display');
        if (existingDistance) {
            existingDistance.remove();
        }

        const distanceEl = document.createElement('div');
        distanceEl.className = `distance-display ${distance < 1000 ? 'close' : 'far'}`;
        distanceEl.innerHTML = `
            <i class="fas fa-route"></i>
            <span>${this.locationTracker.formatDistance(distance)} away</span>
        `;

        const taskActions = taskEl.querySelector('.task-actions');
        if (taskActions) {
            taskActions.parentNode.insertBefore(distanceEl, taskActions);
        }
    }

    updateLocationDisplay(location) {
        const locationInfo = document.getElementById('location-info');
        if (locationInfo) {
            this.showLocationInfo(location);
        }
    }

    showLocationError(message) {
        // Create or update error display
        let errorEl = document.getElementById('location-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'location-error';
            errorEl.className = 'location-permission';
            
            const dashboardHeader = document.querySelector('.dashboard-header');
            if (dashboardHeader) {
                dashboardHeader.parentNode.insertBefore(errorEl, dashboardHeader.nextSibling);
            }
        }

        errorEl.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Location Access Required</h4>
            <p>${message}</p>
            <p>To see nearby tasks and get accurate directions, please enable location access in your browser settings.</p>
        `;
    }

    setupLocationTracking() {
        // Check if location was previously enabled
        const savedLocation = localStorage.getItem('taskhive_user_location');
        if (savedLocation) {
            try {
                this.userLocation = JSON.parse(savedLocation);
                // Auto-enable if user had location enabled before
                if (localStorage.getItem('taskhive_location_enabled') === 'true') {
                    setTimeout(() => {
                        this.enableLocationTracking();
                    }, 1000);
                }
            } catch (error) {
                console.error('Error loading saved location:', error);
            }
        }
    }

    // Save location preferences
    saveLocationPreference(enabled) {
        localStorage.setItem('taskhive_location_enabled', enabled.toString());
    }

    destroy() {
        if (this.locationTracker) {
            this.locationTracker.stopTracking();
        }
        this.taskMaps.clear();
        this.dashboardMap = null;
    }
}

// Initialize dashboard location manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        window.dashboardLocationManager = new DashboardLocationManager();
        window.dashboardLocationManager.init();
    }
});

// Export for use in other modules
window.DashboardLocationManager = DashboardLocationManager;
