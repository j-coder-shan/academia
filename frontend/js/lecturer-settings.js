// Lecturer Settings JavaScript
class LecturerSettings {
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
        
        // Load saved settings
        this.loadSettings();

        // Initialize modals
        this.initializeModals();
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

        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Reset settings button
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Change password button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.openChangePasswordModal();
            });
        }

        // Export data button
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Download reports button
        const downloadReportsBtn = document.getElementById('downloadReportsBtn');
        if (downloadReportsBtn) {
            downloadReportsBtn.addEventListener('click', () => {
                this.downloadReports();
            });
        }

        // Deactivate account button
        const deactivateAccountBtn = document.getElementById('deactivateAccountBtn');
        if (deactivateAccountBtn) {
            deactivateAccountBtn.addEventListener('click', () => {
                this.deactivateAccount();
            });
        }

        // Theme change listener
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        }

        // Auto-save for toggle switches
        const toggles = document.querySelectorAll('.toggle-switch input');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.autoSaveSettings();
            });
        });

        // Auto-save for select elements
        const selects = document.querySelectorAll('select:not(#theme)');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                this.autoSaveSettings();
            });
        });

        // Auto-save for input elements
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.autoSaveSettings();
            });
        });
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

    loadSettings() {
        // Load settings from localStorage
        const settings = JSON.parse(localStorage.getItem('lecturerSettings') || '{}');
        
        // Apply saved settings
        Object.keys(settings).forEach(settingKey => {
            const element = document.getElementById(settingKey);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[settingKey];
                } else if (element.tagName === 'SELECT' || element.type === 'number') {
                    element.value = settings[settingKey];
                }
            }
        });

        // If no settings exist, set defaults
        if (Object.keys(settings).length === 0) {
            this.setDefaultSettings();
        }

        // Apply current theme
        const currentTheme = settings.theme || 'light';
        this.applyTheme(currentTheme);
    }

    setDefaultSettings() {
        const defaults = {
            language: 'en',
            timezone: 'UTC',
            theme: 'light',
            emailNotifications: true,
            assignmentSubmissions: true,
            courseEnrollments: true,
            systemUpdates: true,
            defaultGradingScale: 'standard',
            autoGradeCalculation: true,
            lateSubmissionPenalty: true,
            penaltyPercentage: 10,
            profileVisibility: true,
            officeHoursVisibility: true,
            allowStudentMessages: true,
            backupFrequency: 'weekly',
            dataAnalytics: true,
            betaFeatures: false
        };

        // Apply defaults to form elements
        Object.keys(defaults).forEach(settingKey => {
            const element = document.getElementById(settingKey);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = defaults[settingKey];
                } else if (element.tagName === 'SELECT' || element.type === 'number') {
                    element.value = defaults[settingKey];
                }
            }
        });

        // Save defaults
        localStorage.setItem('lecturerSettings', JSON.stringify(defaults));
    }

    saveSettings() {
        const settings = {};
        
        // Collect all form values
        const formElements = document.querySelectorAll('select, input[type="checkbox"], input[type="number"]');
        formElements.forEach(element => {
            const key = element.id;
            if (key) {
                if (element.type === 'checkbox') {
                    settings[key] = element.checked;
                } else {
                    settings[key] = element.value;
                }
            }
        });

        // Save to localStorage
        localStorage.setItem('lecturerSettings', JSON.stringify(settings));
        
        // Apply theme
        this.applyTheme(settings.theme);

        // Show save confirmation
        this.showSaveConfirmation();
    }

    autoSaveSettings() {
        // Auto-save without showing confirmation
        const settings = {};
        
        const formElements = document.querySelectorAll('select, input[type="checkbox"], input[type="number"]');
        formElements.forEach(element => {
            const key = element.id;
            if (key) {
                if (element.type === 'checkbox') {
                    settings[key] = element.checked;
                } else {
                    settings[key] = element.value;
                }
            }
        });

        localStorage.setItem('lecturerSettings', JSON.stringify(settings));
        this.applyTheme(settings.theme);
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            localStorage.removeItem('lecturerSettings');
            this.setDefaultSettings();
            this.showResetConfirmation();
        }
    }

    applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme');
        
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else if (theme === 'light') {
            body.classList.add('light-theme');
        } else if (theme === 'auto') {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
        }
    }

    initializeModals() {
        // Change password modal
        const modal = document.getElementById('changePasswordModal');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = document.getElementById('cancelPasswordBtn');
        const updateBtn = document.getElementById('updatePasswordBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeChangePasswordModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeChangePasswordModal();
            });
        }

        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                this.updatePassword();
            });
        }

        // Close modal when clicking outside
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeChangePasswordModal();
                }
            });
        }
    }

    openChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.style.display = 'block';
            // Clear form
            const form = document.getElementById('changePasswordForm');
            if (form) {
                form.reset();
            }
        }
    }

    closeChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async updatePassword() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmNewPassword')?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Please fill in all password fields.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters long.', 'error');
            return;
        }

        try {
            // Here you would typically make an API call to update the password
            // For now, we'll simulate success
            this.showNotification('Password updated successfully!', 'success');
            this.closeChangePasswordModal();
        } catch (error) {
            this.showNotification('Failed to update password. Please try again.', 'error');
        }
    }

    exportData() {
        // Simulate data export
        this.showNotification('Data export initiated. You will receive an email when ready.', 'info');
    }

    downloadReports() {
        // Simulate report download
        this.showNotification('Generating reports... Download will start shortly.', 'info');
    }

    deactivateAccount() {
        if (confirm('Are you sure you want to deactivate your account? This action cannot be easily undone.')) {
            this.showNotification('Account deactivation request submitted. Contact admin for assistance.', 'warning');
        }
    }

    showSaveConfirmation() {
        this.showNotification('Settings saved successfully!', 'success');
    }

    showResetConfirmation() {
        this.showNotification('Settings reset to default values.', 'info');
    }

    showNotification(message, type = 'info') {
        // Create or update notification
        let notification = document.getElementById('settingsNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'settingsNotification';
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
    window.lecturerSettings = new LecturerSettings();
});
