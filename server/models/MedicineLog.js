const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicineLog = sequelize.define('MedicineLog', {
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
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  medicineName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('Prescribed', 'Discontinued'),
    allowNull: false
  }
}, {
  tableName: 'MedicineLogs',
  timestamps: true
});

module.exports = MedicineLog;
