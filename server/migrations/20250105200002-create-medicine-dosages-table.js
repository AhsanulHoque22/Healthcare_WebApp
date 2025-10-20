'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('medicine_dosages', {
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
      takenAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      dosage: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('taken', 'missed', 'skipped'),
        allowNull: false,
        defaultValue: 'taken'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reminderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'medicine_reminders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('medicine_dosages', ['medicineId']);
    await queryInterface.addIndex('medicine_dosages', ['patientId']);
    await queryInterface.addIndex('medicine_dosages', ['takenAt']);
    await queryInterface.addIndex('medicine_dosages', ['status']);
    await queryInterface.addIndex('medicine_dosages', ['reminderId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('medicine_dosages');
  }
};
