// Dashboard JavaScript Module
class Dashboard {
    constructor() {
        this.auth = window.auth;
        this.apiUrl = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        // Check authentication
        if (!this.auth.requireAuth()) {
            return;
        }

        // Load dashboard data based on user type
        this.loadDashboardData();
        this.bindEvents();
    }

    bindEvents() {
        // Sidebar navigation
        const sidebarLinks = document.querySelectorAll('.sidebar a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
    }

    async loadDashboardData() {
        const user = this.auth.getCurrentUser();
        
        try {
            this.showLoading(true);
            
            if (user.userType === 'student') {
                await this.loadStudentDashboard();
            } else if (user.userType === 'lecturer') {
                await this.loadLecturerDashboard();
            }
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showAlert('Error loading dashboard data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStudentDashboard() {
        try {
            // Load student statistics
            const statsResponse = await this.auth.apiRequest('/student/stats');
            if (statsResponse && statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateStudentStats(stats);
            }

            // Load enrolled courses
            const coursesResponse = await this.auth.apiRequest('/student/courses');
            if (coursesResponse && coursesResponse.ok) {
                const courses = await coursesResponse.json();
                this.updateCoursesList(courses);
            }

            // Load recent activities
            const activitiesResponse = await this.auth.apiRequest('/student/activities');
            if (activitiesResponse && activitiesResponse.ok) {
                const activities = await activitiesResponse.json();
                this.updateActivitiesList(activities);
            }

        } catch (error) {
            console.error('Error loading student dashboard:', error);
        }
    }

    async loadLecturerDashboard() {
        try {
            // Load lecturer statistics
            const statsResponse = await this.auth.apiRequest('/lecturer/stats');
            if (statsResponse && statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateLecturerStats(stats);
            }

            // Load managed courses
            const coursesResponse = await this.auth.apiRequest('/lecturer/courses');
            if (coursesResponse && coursesResponse.ok) {
                const courses = await coursesResponse.json();
                this.updateManagedCourses(courses);
            }

            // Load pending evaluations
            const evaluationsResponse = await this.auth.apiRequest('/lecturer/evaluations/pending');
            if (evaluationsResponse && evaluationsResponse.ok) {
                const evaluations = await evaluationsResponse.json();
                this.updatePendingEvaluations(evaluations);
            }

        } catch (error) {
            console.error('Error loading lecturer dashboard:', error);
        }
    }

    updateStudentStats(stats) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>${stats.enrolledCourses || 0}</h3>
                <p>Enrolled Courses</p>
            </div>
            <div class="stat-card">
                <h3>${stats.completedAssignments || 0}</h3>
                <p>Completed Assignments</p>
            </div>
            <div class="stat-card">
                <h3>${stats.pendingAssignments || 0}</h3>
                <p>Pending Assignments</p>
            </div>
            <div class="stat-card">
                <h3>${stats.averageGrade || 'N/A'}</h3>
                <p>Average Grade</p>
            </div>
        `;
    }

    updateLecturerStats(stats) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>${stats.managedCourses || 0}</h3>
                <p>Managed Courses</p>
            </div>
            <div class="stat-card">
                <h3>${stats.totalStudents || 0}</h3>
                <p>Total Students</p>
            </div>
            <div class="stat-card">
                <h3>${stats.pendingEvaluations || 0}</h3>
                <p>Pending Evaluations</p>
            </div>
            <div class="stat-card">
                <h3>${stats.completedEvaluations || 0}</h3>
                <p>Completed Evaluations</p>
            </div>
        `;
    }

    updateCoursesList(courses) {
        const coursesContainer = document.getElementById('coursesContainer');
        if (!coursesContainer) return;

        if (!courses || courses.length === 0) {
            coursesContainer.innerHTML = '<p>No courses enrolled yet.</p>';
            return;
        }

        const coursesHTML = courses.map(course => `
            <div class="card course-card" data-course-id="${course.id}">
                <h4>${course.name}</h4>
                <p><strong>Instructor:</strong> ${course.instructor}</p>
                <p><strong>Progress:</strong> ${course.progress}%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <p><strong>Next Assignment:</strong> ${course.nextAssignment || 'None'}</p>
                <button class="btn btn-secondary" onclick="dashboard.viewCourse('${course.id}')">
                    View Course
                </button>
            </div>
        `).join('');

        coursesContainer.innerHTML = coursesHTML;
    }

    updateManagedCourses(courses) {
        const coursesContainer = document.getElementById('managedCoursesContainer');
        if (!coursesContainer) return;

        if (!courses || courses.length === 0) {
            coursesContainer.innerHTML = '<p>No courses managed yet.</p>';
            return;
        }

        const coursesHTML = courses.map(course => `
            <div class="card course-card" data-course-id="${course.id}">
                <h4>${course.name}</h4>
                <p><strong>Students Enrolled:</strong> ${course.studentsCount}</p>
                <p><strong>Assignments:</strong> ${course.assignmentsCount}</p>
                <p><strong>Completion Rate:</strong> ${course.completionRate}%</p>
                <div class="course-actions">
                    <button class="btn" onclick="dashboard.manageCourse('${course.id}')">
                        Manage
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.viewStudents('${course.id}')">
                        View Students
                    </button>
                </div>
            </div>
        `).join('');

        coursesContainer.innerHTML = coursesHTML;
    }

    updateActivitiesList(activities) {
        const activitiesContainer = document.getElementById('activitiesContainer');
        if (!activitiesContainer) return;

        if (!activities || activities.length === 0) {
            activitiesContainer.innerHTML = '<p>No recent activities.</p>';
            return;
        }

        const activitiesHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="icon-${activity.type}"></i>
                </div>
                <div class="activity-content">
                    <h5>${activity.title}</h5>
                    <p>${activity.description}</p>
                    <small>${this.formatDate(activity.date)}</small>
                </div>
            </div>
        `).join('');

        activitiesContainer.innerHTML = activitiesHTML;
    }

    updatePendingEvaluations(evaluations) {
        const evaluationsContainer = document.getElementById('pendingEvaluationsContainer');
        if (!evaluationsContainer) return;

        if (!evaluations || evaluations.length === 0) {
            evaluationsContainer.innerHTML = '<p>No pending evaluations.</p>';
            return;
        }

        const evaluationsHTML = evaluations.map(evaluation => `
            <div class="evaluation-item">
                <h5>${evaluation.studentName}</h5>
                <p><strong>Assignment:</strong> ${evaluation.assignmentTitle}</p>
                <p><strong>Course:</strong> ${evaluation.courseName}</p>
                <p><strong>Submitted:</strong> ${this.formatDate(evaluation.submissionDate)}</p>
                <button class="btn" onclick="dashboard.evaluateAssignment('${evaluation.id}')">
                    Evaluate
                </button>
            </div>
        `).join('');

        evaluationsContainer.innerHTML = evaluationsHTML;
    }

    handleNavigation(event) {
        const href = event.target.getAttribute('href');
        
        // If it's an external link, let it navigate normally
        if (href && !href.startsWith('#')) {
            return;
        }

        event.preventDefault();
        
        // Handle internal navigation
        const section = href.substring(1);
        this.showSection(section);
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => section.style.display = 'none');

        // Show requested section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update active nav item
        const navLinks = document.querySelectorAll('.sidebar a');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`.sidebar a[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async refreshDashboard() {
        await this.loadDashboardData();
        this.showAlert('Dashboard refreshed!', 'success');
    }

    // Navigation methods
    viewCourse(courseId) {
        window.location.href = `courses.html?id=${courseId}`;
    }

    manageCourse(courseId) {
        window.location.href = `manage-courses.html?id=${courseId}`;
    }

    viewStudents(courseId) {
        window.location.href = `manage-courses.html?id=${courseId}&tab=students`;
    }

    evaluateAssignment(evaluationId) {
        window.location.href = `evaluation.html?id=${evaluationId}`;
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert alert at the top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
        }

        // Auto-remove alert after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}
