const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('Connecting via Supabase JS Client...');
  
  // Find booking
  console.log('\n--- booking details ---');
  const { data: bookings, error: bookingErr } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      lat,
      lng,
      payment_mode,
      service_item_id,
      created_at,
      updated_at,
      service_items (
        category_id
      )
    `)
    .ilike('id', '06d9589c%');
  
  if (bookingErr) {
    console.error('Error fetching booking:', bookingErr);
    return;
  }
  console.log(bookings);

  if (!bookings || bookings.length === 0) {
    console.log('No booking found matching 06D9589C');
    return;
  }

  const booking = bookings[0];
  const categoryId = booking.service_items?.category_id || null;

  // Find assignment queue entries
  console.log('\n--- assignment queue ---');
  const { data: queue, error: queueErr } = await supabase
    .from('assignment_queue')
    .select('*')
    .eq('booking_id', booking.id);
  if (queueErr) console.error(queueErr);
  else console.log(queue);

  // Find worker job rejections
  console.log('\n--- worker job rejections ---');
  const { data: rejections, error: rejectionsErr } = await supabase
    .from('worker_job_rejections')
    .select('*')
    .eq('booking_id', booking.id);
  if (rejectionsErr) console.error(rejectionsErr);
  else console.log(rejections);

  // Find workers
  console.log('\n--- all workers ---');
  const { data: workers, error: workersErr } = await supabase
    .from('workers')
    .select(`
      id,
      status,
      kyc_status,
      current_lat,
      current_lng,
      service_category_ids,
      commission_wallet_balance,
      updated_at
    `);
  if (workersErr) {
    console.error(workersErr);
  } else {
    // Join manually with user table since we need phone/is_active
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, phone, role, is_active');
    if (usersErr) {
      console.error(usersErr);
    } else {
      const userMap = new Map(users.map(u => [u.id, u]));
      const fullWorkers = workers.map(w => ({
        ...w,
        phone: userMap.get(w.id)?.phone,
        is_active: userMap.get(w.id)?.is_active,
        role: userMap.get(w.id)?.role
      }));
      console.log(fullWorkers);
    }
  }

  // Get search radius from platform_settings
  console.log('\n--- platform settings ---');
  const { data: radiusData, error: radiusErr } = await supabase
    .from('platform_settings')
    .select('*');
  if (radiusErr) console.error(radiusErr);
  else console.log(radiusData);

  const radiusKm = radiusData?.find(r => r.key === 'search_radius_km')?.value 
    ? parseFloat(radiusData.find(r => r.key === 'search_radius_km').value) 
    : 10;

  // Run find_nearby_eligible_workers RPC
  console.log('\n--- find_nearby_eligible_workers result ---');
  const { data: nearbyWorkers, error: rpcErr } = await supabase.rpc(
    'find_nearby_eligible_workers',
    {
      p_lat: booking.lat,
      p_lng: booking.lng,
      p_radius_km: radiusKm,
      p_service_category_id: categoryId,
      p_booking_id: booking.id,
      p_payment_mode: booking.payment_mode
    }
  );
  if (rpcErr) console.error('RPC Error:', rpcErr);
  else console.log(nearbyWorkers);
}

main().catch(console.error);
