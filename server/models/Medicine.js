const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medicine = sequelize.define('Medicine', {
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
  prescriptionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Prescriptions',
      key: 'id'
    }
  },
  medicineName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  frequency: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in days'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  remainingQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'doctors',
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
  tableName: 'medicines',
  timestamps: true,
  underscored: false // Keep camelCase field names
});

// Define associations
Medicine.associate = (models) => {
  Medicine.belongsTo(models.Patient, {
    foreignKey: 'patientId',
    as: 'patient'
  });
  
  Medicine.belongsTo(models.Doctor, {
    foreignKey: 'doctorId',
    as: 'doctor'
  });
  
  Medicine.belongsTo(models.Prescription, {
    foreignKey: 'prescriptionId',
    as: 'prescription'
  });
  
  Medicine.hasMany(models.MedicineReminder, {
    foreignKey: 'medicineId',
    as: 'reminders'
  });
  
  Medicine.hasMany(models.MedicineDosage, {
    foreignKey: 'medicineId',
    as: 'dosages'
  });
};

module.exports = Medicine;
