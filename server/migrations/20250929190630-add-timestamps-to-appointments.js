'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'started_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when appointment was started (in_progress)'
    });
    
    await queryInterface.addColumn('appointments', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when appointment was completed'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('appointments', 'started_at');
    await queryInterface.removeColumn('appointments', 'completed_at');
  }
};