const { Notification } = require('../models');
const { Op } = require('sequelize');
const { createSampleNotifications } = require('../utils/notificationHelper');

// Get all notifications for the authenticated user
const getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where: {
        userId: req.user.id,
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.count / limit),
          totalNotifications: notifications.count,
          hasNext: offset + notifications.rows.length < notifications.count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.update({ isRead: true });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Create a notification (admin only or system)
const createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// Get unread count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
};

// Create sample notifications for testing
const createSampleNotificationsForUser = async (req, res, next) => {
  try {
    const notifications = await createSampleNotifications(req.user.id);
    
    res.json({
      success: true,
      message: 'Sample notifications created successfully',
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount,
  createSampleNotificationsForUser,
};
