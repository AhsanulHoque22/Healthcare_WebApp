const { sequelize } = require('./server/config/database');

async function testConn() {
  try {
    await sequelize.authenticate();
    console.log('Connection OK');
    const [results] = await sequelize.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', results[0].count || results[0].count_all);
    process.exit(0);
  } catch (err) {
    console.error('Conn failed:', err.message);
    process.exit(1);
  }
}
testConn();
