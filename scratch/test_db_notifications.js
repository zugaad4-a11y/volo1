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

async function main() {
  const testUserId = 'ad8e7a68-b7eb-4b2a-8cfa-c529a65f9733'; // Super Admin
  
  console.log('Inserting test notification for user:', testUserId);
  const { data, error } = await supabaseAdmin.from('notifications').insert({
    user_id: testUserId,
    type: 'LOW_WALLET_BALANCE',
    title: 'Test Title',
    body: 'Test Body',
    data: { test: true }
  }).select();

  console.log('Notification Insert Error:', error);
  console.log('Notification Insert Data:', data);
  
  console.log('\nInserting test audit log...');
  const { data: auditData, error: auditError } = await supabaseAdmin.from('audit_logs').insert({
    admin_id: testUserId,
    action: 'PUSH_NOTIFICATION_SENT',
    target_type: 'user',
    target_id: testUserId,
    metadata: { title: 'Test Title', successCount: 1 }
  }).select();

  console.log('Audit Log Insert Error:', auditError);
  console.log('Audit Log Insert Data:', auditData);
}

main().catch(console.error);
