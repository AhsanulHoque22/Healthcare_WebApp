const { Notification } = require('../models');

const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  targetRole,
  actionType,
  entityId,
  entityType,
}) => {
  if (!userId) return;

  const payload = {
    userId,
    title,
    message,
    type,
    isRead: false,
  };
  if (targetRole != null) payload.targetRole = targetRole;
  if (actionType != null) payload.actionType = actionType;
  if (entityId != null) payload.entityId = entityId;
  if (entityType != null) payload.entityType = entityType;

  return await Notification.create(payload);
};

module.exports = {
  createNotification
};