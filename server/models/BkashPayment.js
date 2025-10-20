const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BkashPayment = sequelize.define('BkashPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paymentId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'bKash payment ID'
  },
  trxId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'bKash transaction ID'
  },
  orderId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Our internal order ID'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Payment amount in BDT'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'BDT'
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'REFUNDED',
      'PARTIAL_REFUND'
    ),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  transactionStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'bKash transaction status'
  },
  customerMsisdn: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Customer mobile number'
  },
  paymentExecuteTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Payment execution time from bKash'
  },
  callbackData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Callback data from bKash'
  },
  refundTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Refund transaction ID if refunded'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Refund amount'
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for refund'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
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
  labTestOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'lab_test_orders',
      key: 'id'
    }
  },
  testName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Name of the lab test'
  }
}, {
  tableName: 'bkash_payments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['payment_id']
    },
    {
      fields: ['order_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = BkashPayment;
