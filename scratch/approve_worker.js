process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  // REPLACE THIS WITH YOUR REAL PHONE NUMBER (including +91 prefix)
  const phone = '+919999999999'; 
  const fullName = 'Real Test Worker';

  await client.connect();
  console.log(`Searching for user with phone: ${phone}...`);
  
  const userRes = await client.query(`
    SELECT * FROM users WHERE phone = $1;
  `, [phone]);
  
  let userId;
  
  if (userRes.rows.length === 0) {
    console.log('User not found. Seeding new user record...');
    const insertUserRes = await client.query(`
      INSERT INTO users (phone, role, is_active, full_name, firebase_uid)
      VALUES ($1, 'worker', true, $2, 'manual-firebase-uid-' || gen_random_uuid()::text)
      RETURNING id;
    `, [phone, fullName]);
    userId = insertUserRes.rows[0].id;
  } else {
    userId = userRes.rows[0].id;
    console.log(`Found existing user with ID: ${userId}. Updating to worker role...`);
    await client.query(`
      UPDATE users 
      SET role = 'worker', is_active = true, full_name = $2 
      WHERE id = $1;
    `, [userId, fullName]);
  }

  // Ensure worker record exists and is approved
  const workerRes = await client.query(`
    SELECT * FROM workers WHERE id = $1;
  `, [userId]);

  if (workerRes.rows.length === 0) {
    console.log('Creating approved worker profile near Nagole, Hyderabad...');
    await client.query(`
      INSERT INTO workers (id, status, kyc_status, current_lat, current_lng, service_category_ids, commission_wallet_balance)
      VALUES ($1, 'ONLINE', 'APPROVED', 17.3736, 78.5785, ARRAY['ea85b1c7-1182-47eb-880c-003d1b118784'::uuid], 1000.00);
    `, [userId]);
  } else {
    console.log('Updating existing worker profile to ONLINE and APPROVED near Nagole...');
    await client.query(`
      UPDATE workers
      SET 
        status = 'ONLINE',
        kyc_status = 'APPROVED',
        current_lat = 17.3736,
        current_lng = 78.5785,
        service_category_ids = ARRAY['ea85b1c7-1182-47eb-880c-003d1b118784'::uuid],
        commission_wallet_balance = 1000.00
      WHERE id = $1;
    `, [userId]);
  }

  console.log('\n--- SUCCESS ---');
  console.log(`Phone number ${phone} has been set up as an approved worker!`);
  console.log('You can now log in using this number via the home page.');
  
  await client.end();
}

main().catch(console.error);
