import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import * as nodeCrypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

function toUuid(idStr?: any): string {
  if (!idStr) return nodeCrypto.randomUUID();
  const str = String(idStr).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = nodeCrypto.createHash('md5').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

// GET /api/events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(100, Math.max(1, limit)));

    if (error) {
      console.warn('[API /api/events GET] created_at ordering error, trying event_date fallback:', error);
      const fallback = await supabaseAdmin
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(Math.min(100, Math.max(1, limit)));
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[API /api/events GET] Error:', error);
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    console.error('[API /api/events GET] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal Server Error', data: [] }, { status: 500 });
  }
}

// POST /api/events
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = (body.title || body.event_name || '').trim();
    const venue = (body.venue || body.location || 'Coimbatore').trim();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Event Title is required.' }, { status: 400 });
    }

    const rawImage = body.image_url || body.poster_url || body.posterUrl || '';

    // Backend validation for image payload size and MIME type
    if (rawImage && typeof rawImage === 'string' && rawImage.startsWith('data:')) {
      const mimeMatch = rawImage.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1].toLowerCase();
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          return NextResponse.json(
            {
              success: false,
              error: `Unsupported image format (${mimeType}). Supported: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP`,
            },
            { status: 400 }
          );
        }

        // Compute approximate decoded byte size
        const base64Data = rawImage.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        const byteLength = (base64Data.length * 3) / 4;
        if (byteLength > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { success: false, error: 'Image size exceeds 10MB limit.' },
            { status: 400 }
          );
        }
      }
    }

    // Dynamic column fallback mapping matching Part 1 specifications
    const insertPayload: Record<string, any> = {
      title: body.title || body.event_name,
      event_name: body.title || body.event_name,
      description: body.description || '',
      image_url: body.image_url || body.poster_url || body.posterUrl || '',
      venue: body.venue || body.location || 'Coimbatore',
      location: body.venue || body.location || 'Coimbatore',
      event_date: body.event_date || body.date || new Date().toISOString().split('T')[0],
      event_time: body.event_time || body.time || '10:00 AM',
      contact_phone: body.contact_phone || '',
      category: 'EVENT',
      is_featured: Boolean(body.is_featured || body.featured),
    };

    if (body.id) {
      insertPayload.id = toUuid(body.id);
    }

    let { data: inserted, error } = await supabaseAdmin
      .from('events')
      .insert([insertPayload])
      .select()
      .single();

    // Defensive column fallback: handle PGRST204 if schema cache is out of date on any column
    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
      console.warn('PGRST204 schema cache error detected, retrying with defensive column filtering:', error.message);
      const match = error.message.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        delete insertPayload[match[1]];
      } else {
        delete insertPayload.category;
      }
      const retryResult = await supabaseAdmin
        .from('events')
        .insert([insertPayload])
        .select()
        .single();
      inserted = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error("Supabase Event Insert Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/events');
      revalidatePath('/admin');
    } catch (revalErr) {
      console.warn('[API /api/events POST] Revalidation notice:', revalErr);
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/events POST] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create event' }, { status: 500 });
  }
}

// PUT /api/events
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID required for update.' }, { status: 400 });
    }

    const validUuid = toUuid(id);
    const updatePayload: Record<string, any> = {};

    if (body.title !== undefined || body.event_name !== undefined) {
      const t = (body.title || body.event_name).trim();
      updatePayload.title = t;
      updatePayload.event_name = t;
    }
    if (body.venue !== undefined || body.location !== undefined) {
      const v = (body.venue || body.location).trim();
      updatePayload.venue = v;
      updatePayload.location = v;
    }
    if (body.event_date !== undefined || body.date !== undefined) {
      updatePayload.event_date = body.event_date || body.date;
    }
    if (body.event_time !== undefined || body.time !== undefined) {
      updatePayload.event_time = body.event_time || body.time;
    }
    if (body.description !== undefined) {
      updatePayload.description = body.description;
    }
    if (body.contact_phone !== undefined) {
      updatePayload.contact_phone = body.contact_phone;
    }
    if (body.category !== undefined) {
      updatePayload.category = 'EVENT';
    }
    if (body.is_featured !== undefined || body.featured !== undefined) {
      updatePayload.is_featured = Boolean(body.is_featured ?? body.featured);
    }

    const rawImage = body.image_url || body.poster_url || body.posterUrl;
    if (rawImage !== undefined) {
      if (rawImage && typeof rawImage === 'string' && rawImage.startsWith('data:')) {
        const mimeMatch = rawImage.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1].toLowerCase();
          if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            return NextResponse.json(
              { success: false, error: `Unsupported image format (${mimeType}).` },
              { status: 400 }
            );
          }
          const base64Data = rawImage.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
          const byteLength = (base64Data.length * 3) / 4;
          if (byteLength > MAX_IMAGE_BYTES) {
            return NextResponse.json(
              { success: false, error: 'Image size exceeds 10MB limit.' },
              { status: 400 }
            );
          }
        }
      }
      updatePayload.image_url = rawImage;
    }

    let { data: updated, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', validUuid)
      .select()
      .maybeSingle();

    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
      console.warn('PGRST204 error during update, trying defensive column filtering:', error.message);
      const match = error.message.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        delete updatePayload[match[1]];
      }
      const retry = await supabaseAdmin
        .from('events')
        .update(updatePayload)
        .eq('id', validUuid)
        .select()
        .maybeSingle();
      updated = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Supabase Event Update Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/events');
      revalidatePath('/admin');
    } catch (e) {}

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API /api/events PUT] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
    }

    const validUuid = toUuid(id);
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .or(`id.eq.${validUuid},id.eq.${id}`);

    if (error) {
      console.error('[API /api/events DELETE] Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/events');
      revalidatePath('/admin');
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err: any) {
    console.error('[API /api/events DELETE] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete event' }, { status: 500 });
  }
}
