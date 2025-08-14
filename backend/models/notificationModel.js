const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required']
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'presentation_created',
            'presentation_updated', 
            'presentation_reminder',
            'presentation_due_soon',
            'presentation_overdue',
            'assignment_created',
            'assignment_updated',
            'grade_published',
            'course_announcement',
            'system_notification'
        ],
        required: [true, 'Notification type is required']
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    data: {
        // Additional data related to the notification
        presentationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Presentation'
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment'
        },
        url: String, // Direct link to related content
        actionRequired: Boolean // Whether user action is required
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'archived'],
        default: 'unread'
    },
    readAt: Date,
    archivedAt: Date,
    expiresAt: Date // For temporary notifications
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for age of notification
notificationSchema.virtual('age').get(function() {
    return new Date() - this.createdAt;
});

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.createdAt.toLocaleDateString();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
};

// Method to archive notification
notificationSchema.methods.archive = function() {
    this.status = 'archived';
    this.archivedAt = new Date();
    return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
    const notification = new this(notificationData);
    await notification.save();
    
    // You can add real-time notification logic here (e.g., Socket.IO)
    // this.emit('newNotification', notification);
    
    return notification;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({ 
        recipient: userId, 
        status: 'unread' 
    });
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = null,
        type = null
    } = options;

    const query = { recipient: userId };
    
    if (status) query.status = status;
    if (type) query.type = type;

    return this.find(query)
        .populate('sender', 'name email avatar')
        .populate('data.presentationId', 'title')
        .populate('data.courseId', 'name code')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
    return this.updateMany(
        { recipient: userId, status: 'unread' },
        { 
            status: 'read', 
            readAt: new Date() 
        }
    );
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOld = function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['read', 'archived'] }
    });
};

// Pre-save middleware to set expiration for certain types
notificationSchema.pre('save', function(next) {
    // Set expiration for temporary notifications
    if (this.type === 'presentation_reminder' && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    
    next();
});

module.exports = mongoose.model('Notification', notificationSchema);
