const { Notification } = require('../models');

// Create a notification for a user
const createNotification = async (userId, title, message, type = 'info') => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create sample notifications for testing
const createSampleNotifications = async (userId) => {
  try {
    const sampleNotifications = [
      {
        title: 'Welcome to HealthCare Pro!',
        message: 'Thank you for joining our healthcare platform. Your account has been successfully created.',
        type: 'success'
      },
      {
        title: 'Appointment Reminder',
        message: 'You have an appointment with Dr. Smith scheduled for tomorrow at 2:00 PM.',
        type: 'info'
      },
      {
        title: 'Lab Results Available',
        message: 'Your recent lab test results are now available for review.',
        type: 'info'
      },
      {
        title: 'Prescription Ready',
        message: 'Your prescription has been approved and is ready for pickup.',
        type: 'success'
      },
      {
        title: 'Payment Due',
        message: 'Your recent lab test payment is due. Please complete the payment to avoid any delays.',
        type: 'warning'
      }
    ];

    const notifications = [];
    for (const notificationData of sampleNotifications) {
      const notification = await createNotification(
        userId,
        notificationData.title,
        notificationData.message,
        notificationData.type
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createSampleNotifications,
};
