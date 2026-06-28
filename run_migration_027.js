const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require';
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '027_assignment_schema.sql');

async function run() {
  console.log('Starting migration 027...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to remote database.');

    // 1. Run ALTER TYPE statements outside a transaction block
    console.log('Altering enums (outside transaction)...');
    try {
      await client.query("ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'MANUAL_ASSIGNMENT_REQUIRED'");
      await client.query("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_STARTED'");
      await client.query("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_BROADCAST'");
      await client.query("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_ACCEPTED'");
      await client.query("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_REJECTED'");
      await client.query("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_FAILED'");
      await client.query("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_MANUAL_REQUIRED'");
      console.log('Enum alterations completed successfully.');
    } catch (enumErr) {
      console.log('Enum alteration note/error (may already exist):', enumErr.message);
    }

    // 2. Read the migration file and filter out the ALTER TYPE statements we already ran
    console.log('Reading migration file...');
    let sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Remove the ALTER TYPE lines so we don't try to run them inside the transaction
    sql = sql.replace(/ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'MANUAL_ASSIGNMENT_REQUIRED';/gi, '-- Alter run outside txn');
    sql = sql.replace(/ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_STARTED';/gi, '-- Alter run outside txn');
    sql = sql.replace(/ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_BROADCAST';/gi, '-- Alter run outside txn');
    sql = sql.replace(/ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_ACCEPTED';/gi, '-- Alter run outside txn');
    sql = sql.replace(/ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_REJECTED';/gi, '-- Alter run outside txn');
    sql = sql.replace(/ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_FAILED';/gi, '-- Alter run outside txn');
    sql = sql.replace(/ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ASSIGNMENT_MANUAL_REQUIRED';/gi, '-- Alter run outside txn');

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
  } finally {
    await client.end();
  }
}

run();
