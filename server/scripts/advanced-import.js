const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

const BACKUP_FILE = path.join(__dirname, '../../railway_backup_20260411_003441/database_dump.sql');

const BOOLEAN_COLUMNS = [
  'is_active', 'is_verified', 'isActive', 'is_private', 
  'isRead', 'isAnonymous', 'enabled', 'email_verified'
];

async function migrateData() {
  console.log('🚀 Starting Robust Data Migration...');
  
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
    
    console.log('⏳ Patching schema...');
    await client.query('ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "chamber" VARCHAR(255);');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN DEFAULT FALSE;');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMPTZ;');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image" VARCHAR(500);');

    await client.query("SET session_replication_role = 'replica';");

    const sqlContent = fs.readFileSync(BACKUP_FILE, 'utf8');
    const tablesData = sqlContent.split(/DROP TABLE IF EXISTS/);

    for (const section of tablesData) {
      if (!section.includes('CREATE TABLE')) continue;

      const tableNameMatch = section.match(/CREATE TABLE `([^`]+)`/);
      if (!tableNameMatch) continue;
      const tableName = tableNameMatch[1];
      
      // IMPROVED: Extract ONLY column names (skip KEY, PRIMARY, CONSTRAINT)
      const lines = section.split('\n');
      const columns = [];
      for (let line of lines) {
        const colMatch = line.match(/^\s+`([^`]+)`\s+(?:int|varchar|text|enum|datetime|date|tinyint|decimal|json|longtext|time|timestamp)/i);
        if (colMatch) {
          columns.push(colMatch[1]);
        }
      }
      
      if (columns.length === 0) continue;
      console.log(`📦 Processing table: ${tableName} (${columns.length} columns)`);

      const insertMatches = [...section.matchAll(/INSERT INTO `[^`]+` VALUES\s*(.+);/g)];
      
      for (const match of insertMatches) {
        const rows = parseValuesString(match[1]);
        
        for (const row of rows) {
          if (row.length !== columns.length) {
            console.warn(`  ⚠️ Column mismatch in ${tableName}: Expected ${columns.length}, got ${row.length}.`);
            continue;
          }

          const pgCols = columns.map(c => `"${c}"`).join(', ');
          const pgVals = row.map((val, idx) => {
            const colName = columns[idx];
            let cleanVal = val.trim();
            
            if (BOOLEAN_COLUMNS.includes(colName)) {
              if (cleanVal === '0') return 'FALSE';
              if (cleanVal === '1') return 'TRUE';
            }

            if (cleanVal.toUpperCase() === 'NULL') return 'NULL';
            
            if (cleanVal.startsWith("'") && cleanVal.endsWith("'")) {
              let inner = cleanVal.substring(1, cleanVal.length - 1);
              inner = inner.replace(/\\'/g, "''");
              inner = inner.replace(/\\"/g, '"');
              inner = inner.replace(/\\\\/g, "\\");
              return `'${inner}'`;
            }

            return cleanVal;
          }).join(', ');

          const query = `INSERT INTO "${tableName}" (${pgCols}) VALUES (${pgVals}) ON CONFLICT DO NOTHING;`;
          
          try {
            await client.query(query);
          } catch (err) {
            if (!err.message.includes('relation') && !err.message.includes('column')) {
              console.error(`  ❌ Error in ${tableName}: ${err.message}`);
            }
          }
        }
      }
    }

    await client.query("SET session_replication_role = 'origin';");

    // Reset Sequences (Very Important for AUTO_INCREMENT)
    console.log('⏳ Resetting Postgres Sequences...');
    const tables = [
      'users', 'patients', 'doctors', 'appointments', 'Prescriptions', 
      'medical_records', 'medicines', 'medicine_dosages', 'medicine_reminders',
      'lab_tests', 'lab_test_orders', 'lab_payments', 'notifications',
      'chat_histories', 'WebsiteReview', 'MedicineLogs', 'doctor_ratings'
    ];

    for (const table of tables) {
      try {
        await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1)) FROM "${table}";`);
        console.log(`  Reset sequence for ${table}`);
      } catch (e) {
        // Silently skip tables without sequences or those that fail
      }
    }

    console.log('\n🎉 Finished Data Migration!');

  } catch (error) {
    console.error('💥 Critical Error:', error);
  } finally {
    await client.end();
  }
}

function parseValuesString(str) {
  const results = [];
  let currentArray = [];
  let currentVal = '';
  let inString = false;
  let inGroup = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '(' && !inString && !inGroup) {
      inGroup = true;
      currentArray = [];
      continue;
    }

    if (inGroup) {
      if (char === "'" || char === '"') {
        if (!inString) {
          inString = true;
          quoteChar = char;
          currentVal += char;
        } else if (char === quoteChar && (i === 0 || str[i - 1] !== '\\')) {
          inString = false;
          currentVal += char;
        } else {
          currentVal += char;
        }
      } else if (char === ',' && !inString) {
        currentArray.push(currentVal);
        currentVal = '';
      } else if (char === ')' && !inString) {
        currentArray.push(currentVal);
        results.push(currentArray);
        inGroup = false;
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  return results;
}

migrateData();
