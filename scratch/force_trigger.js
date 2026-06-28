process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  await client.connect();
  
  const bookingId = '5ae2f853-9deb-4744-b96d-ef5260d15200';
  
  console.log('1. Setting group_expires_at to a past timestamp for booking:', bookingId);
  const updateRes = await client.query(`
    UPDATE assignment_queue 
    SET group_expires_at = '2026-06-01 00:00:00+00' 
    WHERE booking_id = $1
    RETURNING *;
  `, [bookingId]);
  
  console.log('Updated Queue Row:', JSON.stringify(updateRes.rows[0], null, 2));
  await client.end();
  
  console.log('\n2. Triggering /api/assignment/advance POST request...');
  const res = await fetch('http://localhost:3000/api/assignment/advance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Response Status:', res.status);
  const resText = await res.text();
  console.log('Response Body:', resText);
}

main().catch(console.error);
