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
  console.log('Running manual queue advancement...');

  // 1. Fetch expired broadcasting queues
  const nowIso = new Date().toISOString();
  console.log('Current time:', nowIso);

  const { data: expiredQueues, error: queryErr } = await supabase
    .from('assignment_queue')
    .select('*')
    .eq('status', 'BROADCASTING')
    .lt('group_expires_at', nowIso);

  if (queryErr) {
    console.error('Error fetching expired queues:', queryErr);
    return;
  }

  console.log(`Found ${expiredQueues ? expiredQueues.length : 0} expired broadcasting queues.`);
  console.log(expiredQueues);

  for (const queue of expiredQueues || []) {
    console.log(`\nProcessing queue: ${queue.id} for booking: ${queue.booking_id}`);
    
    // Fetch booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('status, lat, lng, payment_mode, service_item_id, service_items (category_id)')
      .eq('id', queue.booking_id)
      .single();

    if (bookingErr || !booking) {
      console.error('Failed to fetch booking:', bookingErr);
      continue;
    }

    if (booking.status !== 'PENDING_ASSIGNMENT') {
      console.log(`Booking ${queue.booking_id} status is ${booking.status}. Marking queue ASSIGNED.`);
      await supabase
        .from('assignment_queue')
        .update({ status: 'ASSIGNED', assigned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', queue.id);
      continue;
    }

    const categoryId = booking.service_items?.category_id || null;

    if (queue.current_group < 3) {
      const nextGroup = queue.current_group + 1;
      
      // Get search radius
      const { data: radiusData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'search_radius_km')
        .single();
      const radiusKm = radiusData ? parseFloat(radiusData.value) : 10;

      // Find nearby workers
      const { data: workers, error: rpcErr } = await supabase.rpc(
        'find_nearby_eligible_workers',
        {
          p_lat: booking.lat,
          p_lng: booking.lng,
          p_radius_km: radiusKm,
          p_service_category_id: categoryId,
          p_booking_id: queue.booking_id,
          p_payment_mode: booking.payment_mode
        }
      );

      if (rpcErr) {
        console.error('RPC Error:', rpcErr);
        continue;
      }

      const notifiedSet = new Set(queue.all_notified_workers || []);
      const newWorkers = (workers || []).filter(w => !notifiedSet.has(w.worker_id));

      console.log('Nearby eligible workers:', workers);
      console.log('Already notified:', [...notifiedSet]);
      console.log('New workers to notify in group:', newWorkers);

      if (newWorkers.length > 0) {
        const newAllNotified = [...(queue.all_notified_workers || []), ...newWorkers.map(w => w.worker_id)];
        const expiresAt = new Date(Date.now() + 180000).toISOString(); // 3m

        const { data: updatedQueue, error: updateErr } = await supabase
          .from('assignment_queue')
          .update({
            current_group: nextGroup,
            group_workers: newWorkers,
            all_notified_workers: newAllNotified,
            status: 'BROADCASTING',
            attempts: queue.attempts + 1,
            group_expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', queue.id)
          .select();

        if (updateErr) {
          console.error('Failed to update queue:', updateErr);
        } else {
          console.log('Successfully advanced queue:', updatedQueue);
          console.log(`Dispatched notifications to: ${newWorkers.map(w => w.worker_id).join(', ')}`);
        }
        continue;
      }
    }

    // If groups exhausted or no new workers
    console.log(`Exhausted all groups for booking ${queue.booking_id}. Failing queue.`);
    await supabase
      .from('assignment_queue')
      .update({ status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', queue.id);

    await supabase
      .from('bookings')
      .update({ status: 'MANUAL_ASSIGNMENT_REQUIRED', updated_at: new Date().toISOString() })
      .eq('id', queue.booking_id);
  }
}

main().catch(console.error);
