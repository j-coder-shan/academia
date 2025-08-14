// Lecturer Dashboard JavaScript
class LecturerDashboard {
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
            const userName = localStorage.getItem('userName') || 'Lecturer';
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
            await this.loadMyCourses();
            
            // Load recent submissions
            await this.loadRecentSubmissions();
            
            // Load today's schedule
            await this.loadTodaySchedule();
            
            // Update statistics
            await this.updateStatistics();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadMyCourses() {
        try {
            const response = await window.auth.apiRequest('/lecturer/courses');
            const container = document.getElementById('myCourses');
            
            if (response && response.ok) {
                const courses = await response.json();
                this.displayCourses(courses.slice(0, 3), container);
            } else {
                container.innerHTML = this.getEmptyState('courses');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            const container = document.getElementById('myCourses');
            container.innerHTML = this.getEmptyState('courses');
        }
    }

    async loadRecentSubmissions() {
        try {
            const response = await window.auth.apiRequest('/lecturer/dashboard');
            const container = document.getElementById('recentSubmissions');
            
            if (response && response.ok) {
                const data = await response.json();
                const submissions = data.recentSubmissions || [];
                this.displaySubmissions(submissions.slice(0, 5), container);
            } else {
                container.innerHTML = this.getEmptyState('submissions');
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            const container = document.getElementById('recentSubmissions');
            container.innerHTML = this.getEmptyState('submissions');
        }
    }

    async loadTodaySchedule() {
        try {
            // Since we don't have a specific schedule endpoint, generate from courses
            const response = await window.auth.apiRequest('/lecturer/courses');
            const container = document.getElementById('todaySchedule');
            
            if (response && response.ok) {
                const courses = await response.json();
                const schedule = this.generateTodaySchedule(courses);
                this.displaySchedule(schedule, container);
            } else {
                container.innerHTML = this.getEmptyState('schedule');
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            const container = document.getElementById('todaySchedule');
            container.innerHTML = this.getEmptyState('schedule');
        }
    }

    async updateStatistics() {
        try {
            const response = await window.auth.apiRequest('/lecturer/dashboard');
            
            if (response && response.ok) {
                const data = await response.json();
                const stats = data.statistics;
                
                if (stats) {
                    document.getElementById('activeCourses').textContent = stats.totalCourses || '0';
                    document.getElementById('totalStudents').textContent = stats.totalStudents || '0';
                    document.getElementById('pendingGrading').textContent = stats.pendingEvaluations || '0';
                    document.getElementById('totalPresentations').textContent = stats.completedEvaluations || '0';
                }
            } else {
                // Set default values if API fails
                document.getElementById('activeCourses').textContent = '0';
                document.getElementById('totalStudents').textContent = '0';
                document.getElementById('pendingGrading').textContent = '0';
                document.getElementById('totalPresentations').textContent = '0';
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
            // Set default values if error occurs
            document.getElementById('activeCourses').textContent = '0';
            document.getElementById('totalStudents').textContent = '0';
            document.getElementById('pendingGrading').textContent = '0';
            document.getElementById('totalPresentations').textContent = '0';
        }
    }

    displayCourses(courses, container) {
        if (!courses || courses.length === 0) {
            container.innerHTML = this.getEmptyState('courses');
            return;
        }

        const coursesHTML = courses.map(course => `
            <div class="course-card" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #2c3e50;">${course.title}</h4>
                    <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${course.code || 'N/A'}</span>
                </div>
                <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">${course.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 15px;">
                        <span style="color: #28a745; font-size: 12px;"><i class="fas fa-users"></i> ${course.students ? course.students.length : 0} students</span>
                        <span style="color: #ffc107; font-size: 12px;"><i class="fas fa-tasks"></i> ${course.assignments ? course.assignments.length : 0} assignments</span>
                    </div>
                    <button class="btn btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="window.location.href='courses.html'">Manage</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = coursesHTML;
    }

    generateTodaySchedule(courses) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const schedule = [];

        courses.forEach(course => {
            if (course.schedule && course.schedule.length > 0) {
                course.schedule.forEach(scheduleItem => {
                    // Simple schedule generation - you can make this more sophisticated
                    schedule.push({
                        courseName: course.title,
                        type: scheduleItem.type || 'Lecture',
                        location: scheduleItem.location || 'Online',
                        startTime: scheduleItem.startTime || '10:00 AM',
                        endTime: scheduleItem.endTime || '11:30 AM'
                    });
                });
            } else {
                // Default schedule if none specified
                schedule.push({
                    courseName: course.title,
                    type: 'Lecture',
                    location: 'Online',
                    startTime: '10:00 AM',
                    endTime: '11:30 AM'
                });
            }
        });

        return schedule.slice(0, 3); // Return only first 3 items
    }

    displaySubmissions(submissions, container) {
        if (!submissions || submissions.length === 0) {
            container.innerHTML = this.getEmptyState('submissions');
            return;
        }

        const submissionsHTML = submissions.map(submission => `
            <div class="submission-card" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #17a2b8;">
                <div style="display: flex; justify-content: between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <h5 style="margin: 0 0 5px 0; color: #2c3e50;">${submission.assignmentTitle}</h5>
                        <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">by ${submission.studentName}</p>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">${submission.courseName}</p>
                        <span style="color: #17a2b8; font-size: 12px;"><i class="fas fa-clock"></i> ${this.formatDate(submission.submittedAt)}</span>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        ${submission.status === 'pending' ? 
                            '<button class="btn btn-warning btn-sm" style="padding: 4px 8px; font-size: 11px;">Grade</button>' :
                            `<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${submission.grade}</span>`
                        }
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = submissionsHTML;
    }

    displaySchedule(schedule, container) {
        if (!schedule || schedule.length === 0) {
            container.innerHTML = this.getEmptyState('schedule');
            return;
        }

        const scheduleHTML = schedule.map(item => `
            <div class="schedule-item" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #28a745;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h5 style="margin: 0 0 5px 0; color: #2c3e50;">${item.courseName}</h5>
                        <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">${item.type} - ${item.location}</p>
                        <span style="color: #28a745; font-size: 12px;"><i class="fas fa-clock"></i> ${item.startTime} - ${item.endTime}</span>
                    </div>
                    <button class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 11px;">Join</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = scheduleHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    getEmptyState(type) {
        const messages = {
            'courses': 'No courses assigned yet. Contact admin to get courses assigned.',
            'submissions': 'No recent submissions to review.',
            'schedule': 'No classes scheduled for today.'
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
    window.lecturerDashboard = new LecturerDashboard();
});
