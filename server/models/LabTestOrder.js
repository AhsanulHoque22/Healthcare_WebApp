const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabTestOrder = sequelize.define('LabTestOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
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
    allowNull: true,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'appointments',
      key: 'id'
    }
  },
  testIds: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of test IDs'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  dueAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'ordered',
      'verified', 
      'payment_pending',
      'payment_partial',
      'payment_completed',
      'sample_collection_scheduled',
      'sample_collected',
      'processing',
      'results_ready',
      'completed',
      'cancelled'
    ),
    defaultValue: 'ordered'
  },
  paymentMethod: {
    type: DataTypes.ENUM('online', 'offline', 'mixed'),
    allowNull: true
  },
  sampleCollectionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expectedResultDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resultUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at'
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'verified_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sampleId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Unique sample ID for lab processing'
  },
  testReports: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of uploaded test report files with metadata'
  },
}, {
  tableName: 'lab_test_orders',
  timestamps: true,
  underscored: false, // Disable underscored for this model since migration created camelCase columns
  hooks: {
    beforeCreate: async (order) => {
      // Generate unique order number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      order.orderNumber = `LAB-${timestamp}-${random}`;
    }
  }
});

module.exports = LabTestOrder;
