'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('document_cache');
    if (!table.model_version) {
      await queryInterface.addColumn('document_cache', 'model_version', {
        type: Sequelize.STRING(120),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('document_cache');
    if (table.model_version) {
      await queryInterface.removeColumn('document_cache', 'model_version');
    }
  }
};
