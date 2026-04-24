'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // PostgreSQL supports adding a value to an existing ENUM safely
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_chat_histories_role" ADD VALUE IF NOT EXISTS 'summary'`
    );
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL does not support removing ENUM values without recreating the type.
    // This is intentional — the down migration is a no-op.
    console.log('Down migration: ENUM value removal is not supported in PostgreSQL. Skipping.');
  }
};
