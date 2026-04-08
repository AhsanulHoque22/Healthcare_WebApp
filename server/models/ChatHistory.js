const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatHistory = sequelize.define('ChatHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  intent: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  context: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Stores extracted entities like symptoms, department, etc.'
  },
  availableDoctors: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'available_doctors'
  }
}, {
  tableName: 'chat_histories',
  timestamps: true,
  underscored: true
});

module.exports = ChatHistory;
