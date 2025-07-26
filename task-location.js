// Task creation with location integration
class TaskLocationManager {
    constructor() {
        this.locationTracker = window.LocationTracker;
        this.taskCreateMap = null;
        this.selectedLocation = null;
        this.userLocation = null;
    }

    async init() {
        if (!this.locationTracker) {
            console.error('LocationTracker not available');
            return;
        }

        await this.locationTracker.init();
        this.setupTaskCreateLocation();
        console.log('Task location manager initialized');
    }

    setupTaskCreateLocation() {
        // Wait for the create task modal to be available
        const checkModal = () => {
            const modal = document.getElementById('create-task-modal');
            if (modal) {
                this.enhanceCreateTaskForm();
            } else {
                setTimeout(checkModal, 100);
            }
        };
        checkModal();
    }

    enhanceCreateTaskForm() {
        const locationInput = document.getElementById('task-location');
        const previewMap = document.getElementById('location-preview-map');
        
        if (!locationInput || !previewMap) return;

        // Add location enhancement controls
        this.addLocationControls(locationInput);
        
        // Setup location input event handlers
        this.setupLocationInputHandlers(locationInput, previewMap);
        
        // Setup map preview
        this.setupMapPreview(previewMap);
    }

    addLocationControls(locationInput) {
        const locationGroup = locationInput.closest('.form-group');
        if (!locationGroup) return;

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'location-controls';
        controlsDiv.innerHTML = `
            <button type="button" class="location-btn" id="use-current-location-btn">
                <i class="fas fa-crosshairs"></i>
                Use Current Location
            </button>
            <button type="button" class="location-btn secondary" id="pick-on-map-btn">
                <i class="fas fa-map-pin"></i>
                Pick on Map
            </button>
        `;

        locationGroup.appendChild(controlsDiv);

        // Setup event listeners
        document.getElementById('use-current-location-btn').addEventListener('click', () => {
            this.useCurrentLocation();
        });

        document.getElementById('pick-on-map-btn').addEventListener('click', () => {
            this.toggleMapPicker();
        });
    }

    setupLocationInputHandlers(locationInput, previewMap) {
        let timeout;
        
        locationInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const location = e.target.value.trim();
                if (location) {
                    this.geocodeLocation(location);
                } else {
                    this.hideMapPreview();
                }
            }, 500);
        });
    }

    setupMapPreview(previewMap) {
        // Initially hidden
        previewMap.style.height = '0px';
        previewMap.style.overflow = 'hidden';
    }

    async useCurrentLocation() {
        const button = document.getElementById('use-current-location-btn');
        const locationInput = document.getElementById('task-location');
        
        try {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';

            const location = await this.locationTracker.getCurrentLocation();
            this.userLocation = location;

            // Reverse geocode to get address
            const address = await this.reverseGeocode(location.latitude, location.longitude);
            
            locationInput.value = address;
            this.selectedLocation = {
                latitude: location.latitude,
                longitude: location.longitude,
                address: address
            };

            this.showMapPreview(location.latitude, location.longitude);
            
        } catch (error) {
            console.error('Error getting current location:', error);
            alert('Could not get your current location. Please enter the address manually.');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
        }
    }

    toggleMapPicker() {
        const previewMap = document.getElementById('location-preview-map');
        const button = document.getElementById('pick-on-map-btn');
        
        if (previewMap.style.height === '0px' || !previewMap.style.height) {
            this.showMapPicker();
            button.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Map';
        } else {
            this.hideMapPreview();
            button.innerHTML = '<i class="fas fa-map-pin"></i> Pick on Map';
        }
    }

    showMapPicker() {
        const previewMap = document.getElementById('location-preview-map');
        previewMap.style.height = '300px';
        previewMap.style.overflow = 'visible';

        // Initialize map if not already done
        if (!this.taskCreateMap) {
            setTimeout(() => {
                const defaultCenter = this.userLocation ? 
                    [this.userLocation.latitude, this.userLocation.longitude] : 
                    [40.7128, -74.0060]; // Default to NYC

                this.taskCreateMap = this.locationTracker.createMap('location-preview-map', {
                    center: defaultCenter,
                    zoom: 13
                });

                // Add click handler for location selection
                this.taskCreateMap.on('click', (e) => {
                    this.selectLocationOnMap(e.latlng.lat, e.latlng.lng);
                });

                // Add selected location marker if exists
                if (this.selectedLocation) {
                    this.addSelectedLocationMarker(this.selectedLocation.latitude, this.selectedLocation.longitude);
                }
            }, 100);
        }
    }

    async selectLocationOnMap(lat, lng) {
        try {
            // Remove existing selected location marker
            if (this.selectedLocationMarker) {
                this.taskCreateMap.removeLayer(this.selectedLocationMarker);
            }

            // Add new marker
            this.addSelectedLocationMarker(lat, lng);

            // Reverse geocode to get address
            const address = await this.reverseGeocode(lat, lng);
            
            // Update form
            document.getElementById('task-location').value = address;
            this.selectedLocation = {
                latitude: lat,
                longitude: lng,
                address: address
            };

        } catch (error) {
            console.error('Error selecting location:', error);
        }
    }

    addSelectedLocationMarker(lat, lng) {
        const selectedIcon = L.divIcon({
            className: 'selected-location-marker',
            html: '<div class="selected-location-pin"><i class="fas fa-map-pin"></i></div>',
            iconSize: [30, 40],
            iconAnchor: [15, 40]
        });

        this.selectedLocationMarker = L.marker([lat, lng], {
            icon: selectedIcon,
            draggable: true
        }).addTo(this.taskCreateMap);

        // Handle marker dragging
        this.selectedLocationMarker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            this.selectLocationOnMap(newPos.lat, newPos.lng);
        });

        this.selectedLocationMarker.bindPopup('Task Location<br><small>Drag to adjust</small>').openPopup();
    }

    showMapPreview(lat, lng) {
        this.showMapPicker();
        
        if (this.taskCreateMap) {
            this.taskCreateMap.setView([lat, lng], 15);
            this.addSelectedLocationMarker(lat, lng);
        }
    }

    hideMapPreview() {
        const previewMap = document.getElementById('location-preview-map');
        previewMap.style.height = '0px';
        previewMap.style.overflow = 'hidden';
        
        document.getElementById('pick-on-map-btn').innerHTML = '<i class="fas fa-map-pin"></i> Pick on Map';
    }

    async geocodeLocation(address) {
        try {
            // Use Nominatim for geocoding (free OpenStreetMap service)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const location = data[0];
                const lat = parseFloat(location.lat);
                const lng = parseFloat(location.lon);
                
                this.selectedLocation = {
                    latitude: lat,
                    longitude: lng,
                    address: location.display_name
                };

                this.showMapPreview(lat, lng);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await response.json();
            
            if (data && data.display_name) {
                return data.display_name;
            }
            
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    getSelectedLocation() {
        return this.selectedLocation;
    }

    resetLocation() {
        this.selectedLocation = null;
        this.hideMapPreview();
        
        if (this.selectedLocationMarker && this.taskCreateMap) {
            this.taskCreateMap.removeLayer(this.selectedLocationMarker);
            this.selectedLocationMarker = null;
        }
    }

    destroy() {
        if (this.taskCreateMap) {
            this.taskCreateMap.remove();
            this.taskCreateMap = null;
        }
        this.selectedLocation = null;
        this.selectedLocationMarker = null;
    }
}

// Additional CSS for selected location marker
const additionalLocationCSS = `
    .selected-location-marker {
        background: transparent;
        border: none;
    }
    
    .selected-location-pin {
        width: 30px;
        height: 40px;
        background: var(--danger-color);
        color: white;
        border-radius: 50% 50% 50% 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .selected-location-pin i {
        transform: rotate(45deg);
    }
`;

// Add additional CSS to document
if (!document.getElementById('task-location-css')) {
    const style = document.createElement('style');
    style.id = 'task-location-css';
    style.textContent = additionalLocationCSS;
    document.head.appendChild(style);
}

// Initialize task location manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskLocationManager = new TaskLocationManager();
    window.taskLocationManager.init();
});

// Export for use in other modules
window.TaskLocationManager = TaskLocationManager;
