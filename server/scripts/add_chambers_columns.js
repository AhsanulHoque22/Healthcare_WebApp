const { sequelize } = require('../config/database');

async function run() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      await queryInterface.addColumn('doctors', 'chambers', {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      });
      console.log('Added chambers to doctors');
    } catch (e) {
      console.log('Error adding chambers to doctors:', e.message);
    }
    
    try {
      await queryInterface.addColumn('appointments', 'chamber', {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true
      });
      console.log('Added chamber to appointments');
    } catch (e) {
      console.log('Error adding chamber to appointments:', e.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

run();
