'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('doctors', 'signature', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL or path to doctor digital signature'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctors', 'signature');
  }
};
