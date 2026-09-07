import { NextResponse, after } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { sendDraftIngestionNotification, sendSystemAlert } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution timeout

// Permitted editorial categories
const VALID_CATEGORIES = [
  'News',
  'Business',
  'Tech',
  'Infrastructure',
  'CEO',
  'Sports',
  'Education',
  'E-Paper',
] as const;

// Multi-Source RSS Aggregation Feeds
const RSS_FEEDS = [
  {
    id: 'google-coimbatore',
    name: 'Google News (Coimbatore)',
    url: 'https://news.google.com/rss/search?q=Coimbatore&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'toi-coimbatore',
    name: 'Times of India (Coimbatore)',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128833038.cms',
  },
  {
    id: 'google-smart-city',
    name: 'Google News (Coimbatore Smart City)',
    url: 'https://news.google.com/rss/search?q=Coimbatore+Smart+City&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'google-corporation',
    name: 'Google News (Coimbatore Corporation)',
    url: 'https://news.google.com/rss/search?q=Coimbatore+Corporation&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'google-airport',
    name: 'Google News (Coimbatore Airport)',
    url: 'https://news.google.com/rss/search?q=Coimbatore+Airport&hl=en-IN&gl=IN&ceid=IN:en',
  },
];

interface ScrapedFeedItem {
  title: string;
  link: string;
  snippet: string;
  pubDate?: string;
  enclosureUrl?: string;
  sourceName: string;
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

function normalizeUrl(urlStr?: string): string {
  if (!urlStr) return '';
  try {
    const u = new URL(urlStr.trim());
    return `${u.origin}${u.pathname}`.toLowerCase().replace(/\/$/, '');
  } catch {
    return urlStr.trim().toLowerCase().replace(/\/$/, '');
  }
}

// Tokenize title and filter common journalistic stop words
function cleanTokens(title: string): Set<string> {
  const stopWords = new Set([
    'in', 'at', 'on', 'the', 'a', 'an', 'to', 'for', 'of', 'and', 'is', 'are',
    'was', 'were', 'by', 'with', 'from', 'over', 'as', 'after', 'near', 'two',
    'man', 'men', 'says', 'held', 'gets', 'new', 'into', 'out', 'its', 'their',
    'about', 'more', 'all', 'than', 'under', 'amid', 'over', 'set', 'up', 'case'
  ]);
  return new Set(
    (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
  );
}

// Jaccard similarity score (0.0 to 1.0)
function calculateTitleSimilarity(title1: string, title2: string): number {
  const set1 = cleanTokens(title1);
  const set2 = cleanTokens(title2);
  if (set1.size === 0 || set2.size === 0) return 0;
  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }
  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
}

// Robust JSON parser with code fence stripping, missing-comma repair, and regex field extraction
function safeParseJson(raw: string): any {
  if (!raw) return null;
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  // 1. Direct JSON parse
  try {
    const match = clean.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : clean);
  } catch (e1) {
    // 2. Repair missing commas between adjacent properties
    const repaired = clean.replace(/("[^"\\]*(?:\\.[^"\\]*)*")(\s*\n\s*"[a-zA-Z0-9_]+"\s*:)/g, '$1,$2');
    try {
      const match = repaired.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : repaired);
    } catch (e2) {
      // 3. Fallback regex field extraction
      const titleMatch = clean.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const categoryMatch = clean.match(/"category"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const excerptMatch = clean.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const contentMatch = clean.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const readTimeMatch = clean.match(/"readTime"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      if (titleMatch && contentMatch) {
        return {
          title: titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          category: categoryMatch ? categoryMatch[1] : 'News',
          excerpt: excerptMatch ? excerptMatch[1].replace(/\\"/g, '"') : '',
          content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          readTime: readTimeMatch ? readTimeMatch[1] : '3 min read',
          tags: ['Coimbatore', 'News'],
        };
      }
      throw e1;
    }
  }
}

// Ingest handler (supports both GET and POST)
async function handleIngest(request: Request) {
  const startTime = Date.now();

  try {
    // 1. Authenticate Request via Bearer header or query parameter
    const cronSecret = process.env.CRON_SECRET || 'Todayscoimbatore@2026';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret') || '';
    const isSync = searchParams.get('sync') === 'true';

    if (bearerToken !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Invalid or missing authorization token.',
          hint: 'Provide Authorization: Bearer <CRON_SECRET> header or ?secret=<CRON_SECRET> parameter.',
        },
        { status: 401 }
      );
    }

    // 2. Validate Gemini API Key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Configuration Error: GEMINI_API_KEY is not defined in environment.' },
        { status: 500 }
      );
    }

    // 3. Pre-AI Deduplication: Query Recent Records from Supabase in Parallel with RSS Fetching
    const existingRecordsPromise = supabaseAdmin
      .from('news')
      .select('source_url, slug, id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    // 4. Requirement 1: Parallel RSS Fetching with AbortController (5000ms timeout per feed)
    const parser = new Parser();
    const feedFetchPromises = RSS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TodaysCoimbatoreBot/2.0',
            Accept: 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP status ${res.status}`);
        }

        const xml = await res.text();
        const parsed = await parser.parseString(xml);

        const items: ScrapedFeedItem[] = (parsed.items || [])
          .filter((it) => it.title && it.link)
          .map((raw) => ({
            title: (raw.title || '').trim(),
            link: (raw.link || '').trim(),
            snippet: raw.contentSnippet || raw.content || raw.title || '',
            pubDate: raw.pubDate,
            enclosureUrl: raw.enclosure?.url,
            sourceName: feed.name,
          }));

        return {
          feedName: feed.name,
          status: 'ok' as const,
          itemsCount: items.length,
          items,
        };
      } catch (feedErr: any) {
        clearTimeout(timeoutId);
        const isAbort = feedErr.name === 'AbortError';
        const errMsg = isAbort ? 'Timed out (5000ms)' : feedErr.message || String(feedErr);
        console.warn(`[fetch-news] Parallel RSS fetch warning for "${feed.name}": ${errMsg}`);

        return {
          feedName: feed.name,
          status: 'failed' as const,
          itemsCount: 0,
          error: errMsg,
          items: [] as ScrapedFeedItem[],
        };
      }
    });

    // Run RSS feeds and Supabase queries simultaneously
    const [existingRes, feedResults] = await Promise.all([
      existingRecordsPromise,
      Promise.allSettled(feedFetchPromises),
    ]);

    // Build Existing Deduplication Lookups
    const existingUrls = new Set<string>();
    const existingSlugs = new Set<string>();
    const recentExistingTitles: string[] = [];
    const nowMs = Date.now();
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

    (existingRes.data || []).forEach((row: any) => {
      if (row.source_url) {
        existingUrls.add(normalizeUrl(row.source_url));
        existingUrls.add(row.source_url.trim().toLowerCase());
      }
      if (row.slug) {
        existingSlugs.add(row.slug.toLowerCase().trim());
      }
      if (row.title) {
        const itemTime = row.created_at ? new Date(row.created_at).getTime() : 0;
        if (!itemTime || nowMs - itemTime <= FORTY_EIGHT_HOURS_MS) {
          recentExistingTitles.push(row.title);
        }
      }
    });

    // Aggregate items across all parallel feeds
    const aggregatedItems: ScrapedFeedItem[] = [];
    const feedDiagnostics: Array<{ name: string; status: string; itemsCount: number; error?: string }> = [];

    feedResults.forEach((res) => {
      if (res.status === 'fulfilled') {
        const data = res.value;
        feedDiagnostics.push({
          name: data.feedName,
          status: data.status,
          itemsCount: data.itemsCount,
          error: data.error,
        });
        aggregatedItems.push(...data.items);
      }
    });

    // Trigger system alert only if ALL feeds failed
    const successfulFeeds = feedDiagnostics.filter((d) => d.status === 'ok').length;
    if (successfulFeeds === 0) {
      sendSystemAlert({
        errorType: 'All RSS Feed Sources Inaccessible',
        details: `All ${RSS_FEEDS.length} parallel RSS news feeds failed to respond within 5000ms timeout:\n${JSON.stringify(feedDiagnostics, null, 2)}`,
        endpoint: '/api/cron/fetch-news',
      }).catch((e) => console.error('[fetch-news] Failed to send system alert:', e));

      return NextResponse.json(
        {
          success: false,
          error: 'All configured RSS news feeds failed to respond.',
          feedDiagnostics,
        },
        { status: 502 }
      );
    }

    // 5. Requirement 3: String-Based & In-Memory Deduplication (BEFORE Gemini Invocation)
    const candidateItems: ScrapedFeedItem[] = [];
    const acceptedCandidateTitles: string[] = [];
    let skippedUrlCount = 0;
    let skippedSimilarityCount = 0;

    for (const candidate of aggregatedItems) {
      const norm = normalizeUrl(candidate.link);

      // Check A: Exact Source URL match
      if (existingUrls.has(norm) || existingUrls.has(candidate.link.toLowerCase())) {
        skippedUrlCount++;
        continue;
      }

      // Clean publication attribution from headline
      const cleanedCandidateTitle = candidate.title.replace(/\s*-\s*[^-]+$/, '').trim();
      if (!cleanedCandidateTitle || cleanedCandidateTitle.length < 10) {
        continue;
      }

      // Check B: Similarity against existing stories in Supabase (last 48 hours)
      let isDuplicateStory = false;
      for (const dbTitle of recentExistingTitles) {
        const similarity = calculateTitleSimilarity(cleanedCandidateTitle, dbTitle);
        if (similarity >= 0.50) {
          isDuplicateStory = true;
          skippedSimilarityCount++;
          break;
        }
      }
      if (isDuplicateStory) continue;

      // Check C: Similarity against already accepted candidates in the current run
      for (const acceptedTitle of acceptedCandidateTitles) {
        const similarity = calculateTitleSimilarity(cleanedCandidateTitle, acceptedTitle);
        if (similarity >= 0.50) {
          isDuplicateStory = true;
          skippedSimilarityCount++;
          break;
        }
      }
      if (isDuplicateStory) continue;

      // Unseen, unique story accepted as candidate
      candidateItems.push({
        ...candidate,
        title: cleanedCandidateTitle,
      });
      acceptedCandidateTitles.push(cleanedCandidateTitle);
    }

    // 6. Requirement 2: Strict Item Batching - Slice to top 5 articles per cycle
    const topCandidates = candidateItems.slice(0, 5);

    if (topCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new unique stories found. All items already ingested or covered within the last 48 hours.',
        scannedAcrossFeeds: aggregatedItems.length,
        skippedUrls: skippedUrlCount,
        skippedSimilarTopics: skippedSimilarityCount,
        inserted: 0,
        feedDiagnostics,
        elapsedTimeMs: Date.now() - startTime,
      });
    }

    // 7. In-Memory RSS Processing & Synthesizer Function (ZERO Database Inserts)
    const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

    async function generateWithFallback(prompt: string): Promise<string> {
      if (!genAI) throw new Error('GEMINI_API_KEY not configured');
      const models = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash-lite',
      ];
      let lastErr: any = null;

      for (const mName of models) {
        try {
          const model = genAI.getGenerativeModel({
            model: mName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });
          const res = await model.generateContent(prompt);
          return res.response.text();
        } catch (err: any) {
          lastErr = err;
          const is429 = err?.status === 429 || err?.message?.includes('429');
          console.warn(`[fetch-news] Model ${mName} ${is429 ? 'rate-limited (429)' : 'error'}, trying fallback...`);
          if (is429) {
            await new Promise((r) => setTimeout(r, 1200));
          } else {
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }

      sendSystemAlert({
        errorType: 'Gemini AI Ingestion Limit / Quota Failure',
        details: `All fallback models exhausted for candidate news item. Last error: ${lastErr?.message || String(lastErr)}`,
        endpoint: '/api/cron/fetch-news',
      }).catch((e) => console.error('[fetch-news] Failed to send system alert:', e));
      throw lastErr;
    }

    async function processCandidates(itemsToProcess: ScrapedFeedItem[]) {
      const rssItems: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < itemsToProcess.length; i++) {
        const candidate = itemsToProcess[i];
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 500));
        }

        try {
          let parsedAi: any = null;

          if (genAI) {
            try {
              const prompt = `You are a Senior Investigative News Journalist and Executive Editor for "Today's Coimbatore", the premier digital daily news publication of Coimbatore, Tamil Nadu.

TASK:
Synthesize the provided raw news lead into a 100% ORIGINAL, unique, comprehensive, and copyright-safe ENGLISH news report.

STRICT COPYRIGHT & ORIGINALITY DIRECTIVES:
1. SYNTHESIS OVER REPRODUCTION: Extract only raw factual entities, locations, dates, statistics, and core civic/economic developments.
2. ZERO PLAGIARISM: Do NOT copy, mirror, or reproduce phrases, sentences, or paragraphs from the source. Express every single sentence with completely fresh vocabulary, active journalistic phrasing, and clear local context.
3. LOCAL COIMBATORE FOCUS: Explicitly emphasize the practical significance of this development for the residents, commuters, neighborhoods, or business ecosystem of Coimbatore.
4. TONE: Objective, balanced, authoritative, and engaging professional English journalism.
5. REQUIRED STRUCTURE:
   - "title": A powerful, clear, authoritative headline in English (NO clickbait, NO quotes).
   - "category": MUST be EXACTLY one of: ["News", "Business", "Tech", "Infrastructure", "CEO", "Sports", "Education", "E-Paper"].
   - "excerpt": A concise 1-2 sentence preview providing a crisp summary of the development.
   - "content": A rich, structured 3 to 4 paragraph news story detailing:
       Paragraph 1: Core development, who, what, when, and immediate impact.
       Paragraph 2: Factual background, project details, or local context in Coimbatore.
       Paragraph 3: Official statements, civic authorities, or institutional perspective.
       Paragraph 4: Forward-looking outlook or advice for city residents.
   - "readTime": Estimated reading time, e.g., "3 min read".
   - "tags": 3 to 5 keyword strings (e.g., ["Coimbatore", "Infrastructure", "Public Safety"]).

Raw News Lead:
Headline: ${candidate.title}
Source: ${candidate.sourceName}
Summary/Snippet: ${candidate.snippet}
Reference URL: ${candidate.link}

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "String",
  "category": "News",
  "excerpt": "String",
  "content": "Paragraph 1...\\n\\nParagraph 2...\\n\\nParagraph 3...",
  "readTime": "3 min read",
  "tags": ["Coimbatore", "News"]
}`;

              const rawAiText = await generateWithFallback(prompt);
              parsedAi = safeParseJson(rawAiText);
            } catch (aiErr) {
              console.warn('[fetch-news] AI synthesis failed or fallback triggered, using structured RSS fallback:', aiErr);
            }
          }

          const rawTitle = parsedAi?.title || candidate.title.replace(/\s*-\s*[^-]+$/, '').trim();
          const cleanSnippet = candidate.snippet?.replace(/<[^>]*>?/gm, '').trim() || '';
          const rawContent = parsedAi?.content || (cleanSnippet 
            ? `${cleanSnippet}\n\nThis development in Coimbatore is actively monitored by local civic observers and news desks. Further verification and official announcements from city authorities will be updated as confirmed.\n\nSource coverage reported via ${candidate.sourceName}.`
            : `Civic update from Coimbatore: ${rawTitle}. Local stakeholders and departments are reviewing proceedings as detailed updates emerge.`);
          const rawExcerpt = parsedAi?.excerpt || (cleanSnippet ? cleanSnippet.slice(0, 160) : rawTitle);

          // Normalize Category
          let finalCategory = 'News';
          const rawCat = (parsedAi?.category || '').trim();
          const foundCat = VALID_CATEGORIES.find(
            (c) => c.toLowerCase() === rawCat.toLowerCase()
          );
          if (foundCat) {
            finalCategory = foundCat;
          } else {
            const lowerTitle = rawTitle.toLowerCase();
            if (lowerTitle.includes('flyover') || lowerTitle.includes('road') || lowerTitle.includes('metro') || lowerTitle.includes('corporation')) {
              finalCategory = 'Infrastructure';
            } else if (lowerTitle.includes('police') || lowerTitle.includes('traffic') || lowerTitle.includes('temple') || lowerTitle.includes('city')) {
              finalCategory = 'News';
            } else if (lowerTitle.includes('business') || lowerTitle.includes('market') || lowerTitle.includes('crore') || lowerTitle.includes('gold')) {
              finalCategory = 'Business';
            }
          }

          // Generate clean unique slug
          let baseSlug = slugify(rawTitle).slice(0, 90).replace(/-+$/, '');
          if (!baseSlug || baseSlug.length < 3) {
            baseSlug = `coimbatore-news-${Date.now().toString(36)}`;
          }
          let uniqueSlug = baseSlug;
          let counter = 1;
          while (existingSlugs.has(uniqueSlug.toLowerCase())) {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          existingSlugs.add(uniqueSlug.toLowerCase());

          // Genuine image detection only
          let validImage: string | null = null;
          if (
            candidate.enclosureUrl &&
            typeof candidate.enclosureUrl === 'string' &&
            candidate.enclosureUrl.startsWith('http')
          ) {
            validImage = candidate.enclosureUrl.trim();
          }

          const newId = `rss-${crypto.randomUUID()}`;
          const nowIso = new Date().toISOString();

          // In-Memory UI Draft Object ONLY (NO auto-insert to Supabase news table)
          const draftRecord = {
            id: newId,
            title: rawTitle.trim(),
            slug: uniqueSlug,
            category: finalCategory,
            subCategory: finalCategory,
            subTag: finalCategory,
            content: rawContent.trim(),
            excerpt: rawExcerpt.trim(),
            imageUrl: validImage,
            image: validImage,
            image_url: validImage,
            author: 'Editorial Bureau',
            created_at: nowIso,
            createdAt: nowIso,
            publishedAt: nowIso,
            readTime: parsedAi?.readTime || `${Math.max(1, Math.ceil(rawContent.split(/\s+/).length / 130))} min`,
            seoTitle: `${rawTitle} | Today's Coimbatore`,
            metaDescription: rawExcerpt.slice(0, 160),
            keywords: Array.isArray(parsedAi?.tags) ? parsedAi.tags : ['Coimbatore', finalCategory],
            status: 'draft',
            sourceUrl: candidate.link,
            source_url: candidate.link,
            sourceName: candidate.sourceName,
          };

          // Collect in memory array (Zero Supabase insert queries!)
          rssItems.push(draftRecord);
          existingUrls.add(normalizeUrl(candidate.link));
        } catch (itemErr: any) {
          console.error('[fetch-news] Error processing candidate RSS item:', itemErr);
          errors.push({ link: candidate.link, error: itemErr.message || String(itemErr) });
        }
      }

      return {
        rssItems,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    // Process top candidates in memory
    const result = await processCandidates(topCandidates);

    // Option 2: Persist parsed candidates into Supabase `rss_drafts` table
    // DO NOT insert anything into the main `news` table during this fetch step.
    let persistedDrafts = result.rssItems;
    if (result.rssItems.length > 0) {
      const dbDraftPayload = result.rssItems.map((item) => ({
        title: item.title,
        slug: item.slug,
        category: item.category,
        content: item.content,
        image: item.imageUrl || null,
        source: item.sourceUrl || null,
        rss_guid: item.sourceUrl || item.slug,
      }));

      const { data: upsertedData, error: upsertErr } = await supabaseAdmin
        .from('rss_drafts')
        .upsert(dbDraftPayload, { onConflict: 'rss_guid' })
        .select();

      if (upsertErr) {
        console.error('[fetch-news] Error upserting to rss_drafts:', upsertErr);
      } else if (upsertedData && upsertedData.length > 0) {
        // Map back to our Article / Draft interface with the real Supabase generated IDs
        persistedDrafts = upsertedData.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          category: d.category,
          subCategory: d.category,
          subTag: d.category,
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
          keywords: ['Coimbatore', d.category],
          status: 'draft',
          sourceUrl: d.source || d.rss_guid,
          source_url: d.source || d.rss_guid,
          rss_guid: d.rss_guid,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: persistedDrafts,
      count: persistedDrafts.length,
      scannedAcrossFeeds: aggregatedItems.length,
      skippedUrls: skippedUrlCount,
      skippedSimilarTopics: skippedSimilarityCount,
      topCandidatesBatched: topCandidates.length,
      errors: result.errors,
      elapsedTimeMs: Date.now() - startTime,
      feedDiagnostics,
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/cron/fetch-news:', err);
    sendSystemAlert({
      errorType: 'News Ingestion Pipeline Crash',
      details: err?.message || String(err),
      endpoint: '/api/cron/fetch-news',
    }).catch((e) => console.error('[fetch-news] Failed to send crash alert:', e));

    return NextResponse.json(
      { error: err.message || 'Internal Server Error during news ingestion' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleIngest(request);
}

export async function POST(request: Request) {
  return handleIngest(request);
}
