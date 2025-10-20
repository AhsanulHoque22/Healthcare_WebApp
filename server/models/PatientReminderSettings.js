const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PatientReminderSettings = sequelize.define('PatientReminderSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'patient_id', // Map to snake_case column
    references: {
      model: 'patients',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  morningTime: {
    type: DataTypes.STRING(5), // Format: HH:MM
    allowNull: false,
    defaultValue: '08:00',
    field: 'morning_time' // Map to snake_case column
  },
  lunchTime: {
    type: DataTypes.STRING(5), // Format: HH:MM
    allowNull: false,
    defaultValue: '12:00',
    field: 'lunch_time' // Map to snake_case column
  },
  dinnerTime: {
    type: DataTypes.STRING(5), // Format: HH:MM
    allowNull: false,
    defaultValue: '19:00',
    field: 'dinner_time' // Map to snake_case column
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  notificationEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'notification_enabled' // Map to snake_case column
  },
  reminderMinutesBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15,
    field: 'reminder_minutes_before' // Map to snake_case column
  }
}, {
  tableName: 'patient_reminder_settings',
  timestamps: true,
  underscored: true, // Enable snake_case conversion
  indexes: [
    {
      unique: true,
      fields: ['patient_id'] // Use snake_case for index
    }
  ]
});

module.exports = PatientReminderSettings;
