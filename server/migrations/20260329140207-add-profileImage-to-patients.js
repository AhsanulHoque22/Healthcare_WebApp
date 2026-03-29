'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('patients', 'profileImage', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    } catch (error) {
      if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
        throw error;
      }
      console.log('Column profileImage already exists in patients table, skipping addition.');
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('patients', 'profileImage');
    } catch (error) {
      console.log('Error or column does not exist:', error.message);
    }
  }
};
