// TaskHive App - Clean Version with Fixed Authentication
console.log('Loading TaskHive App...');

// Initialize app state
const TaskHive = {
    currentUser: null,
    tasks: [],
    
    // Check if user is logged in (from localStorage)
    init() {
        console.log("Initializing TaskHive...");
        
        // Check if Auth module is available and user is authenticated
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
            this.currentUser = Auth.getCurrentUser();
            console.log("User authenticated successfully:", this.currentUser);
        } else {
            console.log("No authenticated user found");
            this.currentUser = null;
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TaskHive app...');
    
    // Initialize TaskHive
    TaskHive.init();
    
    // Check if user is authenticated
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        TaskHive.currentUser = Auth.getCurrentUser();
        console.log("User is authenticated:", TaskHive.currentUser);
        updateUserUIElements();
        
        // Initialize rewards system if available
        if (typeof RewardsSystem !== 'undefined') {
            try {
                RewardsSystem.init().then(() => {
                    console.log("Rewards system initialized during page load");
                }).catch(error => {
                    console.error("Failed to initialize rewards system:", error);
                });
            } catch (error) {
                console.error("Error initializing rewards system:", error);
            }
        }
    } else {
        console.log("User is not authenticated");
    }
    
    // DOM Elements
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const showLoginBtn = document.getElementById('show-login');
    const showSignupBtn = document.getElementById('show-signup');
    const getStartedBtn = document.getElementById('get-started-btn');
    const learnMoreBtn = document.getElementById('learn-more-btn');
    const signupCtaBtn = document.getElementById('signup-cta');
    
    // Modal Event Listeners
    loginBtn?.addEventListener('click', () => {
        console.log('Login button clicked');
        loginModal.style.display = 'flex';
    });
    
    signupBtn?.addEventListener('click', () => {
        console.log('Signup button clicked');
        signupModal.style.display = 'flex';
    });
    
    getStartedBtn?.addEventListener('click', () => {
        console.log('Get Started button clicked');
        signupModal.style.display = 'flex';
    });
    
    showSignupBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Show signup link clicked');
        loginModal.style.display = 'none';
        signupModal.style.display = 'flex';
    });
    
    showLoginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Show login link clicked');
        signupModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });
    
    signupCtaBtn?.addEventListener('click', () => {
        console.log('Signup CTA button clicked');
        signupModal.style.display = 'flex';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === signupModal) {
            signupModal.style.display = 'none';
        }
    });
    
    // Login Form Handler
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Login form submitted!");
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        console.log("Login attempt for:", email);
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
        
        try {
            // Check if Auth is available
            if (typeof Auth === 'undefined') {
                throw new Error('Auth module not loaded');
            }
            
            // Use Auth API to login
            const result = await Auth.login(email, password);
            console.log("Login successful:", result.user.name);
            
            // Update TaskHive state
            TaskHive.currentUser = result.user;
            
            // Initialize rewards system if available
            if (typeof RewardsSystem !== 'undefined') {
                try {
                    await RewardsSystem.init();
                    console.log("Rewards system initialized after login");
                } catch (rewardsError) {
                    console.error("Failed to initialize rewards system:", rewardsError);
                }
            }
            
            // Close modal and redirect to dashboard
            loginModal.style.display = 'none';
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Login error:", error);
            alert(error.message || "Login failed. Please try again.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
    
    // Signup Form Handler
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Signup form submitted!");
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        
        console.log("Sign up attempt for:", email, "with name:", name);
        
        // Validation
        if (!name || !email || !password) {
            alert("Please fill in all fields!");
            return;
        }
        
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        
        if (password.length < 6) {
            alert("Password must be at least 6 characters long!");
            return;
        }
        
        // Show loading state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";
        
        try {
            // Check if Auth is available
            if (typeof Auth === 'undefined') {
                throw new Error('Auth module not loaded');
            }
            
            // Use Auth API to register
            const result = await Auth.register(name, email, password);
            console.log("Registration successful:", result.user.name);
            
            // Update TaskHive state
            TaskHive.currentUser = result.user;
            
            // Initialize rewards system if available
            if (typeof RewardsSystem !== 'undefined') {
                try {
                    await RewardsSystem.init();
                    console.log("Rewards system initialized after registration");
                } catch (rewardsError) {
                    console.error("Failed to initialize rewards system:", rewardsError);
                }
            }
            
            // Close modal and redirect to dashboard
            signupModal.style.display = 'none';
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Registration error:", error);
            alert(error.message || "Registration failed. Please try again.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
    
    console.log('All event listeners set up successfully');
});

// Update the UI elements with user information
function updateUserUIElements() {
    if (!TaskHive.currentUser) return;

    console.log('Updating UI elements for user:', TaskHive.currentUser.name);
    
    // Update user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = TaskHive.currentUser.name;
    }
    
    // Update user avatar
    const userAvatarImg = document.querySelector('.user-avatar img');
    if (userAvatarImg) {
        const profilePic = TaskHive.currentUser.profilePic || 
            `https://placehold.co/100x100/orange/white?text=${TaskHive.currentUser.name.charAt(0)}`;
        userAvatarImg.src = profilePic;
    }
}

// Logout functionality
function logout() {
    console.log('Logging out user');
    
    if (typeof Auth !== 'undefined') {
        Auth.logout();
    }
    
    TaskHive.currentUser = null;
    window.location.href = 'welcomepage1.html';
}

// Make logout function globally available
window.logout = logout;

console.log('TaskHive App loaded successfully');
