const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

const BACKUP_FILE = path.join(__dirname, '../../railway_backup_20260411_003441/database_dump.sql');

async function migrateData() {
  console.log('🚀 Starting Data Migration from Railway to Supabase...');
  
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
    console.log('✅ Connected to Supabase.');

    // 1. Disable triggers to allow out-of-order inserts
    console.log('⏳ Disabling constraints...');
    await client.query("SET session_replication_role = 'replica';");

    const sqlContent = fs.readFileSync(BACKUP_FILE, 'utf8');
    const lines = sqlContent.split('\n');
    
    let currentTable = '';
    let insertCount = 0;

    for (let line of lines) {
      // Look for INSERT statements
      if (line.startsWith('INSERT INTO')) {
        // Convert MySQL backticks to PG double quotes
        let pgQuery = line.replace(/`/g, '"');
        
        // Handle MySQL boolean (tinyint) to PG boolean if necessary
        // Most PG versions handle 0/1 for booleans if requested, 
        // but we've already set up the schema. 
        // Let's ensure the table name is correct (Prescriptions vs prescriptions)
        
        try {
          await client.query(pgQuery);
          insertCount++;
          if (insertCount % 50 === 0) console.log(`  Processed ${insertCount} insert groups...`);
        } catch (err) {
          console.error(`❌ Error inserting into ${pgQuery.substring(0, 50)}...`);
          console.error('Error:', err.message);
        }
      }
    }

    // 2. Re-enable triggers
    console.log('⏳ Re-enabling constraints...');
    await client.query("SET session_replication_role = 'origin';");
    
    // 3. Reset Sequences (Very Important for AUTO_INCREMENT)
    console.log('⏳ Resetting Postgres Sequences...');
    const tables = [
      'users', 'patients', 'doctors', 'appointments', 'Prescriptions', 
      'medical_records', 'medicines', 'medicine_dosages', 'medicine_reminders',
      'lab_tests', 'lab_test_orders', 'lab_payments', 'notifications',
      'chat_histories', 'WebsiteReview', 'MedicineLogs', 'doctor_ratings'
    ];

    for (const table of tables) {
      try {
        const res = await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1)) FROM "${table}";`);
        console.log(`  Reset sequence for ${table}`);
      } catch (e) {
        // Some tables might not have 'id' or might have failed
      }
    }

    console.log(`\n🎉 Migration Complete! Total insert groups processed: ${insertCount}`);

  } catch (error) {
    console.error('💥 Critical Migration Error:', error);
  } finally {
    await client.end();
  }
}

migrateData();
