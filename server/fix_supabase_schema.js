require('dotenv').config();
// Force Supabase config
process.env.DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres.kalupffchmgcdljjgwbf';
process.env.DB_PASSWORD = 'MynameisRatul12#$';
process.env.DB_NAME = 'postgres';
process.env.DB_DIALECT = 'postgres';

const { sequelize } = require('./config/database');

async function fixSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Supabase');

    const alterations = [
      // Fix camelCase vs snake_case for aiContext
      { table: 'patients', column: 'ai_context', type: 'JSON' },
      { table: 'doctors', column: 'chambers', type: 'JSON' },
      { table: 'appointments', column: 'chamber', type: 'VARCHAR(255)' }
    ];

    for (const alt of alterations) {
      try {
        await sequelize.query(`ALTER TABLE "${alt.table}" ADD COLUMN "${alt.column}" ${alt.type};`);
        console.log(`Added ${alt.column} to ${alt.table}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`${alt.column} already exists in ${alt.table}`);
        } else {
          console.error(`Error adding ${alt.column} to ${alt.table}:`, e.message);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}
fixSchema();
