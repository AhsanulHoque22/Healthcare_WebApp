const { Notification } = require('../models');

const createNotification = async ({
  userId,
  title,
  message,
  type = 'info'
}) => {
  if (!userId) return;

  return await Notification.create({
    userId,
    title,
    message,
    type,
    isRead: false
  });
};

module.exports = {
  createNotification
};