# 🎯 How to Test TaskHive Project

## 🚀 Quick Start (5 Minutes)

### 1. **Verify Servers are Running**
```powershell
# Check if servers are running
Get-Process | Where-Object {$_.ProcessName -eq "node"}
netstat -ano | findstr :3000
netstat -ano | findstr :8080
```

### 2. **Run Automated Tests**
```powershell
node automated_tests.js
```
✅ Should show: "🎉 ALL TESTS PASSED!"

### 3. **Open Interactive Testing Dashboard**
Visit: **http://localhost:8080/testing_dashboard.html**
- Click "🚀 Run All System Tests"
- All indicators should turn green ✅

## 📋 Complete Testing Workflow

### **Step 1: System Setup** ⚙️
1. **Start MongoDB**: `mongod`
2. **Start Backend**: `node server.js` (Port 3000)
3. **Start Frontend**: `python -m http.server 8080` (Port 8080)

### **Step 2: Authentication Testing** 🔐
1. Open: `http://localhost:8080/welcomepage1.html`
2. **Test Signup**:
   - Click "Sign Up" or "Get Started"
   - Fill form: Name, Email (unique), Password, Confirm
   - Click "Create Account"
   - ✅ Should redirect to dashboard
3. **Test Login**:
   - Return to welcome page
   - Click "Login"
   - Enter credentials
   - ✅ Should redirect to dashboard

### **Step 3: Dashboard Testing** 📊
1. Open: `http://localhost:8080/dashboard.html`
2. **Verify Task Loading**:
   - ✅ Tasks should load automatically
   - ✅ Should see sample tasks (groceries, delivery, etc.)
3. **Test Filtering**:
   - Status filter: Select "Available" → Only available tasks shown
   - Time filter: Select "< 1 hour" → Only short tasks shown
   - Search: Type "grocery" → Only grocery tasks shown
4. **Test Task Actions**:
   - Click "View Info" → Modal with details opens
   - Click "Accept Task" → Success message appears

### **Step 4: Task Management Testing** ✅
1. **Create New Task**:
   - Click "Create New Task"
   - Fill form: Title, Description, Time, Location, Type
   - Click "Create Task"
   - ✅ New task appears in list
2. **MongoDB Check**:
   - Click "Check MongoDB" button
   - ✅ Should show connection success

### **Step 5: Navigation Testing** 🧭
1. Test sidebar links: Profile, Settings, Dashboard
2. Test logout functionality
3. ✅ All navigation should work smoothly

### **Step 6: Mobile Testing** 📱
1. Resize browser to mobile size (< 768px)
2. Check hamburger menu appears
3. Test touch interactions
4. ✅ Should be fully responsive

## 🔧 Testing Tools Available

### **1. Interactive Testing Dashboard**
**URL**: `http://localhost:8080/testing_dashboard.html`
- System status monitoring
- One-click testing for all features
- Progress tracking checklist
- API endpoint testing

### **2. Automated Test Suite**
**Command**: `node automated_tests.js`
- Tests backend connectivity
- Validates API endpoints
- Creates and tests user accounts
- Verifies database operations

### **3. Dedicated Test Pages**
- `frontend_signup_test.html` - Signup form testing
- `simple_signup_test.html` - Basic signup validation
- `signup_fixed_demo.html` - Signup flow demonstration
- `task_loading_fixed.html` - Task loading verification

## 📊 Test Scenarios

### **Scenario A: New User Journey** 👤
1. Visit welcome page
2. Sign up with new account
3. Explore dashboard and tasks
4. Create a new task
5. Accept an existing task
6. Log out and log back in

### **Scenario B: Power User Testing** ⚡
1. Login with existing account
2. Filter tasks by multiple criteria
3. Create multiple tasks quickly
4. Test all navigation paths
5. Test mobile view extensively

### **Scenario C: Error Handling** 🛠️
1. Stop backend server temporarily
2. Try to load dashboard (should show graceful error)
3. Restart server and refresh (should work normally)
4. Test with invalid login credentials
5. Test with duplicate email signup

## ✅ Success Criteria

Your TaskHive is working correctly if:

- ✅ **Automated tests show 100% pass rate**
- ✅ **All system status indicators are green**
- ✅ **Users can sign up and login successfully**
- ✅ **Dashboard loads tasks from database**
- ✅ **Task filtering works in real-time**
- ✅ **Users can create and accept tasks**
- ✅ **Navigation between pages works**
- ✅ **Mobile responsive design functions**
- ✅ **Error handling is graceful**

## 🎯 What Each Test Validates

| Test Type | What It Validates |
|-----------|-------------------|
| **Backend Connectivity** | Server running on port 3000, MongoDB connected |
| **Authentication APIs** | User registration, login, JWT tokens |
| **Task APIs** | Task creation, retrieval, filtering, status updates |
| **Frontend Integration** | UI loads correctly, API calls work from browser |
| **Database Operations** | Data persistence, schema validation |
| **User Experience** | Smooth workflows, error handling, responsiveness |

## 🚨 Troubleshooting

### **Problem**: Tests fail with connection errors
**Solution**: Ensure MongoDB and Node.js server are running

### **Problem**: "Auth module not found" 
**Solution**: Check frontend server on port 8080 is running

### **Problem**: Tasks don't load
**Solution**: Run `node create_sample_tasks.js` to add sample data

### **Problem**: Signup/Login fails
**Solution**: Check browser console for errors, verify server logs

## 🎉 Final Validation

**Run this complete test sequence:**

```powershell
# 1. Run automated tests
node automated_tests.js

# 2. Create sample data
node create_sample_tasks.js

# 3. Open testing dashboard
start http://localhost:8080/testing_dashboard.html

# 4. Test complete user journey
start http://localhost:8080/welcomepage1.html
```

**Expected Result**: Everything should work perfectly! 🚀

---

**📱 Mobile Testing URLs:**
- Welcome: `http://localhost:8080/welcomepage1.html`
- Dashboard: `http://localhost:8080/dashboard.html`
- Testing: `http://localhost:8080/testing_dashboard.html`

**🎯 Your TaskHive application is production-ready when all tests pass!**
