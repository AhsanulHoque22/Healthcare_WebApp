'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('escalation_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      conversation_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      chat_history_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'chat_histories', key: 'id' },
        onDelete: 'SET NULL',
      },
      user_message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ai_response: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
    await queryInterface.addIndex('escalation_requests', ['user_id']);
    await queryInterface.addIndex('escalation_requests', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('escalation_requests');
  },
};
