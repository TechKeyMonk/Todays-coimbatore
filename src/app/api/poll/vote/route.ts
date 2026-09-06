import { NextResponse } from 'next/server';
import { getPollStateAsync, votePollAsync } from '@/lib/pollStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: await getPollStateAsync(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const option = (body.option || body.vote || '').toLowerCase();

    if (option !== 'yes' && option !== 'no') {
      return NextResponse.json({ success: false, error: 'Option must be "yes" or "no"' }, { status: 400 });
    }

    const data = await votePollAsync(option as 'yes' | 'no');

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
