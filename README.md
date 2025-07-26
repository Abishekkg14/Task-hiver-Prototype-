# TaskHive - A Peer-to-Peer Micro Task Exchange

TaskHive is a web-based platform that connects people who need small, time-sensitive errands done (like fetching a notebook, delivering a file, or buying groceries) with those willing to complete them.

## Features

- **Task Upload Interface:** Post tasks with title, description, time window, and optional location
- **Task Browser:** Browse available tasks with filters (e.g. time, urgency)
- **View Task Details:** Shows full task details and a map if location is included
- **Live Timer:** Activates when someone accepts the task and stops upon completion
- **Verification System:** Original poster confirms task completion before it's marked as resolved
- **Status Tags:** "Available," "In Progress," "Completed – Awaiting Verification," "Verified"

## Project Setup

### Frontend Setup

The frontend is already set up with HTML, CSS, and JavaScript. You can simply open the `welcomepage1.html` file in your browser to see the interface.

### MongoDB Backend Setup

For production use, you should use the MongoDB backend provided in `server.js`. This requires:

1. Install MongoDB on your system:
   - [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```
   
4. Update the API_URL in app.js with your server URL (default is http://localhost:3000/api)

### Local Storage Demo Mode

Currently, the app is configured to work with local storage for demonstration purposes. This allows you to test the application without setting up MongoDB.

The local storage implementation:
- Stores user data (name, email, etc.) in localStorage
- Manages tasks in localStorage
- Provides all basic functionality without requiring a backend server

### Using MongoDB in Production

To use MongoDB in production:

1. Update the MongoDB connection string in `server.js` to point to your MongoDB instance
2. Set a secure JWT secret key in the authenticateToken middleware
3. Replace the localStorage API calls in app.js with fetch calls to your backend endpoints

For example, replace:
```javascript
const existingUsers = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
```

With:
```javascript
// Get user data from API
async function fetchUserData() {
  const response = await fetch(`${API_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('taskhive_token')}`
    }
  });
  return await response.json();
}
```

## Security Considerations

For a production environment:
1. Always use HTTPS
2. Never store raw passwords in localStorage
3. Implement proper token refresh mechanisms
4. Add input validation on both client and server sides

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB (with Mongoose)
- Authentication: JWT (JSON Web Tokens)
- Maps: OpenStreetMap with Leaflet.js

## License

All rights reserved.
