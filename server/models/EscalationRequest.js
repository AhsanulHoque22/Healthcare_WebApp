const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EscalationRequest = sequelize.define('EscalationRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
  conversationId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'conversation_id',
  },
  chatHistoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'chat_history_id',
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'user_message',
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'ai_response',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'assigned', 'resolved']] },
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'admin_notes',
  },
}, {
  tableName: 'escalation_requests',
  timestamps: true,
  underscored: true,
});

module.exports = EscalationRequest;
