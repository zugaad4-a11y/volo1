import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const session = await requireRole(request, 'customer');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const customerId = session.user_id;

    // Fetch historical bookings (completed or cancelled)
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, service_items(name, description, base_price, estimated_mins), workers(users(full_name))')
      .eq('customer_id', customerId)
      .in('status', ['COMPLETED', 'CANCELLED'])
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error: any) {
    console.error('Error fetching customer booking history:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
