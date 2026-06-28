process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  await client.connect();
  
  const bookingId = '5ae2f853-9deb-4744-b96d-ef5260d15200';
  
  console.log('Querying booking:', bookingId);
  const bookingRes = await client.query(`
    SELECT * FROM bookings WHERE id = $1;
  `, [bookingId]);
  
  console.log('Booking details:', JSON.stringify(bookingRes.rows[0], null, 2));

  if (bookingRes.rows[0]) {
    const booking = bookingRes.rows[0];
    
    // Query assignments for this booking
    console.log('\nQuerying assignments for booking...');
    const assignRes = await client.query(`
      SELECT ba.*, u.full_name as worker_name 
      FROM booking_assignments ba
      LEFT JOIN users u ON ba.worker_id = u.id
      WHERE ba.booking_id = $1;
    `, [bookingId]);
    console.log('Assignments:', JSON.stringify(assignRes.rows, null, 2));
    
    // Query nearest workers
    console.log('\nQuerying workers list...');
    const workersRes = await client.query(`
      SELECT w.id, w.status, w.kyc_status, u.full_name, w.lat, w.lng
      FROM workers w
      JOIN users u ON w.id = u.id;
    `);
    console.log('Workers:', JSON.stringify(workersRes.rows, null, 2));
  }
  
  await client.end();
}

main().catch(console.error);
