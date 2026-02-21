'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'notifications',
      'targetRole',
      {
        type: Sequelize.STRING(20),
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'notifications',
      'actionType',
      {
        type: Sequelize.STRING(100),
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'notifications',
      'entityId',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'notifications',
      'entityType',
      {
        type: Sequelize.STRING(50),
        allowNull: true,
      }
    );
    await queryInterface.addIndex('notifications', ['targetRole'], { name: 'notifications_target_role' });
    await queryInterface.addIndex('notifications', ['actionType'], { name: 'notifications_action_type' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('notifications', 'notifications_target_role');
    await queryInterface.removeIndex('notifications', 'notifications_action_type');
    await queryInterface.removeColumn('notifications', 'targetRole');
    await queryInterface.removeColumn('notifications', 'actionType');
    await queryInterface.removeColumn('notifications', 'entityId');
    await queryInterface.removeColumn('notifications', 'entityType');
  }
};
