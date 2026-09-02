import type { Metadata } from 'next';
import CategoryClient from './CategoryClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug || 'news').toLowerCase().trim();
  const formattedTitle = rawSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const canonicalUrl = `https://todayscoimbatore.com/category/${rawSlug}`;

  return {
    title: `${formattedTitle} News Coimbatore | Today's Coimbatore`,
    description: `Get real-time ${formattedTitle} updates, breaking reports, city developments, and local stories across Coimbatore on Today's Coimbatore.`,
    keywords: [
      `${formattedTitle} Coimbatore`,
      'Coimbatore News',
      'Kovai Updates',
      "Today's Coimbatore",
      'Coimbatore Local News',
    ],
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
      title: `${formattedTitle} News Coimbatore | Today's Coimbatore`,
      description: `Get real-time ${formattedTitle} updates, breaking reports, and city developments across Coimbatore.`,
      url: canonicalUrl,
      siteName: "Today's Coimbatore",
      type: 'website',
      images: [
        {
          url: 'https://todayscoimbatore.com/images/logo.png',
          width: 1200,
          height: 630,
          alt: `${formattedTitle} Coimbatore News`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${formattedTitle} News Coimbatore | Today's Coimbatore`,
      description: `Get real-time ${formattedTitle} updates and breaking reports across Coimbatore.`,
      images: ['https://todayscoimbatore.com/images/logo.png'],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug || 'news');
  return <CategoryClient slug={rawSlug} />;
}
