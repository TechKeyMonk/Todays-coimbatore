import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseServer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface DirectoryListing {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  icon: string;
  rating: number;
  reviewsCount: number;
  area: string;
  address: string;
  phone: string;
  ownerName?: string;
  email?: string;
  website?: string;
  timing?: string;
  description: string;
  featured?: boolean;
  popular?: boolean;
  verified?: boolean;
  tags?: string[];
  imageUrl?: string;
  images?: string[];
  createdAt?: string;
}

function slugify(text: string): string {
  return (text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function toUuid(idStr?: any): string {
  if (!idStr) return crypto.randomUUID();
  const str = String(idStr).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return str;
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return [hash.slice(0, 8), hash.slice(8, 12), '4' + hash.slice(13, 16), '8' + hash.slice(17, 20), hash.slice(20, 32)].join('-');
}

function sanitizeUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function mapRowToListing(l: any): DirectoryListing {
  const images = Array.isArray(l.images) && l.images.length > 0
    ? l.images.filter(Boolean)
    : (l.image_url ? [l.image_url] : (l.photo_url ? [l.photo_url] : (l.photo ? [l.photo] : [])));
  const coverImage = images[0] || l.image_url || l.imageUrl || undefined;

  return {
    id: l.id,
    name: l.title || l.name || 'Business Listing',
    category: l.category || 'General Services',
    categorySlug: slugify(l.category || 'general'),
    icon: l.icon || 'building-2',
    phone: l.phone || '',
    address: l.address || '',
    area: l.area || 'Coimbatore',
    rating: typeof l.rating === 'number' ? l.rating : 4.5,
    reviewsCount: l.reviews_count || 12,
    verified: l.verified !== false,
    featured: !!l.featured,
    popular: !!l.popular,
    website: l.website || '',
    email: l.email || '',
    ownerName: l.owner_name || l.ownerName || undefined,
    timing: l.timing || undefined,
    description: l.description || ((l.title || l.name || 'This business') + ' in ' + (l.area || 'Coimbatore') + '.'),
    tags: Array.isArray(l.tags) ? l.tags : [],
    imageUrl: coverImage,
    images: images,
    createdAt: l.created_at || new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const query = searchParams.get('q') || undefined;

    let dbQuery = supabaseAdmin.from('listings').select('*').order('created_at', { ascending: false });

    if (category && category !== 'all' && category !== 'ALL') {
      dbQuery = dbQuery.ilike('category', category);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('[directory GET] Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch listings' }, { status: 500 });
    }

    let list = (data || []).map(mapRowToListing);

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.area.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.ownerName || '').toLowerCase().includes(q)
      );
    }

    return NextResponse.json(list, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    console.error('[directory GET] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch directory listings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'save';

    if (action === 'save' || action === 'create') {
      const item = body.listing || body;
      if (!item || (!item.name && !item.title)) {
        return NextResponse.json({ success: false, error: 'Business name is required' }, { status: 400 });
      }

      // Auto-insert custom category if not already in categories table
      if (item.category && item.category.trim()) {
        const catName = item.category.trim();
        const catSlug = slugify(item.categorySlug || catName);
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
              icon: item.icon || '🏢',
            }]);
          }
        } catch (catErr) {
          console.warn('[directory POST] Category auto-insert warning:', catErr);
        }
      }

      let imagesList: string[] = [];
      if (Array.isArray(item.images)) {
        imagesList = (item.images as any[])
          .map((u: any) => sanitizeUrl(u))
          .filter((u: string | null): u is string => u !== null)
          .slice(0, 5);
      } else if (item.imageUrl) {
        const s = sanitizeUrl(item.imageUrl);
        if (s) imagesList = [s];
      }

      const listingPayload: any = {
        id: toUuid(item.id || item.name || item.title),
        title: (item.name || item.title || '').trim(),
        category: (item.category || 'General').trim(),
        phone: item.phone || null,
        address: item.address || null,
        area: item.area || 'Coimbatore',
        pincode: item.pincode || null,
        rating: typeof item.rating === 'number' ? item.rating : 4.5,
        images: imagesList,
      };

      const { data: upserted, error } = await supabaseAdmin
        .from('listings')
        .upsert([listingPayload], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      try { revalidatePath('/'); revalidatePath('/admin'); revalidatePath('/directory'); } catch {}
      return NextResponse.json({ success: true, listing: mapRowToListing(upserted) }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    if (action === 'update') {
      const id = body.id || body.listing?.id;
      const updates = body.updates || body.listing;
      if (!id || !updates) return NextResponse.json({ success: false, error: 'ID and updates required' }, { status: 400 });
      const p: any = {};
      if (updates.name !== undefined || updates.title !== undefined) p.title = updates.name || updates.title;
      if (updates.category !== undefined) p.category = updates.category;
      if (updates.phone !== undefined) p.phone = updates.phone;
      if (updates.address !== undefined) p.address = updates.address;
      if (updates.area !== undefined) p.area = updates.area;
      if (updates.rating !== undefined) p.rating = updates.rating;
      if (updates.images !== undefined) {
        p.images = Array.isArray(updates.images)
          ? (updates.images as any[])
              .map((u: any) => sanitizeUrl(u))
              .filter((u: string | null): u is string => u !== null)
              .slice(0, 5)
          : [];
      } else if (updates.imageUrl !== undefined) {
        const s = sanitizeUrl(updates.imageUrl);
        if (s) p.images = [s];
      }
      const { data: updated, error } = await supabaseAdmin.from('listings').update(p).eq('id', toUuid(id)).select().single();
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      try { revalidatePath('/admin'); revalidatePath('/directory'); } catch {}
      return NextResponse.json({ success: true, listing: mapRowToListing(updated) }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    if (action === 'delete') {
      const id = body.id;
      if (!id) return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
      const { error } = await supabaseAdmin.from('listings').delete().eq('id', toUuid(id));
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      try { revalidatePath('/admin'); revalidatePath('/directory'); } catch {}
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    if (action === 'toggle_featured' || action === 'toggle_popular') {
      const id = body.id;
      const field = action === 'toggle_featured' ? 'featured' : 'popular';
      const { data: cur } = await supabaseAdmin.from('listings').select(field).eq('id', toUuid(id)).single();
      const { error } = await supabaseAdmin.from('listings').update({ [field]: !(cur as any)?.[field] }).eq('id', toUuid(id));
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    return NextResponse.json({ success: false, error: 'Unknown action: ' + action }, { status: 400 });

  } catch (error: any) {
    console.error('[directory POST] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process directory operation' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const item = body.listing || body;
    const id = body.id || item?.id;
    if (!id) return NextResponse.json({ success: false, error: 'Listing ID is required for PUT update' }, { status: 400 });
    const p: any = {};
    if (item.name !== undefined || item.title !== undefined) p.title = item.name || item.title;
    if (item.category !== undefined) p.category = item.category;
    if (item.phone !== undefined) p.phone = item.phone;
    if (item.address !== undefined) p.address = item.address;
    if (item.area !== undefined) p.area = item.area;
    if (item.rating !== undefined) p.rating = item.rating;
    if (item.images !== undefined) {
      p.images = Array.isArray(item.images)
        ? (item.images as any[])
            .map((u: any) => sanitizeUrl(u))
            .filter((u: string | null): u is string => u !== null)
            .slice(0, 5)
        : [];
    } else if (item.imageUrl !== undefined) {
      const s = sanitizeUrl(item.imageUrl);
      if (s) p.images = [s];
    }
    const { data: updated, error } = await supabaseAdmin.from('listings').update(p).eq('id', toUuid(id)).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    try { revalidatePath('/admin'); revalidatePath('/directory'); } catch {}
    return NextResponse.json({ success: true, listing: updated ? mapRowToListing(updated) : null }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    console.error('[directory PUT] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update directory listing' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) { try { const b = await request.json(); id = b.id; } catch {} }
    if (!id) return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    const { error } = await supabaseAdmin.from('listings').delete().eq('id', toUuid(id));
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    try { revalidatePath('/admin'); revalidatePath('/directory'); } catch {}
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    console.error('[directory DELETE] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete directory listing' }, { status: 500 });
  }
}
