import type { Metadata } from 'next';
import EventsClient from './EventsClient';

export const metadata: Metadata = {
  title: "Coimbatore Events Today | Expo Calendar & Kovai Shows",
  description: "Discover upcoming expos, marathon runs, cultural events, tech conferences, and workshops happening across Coimbatore today.",
  keywords: [
    "Coimbatore Events",
    "Kovai Expo",
    "Events in Coimbatore",
    "CODISSIA Events",
    "Coimbatore Trade Fairs",
    "Kovai Cultural Shows"
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/events',
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
    title: "Coimbatore Events Today | Expo Calendar & Kovai Shows",
    description: "Discover upcoming expos, marathon runs, cultural events, tech conferences, and workshops happening across Coimbatore today.",
    url: 'https://todayscoimbatore.com/events',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore Events Today",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore Events Today | Expo Calendar & Kovai Shows",
    description: "Discover upcoming expos, marathon runs, cultural events, tech conferences, and workshops happening across Coimbatore today.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function EventsPage() {
  return <EventsClient />;
}
