'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('lab_payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lab_test_orders',
          key: 'id'
        }
      },
      transactionId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      paymentMethod: {
        type: Sequelize.ENUM('bkash', 'bank_transfer', 'offline_cash', 'offline_card'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      gatewayResponse: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Payment gateway response data'
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Admin who processed offline payment'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('lab_payments');
  }
};
