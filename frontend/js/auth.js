// Authentication JavaScript Module
class Auth {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        // Check if user is already logged in and redirect only if not on dashboard
        const token = localStorage.getItem('authToken');
        const currentPath = window.location.pathname;
        
        if (token && this.isValidToken(token)) {
            // Only redirect if we're on the login page, not if we're already on a dashboard
            if (currentPath.includes('login.html')) {
                this.redirectToDashboard();
            }
        }

        // Bind event listeners
        this.bindEvents();
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const loginId = formData.get('loginId');
        const password = formData.get('password');

        // Validate ID format
        if (!this.validateId(loginId)) {
            this.showAlert('Please enter a valid ID format (stu001 or lec001)', 'error');
            return;
        }

        // Determine user type from ID
        const userType = loginId.startsWith('stu') ? 'student' : 'lecturer';
        
        const loginData = {
            studentId: userType === 'student' ? loginId : undefined,
            employeeId: userType === 'lecturer' ? loginId : undefined,
            password: password,
            userType: userType
        };

        try {
            this.showLoading('login', true);
            
            // Clear any existing session data before login
            this.clearAuthData();
            
            const data = await AcademiaUtils.apiRequest(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                body: JSON.stringify(loginData)
            });

            // Store authentication token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userType', data.role);
            localStorage.setItem('userRole', data.role); // Also store as userRole for consistency
            localStorage.setItem('userId', data._id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', data.email);
            
            console.log(`✅ User logged in: ${data.name} (${data.role})`);
            
            AcademiaUtils.showSuccessMessage('Login successful!');
            
            // Redirect based on user type
            setTimeout(() => {
                this.redirectToDashboard(data.role);
            }, 1000);
        } catch (error) {
            AcademiaUtils.showErrorMessage(error, 'Login failed');
        } finally {
            this.showLoading('login', false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const userId = formData.get('userId');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const role = formData.get('role');

        // Validate form data
        if (!this.validateRegistrationForm(name, email, userId, password, confirmPassword, role)) {
            return;
        }

        // Determine user type from ID and role
        const userType = role;
        
        const registerData = {
            name: name,
            email: email,
            password: password,
            role: userType,
            studentId: userType === 'student' ? userId : undefined,
            employeeId: userType === 'lecturer' ? userId : undefined
        };

        try {
            this.showLoading('register', true);
            const data = await AcademiaUtils.apiRequest(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                body: JSON.stringify(registerData)
            });

            AcademiaUtils.showSuccessMessage('Registration successful! You can now login.');
            
            // Switch to login form after successful registration
            setTimeout(() => {
                this.toggleForms('login');
                // Clear registration form
                form.reset();
            }, 2000);
        } catch (error) {
            AcademiaUtils.showErrorMessage(error, 'Registration failed');
        } finally {
            this.showLoading('register', false);
        }
    }

    validateId(id) {
        // Validate ID format: stu### or lec### where ### is at least 3 digits
        const idPattern = /^(stu|lec)\d{3,}$/;
        return idPattern.test(id);
    }

    validateRegistrationForm(name, email, userId, password, confirmPassword, role) {
        // Validate name
        if (!name || name.trim().length < 2) {
            this.showAlert('Please enter a valid name (at least 2 characters)', 'error');
            return false;
        }

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return false;
        }

        // Validate ID format
        if (!this.validateId(userId)) {
            this.showAlert('Please enter a valid ID format (stu001 or lec001)', 'error');
            return false;
        }

        // Validate ID matches role
        if (role === 'student' && !userId.startsWith('stu')) {
            this.showAlert('Student ID must start with "stu"', 'error');
            return false;
        }
        if (role === 'lecturer' && !userId.startsWith('lec')) {
            this.showAlert('Lecturer ID must start with "lec"', 'error');
            return false;
        }

        // Validate password
        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return false;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return false;
        }

        // Validate role selection
        if (!role) {
            this.showAlert('Please select a role (Student or Lecturer)', 'error');
            return false;
        }

        return true;
    }

    toggleForms(formType) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const toggleBtns = document.querySelectorAll('.toggle-btn');

        if (formType === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            toggleBtns[0].classList.add('active');
            toggleBtns[1].classList.remove('active');
        } else {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            toggleBtns[0].classList.remove('active');
            toggleBtns[1].classList.add('active');
        }
    }

    handleLogout(event) {
        if (event) {
            event.preventDefault();
        }
        
        console.log('🚪 Logging out user...');
        
        // Clear ALL stored authentication data
        this.clearAuthData();
        
        // Force clear all localStorage (optional - use if needed)
        // localStorage.clear();
        
        console.log('✅ All authentication data cleared');
        
        // Redirect to login page
        window.location.href = '../login.html';
    }

    redirectToDashboard(userType = null) {
        const type = userType || localStorage.getItem('userType');
        
        // Get current page location to determine correct relative path
        const currentPath = window.location.pathname;
        let basePath = '';
        
        if (currentPath.includes('/html/login.html')) {
            // We're on the login page, so dashboards are in relative paths
            basePath = '';
        } else {
            // We might be on a dashboard page, so need to navigate differently
            basePath = '../';
        }
        
        if (type === 'student') {
            window.location.href = `${basePath}student/dashboard.html`;
        } else if (type === 'lecturer') {
            window.location.href = `${basePath}lecturer/dashboard.html`;
        } else {
            // Default redirect to student dashboard
            window.location.href = `${basePath}student/dashboard.html`;
        }
    }

    isValidToken(token) {
        try {
            // Basic token validation (you might want to implement JWT decoding)
            return token && token.length > 0;
        } catch (error) {
            return false;
        }
    }

    showAlert(message, type = 'info') {
        // Use the centralized notification system if available, otherwise fallback to local
        if (window.AcademiaUtils && window.AcademiaUtils.notifications) {
            return window.AcademiaUtils.notifications.show(message, type);
        }
        
        // Fallback to existing local implementation
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add alert styles
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 
                        type === 'error' ? 'linear-gradient(135deg, #dc3545, #e74c3c)' : 
                        'linear-gradient(135deg, #007bff, #6610f2)'};
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(alert);

        // Animate in
        setTimeout(() => {
            alert.style.transform = 'translateX(0)';
        }, 100);

        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.transform = 'translateX(100%)';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    showLoading(formType, show) {
        const form = document.getElementById(formType + 'Form');
        const submitBtn = form?.querySelector('button[type="submit"]');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoader = submitBtn?.querySelector('.btn-loader');
        
        if (submitBtn && btnText && btnLoader) {
            if (show) {
                submitBtn.disabled = true;
                btnText.classList.add('hidden');
                btnLoader.classList.remove('hidden');
            } else {
                submitBtn.disabled = false;
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
            }
        }
    }

    // Helper function to clear all authentication data
    clearAuthData() {
        console.log('🧹 Clearing previous session data...');
        
        const keysToRemove = [
            'authToken', 'userType', 'userRole', 'userId', 'userName', 'userEmail',
            'userProfile', 'lastLogin', 'sessionData', 'currentUser'
        ];
        
        // Clear from both localStorage and sessionStorage
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Force clear all storage
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.warn('Could not clear storage:', e);
        }
    }

    // Method to check authentication for protected pages
    requireAuth() {
        const token = localStorage.getItem('authToken');
        if (!token || !this.isValidToken(token)) {
            // Redirect to login page if not authenticated
            const currentPath = window.location.pathname;
            let loginPath = '';
            
            if (currentPath.includes('/student/') || currentPath.includes('/lecturer/')) {
                loginPath = '../login.html';
            } else {
                loginPath = 'login.html';
            }
            
            window.location.href = loginPath;
            return false;
        }
        return true;
    }

    // Get current user info
    getCurrentUser() {
        return {
            token: localStorage.getItem('authToken'),
            userType: localStorage.getItem('userType'),
            userId: localStorage.getItem('userId')
        };
    }

    // Make authenticated API requests
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, config);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.handleLogout();
                return null;
            }

            return response;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
