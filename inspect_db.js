const { sequelize } = require('./server/config/database');
const { QueryTypes } = require('sequelize');

async function inspectTable() {
  try {
    console.log('Inspecting patients table...');
    const columns = await sequelize.query('SHOW COLUMNS FROM patients', { type: QueryTypes.SELECT });
    console.log('Columns in patients table:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (Null: ${col.Null})`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting table:', err);
    process.exit(1);
  }
}

inspectTable();
