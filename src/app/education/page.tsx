import type { Metadata } from 'next';
import CategoryPage from '../category/[slug]/page';

export const metadata: Metadata = {
  title: "Coimbatore Education News | Schools, Colleges & Admissions",
  description: "Comprehensive education news, PSG/CIT/Amrita college updates, university admissions, school rankings, and academic events in Coimbatore.",
  keywords: [
    "Coimbatore Education News",
    "Coimbatore Colleges",
    "Engineering Admissions Coimbatore",
    "Bharathiar University Updates",
    "Schools in Coimbatore",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/education',
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
    title: "Coimbatore Education News | Schools, Colleges & Admissions",
    description: "Comprehensive education news, college updates, university admissions, and academic events in Coimbatore.",
    url: 'https://todayscoimbatore.com/education',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore Education News",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore Education News | Schools, Colleges & Admissions",
    description: "Comprehensive education news, college updates, university admissions, and academic events in Coimbatore.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function EducationRoutePage() {
  return <CategoryPage params={Promise.resolve({ slug: 'education' })} />;
}
