// Student Assignments JavaScript
class StudentAssignments {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        // Check authentication
        if (!window.simpleAuth.requireAuth()) {
            return;
        }

        // Load assignments data
        this.loadAssignments();
        
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

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAssignments(e.target.value);
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
        const modal = document.getElementById('submitAssignmentModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelSubmissionBtn');
        const submitBtn = document.getElementById('submitAssignmentBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSubmissionModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeSubmissionModal();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitAssignment();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeSubmissionModal();
            }
        });

        // View toggle
        const viewToggleBtns = document.querySelectorAll('.view-btn');
        viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleView(e.target.dataset.view);
            });
        });

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortAssignments(e.target.value);
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

    async loadAssignments() {
        try {
            // Load assignment statistics
            await this.updateStatistics();
            
            // Load assignments list
            const container = document.getElementById('assignmentsGrid');
            container.innerHTML = this.getMockAssignments();
        } catch (error) {
            console.error('Error loading assignments:', error);
        }
    }

    async updateStatistics() {
        try {
            // Updated statistics to match the mock assignments
            document.getElementById('totalAssignments').textContent = '6';
            document.getElementById('pendingAssignments').textContent = '3';
            document.getElementById('submittedAssignments').textContent = '1';
            document.getElementById('averageGrade').textContent = '85.0';
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    switchFilter(filter) {
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Filter assignments based on selected filter
        this.filterAssignments('', filter);
    }

    toggleView(view) {
        // Update active view button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update container class
        const container = document.getElementById('assignmentsGrid');
        if (view === 'list') {
            container.classList.add('list-view');
        } else {
            container.classList.remove('list-view');
        }
    }

    sortAssignments(sortBy) {
        console.log('Sorting assignments by:', sortBy);
        // In a real implementation, this would sort the assignments array and re-render
    }

    filterAssignments(searchTerm, filter = 'all') {
        // Implementation for filtering assignments would go here
        console.log('Filtering assignments:', searchTerm, filter);
    }

    showSubmissionModal(assignmentId, assignmentTitle) {
        const modal = document.getElementById('submitAssignmentModal');
        const titleInput = document.getElementById('assignmentTitle');
        
        titleInput.value = assignmentTitle;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Store assignment ID for submission
        this.currentAssignmentId = assignmentId;
    }

    closeSubmissionModal() {
        const modal = document.getElementById('submitAssignmentModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore background scrolling
        
        // Clear form
        document.getElementById('submissionText').value = '';
        document.getElementById('attachmentFile').value = '';
    }

    async submitAssignment() {
        try {
            const submissionText = document.getElementById('submissionText').value;
            const attachmentFile = document.getElementById('attachmentFile').files[0];
            
            if (!submissionText.trim()) {
                alert('Please enter your submission text');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('submitAssignmentBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success message
            alert('Assignment submitted successfully!');
            
            // Close modal and refresh assignments
            this.closeSubmissionModal();
            this.loadAssignments();

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error('Error submitting assignment:', error);
            alert('Error submitting assignment. Please try again.');
            
            // Reset button
            const submitBtn = document.getElementById('submitAssignmentBtn');
            submitBtn.textContent = 'Submit Assignment';
            submitBtn.disabled = false;
        }
    }

    getMockAssignments() {
        return `
            <div class="assignment-card due-today priority-high">
                <div class="assignment-header">
                    <h4>Programming Assignment 3: Sorting Algorithms</h4>
                    <span class="assignment-status pending">Due Today</span>
                </div>
                <div class="assignment-info">
                    <p><i class="fas fa-book"></i> Introduction to Computer Science</p>
                    <p><i class="fas fa-calendar"></i> Due: Today at 11:59 PM</p>
                    <p><i class="fas fa-star"></i> Max Score: 100 points</p>
                    <p><i class="fas fa-clock"></i> Time Remaining: 8 hours</p>
                </div>
                <div class="assignment-description">
                    <p>Implement merge sort and quick sort algorithms. Compare their performance and analyze time complexity. Include detailed documentation and test cases.</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary" onclick="window.studentAssignments.showSubmissionModal('assign1', 'Programming Assignment 3')">
                        <i class="fas fa-upload"></i> Submit Now
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
            
            <div class="assignment-card">
                <div class="assignment-header">
                    <h4>Data Analysis Report: Customer Behavior</h4>
                    <span class="assignment-status submitted">Submitted</span>
                </div>
                <div class="assignment-info">
                    <p><i class="fas fa-book"></i> Data Structures & Analytics</p>
                    <p><i class="fas fa-calendar"></i> Submitted: June 15, 2025 at 3:42 PM</p>
                    <p><i class="fas fa-clock"></i> Awaiting Grade (3 days ago)</p>
                    <p><i class="fas fa-file-alt"></i> Attachment: data_analysis.pdf</p>
                </div>
                <div class="assignment-description">
                    <p>Analyze the customer behavior dataset using statistical methods. Identify patterns, trends, and provide actionable business insights.</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-info">
                        <i class="fas fa-eye"></i> View Submission
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
            
            <div class="assignment-card">
                <div class="assignment-header">
                    <h4>Web Development Project: E-commerce Site</h4>
                    <span class="assignment-status graded">Graded</span>
                </div>
                <div class="assignment-info">
                    <p><i class="fas fa-book"></i> Web Development Fundamentals</p>
                    <p><i class="fas fa-calendar"></i> Graded: June 10, 2025</p>
                    <p><i class="fas fa-star"></i> <span class="assignment-score excellent">92/100</span></p>
                    <p><i class="fas fa-comments"></i> Feedback Available</p>
                </div>
                <div class="assignment-description">
                    <p>Build a fully responsive e-commerce website using HTML5, CSS3, and JavaScript. Include shopping cart functionality and payment integration.</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-success">
                        <i class="fas fa-comment-alt"></i> View Feedback
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
            
            <div class="assignment-card due-soon priority-medium">
                <div class="assignment-header">
                    <h4>Algorithm Design Challenge: Optimization</h4>
                    <span class="assignment-status pending">Pending</span>
                </div>
                <div class="assignment-info">
                    <p><i class="fas fa-book"></i> Advanced Algorithms</p>
                    <p><i class="fas fa-calendar"></i> Due: July 25, 2025 at 11:59 PM</p>
                    <p><i class="fas fa-star"></i> Max Score: 150 points</p>
                    <p><i class="fas fa-trophy"></i> Bonus Challenge (+20 pts)</p>
                </div>
                <div class="assignment-description">
                    <p>Design and implement an efficient algorithm for the traveling salesman problem. Compare different approaches and optimize for large datasets.</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary" onclick="window.studentAssignments.showSubmissionModal('assign2', 'Algorithm Design Challenge')">
                        <i class="fas fa-code"></i> Start Coding
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-info-circle"></i> Requirements
                    </button>
                </div>
            </div>

            <div class="assignment-card">
                <div class="assignment-header">
                    <h4>Database Design Project: Library System</h4>
                    <span class="assignment-status graded">Graded</span>
                </div>
                <div class="assignment-info">
                    <p><i class="fas fa-book"></i> Database Management Systems</p>
                    <p><i class="fas fa-calendar"></i> Graded: June 5, 2025</p>
                    <p><i class="fas fa-star"></i> <span class="assignment-score good">78/100</span></p>
                    <p><i class="fas fa-lightbulb"></i> Improvement Suggestions Available</p>
                </div>
                <div class="assignment-description">
                    <p>Design a comprehensive database schema for a library management system. Include ER diagrams, normalization, and sample queries.</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-success">
                        <i class="fas fa-chart-line"></i> View Grade
                    </button>
                    <button class="btn btn-info">
                        <i class="fas fa-lightbulb"></i> Improvements
                    </button>
                </div>
            </div>

            <div class="assignment-card priority-low">
                <div class="assignment-header">
                    <h4>Research Paper: AI Ethics</h4>
                    <span class="assignment-status pending">Pending</span>
                </div>
                <div class="assignment-info">
                    <p><i class="fas fa-book"></i> Computer Ethics & Society</p>
                    <p><i class="fas fa-calendar"></i> Due: August 15, 2025 at 11:59 PM</p>
                    <p><i class="fas fa-star"></i> Max Score: 120 points</p>
                    <p><i class="fas fa-users"></i> Group Assignment (3-4 members)</p>
                </div>
                <div class="assignment-description">
                    <p>Research and write a comprehensive paper on ethical considerations in artificial intelligence. Focus on bias, privacy, and societal impact.</p>
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-primary" onclick="window.studentAssignments.showSubmissionModal('assign3', 'Research Paper: AI Ethics')">
                        <i class="fas fa-pencil-alt"></i> Start Writing
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-users"></i> Find Group
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentAssignments = new StudentAssignments();
});
