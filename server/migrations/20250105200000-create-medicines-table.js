'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('medicines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      prescriptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Prescriptions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      medicineName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      dosage: {
        type: Sequelize.STRING,
        allowNull: false
      },
      frequency: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration: {
        type: Sequelize.STRING,
        allowNull: true
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      totalQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      remainingQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
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
    await queryInterface.addIndex('medicines', ['patientId']);
    await queryInterface.addIndex('medicines', ['prescriptionId']);
    await queryInterface.addIndex('medicines', ['isActive']);
    await queryInterface.addIndex('medicines', ['startDate', 'endDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('medicines');
  }
};
