const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

async function verify() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const tables = ['users', 'patients', 'doctors', 'appointments', 'Prescriptions'];
    console.log('📊 Current Supabase Data Counts:');
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  - ${table}: ${res.rows[0].count} rows`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

verify();
