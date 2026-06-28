import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, 'customer');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const customerId = session.user_id;
    const { id } = await params;

    // 1. Fetch booking details
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, service_items(*, service_categories(name)), workers(*, users(full_name, avatar_url, phone))')
      .eq('id', id)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Ensure this customer owns this booking
    if (booking.customer_id !== customerId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // 2. Fetch booking images
    const { data: images } = await supabaseAdmin
      .from('booking_images')
      .select('image_url')
      .eq('booking_id', id);

    // Get public URLs for each uploaded image
    const imageUrls = (images || []).map(img => {
      if (img.image_url.startsWith('http')) return img.image_url;
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('booking-images')
        .getPublicUrl(img.image_url);
      return publicUrl;
    });

    // 3. Fetch latest route snapshot for distance and ETA
    const { data: routeSnapshot } = await supabaseAdmin
      .from('booking_route_snapshots')
      .select('distance_km, eta_minutes')
      .eq('booking_id', id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      booking,
      images: imageUrls,
      routeSnapshot: routeSnapshot || null
    });
  } catch (error: any) {
    console.error('Error fetching booking details:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, 'customer');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const customerId = session.user_id;
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('customer_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    if (booking.customer_id !== customerId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const updates: any = {};
    if (body.status === 'CANCELLED') {
      if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Cannot cancel completed or already cancelled bookings.' }, { status: 400 });
      }
      updates.status = 'CANCELLED';
    }
    if (body.scheduled_at) {
      updates.scheduled_at = body.scheduled_at;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    console.error('Error updating booking:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
