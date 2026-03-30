const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
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
  bloodType: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergencyContact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emergencyPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  insuranceProvider: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  insuranceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  medicalHistory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentMedications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicalDocuments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // New medical fields
  height: {
    type: DataTypes.DECIMAL(5, 2), // in cm
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2), // in kg
    allowNull: true
  },
  bloodPressure: {
    type: DataTypes.STRING(20), // e.g., "120/80"
    allowNull: true
  },
  pulse: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  chronicConditions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pastSurgeries: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  familyMedicalHistory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  smokingStatus: {
    type: DataTypes.ENUM('never', 'former', 'current'),
    allowNull: true
  },
  alcoholConsumption: {
    type: DataTypes.ENUM('never', 'occasional', 'regular'),
    allowNull: true
  },
  physicalActivity: {
    type: DataTypes.ENUM('sedentary', 'moderate', 'active'),
    allowNull: true
  }
}, {
  tableName: 'patients'
});

module.exports = Patient;
