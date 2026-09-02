import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
  createdAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const FILE_PATH = path.join(DATA_DIR, 'listings.json');

// In-Memory Fast Cache to prevent redundant disk I/O blocking
let inMemoryCache: DirectoryListing[] | null = null;
let lastDiskRead = 0;
const CACHE_TTL_MS = 5000; // 5 seconds in-memory TTL

async function ensureDataFile(): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      await fs.promises.writeFile(FILE_PATH, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Error ensuring listings.json file:', err);
  }
}

async function readListings(forceDisk = false): Promise<DirectoryListing[]> {
  const now = Date.now();
  if (!forceDisk && inMemoryCache && now - lastDiskRead < CACHE_TTL_MS) {
    return inMemoryCache;
  }

  await ensureDataFile();
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = await fs.promises.readFile(FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();
        const deduplicated: DirectoryListing[] = [];
        for (const item of parsed) {
          if (item && item.id && !seenIds.has(item.id)) {
            const uniqueKey = `${(item.name || '').trim().toLowerCase()}_${(item.category || '').trim().toLowerCase()}`;
            if (!seenKeys.has(uniqueKey)) {
              seenIds.add(item.id);
              seenKeys.add(uniqueKey);
              deduplicated.push(item);
            }
          }
        }
        inMemoryCache = deduplicated;
        lastDiskRead = now;
        return deduplicated;
      }
    }
  } catch (err) {
    console.error('Error reading listings.json:', err);
  }
  inMemoryCache = inMemoryCache || [];
  return inMemoryCache;
}

async function writeListings(listings: DirectoryListing[]): Promise<boolean> {
  inMemoryCache = listings;
  lastDiskRead = Date.now();
  await ensureDataFile();
  try {
    await fs.promises.writeFile(FILE_PATH, JSON.stringify(listings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing listings.json:', err);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const query = searchParams.get('q') || undefined;

    let list = await readListings();

    if (category && category !== 'all' && category !== 'ALL') {
      const targetSlug = category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      list = list.filter((item) => {
        const itemSlug = (item.categorySlug || item.category || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        return itemSlug === targetSlug || (item.category || '').toLowerCase() === category.toLowerCase();
      });
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          (item.name || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.area || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          ((item.ownerName || '').toLowerCase().includes(q))
        );
      });
    }

    return NextResponse.json(list, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('GET /api/directory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch directory listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'save';
    let listings = await readListings();

    if (action === 'save') {
      const item: DirectoryListing = body.listing || body;
      if (!item || !item.name) {
        return NextResponse.json({ success: false, error: 'Business name is required' }, { status: 400 });
      }

      // Check if item has an existing ID that matches any existing listing
      let existingIndex = -1;
      if (item.id) {
        existingIndex = listings.findIndex((d) => d.id === item.id);
      }

      // If not found by ID, also check by normalized name + category
      if (existingIndex < 0) {
        const normalizedKey = `${(item.name || '').trim().toLowerCase()}_${(item.category || '').trim().toLowerCase()}`;
        existingIndex = listings.findIndex(
          (d) => `${(d.name || '').trim().toLowerCase()}_${(d.category || '').trim().toLowerCase()}` === normalizedKey
        );
      }

      let finalRecord: DirectoryListing;
      if (existingIndex >= 0) {
        // UPDATE/REPLACE IN PLACE! DO NOT CREATE DUPLICATE!
        finalRecord = {
          ...listings[existingIndex],
          ...item,
          id: listings[existingIndex].id, // Keep existing ID
        };
        listings[existingIndex] = finalRecord;
      } else {
        // Brand new listing: generate ID and prepend
        finalRecord = {
          ...item,
          id: item.id || `dir-${Date.now()}`,
          createdAt: item.createdAt || new Date().toISOString(),
        };
        listings.unshift(finalRecord);
      }

      // Deduplicate before saving
      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const sanitized: DirectoryListing[] = [];
      for (const d of listings) {
        if (d && d.id && !seenIds.has(d.id)) {
          const uKey = `${(d.name || '').trim().toLowerCase()}_${(d.category || '').trim().toLowerCase()}`;
          if (!seenKeys.has(uKey)) {
            seenIds.add(d.id);
            seenKeys.add(uKey);
            sanitized.push(d);
          }
        }
      }

      await writeListings(sanitized);
      return NextResponse.json({ success: true, listing: finalRecord, listings: sanitized }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    if (action === 'update') {
      const id = body.id || body.listing?.id;
      const updates = body.updates || body.listing;
      if (!id || !updates) {
        return NextResponse.json({ success: false, error: 'ID and updates required' }, { status: 400 });
      }

      let updatedRecord: DirectoryListing | null = null;
      listings = listings.map((d): DirectoryListing => {
        if (d.id === id) {
          const merged: DirectoryListing = { ...d, ...updates, id: d.id };
          updatedRecord = merged;
          return merged;
        }
        return d;
      });

      // Deduplicate
      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const sanitized: DirectoryListing[] = [];
      for (const d of listings) {
        if (d && d.id && !seenIds.has(d.id)) {
          const uKey = `${(d.name || '').trim().toLowerCase()}_${(d.category || '').trim().toLowerCase()}`;
          if (!seenKeys.has(uKey)) {
            seenIds.add(d.id);
            seenKeys.add(uKey);
            sanitized.push(d);
          }
        }
      }

      await writeListings(sanitized);
      return NextResponse.json({ success: true, listing: updatedRecord, listings: sanitized }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    if (action === 'delete') {
      const id = body.id;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
      }

      listings = listings.filter((d) => d.id !== id);
      await writeListings(listings);
      return NextResponse.json({ success: true, listings }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    if (action === 'toggle_featured') {
      const id = body.id;
      listings = listings.map((d) => (d.id === id ? { ...d, featured: !d.featured } : d));
      await writeListings(listings);
      return NextResponse.json({ success: true, listings }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    if (action === 'toggle_popular') {
      const id = body.id;
      listings = listings.map((d) => (d.id === id ? { ...d, popular: !d.popular } : d));
      await writeListings(listings);
      return NextResponse.json({ success: true, listings }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('POST /api/directory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process directory operation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const item: DirectoryListing = body.listing || body;
    const id = body.id || item?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Listing ID is required for PUT update' }, { status: 400 });
    }

    let listings = await readListings();
    let updatedRecord: DirectoryListing | null = null;
    let found = false;

    listings = listings.map((d): DirectoryListing => {
      if (d.id === id) {
        found = true;
        const merged: DirectoryListing = { ...d, ...item, id: d.id };
        updatedRecord = merged;
        return merged;
      }
      return d;
    });

    if (!found && item && item.name) {
      const normalizedKey = `${(item.name || '').trim().toLowerCase()}_${(item.category || '').trim().toLowerCase()}`;
      const idx = listings.findIndex(
        (d) => `${(d.name || '').trim().toLowerCase()}_${(d.category || '').trim().toLowerCase()}` === normalizedKey
      );
      if (idx >= 0) {
        updatedRecord = { ...listings[idx], ...item, id: listings[idx].id };
        listings[idx] = updatedRecord;
      } else {
        updatedRecord = { ...item, id: id || `dir-${Date.now()}` };
        listings.unshift(updatedRecord);
      }
    }

    // Deduplicate
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const sanitized: DirectoryListing[] = [];
    for (const d of listings) {
      if (d && d.id && !seenIds.has(d.id)) {
        const uKey = `${(d.name || '').trim().toLowerCase()}_${(d.category || '').trim().toLowerCase()}`;
        if (!seenKeys.has(uKey)) {
          seenIds.add(d.id);
          seenKeys.add(uKey);
          sanitized.push(d);
        }
      }
    }

    await writeListings(sanitized);
    return NextResponse.json({ success: true, listing: updatedRecord, listings: sanitized }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('PUT /api/directory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update directory listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }
    if (!id) {
      return NextResponse.json({ success: false, error: 'Listing ID is required' }, { status: 400 });
    }

    let listings = await readListings();
    listings = listings.filter((d) => d.id !== id);
    await writeListings(listings);
    return NextResponse.json({ success: true, listings }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('DELETE /api/directory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete directory listing' },
      { status: 500 }
    );
  }
}
