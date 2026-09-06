import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { publishRssDraftToNews, discardRssDraft } from '@/lib/supabase/news';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/rss
 * Fetches all pending drafts from Supabase `rss_drafts` table
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rss_drafts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/rss] Error fetching rss_drafts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database rows to standard Article/Draft format
    const drafts = (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      category: d.category || 'News',
      subCategory: d.category || 'News',
      subTag: d.category || 'News',
      content: d.content,
      excerpt: d.content ? d.content.slice(0, 160) : d.title,
      imageUrl: d.image,
      image: d.image,
      image_url: d.image,
      author: 'Editorial Bureau',
      created_at: d.created_at,
      createdAt: d.created_at,
      publishedAt: d.created_at,
      readTime: `${Math.max(1, Math.ceil((d.content || '').split(/\s+/).length / 130))} min`,
      seoTitle: `${d.title} | Today's Coimbatore`,
      metaDescription: (d.content || '').slice(0, 160),
      keywords: ['Coimbatore', d.category || 'News'],
      status: 'draft',
      sourceUrl: d.source || d.rss_guid,
      source_url: d.source || d.rss_guid,
      rss_guid: d.rss_guid,
    }));

    return NextResponse.json({
      success: true,
      count: drafts.length,
      data: drafts,
    });
  } catch (err: any) {
    console.error('[admin/rss] Unhandled GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/rss
 * Triggers RSS feed scanning, parses items, and upserts candidates into `rss_drafts`.
 * DO NOT insert anything into the main `news` table during this fetch step.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET || 'Todayscoimbatore@2026';
    const origin = new URL(request.url).origin;
    const fetchUrl = `${origin}/api/cron/fetch-news?secret=${encodeURIComponent(cronSecret)}&sync=true`;

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: json.error || 'Failed to trigger RSS ingestion' }, { status: res.status });
    }

    return NextResponse.json(json);
  } catch (err: any) {
    console.error('[admin/rss] Unhandled POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to trigger RSS ingestion' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/rss
 * Moves draft from `rss_drafts` to main `news` table on Publish
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, id } = body;

    if (action === 'publish') {
      if (!id) {
        return NextResponse.json({ error: 'Draft ID is required for publishing' }, { status: 400 });
      }

      const result = await publishRssDraftToNews(id);

      // Invalidate relevant public routes
      try {
        revalidatePath('/', 'layout');
        revalidatePath('/news');
        revalidatePath('/admin');
        revalidatePath('/admin/review');
      } catch (revErr) {
        console.warn('[admin/rss] Revalidation warning:', revErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Draft published to live news successfully',
        newsItem: result.newsItem,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[admin/rss] Unhandled PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to publish draft' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/rss
 * Discards draft by deleting it from `rss_drafts` without touching `news`
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Draft ID is required for deletion' }, { status: 400 });
    }

    await discardRssDraft(id);

    return NextResponse.json({
      success: true,
      message: 'Draft discarded from rss_drafts successfully',
    });
  } catch (err: any) {
    console.error('[admin/rss] Unhandled DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Failed to discard draft' }, { status: 500 });
  }
}
