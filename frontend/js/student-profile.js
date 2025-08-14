// Student Profile JavaScript
class StudentProfile {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.isEditing = false;
        this.profileData = {};
        this.academicData = {};
        this.achievements = [];
        this.init();
    }

    init() {
        // Check authentication
        if (!window.simpleAuth.requireAuth()) {
            return;
        }

        // Load profile data
        this.loadProfileData();
        
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
                window.simpleAuth.handleLogout(e);
            });
        }

        // Profile editing
        const editProfileBtn = document.getElementById('editProfileBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');

        if (editProfileBtn) editProfileBtn.addEventListener('click', () => this.toggleEditMode(true));
        if (saveProfileBtn) saveProfileBtn.addEventListener('click', () => this.saveProfile());
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => this.toggleEditMode(false));

        // Profile image upload
        const imageUpload = document.getElementById('imageUpload');
        const profileImage = document.getElementById('profileImage');
        
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        if (profileImage) {
            profileImage.addEventListener('click', () => {
                if (this.isEditing) {
                    imageUpload?.click();
                }
            });
        }

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Semester navigation
        document.querySelectorAll('.semester-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSemester(e.target.dataset.semester);
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

    async loadProfileData() {
        try {
            const response = await window.simpleAuth.apiRequest('/student/profile');
            
            if (response && response.ok) {
                const data = await response.json();
                this.profileData = data.profile || {};
                this.academicData = data.academic || {};
                this.achievements = data.achievements || [];
                this.displayProfileData();
            } else {
                // Use demo data if API is not available
                this.loadDemoData();
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.profileData = {
            fullName: 'John Doe',
            email: 'john.doe@academia.edu',
            phone: '+1 (555) 123-4567',
            dateOfBirth: '2000-01-15',
            address: '123 Student Lane, Campus City, CC 12345',
            emergencyContact: 'Jane Doe - +1 (555) 987-6543',
            studentId: 'STU2025001',
            program: 'Bachelor of Science in Computer Science',
            major: 'Computer Science',
            minor: 'Mathematics',
            enrollmentDate: '2023-09-01',
            expectedGraduation: '2027-05-15',
            advisor: 'Dr. Sarah Johnson',
            status: 'Full-time',
            profileImage: '../../assets/default-avatar.jpg'
        };

        this.academicData = {
            totalCredits: 45,
            currentGPA: 3.75,
            completedCourses: 8,
            degreeProgress: 37,
            semesters: {
                'fall2024': {
                    name: 'Fall 2024',
                    courses: [
                        { course: 'Computer Science I', credits: 3, grade: 'A', gpaPoints: 4.0 },
                        { course: 'Calculus I', credits: 4, grade: 'B+', gpaPoints: 3.3 },
                        { course: 'English Composition', credits: 3, grade: 'A-', gpaPoints: 3.7 }
                    ],
                    semesterGPA: 3.67,
                    creditsEarned: 10,
                    cumulativeGPA: 3.75
                },
                'spring2024': {
                    name: 'Spring 2024',
                    courses: [
                        { course: 'Data Structures', credits: 3, grade: 'A', gpaPoints: 4.0 },
                        { course: 'Statistics', credits: 3, grade: 'B', gpaPoints: 3.0 },
                        { course: 'Physics I', credits: 4, grade: 'B+', gpaPoints: 3.3 }
                    ],
                    semesterGPA: 3.43,
                    creditsEarned: 10,
                    cumulativeGPA: 3.70
                },
                'fall2023': {
                    name: 'Fall 2023',
                    courses: [
                        { course: 'Programming Fundamentals', credits: 3, grade: 'A', gpaPoints: 4.0 },
                        { course: 'College Algebra', credits: 3, grade: 'A-', gpaPoints: 3.7 },
                        { course: 'World History', credits: 3, grade: 'B+', gpaPoints: 3.3 }
                    ],
                    semesterGPA: 3.67,
                    creditsEarned: 9,
                    cumulativeGPA: 3.67
                }
            }
        };

        this.achievements = [
            {
                icon: '🏆',
                title: 'Dean\'s List',
                description: 'Fall 2024',
                date: '2024-12-15'
            },
            {
                icon: '⭐',
                title: 'Outstanding Student',
                description: 'Computer Science Department',
                date: '2024-05-20'
            },
            {
                icon: '🎖️',
                title: 'Academic Excellence Award',
                description: 'Spring 2024 Semester',
                date: '2024-05-15'
            },
            {
                icon: '📚',
                title: 'Perfect Attendance',
                description: 'Fall 2023 Semester',
                date: '2024-01-10'
            }
        ];

        this.displayProfileData();
    }

    displayProfileData() {
        // Display personal information
        this.updateElementText('studentName', this.profileData.fullName);
        this.updateElementText('studentId', `Student ID: ${this.profileData.studentId}`);
        this.updateElementText('studentProgram', this.profileData.major);
        this.updateElementText('enrollmentDate', `Enrolled: ${new Date(this.profileData.enrollmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`);

        // Display profile image
        const profileImage = document.getElementById('profileImage');
        if (profileImage) {
            profileImage.src = this.profileData.profileImage || '../../assets/default-avatar.jpg';
        }

        // Display personal info fields
        this.updateInfoField('fullName', this.profileData.fullName);
        this.updateInfoField('email', this.profileData.email);
        this.updateInfoField('phone', this.profileData.phone);
        this.updateInfoField('dob', new Date(this.profileData.dateOfBirth).toLocaleDateString());
        this.updateInfoField('address', this.profileData.address);
        this.updateInfoField('emergencyContact', this.profileData.emergencyContact);

        // Display academic info
        this.updateElementText('program', this.profileData.program);
        this.updateElementText('major', this.profileData.major);
        this.updateElementText('minor', this.profileData.minor);
        this.updateElementText('graduationDate', new Date(this.profileData.expectedGraduation).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }));
        this.updateElementText('advisor', this.profileData.advisor);
        this.updateElementText('studentStatus', this.profileData.status);

        // Display statistics
        this.updateElementText('totalCredits', this.academicData.totalCredits);
        this.updateElementText('currentGPA', this.academicData.currentGPA);
        this.updateElementText('completedCourses', this.academicData.completedCourses);

        // Display achievements
        this.displayAchievements();

        // Initialize progress chart
        this.initializeProgressChart();

        // Display current semester data
        this.displaySemesterData('fall2024');
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateInfoField(fieldName, value) {
        const displayElement = document.getElementById(fieldName);
        const editElement = document.getElementById(`${fieldName}Edit`);
        
        if (displayElement) {
            displayElement.textContent = value;
        }
        
        if (editElement) {
            if (editElement.tagName === 'INPUT' || editElement.tagName === 'TEXTAREA') {
                editElement.value = value;
            } else {
                editElement.textContent = value;
            }
        }
    }

    displayAchievements() {
        const achievementsGrid = document.querySelector('.achievements-grid');
        if (!achievementsGrid) return;

        const achievementsHTML = this.achievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-icon">${achievement.icon}</div>
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                <small>${new Date(achievement.date).toLocaleDateString()}</small>
            </div>
        `).join('');

        achievementsGrid.innerHTML = achievementsHTML;
    }

    initializeProgressChart() {
        const progressElement = document.querySelector('.circle-progress');
        if (progressElement) {
            const progress = this.academicData.degreeProgress;
            progressElement.setAttribute('data-progress', progress);
            progressElement.querySelector('span').textContent = `${progress}%`;
            
            // Add visual progress animation (simplified)
            progressElement.style.background = `conic-gradient(#667eea 0deg ${progress * 3.6}deg, #e9ecef ${progress * 3.6}deg 360deg)`;
        }
    }

    displaySemesterData(semesterKey) {
        const semester = this.academicData.semesters[semesterKey];
        if (!semester) return;

        // Update active semester button
        document.querySelectorAll('.semester-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.semester === semesterKey);
        });

        // Display semester grades
        const tbody = document.getElementById('semesterGrades');
        if (tbody) {
            const coursesHTML = semester.courses.map(course => `
                <tr>
                    <td>${course.course}</td>
                    <td>${course.credits}</td>
                    <td>${course.grade}</td>
                    <td>${course.gpaPoints.toFixed(1)}</td>
                </tr>
            `).join('');
            
            tbody.innerHTML = coursesHTML;
        }

        // Update semester summary
        const summary = document.querySelector('.semester-summary');
        if (summary) {
            summary.innerHTML = `
                <p><strong>Semester GPA:</strong> ${semester.semesterGPA}</p>
                <p><strong>Credits Earned:</strong> ${semester.creditsEarned}</p>
                <p><strong>Cumulative GPA:</strong> ${semester.cumulativeGPA}</p>
            `;
        }
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Show/hide tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName);
        });
    }

    switchSemester(semesterKey) {
        this.displaySemesterData(semesterKey);
    }

    toggleEditMode(editing) {
        this.isEditing = editing;
        
        // Toggle button visibility
        const editBtn = document.getElementById('editProfileBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        
        if (editBtn) editBtn.style.display = editing ? 'none' : 'inline-block';
        if (saveBtn) saveBtn.style.display = editing ? 'inline-block' : 'none';
        if (cancelBtn) cancelBtn.style.display = editing ? 'inline-block' : 'none';

        // Toggle edit fields
        document.querySelectorAll('.info-value').forEach(element => {
            element.style.display = editing ? 'none' : 'inline';
        });
        
        document.querySelectorAll('.info-edit').forEach(element => {
            element.style.display = editing ? 'inline' : 'none';
        });

        // Toggle image overlay
        const imageOverlay = document.getElementById('imageOverlay');
        if (imageOverlay) {
            imageOverlay.style.display = editing ? 'flex' : 'none';
        }
    }

    async saveProfile() {
        try {
            // Collect form data
            const updatedData = {
                fullName: document.getElementById('fullNameEdit').value,
                email: document.getElementById('emailEdit').value,
                phone: document.getElementById('phoneEdit').value,
                dateOfBirth: document.getElementById('dobEdit').value,
                address: document.getElementById('addressEdit').value,
                emergencyContact: document.getElementById('emergencyContactEdit').value
            };

            const response = await window.simpleAuth.apiRequest('/student/profile', {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            if (response && response.ok) {
                // Update local data
                Object.assign(this.profileData, updatedData);
                
                // Update display
                this.displayProfileData();
                
                // Exit edit mode
                this.toggleEditMode(false);
                
                this.showNotification('Profile updated successfully!', 'success');
            } else {
                this.showNotification('Failed to update profile. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error updating profile. Please try again.', 'error');
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file.', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('File size must be less than 5MB.', 'error');
            return;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await window.simpleAuth.apiRequest('/student/profile/image', {
                method: 'POST',
                body: formData,
                headers: {} // Don't set Content-Type for FormData
            });

            if (response && response.ok) {
                const result = await response.json();
                
                // Update profile image
                const profileImage = document.getElementById('profileImage');
                if (profileImage) {
                    profileImage.src = result.imageUrl;
                }
                
                this.profileData.profileImage = result.imageUrl;
                this.showNotification('Profile image updated successfully!', 'success');
            } else {
                this.showNotification('Failed to upload image. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification('Error uploading image. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentProfile = new StudentProfile();
});
