global.WebSocket = global.WebSocket || class {};
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ruavhqfttentcjtmnlct.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YXZocWZ0dGVudGNqdG1ubGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkwMjc2NSwiZXhwIjoyMDk2NDc4NzY1fQ.maLHCkSIdhv1npvWFj2m0kGIDGMfN48X7GtaZRNgsZU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function main() {
  console.log('Checking tables in public schema...');
  const { data: tables, error: tableError } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('Error fetching users:', tableError);
  } else {
    console.log('users table exists!');
  }

  // Let's query information_schema.columns to see if sessions, trusted_devices, etc. exist.
  // Wait, we can't directly query arbitrary tables in Supabase unless we have a view or run an RPC,
  // but we can try to query each table name to see if we get a 404/relation not found error!
  const targetTables = ['sessions', 'trusted_devices', 'auth_logs', 'security_events', 'rate_limits'];
  for (const table of targetTables) {
    const { error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error && error.code === 'PGRST116') {
      console.log(`Table "${table}" exists! (No rows returned, but table found)`);
    } else if (error && error.message.includes('does not exist')) {
      console.log(`Table "${table}" DOES NOT EXIST.`);
    } else if (!error) {
      console.log(`Table "${table}" exists!`);
    } else {
      console.log(`Table "${table}" check resulted in: ${error.code} - ${error.message}`);
    }
  }

  // Check columns on users table
  const { data: columns, error: colError } = await supabaseAdmin
    .rpc('get_table_columns', { table_name: 'users' });
  
  if (colError) {
    console.log('Could not use RPC to get columns, trying to select specific columns...');
    const checkColumns = ['email', 'pin_hash', 'pin_attempts', 'pin_locked_until', 'is_suspended'];
    for (const col of checkColumns) {
      const { error } = await supabaseAdmin.from('users').select(col).limit(1);
      if (error) {
        console.log(`Column "${col}" on "users" table DOES NOT EXIST or query failed.`);
      } else {
        console.log(`Column "${col}" on "users" table exists.`);
      }
    }
  } else {
    console.log('Columns on users:', columns);
  }
}

main().catch(console.error);
