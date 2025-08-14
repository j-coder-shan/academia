// Lecturer Profile JavaScript
class LecturerProfile {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        if (!window.auth || !window.simpleAuth.requireAuth()) {
            return;
        }

        // Load lecturer profile data
        this.loadProfile();
        
        // Set up event listeners
        this.setupEventListeners();
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

        // Edit profile button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }

        // Save profile button
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }

        // Cancel edit button
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.toggleEditMode(false);
            });
        }

        // Change password button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showChangePasswordModal();
            });
        }

        // Modal close events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById('changePasswordModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelPasswordBtn');
        const updateBtn = document.getElementById('updatePasswordBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideChangePasswordModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideChangePasswordModal();
            });
        }

        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                this.updatePassword();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideChangePasswordModal();
            }
        });
    }

    loadProfile() {
        try {
            // Load user name in sidebar
            const userName = localStorage.getItem('userName') || 'Dr. Smith';
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }

            // Load profile data (mock data for now)
            this.loadMockData();
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    loadMockData() {
        // Profile header info
        document.getElementById('profileName').textContent = 'Dr. Sarah Johnson';
        document.getElementById('profileEmployeeId').textContent = 'EMP-2023-001';

        // Statistics
        document.getElementById('teachingCourses').textContent = '5';
        document.getElementById('totalStudents').textContent = '150';
        document.getElementById('yearsExperience').textContent = '8';

        // Personal information
        document.getElementById('fullName').value = 'Dr. Sarah Johnson';
        document.getElementById('email').value = 'sarah.johnson@academia.edu';
        document.getElementById('employeeId').value = 'EMP-2023-001';
        document.getElementById('phone').value = '+1 (555) 234-5678';
        document.getElementById('department').value = 'Computer Science';
        document.getElementById('office').value = 'CS Building, Room 301';

        // Professional information
        document.getElementById('title').value = 'Associate Professor';
        document.getElementById('specialization').value = 'Machine Learning & AI';
        document.getElementById('education').value = 'Ph.D. Computer Science, MIT';
        document.getElementById('joinDate').value = '2020-08-15';
        document.getElementById('officeHours').value = 'Mon-Wed 2:00-4:00 PM';
        document.getElementById('researchInterests').value = 'Machine Learning, Neural Networks, Computer Vision';

        // Bio
        document.getElementById('bio').value = 'Dr. Sarah Johnson is an Associate Professor in the Computer Science department with expertise in Machine Learning and Artificial Intelligence. She has published numerous papers in top-tier conferences and is passionate about teaching the next generation of computer scientists.';

        // Contact information
        document.getElementById('emergencyContact').value = 'John Johnson - +1 (555) 987-6543';
        document.getElementById('alternativeEmail').value = 'sarah.j.research@gmail.com';
        document.getElementById('linkedin').value = 'https://linkedin.com/in/sarah-johnson-cs';
        document.getElementById('website').value = 'https://www.academia.edu/sarah-johnson';
    }

    toggleEditMode(enable = null) {
        const isEditing = enable !== null ? enable : document.getElementById('fullName').readOnly;
        const inputs = document.querySelectorAll('#fullName, #email, #phone, #department, #office, #title, #specialization, #education, #joinDate, #officeHours, #researchInterests, #bio, #emergencyContact, #alternativeEmail, #linkedin, #website');
        const profileActions = document.getElementById('profileActions');

        inputs.forEach(input => {
            input.readOnly = !isEditing;
            if (isEditing) {
                input.style.backgroundColor = '#f8f9fa';
                input.style.border = '2px solid #667eea';
            } else {
                input.style.backgroundColor = '';
                input.style.border = '';
            }
        });

        if (isEditing) {
            profileActions.style.display = 'block';
        } else {
            profileActions.style.display = 'none';
        }
    }

    async saveProfile() {
        try {
            // Here you would normally send data to the server
            const profileData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                department: document.getElementById('department').value,
                office: document.getElementById('office').value,
                title: document.getElementById('title').value,
                specialization: document.getElementById('specialization').value,
                education: document.getElementById('education').value,
                joinDate: document.getElementById('joinDate').value,
                officeHours: document.getElementById('officeHours').value,
                researchInterests: document.getElementById('researchInterests').value,
                bio: document.getElementById('bio').value,
                emergencyContact: document.getElementById('emergencyContact').value,
                alternativeEmail: document.getElementById('alternativeEmail').value,
                linkedin: document.getElementById('linkedin').value,
                website: document.getElementById('website').value
            };

            console.log('Saving profile:', profileData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Profile updated successfully!');
            this.toggleEditMode(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile. Please try again.');
        }
    }

    showChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form
        document.getElementById('changePasswordForm').reset();
    }

    async updatePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('Please fill in all password fields.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match.');
                return;
            }

            if (newPassword.length < 6) {
                alert('New password must be at least 6 characters long.');
                return;
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Password updated successfully!');
            this.hideChangePasswordModal();
        } catch (error) {
            console.error('Error updating password:', error);
            alert('Error updating password. Please try again.');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lecturerProfile = new LecturerProfile();
});
