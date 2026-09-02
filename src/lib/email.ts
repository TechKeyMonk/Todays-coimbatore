import nodemailer from 'nodemailer';

const GMAIL_USER = (process.env.GMAIL_USER || 'todayscoimbatore@gmail.com').trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
  ? process.env.GMAIL_APP_PASSWORD.trim()
  : undefined;

// 1. Transporter configuration (smtp.gmail.com, port 465, secure, with socket timeouts)
export const mailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000, // 10s connection timeout
  greetingTimeout: 10000,   // 10s greeting timeout
  socketTimeout: 15000,     // 15s socket activity timeout
});

export interface AdminNotificationOptions {
  subject: string;
  htmlContent: string;
  replyTo?: string;
  to?: string;
}

/**
 * Generic helper to send an alert email to the admin desk with automatic retry
 */
export async function sendAdminNotification({
  subject,
  htmlContent,
  replyTo,
  to,
}: AdminNotificationOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!GMAIL_APP_PASSWORD) {
    console.warn('[Email] Notice: GMAIL_APP_PASSWORD is not set in environment.');
    return { success: false, error: 'GMAIL_APP_PASSWORD not configured' };
  }

  const recipient = to || GMAIL_USER;
  const mailOptions = {
    from: `"Today's Coimbatore Alerts" <${GMAIL_USER}>`,
    to: recipient,
    replyTo: replyTo || GMAIL_USER,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[Email] Alert sent successfully: ${info.messageId} -> ${recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (firstErr: any) {
    console.warn('[Email] Transient SMTP issue, retrying once in 1.5s...', firstErr?.message);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const retryInfo = await mailTransporter.sendMail(mailOptions);
      console.log(`[Email] Alert sent successfully on retry: ${retryInfo.messageId} -> ${recipient}`);
      return { success: true, messageId: retryInfo.messageId };
    } catch (retryErr: any) {
      console.error('[Email] Failed to send email alert after retry:', retryErr?.message || retryErr);
      return { success: false, error: retryErr?.message || String(retryErr) };
    }
  }
}

/**
 * Contact Us Form notification helper
 */
export async function sendContactFormNotification(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #dc2626; color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px; }
    .badge { display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 16px; }
    .field { margin-bottom: 18px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 14px; color: #1e293b; font-weight: 500; word-break: break-word; }
    .message-box { background: #f8fafc; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 8px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
    .footer { background: #f1f5f9; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Today's Coimbatore</p>
      <h1>New Citizen &amp; Press Enquiry</h1>
    </div>
    <div class="body">
      <div class="badge">Contact Form Submission</div>
      
      <div class="field">
        <div class="label">Sender Name</div>
        <div class="value"><strong>${data.name}</strong></div>
      </div>

      <div class="field">
        <div class="label">Email Address</div>
        <div class="value"><a href="mailto:${data.email}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${data.email}</a></div>
      </div>

      <div class="field">
        <div class="label">Phone / WhatsApp</div>
        <div class="value">${data.phone || 'Not provided'}</div>
      </div>

      <div class="field">
        <div class="label">Subject / Topic</div>
        <div class="value"><strong>${data.subject || 'General Enquiry'}</strong></div>
      </div>

      <div class="field">
        <div class="label">Message Content</div>
        <div class="message-box">${data.message}</div>
      </div>

      <div class="field" style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
        <div class="label">Received At</div>
        <div class="value" style="font-size: 12px; color: #64748b;">${timeStr} IST</div>
      </div>
    </div>
    <div class="footer">
      This is an automated alert sent to <strong>todayscoimbatore@gmail.com</strong>.<br>
      You can reply directly to this email to respond to <strong>${data.name}</strong>.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAdminNotification({
    subject: `📨 [Contact Form] ${data.subject || 'New Enquiry'} from ${data.name}`,
    htmlContent: html,
    replyTo: data.email,
  });
}

/**
 * Ingested News Drafts notification helper
 */
export async function sendDraftIngestionNotification(drafts: Array<{
  title: string;
  category?: string;
  slug?: string;
  source_url?: string;
}>): Promise<{ success: boolean; error?: string }> {
  if (!drafts || drafts.length === 0) {
    return { success: true };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://todayscoimbatore.com';
  const reviewPortalUrl = `${siteUrl}/admin/review`;

  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const listItemsHtml = drafts
    .map(
      (d, i) => `
    <li style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #dc2626; letter-spacing: 0.5px; margin-bottom: 3px;">
        #${i + 1} &bull; ${d.category || 'News'}
      </div>
      <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.4;">
        ${d.title}
      </div>
      ${
        d.source_url
          ? `<div style="font-size: 11px; margin-top: 4px;"><a href="${d.source_url}" target="_blank" style="color: #64748b; text-decoration: underline;">View Original Source</a></div>`
          : ''
      }
    </li>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px; }
    .alert-banner { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .btn { display: inline-block; background: #dc2626; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 28px; border-radius: 10px; margin: 20px 0 10px 0; text-align: center; }
    .footer { background: #f1f5f9; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Today's Coimbatore &bull; AI News Desk</p>
      <h1>New AI News Drafts Ingested</h1>
    </div>
    <div class="body">
      <div class="alert-banner">
        🔒 <strong>Draft-First Policy:</strong> ${drafts.length} new article(s) were generated and saved with <code>status: draft</code>. They are hidden from the live website until approved.
      </div>

      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">
        Headlines Awaiting Editorial Review (${drafts.length}):
      </div>

      <ul style="list-style: none; padding: 0; margin: 0;">
        ${listItemsHtml}
      </ul>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${reviewPortalUrl}" class="btn">Open Draft Review Portal &rarr;</a>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Direct link: ${reviewPortalUrl}</div>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
        Ingestion Timestamp: <strong>${timeStr} IST</strong>
      </div>
    </div>
    <div class="footer">
      Automated notification sent to <strong>todayscoimbatore@gmail.com</strong>.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAdminNotification({
    subject: `📰 [AI Drafts] ${drafts.length} New Coimbatore Story Draft(s) Ready for Review`,
    htmlContent: html,
  });
}

/**
 * 1. System Health & Operational Failure Alert
 */
export async function sendSystemAlert({
  errorType,
  details,
  endpoint,
}: {
  errorType: string;
  details: string;
  endpoint?: string;
}): Promise<{ success: boolean; error?: string }> {
  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fef2f2; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 2px solid #ef4444; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.1); }
    .header { background: #b91c1c; color: #ffffff; padding: 20px 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
    .body { padding: 24px; }
    .badge { display: inline-block; background: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 16px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 14px; color: #0f172a; font-weight: 600; }
    .error-box { background: #0f172a; color: #f87171; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 16px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; line-height: 1.5; margin-top: 6px; }
    .footer { background: #f8fafc; padding: 14px 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Today's Coimbatore &bull; Automated Health Monitor</p>
      <h1>🚨 System Operational Alert</h1>
    </div>
    <div class="body">
      <div class="badge">Critical Pipeline Notice</div>

      <div class="field">
        <div class="label">Fault Category</div>
        <div class="value" style="color: #b91c1c;">${errorType}</div>
      </div>

      ${
        endpoint
          ? `<div class="field"><div class="label">Trigger Source</div><div class="value"><code>${endpoint}</code></div></div>`
          : ''
      }

      <div class="field">
        <div class="label">Diagnostics / Error Details</div>
        <div class="error-box">${details}</div>
      </div>

      <div class="field" style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
        <div class="label">Incident Timestamp</div>
        <div class="value" style="font-size: 12px; color: #64748b;">${timeStr} IST</div>
      </div>
    </div>
    <div class="footer">
      Automated monitoring notification sent to <strong>todayscoimbatore@gmail.com</strong>.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAdminNotification({
    subject: `🚨 [System Alert] ${errorType} - Action Required`,
    htmlContent: html,
  });
}

/**
 * 2. Ad Space & Sponsored Partner Inquiry Notification
 */
export async function sendAdInquiryNotification({
  data,
}: {
  data: {
    advertiserName: string;
    companyName?: string;
    email: string;
    phone?: string;
    adFormat?: string;
    budgetOrDuration?: string;
    message?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #047857; color: #ffffff; padding: 24px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 16px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 14px; color: #0f172a; font-weight: 500; }
    .box { background: #f0fdf4; border-left: 4px solid #059669; padding: 14px; border-radius: 0 8px 8px 0; margin-top: 6px; font-size: 14px; color: #166534; line-height: 1.6; white-space: pre-wrap; }
    .footer { background: #f1f5f9; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Today's Coimbatore &bull; Advertising Desk</p>
      <h1>New Commercial Ad &amp; Sponsorship Inquiry</h1>
    </div>
    <div class="body">
      <div class="badge">Commercial Partner Lead</div>

      <div class="field">
        <div class="label">Contact Name</div>
        <div class="value"><strong>${data.advertiserName}</strong></div>
      </div>

      <div class="field">
        <div class="label">Company / Brand Name</div>
        <div class="value">${data.companyName || 'Not specified'}</div>
      </div>

      <div class="field">
        <div class="label">Email Address</div>
        <div class="value"><a href="mailto:${data.email}" style="color: #059669; text-decoration: none; font-weight: bold;">${data.email}</a></div>
      </div>

      <div class="field">
        <div class="label">Phone / WhatsApp</div>
        <div class="value">${data.phone || 'Not provided'}</div>
      </div>

      <div class="field">
        <div class="label">Requested Ad Placement / Format</div>
        <div class="value">${data.adFormat || 'General Banner / Sponsored Post'}</div>
      </div>

      <div class="field">
        <div class="label">Target Budget / Duration</div>
        <div class="value">${data.budgetOrDuration || 'Standard Monthly Package'}</div>
      </div>

      ${
        data.message
          ? `<div class="field"><div class="label">Campaign Requirements / Notes</div><div class="box">${data.message}</div></div>`
          : ''
      }

      <div class="field" style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
        Received: ${timeStr} IST
      </div>
    </div>
    <div class="footer">
      Reply directly to this email to discuss rates with <strong>${data.advertiserName}</strong>.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAdminNotification({
    subject: `💼 [Ad Inquiry] New Sponsor Request from ${data.companyName || data.advertiserName}`,
    htmlContent: html,
    replyTo: data.email,
  });
}

/**
 * 3. Local Event & Press Release Submission Alert
 */
export async function sendEventSubmissionAlert({
  data,
}: {
  data: {
    eventName: string;
    location?: string;
    eventDate?: string;
    organizerName?: string;
    contactPhone?: string;
    description?: string;
    imageUrl?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #7c3aed; color: #ffffff; padding: 24px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px; }
    .badge { display: inline-block; background: #ede9fe; color: #6d28d9; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 16px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 14px; color: #0f172a; font-weight: 500; }
    .desc-box { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 14px; border-radius: 0 8px 8px 0; margin-top: 6px; font-size: 14px; color: #4c1d95; line-height: 1.6; white-space: pre-wrap; }
    .footer { background: #f1f5f9; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Today's Coimbatore &bull; Events Desk</p>
      <h1>New City Event Submission</h1>
    </div>
    <div class="body">
      <div class="badge">Local Event &bull; Kovai Diary</div>

      <div class="field">
        <div class="label">Event Title</div>
        <div class="value" style="font-size: 16px;"><strong>${data.eventName}</strong></div>
      </div>

      <div class="field">
        <div class="label">Date &amp; Schedule</div>
        <div class="value">${data.eventDate || 'Date to be confirmed'}</div>
      </div>

      <div class="field">
        <div class="label">Venue / Location</div>
        <div class="value">📍 ${data.location || 'Coimbatore'}</div>
      </div>

      ${
        data.organizerName
          ? `<div class="field"><div class="label">Organizer / Host</div><div class="value">${data.organizerName}</div></div>`
          : ''
      }

      ${
        data.contactPhone
          ? `<div class="field"><div class="label">Organizer Contact</div><div class="value">${data.contactPhone}</div></div>`
          : ''
      }

      <div class="field">
        <div class="label">Event Summary</div>
        <div class="desc-box">${data.description || 'No description provided.'}</div>
      </div>

      ${
        data.imageUrl
          ? `<div class="field"><div class="label">Poster / Media Link</div><div class="value"><a href="${data.imageUrl}" target="_blank" style="color: #7c3aed;">View Event Poster</a></div></div>`
          : ''
      }

      <div class="field" style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
        Submitted: ${timeStr} IST
      </div>
    </div>
    <div class="footer">
      Review and approve in the Admin CMS to publish to the Events feed.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAdminNotification({
    subject: `🎪 [Event Submission] "${data.eventName}" in ${data.location || 'Coimbatore'}`,
    htmlContent: html,
  });
}

/**
 * 4. News Feedback & Story Correction Alert
 */
export async function sendFeedbackAlert({
  data,
}: {
  data: {
    readerName: string;
    email: string;
    phone?: string;
    articleTitleOrUrl?: string;
    feedbackCategory?: string;
    message: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #2563eb; color: #ffffff; padding: 24px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 16px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 14px; color: #0f172a; font-weight: 500; }
    .box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 0 8px 8px 0; margin-top: 6px; font-size: 14px; color: #1e3a8a; line-height: 1.6; white-space: pre-wrap; }
    .footer { background: #f1f5f9; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Today's Coimbatore &bull; Editorial Standards Desk</p>
      <h1>Reader Feedback &amp; Story Correction</h1>
    </div>
    <div class="body">
      <div class="badge">${data.feedbackCategory || 'Story Correction Request'}</div>

      <div class="field">
        <div class="label">Reader Name</div>
        <div class="value"><strong>${data.readerName}</strong></div>
      </div>

      <div class="field">
        <div class="label">Email Address</div>
        <div class="value"><a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${data.email}</a></div>
      </div>

      ${
        data.phone
          ? `<div class="field"><div class="label">Phone / WhatsApp</div><div class="value">${data.phone}</div></div>`
          : ''
      }

      ${
        data.articleTitleOrUrl
          ? `<div class="field"><div class="label">Referenced Story / URL</div><div class="value"><code>${data.articleTitleOrUrl}</code></div></div>`
          : ''
      }

      <div class="field">
        <div class="label">Correction / Feedback Details</div>
        <div class="box">${data.message}</div>
      </div>

      <div class="field" style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
        Received: ${timeStr} IST
      </div>
    </div>
    <div class="footer">
      Reply directly to this email to address <strong>${data.readerName}</strong>'s feedback.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendAdminNotification({
    subject: `✍ [Feedback / Correction] Request from ${data.readerName}`,
    htmlContent: html,
    replyTo: data.email,
  });
}

export default sendAdminNotification;
