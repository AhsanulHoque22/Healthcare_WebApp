'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Change the ENUM to include 'requested' status
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status ENUM('requested', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') 
      NOT NULL DEFAULT 'requested'
    `);
  },

  async down (queryInterface, Sequelize) {
    // Revert back to original ENUM (remove 'requested')
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') 
      NOT NULL DEFAULT 'scheduled'
    `);
  }
};