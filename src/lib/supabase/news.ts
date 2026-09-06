import { supabaseAdmin } from '@/lib/supabaseServer';
import { supabase } from '@/lib/supabaseClient';

export interface RssDraft {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  image?: string | null;
  source?: string | null;
  rss_guid: string;
  created_at?: string;
}

export interface PublishNewsPayload {
  title: string;
  slug: string;
  category: string;
  content: string;
  image_url?: string | null;
  author?: string;
  status: string;
  source_url?: string | null;
  rss_guid?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
}

/**
 * Server-side helper: Fetch all pending drafts from `rss_drafts` table
 */
export async function getPendingRssDrafts(): Promise<RssDraft[]> {
  const { data, error } = await supabaseAdmin
    .from('rss_drafts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[newsService] Error fetching rss_drafts:', error);
    throw new Error(error.message || 'Failed to fetch RSS drafts');
  }

  return (data as RssDraft[]) || [];
}

/**
 * Server-side helper: Upsert items into `rss_drafts` using `rss_guid` as unique conflict target
 */
export async function upsertRssDrafts(
  drafts: Array<Omit<RssDraft, 'id' | 'created_at'> & { id?: string }>
): Promise<RssDraft[]> {
  if (!drafts || drafts.length === 0) return [];

  const payload = drafts.map((d) => ({
    title: d.title.trim(),
    slug: d.slug.trim(),
    category: d.category || 'News',
    content: d.content.trim(),
    image: d.image || null,
    source: d.source || null,
    rss_guid: d.rss_guid,
  }));

  const { data, error } = await supabaseAdmin
    .from('rss_drafts')
    .upsert(payload, { onConflict: 'rss_guid' })
    .select();

  if (error) {
    console.error('[newsService] Error upserting into rss_drafts:', error);
    throw new Error(error.message || 'Failed to upsert RSS drafts');
  }

  return (data as RssDraft[]) || [];
}

/**
 * Server-side helper: Publish a draft by moving it from `rss_drafts` to `news`
 */
export async function publishRssDraftToNews(draftId: string): Promise<{ success: boolean; newsItem: any }> {
  // 1. Fetch draft from rss_drafts
  const { data: draft, error: fetchErr } = await supabaseAdmin
    .from('rss_drafts')
    .select('*')
    .eq('id', draftId)
    .single();

  if (fetchErr || !draft) {
    console.error(`[newsService] Draft ${draftId} not found in rss_drafts:`, fetchErr);
    throw new Error(fetchErr?.message || 'Draft not found in rss_drafts');
  }

  // 2. Prepare payload for news table
  const newsPayload: PublishNewsPayload = {
    title: draft.title,
    slug: draft.slug,
    category: draft.category || 'News',
    content: draft.content,
    image_url: draft.image || null,
    author: 'Editorial Bureau',
    status: 'published',
    source_url: draft.source || draft.rss_guid,
    rss_guid: draft.rss_guid,
    seo_title: `${draft.title} | Today's Coimbatore`,
    meta_description: draft.content ? draft.content.slice(0, 160) : '',
    keywords: ['Coimbatore', draft.category || 'News'],
  };

  // 3. Insert into news table with status = 'published'
  const { data: newsItem, error: insertErr } = await supabaseAdmin
    .from('news')
    .insert([newsPayload])
    .select()
    .single();

  if (insertErr) {
    console.error('[newsService] Error inserting published news item into news table:', insertErr);
    throw new Error(insertErr.message || 'Failed to insert published news into news table');
  }

  // 4. Delete the corresponding draft item from rss_drafts
  const { error: deleteErr } = await supabaseAdmin
    .from('rss_drafts')
    .delete()
    .eq('id', draftId);

  if (deleteErr) {
    console.warn(`[newsService] Notice: Published news created but failed to delete draft ${draftId} from rss_drafts:`, deleteErr);
  }

  return { success: true, newsItem };
}

/**
 * Server-side helper: Discard / delete draft item from `rss_drafts` without touching `news`
 */
export async function discardRssDraft(draftId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('rss_drafts')
    .delete()
    .eq('id', draftId);

  if (error) {
    console.error(`[newsService] Failed to delete draft ${draftId} from rss_drafts:`, error);
    throw new Error(error.message || 'Failed to delete draft from rss_drafts');
  }

  return true;
}

/**
 * Client-side API caller helpers
 */
export const clientNewsService = {
  async getRssDrafts(): Promise<RssDraft[]> {
    const res = await fetch('/api/admin/rss');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch RSS drafts');
    }
    const json = await res.json();
    return json.data || [];
  },

  async triggerFetch(): Promise<{ count: number; drafts: RssDraft[] }> {
    const res = await fetch('/api/admin/rss', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to trigger RSS fetch');
    }
    const json = await res.json();
    return { count: json.count || 0, drafts: json.data || [] };
  },

  async publishDraft(id: string): Promise<any> {
    const res = await fetch('/api/admin/rss', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to publish draft');
    }
    return await res.json();
  },

  async discardDraft(id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/rss?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to discard draft');
    }
    return true;
  },
};
