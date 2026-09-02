import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Coimbatore CEOs & Founders | Leadership Interviews",
  description: "Read exclusive interviews, visionary insights, and leadership journeys from top Coimbatore CEOs, industrialists, and startup founders.",
  keywords: [
    "Coimbatore CEOs",
    "Kovai Founders",
    "Coimbatore Business Leaders",
    "Coimbatore Entrepreneur Interviews",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/ceos',
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
    title: "Coimbatore CEOs & Founders | Leadership Interviews",
    description: "Read exclusive interviews, visionary insights, and leadership journeys from top Coimbatore CEOs and industrialists.",
    url: 'https://todayscoimbatore.com/ceos',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore CEOs & Founders",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore CEOs & Founders | Leadership Interviews",
    description: "Read exclusive interviews and visionary insights from top Coimbatore CEOs and industrialists.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function CeosRoutePage() {
  return <CategoryPage params={Promise.resolve({ slug: 'ceos' })} />;
}
