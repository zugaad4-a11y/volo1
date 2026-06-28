const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require';
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '041_add_customer_wallets.sql');

async function run() {
  console.log('Starting migration 041...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to remote database.');

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
  } finally {
    await client.end();
  }
}

run();
