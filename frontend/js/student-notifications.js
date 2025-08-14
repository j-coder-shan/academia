// Student Notifications JavaScript
class StudentNotifications {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.notifications = [];
        this.unreadCount = 0;
    }

    async loadNotifications() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            console.log('🔔 Loading student notifications...');

            const response = await fetch(`${this.apiUrl}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.notifications = data.notifications || [];
                this.unreadCount = this.notifications.filter(n => !n.isRead).length;
                
                console.log(`📬 Loaded ${this.notifications.length} notifications (${this.unreadCount} unread)`);
                
                this.displayNotifications();
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
        }
    }

    displayNotifications() {
        // Show recent unread notifications as pop-ups
        const recentUnread = this.notifications
            .filter(n => !n.isRead && this.isRecent(n.createdAt))
            .slice(0, 3); // Show only the 3 most recent

        recentUnread.forEach((notification, index) => {
            setTimeout(() => {
                this.showNotificationPopup(notification);
            }, index * 1000); // Stagger the notifications
        });
    }

    showNotificationPopup(notification) {
        // Create notification popup
        const popup = document.createElement('div');
        popup.className = 'notification-popup';
        popup.innerHTML = `
            <div class="notification-header">
                <strong>${notification.title}</strong>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="notification-body">
                ${notification.message.replace(/\n/g, '<br>')}
            </div>
            <div class="notification-actions">
                <button onclick="window.studentNotifications.markAsRead('${notification._id}'); this.closest('.notification-popup').remove();">
                    Mark as Read
                </button>
                ${notification.data?.url ? `<button onclick="window.location.href='${notification.data.url}'; this.closest('.notification-popup').remove();">View</button>` : ''}
            </div>
        `;

        // Add styles
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 350px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            margin-bottom: 10px;
        `;

        // Add internal styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-popup .notification-header {
                background: #007bff;
                color: white;
                padding: 12px 15px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-popup .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notification-popup .notification-body {
                padding: 15px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-line;
            }
            .notification-popup .notification-actions {
                padding: 10px 15px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
            }
            .notification-popup .notification-actions button {
                padding: 6px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                font-size: 12px;
            }
            .notification-popup .notification-actions button:hover {
                background: #f8f9fa;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(popup);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (popup && popup.parentNode) {
                popup.remove();
            }
        }, 10000);
    }

    async markAsRead(notificationId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${this.apiUrl}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Update local notification
            const notification = this.notifications.find(n => n._id === notificationId);
            if (notification) {
                notification.isRead = true;
                this.unreadCount = this.notifications.filter(n => !n.isRead).length;
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
        }
    }

    updateNotificationBadge() {
        // Update notification badge if it exists
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
        }
    }

    isRecent(dateString) {
        const notificationDate = new Date(dateString);
        const now = new Date();
        const hoursDiff = (now - notificationDate) / (1000 * 60 * 60);
        return hoursDiff <= 24; // Consider notifications from last 24 hours as recent
    }
}

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentNotifications = new StudentNotifications();
    window.studentNotifications.loadNotifications();
    
    // Refresh notifications every 5 minutes
    setInterval(() => {
        window.studentNotifications.loadNotifications();
    }, 5 * 60 * 1000);
});
