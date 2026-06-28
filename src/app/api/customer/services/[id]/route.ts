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

    const { id } = await params;

    const { data: item, error: itemErr } = await supabaseAdmin
      .from('service_items')
      .select('*, service_categories(name)')
      .eq('id', id)
      .single();

    const categoryName = (item?.service_categories?.name || '').toLowerCase();
    const isAllowed = categoryName.includes('elect') || categoryName.includes('plumb');

    if (itemErr || !item || !isAllowed) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error fetching service item details:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}


