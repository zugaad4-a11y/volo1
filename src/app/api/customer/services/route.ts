import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const session = await requireRole(request, 'customer');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    // 1. Fetch categories
    const { data: categories, error: catErr } = await supabaseAdmin
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (catErr) throw catErr;

    // Filter categories to only keep Electrical and Plumbing related categories
    const filteredCategories = (categories || []).filter(cat => {
      const name = cat.name.toLowerCase();
      return name.includes('elect') || name.includes('plumb');
    });
    const allowedCategoryIds = filteredCategories.map(c => c.id);

    // 2. Fetch service items with filtering
    let query = supabaseAdmin
      .from('service_items')
      .select('*, service_categories(name)')
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: items, error: itemsErr } = await query;
    if (itemsErr) throw itemsErr;

    // Filter items to only keep items belonging to allowed categories
    const filteredItems = (items || []).filter(item => 
      allowedCategoryIds.includes(item.category_id)
    );

    return NextResponse.json({
      categories: filteredCategories,
      items: filteredItems
    });
  } catch (error: any) {
    console.error('Error fetching customer services:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
