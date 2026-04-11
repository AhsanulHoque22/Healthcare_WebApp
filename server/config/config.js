require('dotenv').config();

function buildConfig(defaultDatabase) {
  const dialect = process.env.DB_DIALECT || 'postgres';
  const common = {
    dialect,
    seederStorage: 'sequelize',
    migrationStorage: 'sequelize',
    logging: false
  };

  const sslEnabled = process.env.DB_SSL === 'true' || dialect === 'postgres';
  if (sslEnabled) {
    common.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  if (process.env.DATABASE_URL) {
    return {
      ...common,
      use_env_variable: 'DATABASE_URL'
    };
  }

  return {
    ...common,
    username: process.env.DB_USER || undefined,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || defaultDatabase,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || (dialect === 'postgres' ? '5432' : '3306'), 10)
  };
}

module.exports = {
  development: buildConfig('postgres'),
  test: buildConfig('postgres'),
  production: buildConfig('postgres')
};
