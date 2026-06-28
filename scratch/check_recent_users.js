global.WebSocket = class {};
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('Querying last 10 users...');
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, phone, role, is_active, pin_hash, last_login_at, created_at')
    .order('last_login_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Users:');
  console.table(users);
}

main().catch(console.error);
