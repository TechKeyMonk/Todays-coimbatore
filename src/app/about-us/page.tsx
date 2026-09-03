import type { Metadata } from 'next';
import AboutUsClient from './AboutUsClient';

export const metadata: Metadata = {
  title: "About Us | Today's Coimbatore News Network",
  description: "Learn about Today's Coimbatore — your trusted digital news network dedicated to delivering unbiased local updates, community stories, and real-time alerts.",
  alternates: {
    canonical: 'https://todayscoimbatore.com/about-us',
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
    title: "About Us | Today's Coimbatore News Network",
    description: "Learn about Today's Coimbatore — your trusted digital news network dedicated to delivering unbiased local updates, community stories, and real-time alerts.",
    url: 'https://todayscoimbatore.com/about-us',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "About Today's Coimbatore",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "About Us | Today's Coimbatore News Network",
    description: "Learn about Today's Coimbatore — your trusted digital news network dedicated to delivering unbiased local updates, community stories, and real-time alerts.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function AboutUsPage() {
  return <AboutUsClient />;
}
