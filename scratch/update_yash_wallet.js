const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !key.startsWith('#')) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('Fetching platform settings...');
  const { data: settings, error: settingsErr } = await supabase
    .from('platform_settings')
    .select('*');
  if (settingsErr) {
    console.error(settingsErr);
  } else {
    console.log('Platform settings:', settings);
  }

  // Find worker yash
  console.log('\nFetching yash worker record...');
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .ilike('full_name', '%yash%');
  
  if (users && users.length > 0) {
    const yash = users[0];
    console.log('Found user yash:', yash);

    const { data: worker } = await supabase
      .from('workers')
      .select('*')
      .eq('id', yash.id)
      .single();
    
    console.log('yash worker details before update:', worker);

    // Let's update commission_wallet_balance to 1000
    console.log('\nUpdating commission_wallet_balance to 1000...');
    const { data: updateRes, error: updateErr } = await supabase
      .from('workers')
      .update({ commission_wallet_balance: 1000 })
      .eq('id', yash.id)
      .select();

    if (updateErr) {
      console.error('Update failed:', updateErr);
    } else {
      console.log('Update success:', updateRes);
    }
  } else {
    console.log('User yash not found');
  }
}

main().catch(console.error);
