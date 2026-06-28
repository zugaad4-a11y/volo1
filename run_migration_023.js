const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require';
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '023_worker_availability.sql');

async function run() {
  console.log('Starting migration 023...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to remote database.');

    // 1. Run ALTER TYPE statements outside a transaction block (PostgreSQL requirement)
    console.log('Altering worker_status and booking_status enums (outside transaction)...');
    try {
      await client.query("ALTER TYPE worker_status ADD VALUE IF NOT EXISTS 'BUSY'");
      await client.query("ALTER TYPE worker_status ADD VALUE IF NOT EXISTS 'VACATION'");
      await client.query("ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'ON_THE_WAY'");
      await client.query("ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'ARRIVED'");
      console.log('Enum alterations completed successfully.');
    } catch (enumErr) {
      console.log('Enum alteration note/error (may already exist):', enumErr.message);
    }

    // 2. Run the rest of the migration inside a transaction block
    console.log('Reading migration file...');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Running migration schema queries...');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Migration schema executed and committed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Schema migration failed, rolled back.', err.message);
      throw err;
    }
  } catch (err) {
    console.error('Migration run failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
