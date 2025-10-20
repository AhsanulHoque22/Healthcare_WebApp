'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Rename specialization column to department
    await queryInterface.renameColumn('doctors', 'specialization', 'department');
  },

  async down (queryInterface, Sequelize) {
    // Rename department column back to specialization
    await queryInterface.renameColumn('doctors', 'department', 'specialization');
  }
};
