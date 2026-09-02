import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { sendFeedbackAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { readerName, email, phone, articleTitleOrUrl, feedbackCategory, message } = body;

    if (!readerName || !email || !message) {
      return NextResponse.json(
        { error: 'Reader name, email, and message are required.' },
        { status: 400 }
      );
    }

    // 1. Insert into Supabase enquiries table
    try {
      await supabaseAdmin.from('enquiries').insert([
        {
          user_name: readerName.trim(),
          user_phone: phone?.trim() || email.trim(),
          service_requested: `Feedback: ${feedbackCategory || 'Story Correction'}`,
          message: `${articleTitleOrUrl ? `Article Ref: ${articleTitleOrUrl}\n\n` : ''}${message.trim()}`,
          status: 'unread',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbErr) {
      console.warn('[Feedback API] Failed to save feedback in Supabase:', dbErr);
    }

    // 2. Asynchronously fire email alert to todayscoimbatore@gmail.com
    sendFeedbackAlert({
      data: {
        readerName: readerName.trim(),
        email: email.trim(),
        phone: phone?.trim(),
        articleTitleOrUrl: articleTitleOrUrl?.trim(),
        feedbackCategory: feedbackCategory?.trim() || 'Editorial Correction',
        message: message.trim(),
      },
    }).catch((emailErr) => {
      console.error('[Feedback API] Background feedback email alert failed:', emailErr);
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! Our editorial desk will review it shortly.',
    });
  } catch (err: any) {
    console.error('[Feedback API] Error processing feedback:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process feedback.' },
      { status: 500 }
    );
  }
}
