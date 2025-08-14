// Utility functions for the Academia LMS frontend

// Error handling utility
function handleAPIError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);
    
    // Handle rate limiting errors
    if (error.status === 429) {
        const retryAfter = error.retryAfter || 60;
        return {
            message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
            type: 'rate-limit',
            retryAfter: retryAfter
        };
    }
    
    // Handle network errors
    if (!error.response && error.message === 'Failed to fetch') {
        return {
            message: 'Unable to connect to server. Please check your internet connection and try again.',
            type: 'network',
            retryAfter: 5
        };
    }
    
    // Handle authentication errors
    if (error.status === 401) {
        return {
            message: 'Your session has expired. Please log in again.',
            type: 'auth',
            redirect: '/frontend/html/login.html'
        };
    }
    
    // Handle validation errors
    if (error.status === 400) {
        const errorData = error.data || {};
        return {
            message: errorData.message || 'Invalid data provided. Please check your input.',
            type: 'validation',
            details: errorData.details
        };
    }
    
    // Handle server errors
    if (error.status >= 500) {
        return {
            message: 'Server error. Please try again later.',
            type: 'server',
            retryAfter: 30
        };
    }
    
    // Handle other errors
    const errorData = error.data || error;
    return {
        message: errorData.message || defaultMessage,
        type: 'general'
    };
}

// Display error message to user
function showErrorMessage(error, containerId = 'errorContainer') {
    const errorInfo = handleAPIError(error);
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error('Error container not found:', containerId);
        alert(errorInfo.message);
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = `alert alert-danger ${errorInfo.type}-error`;
    errorDiv.innerHTML = `
        <div class="error-content">
            <strong>Error:</strong> ${errorInfo.message}
            ${errorInfo.retryAfter ? `<div class="retry-info">You can try again in ${errorInfo.retryAfter} seconds.</div>` : ''}
        </div>
    `;
    
    container.appendChild(errorDiv);
    
    // Auto-hide after delay (except for rate limit errors)
    if (errorInfo.type !== 'rate-limit') {
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    // Handle redirects
    if (errorInfo.redirect) {
        setTimeout(() => {
            window.location.href = errorInfo.redirect;
        }, 2000);
    }
}

// Display success message to user
function showSuccessMessage(message, containerId = 'successContainer') {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.log('Success:', message);
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create success element
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
        <div class="success-content">
            <strong>Success:</strong> ${message}
        </div>
    `;
    
    container.appendChild(successDiv);
    
    // Auto-hide after delay
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Enhanced fetch with better error handling
async function apiRequest(url, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            defaultHeaders.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                data: data,
                response: response
            };
        }
        
        return data;
    } catch (error) {
        // Re-throw with additional information
        throw {
            ...error,
            url: url,
            options: options
        };
    }
}

// Debounce function to prevent rapid API calls
function debounce(func, wait) {
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

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate required fields
function validateRequiredFields(data, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }
    
    return missing;
}

// Show loading state
function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
    }
}

// Hide loading state
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const loadingState = container.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }
}

// Centralized Notification System
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
    }

    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'global-notification-container';
            document.body.appendChild(this.container);
        }
    }

    addStyles() {
        if (!document.querySelector('.global-notification-styles')) {
            const style = document.createElement('style');
            style.className = 'global-notification-styles';
            style.textContent = `
                #global-notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: none;
                    max-width: 450px;
                }
                .global-notification {
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
                    animation: slideInGlobal 0.4s ease-out;
                    pointer-events: auto;
                    word-wrap: break-word;
                    line-height: 1.5;
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
                    backdrop-filter: blur(8px);
                    position: relative;
                }
                .global-notification-success { 
                    background: linear-gradient(135deg, #28a745, #20c997);
                    border-left: 4px solid #1e7e34;
                }
                .global-notification-error { 
                    background: linear-gradient(135deg, #dc3545, #e74c3c);
                    border-left: 4px solid #bd2130;
                }
                .global-notification-warning { 
                    background: linear-gradient(135deg, #ffc107, #f39c12);
                    color: #212529;
                    border-left: 4px solid #e0a800;
                }
                .global-notification-info { 
                    background: linear-gradient(135deg, #17a2b8, #3498db);
                    border-left: 4px solid #117a8b;
                }
                .global-notification span {
                    flex: 1;
                    font-size: 14px;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .global-notification i:first-child {
                    font-size: 18px;
                    margin-top: 2px;
                    flex-shrink: 0;
                }
                .global-notification-close {
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
                .global-notification-close:hover {
                    opacity: 1;
                    background: rgba(255,255,255,0.2);
                    transform: scale(1.1);
                }
                @keyframes slideInGlobal {
                    from { 
                        transform: translateX(100%); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                }
                @keyframes slideOutGlobal {
                    from { 
                        transform: translateX(0); 
                        opacity: 1; 
                        max-height: 100px; 
                        margin-bottom: 12px; 
                    }
                    to { 
                        transform: translateX(100%); 
                        opacity: 0; 
                        max-height: 0; 
                        margin-bottom: 0; 
                    }
                }
                .global-notification.removing {
                    animation: slideOutGlobal 0.3s ease-out forwards;
                }
            `;
            document.head.appendChild(style);
        }
    }

    formatMessage(message, type) {
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
        
        return message;
    }

    show(message, type = 'info', duration = 5000) {
        this.createContainer();
        
        // Format message for better readability
        const formattedMessage = this.formatMessage(message, type);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `global-notification global-notification-${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${iconMap[type] || iconMap.info}"></i>
            <span>${formattedMessage}</span>
            <button class="global-notification-close" title="Dismiss">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close functionality
        const closeBtn = notification.querySelector('.global-notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });
        
        // Add to container
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        return notification;
    }

    remove(notification) {
        if (!notification || !notification.parentElement) return;
        
        // Add removing animation
        notification.classList.add('removing');
        
        // Remove from notifications array
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        
        // Remove after animation completes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Create global instance
const globalNotifications = new NotificationManager();

// Export functions for use in other files
window.AcademiaUtils = {
    handleAPIError,
    showErrorMessage,
    showSuccessMessage,
    apiRequest,
    debounce,
    formatDate,
    validateRequiredFields,
    showLoading,
    hideLoading,
    notifications: globalNotifications
};
