# TaskHive Location Tracking Features

## Overview

TaskHive now includes comprehensive location tracking functionality using **Leaflet.js** and **OpenStreetMap**. This allows users to:

- Track their current location in real-time
- Create tasks with specific locations
- Find nearby tasks based on their location
- View tasks on interactive maps
- Calculate and display distances to tasks

## 🗺️ Features Implemented

### 1. Location Tracker Module (`location-tracker.js`)
- **Real-time location tracking** using HTML5 Geolocation API
- **Interactive maps** powered by Leaflet.js and OpenStreetMap
- **Distance calculations** between locations
- **Multiple map instances** support
- **Location permission handling**
- **Accuracy indicators** and error handling

### 2. Dashboard Location Integration (`dashboard-location.js`)
- **Location status indicator** in dashboard header
- **Enable/disable location tracking** controls
- **Dashboard map view** showing user location and nearby tasks
- **Real-time location updates** with visual feedback
- **Distance display** on task cards
- **Location preferences** saved to localStorage

### 3. Task Creation with Location (`task-location.js`)
- **Current location detection** for task creation
- **Interactive map picker** for selecting task locations
- **Address geocoding** (address ↔ coordinates conversion)
- **Drag-and-drop markers** for precise location selection
- **Location preview** in task creation form

### 4. Enhanced Backend API (`server.js`)
- **Location coordinates storage** in MongoDB
- **Nearby tasks API** (`/api/tasks/nearby/:lat/:lng`)
- **Task location updates** (`/api/tasks/:id/location`)
- **Distance-based filtering** and sorting
- **Enhanced task schema** with location data

### 5. Visual Components
- **Custom map markers** with pulse animations
- **Distance indicators** (close/far with color coding)
- **Location status displays**
- **Interactive controls** for location features
- **Dark mode compatibility**

## 🚀 How to Use

### 1. Enable Location Tracking
1. Open the TaskHive dashboard
2. Click "Enable Location" button
3. Grant location permission when prompted
4. Your location will be tracked and displayed

### 2. Create Tasks with Location
1. Click "Create New Task"
2. Fill in task details
3. Use "Use Current Location" to automatically fill your location
4. Or use "Pick on Map" to select a specific location
5. The location will be saved with the task

### 3. Find Nearby Tasks
- When location is enabled, the dashboard shows nearby tasks
- Tasks display distance from your current location
- Closer tasks are highlighted with green indicators
- Farther tasks show orange/red indicators

### 4. View Tasks on Map
1. Enable location tracking
2. Click "Show Map" on the dashboard
3. View your location (blue pulsing marker)
4. See task locations (red pin markers)
5. Click markers for more information

## 🛠️ Technical Implementation

### Location Tracking Core
```javascript
// Initialize location tracker
await LocationTracker.init();

// Get current location
const location = await LocationTracker.getCurrentLocation();

// Start continuous tracking
LocationTracker.startTracking();

// Create interactive map
const map = LocationTracker.createMap('map-container');

// Add user location marker
LocationTracker.addUserMarker('map-container', location);
```

### API Integration
```javascript
// Create task with location
const task = await TasksAPI.createTask({
    title: "Task Title",
    description: "Task Description",
    location: "123 Main St, City, State",
    locationCoords: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: "123 Main St, City, State"
    }
});

// Get nearby tasks
const nearbyTasks = await fetch(
    `/api/tasks/nearby/${lat}/${lng}?radius=10`
);
```

### Distance Calculations
```javascript
// Calculate distance between two points
const distance = LocationTracker.getDistance(
    lat1, lng1, lat2, lng2
);

// Format distance for display
const formatted = LocationTracker.formatDistance(distance);
// Returns: "1.2km" or "350m"
```

## 📁 File Structure

```
/task hiver/
├── location-tracker.js      # Core location tracking module
├── dashboard-location.js    # Dashboard location integration
├── task-location.js         # Task creation location features
├── location-test.html       # Comprehensive testing page
├── server.js               # Backend with location APIs
├── dashboard.html          # Dashboard with location features
├── styles.css              # Location-related styles
└── ...other files
```

## 🧪 Testing

### Automated Testing
Open `location-test.html` in your browser to run comprehensive tests:

1. **Browser Support Tests**
   - Geolocation API availability
   - Leaflet.js loading
   - LocationTracker module availability

2. **Location Tracking Tests**
   - Get current location
   - Start/stop continuous tracking
   - Location permission handling

3. **Map Integration Tests**
   - Map creation and display
   - User and task marker placement
   - Interactive map features

4. **API Integration Tests**
   - Task creation with location
   - Nearby tasks retrieval
   - Location data validation

5. **Distance Calculation Tests**
   - Accurate distance measurements
   - Distance formatting
   - Edge case handling

### Manual Testing
1. **Enable location** on the dashboard
2. **Create a task** with location
3. **View the map** showing your location and tasks
4. **Check distance indicators** on task cards
5. **Test location permissions** and error handling

## 🔧 Configuration

### Location Tracking Options
```javascript
LocationTracker.getCurrentLocation({
    enableHighAccuracy: true,  // Use GPS if available
    timeout: 10000,           // 10 second timeout
    maximumAge: 300000        // 5 minute cache
});

LocationTracker.startTracking({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000         // 1 minute cache for tracking
});
```

### Map Configuration
```javascript
LocationTracker.createMap('container-id', {
    center: [latitude, longitude],
    zoom: 13,
    zoomControl: true,
    attributionControl: true
});
```

## 🚨 Error Handling

The location system handles various error scenarios:

- **Permission denied**: Shows user-friendly message with instructions
- **Location unavailable**: Graceful fallback to manual entry
- **Timeout errors**: Retry mechanisms with user feedback
- **Network issues**: Offline map functionality
- **Accuracy issues**: Visual indicators for location accuracy

## 📱 Mobile Support

All location features are fully responsive and mobile-friendly:

- **Touch-friendly** map controls
- **Mobile-optimized** UI components
- **GPS integration** on mobile devices
- **Efficient battery usage** with smart tracking intervals

## 🔒 Privacy & Security

- **User consent required** before accessing location
- **Location data encrypted** in transit
- **Optional location sharing** - users can disable anytime
- **No location tracking** when not explicitly enabled
- **Temporary location storage** - cleared on logout

## 🎯 Future Enhancements

Potential improvements for the location system:

1. **Route planning** and directions to tasks
2. **Geofencing** notifications for nearby tasks
3. **Location history** and frequently visited places
4. **Multi-location tasks** (pickup and delivery points)
5. **Location-based task recommendations**
6. **Integration with external mapping services**

## 🔗 Dependencies

- **Leaflet.js 1.9.4** - Interactive maps
- **OpenStreetMap** - Map tiles and geocoding
- **HTML5 Geolocation API** - Location tracking
- **MongoDB** - Location data storage
- **Express.js** - Location API endpoints

## 📞 Support

If you encounter any issues with location features:

1. Check the browser console for error messages
2. Ensure location permissions are granted
3. Verify internet connection for map loading
4. Test with the location testing page
5. Check server logs for API errors

---

## Quick Start

1. **Start the servers**:
   ```bash
   # Start MongoDB
   mongod --dbpath C:\data\db
   
   # Start backend server
   node server.js
   
   # Start frontend server
   python -m http.server 8080
   ```

2. **Open TaskHive**: http://localhost:8080/welcomepage1.html

3. **Test location features**: http://localhost:8080/location-test.html

4. **Enable location** on the dashboard and start creating location-aware tasks!

The location tracking system is now fully integrated and ready to use! 🎉
