// Lecturer Calendar JavaScript
class LecturerCalendar {
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
        
        // Load calendar data
        this.loadCalendar();
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

        // Add event button
        const addEventBtn = document.getElementById('addEventBtn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                this.addEvent();
            });
        }

        // View schedule button
        const viewScheduleBtn = document.getElementById('viewScheduleBtn');
        if (viewScheduleBtn) {
            viewScheduleBtn.addEventListener('click', () => {
                this.viewSchedule();
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

    async loadCalendar() {
        try {
            // Here you would typically fetch calendar events from the backend
            console.log('Loading calendar events...');
        } catch (error) {
            console.error('Error loading calendar:', error);
        }
    }

    addEvent() {
        this.showNotification('Add Event functionality would be implemented here', 'info');
    }

    viewSchedule() {
        this.showNotification('View Schedule functionality would be implemented here', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification
        let notification = document.getElementById('calendarNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'calendarNotification';
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

        const colors = {
            success: '#10ac84',
            error: '#ee5253',
            warning: '#ffa502',
            info: '#3742fa'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 4000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lecturerCalendar = new LecturerCalendar();
});
