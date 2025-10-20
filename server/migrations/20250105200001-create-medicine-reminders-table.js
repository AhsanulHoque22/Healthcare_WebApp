'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('medicine_reminders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      medicineId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'medicines',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reminderTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      daysOfWeek: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of days (0-6, Sunday-Saturday) when reminder should be active'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastTriggered: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextTrigger: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('medicine_reminders', ['medicineId']);
    await queryInterface.addIndex('medicine_reminders', ['patientId']);
    await queryInterface.addIndex('medicine_reminders', ['isActive']);
    await queryInterface.addIndex('medicine_reminders', ['nextTrigger']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('medicine_reminders');
  }
};
