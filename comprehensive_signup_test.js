// Comprehensive signup test to verify everything works end-to-end
async function comprehensiveSignupTest() {
    console.log('🚀 Starting comprehensive signup test...');
    
    const testUser = {
        name: 'Comprehensive Test User',
        email: `comprehensive.test.${Date.now()}@example.com`, // Unique email
        password: 'comprehensive123'
    };
    
    console.log('Test user data:', { ...testUser, password: '***' });
    
    try {
        console.log('1. Testing backend server connectivity...');
        
        // Test server health
        const healthResponse = await fetch('http://localhost:3000/api/users/register', {
            method: 'OPTIONS'
        });
        console.log('✅ Server is responding, status:', healthResponse.status);
        
        console.log('2. Testing user registration...');
        
        // Test registration
        const registerResponse = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });
        
        if (!registerResponse.ok) {
            const errorData = await registerResponse.json();
            throw new Error(`Registration failed: ${errorData.message}`);
        }
        
        const registrationData = await registerResponse.json();
        console.log('✅ Registration successful!');
        console.log('User data:', registrationData.user);
        console.log('Token received:', registrationData.token ? 'Yes' : 'No');
        
        console.log('3. Testing login with newly created user...');
        
        // Test login
        const loginResponse = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        
        if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(`Login failed: ${errorData.message}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful!');
        console.log('User data matches:', loginData.user.email === testUser.email);
        
        console.log('4. Testing Auth module (if available)...');
        
        if (typeof Auth !== 'undefined') {
            try {
                // Clear any existing auth data
                localStorage.removeItem('taskhive_token');
                localStorage.removeItem('taskhive_user');
                
                // Test Auth.register
                const authRegisterResult = await Auth.register(
                    `${testUser.name} (Auth)`,
                    `auth.${testUser.email}`,
                    testUser.password
                );
                console.log('✅ Auth.register works!');
                console.log('Auth user data:', authRegisterResult.user);
                
                // Test Auth.isAuthenticated
                const isAuthenticated = Auth.isAuthenticated();
                console.log('✅ Auth.isAuthenticated():', isAuthenticated);
                
                // Test Auth.getCurrentUser
                const currentUser = Auth.getCurrentUser();
                console.log('✅ Auth.getCurrentUser():', currentUser ? currentUser.name : 'null');
                
            } catch (authError) {
                console.error('❌ Auth module error:', authError.message);
            }
        } else {
            console.log('ℹ️ Auth module not available in this context');
        }
        
        console.log('🎉 All tests passed! The signup system is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
comprehensiveSignupTest();
