'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('patient_reminder_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      morning_time: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '08:00'
      },
      lunch_time: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '12:00'
      },
      dinner_time: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: '19:00'
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notification_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      reminder_minutes_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint on patient_id
    await queryInterface.addIndex('patient_reminder_settings', {
      fields: ['patient_id'],
      unique: true,
      name: 'unique_patient_reminder_settings'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('patient_reminder_settings');
  }
};
