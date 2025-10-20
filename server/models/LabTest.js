const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabTest = sequelize.define('LabTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'category'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price'
  },
  sampleType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'sampleType'
  },
  preparationInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'preparationInstructions'
  },
  reportDeliveryTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Hours required for report',
    field: 'reportDeliveryTime'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'isActive'
  }
}, {
  tableName: 'lab_tests',
  timestamps: true,
  underscored: false,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = LabTest;
