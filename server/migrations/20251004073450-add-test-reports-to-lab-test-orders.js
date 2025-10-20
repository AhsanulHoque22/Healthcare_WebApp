'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('lab_test_orders', 'testReports', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Array of uploaded test report files with metadata'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('lab_test_orders', 'testReports');
  }
};
