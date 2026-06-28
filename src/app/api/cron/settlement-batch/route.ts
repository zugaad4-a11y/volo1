import { NextResponse } from 'next/server';
import { generateSettlementBatch } from '@/lib/settlement-engine';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine batch type based on day of week or pass via payload
    // According to specs, Wednesday (10AM) and Sunday (6PM).
    const now = new Date();
    // getDay() -> 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const day = now.getDay();

    let batchType: 'WEDNESDAY' | 'SUNDAY' = 'SUNDAY';
    if (day === 3) batchType = 'WEDNESDAY';

    // If manual override was sent in body (for testing)
    try {
      const body = await request.json();
      if (body && body.batch_type && (body.batch_type === 'WEDNESDAY' || body.batch_type === 'SUNDAY')) {
        batchType = body.batch_type;
      }
    } catch (e) {
      // Ignored: body is optional
    }

    const result = await generateSettlementBatch(batchType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Settlement batch generated successfully',
      batch: result
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
