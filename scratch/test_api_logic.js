global.WebSocket = class {};
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function runLogic(id) {
  const { data: item, error: itemErr } = await supabaseAdmin
    .from('service_items')
    .select('*, service_categories(name)')
    .eq('id', id)
    .single();

  console.log('--- DEBUG LOGS ---');
  console.log('id:', id);
  console.log('item:', item);
  console.log('itemErr:', itemErr);
  
  // Try casting and checking types
  if (item) {
    console.log('type of service_categories:', typeof item.service_categories, Array.isArray(item.service_categories) ? 'array' : 'object');
  }

  const categoryName = (item?.service_categories?.name || '').toLowerCase();
  console.log('categoryName:', categoryName);

  // If service_categories is an array (which can happen in some postgrest versions/schemas)
  let categoryNameForArray = '';
  if (item?.service_categories) {
    if (Array.isArray(item.service_categories)) {
      categoryNameForArray = (item.service_categories[0]?.name || '').toLowerCase();
    } else {
      categoryNameForArray = (item.service_categories.name || '').toLowerCase();
    }
  }
  console.log('categoryNameForArray:', categoryNameForArray);

  const isAllowed = categoryName.includes('elect') || categoryName.includes('plumb');
  console.log('isAllowed:', isAllowed);
}

runLogic('e4ac8f59-ca09-49c7-9ed0-9e3a70c8c04c').catch(console.error);
