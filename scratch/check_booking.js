const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  // Find booking
  console.log('\n--- booking details ---');
  const bookingRes = await client.query(`
    SELECT id, status, lat, lng, payment_mode, service_item_id, created_at, updated_at
    FROM bookings
    WHERE id::text ILIKE '06D9589C%' OR id::text = '06d9589c';
  `);
  console.log(bookingRes.rows);

  if (bookingRes.rows.length === 0) {
    console.log('No booking found matching 06D9589C');
    await client.end();
    return;
  }

  const booking = bookingRes.rows[0];
  
  // Find assignment queue entries
  console.log('\n--- assignment queue ---');
  const queueRes = await client.query(`
    SELECT *
    FROM assignment_queue
    WHERE booking_id = $1;
  `, [booking.id]);
  console.log(queueRes.rows);

  // Find worker job rejections
  console.log('\n--- worker job rejections ---');
  const rejectionsRes = await client.query(`
    SELECT *
    FROM worker_job_rejections
    WHERE booking_id = $1;
  `, [booking.id]);
  console.log(rejectionsRes.rows);

  // Find workers
  console.log('\n--- all workers ---');
  const workersRes = await client.query(`
    SELECT w.id, w.status, w.kyc_status, w.current_lat, w.current_lng, w.service_category_ids, w.commission_wallet_balance, u.is_active, u.phone
    FROM workers w
    JOIN users u ON u.id = w.id;
  `);
  console.log(workersRes.rows);

  // Test the find_nearby_eligible_workers function directly
  console.log('\n--- find_nearby_eligible_workers result ---');
  try {
    const serviceItemRes = await client.query(`
      SELECT category_id FROM service_items WHERE id = $1
    `, [booking.service_item_id]);
    const categoryId = serviceItemRes.rows[0]?.category_id;
    console.log('Booking category ID:', categoryId);

    // Get search radius from platform_settings
    const radiusRes = await client.query(`
      SELECT value FROM platform_settings WHERE key = 'search_radius_km'
    `);
    const radiusKm = radiusRes.rows[0] ? parseFloat(radiusRes.rows[0].value) : 10;
    console.log('Search radius (km):', radiusKm);

    const nearbyRes = await client.query(`
      SELECT * FROM find_nearby_eligible_workers(
        $1, $2, $3, $4, $5, $6
      );
    `, [
      booking.lat,
      booking.lng,
      radiusKm,
      categoryId,
      booking.id,
      booking.payment_mode
    ]);
    console.log(nearbyRes.rows);
  } catch (err) {
    console.error('Error executing find_nearby_eligible_workers:', err);
  }

  await client.end();
}

main().catch(console.error);
