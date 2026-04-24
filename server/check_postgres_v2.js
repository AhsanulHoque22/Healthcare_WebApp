require('dotenv').config();
const { sequelize } = require('./config/database');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    const [users] = await sequelize.query('SELECT COUNT(*) FROM users');
    console.log('Users:', users[0]);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}
check();
