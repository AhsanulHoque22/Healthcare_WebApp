'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('doctors', 'profile_image', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL or path to doctor profile image'
    });
    
    await queryInterface.addColumn('doctors', 'degrees', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of degrees and qualifications'
    });
    
    await queryInterface.addColumn('doctors', 'awards', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of awards and recognitions'
    });
    
    await queryInterface.addColumn('doctors', 'hospital', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: 'Primary hospital or clinic name'
    });
    
    await queryInterface.addColumn('doctors', 'location', {
      type: Sequelize.STRING(300),
      allowNull: true,
      comment: 'Hospital/clinic address'
    });
    
    await queryInterface.addColumn('doctors', 'chamber_times', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Available chamber times for each day'
    });
    
    await queryInterface.addColumn('doctors', 'languages', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: ['English', 'Bengali'],
      comment: 'Languages spoken by doctor'
    });
    
    await queryInterface.addColumn('doctors', 'services', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Medical services offered'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctors', 'profile_image');
    await queryInterface.removeColumn('doctors', 'degrees');
    await queryInterface.removeColumn('doctors', 'awards');
    await queryInterface.removeColumn('doctors', 'hospital');
    await queryInterface.removeColumn('doctors', 'location');
    await queryInterface.removeColumn('doctors', 'chamber_times');
    await queryInterface.removeColumn('doctors', 'languages');
    await queryInterface.removeColumn('doctors', 'services');
  }
};
