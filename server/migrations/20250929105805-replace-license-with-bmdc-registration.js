'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop all existing unique indexes on license_number
    const indexes = await queryInterface.showIndex('doctors');
    const licenseIndexes = indexes.filter(idx => 
      idx.name.includes('license_number') && idx.unique
    );
    
    for (const index of licenseIndexes) {
      try {
        await queryInterface.removeIndex('doctors', index.name);
      } catch (error) {
        console.log(`Index ${index.name} already removed or doesn't exist`);
      }
    }
    
    // Rename the column from license_number to bmdc_registration_number
    await queryInterface.renameColumn('doctors', 'license_number', 'bmdc_registration_number');
    
    // Add unique constraint to bmdc_registration_number
    await queryInterface.addIndex('doctors', ['bmdc_registration_number'], {
      unique: true,
      name: 'doctors_bmdc_registration_number'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the unique constraint on bmdc_registration_number
    await queryInterface.removeIndex('doctors', 'doctors_bmdc_registration_number');
    
    // Rename the column back from bmdc_registration_number to license_number
    await queryInterface.renameColumn('doctors', 'bmdc_registration_number', 'license_number');
    
    // Add back the unique constraint on license_number
    await queryInterface.addIndex('doctors', ['license_number'], {
      unique: true,
      name: 'doctors_license_number'
    });
  }
};
