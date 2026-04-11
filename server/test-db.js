require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('Testing connection to Supabase pooler...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Success! Connected to database.');
    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log('Results:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.code) console.error('Code:', err.code);
  }
}

testConnection();
