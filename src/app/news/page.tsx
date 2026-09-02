import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Coimbatore News Today | Kovai Breaking News Headlines",
  description: "Get real-time Coimbatore news, Kovai local updates, breaking alerts, events, weather, & city headlines on Today's Coimbatore. Read verified news 24/7!",
  keywords: [
    "Coimbatore News",
    "Coimbatore News Today",
    "Kovai News",
    "Breaking News Coimbatore",
    "Coimbatore Local Updates",
    "Today's Coimbatore",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/news',
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
    title: "Coimbatore News Today | Kovai Breaking News Headlines",
    description: "Get real-time Coimbatore news, Kovai local updates, breaking alerts, and city headlines on Today's Coimbatore.",
    url: 'https://todayscoimbatore.com/news',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Today's Coimbatore News",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore News Today | Kovai Breaking News Headlines",
    description: "Get real-time Coimbatore news, Kovai local updates, breaking alerts, and city headlines on Today's Coimbatore.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function NewsRoutePage() {
  return <CategoryPage params={Promise.resolve({ slug: 'news' })} />;
}
