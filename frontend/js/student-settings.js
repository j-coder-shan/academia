// Student Settings JavaScript
class StudentSettings {
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
        
        // Initialize tabs
        this.initializeTabs();
        
        // Load saved settings
        this.loadSettings();
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

        // Save settings when toggles change
        const toggles = document.querySelectorAll('.switch input');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.saveSettings();
            });
        });
    }

    async loadUserProfile() {
        try {
            const userName = localStorage.getItem('userName') || 'Student';
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    initializeTabs() {
        // Show general tab by default
        this.showTab('general');
    }

    showTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });

        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('[data-tab]');
        tabButtons.forEach(button => {
            button.style.color = '#4a5568';
            button.style.borderBottom = 'none';
        });

        // Show selected tab content
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Activate selected tab button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.style.color = '#3182ce';
            selectedButton.style.borderBottom = '2px solid #3182ce';
        }
    }

    loadSettings() {
        // Load settings from localStorage
        const settings = JSON.parse(localStorage.getItem('studentSettings') || '{}');
        
        // Apply saved settings to toggles
        Object.keys(settings).forEach(settingKey => {
            const toggle = document.querySelector(`input[data-setting="${settingKey}"]`);
            if (toggle) {
                toggle.checked = settings[settingKey];
            }
        });

        // If no settings exist, set some defaults
        if (Object.keys(settings).length === 0) {
            this.setDefaultSettings();
        }
    }

    setDefaultSettings() {
        const defaults = {
            darkMode: false,
            emailNotifications: true,
            assignmentReminders: true,
            gradeNotifications: true,
            courseUpdates: false,
            profileVisibility: true,
            showOnlineStatus: false,
            allowMessages: true
        };

        // Apply defaults to toggles
        Object.keys(defaults).forEach(settingKey => {
            const toggle = document.querySelector(`input[data-setting="${settingKey}"]`);
            if (toggle) {
                toggle.checked = defaults[settingKey];
            }
        });

        // Save defaults
        localStorage.setItem('studentSettings', JSON.stringify(defaults));
    }

    saveSettings() {
        const settings = {};
        
        // Collect all toggle states
        const toggles = document.querySelectorAll('.switch input[data-setting]');
        toggles.forEach(toggle => {
            const settingKey = toggle.getAttribute('data-setting');
            if (settingKey) {
                settings[settingKey] = toggle.checked;
            }
        });

        // Save to localStorage
        localStorage.setItem('studentSettings', JSON.stringify(settings));
        
        // Apply dark mode if enabled
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Show save confirmation
        this.showSaveConfirmation();
    }

    showSaveConfirmation() {
        // Use the centralized notification system if available
        if (window.AcademiaUtils && window.AcademiaUtils.notifications) {
            return window.AcademiaUtils.notifications.success('Settings saved successfully!', 3000);
        }
        
        // Fallback to existing local implementation
        // Create or show save confirmation
        let confirmation = document.getElementById('saveConfirmation');
        if (!confirmation) {
            confirmation = document.createElement('div');
            confirmation.id = 'saveConfirmation';
            confirmation.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10ac84;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            confirmation.innerHTML = '<i class="fas fa-check"></i> Settings saved successfully!';
            document.body.appendChild(confirmation);
        }

        // Show confirmation
        setTimeout(() => {
            confirmation.style.transform = 'translateX(0)';
        }, 100);

        // Hide after 3 seconds
        setTimeout(() => {
            confirmation.style.transform = 'translateX(100%)';
        }, 3000);
    }
}

// Global function for tab switching (called from HTML onclick)
function showTab(tabName) {
    if (window.studentSettings) {
        window.studentSettings.showTab(tabName);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentSettings = new StudentSettings();
});
