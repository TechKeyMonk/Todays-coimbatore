/**
 * Safe LocalStorage Utilities for TodaysCoimbatore Admin Portal
 * Handles QuotaExceededError, purges outdated cache keys, and ensures
 * database state synchronization takes precedence over client storage.
 */

export interface MinimalArticle {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  status?: string;
  isExclusive?: boolean;
}

/**
 * Strips huge base64 payloads, long content bodies, and non-essential fields
 * to keep localStorage usage well below typical 5MB browser quotas.
 */
export function minimizeArticlesForStorage(articles: any[]): MinimalArticle[] {
  if (!Array.isArray(articles)) return [];
  return articles.slice(0, 50).map((a) => {
    const min: MinimalArticle = {
      id: a.id || a.slug,
      title: (a.title || 'Untitled Story').slice(0, 150),
      slug: a.slug,
      category: a.category || 'News',
      publishedAt: a.publishedAt || a.createdAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      author: (a.author || 'Editorial Bureau').slice(0, 60),
      status: a.status || 'published',
      isExclusive: !!(a.isExclusive || a.isSpotlight),
    };
    return min;
  });
}

/**
 * Removes legacy and bulky duplicate keys from localStorage
 */
export function purgeLargeOutdatedStorageKeys(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const legacyKeys = [
    'admin_published_articles',
    'publishedArticles',
    'news_articles',
    'covai_db_articles',
    'covai_db_outages',
    'power_outages',
    'covai_db_ads',
    'adSlots',
    'covai_db_donors',
    'blood_donors',
    'covai_db_events',
    'events_db',
    't_covai_directory_v2',
    'emergency_blood_alerts',
    'covai_db_enquiries',
    't_covai_directory_categories_v2',
    't_covai_directory_verifications_v2',
    't_covai_directory_reviews_v2',
    'covai_db_social_links',
    'covai_db_donor_enquiries',
  ];

  for (const key of legacyKeys) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

/**
 * Safely writes to localStorage wrapped in try-catch with QuotaExceeded fallback.
 * Never throws QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  const stringified = typeof value === 'string' ? value : JSON.stringify(value);

  try {
    localStorage.setItem(key, stringified);
    return true;
  } catch (e: any) {
    console.warn('LocalStorage quota exceeded. Skipping local cache update.', e);

    // Attempt Recovery: Purge outdated keys
    purgeLargeOutdatedStorageKeys();

    // If key is an article array, try storing minimized articles
    if (key.includes('article') || key === 'admin_published_articles' || key === 't_covai_articles') {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(parsed)) {
          const minimal = minimizeArticlesForStorage(parsed);
          localStorage.setItem(key, JSON.stringify(minimal));
          return true;
        }
      } catch (innerError) {
        console.warn('LocalStorage quota exceeded on minimal fallback. Skipping local cache update.');
      }
    }

    return false;
  }
}

/**
 * Safely reads and optionally parses from localStorage
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

/**
 * Safely removes an item from localStorage
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}
