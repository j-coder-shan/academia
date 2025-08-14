// Lecturer Presentations JavaScript
class LecturerPresentations {
    constructor() {
        this.presentations = [];
        this.filteredPresentations = [];
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.students = []; // Store students list for group assignments
        this.courses = []; // Store lecturer's courses
        this.customCriteriaCount = 0;
        this.apiBaseUrl = 'http://localhost:5000'; // API base URL
        this.init();
    }

    init() {
        console.log('LecturerPresentations class initializing...'); // Debug log
        
        // Check authentication
        if (!localStorage.getItem('token')) {
        console.log('No authentication token found');
        window.location.href = '../../login.html';
        return;
} else {
    console.log('Authentication token found');
}
        
        // Load user profile
        this.loadUserProfile();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadCourses();
        this.loadStudents();
        this.loadPresentations();
        this.loadPresentationStats();
        
        // Initialize form validation
        this.initFormValidation();
        
        console.log('LecturerPresentations initialization complete'); // Debug log
    }

    setupEventListeners() {
        console.log('Setting up event listeners...'); // Debug log
        
        // Notification mode radio buttons
        const notificationRadios = document.querySelectorAll('input[name="notificationMode"]');
        console.log('Notification radios found:', notificationRadios.length); // Debug log
        notificationRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleNotificationModeChange(e.target.value);
                this.updateNotificationSummary();
            });
        });

        // Course selection change to load students
        const courseSelect = document.getElementById('presentationCourse');
        console.log('Course select found:', courseSelect); // Debug log
        if (courseSelect) {
            courseSelect.addEventListener('change', (e) => {
                console.log('Course changed to:', e.target.value); // Debug log
                if (e.target.value) {
                    this.loadCourseStudents(e.target.value);
                }
                this.updateNotificationSummary();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }

        // Filter functionality
        const statusFilter = document.getElementById('statusFilter');
        const courseFilter = document.getElementById('courseFilter');
        const sortBy = document.getElementById('sortBy');

        if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());
        if (courseFilter) courseFilter.addEventListener('change', () => this.applyFilters());
        if (sortBy) sortBy.addEventListener('change', () => this.applyFilters());

        // View toggle
        const viewToggle = document.getElementById('viewToggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', () => this.toggleView());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Create presentation form toggle
        const toggleCreateForm = document.getElementById('toggleCreateForm');
        console.log('Toggle form button found:', toggleCreateForm); // Debug log
        if (toggleCreateForm) {
            toggleCreateForm.addEventListener('click', () => {
                console.log('Toggle button clicked'); // Debug log
                this.toggleCreateForm();
            });
            console.log('Event listener added to toggle button'); // Debug log
        } else {
            console.error('Toggle create form button not found');
        }

        // Refresh courses button
        const refreshCoursesBtn = document.getElementById('refreshCoursesBtn');
        if (refreshCoursesBtn) {
            refreshCoursesBtn.addEventListener('click', () => {
                console.log('Refresh courses button clicked');
                this.loadCourses();
            });
            console.log('Event listener added to refresh courses button');
        }

        // Form submission
        const newPresentationForm = document.getElementById('newPresentationForm');
        if (newPresentationForm) {
            newPresentationForm.addEventListener('submit', (e) => this.handleCreatePresentation(e));
        }

        // Form buttons
        const cancelCreateBtn = document.getElementById('cancelCreateBtn');
        const saveDraftBtn = document.getElementById('saveDraftBtn');

        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => this.toggleCreateForm());
        }

        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // Select/Deselect all students buttons
        const selectAllBtn = document.getElementById('selectAllStudents');
        const deselectAllBtn = document.getElementById('deselectAllStudents');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;
                });
                this.updateNotificationSummary();
            });
        }
        
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('input[name="selectedStudents"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.updateNotificationSummary();
            });
        }

        // Presentation type change handler
        const presentationType = document.getElementById('presentationType');
        if (presentationType) {
            presentationType.addEventListener('change', () => this.handlePresentationTypeChange());
        }

        // Group formation change handler
        const groupFormation = document.getElementById('groupFormation');
        if (groupFormation) {
            groupFormation.addEventListener('change', () => this.handleGroupFormationChange());
        }

        // Add group button
        const addGroupBtn = document.getElementById('addGroupBtn');
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => this.addGroup());
        }

        // Add custom criteria button
        const addCriteriaBtn = document.getElementById('addCriteriaBtn');
        if (addCriteriaBtn) {
            addCriteriaBtn.addEventListener('click', () => this.addCustomCriteria());
        }

        // Criteria validation
        this.setupCriteriaValidation();
    }

    setupCriteriaValidation() {
        // Listen for changes on all criteria inputs
        this.updateCriteriaListeners();
    }

    updateCriteriaListeners() {
        const criteriaInputs = document.querySelectorAll('.criteria-input');
        criteriaInputs.forEach(input => {
            input.removeEventListener('input', this.validateCriteriaTotal.bind(this));
            input.addEventListener('input', this.validateCriteriaTotal.bind(this));
        });
    }

    validateCriteriaTotal() {
        const criteriaInputs = document.querySelectorAll('.criteria-input');
        let total = 0;
        
        criteriaInputs.forEach(input => {
            if (input.value) {
                total += parseInt(input.value) || 0;
            }
        });

        const totalElement = document.getElementById('criteriaTotal');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.parentElement.style.color = total === 100 ? '#10ac84' : total > 100 ? '#ee5253' : '#ffa502';
        }
    }

    initFormValidation() {
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const assignedDateInput = document.getElementById('assignedDate');
        const dueDateInput = document.getElementById('dueDate');

        if (assignedDateInput) {
            assignedDateInput.value = today;
            assignedDateInput.min = today;
        }

        if (dueDateInput) {
            dueDateInput.min = today;
        }

        // Date validation
        if (assignedDateInput && dueDateInput) {
            assignedDateInput.addEventListener('change', () => {
                dueDateInput.min = assignedDateInput.value;
                if (dueDateInput.value && dueDateInput.value < assignedDateInput.value) {
                    dueDateInput.value = assignedDateInput.value;
                }
            });
        }
    }

    


populateCourseDropdowns(courses) {
    const courseSelects = [
        'presentationCourse',
        'quickPresentationCourse',
        'courseFilter'
    ];

    courseSelects.forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;

        // Clear existing options
        selectElement.innerHTML = '';

        if (courses.length === 0) {
            selectElement.innerHTML = '<option value="">No courses available - Create a course first</option>';
            selectElement.disabled = true;
        } else {
            // Add default option
            const defaultText = selectId === 'courseFilter' ? 'All Courses' : 'Select a course';
            selectElement.innerHTML = `<option value="">${defaultText}</option>`;
            
            // Add course options
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course._id || course.id;
                option.textContent = `${course.code || 'N/A'} - ${course.title || course.name || 'Unnamed Course'}`;
                selectElement.appendChild(option);
            });
            
            selectElement.disabled = false;
        }
    });

    console.log(`✅ Populated ${courseSelects.length} course dropdowns with ${courses.length} courses`);
}

showCourseLoadingError() {
    const courseSelects = ['presentationCourse', 'quickPresentationCourse'];
    courseSelects.forEach(selectId => {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Error loading courses - Check connection</option>';
            selectElement.disabled = true;
        }
    });
}

    async loadStudents() {
        try {
            // Mock data for demonstration
            this.students = [
                { id: 1, name: 'John Smith', email: 'john.smith@student.edu' },
                { id: 2, name: 'Emma Johnson', email: 'emma.johnson@student.edu' },
                { id: 3, name: 'Michael Brown', email: 'michael.brown@student.edu' },
                { id: 4, name: 'Sarah Davis', email: 'sarah.davis@student.edu' },
                { id: 5, name: 'David Wilson', email: 'david.wilson@student.edu' },
                { id: 6, name: 'Lisa Anderson', email: 'lisa.anderson@student.edu' },
                { id: 7, name: 'James Taylor', email: 'james.taylor@student.edu' },
                { id: 8, name: 'Jennifer Martinez', email: 'jennifer.martinez@student.edu' },
                { id: 9, name: 'Robert Garcia', email: 'robert.garcia@student.edu' },
                { id: 10, name: 'Maria Rodriguez', email: 'maria.rodriguez@student.edu' }
            ];
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }



    loadMockPresentations() {
        // Fallback mock data for development
        this.presentations = [
            {
                id: 1,
                title: 'Database Design Principles',
                course: '3',
                type: 'individual',
                status: 'pending',
                dueDate: '2024-02-15',
                assignedDate: '2024-01-15',
                presentationDate: '2024-02-20',
                duration: 20,
                description: 'Present the fundamental principles of database design including normalization, ER diagrams, and SQL optimization.',
                maxScore: 100,
                submissions: 12,
                totalStudents: 15,
                averageScore: 85,
                criteria: [
                    { name: 'Content Quality', weight: 30 },
                    { name: 'Delivery & Presentation', weight: 25 },
                    { name: 'Visual Aids', weight: 20 },
                    { name: 'Time Management', weight: 15 },
                    { name: 'Q&A Handling', weight: 10 }
                ]
            },
            {
                id: 2,
                title: 'Web API Development',
                course: '4',
                type: 'group',
                status: 'upcoming',
                dueDate: '2024-02-20',
                assignedDate: '2024-01-20',
                presentationDate: '2024-02-25',
                duration: 25,
                description: 'Group presentation on RESTful API development, including authentication, documentation, and testing.',
                maxScore: 100,
                submissions: 0,
                totalStudents: 18,
                averageScore: 0,
                groupSize: '3',
                groupFormation: 'student-choice',
                criteria: [
                    { name: 'Technical Implementation', weight: 35 },
                    { name: 'Team Coordination', weight: 25 },
                    { name: 'Documentation', weight: 20 },
                    { name: 'Presentation Quality', weight: 20 }
                ]
            }
        ];
    }

    async updateStats() {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Try to get stats from API
                const response = await fetch('/api/presentations/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const stats = await response.json();
                    document.getElementById('totalPresentations').textContent = stats.total || 0;
                    document.getElementById('activePresentations').textContent = stats.active || 0;
                    document.getElementById('pendingReviews').textContent = stats.pending || 0;
                    document.getElementById('averageScore').textContent = (stats.averageScore || 0) + '%';
                    return;
                }
            }
            
            // Fallback to client-side calculation
            const totalPresentations = this.presentations.length;
            const activePresentations = this.presentations.filter(p => p.status === 'active' || p.status === 'upcoming').length;
            const pendingReviews = this.presentations.filter(p => p.status === 'pending').length;
            const averageScore = this.presentations.length > 0 
                ? Math.round(this.presentations.reduce((sum, p) => sum + (p.averageScore || 0), 0) / this.presentations.length)
                : 0;

            document.getElementById('totalPresentations').textContent = totalPresentations;
            document.getElementById('activePresentations').textContent = activePresentations;
            document.getElementById('pendingReviews').textContent = pendingReviews;
            document.getElementById('averageScore').textContent = averageScore + '%';
        } catch (error) {
            console.error('Error updating stats:', error);
            // Fallback to client-side calculation
            const totalPresentations = this.presentations.length;
            const activePresentations = this.presentations.filter(p => p.status === 'active' || p.status === 'upcoming').length;
            const pendingReviews = this.presentations.filter(p => p.status === 'pending').length;
            const averageScore = this.presentations.length > 0 
                ? Math.round(this.presentations.reduce((sum, p) => sum + (p.averageScore || 0), 0) / this.presentations.length)
                : 0;

            document.getElementById('totalPresentations').textContent = totalPresentations;
            document.getElementById('activePresentations').textContent = activePresentations;
            document.getElementById('pendingReviews').textContent = pendingReviews;
            document.getElementById('averageScore').textContent = averageScore + '%';
        }
    }



    displayStats(stats) {
        document.getElementById('totalPresentations').textContent = stats.total || 0;
        document.getElementById('activePresentations').textContent = stats.active || 0;
        document.getElementById('pendingReviews').textContent = stats.pending || 0;
        document.getElementById('averageScore').textContent = (stats.averageScore || 0) + '%';
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        this.applyFilters();
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.applyFilters();
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const courseFilter = document.getElementById('courseFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        let filtered = [...this.presentations];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(presentation => 
                presentation.title.toLowerCase().includes(searchTerm) ||
                presentation.course.toLowerCase().includes(searchTerm)
            );
        }

        // Apply status filter
        if (statusFilter) {
            filtered = filtered.filter(presentation => presentation.status === statusFilter);
        }

        // Apply course filter
        if (courseFilter) {
            filtered = filtered.filter(presentation => presentation.course.includes(courseFilter));
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'date-desc':
                    return new Date(b.dueDate) - new Date(a.dueDate);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'course':
                    return a.course.localeCompare(b.course);
                case 'score':
                    return b.averageScore - a.averageScore;
                default:
                    return new Date(b.dueDate) - new Date(a.dueDate);
            }
        });

        this.filteredPresentations = filtered;
        this.renderPresentations();
    }

    renderPresentations() {
        // Organize presentations by status
        const upcoming = this.filteredPresentations.filter(p => p.status === 'upcoming' || p.status === 'active');
        const pending = this.filteredPresentations.filter(p => p.status === 'pending');
        const graded = this.filteredPresentations.filter(p => p.status === 'completed' || p.status === 'graded');

        // Update section counts
        document.getElementById('upcomingCount').textContent = upcoming.length;
        document.getElementById('pendingCount').textContent = pending.length;
        document.getElementById('gradedCount').textContent = graded.length;

        // Render each section
        this.renderPresentationSection('upcomingPresentations', upcoming, 'upcoming');
        this.renderPresentationSection('pendingPresentations', pending, 'pending');
        this.renderPresentationSection('gradedPresentations', graded, 'graded');
    }

    renderPresentationSection(containerId, presentations, sectionType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (presentations.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-${this.getSectionIcon(sectionType)}"></i>
                    <h4>No ${sectionType} presentations</h4>
                    <p>${this.getSectionEmptyMessage(sectionType)}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = presentations.map(presentation => 
            this.createPresentationCard(presentation, sectionType)
        ).join('');
    }

    getSectionIcon(sectionType) {
        const icons = {
            upcoming: 'calendar-alt',
            pending: 'clock',
            graded: 'check-circle'
        };
        return icons[sectionType] || 'presentation';
    }

    getSectionEmptyMessage(sectionType) {
        const messages = {
            upcoming: 'Create a new presentation to get started.',
            pending: 'No presentations waiting for review.',
            graded: 'No graded presentations yet.'
        };
        return messages[sectionType] || 'No presentations found.';
    }

    createPresentationCard(presentation, sectionType) {
        const isUpcoming = sectionType === 'upcoming';
        const isPending = sectionType === 'pending';
        const isGraded = sectionType === 'graded';
        const presentationId = presentation._id || presentation.id;

        return `
            <div class="presentation-card ${sectionType}">
                <div class="presentation-header">
                    <h3>${presentation.title}</h3>
                    <span class="status-badge ${presentation.status}">${this.formatStatus(presentation.status)}</span>
                </div>
                <div class="presentation-meta">
                    <div class="meta-item">
                        <i class="fas fa-book"></i>
                        <span>Course: ${this.getCourseName(presentation.course)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-${presentation.type === 'group' ? 'users' : 'user'}"></i>
                        <span>${presentation.type === 'group' ? 'Group' : 'Individual'} Presentation</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${presentation.duration} minutes</span>
                    </div>
                    ${presentation.schedule?.presentationDate ? `
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Date: ${this.formatDate(presentation.schedule.presentationDate)}</span>
                        </div>
                    ` : ''}
                    <div class="meta-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>Due: ${this.formatDate(presentation.schedule?.dueDate || presentation.dueDate)}</span>
                    </div>
                </div>
                
                ${presentation.description ? `
                    <div class="presentation-description">
                        <p>${presentation.description}</p>
                    </div>
                ` : ''}
                
                ${presentation.type === 'group' && presentation.groups ? `
                    <div class="group-info">
                        <h5>Groups (${presentation.groups.length})</h5>
                        <div class="groups-list">
                            ${presentation.groups.map(group => `
                                <div class="group-item">
                                    <strong>${group.name}</strong>
                                    <span>(${group.students.length} students)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="presentation-stats">
                    <div class="stat-item">
                        <span class="stat-label">Submissions</span>
                        <span class="stat-value">${presentation.submissions || 0}/${presentation.totalStudents || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Max Score</span>
                        <span class="stat-value">${presentation.grading?.maxScore || presentation.maxScore || 100}</span>
                    </div>
                    ${isGraded ? `
                        <div class="stat-item">
                            <span class="stat-label">Avg Score</span>
                            <span class="stat-value">${presentation.averageScore || 0}%</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="presentation-actions">
                    ${isUpcoming ? `
                        <button class="btn btn-success" onclick="lecturerPresentations.startPresentation('${presentationId}')">
                            <i class="fas fa-play"></i> Start Presentation
                        </button>
                        <button class="btn btn-outline" onclick="lecturerPresentations.editPresentation('${presentationId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="lecturerPresentations.cancelPresentation('${presentationId}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : isPending ? `
                        <button class="btn btn-primary" onclick="lecturerPresentations.gradePresentations('${presentationId}')">
                            <i class="fas fa-clipboard-check"></i> Grade Presentations
                        </button>
                        <button class="btn btn-outline" onclick="lecturerPresentations.viewSubmissions('${presentationId}')">
                            <i class="fas fa-eye"></i> View Submissions
                        </button>
                    ` : `
                        <button class="btn btn-outline" onclick="lecturerPresentations.viewResults('${presentationId}')">
                            <i class="fas fa-chart-bar"></i> View Results
                        </button>
                        <button class="btn btn-outline" onclick="lecturerPresentations.exportGrades('${presentationId}')">
                            <i class="fas fa-download"></i> Export Grades
                        </button>
                    `}
                    <button class="btn btn-outline" onclick="lecturerPresentations.viewPresentationDetails('${presentationId}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }

    getCourseName(course) {
        // Handle populated course object or course ID
        if (typeof course === 'object' && course !== null) {
            return `${course.code || 'N/A'} - ${course.name || course.title || 'Unknown Course'}`;
        }
        
        // Handle course ID - lookup from courses array
        if (this.courses && this.courses.length > 0) {
            const foundCourse = this.courses.find(c => c._id === course || c.id === course);
            if (foundCourse) {
                return `${foundCourse.code || 'N/A'} - ${foundCourse.title || foundCourse.name || 'Unknown Course'}`;
            }
        }
        
        // Fallback for mock course names
        const courseNames = {
            '1': 'CS101',
            '2': 'CS201', 
            '3': 'CS301',
            '4': 'CS401'
        };
        return courseNames[course] || 'Unknown Course';
    }

    formatStatus(status) {
        const statusMap = {
            'active': 'Active',
            'pending': 'Pending Review',
            'completed': 'Completed',
            'draft': 'Draft'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    toggleView() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        const grid = document.getElementById('presentationsGrid');
        const viewToggle = document.getElementById('viewToggle');
        
        if (grid) {
            grid.classList.toggle('list-view', this.viewMode === 'list');
        }
        
        if (viewToggle) {
            const icon = viewToggle.querySelector('i');
            icon.className = this.viewMode === 'grid' ? 'fas fa-list' : 'fas fa-th-large';
        }
    }

    exportData() {
        this.showNotification('Export functionality would download presentation data as CSV/Excel', 'info');
    }

    toggleCreateForm() {
        console.log('toggleCreateForm called'); // Debug log
        const formSection = document.getElementById('createPresentationForm');
        const toggleBtn = document.getElementById('toggleCreateForm');
        
        console.log('Form section:', formSection); // Debug log
        console.log('Toggle button:', toggleBtn); // Debug log
        
        if (formSection && toggleBtn) {
            const isVisible = formSection.style.display !== 'none';
            formSection.style.display = isVisible ? 'none' : 'block';
            
            const icon = toggleBtn.querySelector('i');
            const span = toggleBtn.querySelector('span');
            
            if (isVisible) {
                icon.className = 'fas fa-plus';
                span.textContent = 'Add Presentation';
                this.resetForm();
            } else {
                icon.className = 'fas fa-minus';
                span.textContent = 'Cancel';
                // Reload courses when opening the form to get latest courses
                console.log('Loading latest courses for presentation creation...');
                this.loadCourses();
            }
        } else {
            console.error('Could not find form section or toggle button');
        }
    }

    resetForm() {
        const form = document.getElementById('newPresentationForm');
        if (form) {
            form.reset();
            
            // Reset custom criteria
            const customCriteria = document.querySelectorAll('.custom-criteria');
            customCriteria.forEach(criteria => criteria.remove());
            this.customCriteriaCount = 0;
            
            // Reset group sections
            document.getElementById('groupStudentsSection').style.display = 'none';
            document.getElementById('preassignedGroups').style.display = 'none';
            document.getElementById('groupsContainer').innerHTML = '';
            
            // Reset default criteria values
            document.getElementById('contentWeight').value = 30;
            document.getElementById('deliveryWeight').value = 25;
            document.getElementById('visualWeight').value = 20;
            document.getElementById('timingWeight').value = 15;
            document.getElementById('qaWeight').value = 10;
            
            this.initFormValidation();
            this.validateCriteriaTotal();
            this.updateCriteriaListeners();
        }
    }

    handleCreatePresentation(e) {
        e.preventDefault();
        console.log('Form submitted, validating...'); // Debug log
        
        if (!this.validateForm()) {
            console.log('Form validation failed'); // Debug log
            return;
        }

        const formData = new FormData(e.target);
        const presentationData = Object.fromEntries(formData.entries());
        console.log('Form data collected:', presentationData); // Debug log
        
        this.createPresentation(presentationData);
    }

    validateForm() {
        console.log('Validating form...'); // Debug log
        // Basic form validation
        const requiredFields = ['title', 'course', 'type', 'duration', 'description'];
        let isValid = true;
        const emptyFields = [];

        requiredFields.forEach(field => {
            const input = document.getElementById(field === 'title' ? 'presentationTitle' : 
                                               field === 'course' ? 'presentationCourse' :
                                               field === 'type' ? 'presentationType' :
                                               field === 'duration' ? 'presentationDuration' :
                                               field === 'description' ? 'presentationDescription' :
                                               field);
            console.log(`Checking field ${field}:`, input?.value); // Debug log
            if (input && !input.value.trim()) {
                console.log(`Field ${field} is empty`); // Debug log
                input.style.borderColor = '#ee5253';
                emptyFields.push(field);
                isValid = false;
            } else if (input) {
                input.style.borderColor = '';
            } else {
                console.log(`Field ${field} element not found`); // Debug log
                emptyFields.push(field);
                isValid = false;
            }
        });

        if (!isValid) {
            this.showNotification(`Please fill in the following required fields: ${emptyFields.join(', ')}`, 'error');
        }

        // Validate that a course is selected if using selected students notification
        const notificationMode = document.querySelector('input[name="notificationMode"]:checked')?.value;
        const courseSelect = document.getElementById('presentationCourse');
        
        if (notificationMode === 'selected' && (!courseSelect || !courseSelect.value)) {
            this.showNotification('Please select a course to choose specific students', 'error');
            if (courseSelect) courseSelect.style.borderColor = '#ee5253';
            isValid = false;
        }
        
        // Also validate course selection for enrolled students mode
        if (notificationMode === 'enrolled' && (!courseSelect || !courseSelect.value)) {
            this.showNotification('Please select a course when notifying enrolled students', 'error');
            if (courseSelect) courseSelect.style.borderColor = '#ee5253';
            isValid = false;
        }

        console.log('Form validation result:', isValid); // Debug log
        return isValid;
    }

    // Update loadUserProfile method (around line 250):
async loadUserProfile() {
    try {
        const token = localStorage.getItem('token'); // Changed from 'authToken'
        if (!token) {
            console.log('No token found for user profile');
            // Try to get user from localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userName = user.name || 'Lecturer';
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
            return;
        }

        // Try to get user info from profile endpoint
        const response = await fetch(`${this.apiBaseUrl}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            const userName = userData.user?.name || 'Lecturer';
            
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
            
            console.log('✅ User profile loaded:', userName);
        } else {
            throw new Error('Failed to load user profile from API');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = user.name || 'Lecturer';
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }
}

// Update loadCourses method (around line 290):
async loadCourses() {
    try {
        const token = localStorage.getItem('token'); // Changed from 'authToken'
        if (!token) {
            console.log('No token found for courses');
            this.showCourseLoadingError();
            return;
        }

        console.log('Loading courses for lecturer...');
        
        // Try lecturer-specific courses first
        let response = await fetch(`${this.apiBaseUrl}/api/lecturer/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        let courses = [];
        if (response.ok) {
            const data = await response.json();
            courses = data.courses || [];
            console.log(`✅ Loaded ${courses.length} lecturer courses`);
        } else {
            // Fallback to general courses endpoint
            console.log('Trying general courses endpoint...');
            response = await fetch(`${this.apiBaseUrl}/api/courses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                courses = data.courses || [];
                console.log(`✅ Loaded ${courses.length} general courses`);
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        }

        // Store courses
        this.courses = courses;

        // Populate dropdowns
        this.populateCourseDropdowns(courses);

    } catch (error) {
        console.error('Error loading courses:', error);
        this.showCourseLoadingError();
    }
}

// Update loadPresentations method (around line 450):
async loadPresentations() {
    try {
        const token = localStorage.getItem('token'); // Changed from 'authToken'
        if (!token) {
            console.log('No token, redirecting...');
            window.location.href = '../../login.html';
            return;
        }

        console.log('Loading presentations from API...');
        const response = await fetch(`${this.apiBaseUrl}/api/presentations`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Presentations API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Raw presentations data:', data);
            this.presentations = data.presentations || [];
            console.log(`✅ Loaded ${this.presentations.length} presentations from API`);
        } else if (response.status === 401) {
            console.log('Authentication failed, redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../../login.html';
            return;
        } else {
            const errorText = await response.text();
            console.error('API failed with status:', response.status, errorText);
            this.presentations = [];
        }

        this.updateStats();
        this.applyFilters();
    } catch (error) {
        console.error('Error loading presentations:', error);
        this.presentations = [];
        this.updateStats();
        this.applyFilters();
    }
}

// Update loadPresentationStats method (around line 550):
async loadPresentationStats() {
    try {
        const token = localStorage.getItem('token'); // Changed from 'authToken'
        if (!token) {
            return;
        }

        const response = await fetch(`${this.apiBaseUrl}/api/presentations/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const stats = await response.json();
            this.displayStats(stats);
        } else {
            this.updateStats();
        }
    } catch (error) {
        console.error('Error loading presentation stats:', error);
        this.updateStats();
    }
}

// Update createPresentation method (around line 1000):
async createPresentation(data) {
    const submitBtn = document.getElementById('createPresentationBtn');
    
    try {
        this.setLoading(true, submitBtn);
        this.showNotification('Creating presentation...', 'info');
        
        const token = localStorage.getItem('token'); // Changed from 'authToken'
        if (!token) {
            window.location.href = '../../login.html';
            return;
        }

        // Prepare the presentation data
        const presentationData = {
            title: data.presentationTitle || data.title,
            description: data.presentationDescription || data.description,
            course: data.presentationCourse || data.course,
            type: data.presentationType || data.type,
            duration: parseInt(data.presentationDuration || data.duration) || 30,
            schedule: {
                assignedDate: data.assignedDate || new Date().toISOString().split('T')[0],
                dueDate: data.dueDate,
                presentationDate: data.presentationDate,
                presentationTime: data.presentationTime
            },
            grading: {
                maxScore: parseInt(data.maxScore) || 100,
                weightage: parseInt(data.weightage) || 20,
                method: 'criteria'
            },
            selectedStudents: this.getSelectedStudents(),
            notificationMode: document.querySelector('input[name="notificationMode"]:checked')?.value || 'enrolled',
            status: 'active'
        };

        console.log('📤 Sending presentation data:', presentationData);

        // Call the API
        const response = await fetch(`${this.apiBaseUrl}/api/presentations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(presentationData)
        });

        const result = await response.json();
        console.log('📥 API Response:', result);

        if (response.ok) {
            this.showNotification('✅ Presentation created successfully!', 'success');
            this.toggleCreateForm();
            await this.loadPresentations();
            this.resetForm();
        } else {
            const errorMessage = result.message || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('❌ Error creating presentation:', error);
        this.showNotification(error.message || 'Failed to create presentation. Please try again.', 'error');
    } finally {
        this.setLoading(false, submitBtn);
    }
}

// Update cancelPresentation method (around line 1400):
async cancelPresentation(id) {
    const presentation = this.presentations.find(p => (p._id || p.id) === id);
    if (presentation) {
        if (confirm(`Are you sure you want to cancel "${presentation.title}"?`)) {
            try {
                this.showNotification('Cancelling presentation...', 'info');
                
                const token = localStorage.getItem('token'); // Changed from 'authToken'
                if (!token) {
                    window.location.href = '../../login.html';
                    return;
                }

                const response = await fetch(`${this.apiBaseUrl}/api/presentations/${id}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    this.showNotification('Presentation cancelled successfully!', 'success');
                    await this.loadPresentations();
                } else {
                    throw new Error(result.message || 'Failed to cancel presentation');
                }
            } catch (error) {
                console.error('Error cancelling presentation:', error);
                this.showNotification(error.message || 'Failed to cancel presentation.', 'error');
            }
        }
    }
}

// Update loadCourseStudents method (around line 1600):
async loadCourseStudents(courseId) {
    try {
        console.log('Loading students for course:', courseId);
        const token = localStorage.getItem('token'); // Changed from 'authToken'
        if (!token) {
            console.log('No token available');
            return;
        }

        const studentList = document.getElementById('studentList');
        if (!studentList) {
            console.log('Student list element not found');
            return;
        }
        
        studentList.innerHTML = '<div class="loading-students"><i class="fas fa-spinner fa-spin"></i> Loading students...</div>';

        const url = `${this.apiBaseUrl}/api/presentations/course/${courseId}/students`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Students data received:', data);
            const students = data.students || [];
            
            if (students.length === 0) {
                studentList.innerHTML = '<div class="no-students">No students enrolled in this course</div>';
            } else {
                studentList.innerHTML = students.map(student => `
                    <div class="student-item">
                        <input type="checkbox" name="selectedStudents" value="${student._id}" class="student-checkbox" id="student-${student._id}">
                        <label for="student-${student._id}" class="student-name">${student.name}</label>
                        <span class="student-id">${student.email}</span>
                    </div>
                `).join('');
                
                // Add event listeners to checkboxes
                const checkboxes = studentList.querySelectorAll('input[name="selectedStudents"]');
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        this.updateNotificationSummary();
                    });
                });
            }
            
            this.updateNotificationSummary();
        } else {
            const errorText = await response.text();
            console.error('Error response:', response.status, errorText);
            studentList.innerHTML = '<div class="error-loading">Error loading students</div>';
        }
    } catch (error) {
        console.error('Error loading course students:', error);
        const studentList = document.getElementById('studentList');
        if (studentList) {
            studentList.innerHTML = '<div class="error-loading">Error loading students</div>';
        }
    }
}


    resetForm() {
        const form = document.getElementById('newPresentationForm');
        if (form) {
            form.reset();
            
            // Reset notification mode to "all"
            const allStudentsRadio = document.querySelector('input[name="notificationMode"][value="all"]');
            if (allStudentsRadio) {
                allStudentsRadio.checked = true;
            }
            
            // Hide student selection
            const studentSelection = document.getElementById('studentSelection');
            if (studentSelection) {
                studentSelection.style.display = 'none';
            }
            
            // Clear student list
            const studentList = document.getElementById('studentList');
            if (studentList) {
                studentList.innerHTML = '';
            }
            
            // Clear notification summary
            const summaryElement = document.getElementById('notificationSummary');
            if (summaryElement) {
                summaryElement.innerHTML = '';
            }
            
            // Reset border colors
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => input.style.borderColor = '');
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const assignedDateInput = document.getElementById('assignedDate');
            if (assignedDateInput) {
                assignedDateInput.value = today;
            }
        }
    }

    getTotalStudentsForPresentation(data) {
        if (data.type === 'group' && data.groupFormation === 'instructor-assigned') {
            const checkedStudents = document.querySelectorAll('input[name="groupStudents[]"]:checked');
            return checkedStudents.length;
        }
        return 20; // Default mock value
    }

    getCriteriaFromForm() {
        const criteria = [];
        
        // Get default criteria
        const defaultCriteria = [
            { name: 'Content Quality', weight: parseInt(document.getElementById('contentWeight').value) || 0 },
            { name: 'Delivery & Presentation', weight: parseInt(document.getElementById('deliveryWeight').value) || 0 },
            { name: 'Visual Aids', weight: parseInt(document.getElementById('visualWeight').value) || 0 },
            { name: 'Time Management', weight: parseInt(document.getElementById('timingWeight').value) || 0 },
            { name: 'Q&A Handling', weight: parseInt(document.getElementById('qaWeight').value) || 0 }
        ];
        
        criteria.push(...defaultCriteria.filter(c => c.weight > 0));
        
        // Get custom criteria
        const customNames = document.querySelectorAll('input[name="customCriteriaName[]"]');
        const customWeights = document.querySelectorAll('input[name="customCriteriaWeight[]"]');
        
        for (let i = 0; i < customNames.length; i++) {
            const name = customNames[i].value.trim();
            const weight = parseInt(customWeights[i].value) || 0;
            if (name && weight > 0) {
                criteria.push({ name, weight });
            }
        }
        
        return criteria;
    }

    getGroupsFromForm() {
        const groups = [];
        const groupAssignments = document.querySelectorAll('.group-assignment');
        
        groupAssignments.forEach((group, index) => {
            const groupNameInput = group.querySelector('.group-name-input');
            const checkedStudents = group.querySelectorAll('input[name="groupStudents[]"]:checked');
            
            if (checkedStudents.length > 0) {
                const groupData = {
                    id: index + 1,
                    name: groupNameInput.value.trim() || `Group ${index + 1}`,
                    students: Array.from(checkedStudents).map(checkbox => {
                        const studentId = parseInt(checkbox.value);
                        return this.students.find(s => s.id === studentId);
                    })
                };
                groups.push(groupData);
            }
        });
        
        return groups;
    }

    saveDraft() {
        const formData = new FormData(document.getElementById('newPresentationForm'));
        const draftData = Object.fromEntries(formData.entries());
        
        // Save to localStorage as draft
        localStorage.setItem('presentationDraft', JSON.stringify(draftData));
        this.showNotification('Draft saved successfully!', 'success');
    }

    viewPresentationDetails(id) {
        this.showNotification('View presentation details functionality would be implemented here', 'info');
    }

    gradePresentations(id) {
        this.showNotification('Grade presentations functionality would be implemented here', 'info');
    }

    handlePresentationTypeChange() {
        const presentationType = document.getElementById('presentationType').value;
        const groupStudentsSection = document.getElementById('groupStudentsSection');
        
        if (groupStudentsSection) {
            if (presentationType === 'group') {
                groupStudentsSection.style.display = 'block';
            } else {
                groupStudentsSection.style.display = 'none';
                // Reset group-related fields
                const groupSize = document.getElementById('groupSize');
                const groupFormation = document.getElementById('groupFormation');
                if (groupSize) groupSize.value = '';
                if (groupFormation) groupFormation.value = 'student-choice';
                this.handleGroupFormationChange();
            }
        }
    }

    handleGroupFormationChange() {
        const groupFormationElement = document.getElementById('groupFormation');
        const preassignedGroups = document.getElementById('preassignedGroups');
        
        if (!groupFormationElement || !preassignedGroups) {
            return; // Elements don't exist in current form
        }
        
        const groupFormation = groupFormationElement.value;
        
        if (groupFormation === 'instructor-assigned') {
            preassignedGroups.style.display = 'block';
            this.initializeGroups();
        } else {
            preassignedGroups.style.display = 'none';
            // Clear existing groups
            const groupsContainer = document.getElementById('groupsContainer');
            if (groupsContainer) {
                groupsContainer.innerHTML = '';
            }
        }
    }

    initializeGroups() {
        // Start with one empty group
        const groupsContainer = document.getElementById('groupsContainer');
        groupsContainer.innerHTML = '';
        this.addGroup();
    }

    addGroup() {
        const groupsContainer = document.getElementById('groupsContainer');
        const groupNumber = groupsContainer.children.length + 1;
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-assignment';
        groupDiv.innerHTML = `
            <div class="group-header">
                <h6>Group ${groupNumber}</h6>
                <button type="button" class="btn btn-danger btn-sm remove-group-btn" onclick="lecturerPresentations.removeGroup(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="group-content">
                <div class="form-group">
                    <label>Group Name</label>
                    <input type="text" class="group-name-input" placeholder="Enter group name (optional)" name="groupName[]">
                </div>
                <div class="form-group">
                    <label>Select Students</label>
                    <div class="students-selection">
                        ${this.students.map(student => `
                            <div class="student-checkbox">
                                <input type="checkbox" id="student_${student.id}_group_${groupNumber}" 
                                       name="groupStudents[]" value="${student.id}" 
                                       onchange="lecturerPresentations.handleStudentSelection(this)">
                                <label for="student_${student.id}_group_${groupNumber}">${student.name}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        groupsContainer.appendChild(groupDiv);
    }
    // Add this test method to the LecturerPresentations class
testCourseDropdown() {
    console.log('🧪 Testing course dropdown functionality...');
    
    const courseSelect = document.getElementById('presentationCourse');
    if (!courseSelect) {
        console.error('❌ Course dropdown not found');
        return;
    }
    
    console.log('✅ Course dropdown found');
    console.log('📊 Options count:', courseSelect.options.length);
    console.log('🔒 Disabled:', courseSelect.disabled);
    
    for (let i = 0; i < courseSelect.options.length; i++) {
        const option = courseSelect.options[i];
        console.log(`   ${i}: "${option.text}" (value: ${option.value})`);
    }
    
    // Test selection
    if (courseSelect.options.length > 1) {
        courseSelect.selectedIndex = 1;
        courseSelect.dispatchEvent(new Event('change'));
        console.log('✅ Dropdown selection test completed');
    }
}
// Add this method to test all button functionality
testAllButtons() {
    console.log('🧪 Testing all presentation buttons...');
    
    const buttons = [
        'toggleCreateForm',
        'refreshCoursesBtn',
        'createPresentationBtn',
        'cancelCreateBtn'
    ];
    
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            console.log(`✅ ${buttonId}: Found and clickable`);
        } else {
            console.error(`❌ ${buttonId}: Not found`);
        }
    });
}

    removeGroup(button) {
        const groupDiv = button.closest('.group-assignment');
        
        // Uncheck all students in this group
        const checkboxes = groupDiv.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        groupDiv.remove();
        this.renumberGroups();
    }

    renumberGroups() {
        const groups = document.querySelectorAll('.group-assignment');
        groups.forEach((group, index) => {
            const groupNumber = index + 1;
            const header = group.querySelector('.group-header h6');
            header.textContent = `Group ${groupNumber}`;
            
            // Update checkbox IDs and labels
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const studentId = checkbox.value;
                const newId = `student_${studentId}_group_${groupNumber}`;
                checkbox.id = newId;
                const label = group.querySelector(`label[for="${checkbox.id}"]`);
                if (label) {
                    label.setAttribute('for', newId);
                }
            });
        });
    }

    handleStudentSelection(checkbox) {
        const studentId = checkbox.value;
        
        if (checkbox.checked) {
            // Uncheck this student from all other groups
            const allCheckboxes = document.querySelectorAll(`input[value="${studentId}"][name="groupStudents[]"]`);
            allCheckboxes.forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = false;
                }
            });
        }
    }

    addCustomCriteria() {
        this.customCriteriaCount++;
        const criteriaGrid = document.getElementById('criteriaGrid');
        const totalElement = criteriaGrid.querySelector('.criteria-total');
        
        const criteriaItem = document.createElement('div');
        criteriaItem.className = 'criteria-item custom-criteria';
        criteriaItem.innerHTML = `
            <div class="criteria-input-group">
                <input type="text" class="criteria-name-input" placeholder="Criteria name" 
                       name="customCriteriaName[]" required>
                <div class="criteria-controls">
                    <input type="number" class="criteria-input" min="0" max="100" placeholder="%" 
                           name="customCriteriaWeight[]" required>
                    <button type="button" class="btn btn-danger btn-sm remove-criteria-btn" 
                            onclick="lecturerPresentations.removeCustomCriteria(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        criteriaGrid.insertBefore(criteriaItem, totalElement);
        this.updateCriteriaListeners();
    }

    removeCustomCriteria(button) {
        const criteriaItem = button.closest('.criteria-item');
        criteriaItem.remove();
        this.validateCriteriaTotal();
    }

    showNotification(message, type = 'info') {
        let notification = document.getElementById('presentationNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'presentationNotification';
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

        const colors = {
            success: '#10ac84',
            error: '#ee5253',
            warning: '#ffa502',
            info: '#3742fa'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 4000);
    }

    // New action methods for presentation management
    startPresentation(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            if (confirm(`Are you sure you want to start "${presentation.title}"? Students will be able to submit their presentations.`)) {
                presentation.status = 'active';
                this.showNotification('Presentation started successfully!', 'success');
                this.loadPresentations();
            }
        }
    }



    editPresentation(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            this.showNotification('Edit presentation functionality would open the form with existing data', 'info');
            // Here you would populate the form with existing data and show it
        }
    }

    viewSubmissions(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            this.showNotification(`Viewing submissions for "${presentation.title}"`, 'info');
            // Here you would open a modal or navigate to submissions page
        }
    }

    viewResults(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            this.showNotification(`Viewing results for "${presentation.title}"`, 'info');
            // Here you would show detailed results and analytics
        }
    }

    exportGrades(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            this.showNotification(`Exporting grades for "${presentation.title}"`, 'info');
            // Here you would generate and download grade report
        }
    }

    // Handle notification mode change
    handleNotificationModeChange(mode) {
        const studentSelection = document.getElementById('studentSelection');
        if (studentSelection) {
            if (mode === 'selected') {
                studentSelection.style.display = 'block';
                // Load students for current course if selected
                const courseSelect = document.getElementById('presentationCourse');
                if (courseSelect && courseSelect.value) {
                    this.loadCourseStudents(courseSelect.value);
                }
            } else {
                studentSelection.style.display = 'none';
            }
        }

        // Update notification summary
        this.updateNotificationSummary();
    }

    // Update notification summary
    updateNotificationSummary() {
        const notificationMode = document.querySelector('input[name="notificationMode"]:checked')?.value;
        const courseSelect = document.getElementById('presentationCourse');
        
        // Create or get summary element
        let summaryElement = document.getElementById('notificationSummary');
        if (!summaryElement) {
            summaryElement = document.createElement('div');
            summaryElement.id = 'notificationSummary';
            summaryElement.className = 'notification-summary';
            
            const studentSelection = document.getElementById('studentSelection');
            if (studentSelection) {
                studentSelection.appendChild(summaryElement);
            }
        }
        
        if (notificationMode === 'enrolled' && courseSelect && courseSelect.value) {
            // Count all enrolled students in the course
            const course = this.courses.find(c => c._id === courseSelect.value);
            const studentCount = course?.students?.length || 0;
            summaryElement.innerHTML = `
                <div class="summary-info">
                    <i class="fas fa-users"></i>
                    <span>All enrolled students will be notified (${studentCount} student${studentCount !== 1 ? 's' : ''})</span>
                </div>
            `;
        } else if (notificationMode === 'all') {
            // Count all students in the system
            const allStudentsCount = this.students.length || 0;
            summaryElement.innerHTML = `
                <div class="summary-info">
                    <i class="fas fa-globe"></i>
                    <span>All students in the system will be notified (${allStudentsCount} student${allStudentsCount !== 1 ? 's' : ''})</span>
                </div>
            `;
        } else if (notificationMode === 'selected') {
            const selectedStudents = document.querySelectorAll('input[name="selectedStudents"]:checked');
            const selectedCount = selectedStudents.length;
            summaryElement.innerHTML = `
                <div class="summary-info">
                    <i class="fas fa-user-check"></i>
                    <span>${selectedCount} student${selectedCount !== 1 ? 's' : ''} selected for notification</span>
                </div>
            `;
        } else {
            summaryElement.innerHTML = '';
        }
    }



    // Get selected students from form
    getSelectedStudents() {
        const notificationMode = document.querySelector('input[name="notificationMode"]:checked')?.value;
        
        if (notificationMode === 'selected') {
            const selectedCheckboxes = document.querySelectorAll('input[name="selectedStudents"]:checked');
            return Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
        }
        
        return []; // Empty array means notify all enrolled students
    }

    // Add loading state management
    setLoading(isLoading, element = null) {
        if (element) {
            if (isLoading) {
                element.disabled = true;
                const originalText = element.innerHTML;
                element.dataset.originalText = originalText;
                element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            } else {
                element.disabled = false;
                element.innerHTML = element.dataset.originalText || 'Submit';
            }
        }
    }

    // Update notification summary
    updateNotificationSummary() {
        const notificationMode = document.querySelector('input[name="notificationMode"]:checked')?.value;
        const courseSelect = document.getElementById('presentationCourse');
        
        // Create or get summary element
        let summaryElement = document.getElementById('notificationSummary');
        if (!summaryElement) {
            summaryElement = document.createElement('div');
            summaryElement.id = 'notificationSummary';
            summaryElement.className = 'notification-summary';
            
            const studentSelection = document.getElementById('studentSelection');
            if (studentSelection) {
                studentSelection.appendChild(summaryElement);
            }
        }
        
        if (notificationMode === 'all' && courseSelect && courseSelect.value) {
            // Count all enrolled students in the course
            const course = this.courses.find(c => c._id === courseSelect.value);
            const studentCount = course?.students?.length || 0;
            summaryElement.innerHTML = `
                <div class="summary-info">
                    <i class="fas fa-users"></i>
                    <span>All enrolled students will be notified (${studentCount} student${studentCount !== 1 ? 's' : ''})</span>
                </div>
            `;
        } else if (notificationMode === 'selected') {
            const selectedStudents = document.querySelectorAll('input[name="selectedStudents"]:checked');
            const selectedCount = selectedStudents.length;
            summaryElement.innerHTML = `
                <div class="summary-info">
                    <i class="fas fa-user-check"></i>
                    <span>${selectedCount} student${selectedCount !== 1 ? 's' : ''} selected for notification</span>
                </div>
            `;
        } else {
            summaryElement.innerHTML = '';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing presentations...');
    
    // Initialize immediately without waiting for auth (for testing)
    setTimeout(() => {
        console.log('Force initializing presentations...');
        if (!window.lecturerPresentations) {
            window.lecturerPresentations = new LecturerPresentations();
        }
    }, 500);
    
    // Wait for auth to be available
    const initPresentations = () => {
        if (window.auth) {
            console.log('Auth module available, initializing presentations...');
            window.lecturerPresentations = new LecturerPresentations();
        } else {
            console.log('Auth module not yet available, retrying...');
            setTimeout(initPresentations, 100);
        }
    };
    
    initPresentations();
});

// Simple initialization - no conflicting event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing presentations...');
    
    // Single initialization
    if (!window.lecturerPresentations) {
        window.lecturerPresentations = new LecturerPresentations();
    }
});
