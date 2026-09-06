import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import {
  sendContactFormNotification,
  sendFeedbackAlert,
  sendAdInquiryNotification,
} from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, category, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields.' },
        { status: 400 }
      );
    }

    const resolvedCategory = (category || subject || 'General Query').trim();

    // 1. Insert into Supabase enquiries table
    try {
      await supabaseAdmin.from('enquiries').insert([
        {
          user_name: name.trim(),
          user_phone: phone?.trim() || email.trim(),
          service_requested: resolvedCategory,
          message: message.trim(),
          status: 'unread',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbErr) {
      console.warn('[Contact API] Failed to save enquiry in Supabase:', dbErr);
    }

    // 2. Send specialized email notification to todayscoimbatore@gmail.com
    let emailResult: any = { success: false };
    const sub = (subject || '').toLowerCase();
    try {
      if (sub.includes('feedback') || sub.includes('correction')) {
        emailResult = await sendFeedbackAlert({
          data: {
            readerName: name.trim(),
            email: email.trim(),
            phone: phone?.trim(),
            feedbackCategory: subject?.trim() || 'Correction / Editorial Feedback',
            message: message.trim(),
          },
        });
      } else if (sub.includes('advertis') || sub.includes('sponsor') || sub.includes('commercial')) {
        emailResult = await sendAdInquiryNotification({
          data: {
            advertiserName: name.trim(),
            companyName: name.trim(),
            email: email.trim(),
            phone: phone?.trim(),
            adFormat: subject?.trim(),
            message: message.trim(),
          },
        });
      } else {
        emailResult = await sendContactFormNotification({
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim(),
          subject: subject?.trim(),
          message: message.trim(),
        });
      }
    } catch (emailErr) {
      console.error('[Contact API] Email notification error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      emailSent: !!emailResult?.success,
      message: 'Thank you! Your enquiry has been received by Today\'s Coimbatore editorial desk.',
    });
  } catch (err: any) {
    console.error('[Contact API] Error handling contact submission:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process contact submission.' },
      { status: 500 }
    );
  }
}
