// Lecturer Evaluation JavaScript
class LecturerEvaluation {
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
        
        // Load evaluation data
        this.loadEvaluations();
        
        // Update stats
        this.updateStats();
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

        // Bulk grade button
        const bulkGradeBtn = document.getElementById('bulkGradeBtn');
        if (bulkGradeBtn) {
            bulkGradeBtn.addEventListener('click', () => {
                this.openBulkGradeModal();
            });
        }

        // Export grades button
        const exportGradesBtn = document.getElementById('exportGradesBtn');
        if (exportGradesBtn) {
            exportGradesBtn.addEventListener('click', () => {
                this.exportGrades();
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

    async loadEvaluations() {
        try {
            // Here you would typically fetch evaluations from the backend
            // For now, we'll simulate loading
            this.showLoadingState();
            
            // Simulate API call
            setTimeout(() => {
                this.hideLoadingState();
                this.displayEvaluations();
            }, 1000);
        } catch (error) {
            console.error('Error loading evaluations:', error);
            this.showError('Failed to load evaluations');
        }
    }

    displayEvaluations() {
        // Display evaluations in the interface
        // This would typically populate evaluation cards with grading options
        console.log('Displaying evaluations for grading');
    }

    updateStats() {
        // Update the pending and completed counts
        // In a real application, this would come from the backend
        const pendingElement = document.getElementById('pendingCount');
        const completedElement = document.getElementById('completedCount');
        
        if (pendingElement) {
            pendingElement.textContent = '15';
        }
        
        if (completedElement) {
            completedElement.textContent = '42';
        }
    }

    openBulkGradeModal() {
        // Open modal for bulk grading
        this.showNotification('Bulk Grade modal would open here', 'info');
    }

    exportGrades() {
        // Export grades functionality
        this.showNotification('Exporting grades... Download will start shortly.', 'info');
        
        // Simulate export process
        setTimeout(() => {
            this.showNotification('Grades exported successfully!', 'success');
        }, 2000);
    }

    showLoadingState() {
        // Show loading spinner or skeleton
        console.log('Loading evaluations...');
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
        let notification = document.getElementById('evaluationNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'evaluationNotification';
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
    window.lecturerEvaluation = new LecturerEvaluation();
});
