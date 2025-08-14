// Lecturer Navigation JavaScript - Sidebar Click Functions
class LecturerNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigationListeners();
        this.setupSidebarToggle();
        this.setActiveNavigation();
    }

    setupNavigationListeners() {
        // Add click listeners to all navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavigationClick(e, link);
            });
        });

        // Add click listeners to sidebar logo
        const sidebarLogo = document.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.addEventListener('click', () => {
                this.navigateToPage('dashboard.html');
            });
        }

        // Add click listeners to user info section
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.addEventListener('click', () => {
                this.navigateToPage('profile.html');
            });
        }
    }

    handleNavigationClick(e, link) {
        // Don't prevent default for now, let the browser handle navigation
        // But we can add analytics, state management, etc. here
        
        const href = link.getAttribute('href');
        if (href) {
            // Update active state before navigation
            this.updateActiveState(link);
            
            // Optional: Add navigation analytics
            this.trackNavigation(href);
            
            // Optional: Smooth transition effect
            this.addNavigationTransition();
        }
    }

    updateActiveState(clickedLink) {
        // Remove active class from all nav links
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to clicked link only
        clickedLink.classList.add('active');
        
        // Store the active page for consistency
        const href = clickedLink.getAttribute('href');
        if (href) {
            localStorage.setItem('lastActivePage', href);
        }
    }

    setActiveNavigation() {
        // Set active navigation based on current page
        const currentPage = this.getCurrentPageName();
        const navLinks = document.querySelectorAll('.nav-link');
        
        // First, remove all active classes
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Then add active class to the correct link
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href === currentPage) {
                link.classList.add('active');
            }
        });
        
        // Handle special cases for exact matching
        if (currentPage === 'dashboard.html') {
            const dashboardLink = document.querySelector('a[href="dashboard.html"]');
            if (dashboardLink) {
                dashboardLink.classList.add('active');
            }
        } else if (currentPage === 'courses.html') {
            const coursesLink = document.querySelector('a[href="courses.html"]');
            if (coursesLink) {
                coursesLink.classList.add('active');
            }
        } else if (currentPage === 'manage-courses.html') {
            const manageCourses = document.querySelector('a[href="manage-courses.html"]');
            if (manageCourses) {
                manageCourses.classList.add('active');
            }
        }
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        return fileName || 'dashboard.html';
    }

    navigateToPage(page) {
        // Smooth navigation to a specific page
        this.addNavigationTransition();
        setTimeout(() => {
            window.location.href = page;
        }, 200);
    }

    addNavigationTransition() {
        // Add a subtle transition effect during navigation
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.opacity = '0.8';
            mainContent.style.transform = 'translateX(5px)';
            
            setTimeout(() => {
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateX(0)';
            }, 200);
        }
    }

    setupSidebarToggle() {
        // Mobile sidebar toggle functionality
        let toggleBtn = document.getElementById('sidebarToggle');
        
        // Create toggle button if it doesn't exist
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.id = 'sidebarToggle';
            toggleBtn.className = 'sidebar-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
            toggleBtn.style.cssText = `
                display: none;
                position: fixed;
                top: 15px;
                left: 15px;
                z-index: 1001;
                background: var(--primary-blue);
                color: white;
                border: none;
                padding: 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            `;
            document.body.appendChild(toggleBtn);
        }

        // Toggle sidebar on mobile
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            
            if (sidebar && toggleBtn && 
                !sidebar.contains(e.target) && 
                !toggleBtn.contains(e.target) &&
                window.innerWidth <= 1024) {
                sidebar.classList.remove('mobile-open');
            }
        });

        // Show/hide toggle button based on screen size
        this.updateSidebarToggleVisibility();
        window.addEventListener('resize', () => {
            this.updateSidebarToggleVisibility();
        });
    }

    updateSidebarToggleVisibility() {
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            if (window.innerWidth <= 1024) {
                toggleBtn.style.display = 'block';
            } else {
                toggleBtn.style.display = 'none';
                // Remove mobile-open class when switching to desktop
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        }
    }

    trackNavigation(href) {
        // Optional: Track navigation for analytics
        console.log(`Navigating to: ${href}`);
        
        // You can implement analytics tracking here
        // Example: Google Analytics, custom analytics, etc.
    }

    // Utility methods for specific navigation actions
    goToDashboard() {
        this.navigateToPage('dashboard.html');
    }

    goToCourses() {
        this.navigateToPage('courses.html');
    }

    goToManageCourses() {
        this.navigateToPage('manage-courses.html');
    }

    goToPresentations() {
        this.navigateToPage('presentations.html');
    }

    goToAssignments() {
        this.navigateToPage('assignments.html');
    }

    goToEvaluations() {
        this.navigateToPage('evaluation.html');
    }

    goToCalendar() {
        this.navigateToPage('calendar.html');
    }

    goToProfile() {
        this.navigateToPage('profile.html');
    }

    goToSettings() {
        this.navigateToPage('settings.html');
    }
}

// Global navigation functions that can be called from anywhere
window.lecturerNav = {
    goToDashboard: () => window.lecturerNavigation?.goToDashboard(),
    goToCourses: () => window.lecturerNavigation?.goToCourses(),
    goToManageCourses: () => window.lecturerNavigation?.goToManageCourses(),
    goToPresentations: () => window.lecturerNavigation?.goToPresentations(),
    goToAssignments: () => window.lecturerNavigation?.goToAssignments(),
    goToEvaluations: () => window.lecturerNavigation?.goToEvaluations(),
    goToCalendar: () => window.lecturerNavigation?.goToCalendar(),
    goToProfile: () => window.lecturerNavigation?.goToProfile(),
    goToSettings: () => window.lecturerNavigation?.goToSettings()
};

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lecturerNavigation = new LecturerNavigation();
});

// Add mobile sidebar styles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    @media (max-width: 1024px) {
        .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            position: fixed;
            z-index: 1000;
            height: 100vh;
        }
        
        .sidebar.mobile-open {
            transform: translateX(0);
        }
        
        .main-content {
            width: 100%;
            margin-left: 0;
        }
        
        .sidebar-toggle {
            display: block !important;
        }
    }
    
    .main-content {
        transition: opacity 0.2s ease, transform 0.2s ease;
    }
`;
document.head.appendChild(mobileStyles);
