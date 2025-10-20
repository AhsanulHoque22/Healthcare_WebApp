const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount,
  createSampleNotificationsForUser,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// Get all notifications for the authenticated user
router.get('/', getAllNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark a notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

// Create a notification (for admin or system use)
router.post('/', createNotification);

// Create sample notifications for testing
router.post('/sample', createSampleNotificationsForUser);

module.exports = router;
