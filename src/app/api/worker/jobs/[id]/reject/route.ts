import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, 'worker');
    const workerId = session.user_id;
    const { id } = await params;

    // 1. Fetch booking row
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // 2. Validate worker owns this assigned job
    if (booking.worker_id !== workerId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (booking.status !== 'WORKER_ASSIGNED') {
      return NextResponse.json({ error: 'Only assigned pending jobs can be rejected.' }, { status: 400 });
    }

    // 3. Reset booking fields and revert worker status to ONLINE
    const { error: bookingUpdateErr } = await supabaseAdmin
      .from('bookings')
      .update({
        worker_id: null,
        status: 'PENDING_ASSIGNMENT',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (bookingUpdateErr) throw bookingUpdateErr;

    const { error: workerUpdateErr } = await supabaseAdmin
      .from('workers')
      .update({
        status: 'ONLINE',
        updated_at: new Date().toISOString()
      })
      .eq('id', workerId);

    if (workerUpdateErr) throw workerUpdateErr;

    return NextResponse.json({ success: true, message: 'Job rejected.' });
  } catch (error: any) {
    console.error('Error rejecting job:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
