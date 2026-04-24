'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('chat_histories', 'feedback_rating', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('chat_histories', 'feedback_flagged', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('chat_histories', 'feedback_flag_reason', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('chat_histories', 'feedback_rating');
    await queryInterface.removeColumn('chat_histories', 'feedback_flagged');
    await queryInterface.removeColumn('chat_histories', 'feedback_flag_reason');
  }
};
