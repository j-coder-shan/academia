// Lecturer Manage Courses JavaScript
class LecturerManageCourses {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        if (!window.simpleAuth.requireAuth()) {
            return;
        }

        // Load user profile
        this.loadUserProfile();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load courses data
        this.loadCourses();
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.simpleAuth.handleLogout(e);
            });
        }

        // Create course button
        const createCourseBtn = document.getElementById('createCourseBtn');
        if (createCourseBtn) {
            createCourseBtn.addEventListener('click', () => {
                this.openCreateCourseModal();
            });
        }

        // Import course button
        const importCourseBtn = document.getElementById('importCourseBtn');
        if (importCourseBtn) {
            importCourseBtn.addEventListener('click', () => {
                this.openImportCourseModal();
            });
        }
    }

    async loadUserProfile() {
        try {
            const userName = localStorage.getItem('userName') || 'Lecturer';
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async loadCourses() {
        try {
            // Here you would typically fetch courses from the backend
            // For now, we'll simulate loading
            this.showLoadingState();
            
            // Simulate API call
            setTimeout(() => {
                this.hideLoadingState();
                this.displayCourses();
            }, 1000);
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showError('Failed to load courses');
        }
    }

    displayCourses() {
        // Display courses in the manage courses interface
        // This would typically populate course cards with edit/delete options
        console.log('Displaying courses for management');
    }

    openCreateCourseModal() {
        // Open modal for creating a new course
        this.showNotification('Create Course modal would open here', 'info');
    }

    openImportCourseModal() {
        // Open modal for importing a course
        this.showNotification('Import Course modal would open here', 'info');
    }

    showLoadingState() {
        // Show loading spinner or skeleton
        console.log('Loading courses...');
    }

    hideLoadingState() {
        // Hide loading spinner
        console.log('Loading complete');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create or update notification
        let notification = document.getElementById('manageCourseNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'manageCourseNotification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                color: white;
                font-weight: 500;
                max-width: 300px;
            `;
            document.body.appendChild(notification);
        }

        // Set color based on type
        const colors = {
            success: '#10ac84',
            error: '#ee5253',
            warning: '#ffa502',
            info: '#3742fa'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.innerHTML = `<i class="fas fa-${this.getIconForType(type)}"></i> ${message}`;

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Hide after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 4000);
    }

    getIconForType(type) {
        const icons = {
            success: 'check',
            error: 'exclamation-triangle',
            warning: 'exclamation',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lecturerManageCourses = new LecturerManageCourses();
});
