'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'serial_number', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Daily serial number for this doctor on this date'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('appointments', 'serial_number');
  }
};
