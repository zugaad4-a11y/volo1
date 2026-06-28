process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  await client.connect();
  
  const bookingId = '5ae2f853-9deb-4744-b96d-ef5260d15200';
  const praneethId = '48db7cc1-a66d-46e4-8c38-58fd6653dbe8';
  const testWorkerId = 'bd8e7a68-b7eb-4b2a-8cfa-c529a65f9734';

  console.log('1. Setting Praneeth and Test Worker to ONLINE...');
  await client.query(`
    UPDATE workers 
    SET status = 'ONLINE' 
    WHERE id IN ($1, $2);
  `, [praneethId, testWorkerId]);

  console.log('2. Resetting booking status to PENDING_ASSIGNMENT...');
  await client.query(`
    UPDATE bookings 
    SET 
      worker_id = null,
      status = 'PENDING_ASSIGNMENT',
      started_at = null,
      updated_at = NOW()
    WHERE id = $1;
  `, [bookingId]);

  console.log('3. Resetting assignment_queue status to QUEUED...');
  const resetRes = await client.query(`
    UPDATE assignment_queue
    SET 
      status = 'QUEUED',
      current_group = 1,
      group_workers = '[]'::jsonb,
      all_notified_workers = '{}'::uuid[],
      group_expires_at = '2026-06-01 00:00:00+00',
      started_at = null,
      assigned_at = null,
      updated_at = NOW()
    WHERE booking_id = $1
    RETURNING *;
  `, [bookingId]);
  
  console.log('Queue reset result:', JSON.stringify(resetRes.rows[0], null, 2));
  
  await client.end();
}

main().catch(console.error);
