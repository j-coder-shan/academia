// Presentation JavaScript Module
class Presentation {
    constructor() {
        this.auth = window.auth;
        this.apiUrl = 'http://localhost:3000/api';
        this.currentSlide = 0;
        this.slides = [];
        this.init();
    }

    init() {
        // Check authentication
        if (!this.auth.requireAuth()) {
            return;
        }

        this.bindEvents();
        this.loadPresentationData();
    }

    bindEvents() {
        // Presentation controls
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const exitBtn = document.getElementById('exitPresentation');

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        if (exitBtn) exitBtn.addEventListener('click', () => this.exitPresentation());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyNavigation(e));

        // Touch/swipe support for mobile
        this.addTouchSupport();

        // Auto-save notes
        const notesTextarea = document.getElementById('presentationNotes');
        if (notesTextarea) {
            notesTextarea.addEventListener('input', this.debounce(() => this.saveNotes(), 1000));
        }

        // Slide thumbnail clicks
        this.bindThumbnailClicks();
    }

    async loadPresentationData() {
        const urlParams = new URLSearchParams(window.location.search);
        const presentationId = urlParams.get('id');

        if (!presentationId) {
            this.showAlert('No presentation ID provided', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await this.auth.apiRequest(`/presentations/${presentationId}`);
            if (response && response.ok) {
                const presentation = await response.json();
                this.loadPresentation(presentation);
            } else {
                this.showAlert('Failed to load presentation', 'error');
            }
        } catch (error) {
            console.error('Error loading presentation:', error);
            this.showAlert('Error loading presentation', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    loadPresentation(presentation) {
        this.slides = presentation.slides || [];
        this.currentSlide = 0;

        // Update presentation title
        const titleElement = document.getElementById('presentationTitle');
        if (titleElement) {
            titleElement.textContent = presentation.title;
        }

        // Load slides
        this.renderSlides();
        this.showSlide(0);
        this.updateProgress();
    }

    renderSlides() {
        const slidesContainer = document.getElementById('slidesContainer');
        const thumbnailsContainer = document.getElementById('thumbnailsContainer');

        if (!slidesContainer || !this.slides.length) return;

        // Render main slides
        const slidesHTML = this.slides.map((slide, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
                <div class="slide-content">
                    ${this.renderSlideContent(slide)}
                </div>
            </div>
        `).join('');

        slidesContainer.innerHTML = slidesHTML;

        // Render thumbnails
        if (thumbnailsContainer) {
            const thumbnailsHTML = this.slides.map((slide, index) => `
                <div class="slide-thumbnail ${index === 0 ? 'active' : ''}" 
                     data-slide-index="${index}"
                     onclick="presentation.goToSlide(${index})">
                    <div class="thumbnail-content">
                        ${this.renderSlideThumbnail(slide)}
                    </div>
                    <div class="slide-number">${index + 1}</div>
                </div>
            `).join('');

            thumbnailsContainer.innerHTML = thumbnailsHTML;
        }
    }

    renderSlideContent(slide) {
        switch (slide.type) {
            case 'title':
                return `
                    <h1 class="slide-title">${slide.title}</h1>
                    <h2 class="slide-subtitle">${slide.subtitle || ''}</h2>
                `;
            
            case 'content':
                return `
                    <h2 class="slide-heading">${slide.title}</h2>
                    <div class="slide-body">
                        ${slide.content}
                    </div>
                `;
            
            case 'image':
                return `
                    <h2 class="slide-heading">${slide.title}</h2>
                    <div class="slide-image-container">
                        <img src="${slide.imageUrl}" alt="${slide.alt || ''}" class="slide-image">
                    </div>
                    ${slide.caption ? `<p class="slide-caption">${slide.caption}</p>` : ''}
                `;
            
            case 'video':
                return `
                    <h2 class="slide-heading">${slide.title}</h2>
                    <div class="slide-video-container">
                        <video controls class="slide-video">
                            <source src="${slide.videoUrl}" type="video/mp4">
                            Your browser does not support video playback.
                        </video>
                    </div>
                `;
            
            case 'quiz':
                return this.renderQuizSlide(slide);
            
            default:
                return `<div class="slide-content">${slide.content || ''}</div>`;
        }
    }

    renderSlideThumbnail(slide) {
        // Simplified version for thumbnails
        return `
            <div class="thumbnail-preview">
                <h4>${slide.title}</h4>
                ${slide.type === 'image' ? `<img src="${slide.imageUrl}" alt="">` : ''}
            </div>
        `;
    }

    renderQuizSlide(slide) {
        const options = slide.options.map((option, index) => `
            <div class="quiz-option" data-option-index="${index}">
                <input type="radio" name="quiz-${slide.id}" id="option-${index}" value="${index}">
                <label for="option-${index}">${option}</label>
            </div>
        `).join('');

        return `
            <h2 class="slide-heading">${slide.title}</h2>
            <div class="quiz-question">
                <p>${slide.question}</p>
                <div class="quiz-options">
                    ${options}
                </div>
                <button class="btn quiz-submit" onclick="presentation.submitQuizAnswer(${slide.id})">
                    Submit Answer
                </button>
                <div class="quiz-feedback" id="quiz-feedback-${slide.id}"></div>
            </div>
        `;
    }

    showSlide(index) {
        if (index < 0 || index >= this.slides.length) return;

        // Hide all slides
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => slide.classList.remove('active'));

        // Show current slide
        const currentSlideElement = document.querySelector(`[data-slide-index="${index}"]`);
        if (currentSlideElement) {
            currentSlideElement.classList.add('active');
        }

        // Update thumbnails
        const thumbnails = document.querySelectorAll('.slide-thumbnail');
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        
        const currentThumbnail = document.querySelector(`.slide-thumbnail[data-slide-index="${index}"]`);
        if (currentThumbnail) {
            currentThumbnail.classList.add('active');
        }

        this.currentSlide = index;
        this.updateProgress();
        this.updateNavigationButtons();

        // Auto-play videos if present
        this.handleSlideMedia();
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.showSlide(this.currentSlide + 1);
        }
    }

    previousSlide() {
        if (this.currentSlide > 0) {
            this.showSlide(this.currentSlide - 1);
        }
    }

    goToSlide(index) {
        this.showSlide(index);
    }

    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const slideCounter = document.getElementById('slideCounter');

        if (progressBar) {
            const progress = ((this.currentSlide + 1) / this.slides.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        if (slideCounter) {
            slideCounter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');

        if (prevBtn) {
            prevBtn.disabled = this.currentSlide === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentSlide === this.slides.length - 1;
        }
    }

    handleKeyNavigation(event) {
        switch (event.key) {
            case 'ArrowRight':
            case ' ':
                event.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousSlide();
                break;
            case 'Escape':
                this.exitPresentation();
                break;
            case 'f':
            case 'F':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.toggleFullscreen();
                }
                break;
        }
    }

    addTouchSupport() {
        let startX = 0;
        let startY = 0;

        const slidesContainer = document.getElementById('slidesContainer');
        if (!slidesContainer) return;

        slidesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        slidesContainer.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Only respond to horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }
        });
    }

    bindThumbnailClicks() {
        const thumbnailsContainer = document.getElementById('thumbnailsContainer');
        if (thumbnailsContainer) {
            thumbnailsContainer.addEventListener('click', (e) => {
                const thumbnail = e.target.closest('.slide-thumbnail');
                if (thumbnail) {
                    const slideIndex = parseInt(thumbnail.dataset.slideIndex);
                    this.goToSlide(slideIndex);
                }
            });
        }
    }

    handleSlideMedia() {
        const currentSlideElement = document.querySelector('.slide.active');
        if (!currentSlideElement) return;

        // Pause all videos first
        const allVideos = document.querySelectorAll('.slide video');
        allVideos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });

        // Auto-play video in current slide if present
        const currentVideo = currentSlideElement.querySelector('video');
        if (currentVideo) {
            currentVideo.play().catch(() => {
                // Auto-play failed, user interaction required
            });
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    exitPresentation() {
        if (confirm('Are you sure you want to exit the presentation?')) {
            window.history.back();
        }
    }

    async submitQuizAnswer(slideId) {
        const selectedOption = document.querySelector(`input[name="quiz-${slideId}"]:checked`);
        if (!selectedOption) {
            this.showAlert('Please select an answer', 'error');
            return;
        }

        const answerIndex = parseInt(selectedOption.value);
        const slide = this.slides.find(s => s.id === slideId);

        if (!slide) return;

        try {
            const response = await this.auth.apiRequest('/quiz/submit', {
                method: 'POST',
                body: JSON.stringify({
                    slideId: slideId,
                    answer: answerIndex
                })
            });

            if (response && response.ok) {
                const result = await response.json();
                this.showQuizFeedback(slideId, result);
            }
        } catch (error) {
            console.error('Error submitting quiz answer:', error);
            this.showAlert('Error submitting answer', 'error');
        }
    }

    showQuizFeedback(slideId, result) {
        const feedbackElement = document.getElementById(`quiz-feedback-${slideId}`);
        if (!feedbackElement) return;

        const isCorrect = result.correct;
        const feedbackClass = isCorrect ? 'quiz-correct' : 'quiz-incorrect';
        const feedbackText = isCorrect ? 'Correct!' : 'Incorrect. ' + (result.explanation || '');

        feedbackElement.innerHTML = `
            <div class="quiz-feedback-content ${feedbackClass}">
                <strong>${feedbackText}</strong>
            </div>
        `;

        // Disable quiz options
        const quizOptions = document.querySelectorAll(`input[name="quiz-${slideId}"]`);
        quizOptions.forEach(option => option.disabled = true);

        const submitBtn = document.querySelector('.quiz-submit');
        if (submitBtn) submitBtn.disabled = true;
    }

    async saveNotes() {
        const notesTextarea = document.getElementById('presentationNotes');
        if (!notesTextarea) return;

        const notes = notesTextarea.value;
        const urlParams = new URLSearchParams(window.location.search);
        const presentationId = urlParams.get('id');

        try {
            await this.auth.apiRequest('/presentations/notes', {
                method: 'POST',
                body: JSON.stringify({
                    presentationId: presentationId,
                    slideIndex: this.currentSlide,
                    notes: notes
                })
            });
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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

        // Insert alert at the top of presentation container
        const container = document.querySelector('.presentation-container');
        if (container) {
            container.insertBefore(alert, container.firstChild);
        }

        // Auto-remove alert after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.presentation = new Presentation();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Presentation;
}
