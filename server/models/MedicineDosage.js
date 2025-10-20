const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicineDosage = sequelize.define('MedicineDosage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'medicines',
      key: 'id'
    }
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  takenAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('taken', 'missed', 'skipped'),
    allowNull: false,
    defaultValue: 'taken'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'medicine_reminders',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'medicine_dosages',
  timestamps: true,
  underscored: false // Keep camelCase field names
});

// Define associations
MedicineDosage.associate = (models) => {
  MedicineDosage.belongsTo(models.Medicine, {
    foreignKey: 'medicineId',
    as: 'medicine'
  });
  
  MedicineDosage.belongsTo(models.Patient, {
    foreignKey: 'patientId',
    as: 'patient'
  });
  
  MedicineDosage.belongsTo(models.MedicineReminder, {
    foreignKey: 'reminderId',
    as: 'reminder'
  });
};

module.exports = MedicineDosage;
