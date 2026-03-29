require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "healthcare_db",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql"
  },
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "healthcare_db_test",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql"
  },
  production: {
    use_env_variable: process.env.MYSQL_URL ? 'MYSQL_URL' : undefined,
    username: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "healthcare_db",
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || "3306", 10),
    dialect: "mysql",
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}
  }
};