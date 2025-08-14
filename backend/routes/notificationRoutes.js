const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    createNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', protect, getUnreadCount);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', protect, markAllAsRead);

// @route   GET /api/notifications
// @desc    Get notifications for user
// @access  Private
router.get('/', protect, getNotifications);

// @route   POST /api/notifications
// @desc    Create notification
// @access  Private (Admin/System)
router.post('/', protect, createNotification);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, markAsRead);

// @route   PUT /api/notifications/:id/archive
// @desc    Archive notification
// @access  Private
router.put('/:id/archive', protect, archiveNotification);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, deleteNotification);

module.exports = router;
