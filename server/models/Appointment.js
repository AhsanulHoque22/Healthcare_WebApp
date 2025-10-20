const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 180, // 3 hours for chamber blocks
    validate: {
      min: 60,
      max: 240
    }
  },
  status: {
    type: DataTypes.ENUM('requested', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
    allowNull: false,
    defaultValue: 'requested'
  },
  serialNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Daily serial number for this doctor on this date'
  },
  type: {
    type: DataTypes.ENUM('in_person', 'telemedicine', 'follow_up'),
    allowNull: false,
    defaultValue: 'in_person'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  meetingLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when appointment was started (in_progress)'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when appointment was completed'
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true
});

module.exports = Appointment;
