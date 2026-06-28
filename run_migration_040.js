const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require';

async function run() {
  console.log('Starting migration 040...');
  
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
    console.log('Altering audit_action enum (outside transaction)...');
    
    const alterQueries = [
      "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'DEVICE_REGISTERED'",
      "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'DEVICE_REMOVED'",
      "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'PUSH_NOTIFICATION_SENT'",
      "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'PUSH_NOTIFICATION_FAILED'"
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`Successfully executed: ${query}`);
      } catch (err) {
        console.log(`Note/Error for query "${query}":`, err.message);
      }
    }

    console.log('Migration 040 completed successfully.');
  } catch (err) {
    console.error('Migration run failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
