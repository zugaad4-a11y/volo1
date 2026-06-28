const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function execute() {
  const host = `aws-0-ap-south-1.pooler.supabase.com`;
  const client = new Client({
    host,
    port: 6543,
    database: 'postgres',
    user: 'postgres.ruavhqfttentcjtmnlct',
    password: 'Volo@1721#$',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database pooler successfully.');

    const migrationPath = path.join(__dirname, '../supabase/migrations/048_remove_wallet_restriction.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration 048...');
    await client.query(sql);
    console.log('Migration 048 executed successfully!');

  } catch (err) {
    console.error('Execution failed:', err);
  } finally {
    await client.end();
  }
}

execute();
