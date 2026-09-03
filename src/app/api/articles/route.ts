import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Article } from '@/services/db';

const DB_PATH = path.join(process.cwd(), 'db.json');

let articlesCache: { articles: Article[] } | null = null;
let lastDbRead = 0;
const DB_CACHE_TTL = 5000;

async function readDb(): Promise<{ articles: Article[] }> {
  const now = Date.now();
  if (articlesCache && now - lastDbRead < DB_CACHE_TTL) {
    return articlesCache;
  }
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = await fs.promises.readFile(DB_PATH, 'utf8');
      articlesCache = JSON.parse(data);
      lastDbRead = now;
      return articlesCache || { articles: [] };
    }
  } catch (err) {
    console.error('Error reading db.json in API route:', err);
  }
  return { articles: [] };
}

async function writeDb(data: any) {
  articlesCache = data;
  lastDbRead = Date.now();
  try {
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json in API route:', err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const db = await readDb();
    let list = db.articles || [];

    if (category && category !== 'ALL') {
      const normCat = category.toUpperCase().trim();
      list = list.filter((a) => a.category?.toUpperCase().trim() === normCat);
    }

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    });

    return NextResponse.json(list, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const wordCount = ((body.content || '') + ' ' + (body.title || '')).trim().split(/\s+/).filter(Boolean).length;
    const computedReadTime = body.readTime || `${Math.max(1, Math.ceil(wordCount / 130))} min`;

    const newArticle: Article = {
      id: body.id || `art-${Date.now()}`,
      title: body.title.trim(),
      category: body.category || 'NEWS',
      subCategory: body.subCategory || 'General',
      author: body.author || 'Editorial Bureau',
      readTime: computedReadTime,
      publishedAt: body.publishedAt || 'Just now',
      createdAt: body.createdAt || new Date().toISOString(),
      isExclusive: !!body.isExclusive,
      status: body.status || 'published',
      mediaType: body.mediaType || 'image',
      imageUrl: body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim() !== '' && body.imageUrl.trim() !== 'null' && body.imageUrl.trim() !== 'undefined'
        ? body.imageUrl.trim()
        : undefined,
      videoUrl: body.videoUrl,
      videoTitle: body.videoTitle || body.title,
      videoDuration: body.videoDuration || '03:00',
      excerpt: body.excerpt || (body.content ? body.content.slice(0, 180) : 'Coimbatore hyper-local reporting.'),
      content: body.content || '',
      highlightStat: body.highlightStat || 'Breaking Story',
      commentsCount: 0,
      articleHref: `/article/${body.id || Date.now()}`,
    };

    const db = await readDb();
    db.articles = [newArticle, ...(db.articles || [])];
    await writeDb(db);

    const { revalidatePath } = await import('next/cache');
    try {
      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/news');
    } catch (e) {
      console.warn('Revalidation error:', e);
    }

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to publish article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const articleId = id || body?.id;
    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const { supabaseAdmin } = await import('@/lib/supabaseServer');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId);
    let query = supabaseAdmin.from('news').delete();
    if (isUuid) {
      query = query.or(`id.eq.${articleId},slug.eq.${articleId}`);
    } else {
      query = query.eq('slug', articleId);
    }

    const { error } = await query;
    if (error) {
      console.error('Error deleting article in Supabase news table:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const db = await readDb();
    if (db.articles && db.articles.length > 0) {
      db.articles = db.articles.filter((a) => a.id !== articleId && a.slug !== articleId);
      await writeDb(db);
    }

    const { revalidatePath } = await import('next/cache');
    try {
      revalidatePath('/');
      revalidatePath('/admin');
    } catch {}

    return NextResponse.json({ success: true, deletedId: articleId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete article' }, { status: 500 });
  }
}

