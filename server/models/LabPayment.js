const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabPayment = sequelize.define('LabPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'orderId',
    references: {
      model: 'lab_test_orders',
      key: 'id'
    }
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('bkash', 'bank_transfer', 'offline_cash', 'offline_card'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  gatewayResponse: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Payment gateway response data'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin who processed offline payment'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'lab_payments',
  timestamps: true,
  underscored: false
});

module.exports = LabPayment;
