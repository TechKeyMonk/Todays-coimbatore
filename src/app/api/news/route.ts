import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { Article } from '@/services/db';
import { getCategoryConfig, isArticleInCategory, sanitizeCategorySlug } from '@/lib/categories';

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

function mapNewsRowToArticle(row: any): Article {
  const wordCount = ((row.content || '') + ' ' + (row.title || '')).trim().split(/\s+/).filter(Boolean).length;
  const readTime = row.read_time || `${Math.max(1, Math.ceil(wordCount / 130))} min`;
  const slug = row.slug || slugify(row.title) || row.id;
  const isExclusive = !!(
    row.is_exclusive === true ||
    (Array.isArray(row.keywords) && row.keywords.includes('__EXCLUSIVE__'))
  );
  const videoUrl = row.video_url || undefined;
  const mediaType = (row.media_type || (videoUrl ? 'video' : 'image')) as 'image' | 'video';

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
    status: (row.status || 'published') as 'published' | 'draft' | 'archived',
    sourceUrl: row.source_url || undefined,
    source_url: row.source_url || undefined,
    mediaType,
    imageUrl: row.image_url || undefined,
    image: row.image_url || undefined,
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

/**
 * GET /api/news?category=tech&search=flyover&status=published&limit=50
 * Safely filters stories by category and/or search term with PostgREST query hardening.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get('category');
    const rawSearch = searchParams.get('search') || searchParams.get('q');
    const statusParam = searchParams.get('status') || 'published';
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100);

    let query = supabaseAdmin
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusParam === 'draft') {
      query = query.eq('status', 'draft');
    } else if (statusParam !== 'all') {
      query = query.or('status.eq.published,status.is.null');
    }

    // 1. Safe Category Query Handling
    if (rawCategory && rawCategory.trim() !== '' && rawCategory.toUpperCase() !== 'ALL') {
      const sanitizedCat = sanitizeCategorySlug(rawCategory);
      const categoryConfig = getCategoryConfig(sanitizedCat);

      if (categoryConfig && categoryConfig.allowedDbCategories.length > 0) {
        query = query.in('category', categoryConfig.allowedDbCategories);
      } else {
        const escaped = rawCategory.trim().replace(/[%_]/g, '');
        if (escaped.length > 0) {
          query = query.ilike('category', `%${escaped}%`);
        }
      }
    } else {
      // Standard news articles ignore EVENTS
      query = query.not('category', 'ilike', '%event%');
    }

    // 2. Safe Search Query Handling (Sanitize % and _ wildcards)
    if (rawSearch && rawSearch.trim().length > 0) {
      const sanitizedSearch = rawSearch.trim().replace(/[%_]/g, '');
      if (sanitizedSearch.length > 0) {
        query = query.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[news GET] Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch news', data: [], count: 0 }, { status: 500 });
    }

    let articles = (data || []).map(mapNewsRowToArticle);

    // 3. Secondary in-memory validation guards
    if (rawCategory && rawCategory.trim() !== '' && rawCategory.toUpperCase() !== 'ALL') {
      articles = articles.filter((art) => isArticleInCategory(art, rawCategory));
    } else {
      articles = articles.filter((art) => (art.category || '').toUpperCase().trim() !== 'EVENTS');
    }

    if (rawSearch && rawSearch.trim().length > 0) {
      const q = rawSearch.trim().toLowerCase();
      articles = articles.filter((art) =>
        art.title?.toLowerCase().includes(q) ||
        art.excerpt?.toLowerCase().includes(q) ||
        art.content?.toLowerCase().includes(q) ||
        art.category?.toLowerCase().includes(q) ||
        art.author?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: articles,
      count: articles.length,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('[news GET] Unhandled error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error', data: [], count: 0 }, { status: 500 });
  }
}
