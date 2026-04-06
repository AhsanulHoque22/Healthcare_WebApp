'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('doctors', 'chambers', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of chamber objects with schedule'
    });

    await queryInterface.addColumn('appointments', 'chamber', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'The selected chamber for this appointment'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctors', 'chambers');
    await queryInterface.removeColumn('appointments', 'chamber');
  }
};
