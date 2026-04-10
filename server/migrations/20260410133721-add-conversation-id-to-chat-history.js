'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('chat_histories', 'conversation_id', {
      type: Sequelize.STRING,
      allowNull: true,
      index: true
    });
    await queryInterface.addColumn('chat_histories', 'title', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('chat_histories', 'conversation_id');
    await queryInterface.removeColumn('chat_histories', 'title');
  }
};
