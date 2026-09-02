import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Search Coimbatore News & Articles | Today's Coimbatore",
  description: "Search local Coimbatore news, breaking headlines, events, community reports, and business updates across Today's Coimbatore.",
  keywords: [
    "Search Coimbatore News",
    "Find Coimbatore Articles",
    "Today's Coimbatore Search",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/search',
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Search Coimbatore News & Articles | Today's Coimbatore",
    description: "Search local Coimbatore news, breaking headlines, events, and business updates.",
    url: 'https://todayscoimbatore.com/search',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Search Today's Coimbatore",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Search Coimbatore News & Articles | Today's Coimbatore",
    description: "Search local Coimbatore news, breaking headlines, events, and business updates.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
