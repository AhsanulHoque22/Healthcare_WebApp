'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('lab_test_orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        }
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        }
      },
      appointmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id'
        }
      },
      testIds: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of test IDs'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paidAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      dueAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM('online', 'offline', 'mixed'),
        allowNull: true
      },
      sampleCollectionDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expectedResultDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resultUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verifiedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('lab_test_orders');
  }
};
