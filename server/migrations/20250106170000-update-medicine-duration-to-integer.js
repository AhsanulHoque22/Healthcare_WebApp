'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change duration column from STRING to INTEGER
    await queryInterface.changeColumn('medicines', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Duration in days'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to STRING if needed
    await queryInterface.changeColumn('medicines', 'duration', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
