// Auto-login helper for testing TaskHive
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auto-login helper loaded');
    
    // Only run this on pages that require authentication
    const requiresAuth = [
        'dashboard.html',
        'my-tasks.html',
        'completed-tasks.html',
        'profile.html',
        'settings.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    if (!requiresAuth.includes(currentPage)) {
        console.log('Current page does not require authentication');
        return;
    }
    
    // Check if already logged in
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        console.log('User is already authenticated');
        return;
    }
    
    console.log('Not authenticated, attempting auto-login...');
    
    // Test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    try {
        // Try to log in with test credentials
        if (typeof Auth !== 'undefined') {
            console.log('Attempting to login with test account');
            const result = await Auth.login(testEmail, testPassword);
            
            if (result && result.user) {
                console.log('Auto-login successful');
                
                // Reload the current page to initialize with the new auth state
                window.location.reload();
                return;
            }
        }
    } catch (error) {
        console.error('Auto-login failed:', error);
        
        // Try registration if login fails
        try {
            if (typeof Auth !== 'undefined') {
                console.log('Attempting to register test account');
                const result = await Auth.register('Test User', testEmail, testPassword);
                
                if (result && result.user) {
                    console.log('Registration successful');
                    
                    // Reload the current page to initialize with the new auth state
                    window.location.reload();
                    return;
                }
            }
        } catch (regError) {
            console.error('Registration failed:', regError);
        }
    }
    
    // If we get here, both login and registration failed
    console.error('Could not auto-authenticate');
    alert('Testing error: Could not auto-authenticate. Please check the console for details.');
});
