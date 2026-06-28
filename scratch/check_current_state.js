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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('Connecting via Supabase HTTP client...');

  // 1. Fetch recent bookings
  console.log('\n=== Recent Bookings ===');
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
      service_items (
        category_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (bookingErr) {
    console.error('Error fetching bookings:', bookingErr);
    return;
  }
  console.log(bookings);

  const pendingBooking = bookings.find(b => b.status === 'PENDING_ASSIGNMENT' || b.status === 'FINDING_TECHNICIAN' || b.status === 'QUEUED' || b.status === 'BROADCASTING');
  const targetBooking = pendingBooking || bookings[0];

  if (!targetBooking) {
    console.log('No bookings found.');
    return;
  }

  console.log(`\nTarget Booking for Debugging: ${targetBooking.id} (Status: ${targetBooking.status})`);

  // 2. Fetch assignment queue for this target booking
  console.log('\n=== Assignment Queue for Target ===');
  const { data: queue, error: queueErr } = await supabase
    .from('assignment_queue')
    .select('*')
    .eq('booking_id', targetBooking.id);
  if (queueErr) console.error(queueErr);
  else console.log(queue);

  // 3. Fetch online workers
  console.log('\n=== Online Workers ===');
  const { data: workers, error: workersErr } = await supabase
    .from('workers')
    .select(`
      id,
      status,
      kyc_status,
      current_lat,
      current_lng,
      service_category_ids,
      commission_wallet_balance
    `)
    .eq('status', 'ONLINE');

  if (workersErr) {
    console.error(workersErr);
  } else {
    // Join manually with user table since we need phone/is_active
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, role, is_active');
    if (usersErr) {
      console.error(usersErr);
    } else {
      const userMap = new Map(users.map(u => [u.id, u]));
      const fullWorkers = workers.map(w => ({
        ...w,
        full_name: userMap.get(w.id)?.full_name,
        is_active: userMap.get(w.id)?.is_active,
        role: userMap.get(w.id)?.role
      }));
      console.log(fullWorkers);
    }
  }

  // 4. Fetch details of service_item and category for target booking
  console.log('\n=== Service Item ===');
  const { data: item, error: itemErr } = await supabase
    .from('service_items')
    .select('id, name, category_id')
    .eq('id', targetBooking.service_item_id)
    .single();
  if (itemErr) console.error(itemErr);
  else console.log(item);

  const categoryId = item?.category_id;

  // 5. Test find_nearby_eligible_workers RPC
  console.log('\n=== find_nearby_eligible_workers RPC test ===');
  try {
    const { data: radiusData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'search_radius_km')
      .single();
    
    const radiusKm = radiusData ? parseFloat(radiusData.value) : 10;
    console.log('Search radius:', radiusKm);

    const { data: nearbyWorkers, error: rpcErr } = await supabase.rpc(
      'find_nearby_eligible_workers',
      {
        p_lat: targetBooking.lat,
        p_lng: targetBooking.lng,
        p_radius_km: radiusKm,
        p_service_category_id: categoryId,
        p_booking_id: targetBooking.id,
        p_payment_mode: targetBooking.payment_mode
      }
    );
    if (rpcErr) console.error('RPC Error:', rpcErr);
    else console.log(nearbyWorkers);
  } catch (err) {
    console.error('Error in find_nearby_eligible_workers test:', err.message);
  }
}

main().catch(console.error);
