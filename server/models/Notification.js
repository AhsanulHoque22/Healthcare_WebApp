const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userId',
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
    allowNull: false,
    defaultValue: 'info',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'isRead',
  },
  targetRole: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'targetRole',
  },
  actionType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'actionType',
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'entityId',
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'entityType',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'createdAt',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updatedAt',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['userId', 'isRead'],
    },
    {
      fields: ['createdAt'],
    },
    {
      fields: ['targetRole'],
    },
    {
      fields: ['actionType'],
    },
  ],
});

module.exports = Notification;
