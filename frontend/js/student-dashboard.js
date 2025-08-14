// Student Dashboard JavaScript
class StudentDashboard {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        // Check authentication
        if (!window.auth.requireAuth()) {
            return;
        }

        // Load dashboard data
        this.loadDashboardData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load user profile
        this.loadUserProfile();
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.auth.handleLogout(e);
            });
        }
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

    async loadDashboardData() {
        try {
            // Load courses
            await this.loadRecentCourses();
            
            // Load assignments
            await this.loadUpcomingAssignments();
            
            // Load recent activity
            await this.loadRecentActivity();
            
            // Update statistics
            await this.updateStatistics();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadRecentCourses() {
        try {
            const response = await window.auth.apiRequest('/student/courses');
            const container = document.getElementById('recentCourses');
            
            if (response && response.ok) {
                const courses = await response.json();
                this.displayCourses(courses.slice(0, 3), container);
            } else {
                container.innerHTML = this.getEmptyState('courses');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            const container = document.getElementById('recentCourses');
            container.innerHTML = this.getEmptyState('courses');
        }
    }

    async loadUpcomingAssignments() {
        try {
            const response = await window.auth.apiRequest('/student/dashboard');
            const container = document.getElementById('upcomingAssignments');
            
            if (response && response.ok) {
                const data = await response.json();
                const assignments = data.upcomingAssignments || [];
                this.displayAssignments(assignments, container);
            } else {
                container.innerHTML = this.getEmptyState('assignments');
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            const container = document.getElementById('upcomingAssignments');
            container.innerHTML = this.getEmptyState('assignments');
        }
    }

    async loadRecentActivity() {
        try {
            // Since we don't have a specific activity endpoint, we'll create activity from recent data
            const coursesResponse = await window.auth.apiRequest('/student/courses');
            const container = document.getElementById('recentActivity');
            
            if (coursesResponse && coursesResponse.ok) {
                const courses = await coursesResponse.json();
                const activities = this.generateActivityFromCourses(courses);
                this.displayActivity(activities.slice(0, 5), container);
            } else {
                container.innerHTML = this.getEmptyState('activity');
            }
        } catch (error) {
            console.error('Error loading activity:', error);
            const container = document.getElementById('recentActivity');
            container.innerHTML = this.getEmptyState('activity');
        }
    }

    async updateStatistics() {
        try {
            const response = await window.auth.apiRequest('/student/dashboard');
            
            if (response && response.ok) {
                const data = await response.json();
                const stats = data.statistics;
                
                if (stats) {
                    document.getElementById('enrolledCourses').textContent = stats.totalCourses || '0';
                    document.getElementById('pendingAssignments').textContent = stats.pendingAssignments || '0';
                    document.getElementById('completedAssignments').textContent = stats.completedAssignments || '0';
                    document.getElementById('averageGrade').textContent = stats.averageGrade ? `${stats.averageGrade}%` : 'N/A';
                }
            } else {
                // Set default values if API fails
                document.getElementById('enrolledCourses').textContent = '0';
                document.getElementById('pendingAssignments').textContent = '0';
                document.getElementById('completedAssignments').textContent = '0';
                document.getElementById('averageGrade').textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
            // Set default values if error occurs
            document.getElementById('enrolledCourses').textContent = '0';
            document.getElementById('pendingAssignments').textContent = '0';
            document.getElementById('completedAssignments').textContent = '0';
            document.getElementById('averageGrade').textContent = 'N/A';
        }
    }

    displayCourses(courses, container) {
        if (!courses || courses.length === 0) {
            container.innerHTML = this.getEmptyState('courses');
            return;
        }

        const coursesHTML = courses.map(course => `
            <div class="course-card" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${course.title}</h4>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${course.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${course.code || 'N/A'}</span>
                    <span style="color: #28a745; font-size: 12px;"><i class="fas fa-users"></i> ${course.students ? course.students.length : 0} students</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = coursesHTML;
    }

    displayAssignments(assignments, container) {
        if (!assignments || assignments.length === 0) {
            container.innerHTML = this.getEmptyState('assignments');
            return;
        }

        const assignmentsHTML = assignments.map(assignment => `
            <div class="assignment-card" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #ffc107;">
                <h5 style="margin: 0 0 8px 0; color: #2c3e50;">${assignment.title}</h5>
                <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${assignment.course}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #dc3545; font-size: 12px;"><i class="fas fa-clock"></i> Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <button class="btn btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="window.location.href='assignments.html'">View</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = assignmentsHTML;
    }

    generateActivityFromCourses(courses) {
        const activities = [];
        
        courses.forEach(course => {
            // Add enrollment activity
            activities.push({
                type: 'course_enrolled',
                description: `Enrolled in ${course.title}`,
                timestamp: course.createdAt || new Date().toISOString()
            });
            
            // Add assignment activities if available
            if (course.assignments) {
                course.assignments.forEach(assignment => {
                    const submission = assignment.submissions?.find(sub => 
                        sub.student === localStorage.getItem('userId')
                    );
                    
                    if (submission) {
                        activities.push({
                            type: submission.status === 'graded' ? 'grade_received' : 'assignment_submitted',
                            description: submission.status === 'graded' 
                                ? `Received grade for ${assignment.title}: ${submission.grade || 'N/A'}`
                                : `Submitted ${assignment.title}`,
                            timestamp: submission.submittedAt || submission.gradedAt || new Date().toISOString()
                        });
                    }
                });
            }
        });

        // Sort by timestamp (newest first) and return
        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    displayAssignments(assignments, container) {
        if (!assignments || assignments.length === 0) {
            container.innerHTML = this.getEmptyState('assignments');
            return;
        }

        const assignmentsHTML = assignments.map(assignment => `
            <div class="assignment-card" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #ffc107;">
                <h5 style="margin: 0 0 8px 0; color: #2c3e50;">${assignment.title}</h5>
                <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${assignment.courseName}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #dc3545; font-size: 12px;"><i class="fas fa-clock"></i> Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <button class="btn btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="window.location.href='assignments.html'">View</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = assignmentsHTML;
    }

    displayActivity(activities, container) {
        if (!activities || activities.length === 0) {
            container.innerHTML = this.getEmptyState('activity');
            return;
        }

        const activitiesHTML = activities.map(activity => `
            <div class="activity-item" style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px;">
                <div class="activity-icon" style="width: 35px; height: 35px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center;">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content" style="flex: 1;">
                    <p style="margin: 0; font-size: 14px; color: #2c3e50;">${activity.description}</p>
                    <span style="font-size: 12px; color: #999;">${this.formatDate(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHTML;
    }

    getActivityIcon(type) {
        const icons = {
            'course_enrolled': 'fa-book-open',
            'assignment_submitted': 'fa-check-circle',
            'grade_received': 'fa-star',
            'presentation_viewed': 'fa-eye',
            'default': 'fa-info-circle'
        };
        return icons[type] || icons.default;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    getEmptyState(type) {
        const messages = {
            'courses': 'No courses enrolled yet. Browse available courses to get started!',
            'assignments': 'No upcoming assignments. Check back later!',
            'activity': 'No recent activity to display.'
        };

        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>${messages[type]}</p>
            </div>
        `;
    }

}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentDashboard = new StudentDashboard();
});
