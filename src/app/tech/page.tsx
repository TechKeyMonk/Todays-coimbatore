import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Coimbatore Tech News | SaaS, EV, & AI Innovations",
  description: "Explore the latest technology, SaaS development, EV ecosystem, AI breakthroughs, and engineering innovation emerging from Coimbatore.",
  keywords: [
    "Coimbatore Tech News",
    "Kovai IT News",
    "Coimbatore SaaS",
    "TIDEL Park Coimbatore",
    "EV Hub Coimbatore",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/tech',
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
    title: "Coimbatore Tech News | SaaS, EV, & AI Innovations",
    description: "Explore the latest technology, SaaS development, EV ecosystem, and AI breakthroughs from Coimbatore.",
    url: 'https://todayscoimbatore.com/tech',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore Tech News",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore Tech News | SaaS, EV, & AI Innovations",
    description: "Explore the latest technology, SaaS development, EV ecosystem, and AI breakthroughs from Coimbatore.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function TechRoutePage() {
  return <CategoryPage params={Promise.resolve({ slug: 'tech' })} />;
}
