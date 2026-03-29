'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('lab_test_orders', 'sampleId', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Unique sample ID for lab processing'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate column name') && !error.message.includes('already exists')) {
        throw error;
      }
      console.log('Column sampleId already exists, skipping.');
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('lab_test_orders', 'sampleId');
    } catch (error) {
      console.log('Error ignoring down migration', error.message);
    }
  }
};
