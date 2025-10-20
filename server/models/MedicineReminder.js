const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicineReminder = sequelize.define('MedicineReminder', {
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
  reminderTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  daysOfWeek: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of days (0-6, Sunday-Saturday) when reminder should be active'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastTriggered: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextTrigger: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'medicine_reminders',
  timestamps: true,
  underscored: false // Keep camelCase field names
});

// Define associations
MedicineReminder.associate = (models) => {
  MedicineReminder.belongsTo(models.Medicine, {
    foreignKey: 'medicineId',
    as: 'medicine'
  });
  
  MedicineReminder.belongsTo(models.Patient, {
    foreignKey: 'patientId',
    as: 'patient'
  });
  
  MedicineReminder.hasMany(models.MedicineDosage, {
    foreignKey: 'reminderId',
    as: 'dosages'
  });
};

module.exports = MedicineReminder;
