import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const session = await requireRole(request, 'customer');
    const customerId = session.user_id;

    // Fetch user details for profile completeness
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', customerId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all bookings for this customer
    const { data: bookings, error: bookingsErr } = await supabaseAdmin
      .from('bookings')
      .select('*, service_items(name), workers(users(full_name))')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (bookingsErr) throw bookingsErr;

    // Fetch recent reviews by this customer
    const { data: reviews, error: reviewsErr } = await supabaseAdmin
      .from('reviews')
      .select('*, bookings(service_items(name))')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviewsErr) throw reviewsErr;

    // Calculate metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    
    // Pending includes PENDING_ASSIGNMENT, WORKER_ASSIGNED, or WORKER_ACCEPTED
    const pendingBookings = bookings.filter(b => 
      b.status === 'PENDING_ASSIGNMENT' || 
      b.status === 'WORKER_ASSIGNED' || 
      b.status === 'WORKER_ACCEPTED'
    ).length;

    // Upcoming: bookings scheduled in the future that are not completed or cancelled
    const nowStr = new Date().toISOString();
    const upcomingBookings = bookings.filter(b => 
      b.status !== 'COMPLETED' && 
      b.status !== 'CANCELLED' && 
      b.scheduled_at && 
      b.scheduled_at > nowStr
    ).length;

    // Active Bookings: en route, arrived, work started
    const activeList = bookings.filter(b => 
      b.status === 'ON_THE_WAY' || 
      b.status === 'ARRIVED' || 
      b.status === 'IN_PROGRESS'
    );

    // Profile completion calculation:
    // Fields tracked: full_name, email, avatar_url, address, city, state. (is_active, phone are guaranteed)
    let completedFields = 2; // user ID and phone number are guaranteed
    const totalFields = 8;
    if (user.full_name) completedFields++;
    if (user.email) completedFields++;
    if (user.avatar_url) completedFields++;
    
    // We check address and city/state from users or first default customer_address if exists
    const { data: defaultAddr } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_default', true)
      .maybeSingle();

    if (defaultAddr) {
      if (defaultAddr.address) completedFields += 3; // counts address, city, state
    }

    const profileCompletion = Math.min(100, Math.round((completedFields / totalFields) * 100));

    return NextResponse.json({
      user: {
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        email: user.email
      },
      profileCompletion,
      metrics: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
        upcoming: upcomingBookings
      },
      upcomingBookingsList: bookings.filter(b => 
        b.status !== 'COMPLETED' && 
        b.status !== 'CANCELLED' && 
        b.scheduled_at && 
        b.scheduled_at > nowStr
      ).slice(0, 5),
      activeBookings: activeList,
      recentBookings: bookings.slice(0, 5),
      recentReviews: reviews || []
    });
  } catch (error: any) {
    console.error('Error fetching customer dashboard:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
