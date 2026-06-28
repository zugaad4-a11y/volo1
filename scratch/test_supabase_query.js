global.WebSocket = class {}; // Polyfill WebSocket with a dummy class to bypass realtime-js check
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
  const id = 'e4ac8f59-ca09-49c7-9ed0-9e3a70c8c04c';
  
  console.log('Querying Supabase via JS Client for item id:', id);
  const { data: item, error: itemErr } = await supabaseAdmin
    .from('service_items')
    .select('*, service_categories(name)')
    .eq('id', id)
    .single();

  console.log('Error:', itemErr);
  console.log('Item:', JSON.stringify(item, null, 2));
}

main().catch(console.error);
