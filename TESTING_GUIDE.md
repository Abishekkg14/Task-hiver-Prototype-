# 🧪 TaskHive Testing Guide

## Overview
This guide will walk you through testing all the features of the TaskHive application, including user authentication, task management, and the full end-to-end workflow.

## Prerequisites
- MongoDB installed and running
- Node.js installed
- Python 3.x (for frontend server)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🚀 Quick Start Testing

### Step 1: Start the Servers

1. **Start MongoDB** (if not already running):
   ```powershell
   # Windows (PowerShell)
   mongod
   ```

2. **Start the Backend Server**:
   ```powershell
   # Navigate to project directory
   cd "c:\Users\Abishek14\WebstormProjects\task hiver"
   
   # Start the Node.js server (if not already running)
   node server.js
   ```
   You should see: `Server running on port 3000` and `Connected to MongoDB`

3. **Start the Frontend Server**:
   ```powershell
   # In a new terminal/PowerShell window
   cd "c:\Users\Abishek14\WebstormProjects\task hiver"
   
   # Start Python HTTP server
   python -m http.server 8080
   ```
   You should see: `Serving HTTP on :: port 8080`

### Step 2: Verify Server Status

Open your browser and go to: `http://localhost:8080/task_loading_fixed.html`

Click "🔄 Run Live Tests" to verify all systems are working.

## 📋 Detailed Testing Procedures

### 1. User Authentication Testing

#### Test Signup Flow:
1. Open: `http://localhost:8080/welcomepage1.html`
2. Click "Sign Up" or "Get Started"
3. Fill out the form:
   - Full Name: `Test User`
   - Email: `test@example.com` (use unique email each time)
   - Password: `test123456`
   - Confirm Password: `test123456`
4. Click "Create Account"
5. **Expected Result**: Redirect to dashboard with user logged in

#### Test Login Flow:
1. From welcome page, click "Login"
2. Use credentials from signup:
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "Login"
4. **Expected Result**: Redirect to dashboard with user session restored

#### Test Authentication Persistence:
1. After logging in, close browser tab
2. Reopen: `http://localhost:8080/dashboard.html`
3. **Expected Result**: Should remain logged in (no redirect to welcome page)

### 2. Dashboard Testing

#### Test Task Loading:
1. Navigate to: `http://localhost:8080/dashboard.html`
2. **Expected Result**: 
   - Tasks should load automatically
   - Should see sample tasks (groceries, package delivery, etc.)
   - Tasks should display with proper status badges

#### Test Task Filtering:
1. **Status Filter**: Change dropdown to "Available" only
   - **Expected**: Only available tasks shown
2. **Time Filter**: Select "< 1 hour"
   - **Expected**: Only tasks under 60 minutes shown
3. **Search**: Type "grocery" in search box
   - **Expected**: Only grocery-related tasks shown
4. **Reset**: Clear all filters
   - **Expected**: All tasks visible again

#### Test Task Interaction:
1. **View Task Details**: Click "View Info" on any task
   - **Expected**: Modal popup with full task details
2. **Accept Task**: Click "Accept Task" on available task
   - **Expected**: Success message, task status changes
3. **MongoDB Check**: Click "Check MongoDB" button
   - **Expected**: Success toast showing database connection

### 3. Task Creation Testing

#### Test Create New Task:
1. Click "Create New Task" button
2. Fill out form:
   - Title: `Test Task - Pick up coffee`
   - Description: `Need someone to grab coffee from the local cafe`
   - Time Window: `30` minutes
   - Location: `Downtown Coffee Shop`
   - Type: `Errand`
3. Click "Create Task"
4. **Expected Result**: Task created successfully, appears in task list

### 4. Navigation Testing

#### Test Sidebar Navigation:
1. Click "Profile" in sidebar
   - **Expected**: Navigate to profile page
2. Click "Settings" in sidebar
   - **Expected**: Navigate to settings page
3. Click "Dashboard" in sidebar
   - **Expected**: Return to main dashboard

#### Test Logout:
1. Click "Logout" in sidebar
2. **Expected Result**: Redirected to welcome page, session cleared

### 5. Mobile Responsiveness Testing

#### Test Mobile View:
1. Resize browser window to mobile size (< 768px width)
2. **Expected**: 
   - Hamburger menu appears
   - Sidebar becomes collapsible
   - Tasks stack vertically
   - Touch-friendly button sizes

## 🔧 Advanced Testing

### API Testing (Optional)

You can test API endpoints directly:

```javascript
// Test in browser console
// 1. Test status endpoint
fetch('http://localhost:3000/api/status')
  .then(r => r.json())
  .then(console.log);

// 2. Test tasks endpoint
fetch('http://localhost:3000/api/tasks')
  .then(r => r.json())
  .then(console.log);
```

### Database Testing

```powershell
# Connect to MongoDB shell
mongo taskhive

# Check collections
show collections

# View users
db.users.find().pretty()

# View tasks
db.tasks.find().pretty()
```

## 🧩 Test Scenarios

### Scenario 1: New User Journey
1. Visit welcome page
2. Sign up with new account
3. Explore dashboard
4. Filter tasks
5. Accept a task
6. Create a new task
7. Log out and log back in

### Scenario 2: Returning User
1. Visit dashboard directly
2. Should auto-login with stored credentials
3. View task history
4. Create another task

### Scenario 3: Error Handling
1. Stop backend server (`Ctrl+C` in server terminal)
2. Try to load dashboard
3. **Expected**: Graceful error handling, sample tasks shown
4. Restart server
5. Refresh page - should work normally

## ✅ Success Criteria

Your TaskHive application is working correctly if:

- ✅ Users can sign up and create accounts
- ✅ Users can log in and stay logged in
- ✅ Dashboard loads tasks from database
- ✅ Task filtering works in real-time
- ✅ Users can view task details
- ✅ Users can accept available tasks
- ✅ Users can create new tasks
- ✅ Navigation between pages works
- ✅ Mobile responsive design works
- ✅ Error handling is graceful
- ✅ Data persists in MongoDB

## 🐛 Troubleshooting

### Common Issues:

1. **"Cannot connect to server"**
   - Check if Node.js server is running on port 3000
   - Run: `node server.js`

2. **"Error Loading Tasks"**
   - Check MongoDB connection
   - Check if sample tasks exist in database

3. **"Auth module not found"**
   - Check if frontend server is running on port 8080
   - Verify all JavaScript files are loading correctly

4. **Signup/Login fails**
   - Check browser console for errors
   - Verify MongoDB is running
   - Check server logs for detailed error messages

### Debug Commands:

```powershell
# Check running processes
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Check port usage
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Test API directly
curl http://localhost:3000/api/status
```

## 📊 Testing Checklist

Copy this checklist and check off each item as you test:

- [ ] MongoDB server running
- [ ] Backend server running (port 3000)
- [ ] Frontend server running (port 8080)
- [ ] Welcome page loads
- [ ] Signup form works
- [ ] Login form works
- [ ] Dashboard loads tasks
- [ ] Task filtering works
- [ ] Task details modal works
- [ ] Accept task functionality works
- [ ] Create task functionality works
- [ ] Navigation works
- [ ] Logout works
- [ ] Mobile responsiveness works
- [ ] Error handling works

## 🎯 Next Steps

After testing, you can:
1. **Deploy to production** (AWS, Heroku, etc.)
2. **Add more features** (payments, ratings, messaging)
3. **Improve UI/UX** (animations, better styling)
4. **Add real-time features** (WebSocket notifications)
5. **Implement testing automation** (Jest, Cypress)

---

**Happy Testing! 🚀**
