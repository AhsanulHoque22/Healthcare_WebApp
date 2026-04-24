const { sequelize } = require('./server/config/database');
const { QueryTypes } = require('sequelize');

async function checkData() {
  try {
    console.log('Checking database tables and row counts...');
    
    // Get all tables
    const tablesResponse = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: QueryTypes.SELECT }
    );
    
    const tables = tablesResponse.map(t => t.table_name);
    console.log('Tables found:', tables.join(', '));

    for (const table of tables) {
      const countResponse = await sequelize.query(`SELECT COUNT(*) FROM "${table}"`, { type: QueryTypes.SELECT });
      console.log(`Table "${table}": ${countResponse[0].count} rows`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error checking database:', err);
    process.exit(1);
  }
}

checkData();
