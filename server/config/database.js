const { Sequelize } = require('sequelize');

// ============================================================
// DATABASE CONFIGURATION — Supabase (PostgreSQL)
// ============================================================
console.log('[Database] Initializing Supabase/PostgreSQL connection...');

const dbDialect = process.env.DB_DIALECT || 'postgres';
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'postgres';
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;

if (process.env.DATABASE_URL) {
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('[Database] Using DATABASE_URL:', maskedUrl);
} else {
  console.log('[Database] Using individual connection parameters:');
  console.log('  - Host:', dbHost);
  console.log('  - Port:', dbPort);
  console.log('  - User:', dbUser);
  console.log('  - DB Name:', dbName);
  console.log('  - Dialect:', dbDialect);
  
  if (!dbUser || !dbUser.includes('.')) {
    console.warn('[Database] WARNING: DB_USER does not contain a dot. Supabase pooler requires "postgres.project-ref"');
  }
}

// SSL is required for Supabase
const sslEnabled = process.env.DB_SSL === 'true' || dbDialect === 'postgres';

const options = {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: sslEnabled
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

// Prefer individual parameters for better stability with special characters (#, $)
// Fall back to DATABASE_URL only if individual core params are missing
const sequelize = (dbHost && dbUser && dbPass)
  ? new Sequelize(dbName, dbUser, dbPass, options)
  : process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, options)
    : new Sequelize(dbName, dbUser, dbPass, options);

module.exports = { sequelize };
