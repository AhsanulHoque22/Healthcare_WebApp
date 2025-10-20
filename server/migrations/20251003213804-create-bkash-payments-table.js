'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bkash_payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      payment_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'bKash payment ID'
      },
      trx_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'bKash transaction ID'
      },
      order_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Our internal order ID'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Payment amount in BDT'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'BDT'
      },
      status: {
        type: Sequelize.ENUM(
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
      transaction_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'bKash transaction status'
      },
      customer_msisdn: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Customer mobile number'
      },
      payment_execute_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Payment execution time from bKash'
      },
      callback_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Callback data from bKash'
      },
      refund_transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Refund transaction ID if refunded'
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Refund amount'
      },
      refund_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for refund'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      prescription_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Prescriptions',
          key: 'id'
        }
      },
      lab_test_order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'lab_test_orders',
          key: 'id'
        }
      },
      test_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Name of the lab test'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('bkash_payments', ['payment_id']);
    await queryInterface.addIndex('bkash_payments', ['order_id']);
    await queryInterface.addIndex('bkash_payments', ['user_id']);
    await queryInterface.addIndex('bkash_payments', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bkash_payments');
  }
};