class StudentPresentations {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.presentations = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        console.log('🎓 Initializing Student Presentations...');
        
        // Check authentication
        if (!localStorage.getItem('token')) {
            window.location.href = '../../login.html';
            return;
        }

        // Load presentations data
        this.loadPresentations();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load user profile
        this.loadUserProfile();
        
        // Set up automatic refresh
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchFilter(e.target.dataset.filter);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPresentations(e.target.value);
            });
        }

        // Course filter
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.addEventListener('change', (e) => {
                this.filterByCourse(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadPresentations();
            });
        }
    }

    setupAutoRefresh() {
        // Refresh presentations every 3 minutes
        setInterval(() => {
            console.log('🔄 Auto-refreshing presentations...');
            this.loadPresentations(false); // Silent refresh
        }, 180000); // 3 minutes

        // Refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.loadPresentations(false);
                }, 1000);
            }
        });
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                const userName = userData.user?.name || 'Student';
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = userName;
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userName = user.name || 'Student';
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
        }
    }

    async loadPresentations(showLoading = true) {
        try {
            if (showLoading) {
                this.showLoadingIndicator();
            }
            
            console.log('📋 Loading presentations from API...');
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No auth token found');
                window.location.href = '../../login.html';
                return;
            }

            const response = await fetch(`${this.apiUrl}/student/presentations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📋 Presentations data:', data);
                
                const previousCount = this.presentations.length;
                this.presentations = data.presentations || [];
                
                // Check for new presentations
                if (this.presentations.length > previousCount && previousCount > 0) {
                    const newCount = this.presentations.length - previousCount;
                    this.showNewPresentationAlert(newCount);
                }
                
                // Update statistics
                this.updateStatistics(data.stats);
                
                // Render presentations
                this.renderPresentations();
                
                console.log(`✅ Loaded ${this.presentations.length} presentations`);
                
            } else if (response.status === 401) {
                console.log('❌ Unauthorized - redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../../login.html';
                return;
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to load presentations:', response.status, errorText);
                this.presentations = [];
                this.renderPresentations();
            }
        } catch (error) {
            console.error('💥 Error loading presentations:', error);
            this.presentations = [];
            this.renderPresentations();
        } finally {
            if (showLoading) {
                this.hideLoadingIndicator();
            }
        }
    }

    updateStatistics(stats) {
        if (stats) {
            document.getElementById('totalPresentations').textContent = stats.total || 0;
            document.getElementById('upcomingPresentations').textContent = stats.upcoming || 0;
            document.getElementById('completedPresentations').textContent = (stats.submitted + stats.graded) || 0;
            
            // Calculate average score from graded presentations
            const gradedPresentations = this.presentations.filter(p => p.submissionStatus === 'graded');
            const averageScore = gradedPresentations.length > 0 
                ? (gradedPresentations.reduce((sum, p) => sum + (p.userSubmission?.grade?.totalScore || 0), 0) / gradedPresentations.length).toFixed(1)
                : '0';
            document.getElementById('averageScore').textContent = averageScore;
        }
    }

    renderPresentations() {
        const container = document.getElementById('presentationsGrid');
        if (!container) return;

        if (this.presentations.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="no-presentations-message">
                        <div class="text-center p-5">
                            <i class="fas fa-presentation fa-3x text-muted mb-3"></i>
                            <h4 class="text-muted">No Presentations Available</h4>
                            <p class="text-muted">No presentations have been assigned yet. Check back later!</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                <i class="fas fa-refresh"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.presentations.map(presentation => 
            this.createPresentationCard(presentation)
        ).join('');
    }

createPresentationCard(presentation) {
    const dueDate = new Date(presentation.schedule.dueDate);
    const statusBadge = this.getStatusBadge(presentation);
    const timeRemaining = this.getTimeRemaining(dueDate);
    
    return `
        <div class="presentation-card">
            <div class="presentation-header">
                <h4 class="presentation-title">${presentation.title}</h4>
                ${statusBadge}
            </div>
            
            <div class="presentation-meta">
                <div class="meta-item">
                    <i class="fas fa-book"></i>
                    <span><strong>${presentation.course.code}</strong> - ${presentation.course.title}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user-tie"></i>
                    <span>${presentation.lecturer.name}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-${presentation.type === 'group' ? 'users' : 'user'}"></i>
                    <span>${presentation.type === 'group' ? 'Group' : 'Individual'} Presentation</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>Duration: ${presentation.duration} minutes</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</span>
                </div>
                ${timeRemaining ? `
                    <div class="meta-item" style="color: ${presentation.isOverdue ? '#dc3545' : '#f39c12'};">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${timeRemaining}</span>
                    </div>
                ` : ''}
            </div>

            ${presentation.description ? `
                <div class="presentation-description">
                    ${presentation.description.substring(0, 120)}${presentation.description.length > 120 ? '...' : ''}
                </div>
            ` : ''}

            ${presentation.hasSubmitted && presentation.userSubmission ? `
                <div class="submission-info">
                    <div style="font-size: 0.9rem; margin-bottom: 5px;">
                        <i class="fas fa-check-circle" style="color: #28a745; margin-right: 8px;"></i>
                        <strong>Submitted:</strong> ${new Date(presentation.userSubmission.submittedAt).toLocaleDateString()}
                    </div>
                    ${presentation.userSubmission.grade ? `
                        <div style="font-size: 0.9rem;">
                            <i class="fas fa-star" style="color: #ffc107; margin-right: 8px;"></i>
                            <strong>Grade:</strong> ${presentation.userSubmission.grade.totalScore}/${presentation.grading.maxScore} points
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="presentation-actions">
                <button class="btn-action btn-outline" onclick="studentPresentations.viewDetails('${presentation._id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
                ${this.getActionButton(presentation)}
            </div>
        </div>
    `;
}

getStatusBadge(presentation) {
    if (presentation.isOverdue) {
        return '<span class="status-badge status-overdue">Overdue</span>';
    }
    
    switch (presentation.submissionStatus) {
        case 'graded':
            return '<span class="status-badge status-graded">Graded</span>';
        case 'submitted':
            return '<span class="status-badge status-submitted">Submitted</span>';
        case 'not_submitted':
        default:
            return '<span class="status-badge status-pending">Pending</span>';
    }
}

getActionButton(presentation) {
    if (presentation.hasSubmitted) {
        if (presentation.submissionStatus === 'graded') {
            return `
                <button class="btn-action btn-success" onclick="studentPresentations.viewGrade('${presentation._id}')">
                    <i class="fas fa-chart-line"></i> View Grade
                </button>
            `;
        } else {
            return `
                <button class="btn-action btn-secondary" disabled>
                    <i class="fas fa-check"></i> Submitted
                </button>
            `;
        }
    } else if (presentation.isOverdue) {
        return `
            <button class="btn-action btn-danger" disabled>
                <i class="fas fa-exclamation-triangle"></i> Overdue
            </button>
        `;
    } else {
        return `
            <button class="btn-action btn-primary" onclick="studentPresentations.participate('${presentation._id}')">
                <i class="fas fa-upload"></i> Participate
            </button>
        `;
    }
}

    getTimeRemaining(dueDate) {
        const now = new Date();
        const diff = dueDate - now;
        
        if (diff < 0) {
            return 'Overdue';
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} remaining`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
        } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
        }
    }
    // Action methods
    async viewDetails(presentationId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/student/presentations/${presentationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showPresentationModal(data.presentation);
            } else {
                this.showAlert('Error loading presentation details', 'error');
            }
        } catch (error) {
            console.error('Error loading presentation details:', error);
            this.showAlert('Error loading presentation details', 'error');
        }
    }

    showPresentationModal(presentation) {
        const modalContent = `
            <div class="modal fade" id="presentationModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${presentation.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Course Information</h6>
                                    <p><strong>Course:</strong> ${presentation.course.code} - ${presentation.course.title}</p>
                                    <p><strong>Lecturer:</strong> ${presentation.lecturer.name}</p>
                                    <p><strong>Type:</strong> ${presentation.type === 'group' ? 'Group' : 'Individual'}</p>
                                    <p><strong>Duration:</strong> ${presentation.duration} minutes</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Schedule</h6>
                                    <p><strong>Due Date:</strong> ${new Date(presentation.schedule.dueDate).toLocaleString()}</p>
                                    ${presentation.schedule.presentationDate ? `
                                        <p><strong>Presentation Date:</strong> ${new Date(presentation.schedule.presentationDate).toLocaleString()}</p>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <h6>Description</h6>
                                <p>${presentation.description || 'No description provided.'}</p>
                            </div>
                            
                            <div class="mt-3">
                                <h6>Requirements</h6>
                                <p><strong>Format:</strong> ${presentation.requirements.format || 'Not specified'}</p>
                                <p><strong>Max Score:</strong> ${presentation.grading.maxScore} points</p>
                            </div>
                            
                            ${presentation.grading.criteria && presentation.grading.criteria.length > 0 ? `
                                <div class="mt-3">
                                    <h6>Grading Criteria</h6>
                                    <ul class="list-group">
                                        ${presentation.grading.criteria.map(criteria => `
                                            <li class="list-group-item d-flex justify-content-between">
                                                <span>${criteria.name}</span>
                                                <span class="badge bg-primary">${criteria.weight}%</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${!presentation.hasSubmitted && !presentation.isOverdue ? `
                                <button type="button" class="btn btn-primary" onclick="studentPresentations.participate('${presentation._id}')" data-bs-dismiss="modal">
                                    <i class="fas fa-upload"></i> Participate Now
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('presentationModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('presentationModal'));
        modal.show();
    }

    // Replace the existing participate method with this SIMPLIFIED version:
participate(presentationId) {
    const presentation = this.presentations.find(p => p._id === presentationId);
    
    if (!presentation) {
        alert('Presentation not found');
        return;
    }
    
    // Extract Zoom link from description
    const zoomLink = this.extractZoomLink(presentation.description);
    
    if (zoomLink) {
        // Show confirmation before opening link
        const confirmed = confirm(`Ready to join the presentation "${presentation.title}"?\n\nThis will open the Zoom meeting in a new tab.`);
        
        if (confirmed) {
            this.openZoomMeeting(zoomLink, presentationId);
        }
    } else {
        alert('No Zoom link found in this presentation. Please check with your lecturer.');
        console.log('No Zoom link found in description:', presentation.description);
    }
}

// Update the openZoomMeeting method to be simpler:
openZoomMeeting(zoomLink, presentationId) {
    try {
        console.log('🎥 Opening Zoom meeting:', zoomLink);
        
        // Open Zoom link in new tab
        const newTab = window.open(zoomLink, '_blank');
        
        if (newTab) {
            // Focus on the new tab
            newTab.focus();
            
            // Show success message
            alert('Zoom meeting opened in new tab! Check your browser tabs.');
            
            // Optional: Record participation
            this.recordParticipation(presentationId);
            
        } else {
            // Handle popup blocker
            alert('Please allow popups for this site and try again.\n\nAlternatively, copy this link manually:\n' + zoomLink);
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(zoomLink).then(() => {
                    console.log('Zoom link copied to clipboard');
                });
            }
        }
        
    } catch (error) {
        console.error('Error opening Zoom meeting:', error);
        alert('Error opening meeting. Link copied to console for manual use.\n\nLink: ' + zoomLink);
    }
}

// Keep the existing extractZoomLink method as is:
extractZoomLink(description) {
    if (!description) return null;
    
    // Common Zoom link patterns
    const zoomPatterns = [
        // Standard Zoom meeting links
        /https:\/\/[a-zA-Z0-9.-]*zoom\.us\/j\/[0-9]+(\?[^\s]*)?/gi,
        // Zoom personal meeting room links  
        /https:\/\/[a-zA-Z0-9.-]*zoom\.us\/my\/[a-zA-Z0-9._-]+(\?[^\s]*)?/gi,
        // Generic zoom.us links
        /https:\/\/[a-zA-Z0-9.-]*zoom\.us\/[^\s]*/gi,
        // Any URL containing zoom
        /https?:\/\/[^\s]*zoom[^\s]*/gi
    ];
    
    for (const pattern of zoomPatterns) {
        const matches = description.match(pattern);
        if (matches && matches.length > 0) {
            return matches[0].trim();
        }
    }
    
    // If no pattern matches, check if the entire description looks like a URL
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urlMatches = description.match(urlPattern);
    if (urlMatches && urlMatches.length > 0) {
        return urlMatches[0].trim();
    }
    
    return null;
}

// Keep the existing recordParticipation method as is:
async recordParticipation(presentationId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${this.apiUrl}/student/presentations/${presentationId}/participate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'joined_zoom',
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('✅ Participation recorded');
        }
    } catch (error) {
        console.log('⚠️ Could not record participation:', error);
        // Don't show error to user as this is optional
    }
}



// Add this new method to show participation confirmation:
showParticipationModal(presentation, zoomLink) {
    const modalContent = `
        <div class="modal fade" id="participationModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-video"></i> Join Presentation
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="fas fa-video fa-3x text-primary mb-3"></i>
                            <h4>${presentation.title}</h4>
                            <p class="text-muted">
                                <strong>Course:</strong> ${presentation.course.code} - ${presentation.course.title}<br>
                                <strong>Lecturer:</strong> ${presentation.lecturer.name}<br>
                                <strong>Duration:</strong> ${presentation.duration} minutes
                            </p>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Ready to join?</strong><br>
                            Click "Join Zoom Meeting" to open the meeting in a new window.
                        </div>
                        
                        <div class="zoom-link-preview">
                            <label class="form-label">Meeting Link:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" value="${zoomLink}" readonly>
                                <button class="btn btn-outline-secondary" type="button" onclick="navigator.clipboard.writeText('${zoomLink}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="fas fa-lightbulb"></i>
                                <strong>Tips:</strong> 
                                Make sure you have the Zoom app installed or use the web browser option.
                                Join a few minutes early to test your audio and video.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="btn btn-success" onclick="studentPresentations.openZoomMeeting('${zoomLink}', '${presentation._id}')">
                            <i class="fas fa-video"></i> Join Zoom Meeting
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('participationModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('participationModal'));
    modal.show();
}





    viewGrade(presentationId) {
        const presentation = this.presentations.find(p => p._id === presentationId);
        if (presentation && presentation.userSubmission && presentation.userSubmission.grade) {
            this.showGradeModal(presentation);
        }
    }

    showGradeModal(presentation) {
        const grade = presentation.userSubmission.grade;
        const modalContent = `
            <div class="modal fade" id="gradeModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Grade Details - ${presentation.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <h2 class="display-4 text-primary">${grade.totalScore}/${presentation.grading.maxScore}</h2>
                                <p class="text-muted">Final Score</p>
                            </div>
                            
                            ${grade.criteriaScores && grade.criteriaScores.length > 0 ? `
                                <h6>Criteria Breakdown</h6>
                                <div class="list-group mb-3">
                                    ${grade.criteriaScores.map(criteria => `
                                        <div class="list-group-item d-flex justify-content-between">
                                            <span>${criteria.name || 'Criterion'}</span>
                                            <span class="badge bg-primary">${criteria.score} points</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${grade.feedback ? `
                                <h6>Feedback</h6>
                                <div class="alert alert-info">
                                    ${grade.feedback}
                                </div>
                            ` : ''}
                            
                            <p class="text-muted small">
                                Graded on: ${new Date(grade.gradedAt).toLocaleString()}
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('gradeModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('gradeModal'));
        modal.show();
    }

    // Filter methods
    switchFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.presentations];
        
        // Apply status filter
        switch (this.currentFilter) {
            case 'upcoming':
                filtered = filtered.filter(p => !p.hasSubmitted && !p.isOverdue);
                break;
            case 'submitted':
                filtered = filtered.filter(p => p.hasSubmitted && p.submissionStatus !== 'graded');
                break;
            case 'graded':
                filtered = filtered.filter(p => p.submissionStatus === 'graded');
                break;
            case 'overdue':
                filtered = filtered.filter(p => p.isOverdue);
                break;
            // 'all' shows everything
        }
        
        this.renderFilteredPresentations(filtered);
    }

    renderFilteredPresentations(presentations) {
        const container = document.getElementById('presentationsGrid');
        if (!container) return;

        if (presentations.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center p-5">
                        <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">No Presentations Found</h4>
                        <p class="text-muted">No presentations match the current filter.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = presentations.map(presentation => 
            this.createPresentationCard(presentation)
        ).join('');
    }

    filterPresentations(searchTerm) {
        let filtered = [...this.presentations];
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.lecturer.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        this.renderFilteredPresentations(filtered);
    }

    filterByCourse(courseId) {
        let filtered = [...this.presentations];
        
        if (courseId) {
            filtered = filtered.filter(p => p.course._id === courseId);
        }
        
        this.renderFilteredPresentations(filtered);
    }

    // Utility methods
    showLoadingIndicator() {
        let indicator = document.getElementById('loadingIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loadingIndicator';
            indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading presentations...';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 123, 255, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 1000;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showNewPresentationAlert(count) {
        const alert = document.createElement('div');
        alert.innerHTML = `
            <div style="
                position: fixed;
                top: 70px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 1001;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                animation: slideInRight 0.3s ease;
            ">
                🎉 ${count} new presentation${count > 1 ? 's' : ''} available!
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    float: right;
                    margin-left: 10px;
                    cursor: pointer;
                    font-size: 16px;
                ">&times;</button>
            </div>
        `;
        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showAlert(message, type = 'info') {
        // Implementation for showing alerts/notifications
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentPresentations = new StudentPresentations();
});