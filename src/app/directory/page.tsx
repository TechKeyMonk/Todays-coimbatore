import type { Metadata } from 'next';
import DirectoryClient from './DirectoryClient';

export const metadata: Metadata = {
  title: "Coimbatore Directory | Local Business & Service Contacts",
  description: "Find verified local businesses, services, emergency contacts, shops, and corporate offices across Coimbatore city on Today's Coimbatore.",
  keywords: [
    "Coimbatore Business Directory",
    "Kovai Local Services",
    "Shops in Coimbatore",
    "Coimbatore Phone Directory",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/directory',
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
    title: "Coimbatore Directory | Local Business & Service Contacts",
    description: "Explore verified local businesses, emergency contacts, and services in Kovai.",
    url: 'https://todayscoimbatore.com/directory',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Today's Coimbatore Directory",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore Directory | Local Business & Service Contacts",
    description: "Explore verified local businesses, emergency contacts, and services in Kovai.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function DirectoryPage() {
  return <DirectoryClient />;
}
