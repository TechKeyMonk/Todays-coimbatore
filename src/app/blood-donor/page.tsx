import type { Metadata } from 'next';
import BloodDonorClient from './BloodDonorClient';

export const metadata: Metadata = {
  title: "Coimbatore Blood Donors | Emergency Donors & Blood Banks",
  description: "Quickly connect with verified voluntary blood donors and blood banks in Coimbatore during medical emergencies. Free community service.",
  keywords: [
    "Coimbatore Blood Donors",
    "Emergency Blood Kovai",
    "Blood Banks Coimbatore",
    "Donate Blood Kovai",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/blood-donors',
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
    title: "Coimbatore Blood Donors | Emergency Donors & Blood Banks",
    description: "Find voluntary blood donors and local blood banks instantly in Coimbatore.",
    url: 'https://todayscoimbatore.com/blood-donors',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Coimbatore Blood Donors",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Coimbatore Blood Donors | Emergency Donors & Blood Banks",
    description: "Find voluntary blood donors and local blood banks instantly in Coimbatore.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function BloodDonorRoutePage() {
  return <BloodDonorClient />;
}
