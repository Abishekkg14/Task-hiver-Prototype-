// Simple test for login functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, testing login functionality...');
    
    // Test elements
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.querySelector('.login-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    console.log('Login modal found:', !!loginModal);
    console.log('Login button found:', !!loginBtn);
    console.log('Close buttons found:', closeModalBtns.length);
    
    // Test login button click
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked!');
            if (loginModal) {
                loginModal.style.display = 'flex';
                console.log('Modal should be visible now');
            }
        });
    }
    
    // Test close buttons
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Close button clicked!');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
        });
    });
    
    // Test demo user creation
    const users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
    console.log('Existing users:', users.length);
    
    if (users.length === 0) {
        const demoUser = {
            id: 'demo_user',
            name: 'Demo User',
            email: 'demo@test.com',
            password: 'demo123',
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('taskhive_users', JSON.stringify([demoUser]));
        console.log('Demo user created: demo@test.com / demo123');
    }
});
