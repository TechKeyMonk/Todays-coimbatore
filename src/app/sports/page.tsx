import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Coimbatore Sports News | Marathon, Cricket & Tournaments",
  description: "Get local Coimbatore sports coverage, marathon announcements, motor racing updates, school/college tournaments, and athlete spotlights.",
  keywords: [
    "Coimbatore Sports News",
    "Kovai Marathon",
    "Kari Motor Speedway",
    "Coimbatore Cricket",
    "Tamil Nadu Sports",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/sports',
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
    title: "Coimbatore Sports News | Marathon, Cricket & Tournaments",
    description: "Get local Coimbatore sports coverage, marathon announcements, motor racing updates, and tournaments.",
    url: 'https://todayscoimbatore.com/sports',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore Sports News",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore Sports News | Marathon, Cricket & Tournaments",
    description: "Get local Coimbatore sports coverage, marathon announcements, and motor racing updates.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function SportsRoutePage() {
  return <CategoryPage params={Promise.resolve({ slug: 'sports' })} />;
}
