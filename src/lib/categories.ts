/**
 * Unified Category Registry & Normalization Engine
 * Strictly prevents category-bleed (e.g. 'EVENTS' leaking into 'TECH' via 'ev' substring matching)
 * and provides input sanitization against SQL / PostgREST query injection.
 */

export interface CategoryDefinition {
  slug: string; // Canonical URL slug, e.g. 'tech'
  displayName: string; // UI Header title, e.g. 'TECH'
  canonicalDbCategory: string; // Exact category string stored in Supabase 'news' table, e.g. 'TECH'
  allowedDbCategories: string[]; // Strict list of DB category values corresponding to this section
  aliases: string[]; // Recognized route slugs or URL aliases
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryDefinition> = {
  news: {
    slug: 'news',
    displayName: 'NEWS',
    canonicalDbCategory: 'NEWS',
    allowedDbCategories: ['NEWS', 'GENERAL', 'HEADLINES', 'TOP STORIES'],
    aliases: ['news', 'top-stories', 'headlines', 'general'],
  },
  'our-city': {
    slug: 'our-city',
    displayName: 'OUR CITY',
    canonicalDbCategory: 'OUR CITY',
    allowedDbCategories: ['OUR CITY', 'CITY', 'LOCAL', 'CIVIC'],
    aliases: ['our-city', 'ourcity', 'city', 'local', 'mycity'],
  },
  business: {
    slug: 'business',
    displayName: 'BUSINESS',
    canonicalDbCategory: 'BUSINESS',
    allowedDbCategories: ['BUSINESS', 'STARTUP', 'STARTUPS', 'INDUSTRY', 'COMMERCE'],
    aliases: ['business', 'startup', 'startups', 'industry', 'commerce'],
  },
  tech: {
    slug: 'tech',
    displayName: 'TECH',
    canonicalDbCategory: 'TECH',
    allowedDbCategories: ['TECH', 'TECHNOLOGY', 'IT', 'SAAS', 'AI', 'EV'],
    aliases: ['tech', 'technology', 'it', 'saas', 'ai', 'ev'],
  },
  infrastructure: {
    slug: 'infrastructure',
    displayName: 'INFRASTRUCTURE',
    canonicalDbCategory: 'INFRASTRUCTURE',
    allowedDbCategories: ['INFRASTRUCTURE', 'INFRA', 'CIVIC INFRASTRUCTURE', 'ROADS', 'METRO'],
    aliases: ['infrastructure', 'infra', 'civic-infra'],
  },
  events: {
    slug: 'events',
    displayName: 'EVENTS',
    canonicalDbCategory: 'EVENTS',
    allowedDbCategories: ['EVENTS', 'EVENT', 'EXPO', 'CARNIVAL', 'FESTIVAL'],
    aliases: ['events', 'event', 'expos'],
  },
  sports: {
    slug: 'sports',
    displayName: 'SPORTS',
    canonicalDbCategory: 'SPORTS',
    allowedDbCategories: ['SPORTS', 'SPORT', 'CRICKET', 'ATHLETICS', 'FOOTBALL'],
    aliases: ['sports', 'sport'],
  },
  ceos: {
    slug: 'ceos',
    displayName: 'CEO & LEADERSHIP',
    canonicalDbCategory: 'CEO',
    allowedDbCategories: ['CEO', 'CEOS', 'LEADERSHIP', 'FOUNDERS', 'ENTREPRENEUR'],
    aliases: ['ceos', 'ceo', 'leadership', 'founders', 'ceos-of-coimbatore'],
  },
  education: {
    slug: 'education',
    displayName: 'EDUCATION',
    canonicalDbCategory: 'EDUCATION',
    allowedDbCategories: ['EDUCATION', 'CAMPUS', 'COLLEGES', 'SCHOOLS', 'ACADEMICS'],
    aliases: ['education', 'edu', 'campus', 'academics'],
  },
  'e-paper': {
    slug: 'e-paper',
    displayName: 'E-PAPER',
    canonicalDbCategory: 'E-PAPER',
    allowedDbCategories: ['E-PAPER', 'EPAPER', 'PRINT', 'EDITION'],
    aliases: ['e-paper', 'epaper'],
  },
};

/**
 * Sanitize route parameters and query inputs to prevent injection & malformed inputs.
 * Only allows lowercase alphanumeric characters and hyphens.
 */
export function sanitizeCategorySlug(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return 'news';
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
  return clean || 'news';
}

/**
 * Resolve CategoryDefinition by slug or DB category string.
 */
export function getCategoryConfig(slugOrName: string): CategoryDefinition {
  const sanitized = sanitizeCategorySlug(slugOrName);

  // 1. Direct key lookup
  if (CATEGORY_DEFINITIONS[sanitized]) {
    return CATEGORY_DEFINITIONS[sanitized];
  }

  // 2. Alias lookup
  for (const def of Object.values(CATEGORY_DEFINITIONS)) {
    if (def.aliases.includes(sanitized) || def.allowedDbCategories.some((c) => c.toLowerCase() === sanitized)) {
      return def;
    }
  }

  // 3. Fallback: create dynamic safe definition without leaking to other categories
  const upper = sanitized.replace(/-/g, ' ').toUpperCase();
  return {
    slug: sanitized,
    displayName: upper,
    canonicalDbCategory: upper,
    allowedDbCategories: [upper],
    aliases: [sanitized],
  };
}

/**
 * Strictly checks whether an article belongs to a given category section.
 * Eliminates substring bleed (e.g. prevents 'EVENTS' from matching 'TECH' via 'ev').
 */
export function isArticleInCategory(article: { category?: string; subCategory?: string }, categorySlugOrName: string): boolean {
  if (!article) return false;

  const config = getCategoryConfig(categorySlugOrName);
  const allowedSet = new Set(config.allowedDbCategories.map((c) => c.toUpperCase().trim()));

  const artCat = (article.category || '').toUpperCase().trim();
  const artSub = (article.subCategory || '').toUpperCase().trim();

  // 1. Exact match on main category
  if (artCat && allowedSet.has(artCat)) {
    return true;
  }

  // 2. Exact match on subCategory if present
  if (artSub && allowedSet.has(artSub)) {
    return true;
  }

  // 3. Normalized slug comparison
  const cleanCat = artCat.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetClean = config.slug.replace(/[^a-z0-9]/g, '');

  if (cleanCat === targetClean) {
    return true;
  }

  // 4. Token-level exact match (e.g. "Tech & EV" contains token "TECH", but "EVENTS" does NOT match "EV")
  const tokens = (artCat + ' ' + artSub)
    .split(/[\s,/-]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  for (const token of tokens) {
    if (allowedSet.has(token)) {
      return true;
    }
  }

  return false;
}
