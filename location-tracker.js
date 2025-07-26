// Location tracking module for TaskHive
class LocationTracker {
    constructor() {
        this.userLocation = null;
        this.watchId = null;
        this.isTracking = false;
        this.maps = new Map(); // Store multiple map instances
        this.locationCallbacks = new Set(); // Store callbacks for location updates
    }

    // Check if geolocation is supported
    isSupported() {
        return 'geolocation' in navigator;
    }

    // Initialize location tracking
    async init() {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported by this browser');
        }

        // Load saved location from localStorage
        const savedLocation = localStorage.getItem('taskhive_user_location');
        if (savedLocation) {
            this.userLocation = JSON.parse(savedLocation);
        }

        return true;
    }

    // Get current location (one-time request)
    getCurrentLocation(options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            };

            const finalOptions = { ...defaultOptions, ...options };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: Date.now()
                    };

                    this.userLocation = location;
                    this.saveLocation(location);
                    this.notifyLocationCallbacks(location);
                    resolve(location);
                },
                (error) => {
                    console.error('Location error:', error);
                    reject(this.handleLocationError(error));
                },
                finalOptions
            );
        });
    }

    // Start continuous location tracking
    startTracking(options = {}) {
        if (!this.isSupported()) {
            throw new Error('Geolocation not supported');
        }

        if (this.isTracking) {
            console.log('Location tracking already active');
            return;
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000 // 1 minute
        };

        const finalOptions = { ...defaultOptions, ...options };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now()
                };

                this.userLocation = location;
                this.saveLocation(location);
                this.notifyLocationCallbacks(location);
                this.updateAllMaps(location);
            },
            (error) => {
                console.error('Location tracking error:', error);
                this.handleLocationError(error);
            },
            finalOptions
        );

        this.isTracking = true;
        console.log('Location tracking started');
    }

    // Stop location tracking
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isTracking = false;
            console.log('Location tracking stopped');
        }
    }

    // Create a Leaflet map with location tracking
    createMap(containerId, options = {}) {
        const defaultOptions = {
            center: this.userLocation ? [this.userLocation.latitude, this.userLocation.longitude] : [40.7128, -74.0060], // Default to NYC
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        };

        const finalOptions = { ...defaultOptions, ...options };

        // Initialize Leaflet map
        const map = L.map(containerId, finalOptions);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Store map reference
        this.maps.set(containerId, {
            map: map,
            userMarker: null,
            taskMarkers: new Map()
        });

        // Add user location if available
        if (this.userLocation) {
            this.addUserMarker(containerId, this.userLocation);
        }

        return map;
    }

    // Add user location marker to a specific map
    addUserMarker(containerId, location) {
        const mapData = this.maps.get(containerId);
        if (!mapData) return;

        const { map } = mapData;

        // Remove existing user marker
        if (mapData.userMarker) {
            map.removeLayer(mapData.userMarker);
        }

        // Create custom user location icon
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Add new user marker
        mapData.userMarker = L.marker([location.latitude, location.longitude], {
            icon: userIcon,
            title: 'Your Location'
        }).addTo(map);

        // Add accuracy circle if available
        if (location.accuracy) {
            const accuracyCircle = L.circle([location.latitude, location.longitude], {
                radius: location.accuracy,
                color: '#007bff',
                fillColor: '#007bff',
                fillOpacity: 0.1,
                weight: 1
            }).addTo(map);

            mapData.accuracyCircle = accuracyCircle;
        }
    }

    // Add task location marker to a specific map
    addTaskMarker(containerId, taskId, location, title = 'Task Location') {
        const mapData = this.maps.get(containerId);
        if (!mapData) return;

        const { map } = mapData;

        // Remove existing task marker
        if (mapData.taskMarkers.has(taskId)) {
            map.removeLayer(mapData.taskMarkers.get(taskId));
        }

        // Create task marker
        const taskMarker = L.marker([location.latitude, location.longitude], {
            title: title
        }).addTo(map);

        taskMarker.bindPopup(`<strong>${title}</strong><br>Task Location`);

        // Store task marker
        mapData.taskMarkers.set(taskId, taskMarker);
    }

    // Update all maps with new user location
    updateAllMaps(location) {
        this.maps.forEach((mapData, containerId) => {
            this.addUserMarker(containerId, location);
        });
    }

    // Get distance between two locations (in meters)
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Format distance for display
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }

    // Subscribe to location updates
    onLocationUpdate(callback) {
        this.locationCallbacks.add(callback);
        
        // Immediately call with current location if available
        if (this.userLocation) {
            callback(this.userLocation);
        }
    }

    // Unsubscribe from location updates
    offLocationUpdate(callback) {
        this.locationCallbacks.delete(callback);
    }

    // Notify all location callbacks
    notifyLocationCallbacks(location) {
        this.locationCallbacks.forEach(callback => {
            try {
                callback(location);
            } catch (error) {
                console.error('Error in location callback:', error);
            }
        });
    }

    // Save location to localStorage
    saveLocation(location) {
        localStorage.setItem('taskhive_user_location', JSON.stringify(location));
    }

    // Handle location errors
    handleLocationError(error) {
        let message = 'Unknown location error';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied by user';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out';
                break;
        }

        return new Error(message);
    }

    // Cleanup resources
    destroy() {
        this.stopTracking();
        this.maps.clear();
        this.locationCallbacks.clear();
    }
}

// Create global instance
window.LocationTracker = new LocationTracker();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationTracker;
}
