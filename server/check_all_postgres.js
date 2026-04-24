require('dotenv').config();
const { sequelize } = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkAll() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    const tablesResponse = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: QueryTypes.SELECT }
    );
    
    const tables = tablesResponse.map(t => t.table_name);
    console.log('Tables found:', tables.join(', '));

    for (const table of tables) {
      if (table.startsWith('pg_')) continue;
      const [countResult] = await sequelize.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`Table "${table}": ${countResult[0].count} rows`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}
checkAll();
