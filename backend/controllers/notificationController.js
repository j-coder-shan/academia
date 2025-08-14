const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            type
        };

        const notifications = await Notification.getUserNotifications(req.user._id, options);
        const unreadCount = await Notification.getUnreadCount(req.user._id);
        const total = await Notification.countDocuments({ recipient: req.user._id });

        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user._id);
        
        res.json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count',
            error: error.message
        });
    }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if user owns this notification
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await notification.markAsRead();

        res.json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification',
            error: error.message
        });
    }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    try {
        const result = await Notification.markAllAsRead(req.user._id);

        res.json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notifications',
            error: error.message
        });
    }
});

// @desc    Archive notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
const archiveNotification = asyncHandler(async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if user owns this notification
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await notification.archive();

        res.json({
            success: true,
            message: 'Notification archived',
            notification
        });
    } catch (error) {
        console.error('Error archiving notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error archiving notification',
            error: error.message
        });
    }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if user owns this notification
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message
        });
    }
});

// @desc    Create notification (admin/system use)
// @route   POST /api/notifications
// @access  Private (Admin/System)
const createNotification = asyncHandler(async (req, res) => {
    try {
        const {
            recipient,
            type,
            title,
            message,
            data,
            priority = 'normal'
        } = req.body;

        if (!recipient || !type || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const notification = await Notification.createNotification({
            recipient,
            sender: req.user._id,
            type,
            title,
            message,
            data,
            priority
        });

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating notification',
            error: error.message
        });
    }
});

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    createNotification
};
