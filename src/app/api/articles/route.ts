import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { Article } from '@/services/db';
import { getCategoryConfig, isArticleInCategory, sanitizeCategorySlug } from '@/lib/categories';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function cleanupOldStorageImage(oldUrl?: string | null) {
  if (!oldUrl || typeof oldUrl !== 'string') return;
  try {
    if (oldUrl.includes('articles-bucket')) {
      const parts = oldUrl.split('articles-bucket/');
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1].split('?')[0]);
        if (filePath) {
          await supabaseAdmin.storage.from('articles-bucket').remove([filePath]);
        }
      }
    }
  } catch (err) {
    console.warn('[Storage Cleanup] Non-critical error removing old article asset:', err);
  }
}

function mapNewsRowToArticle(row: any): Article {
  const wordCount = ((row.content || '') + ' ' + (row.title || '')).trim().split(/\s+/).filter(Boolean).length;
  const readTime = row.read_time || `${Math.max(1, Math.ceil(wordCount / 130))} min`;
  const slug = row.slug || slugify(row.title) || row.id;
  const isExclusive = !!(
    row.is_exclusive === true ||
    row.is_spotlight === true ||
    row.isSpotlight === true ||
    row.spotlight === 1 ||
    row.spotlight === true ||
    (Array.isArray(row.keywords) && (row.keywords.includes('__EXCLUSIVE__') || row.keywords.includes('__SPOTLIGHT__'))) ||
    (typeof row.keywords === 'string' && (row.keywords.includes('__EXCLUSIVE__') || row.keywords.includes('__SPOTLIGHT__'))) ||
    row.category?.toUpperCase() === 'BREAKING SPOTLIGHT'
  );
  const videoUrl = row.video_url || undefined;
  const mediaType = (row.media_type || (videoUrl ? 'video' : 'image')) as 'image' | 'video';

  const rawImageUrl = (row.image_url || '').toString().trim();
  const validImageUrl = rawImageUrl && rawImageUrl !== 'null' && rawImageUrl !== 'undefined' ? rawImageUrl : null;

  return {
    id: row.id,
    title: row.title || 'Untitled Story',
    slug,
    category: row.category || 'NEWS',
    subCategory: row.sub_category || row.category || 'Local Updates',
    author: row.author || 'Editorial Bureau',
    readTime,
    publishedAt: row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    isExclusive,
    isSpotlight: isExclusive,
    is_spotlight: isExclusive,
    status: (row.status || 'published') as 'published' | 'draft' | 'archived',
    sourceUrl: row.source_url || undefined,
    source_url: row.source_url || undefined,
    mediaType,
    imageUrl: validImageUrl || undefined,
    image: validImageUrl || undefined,
    image_url: validImageUrl,
    videoUrl,
    excerpt: row.content ? row.content.slice(0, 180).trim() + '...' : 'Coimbatore hyper-local reporting.',
    content: row.content || '',
    highlightStat: isExclusive ? 'Spotlight Exclusive' : 'Verified Kovai News',
    commentsCount: 0,
    articleHref: `/news/${slug}`,
    seoTitle: row.seo_title || undefined,
    metaDescription: row.meta_description || undefined,
    keywords: Array.isArray(row.keywords) ? row.keywords.join(', ') : row.keywords || undefined,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || searchParams.get('q') || undefined;
    const status = searchParams.get('status') || undefined;

    let query = supabaseAdmin.from('news').select('*').order('created_at', { ascending: false });

    if (status === 'draft') {
      query = query.eq('status', 'draft');
    } else if (status === 'all') {
      // No filter — return everything
    } else {
      // Default: published only
      query = query.or('status.eq.published,status.is.null');
    }

    if (category && category.trim() !== '' && category.toUpperCase() !== 'ALL') {
      const sanitized = sanitizeCategorySlug(category);
      const categoryConfig = getCategoryConfig(sanitized);
      if (categoryConfig && categoryConfig.allowedDbCategories.length > 0) {
        query = query.in('category', categoryConfig.allowedDbCategories);
      } else {
        const escaped = category.trim().replace(/[%_]/g, '');
        if (escaped.length > 0) {
          query = query.ilike('category', `%${escaped}%`);
        }
      }
    } else {
      // Standard news query strictly ignores EVENTS
      query = query.not('category', 'ilike', '%event%');
    }

    if (search && search.trim().length > 0) {
      const sanitizedSearch = search.trim().replace(/[%_]/g, '');
      if (sanitizedSearch.length > 0) {
        query = query.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[articles GET] Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
    }

    let articles = (data || []).map(mapNewsRowToArticle);

    if (category && category.trim() !== '' && category.toUpperCase() !== 'ALL') {
      articles = articles.filter((art) => isArticleInCategory(art, category));
    } else {
      articles = articles.filter((art) => (art.category || '').toUpperCase().trim() !== 'EVENTS');
    }

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      articles = articles.filter((art) =>
        art.title?.toLowerCase().includes(q) ||
        art.excerpt?.toLowerCase().includes(q) ||
        art.content?.toLowerCase().includes(q) ||
        art.category?.toLowerCase().includes(q) ||
        art.author?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(articles, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('[articles GET] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const title = body.title.trim();
    const rawSlug = body.slug || slugify(title) || `story-${Date.now()}`;
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const content = body.content || body.excerpt || '';
    const rawCategory = (body.category || 'NEWS').trim();
    if (rawCategory.toUpperCase() === 'EVENTS') {
      return NextResponse.json(
        { success: false, error: 'Category "EVENTS" cannot be assigned to general news stories. Please use the Events CMS.' },
        { status: 400 }
      );
    }
    const category = rawCategory;
    const author = body.author || 'Editorial Bureau';
    const rawImage = (body.imageUrl || body.image || body.mediaUrl || '').toString().trim();
    const imageUrl = rawImage && rawImage !== 'null' && rawImage !== 'undefined' ? rawImage : null;
    const videoUrl = body.videoUrl || null;
    const status = body.status || 'published';
    const isExclusive = !!(body.isExclusive || body.isSpotlight || body.is_spotlight || body.spotlight);

    // Build keywords array
    let keywords: string[] | null = null;
    if (body.keywords) {
      keywords = Array.isArray(body.keywords)
        ? body.keywords.map((k: string) => String(k).trim()).filter(Boolean)
        : String(body.keywords).split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    if (isExclusive) {
      keywords = keywords || [];
      if (!keywords.includes('__EXCLUSIVE__')) keywords.push('__EXCLUSIVE__');
      if (!keywords.includes('__SPOTLIGHT__')) keywords.push('__SPOTLIGHT__');
    }

    const newId =
      body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
        ? body.id
        : crypto.randomUUID();

    const { data: inserted, error } = await supabaseAdmin
      .from('news')
      .upsert(
        [
          {
            id: newId,
            title,
            slug,
            category,
            content,
            image_url: imageUrl,
            video_url: videoUrl,
            author,
            status,
            keywords,
            seo_title: body.seoTitle || title,
            meta_description: body.metaDescription || body.excerpt || content.slice(0, 160),
            og_image_url: body.ogImageUrl || imageUrl,
            source_url: body.sourceUrl || body.source_url || null,
            created_at: body.createdAt || new Date().toISOString(),
          },
        ],
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (error) {
      console.error('[articles POST] Supabase insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/news');
      revalidatePath(`/news/${slug}`);
      revalidatePath(`/article/${slug}`);
    } catch (e) {
      console.warn('[articles POST] Revalidation warning:', e);
    }

    return NextResponse.json(mapNewsRowToArticle(inserted), { status: 201 });
  } catch (error: any) {
    console.error('[articles POST] Unhandled error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to publish article' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const articleId = body.id;
    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required for update' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId);
    const updatePayload: any = {};

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.slug !== undefined) updatePayload.slug = slugify(body.slug);
    if (body.category !== undefined) {
      const catUpper = String(body.category).trim().toUpperCase();
      if (catUpper === 'EVENTS') {
        return NextResponse.json(
          { success: false, error: 'Category "EVENTS" cannot be assigned to general news stories.' },
          { status: 400 }
        );
      }
      updatePayload.category = body.category;
    }
    if (body.content !== undefined) updatePayload.content = body.content;
    if (body.author !== undefined) updatePayload.author = body.author;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.imageUrl !== undefined || body.image !== undefined || body.image_url !== undefined || body.mediaUrl !== undefined) {
      const raw = (body.imageUrl ?? body.image ?? body.image_url ?? body.mediaUrl ?? '').toString().trim();
      updatePayload.image_url = raw && raw !== 'null' && raw !== 'undefined' ? raw : null;
    }
    if (body.videoUrl !== undefined) updatePayload.video_url = body.videoUrl;
    if (body.seoTitle !== undefined) updatePayload.seo_title = body.seoTitle;
    if (body.metaDescription !== undefined) updatePayload.meta_description = body.metaDescription;
    if (body.keywords !== undefined || body.isExclusive !== undefined || body.isSpotlight !== undefined || body.is_spotlight !== undefined || body.spotlight !== undefined) {
      const isSpotlight = !!(body.isExclusive || body.isSpotlight || body.is_spotlight || body.spotlight);
      const kw: string[] = Array.isArray(body.keywords)
        ? body.keywords
        : typeof body.keywords === 'string'
        ? body.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : [];
      if (isSpotlight) {
        if (!kw.includes('__EXCLUSIVE__')) kw.push('__EXCLUSIVE__');
        if (!kw.includes('__SPOTLIGHT__')) kw.push('__SPOTLIGHT__');
      } else if (body.isExclusive === false || body.isSpotlight === false || body.is_spotlight === false || body.spotlight === 0) {
        const filteredKw = kw.filter((k: string) => k !== '__EXCLUSIVE__' && k !== '__SPOTLIGHT__');
        kw.length = 0;
        kw.push(...filteredKw);
      }
      updatePayload.keywords = kw.length > 0 ? kw : null;
    }
    updatePayload.updated_at = new Date().toISOString();

    // Check old image for storage cleanup
    let oldImageUrl: string | null = null;
    try {
      const { data: existingRow } = await supabaseAdmin
        .from('news')
        .select('image_url')
        .or(isUuid ? `id.eq.${articleId}` : `slug.eq.${articleId}`)
        .maybeSingle();
      if (existingRow?.image_url) {
        oldImageUrl = existingRow.image_url;
      }
    } catch (e) {
      console.warn('Could not fetch existing article image_url:', e);
    }

    let query = supabaseAdmin.from('news').update(updatePayload);
    if (isUuid) {
      query = query.or(`id.eq.${articleId},slug.eq.${articleId}`);
    } else {
      query = query.eq('slug', articleId);
    }
    const { data: updated, error } = await query.select().maybeSingle();

    if (error) {
      console.error('[articles PUT] Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (oldImageUrl && updatePayload.image_url === null && oldImageUrl !== updatePayload.image_url) {
      await cleanupOldStorageImage(oldImageUrl);
    }

    try {
      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/news');
      revalidatePath(`/news/${articleId}`);
      revalidatePath(`/article/${articleId}`);
    } catch (e) {
      console.warn('[articles PUT] Revalidation warning:', e);
    }

    return NextResponse.json({ success: true, data: updated ? mapNewsRowToArticle(updated) : { id: articleId } });
  } catch (error: any) {
    console.error('[articles PUT] Unhandled error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    let body: any = {};
    try { body = await request.json(); } catch {}

    const articleId = id || body?.id;
    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId);
    let query = supabaseAdmin.from('news').delete();
    if (isUuid) {
      query = query.or(`id.eq.${articleId},slug.eq.${articleId}`);
    } else {
      query = query.eq('slug', articleId);
    }

    const { error } = await query;
    if (error) {
      console.error('[articles DELETE] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/news');
      revalidatePath(`/news/${articleId}`);
      revalidatePath(`/article/${articleId}`);
    } catch (e) {
      console.warn('[articles DELETE] Revalidation warning:', e);
    }

    return NextResponse.json({ success: true, deletedId: articleId });
  } catch (error: any) {
    console.error('[articles DELETE] Unhandled error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete article' }, { status: 500 });
  }
}


