import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import NewsArticleClient from '../../news/[slug]/NewsArticleClient';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const articleId = decodeURIComponent(resolvedParams.id || '').trim();
  let article: any = null;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId);
    if (isUuid) {
      const { data } = await supabase
        .from('news')
        .select('title, slug, category, seo_title, meta_description, keywords, og_image_url, image_url, created_at, content')
        .eq('id', articleId)
        .maybeSingle();
      if (data) article = data;
    } else {
      const { data } = await supabase
        .from('news')
        .select('title, slug, category, seo_title, meta_description, keywords, og_image_url, image_url, created_at, content')
        .eq('slug', articleId)
        .maybeSingle();
      if (data) article = data;
    }
  } catch (err) {
    console.warn('generateMetadata fetch warning for article/[id]:', err);
  }

  const title = article?.seo_title?.trim()
    ? article.seo_title.trim()
    : article?.title?.trim()
    ? `${article.title.trim()} | Today's Coimbatore`
    : 'News Article | Today\'s Coimbatore';

  const description =
    article?.meta_description?.trim() ||
    (article?.content ? article.content.slice(0, 160).trim() + '...' : null) ||
    "Read verified local Kovai news on Today's Coimbatore.";

  const canonicalUrl = article?.slug
    ? `https://todayscoimbatore.com/news/${article.slug}`
    : `https://todayscoimbatore.com/article/${articleId}`;

  const ogImageUrl =
    article?.og_image_url?.trim() ||
    article?.image_url?.trim() ||
    'https://todayscoimbatore.com/images/logo.png';

  const keywordsArray = Array.isArray(article?.keywords)
    ? article.keywords.map((k: any) => String(k).trim()).filter(Boolean)
    : typeof article?.keywords === 'string'
    ? article.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    : ['Coimbatore News', 'Kovai Updates', article?.category || 'News', "Today's Coimbatore"];

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

export default async function SingleArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  return <NewsArticleClient slug={resolvedParams.id} />;
}
