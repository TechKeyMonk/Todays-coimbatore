import { NextResponse } from 'next/server';
import {
  getPollStateAsync,
  votePollAsync,
  resetPollAsync,
  updatePollAsync,
} from '@/lib/pollStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getPollStateAsync();
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let data;
    if (body.reset === true) {
      data = await resetPollAsync();
    } else if (body.option === 'yes' || body.vote === 'yes') {
      data = await votePollAsync('yes');
    } else if (body.option === 'no' || body.vote === 'no') {
      data = await votePollAsync('no');
    } else if (body.question) {
      data = await updatePollAsync({
        question: body.question.trim(),
        category: body.category || 'INFRASTRUCTURE & CIVIC',
        yesVotes: typeof body.yesVotes === 'number' ? body.yesVotes : 0,
        noVotes: typeof body.noVotes === 'number' ? body.noVotes : 0,
        lastReset: new Date().toISOString(),
      });
    } else {
      data = await getPollStateAsync();
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
