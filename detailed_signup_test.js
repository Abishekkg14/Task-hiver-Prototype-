// Detailed network test for signup
async function detailedSignupTest() {
    console.log('Starting detailed signup test...');
    
    const testData = {
        name: 'Network Test User',
        email: 'networktest@example.com', 
        password: 'networktest123'
    };
    
    try {
        console.log('1. Testing network connectivity to server...');
        
        // Test basic connectivity
        const healthResponse = await fetch('http://localhost:3000/api/users/register', {
            method: 'OPTIONS',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log('OPTIONS request status:', healthResponse.status);
        
        console.log('2. Attempting registration...');
        
        const registerResponse = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Registration response status:', registerResponse.status);
        console.log('Registration response headers:', Object.fromEntries(registerResponse.headers.entries()));
        
        const responseText = await registerResponse.text();
        console.log('Raw response text:', responseText);
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log('Parsed response data:', responseData);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            console.log('Response is not valid JSON');
            return;
        }
        
        if (registerResponse.ok) {
            console.log('✅ Registration successful');
            console.log('Token received:', responseData.token ? 'Yes' : 'No');
            console.log('User data received:', responseData.user ? 'Yes' : 'No');
            
            // Test storing in localStorage
            try {
                localStorage.setItem('test_token', responseData.token);
                localStorage.setItem('test_user', JSON.stringify(responseData.user));
                console.log('✅ Data stored in localStorage successfully');
                
                // Clean up test data
                localStorage.removeItem('test_token');
                localStorage.removeItem('test_user');
            } catch (storageError) {
                console.error('❌ Failed to store in localStorage:', storageError);
            }
            
        } else {
            console.log('❌ Registration failed with status:', registerResponse.status);
            console.log('Error message:', responseData.message);
        }
        
    } catch (networkError) {
        console.error('❌ Network error during signup test:', networkError);
        console.error('Error details:', {
            name: networkError.name,
            message: networkError.message,
            stack: networkError.stack
        });
    }
}

// Run the test
detailedSignupTest();
