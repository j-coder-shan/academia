// Lecturer Courses JavaScript
class LecturerCourses {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        // Check authentication
        if (!window.auth.requireAuth()) {
            return;
        }

        // Load courses data
        this.loadCourses();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load user profile
        this.loadUserProfile();

        // Initialize grading schema with default values
        this.initializeGradingSchema();
    }

    initializeGradingSchema() {
        // Set default grading weights
        const defaults = {
            assignments_weight: 30,
            midterm_weight: 25,
            final_weight: 35,
            participation_weight: 10
        };

        Object.entries(defaults).forEach(([name, value]) => {
            const input = document.querySelector(`input[name="${name}"]`);
            if (input && !input.value) {
                input.value = value;
            }
        });

        // Update total weight display
        this.updateTotalWeight();
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

        // Course creation form
        const createCourseForm = document.getElementById('createCourseForm');
        if (createCourseForm) {
            createCourseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCourse();
            });
        }

        // Form action buttons
        const resetFormBtn = document.getElementById('resetForm');
        const saveDraftBtn = document.getElementById('saveDraft');
        
        if (resetFormBtn) {
            resetFormBtn.addEventListener('click', () => {
                this.resetCourseForm();
            });
        }
        
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveCourseAsDraft();
            });
        }

        // Grading schema validation
        this.setupGradingSchemaValidation();

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCourses(e.target.value);
            });
        }

        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchFilter(e.target.dataset.filter);
            });
        });

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        // Manage Course Modal only
        const manageModal = document.getElementById('manageCourseModal');
        if (manageModal) {
            const manageCloseBtn = manageModal.querySelector('.close');
            const closeCourseModalBtn = document.getElementById('closeCourseModalBtn');

            if (manageCloseBtn) {
                manageCloseBtn.addEventListener('click', () => {
                    manageModal.style.display = 'none';
                });
            }

            if (closeCourseModalBtn) {
                closeCourseModalBtn.addEventListener('click', () => {
                    manageModal.style.display = 'none';
                });
            }

            // Tab switching in manage modal
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });
        }

        window.addEventListener('click', (e) => {
            if (manageModal && e.target === manageModal) {
                manageModal.style.display = 'none';
            }
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

    async loadCourses() {
        try {
            // Load course statistics first
            await this.updateStatistics();
            
            // Show loading state
            const container = document.getElementById('coursesGrid');
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading courses...</p>
                </div>
            `;
            
            // Load courses from API
            const response = await window.auth.apiRequest('/lecturer/courses');
            
            if (response && response.ok) {
                const result = await response.json();
                const courses = result.courses || result; // Handle different response formats
                
                this.allCourses = courses; // Store for filtering
                this.displayCourses(courses, container);
                
                // Update the external filter system if it exists
                if (window.courseFilters) {
                    window.courseFilters.courses = courses.map(course => ({
                        id: course._id,
                        name: course.title,
                        code: course.code,
                        description: course.description,
                        category: course.category || 'other',
                        status: course.status || 'active',
                        students: course.students ? course.students.length : 0,
                        createdDate: new Date(course.createdAt || course.startDate)
                    }));
                    window.courseFilters.filteredCourses = [...window.courseFilters.courses];
                    window.courseFilters.renderCourses();
                }
                
            } else {
                container.innerHTML = this.getEmptyState();
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            const container = document.getElementById('coursesGrid');
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load courses</h3>
                    <p>There was an error loading your courses. Please try again.</p>
                    <button class="btn btn-primary" onclick="window.lecturerCourses.loadCourses()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    async updateStatistics() {
        try {
            const response = await window.auth.apiRequest('/lecturer/dashboard');
            
            if (response && response.ok) {
                const data = await response.json();
                const stats = data.statistics;
                
                if (stats) {
                    document.getElementById('totalCourses').textContent = stats.totalCourses || '0';
                    document.getElementById('activeCourses').textContent = stats.totalCourses || '0';
                    document.getElementById('totalStudents').textContent = stats.totalStudents || '0';
                    document.getElementById('totalAssignments').textContent = (stats.pendingEvaluations + stats.completedEvaluations) || '0';
                }
            } else {
                // Set default values if API fails
                document.getElementById('totalCourses').textContent = '0';
                document.getElementById('activeCourses').textContent = '0';
                document.getElementById('totalStudents').textContent = '0';
                document.getElementById('totalAssignments').textContent = '0';
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
            // Set default values if error occurs
            document.getElementById('totalCourses').textContent = '0';
            document.getElementById('activeCourses').textContent = '0';
            document.getElementById('totalStudents').textContent = '0';
            document.getElementById('totalAssignments').textContent = '0';
        }
    }

    switchFilter(filter) {
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Filter courses based on selected filter
        this.filterCourses('', filter);
    }

    filterCourses(searchTerm, filter = 'all') {
        // Implementation for filtering courses would go here
        console.log('Filtering courses:', searchTerm, filter);
    }

    resetCourseForm() {
        const form = document.getElementById('createCourseForm');
        form.reset();
        
        // Reset grading schema
        this.updateTotalWeight();
        
        // Show success message
        this.showNotification('Form has been reset', 'info');
    }

    async saveCourseAsDraft() {
        try {
            const formData = this.getFormData();
            
            // Basic validation for draft (less strict)
            if (!formData.code || !formData.title) {
                this.showNotification('Course code and name are required for draft', 'error');
                return;
            }
            
            formData.status = 'draft';
            
            // Show loading state
            const draftBtn = document.getElementById('saveDraft');
            const originalText = draftBtn.innerHTML;
            draftBtn.disabled = true;
            draftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const response = await window.auth.apiRequest('/lecturer/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response && response.ok) {
                await this.loadCourses();
                await this.updateStatistics();
                this.showNotification('Course saved as draft successfully!', 'success');
                this.hideCourseCreationForm();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save draft');
            }
            
        } catch (error) {
            console.error('Error saving draft:', error);
            this.showNotification(`Error saving draft: ${error.message}`, 'error');
        } finally {
            // Reset button state
            const draftBtn = document.getElementById('saveDraft');
            draftBtn.disabled = false;
            draftBtn.innerHTML = '<i class="fas fa-save"></i> Save as Draft';
        }
    }

    getFormData() {
        // Get schedule data
        const scheduleData = this.getScheduleData();
        
        // Get form values
        const title = document.getElementById('courseName').value.trim();
        const description = document.getElementById('courseDescription').value.trim();
        const rawCode = document.getElementById('courseCode').value.trim();
        const category = document.getElementById('category').value;
        const level = document.getElementById('difficulty').value;
        const credits = document.getElementById('credits').value;
        const maxStudents = document.getElementById('maxStudents').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Process course code: convert to lowercase and remove spaces
        const code = rawCode.toLowerCase().replace(/\s+/g, '');
        
        console.log('Form data collected:', {
            title, description, rawCode, code, category, level, credits, maxStudents, startDate, endDate
        });
        
        console.log('Schedule data:', scheduleData);
        
        // Debug each field individually
        console.log('Field validation check:');
        console.log('- title:', `"${title}"`, 'valid:', !!title);
        console.log('- description:', `"${description}"`, 'valid:', !!description);
        console.log('- rawCode:', `"${rawCode}"`, 'valid:', !!rawCode);
        console.log('- code:', `"${code}"`, 'valid:', !!code);
        console.log('- category:', `"${category}"`, 'valid:', !!category);
        console.log('- level:', `"${level}"`, 'valid:', !!level);
        console.log('- credits:', `"${credits}"`, 'valid:', !!credits);
        console.log('- startDate:', `"${startDate}"`, 'valid:', !!startDate);
        console.log('- endDate:', `"${endDate}"`, 'valid:', !!endDate);
        
        // Validate required fields before creating data object
        if (!title || !description || !rawCode || !category || !level || !credits || !startDate || !endDate) {
            console.error('Missing required fields:', {
                title: !title,
                description: !description,
                rawCode: !rawCode,
                category: !category,
                level: !level,
                credits: !credits,
                startDate: !startDate,
                endDate: !endDate
            });
            return null;
        }
        
        // Prepare data for backend - using raw string values
        const courseData = {
            // Required fields for backend - as strings
            title: title,
            description: description,
            code: code, // processed code (lowercase, no spaces)
            category: category,
            level: level,
            credits: credits, // as string, let backend convert
            startDate: startDate, // as string YYYY-MM-DD
            endDate: endDate, // as string YYYY-MM-DD
            
            // Optional fields with defaults
            maxStudents: maxStudents || "50",
            
            // Convert schedule format to match backend
            schedule: Object.keys(scheduleData).map(day => ({
                day: day.charAt(0).toUpperCase() + day.slice(1), // Capitalize day names
                startTime: scheduleData[day].startTime,
                endTime: scheduleData[day].endTime,
                type: 'lecture' // Default type
            })),
            
            // Grading schema matching backend expectations
            grading: {
                assignments: parseInt(document.querySelector('input[name="assignments_weight"]').value || 30),
                presentations: 0, // Not in form but backend expects it
                midterm: parseInt(document.querySelector('input[name="midterm_weight"]').value || 25),
                final: parseInt(document.querySelector('input[name="final_weight"]').value || 35)
            }
        };
        
        // Add frontend-specific data for validation and display
        courseData.frontendData = {
            semester: document.getElementById('semester').value,
            academicYear: document.getElementById('academicYear').value,
            gradingSchema: {
                weights: {
                    assignments: parseInt(document.querySelector('input[name="assignments_weight"]').value || 30),
                    midterm: parseInt(document.querySelector('input[name="midterm_weight"]').value || 25),
                    final: parseInt(document.querySelector('input[name="final_weight"]').value || 35),
                    participation: parseInt(document.querySelector('input[name="participation_weight"]').value || 10)
                },
                gradeScale: {
                    A: parseFloat(document.querySelector('input[name="grade_a"]').value || 90),
                    B: parseFloat(document.querySelector('input[name="grade_b"]').value || 80),
                    C: parseFloat(document.querySelector('input[name="grade_c"]').value || 70),
                    D: parseFloat(document.querySelector('input[name="grade_d"]').value || 60)
                }
            }
        };
        
        return courseData;
    }

    getScheduleData() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const schedule = {};
        
        // Function to convert 12-hour time format to 24-hour format
        const convertTo24Hour = (time12h) => {
            if (!time12h || time12h.trim() === '') return '';
            
            try {
                // Handle formats like "10:10 AM" or "10:10"
                const time = time12h.trim();
                
                // If it doesn't contain AM/PM, assume it's already in 24-hour format
                if (!time.includes('AM') && !time.includes('PM')) {
                    return time;
                }
                
                const [timePart, period] = time.split(' ');
                let [hours, minutes] = timePart.split(':').map(Number);
                
                if (period === 'PM' && hours !== 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }
                
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            } catch (error) {
                console.error('Error converting time:', time12h, error);
                return '';
            }
        };
        
        days.forEach(day => {
            const checkbox = document.querySelector(`input[name="days"][value="${day}"]`);
            if (checkbox && checkbox.checked) {
                const startTime = document.querySelector(`input[name="${day}_start"]`);
                const endTime = document.querySelector(`input[name="${day}_end"]`);
                
                if (startTime && endTime && startTime.value && endTime.value) {
                    const convertedStartTime = convertTo24Hour(startTime.value);
                    const convertedEndTime = convertTo24Hour(endTime.value);
                    
                    if (convertedStartTime && convertedEndTime) {
                        schedule[day] = {
                            startTime: convertedStartTime,
                            endTime: convertedEndTime,
                            enabled: true
                        };
                    }
                }
            }
        });
        
        return schedule;
    }

    setupGradingSchemaValidation() {
        const weightInputs = document.querySelectorAll('.weight-input');
        weightInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateTotalWeight();
            });
        });
    }

    updateTotalWeight() {
        const assignmentsWeight = parseInt(document.querySelector('input[name="assignments_weight"]').value) || 0;
        const midtermWeight = parseInt(document.querySelector('input[name="midterm_weight"]').value) || 0;
        const finalWeight = parseInt(document.querySelector('input[name="final_weight"]').value) || 0;
        const participationWeight = parseInt(document.querySelector('input[name="participation_weight"]').value) || 0;
        
        const total = assignmentsWeight + midtermWeight + finalWeight + participationWeight;
        
        const totalSpan = document.getElementById('totalWeight');
        const indicator = document.getElementById('weightIndicator');
        
        if (totalSpan) {
            totalSpan.textContent = total;
        }
        
        if (indicator) {
            // Reset classes
            indicator.classList.remove('warning', 'error');
            
            if (total === 100) {
                // Perfect - green indicator
            } else if (total > 90 && total < 110) {
                indicator.classList.add('warning');
            } else {
                indicator.classList.add('error');
            }
        }
        
        return total;
    }

    async createCourse() {
        try {
            console.log('=== Starting Course Creation Process ===');
            
            // Get form data
            const formData = this.getFormData();
            
            // Check if form data is valid
            if (!formData) {
                console.log('Form data is invalid or incomplete');
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Debug: Log form data to console
            console.log('Form data collected:', JSON.stringify(formData, null, 2));
            
            // Validate required fields
            if (!this.validateCourseForm(formData)) {
                console.log('Form validation failed');
                return;
            }
            
            console.log('Form validation passed');
            
            // Validate grading schema
            const totalWeight = this.updateTotalWeight();
            if (totalWeight !== 100) {
                this.showNotification('Grading schema weights must total exactly 100%', 'error');
                return;
            }
            
            console.log('Grading schema validation passed');
            
            // Set status as active for creation
            formData.status = 'active';
            
            // Show loading state
            const createBtn = document.getElementById('createCourse');
            const originalText = createBtn.innerHTML;
            createBtn.disabled = true;
            createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            
            console.log('Making API request to create course...');
            console.log('Request URL:', `${window.auth.apiUrl}/lecturer/courses`);
            console.log('Request payload:', JSON.stringify(formData, null, 2));
            
            // Make API call to create the course
            const response = await window.auth.apiRequest('/lecturer/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('API Response status:', response?.status);
            
            if (response && response.ok) {
                const newCourse = await response.json();
                console.log('Course created successfully:', newCourse);
                
                // Reset form and hide creation section
                this.resetCourseForm();
                hideCourseCreationForm();
                
                // Reload courses and update statistics
                await this.loadCourses();
                await this.updateStatistics();
                
                // Show success notification
                this.showNotification('Course created successfully!', 'success');
                
                // Send notification to enrolled students (if any)
                await this.notifyStudentsOfNewCourse(newCourse);
                
                // Scroll to courses grid to show the new course
                setTimeout(() => {
                    document.getElementById('coursesGrid').scrollIntoView({ behavior: 'smooth' });
                }, 500);
                
            } else {
                console.log('API request failed with status:', response?.status);
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.message || 'Failed to create course');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            console.error('Error stack:', error.stack);
            this.showNotification(`Error creating course: ${error.message}`, 'error');
        } finally {
            // Reset button state
            const createBtn = document.getElementById('createCourse');
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.innerHTML = '<i class="fas fa-plus"></i> Create Course';
            }
        }
    }

    validateCourseForm(formData) {
        console.log('Validating form data:', formData);
        
        const requiredFields = [
            { field: 'code', name: 'Course Code', id: 'courseCode' },
            { field: 'title', name: 'Course Name', id: 'courseName' },
            { field: 'description', name: 'Course Description', id: 'courseDescription' },
            { field: 'credits', name: 'Credits', id: 'credits' },
            { field: 'startDate', name: 'Start Date', id: 'startDate' },
            { field: 'endDate', name: 'End Date', id: 'endDate' },
            { field: 'category', name: 'Category', id: 'category' },
            { field: 'level', name: 'Difficulty Level', id: 'difficulty' }
        ];

        // Check required fields
        for (const { field, name, id } of requiredFields) {
            const value = formData[field];
            console.log(`Checking field ${field} (${name}):`, value);
            
            if (!value || value.toString().trim() === '' || value === 0) {
                console.log(`Field ${field} failed validation:`, value);
                this.showNotification(`Please fill in the ${name} field`, 'error');
                const element = document.getElementById(id);
                if (element) element.focus();
                return false;
            }
        }

        // Validate date range
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // Allow start date to be today or in the future
        if (startDate < today) {
            this.showNotification('Start date cannot be in the past', 'error');
            document.getElementById('startDate').focus();
            return false;
        }
        
        if (endDate <= startDate) {
            this.showNotification('End date must be after start date', 'error');
            document.getElementById('endDate').focus();
            return false;
        }

        // Validate numeric fields
        if (parseInt(formData.credits) < 1 || parseInt(formData.credits) > 10) {
            this.showNotification('Credits must be between 1 and 10', 'error');
            document.getElementById('credits').focus();
            return false;
        }

        if (parseInt(formData.maxStudents) < 1 || parseInt(formData.maxStudents) > 200) {
            this.showNotification('Max students must be between 1 and 200', 'error');
            document.getElementById('maxStudents').focus();
            return false;
        }

        // Validate at least one schedule day is selected
        if (!formData.schedule || formData.schedule.length === 0) {
            this.showNotification('Please select at least one class day and time', 'error');
            return false;
        }

        // Validate grading scale percentages if frontend data exists
        if (formData.frontendData && formData.frontendData.gradingSchema) {
            const gradeScale = formData.frontendData.gradingSchema.gradeScale;
            if (gradeScale.A < gradeScale.B || gradeScale.B < gradeScale.C || gradeScale.C < gradeScale.D) {
                this.showNotification('Grade scale must be in descending order (A > B > C > D)', 'error');
                return false;
            }
        }

        return true;
    }

    async notifyStudentsOfNewCourse(course) {
        try {
            // Send notification to all students about new course availability
            const notificationData = {
                type: 'course_created',
                title: 'New Course Available',
                message: `A new course "${course.title}" (${course.code}) is now available for enrollment.`,
                courseId: course._id,
                priority: 'medium'
            };

            await window.auth.apiRequest('/lecturer/notifications/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });

        } catch (error) {
            console.error('Error sending course creation notification:', error);
            // Don't throw error - course creation was successful, notification is secondary
        }
    }

    showNotification(message, type = 'info') {
        // Use the centralized notification system if available, otherwise use local
        if (window.AcademiaUtils && window.AcademiaUtils.notifications) {
            return window.AcademiaUtils.notifications.show(message, type);
        }
        
        // Local notification system as fallback
        // Ensure notification container exists
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Format message for better readability
        const formattedMessage = this.formatNotificationMessage(message, type);
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${formattedMessage}</span>
            <button class="notification-close" title="Dismiss">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Add styles if not already present
        if (!document.querySelector('.notification-styles')) {
            const style = document.createElement('style');
            style.className = 'notification-styles';
            style.textContent = `
                #notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: none;
                    max-width: 450px;
                }
                .notification {
                    padding: 18px 22px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 500;
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    min-width: 320px;
                    max-width: 100%;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                    animation: slideIn 0.4s ease-out;
                    pointer-events: auto;
                    word-wrap: break-word;
                    line-height: 1.5;
                    font-family: 'Poppins', sans-serif;
                    backdrop-filter: blur(8px);
                }
                .notification-success { 
                    background: linear-gradient(135deg, #28a745, #20c997);
                    border-left: 4px solid #1e7e34;
                }
                .notification-error { 
                    background: linear-gradient(135deg, #dc3545, #e74c3c);
                    border-left: 4px solid #bd2130;
                }
                .notification-info { 
                    background: linear-gradient(135deg, #17a2b8, #3498db);
                    border-left: 4px solid #117a8b;
                }
                .notification-warning { 
                    background: linear-gradient(135deg, #ffc107, #f39c12);
                    color: #212529;
                    border-left: 4px solid #e0a800;
                }
                .notification span {
                    flex: 1;
                    font-size: 14px;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .notification i:first-child {
                    font-size: 18px;
                    margin-top: 2px;
                    flex-shrink: 0;
                }
                .notification-close {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    margin-left: 8px;
                    padding: 8px;
                    border-radius: 6px;
                    opacity: 0.9;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: -2px;
                }
                .notification-close:hover {
                    opacity: 1;
                    background: rgba(255,255,255,0.2);
                    transform: scale(1.1);
                }
                @keyframes slideIn {
                    from { 
                        transform: translateX(100%); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                }
                @keyframes slideOut {
                    from { 
                        transform: translateX(0); 
                        opacity: 1; 
                        max-height: 100px; 
                        margin-bottom: 10px; 
                    }
                    to { 
                        transform: translateX(100%); 
                        opacity: 0; 
                        max-height: 0; 
                        margin-bottom: 0; 
                    }
                }
                .notification.removing {
                    animation: slideOut 0.3s ease-out forwards;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add notification to container
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    }

    removeNotification(notification) {
        if (!notification || !notification.parentElement) return;
        
        // Add removing animation
        notification.classList.add('removing');
        
        // Remove after animation completes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }

    showManageCourseModal(courseId, courseTitle) {
        const modal = document.getElementById('manageCourseModal');
        const titleElement = document.getElementById('manageCourseTitle');
        
        titleElement.textContent = `Manage: ${courseTitle}`;
        modal.style.display = 'block';
        
        // Store course ID for management actions
        this.currentCourseId = courseId;
        
        // Load course data into tabs
        this.loadCourseOverview(courseId);
    }

    async loadCourseOverview(courseId) {
        try {
            // Mock course data loading
            document.getElementById('courseStudentCount').textContent = '45';
            document.getElementById('courseAssignmentCount').textContent = '8';
            document.getElementById('coursePresentationCount').textContent = '3';
        } catch (error) {
            console.error('Error loading course overview:', error);
        }
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Show corresponding tab panel
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    displayCourses(courses, container) {
        if (!courses || courses.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const coursesHTML = courses.map(course => this.renderCourseCard(course)).join('');
        container.innerHTML = coursesHTML;
    }

    renderCourseCard(course) {
        const enrolledCount = course.students ? course.students.length : 0;
        const assignmentCount = course.assignments ? course.assignments.length : 0;
        const maxStudents = course.maxStudents || 50;
        const statusClass = course.status === 'draft' ? 'draft' : 'active';
        const statusText = course.status === 'draft' ? 'Draft' : 'Active';
        
        return `
            <div class="course-card ${statusClass}">
                <div class="course-header">
                    <h4>${course.title}</h4>
                    <span class="course-status ${statusClass}">${statusText}</span>
                </div>
                <div class="course-info">
                    <p><i class="fas fa-code"></i> ${course.code || 'N/A'}</p>
                    <p><i class="fas fa-users"></i> ${enrolledCount}/${maxStudents} Students</p>
                    <p><i class="fas fa-tasks"></i> ${assignmentCount} Assignments</p>
                    <p><i class="fas fa-calendar"></i> ${new Date(course.createdAt || course.startDate).toLocaleDateString()}</p>
                    <p><i class="fas fa-star"></i> ${course.credits || 3} Credits</p>
                </div>
                <div class="course-description">
                    <p>${course.description}</p>
                </div>
                <div class="course-actions">
                    <button class="btn btn-primary" onclick="window.lecturerCourses.showManageCourseModal('${course._id}', '${course.title}')">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                    <button class="btn btn-secondary" onclick="window.lecturerCourses.viewCourseDetails('${course._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-info" onclick="window.lecturerCourses.viewAnalytics('${course._id}')">
                        <i class="fas fa-chart-bar"></i> Analytics
                    </button>
                </div>
            </div>
        `;
    }

    viewCourseDetails(courseId) {
        // Navigate to course details page
        window.location.href = `course-details.html?id=${courseId}`;
    }

    viewAnalytics(courseId) {
        // Navigate to analytics view for this course
        window.location.href = `course-analytics.html?id=${courseId}`;
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-chalkboard-teacher"></i>
                <h3>No courses found</h3>
                <p>Create your first course to start teaching and managing students.</p>
                <button class="btn btn-primary" onclick="showCourseCreationForm()">
                    <i class="fas fa-plus"></i> Create Course
                </button>
            </div>
        `;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    formatNotificationMessage(message, type) {
        // For error messages, try to make them more readable
        if (type === 'error') {
            // Break up long validation messages
            if (message.includes('is required')) {
                // Handle multiple field validation errors
                const parts = message.split(',');
                if (parts.length > 1) {
                    const fields = parts.map(part => part.trim().replace(' is required', ''));
                    return `Please fill in the following required fields:\n• ${fields.join('\n• ')}`;
                }
            }
            
            // Handle enum validation errors
            if (message.includes('is not a valid enum value')) {
                const match = message.match(/`([^`]+)` is not a valid enum value for path `([^`]+)`/);
                if (match) {
                    const [, value, field] = match;
                    return `Invalid ${field.replace('_', ' ')}: "${value}"\nPlease select a valid option.`;
                }
            }
            
            // Handle path validation errors
            if (message.includes('Path') && message.includes('is required')) {
                const pathMatches = message.match(/Path `([^`]+)` is required/g);
                if (pathMatches && pathMatches.length > 1) {
                    const fields = pathMatches.map(match => {
                        const field = match.match(/Path `([^`]+)`/)[1];
                        return field.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
                    });
                    return `Please fill in the following required fields:\n• ${fields.join('\n• ')}`;
                }
            }
        }
        
        // For other message types or if no special formatting needed, return as is
        return message;
    }

    // ...existing code...
}
