// Add missing notification method to utils.js
if (!window.showNotification) {
    window.showNotification = function(message, type = 'info') {
        const container = document.getElementById('notificationContainer') || document.body;
        const notification = document.createElement('div');
        
        const bgColors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        
        notification.style.cssText = `
            background: ${bgColors[type] || bgColors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            max-width: 300px;
        `;
        
        notification.textContent = message;
        container.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    };
}
