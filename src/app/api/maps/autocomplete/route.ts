import { NextResponse } from 'next/server';
import { getAutocompleteSuggestions } from '@/lib/maps/directions-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input') || '';

    if (!input) {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = await getAutocompleteSuggestions(input);
    return NextResponse.json({ predictions });
  } catch (error: any) {
    console.error('Autocomplete API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
