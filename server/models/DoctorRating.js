const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorRating = sequelize.define('DoctorRating', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'appointmentId',
      references: {
        model: 'appointments',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Appointment ID is required'
        }
      }
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patientId',
      references: {
        model: 'patients',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Patient ID is required'
        }
      }
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctorId',
      references: {
        model: 'doctors',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Doctor ID is required'
        }
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Rating must be at least 1'
        },
        max: {
          args: [5],
          msg: 'Rating must be at most 5'
        },
        notNull: {
          msg: 'Rating is required'
        }
      }
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Review must be less than 1000 characters'
        }
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Feedback must be less than 1000 characters'
        }
      }
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    }
}, {
  tableName: 'doctor_ratings',
  timestamps: true,
  underscored: false, // Keep camelCase to match database
  indexes: [
    {
      unique: true,
      fields: ['appointmentId']
    },
    {
      fields: ['doctorId']
    },
    {
      fields: ['patientId']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = DoctorRating;
