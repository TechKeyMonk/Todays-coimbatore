import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import NewsArticleClient from './NewsArticleClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug || '').trim();

  let article: any = null;

  try {
    const { data, error } = await supabase
      .from('news')
      .select('title, slug, category, seo_title, meta_description, keywords, og_image_url, image_url, created_at, content')
      .eq('slug', rawSlug)
      .maybeSingle();

    if (!error && data) {
      article = data;
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug)) {
      // Fallback check by id only if rawSlug is a valid UUID
      const { data: byId } = await supabase
        .from('news')
        .select('title, slug, category, seo_title, meta_description, keywords, og_image_url, image_url, created_at, content')
        .eq('id', rawSlug)
        .maybeSingle();
      if (byId) article = byId;
    }
  } catch (err) {
    console.warn('generateMetadata Supabase fetch warning:', err);
  }

  // 1. Title fallback: If seo_title is missing, use `${article.title} | Today's Coimbatore`
  const title = article?.seo_title?.trim()
    ? article.seo_title.trim()
    : article?.title?.trim()
    ? `${article.title.trim()} | Today's Coimbatore`
    : `${rawSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} | Today's Coimbatore`;

  // 2. Meta description fallback: If meta_description is missing, fallback to "Read verified local Kovai news on Today's Coimbatore."
  const description =
    article?.meta_description?.trim() ||
    (article?.content ? article.content.slice(0, 160).trim() + '...' : null) ||
    "Read verified local Kovai news on Today's Coimbatore.";

  // 3. OpenGraph image fallback: If og_image_url is missing, fallback to "https://todayscoimbatore.com/images/logo.png"
  const ogImageUrl =
    article?.og_image_url?.trim() ||
    article?.image_url?.trim() ||
    'https://todayscoimbatore.com/images/logo.png';

  // 4. Dynamically set canonical URLs to `https://todayscoimbatore.com/news/${article.slug}`
  const articleSlug = article?.slug || rawSlug;
  const canonicalUrl = `https://todayscoimbatore.com/news/${articleSlug}`;

  const keywordsArray = article?.keywords
    ? article.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    : [
        'Coimbatore News',
        'Kovai Breaking News',
        article?.category || 'News',
        'Today Coimbatore Headlines',
        'Tamil Nadu News',
      ];

  // 5. OpenGraph type 'article' and map dynamic image tags properly
  return {
    title,
    description,
    keywords: keywordsArray,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      siteName: "Today's Coimbatore",
      publishedTime: article?.created_at,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article?.title || "Today's Coimbatore News",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function NewsSlugPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <NewsArticleClient slug={resolvedParams.slug} />;
}
