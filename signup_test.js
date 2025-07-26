// Simple signup test script
document.addEventListener('DOMContentLoaded', () => {
    console.log('Signup test script loaded');
    
    // Test if Auth module is available
    if (typeof Auth !== 'undefined') {
        console.log('✓ Auth module is available');
    } else {
        console.error('✗ Auth module is NOT available');
    }
    
    // Test signup form elements
    const signupForm = document.getElementById('signup-form');
    const signupModal = document.getElementById('signup-modal');
    const signupBtn = document.querySelector('.signup-btn');
    
    console.log('Signup form found:', !!signupForm);
    console.log('Signup modal found:', !!signupModal);
    console.log('Signup button found:', !!signupBtn);
    
    // Add test signup button click
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            console.log('Signup button clicked - opening modal');
        });
    }
    
    // Add test form submission
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            console.log('Signup form submit event triggered');
        });
    }
    
    // Test API endpoint
    console.log('Testing API connection...');
    fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpass123'
        })
    })
    .then(response => {
        console.log('API test response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API test response data:', data);
        if (data.message === 'User already exists with this email') {
            console.log('✓ API is working (user already exists)');
        } else if (data.token) {
            console.log('✓ API is working (new user created)');
        }
    })
    .catch(error => {
        console.error('✗ API test failed:', error);
    });
});
