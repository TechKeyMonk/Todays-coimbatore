import type { Metadata } from 'next';
import TnebClient from './TnebClient';

export const metadata: Metadata = {
  title: "Coimbatore TNEB Power Cut | Shutdown Schedule & Alerts",
  description: "Check today's TNEB power cut schedule, substation maintenance alerts, and area-wise power shutdown updates in Coimbatore.",
  keywords: [
    "TNEB Power Cut Coimbatore",
    "Coimbatore Power Shutdown",
    "Kovai Electricity Outage",
    "TANGEDCO Coimbatore Shutdown",
    "Power Cut Today Coimbatore"
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/tneb-updates',
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
    title: "Coimbatore TNEB Power Cut | Shutdown Schedule & Alerts",
    description: "Check today's TNEB power cut schedule, substation maintenance alerts, and area-wise power shutdown updates in Coimbatore.",
    url: 'https://todayscoimbatore.com/tneb-updates',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore TNEB Power Cut Alerts",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore TNEB Power Cut | Shutdown Schedule & Alerts",
    description: "Check today's TNEB power cut schedule, substation maintenance alerts, and area-wise power shutdown updates in Coimbatore.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function TnebUpdatesPage() {
  return <TnebClient />;
}
