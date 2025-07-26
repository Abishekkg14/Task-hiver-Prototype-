// Authentication API module for TaskHive
const API_BASE_URL = 'http://localhost:5000/api';

// Authentication functions
const Auth = {
    // Register new user
    async register(name, email, password) {
        console.log('Auth.register called with:', { name, email, password: '***' });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            console.log('Registration response status:', response.status);
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                throw new Error('Server returned invalid response');
            }
            
            console.log('Registration response data:', data);
            
            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 400 && data.msg && data.msg.includes('already exists')) {
                    throw new Error('An account with this email already exists. Please try logging in instead.');
                } else if (response.status === 500) {
                    throw new Error('Server error occurred. Please try again later.');
                } else {
                    throw new Error(data.msg || `Registration failed (${response.status})`);
                }
            }

            // Validate response data
            if (!data.token || !data.user) {
                throw new Error('Invalid response from server - missing token or user data');
            }

            // Store token and user data
            localStorage.setItem('taskhive_token', data.token);
            localStorage.setItem('taskhive_user', JSON.stringify(data.user));
            
            console.log('✅ Registration successful and data stored');
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            
            // If it's a network error, provide a more user-friendly message
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    },
    
    // Login user
    async login(email, password) {
        console.log('Auth.login called with:', { email, password: '***' });
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);
            
            if (!response.ok) {
                throw new Error(data.msg || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('taskhive_token', data.token);
            localStorage.setItem('taskhive_user', JSON.stringify(data.user));
            
            console.log('Login successful, token and user data stored');
            return data;
        } catch (error) {
            console.error('Login error:', error);
            
            // If it's a network error, provide a more user-friendly message
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    },
    
    // Logout user
    logout() {
        localStorage.removeItem('taskhive_token');
        localStorage.removeItem('taskhive_user');
        // Check if TaskHive is defined before setting currentUser
        if (typeof TaskHive !== 'undefined') {
            TaskHive.currentUser = null;
        }
    },    // Get stored user data
    getCurrentUser() {
        const userData = localStorage.getItem('taskhive_user');
        const token = this.getToken();
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                
                // Ensure user has an id
                if (!user.id && token) {
                    console.warn('User object missing id, attempting to extract from token');
                    try {
                        // Try to extract user id from token if available
                        const parts = token.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            if (payload.id) {
                                console.log('Extracted user id from token:', payload.id);
                                user.id = payload.id;
                            }
                        }
                    } catch (tokenError) {
                        console.error('Failed to extract user id from token:', tokenError);
                    }
                }
                
                return user;
            } catch (e) {
                console.error('Error parsing user data:', e);
                this.logout();
                return null;
            }
        }
        return null;
    },

    // Get stored token
    getToken() {
        return localStorage.getItem('taskhive_token');
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getCurrentUser();
        return !!(token && user);
    },    // Get auth headers for API requests
    getAuthHeaders() {
        const token = this.getToken();
        console.log('Auth token being used:', token);
        
        // Validate token before sending
        if (token) {
            try {
                // Simple check - see if it's a valid JWT format
                const parts = token.split('.');
                if (parts.length !== 3) {
                    console.warn('Token does not appear to be a valid JWT (wrong number of segments)');
                }
                
                // Try to decode the payload to check for user.id
                const payload = JSON.parse(atob(parts[1]));
                console.log('Token payload:', payload);
                
                if (!payload.id) {
                    console.warn('Token payload missing user id:', payload);
                    
                    // Attempt to fix the token if possible
                    if (payload.user && payload.user.id) {
                        console.log('Found id in user object, creating fixed token');
                        // We won't actually fix it here as that would require re-signing
                        // Just log it for debugging
                    }
                }
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
        
        return token ? {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }
};

// Tasks API functions
const TasksAPI = {    // Create new task
    async createTask(taskData) {
        try {
            console.log('Creating task:', taskData);
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify(taskData)
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || data.message || 'Failed to create task');
                }

                return data;
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}...`);
            }
        } catch (error) {
            console.error('Create task error:', error);
            throw error;
        }
    },    // Get all tasks
    async getTasks() {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                headers: Auth.getAuthHeaders()
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || data.message || 'Failed to fetch tasks');
                }

                return data;
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}...`);
            }
        } catch (error) {
            console.error('Get tasks error:', error);
            throw error;
        }
    },    // Update task
    async updateTask(taskId, updateData) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || data.message || 'Failed to update task');
                }

                return data;
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}...`);
            }
        } catch (error) {
            console.error('Update task error:', error);
            throw error;
        }
    },    // Delete task
    async deleteTask(taskId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: Auth.getAuthHeaders()
            });

            if (!response.ok) {
                try {
                    const data = await response.json();
                    throw new Error(data.msg || data.message || 'Failed to delete task');
                } catch (jsonError) {
                    const text = await response.text();
                    throw new Error(`Failed to delete task: ${text.substring(0, 50)}...`);
                }
            }

            return true;
        } catch (error) {
            console.error('Delete task error:', error);
            throw error;
        }
    }
};
