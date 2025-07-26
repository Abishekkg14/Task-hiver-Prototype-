// Test signup endpoint directly
async function testSignup() {
    try {
        console.log('Testing signup endpoint...');
        
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'test123'
        };
        
        const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            console.log('✅ Signup test successful!');
        } else {
            console.log('❌ Signup test failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error testing signup:', error);
    }
}

testSignup();
