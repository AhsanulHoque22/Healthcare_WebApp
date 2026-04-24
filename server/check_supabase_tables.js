require('dotenv').config();
// Temporarily force Supabase config for this check
process.env.DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres.kalupffchmgcdljjgwbf';
process.env.DB_PASSWORD = 'MynameisRatul12#$';
process.env.DB_NAME = 'postgres';
process.env.DB_DIALECT = 'postgres';

const { sequelize } = require('./config/database');
const models = require('./models');

async function checkSupabase() {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to Supabase');
    
    for (const [name, model] of Object.entries(models)) {
      try {
        const count = await model.count();
        console.log(`Table for model ${name} ("${model.tableName}") exists. Row count: ${count}`);
      } catch (e) {
        console.log(`Table for model ${name} ("${model.tableName}") MISSING or error: ${e.message}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to connect to Supabase:', err.message);
    process.exit(1);
  }
}
checkSupabase();
