require('dotenv').config();
const { sequelize } = require('./config/database');

async function check() {
  try {
    await sequelize.authenticate();
    const tables = ['users', 'patients', 'doctors', 'appointments', 'prescriptions', 'lab_test_orders', 'medicine'];
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`${table}: ${result[0].count}`);
      } catch (e) {
        console.log(`${table}: Table not found or error: ${e.message}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}
check();
