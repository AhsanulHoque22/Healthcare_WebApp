const { Sequelize } = require('sequelize');

// Debug logging for production connectivity
if (process.env.NODE_ENV === 'production') {
  console.log('[Database] Checking connection variables...');
  if (process.env.MYSQL_URL) console.log('[Database] Using MYSQL_URL');
  else if (process.env.MYSQLHOST) console.log('[Database] Using MYSQLHOST:', process.env.MYSQLHOST);
  else console.warn('[Database] WARNING: No Railway MySQL variables found. Falling back to localhost.');
}

const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'healthcare_db';
const dbUser = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const dbPass = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
const dbHost = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);

const options = {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

const sequelize = process.env.MYSQL_URL 
  ? new Sequelize(process.env.MYSQL_URL, options)
  : new Sequelize(dbName, dbUser, dbPass, options);

module.exports = { sequelize };
