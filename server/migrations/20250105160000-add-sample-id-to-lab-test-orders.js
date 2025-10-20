'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('lab_test_orders', 'sampleId', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Unique sample ID for lab processing'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('lab_test_orders', 'sampleId');
  }
};
