'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('appointments', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 180,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('appointments', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 15,
        max: 120
      }
    });
  }
};
