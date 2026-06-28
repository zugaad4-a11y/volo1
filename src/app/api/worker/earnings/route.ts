import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { startOfDay, startOfWeek, startOfMonth, format, parseISO, isWithinInterval } from 'date-fns';

export async function GET(request: Request) {
  const cacheHeaders = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' };
  try {
    const session = await requireRole(request, 'worker');
    const workerId = session.user_id;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // today, week, month, custom
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    // Fetch all completed bookings for the worker
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, total_amount, completed_at')
      .eq('worker_id', workerId)
      .eq('status', 'COMPLETED');

    if (error) throw error;

    const now = new Date();
    let startDate = startOfWeek(now, { weekStartsOn: 1 }); // Default to week

    if (period === 'today') {
      startDate = startOfDay(now);
    } else if (period === 'month') {
      startDate = startOfMonth(now);
    } else if (period === 'custom' && dateFrom) {
      startDate = parseISO(dateFrom);
    }

    const endDate = (period === 'custom' && dateTo) ? parseISO(dateTo) : now;

    // Filter bookings by date range
    const filteredBookings = (bookings || []).filter((b: any) => {
      if (!b.completed_at) return false;
      const completedDate = parseISO(b.completed_at);
      return isWithinInterval(completedDate, { start: startDate, end: endDate });
    });

    // Compute metrics
    let totalGross = 0;
    let completedJobsCount = filteredBookings.length;

    filteredBookings.forEach((b: any) => {
      totalGross += Number(b.total_amount);
    });

    const totalEarnings = Number((totalGross * 0.85).toFixed(2));
    const commissionDeducted = Number((totalGross * 0.15).toFixed(2));
    const averagePerJob = completedJobsCount > 0 ? Number((totalEarnings / completedJobsCount).toFixed(2)) : 0;

    // Build chart data
    const chartMap: Record<string, number> = {};

    if (period === 'today') {
      // Group by hours (e.g. 09:00, 10:00, etc.)
      filteredBookings.forEach((b: any) => {
        const hour = format(parseISO(b.completed_at), 'hh a');
        chartMap[hour] = (chartMap[hour] || 0) + Number((b.total_amount * 0.85).toFixed(2));
      });
    } else if (period === 'week') {
      // Group by days of week (Mon, Tue, etc.)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(d => { chartMap[d] = 0; });
      filteredBookings.forEach((b: any) => {
        const dayName = format(parseISO(b.completed_at), 'eee');
        chartMap[dayName] = (chartMap[dayName] || 0) + Number((b.total_amount * 0.85).toFixed(2));
      });
    } else {
      // Group by date (e.g. Jun 08, Jun 09)
      filteredBookings.forEach((b: any) => {
        const dayStr = format(parseISO(b.completed_at), 'MMM dd');
        chartMap[dayStr] = (chartMap[dayStr] || 0) + Number((b.total_amount * 0.85).toFixed(2));
      });
    }

    const chartData = Object.entries(chartMap).map(([label, value]) => ({
      label,
      value: Number(value.toFixed(2))
    }));

    return NextResponse.json({
      summary: {
        total: totalEarnings,
        jobsCount: completedJobsCount,
        average: averagePerJob,
        decay: false,
        commission: commissionDeducted
      },
      chartData
    }, { headers: cacheHeaders });
  } catch (error: any) {
    console.error('Error fetching worker earnings:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500, headers: cacheHeaders }
    );
  }
}
