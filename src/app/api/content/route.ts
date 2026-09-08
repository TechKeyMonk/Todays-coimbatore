import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import * as nodeCrypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { sendEventSubmissionAlert } from '@/lib/email';
import { getCategoryConfig, isArticleInCategory, sanitizeCategorySlug } from '@/lib/categories';
import {
  INITIAL_DATABASE_ARTICLES,
  INITIAL_ADS_DB,
  reconcileAdsWithDefaults,
  INITIAL_SOCIAL_LINKS_DB,
  INITIAL_DIRECTORY_LISTINGS,
  INITIAL_DIRECTORY_CATEGORIES,
  INITIAL_DIRECTORY_VERIFICATIONS,
  INITIAL_DIRECTORY_REVIEWS,
  INITIAL_EVENTS_DB,
  INITIAL_BLOOD_DONORS_DB,
  INITIAL_EMERGENCY_ALERTS_DB,
  INITIAL_OUTAGES_DB,
  Article,
  DirectoryListing,
  EventRecord,
  BloodDonorRecord,
  AdSlotRecord,
  OutageRecord,
  SocialLinksRecord,
  mapNewsRowToEvent,
  mapDedicatedEventToEvent,
} from '@/services/db';

export const dynamic = 'force-dynamic';

let cachedAllData: any = null;
let cachedAllDataTime = 0;
const ALL_DATA_CACHE_TTL = 30_000; // 30 seconds in-memory cache

const systemConfigCache = new Map<string, { value: any; timestamp: number }>();
const CONFIG_CACHE_TTL = 30_000; // 30 seconds cache for system configs

function invalidateAllDataCache() {
  cachedAllData = null;
  cachedAllDataTime = 0;
  systemConfigCache.clear();
}

// Deterministic UUID converter (ensures compatibility with PostgreSQL UUID columns)
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

function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toKeywordsArray(input: any, isExclusive?: boolean, isSpotlight?: boolean): string[] | null {
  let arr: string[] = [];
  if (Array.isArray(input)) {
    arr = input.map((k) => String(k).trim()).filter(Boolean);
  } else if (typeof input === 'string') {
    arr = input.split(',').map((k) => k.trim()).filter(Boolean);
  }
  const flag = isExclusive || isSpotlight;
  if (flag) {
    if (!arr.includes('__EXCLUSIVE__')) arr.push('__EXCLUSIVE__');
    if (!arr.includes('__SPOTLIGHT__')) arr.push('__SPOTLIGHT__');
  } else if (isExclusive === false || isSpotlight === false) {
    arr = arr.filter((k) => k !== '__EXCLUSIVE__' && k !== '__SPOTLIGHT__');
  }
  return arr.length > 0 ? arr : null;
}

// Safely clean up removed/replaced assets from Supabase Storage bucket
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

// Map Supabase news row to Article model
function mapSupabaseNewsToArticle(row: any): Article {
  const wordCount = (row.content || row.title || '').trim().split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 130))} min`;
  const slug = row.slug || slugify(row.title) || row.id;
  const isExclusive = !!(
    row.is_exclusive === true ||
    row.isExclusive === true ||
    row.is_spotlight === true ||
    row.isSpotlight === true ||
    row.spotlight === 1 ||
    row.spotlight === true ||
    (Array.isArray(row.keywords) && (row.keywords.includes('__EXCLUSIVE__') || row.keywords.includes('__SPOTLIGHT__'))) ||
    (typeof row.keywords === 'string' && (row.keywords.includes('__EXCLUSIVE__') || row.keywords.includes('__SPOTLIGHT__'))) ||
    row.category?.toUpperCase() === 'BREAKING SPOTLIGHT'
  );
  const videoUrl = row.video_url || (row.media_url && String(row.media_url).includes('youtube') ? row.media_url : undefined);
  const mediaType = (row.media_type || (videoUrl ? 'video' : 'image')) as 'image' | 'video';

  const rawImageUrl = (row.image_url || '').toString().trim();
  const validImageUrl = rawImageUrl && rawImageUrl !== 'null' && rawImageUrl !== 'undefined' ? rawImageUrl : null;

  return {
    id: row.id,
    title: row.title || 'Untitled Coimbatore News',
    slug: slug,
    category: row.category || 'NEWS',
    subCategory: row.category || 'Local Updates',
    subTag: row.category || 'General',
    author: row.author || 'Editorial Bureau',
    readTime: readTime,
    publishedAt: row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.created_at || new Date().toISOString(),
    isExclusive: isExclusive,
    isSpotlight: isExclusive,
    is_spotlight: isExclusive,
    status: (row.status || 'published') as 'published' | 'draft' | 'archived',
    sourceUrl: row.source_url || undefined,
    source_url: row.source_url || undefined,
    mediaType: mediaType,
    imageUrl: validImageUrl || undefined,
    image: validImageUrl || undefined,
    image_url: validImageUrl,
    mediaUrl: videoUrl || validImageUrl || undefined,
    videoUrl: videoUrl,
    excerpt: row.content ? row.content.slice(0, 180).trim() + '...' : 'Coimbatore hyper-local reporting.',
    content: row.content || '',
    highlightStat: isExclusive ? 'Spotlight Exclusive' : 'Verified Kovai News',
    commentsCount: 0,
    articleHref: `/news/${slug}`,
    seoTitle: row.seo_title || undefined,
    metaDescription: row.meta_description || undefined,
    keywords: Array.isArray(row.keywords) ? row.keywords.join(', ') : row.keywords || undefined,
    ogImageUrl: row.og_image_url || undefined,
  };
}

// System configuration helper (stores JSON blobs in `enquiries` table with special user_name prefix `__SYSTEM_CONFIG_<KEY>`)
async function getSystemConfig<T>(key: string, fallback: T): Promise<T> {
  const cached = systemConfigCache.get(key);
  if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
    return cached.value as T;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('message')
      .eq('user_name', `__SYSTEM_CONFIG_${key}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return fallback;
    }

    const parsed = JSON.parse(data[0].message) as T;
    systemConfigCache.set(key, { value: parsed, timestamp: Date.now() });
    return parsed;
  } catch (err) {
    console.warn(`Error reading system config for ${key}:`, err);
    return fallback;
  }
}

async function setSystemConfig(key: string, value: any): Promise<boolean> {
  // Update cache immediately for instant response
  systemConfigCache.set(key, { value, timestamp: Date.now() });

  try {
    const serialized = JSON.stringify(value);
    const configUserName = `__SYSTEM_CONFIG_${key}`;

    // Clean up any older config rows for this key to prevent bloat
    await supabaseAdmin
      .from('enquiries')
      .delete()
      .eq('user_name', configUserName);

    // Insert latest config snapshot
    const { error } = await supabaseAdmin.from('enquiries').insert([
      {
        user_name: configUserName,
        user_phone: '0000000000',
        service_requested: 'SYSTEM_CONFIG_STORE',
        message: serialized,
        status: 'system_active',
      },
    ]);

    if (error) {
      console.error(`Error writing system config for ${key}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error saving system config for ${key}:`, err);
    return false;
  }
}

// GET /api/content?entity=all|articles|listings|categories|blood_donors|events|enquiries|config&key=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'all';

    // 1. Fetch Articles (News)
    if (entity === 'articles' || entity === 'news') {
      const statusParam = searchParams.get('status');
      const categoryParam = searchParams.get('category');
      let newsQuery = supabaseAdmin.from('news').select('*').order('created_at', { ascending: false });
      if (statusParam === 'draft') {
        newsQuery = newsQuery.eq('status', 'draft');
      } else if (statusParam === 'published') {
        newsQuery = newsQuery.or('status.eq.published,status.is.null');
      } else if (statusParam !== 'all') {
        newsQuery = newsQuery.or('status.eq.published,status.is.null');
      }

      if (categoryParam && categoryParam.toUpperCase() !== 'ALL') {
        const sanitized = sanitizeCategorySlug(categoryParam);
        const categoryConfig = getCategoryConfig(sanitized);
        newsQuery = newsQuery.in('category', categoryConfig.allowedDbCategories);
      } else {
        // Exclude EVENTS from general news articles fetch
        newsQuery = newsQuery.not('category', 'ilike', '%event%');
      }

      const { data, error } = await newsQuery;

      if (error) {
        console.error('Supabase fetch news error:', error);
        return NextResponse.json({ success: true, data: [] });
      }

      let liveArticles = (data || []).map(mapSupabaseNewsToArticle);

      if (categoryParam && categoryParam.toUpperCase() !== 'ALL') {
        liveArticles = liveArticles.filter((art) => isArticleInCategory(art, categoryParam));
      } else {
        liveArticles = liveArticles.filter((art) => (art.category || '').toUpperCase().trim() !== 'EVENTS');
      }

      return NextResponse.json({ success: true, data: liveArticles });
    }

    // 2. Fetch Directory Listings
    if (entity === 'listings' || entity === 'directory') {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch listings error:', error);
        return NextResponse.json({ success: true, data: [] });
      }

      const mappedListings: DirectoryListing[] = (data || []).map((l: any) => ({
        id: l.id,
        name: l.title || 'Business Listing',
        category: l.category || 'General Services',
        categorySlug: slugify(l.category || 'general'),
        icon: '🏢',
        phone: l.phone || '',
        address: l.address || '',
        area: l.area || 'Coimbatore',
        rating: typeof l.rating === 'number' ? l.rating : 4.5,
        reviewsCount: 12,
        verified: true,
        featured: false,
        popular: false,
        website: '',
        email: '',
        description: `${l.title} in ${l.area || 'Coimbatore'}.`,
        createdAt: l.created_at || new Date().toISOString(),
      }));

      return NextResponse.json({ success: true, data: mappedListings });
    }

    // 3. Fetch Blood Donors
    if (entity === 'blood_donors' || entity === 'donors') {
      const { data, error } = await supabaseAdmin
        .from('blood_donors')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase fetch blood donors error:', error);
        return NextResponse.json({ success: true, data: [] });
      }

      const mappedDonors: BloodDonorRecord[] = (data || []).map((d: any) => ({
        id: d.id,
        name: d.name || 'Anonymous Donor',
        bloodGroup: d.blood_group || 'O+',
        area: d.area || 'Coimbatore',
        phone: d.phone || '',
        isAvailable: d.status?.toLowerCase() !== 'unavailable',
        isVerified: true,
        status: (d.status?.toLowerCase() === 'available' ? 'approved' : d.status?.toLowerCase() || 'approved') as any,
        registeredDate: 'Recently',
      }));

      return NextResponse.json({ success: true, data: mappedDonors });
    }

    // 4. Fetch Events (Dedicated events table)
    if (entity === 'events') {
      try {
        const eventsRes = await supabaseAdmin
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        const mappedDedicated = (eventsRes.data || []).map(mapDedicatedEventToEvent);
        return NextResponse.json({ success: true, data: mappedDedicated });
      } catch (err: any) {
        console.error('Supabase fetch events error:', err);
        return NextResponse.json({ success: true, data: [] });
      }
    }

    // 5. Fetch Enquiries
    if (entity === 'enquiries') {
      const { data, error } = await supabaseAdmin
        .from('enquiries')
        .select('*')
        .not('user_name', 'like', '__SYSTEM_CONFIG_%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch enquiries error:', error);
        return NextResponse.json({ success: true, data: [] });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    // 6. Fetch Categories
    if (entity === 'categories') {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return NextResponse.json({ success: true, data: INITIAL_DIRECTORY_CATEGORIES });
      }

      return NextResponse.json({ success: true, data });
    }

    // 7. System Config Single Fetch
    if (entity === 'config') {
      const key = searchParams.get('key') || '';
      if (!key) {
        return NextResponse.json({ error: 'Config key required' }, { status: 400 });
      }
      const val = await getSystemConfig(key, null);
      return NextResponse.json({ success: true, key, data: val });
    }

    // 8. Universal Combined Bundle ("all")
    const now = Date.now();
    if (cachedAllData && now - cachedAllDataTime < ALL_DATA_CACHE_TTL) {
      return NextResponse.json(
        { success: true, data: cachedAllData, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
      );
    }

    const statusParam = searchParams.get('status');
    let universalNewsQuery = supabaseAdmin
      .from('news')
      .select('*')
      .not('category', 'ilike', '%event%')
      .order('created_at', { ascending: false });
    if (statusParam === 'draft') {
      universalNewsQuery = universalNewsQuery.eq('status', 'draft');
    } else if (statusParam !== 'all') {
      universalNewsQuery = universalNewsQuery.or('status.eq.published,status.is.null');
    }

    const [
      newsRes,
      listingsRes,
      categoriesRes,
      donorsRes,
      eventsRes,
      enquiriesRes,
      outagesData,
      adsData,
      socialLinksData,
      emergencyAlertsData,
      verificationsData,
      reviewsData,
      donorEnquiriesData,
    ] = await Promise.all([
      universalNewsQuery,
      supabaseAdmin.from('listings').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('categories').select('*').order('name', { ascending: true }),
      supabaseAdmin.from('blood_donors').select('*').order('name', { ascending: true }),
      supabaseAdmin.from('events').select('*').order('event_date', { ascending: true }),
      supabaseAdmin.from('enquiries').select('*').not('user_name', 'like', '__SYSTEM_CONFIG_%').order('created_at', { ascending: false }),
      getSystemConfig<OutageRecord[]>('OUTAGES', INITIAL_OUTAGES_DB),
      getSystemConfig<AdSlotRecord[]>('ADS', INITIAL_ADS_DB),
      getSystemConfig<SocialLinksRecord>('SOCIAL_LINKS', INITIAL_SOCIAL_LINKS_DB),
      getSystemConfig('EMERGENCY_BLOOD', INITIAL_EMERGENCY_ALERTS_DB),
      getSystemConfig('VERIFICATIONS', INITIAL_DIRECTORY_VERIFICATIONS),
      getSystemConfig('REVIEWS', INITIAL_DIRECTORY_REVIEWS),
      getSystemConfig('DONOR_ENQUIRIES', []),
    ]);

    // Map and assemble final combined bundle directly from live database
    const articles = (newsRes.data || [])
      .map(mapSupabaseNewsToArticle)
      .filter((art) => (art.category || '').toUpperCase().trim() !== 'EVENTS');

    const listings: DirectoryListing[] = (listingsRes.data || []).map((l: any) => ({
      id: l.id,
      name: l.title || 'Business Listing',
      category: l.category || 'General Services',
      categorySlug: slugify(l.category || 'general'),
      icon: '🏢',
      phone: l.phone || '',
      address: l.address || '',
      area: l.area || 'Coimbatore',
      rating: typeof l.rating === 'number' ? l.rating : 4.5,
      reviewsCount: 12,
      verified: true,
      featured: false,
      popular: false,
      website: '',
      email: '',
      description: `${l.title} in ${l.area || 'Coimbatore'}.`,
      createdAt: l.created_at || new Date().toISOString(),
    }));

    const bloodDonors: BloodDonorRecord[] = (donorsRes.data || []).map((d: any) => ({
      id: d.id,
      name: d.name || 'Anonymous Donor',
      bloodGroup: d.blood_group || 'O+',
      area: d.area || 'Coimbatore',
      phone: d.phone || '',
      isAvailable: d.status?.toLowerCase() !== 'unavailable',
      isVerified: true,
      status: (d.status?.toLowerCase() === 'available' ? 'approved' : d.status?.toLowerCase() || 'approved') as any,
      registeredDate: 'Recently',
    }));

    // Dedicated events from `events` table only. Exclude general news stories.
    const dedicatedEvents: EventRecord[] = (eventsRes.data || []).map(mapDedicatedEventToEvent);
    const events: EventRecord[] = dedicatedEvents.filter((ev) => (ev.category || '').toUpperCase().trim() !== 'NEWS');

    const resultData = {
      articles,
      listings,
      categories: categoriesRes.data?.length ? categoriesRes.data : INITIAL_DIRECTORY_CATEGORIES,
      bloodDonors,
      events,
      outages: outagesData || INITIAL_OUTAGES_DB,
      ads: reconcileAdsWithDefaults(adsData || INITIAL_ADS_DB),
      socialLinks: socialLinksData || INITIAL_SOCIAL_LINKS_DB,
      emergencyAlerts: emergencyAlertsData || INITIAL_EMERGENCY_ALERTS_DB,
      enquiries: enquiriesRes.data || [],
      verifications: verificationsData || INITIAL_DIRECTORY_VERIFICATIONS,
      reviews: reviewsData || INITIAL_DIRECTORY_REVIEWS,
      donorEnquiries: donorEnquiriesData || [],
    };

    cachedAllData = resultData;
    cachedAllDataTime = Date.now();

    return NextResponse.json(
      {
        success: true,
        data: resultData,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: any) {
    console.error('API /api/content GET Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/content (Handles universal administrative CRUD actions with full service role access)
export async function POST(request: Request) {
  try {
    invalidateAllDataCache();
    const body = await request.json();
    const { action, entity, id, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 });
    }

    // =========================================================================
    // 1. ARTICLES / NEWS CRUD
    // =========================================================================
    if (action === 'create_article') {
      const title = (data?.title || 'Untitled Story').trim();
      const rawSlug = data?.slug || slugify(title) || `story-${Date.now()}`;
      const baseSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 90).replace(/-+$/, '');
      const slug = baseSlug || `story-${Date.now()}`;
      const content = (data?.content || data?.excerpt || title).trim();
      const rawCategory = (data?.category || 'NEWS').trim();
      if (rawCategory.toUpperCase() === 'EVENTS') {
        return NextResponse.json(
          { error: 'Category "EVENTS" cannot be assigned to general news stories. Please use the Events CMS.' },
          { status: 400 }
        );
      }
      const category = rawCategory;
      const author = data?.author || 'Editorial Bureau';
      const rawImg = (data?.imageUrl || data?.image || data?.image_url || data?.mediaUrl || '').toString().trim();
      const imageUrl = rawImg && rawImg !== 'null' && rawImg !== 'undefined' ? rawImg : null;
      const seoTitle = (data?.seoTitle || title).slice(0, 200);
      const metaDescription = (data?.metaDescription || data?.excerpt || content || title).slice(0, 160);
      const keywords = toKeywordsArray(data?.keywords, data?.isExclusive, data?.isSpotlight || data?.is_spotlight);
      const ogImageUrl = data?.ogImageUrl || imageUrl;
      const validUuid = toUuid(data?.id || slug);

      // Upsert into Supabase `news` table
      let { data: inserted, error } = await supabaseAdmin
        .from('news')
        .upsert(
          [
            {
              id: validUuid,
              title,
              slug,
              category,
              content,
              image_url: imageUrl,
              author,
              seo_title: seoTitle,
              meta_description: metaDescription,
              keywords,
              og_image_url: ogImageUrl,
              status: data?.status || 'published',
              created_at: data?.createdAt || new Date().toISOString(),
            },
          ],
          { onConflict: 'slug' }
        )
        .select()
        .single();

      if (error && (error.message?.includes('duplicate key') || error.code === '23505')) {
        const uniqueSlug = `${slug.slice(0, 75)}-${Date.now()}`;
        const fallbackRes = await supabaseAdmin
          .from('news')
          .insert([
            {
              id: validUuid,
              title,
              slug: uniqueSlug,
              category,
              content,
              image_url: imageUrl,
              author,
              seo_title: seoTitle,
              meta_description: metaDescription,
              keywords,
              og_image_url: ogImageUrl,
              status: data?.status || 'published',
              created_at: data?.createdAt || new Date().toISOString(),
            },
          ])
          .select()
          .single();
        if (!fallbackRes.error) {
          inserted = fallbackRes.data;
          error = null;
        }
      }

      if (error) {
        console.error('Error inserting article in Supabase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      try {
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath(`/news/${slug}`);
        revalidatePath('/news');
      } catch (e) {
        console.warn('Revalidation error:', e);
      }

      return NextResponse.json({ success: true, data: mapSupabaseNewsToArticle(inserted) });
    }

    if (action === 'approve_article') {
      const articleId = id || data?.id;
      if (!articleId) {
        return NextResponse.json({ error: 'Article ID or Slug required for approval' }, { status: 400 });
      }
      const validUuid = toUuid(articleId);
      const nowIso = new Date().toISOString();
      const { data: approved, error } = await supabaseAdmin
        .from('news')
        .update({
          status: 'published',
          created_at: nowIso,
        })
        .or(`id.eq.${validUuid},slug.eq.${articleId}`)
        .select()
        .maybeSingle();

      invalidateAllDataCache();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      try {
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath(`/news/${articleId}`);
        revalidatePath('/news');
      } catch (e) {
        console.warn('Revalidation error:', e);
      }

      return NextResponse.json({
        success: true,
        data: approved ? mapSupabaseNewsToArticle(approved) : null,
      });
    }

    if (action === 'update_article') {
      const articleId = id || data?.id;
      if (!articleId) {
        return NextResponse.json({ error: 'Article ID or Slug required for update' }, { status: 400 });
      }

      const updatePayload: any = {};
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.slug !== undefined) updatePayload.slug = slugify(data.slug);
      if (data.category !== undefined) {
        const catUpper = String(data.category).trim().toUpperCase();
        if (catUpper === 'EVENTS') {
          return NextResponse.json(
            { error: 'Category "EVENTS" cannot be assigned to general news stories.' },
            { status: 400 }
          );
        }
        updatePayload.category = data.category;
      }
      if (data.content !== undefined) updatePayload.content = data.content;
      if (data.author !== undefined) updatePayload.author = data.author;
      if (data.imageUrl !== undefined || data.image !== undefined || data.image_url !== undefined || data.mediaUrl !== undefined) {
        const rawImg = (data.imageUrl ?? data.image ?? data.image_url ?? data.mediaUrl ?? '').toString().trim();
        updatePayload.image_url = rawImg && rawImg !== 'null' && rawImg !== 'undefined' ? rawImg : null;
      }
      if (data.seoTitle !== undefined) updatePayload.seo_title = data.seoTitle;
      if (data.metaDescription !== undefined) updatePayload.meta_description = data.metaDescription;

      if (data.isExclusive !== undefined || data.isSpotlight !== undefined || data.is_spotlight !== undefined || data.keywords !== undefined) {
        updatePayload.keywords = toKeywordsArray(data.keywords, data.isExclusive, data.isSpotlight || data.is_spotlight);
      }

      if (data.ogImageUrl !== undefined) updatePayload.og_image_url = data.ogImageUrl;

      const nowIso = data?.updatedAt || data?.createdAt || new Date().toISOString();
      updatePayload.created_at = nowIso;

      const validUuid = toUuid(articleId);

      // Safe check for existing image to trigger asset cleanup if removed
      let oldImageUrl: string | null = null;
      try {
        const { data: existingRow } = await supabaseAdmin
          .from('news')
          .select('image_url')
          .or(`id.eq.${validUuid},slug.eq.${articleId}`)
          .maybeSingle();
        if (existingRow?.image_url) {
          oldImageUrl = existingRow.image_url;
        }
      } catch (e) {
        console.warn('Could not fetch existing article image_url:', e);
      }

      const { data: updated, error } = await supabaseAdmin
        .from('news')
        .update(updatePayload)
        .or(`id.eq.${validUuid},slug.eq.${articleId}`)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating article in Supabase:', error);
      }

      if (oldImageUrl && updatePayload.image_url === null && oldImageUrl !== updatePayload.image_url) {
        await cleanupOldStorageImage(oldImageUrl);
      }

      if (!updated) {
        // Upsert fallback to ensure story is permanently in Supabase
        const upsertRecord = {
          id: validUuid,
          title: data.title || 'Coimbatore Story',
          slug: data.slug ? slugify(data.slug) : slugify(data.title || articleId),
          category: data.category || 'NEWS',
          content: data.content || data.excerpt || '',
          author: data.author || 'Editorial Bureau',
          image_url: updatePayload.image_url !== undefined ? updatePayload.image_url : (data.imageUrl || data.image || data.image_url || data.mediaUrl || null),
          keywords: toKeywordsArray(data.keywords, data.isExclusive),
          created_at: data.createdAt || new Date().toISOString(),
        };
        const { data: upserted } = await supabaseAdmin
          .from('news')
          .upsert([upsertRecord], { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (upserted) {
          try {
            revalidatePath('/');
            revalidatePath('/admin');
            revalidatePath(`/news/${articleId}`);
            revalidatePath('/news');
          } catch (e) {
            console.warn('Revalidation error:', e);
          }
          return NextResponse.json({
            success: true,
            data: mapSupabaseNewsToArticle(upserted),
          });
        }
      }

      try {
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath(`/news/${articleId}`);
        revalidatePath('/news');
      } catch (e) {
        console.warn('Revalidation error:', e);
      }

      return NextResponse.json({
        success: true,
        data: updated ? mapSupabaseNewsToArticle(updated) : { id: articleId, ...data },
      });
    }

    if (action === 'delete_article' || action === 'delete_news') {
      const articleId = id || data?.id || body?.id;
      if (!articleId) {
        return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId);
      const validUuid = isUuid ? articleId : toUuid(articleId);

      // Explicit hard DELETE on Supabase 'news' table bypassing RLS using supabaseAdmin
      const { error } = await supabaseAdmin
        .from('news')
        .delete()
        .or(`id.eq.${validUuid},slug.eq.${articleId}`);

      if (error) {
        console.error('Error deleting article from news table in Supabase:', error);
        return NextResponse.json({ error: error.message, success: false }, { status: 500 });
      }

      // Invalidate in-memory server cache
      invalidateAllDataCache();

      // Immediately purge Next.js cached pages
      try {
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/admin/review');
        revalidatePath(`/news/${articleId}`);
        revalidatePath(`/article/${articleId}`);
      } catch (revalErr) {
        console.warn('Revalidation warning:', revalErr);
      }

      return NextResponse.json({ success: true, deletedId: articleId });
    }

    // =========================================================================
    // 2. DIRECTORY LISTINGS CRUD
    // =========================================================================
    if (action === 'create_listing') {
      const validUuid = toUuid(data?.id || data?.title || data?.name);
      const catName = (data?.category || 'General').trim();
      const catSlug = slugify(data?.categorySlug || catName);

      // Auto-insert custom category if not already in categories table
      if (catName) {
        try {
          const { data: existingCat } = await supabaseAdmin
            .from('categories')
            .select('id, name, slug')
            .or(`slug.ilike.${catSlug},name.ilike.${catName}`)
            .limit(1);

          if (!existingCat || existingCat.length === 0) {
            await supabaseAdmin.from('categories').insert([{
              id: toUuid(catSlug),
              name: catName,
              slug: catSlug,
              icon: data.icon || '🏢',
            }]);
          }
        } catch (catErr) {
          console.warn('[content create_listing] Category auto-insert warning:', catErr);
        }
      }

      let imagesList: string[] = [];
      if (Array.isArray(data?.images)) {
        imagesList = data.images.filter((u: any) => typeof u === 'string' && /^https?:\/\//i.test(u.trim())).slice(0, 5);
      } else if (data?.imageUrl || data?.image_url || data?.photo_url || data?.photo) {
        const single = data.imageUrl || data.image_url || data.photo_url || data.photo;
        if (typeof single === 'string' && /^https?:\/\//i.test(single.trim())) imagesList = [single.trim()];
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('listings')
        .upsert([
          {
            id: validUuid,
            title: data.name || data.title,
            category: catName,
            phone: data.phone || null,
            address: data.address || null,
            area: data.area || 'Coimbatore',
            pincode: data.pincode || null,
            rating: typeof data.rating === 'number' ? data.rating : 4.5,
            images: imagesList,
          },
        ], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error creating listing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === 'update_listing') {
      const listingId = toUuid(id || data?.id);
      const updatePayload: any = {};
      if (data.name !== undefined || data.title !== undefined) updatePayload.title = data.name || data.title;
      if (data.category !== undefined) updatePayload.category = data.category;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.address !== undefined) updatePayload.address = data.address;
      if (data.area !== undefined) updatePayload.area = data.area;
      if (data.pincode !== undefined) updatePayload.pincode = data.pincode;
      if (data.rating !== undefined) updatePayload.rating = data.rating;
      if (data.images !== undefined) {
        updatePayload.images = Array.isArray(data.images)
          ? data.images.filter((u: any) => typeof u === 'string' && /^https?:\/\//i.test(u.trim())).slice(0, 5)
          : [];
      } else if (data.imageUrl !== undefined || data.image_url !== undefined) {
        const single = data.imageUrl || data.image_url;
        if (typeof single === 'string' && /^https?:\/\//i.test(single.trim())) {
          updatePayload.images = [single.trim()];
        }
      }

      const { data: updated, error } = await supabaseAdmin
        .from('listings')
        .update(updatePayload)
        .eq('id', listingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating listing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete_listing') {
      const listingId = toUuid(id || data?.id);
      const { error } = await supabaseAdmin.from('listings').delete().eq('id', listingId);

      if (error) {
        console.error('Error deleting listing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, deletedId: listingId });
    }

    // =========================================================================
    // 3. CATEGORIES CRUD
    // =========================================================================
    if (action === 'create_category') {
      const validUuid = toUuid(data?.id || data?.slug || data?.name);
      const { data: inserted, error } = await supabaseAdmin
        .from('categories')
        .upsert([
          {
            id: validUuid,
            name: data.name,
            slug: data.slug || slugify(data.name),
            icon: data.icon || '🏢',
          },
        ], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === 'update_category') {
      const catId = toUuid(id || data?.id || data?.slug);
      const { data: updated, error } = await supabaseAdmin
        .from('categories')
        .update({
          name: data.name,
          slug: data.slug || slugify(data.name),
          icon: data.icon || '🏢',
        })
        .eq('id', catId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete_category') {
      const catId = toUuid(id || data?.id);
      const { error } = await supabaseAdmin.from('categories').delete().eq('id', catId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deletedId: catId });
    }

    // =========================================================================
    // 4. BLOOD DONORS CRUD
    // =========================================================================
    if (action === 'create_blood_donor') {
      const validUuid = toUuid(data?.id || data?.phone || data?.name);
      const { data: inserted, error } = await supabaseAdmin
        .from('blood_donors')
        .upsert([
          {
            id: validUuid,
            name: data.name,
            blood_group: data.blood_group || data.bloodGroup || 'O+',
            area: data.area || 'Coimbatore',
            phone: data.phone,
            status: data.status || 'Available',
          },
        ], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === 'update_blood_donor') {
      const donorId = toUuid(id || data?.id);
      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.blood_group !== undefined || data.bloodGroup !== undefined) {
        updatePayload.blood_group = data.blood_group || data.bloodGroup;
      }
      if (data.area !== undefined) updatePayload.area = data.area;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.status !== undefined) updatePayload.status = data.status;

      const { data: updated, error } = await supabaseAdmin
        .from('blood_donors')
        .update(updatePayload)
        .eq('id', donorId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete_blood_donor') {
      const donorId = toUuid(id || data?.id);
      const { error } = await supabaseAdmin.from('blood_donors').delete().eq('id', donorId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deletedId: donorId });
    }

    // =========================================================================
    // 5. EVENTS CRUD
    // =========================================================================
    if (action === 'create_event') {
      const validUuid = toUuid(data?.id || data?.title || data?.event_name);
      const { data: inserted, error } = await supabaseAdmin
        .from('events')
        .upsert([
          {
            id: validUuid,
            event_name: data.event_name || data.title,
            location: data.location || data.venue || 'Coimbatore',
            event_date: data.event_date || data.date || null,
            contact_phone: data.contact_phone || data.contactPhone || null,
            description: data.description || '',
            image_url: data.image_url || data.imageUrl || data.posterUrl || null,
          },
        ], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Asynchronously notify admin of new event submission
      sendEventSubmissionAlert({
        data: {
          eventName: data.event_name || data.title || 'Coimbatore Event',
          location: data.location || data.venue || 'Coimbatore',
          eventDate: data.event_date || data.date || undefined,
          contactPhone: data.contact_phone || data.contactPhone || undefined,
          description: data.description || undefined,
          imageUrl: data.image_url || data.imageUrl || undefined,
        },
      }).catch((emailErr) => {
        console.error('[API create_event] Background event alert email failed:', emailErr);
      });

      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === 'update_event') {
      const eventId = toUuid(id || data?.id);
      const updatePayload: any = {};
      if (data.event_name !== undefined || data.title !== undefined) {
        updatePayload.event_name = data.event_name || data.title;
      }
      if (data.location !== undefined || data.venue !== undefined) {
        updatePayload.location = data.location || data.venue;
      }
      if (data.event_date !== undefined || data.date !== undefined) {
        updatePayload.event_date = data.event_date || data.date;
      }
      if (data.contact_phone !== undefined || data.contactPhone !== undefined) {
        updatePayload.contact_phone = data.contact_phone || data.contactPhone;
      }
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.image_url !== undefined || data.imageUrl !== undefined || data.posterUrl !== undefined) {
        updatePayload.image_url = data.image_url || data.imageUrl || data.posterUrl;
      }

      const { data: updated, error } = await supabaseAdmin
        .from('events')
        .update(updatePayload)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete_event') {
      const eventId = id || data?.id;
      const { error } = await supabaseAdmin.from('events').delete().eq('id', eventId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deletedId: eventId });
    }

    // =========================================================================
    // 6. ENQUIRIES CRUD
    // =========================================================================
    if (action === 'create_enquiry') {
      const { data: inserted, error } = await supabaseAdmin
        .from('enquiries')
        .insert([
          {
            user_name: data.user_name || data.name,
            user_phone: data.user_phone || data.phone || '',
            service_requested: data.service_requested || data.subject || 'General Enquiry',
            message: data.message || '',
            status: data.status || 'Pending',
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === 'update_enquiry_status') {
      const enquiryId = id || data?.id;
      if (!enquiryId) {
        return NextResponse.json({ error: 'Enquiry ID required' }, { status: 400 });
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId);
      if (isUuid) {
        const { data: updated, error } = await supabaseAdmin
          .from('enquiries')
          .update({ status: data.status })
          .eq('id', enquiryId)
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Supabase update enquiry status warning:', error.message);
        }
        return NextResponse.json({ success: true, data: updated || { id: enquiryId, status: data.status } });
      }
      return NextResponse.json({ success: true, data: { id: enquiryId, status: data.status } });
    }

    if (action === 'delete_enquiry') {
      const enquiryId = id || data?.id;
      if (!enquiryId) {
        return NextResponse.json({ error: 'Enquiry ID required' }, { status: 400 });
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId);
      if (isUuid) {
        // Safety: verify the target is a real user enquiry, not a system config row
        const { data: target } = await supabaseAdmin
          .from('enquiries')
          .select('id, user_name')
          .eq('id', enquiryId)
          .maybeSingle();

        if (target && String(target.user_name || '').startsWith('__SYSTEM_CONFIG_')) {
          console.warn(`Blocked attempt to delete system config row: ${target.user_name}`);
          return NextResponse.json({ error: 'Cannot delete system configuration records via enquiry API.' }, { status: 403 });
        }

        const { error } = await supabaseAdmin
          .from('enquiries')
          .delete()
          .eq('id', enquiryId)
          .not('user_name', 'like', '__SYSTEM_CONFIG_%');

        if (error) {
          console.warn('Supabase delete enquiry warning:', error.message);
        }
      }
      return NextResponse.json({ success: true, deletedId: enquiryId });
    }

    // =========================================================================
    // 7. SYSTEM CONFIG SAVE (Outages, Ads, Social Links, Emergency Blood, etc.)
    // =========================================================================
    if (action === 'save_config') {
      const configKey = (entity || body.key || '').toUpperCase();
      if (!configKey) {
        return NextResponse.json({ error: 'Config key/entity is required' }, { status: 400 });
      }

      const ok = await setSystemConfig(configKey, data);
      if (!ok) {
        return NextResponse.json({ error: `Failed to persist ${configKey} configuration` }, { status: 500 });
      }

      invalidateAllDataCache();

      try {
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/about-us');
        revalidatePath('/admin/about-us');
      } catch (revalErr) {
        console.warn('Revalidation error on save_config:', revalErr);
      }

      return NextResponse.json({ success: true, key: configKey, data });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('API /api/content POST Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const entity = searchParams.get('entity') || 'news';

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional if ID is provided via query param
    }

    const targetId = id || body.id;
    if (!targetId) {
      return NextResponse.json({ error: 'ID parameter required for deletion' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    const validUuid = isUuid ? targetId : toUuid(targetId);

    const targetEntity = (entity || body.entity || '').toLowerCase();
    const table = targetEntity === 'listings' || targetEntity === 'directory'
      ? 'listings'
      : targetEntity === 'categories'
      ? 'categories'
      : targetEntity === 'blood_donors' || targetEntity === 'donors'
      ? 'blood_donors'
      : targetEntity === 'events'
      ? 'events'
      : targetEntity === 'enquiries'
      ? 'enquiries'
      : 'news'; // Defaults to 'news' table

    // For enquiries, guard against accidentally deleting system config rows
    if (table === 'enquiries') {
      if (!isUuid) {
        // Non-UUID IDs are local/mock IDs (e.g. enq-1); nothing to delete in Supabase
        return NextResponse.json({ success: true, message: 'Enquiry cleared' });
      }

      const { data: targetRow } = await supabaseAdmin
        .from('enquiries')
        .select('id, user_name')
        .eq('id', validUuid)
        .maybeSingle();

      if (targetRow && String(targetRow.user_name || '').startsWith('__SYSTEM_CONFIG_')) {
        console.warn(`Blocked DELETE of system config row: ${targetRow.user_name}`);
        return NextResponse.json({ error: 'Cannot delete system configuration records.' }, { status: 403 });
      }
    }

    let query = supabaseAdmin.from(table).delete();
    if (table === 'news') {
      query = query.or(`id.eq.${validUuid},slug.eq.${targetId}`);
    } else if (table === 'enquiries') {
      // Extra safety: only delete real user enquiries, never system config rows
      query = query.eq('id', validUuid).not('user_name', 'like', '__SYSTEM_CONFIG_%');
    } else {
      query = query.eq('id', validUuid);
    }

    const { error } = await query;
    if (error) {
      console.error(`Error deleting from ${table} in Supabase:`, error);
      return NextResponse.json({ error: error.message, success: false }, { status: 500 });
    }

    invalidateAllDataCache();

    try {
      revalidatePath('/');
      revalidatePath('/admin');
      if (table === 'news') {
        revalidatePath('/admin/review');
        revalidatePath(`/news/${targetId}`);
        revalidatePath(`/article/${targetId}`);
      }
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return NextResponse.json({ success: true, deletedId: targetId, table });
  } catch (err: any) {
    console.error('API /api/content DELETE Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

