import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Our City Coimbatore | Civic Updates & Heritage Stories",
  description: "Explore Coimbatore city culture, municipal initiatives, smart city projects, water supply status, and civic heritage on Today's Coimbatore.",
  keywords: [
    "Coimbatore Civic Updates",
    "Our City Coimbatore",
    "CCMC Coimbatore",
    "Smart City Coimbatore",
    "Kovai Culture",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/our-city',
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
    title: "Our City Coimbatore | Civic Updates & Heritage Stories",
    description: "Explore Coimbatore city culture, municipal initiatives, smart city projects, and civic heritage.",
    url: 'https://todayscoimbatore.com/our-city',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Our City Coimbatore",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Our City Coimbatore | Civic Updates & Heritage Stories",
    description: "Explore Coimbatore city culture, municipal initiatives, smart city projects, and civic heritage.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function OurCityRoutePage() {
  return <CategoryPage params={Promise.resolve({ slug: 'our-city' })} />;
}
