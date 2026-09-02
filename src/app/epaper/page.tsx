import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Coimbatore E-Paper Today | Daily Digital News Edition",
  description: "Read Today's Coimbatore digital e-paper. Access full daily print editions, headlines, and local news archives online.",
  keywords: [
    "Coimbatore E-Paper",
    "Kovai Daily Newspaper PDF",
    "Today's Coimbatore Digital Edition",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/e-paper',
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
    title: "Coimbatore E-Paper Today | Daily Digital News Edition",
    description: "Access today's full digital newspaper edition for Coimbatore news online.",
    url: 'https://todayscoimbatore.com/e-paper',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore E-Paper Today",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore E-Paper Today | Daily Digital News Edition",
    description: "Access today's full digital newspaper edition for Coimbatore news online.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function EPaperAliasPage() {
  return <CategoryPage params={Promise.resolve({ slug: 'e-paper' })} />;
}
