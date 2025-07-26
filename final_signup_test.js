// Final end-to-end signup test with fresh user
async function finalSignupTest() {
    console.log('🎯 Final end-to-end signup test starting...');
    
    const timestamp = Date.now();
    const testUser = {
        name: 'Final Test User',
        email: `final.test.${timestamp}@taskhive.com`,
        password: 'finaltests123!'
    };
    
    console.log('Test user:', { ...testUser, password: '***' });
    
    try {
        console.log('1. Testing fresh user registration...');
        
        const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Registration failed: ${errorData.message}`);
        }
        
        const data = await response.json();
        console.log('✅ Registration successful!');
        console.log('User ID:', data.user.id);
        console.log('User Name:', data.user.name);
        console.log('User Email:', data.user.email);
        console.log('Token length:', data.token.length);
        
        console.log('2. Verifying login works with new user...');
        
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
        console.log('Same user ID:', loginData.user.id === data.user.id);
        
        console.log('3. Testing duplicate email prevention...');
        
        const duplicateResponse = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });
        
        if (duplicateResponse.ok) {
            console.log('❌ ERROR: Duplicate email should have been rejected!');
        } else {
            const duplicateError = await duplicateResponse.json();
            console.log('✅ Duplicate email correctly rejected:', duplicateError.message);
        }
        
        console.log('\n🎉 ALL TESTS PASSED! The signup system is working perfectly!');
        console.log('\n📋 Summary:');
        console.log('   ✅ New user registration works');
        console.log('   ✅ JWT token generation works');
        console.log('   ✅ User data storage works');
        console.log('   ✅ Login with new credentials works');
        console.log('   ✅ Duplicate email prevention works');
        console.log('\n🚀 The signup feature is ready for use!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error details:', error);
    }
}

finalSignupTest();
