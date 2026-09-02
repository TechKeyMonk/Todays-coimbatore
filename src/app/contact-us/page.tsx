import type { Metadata } from 'next';
import ContactUsClient from './ContactUsClient';

export const metadata: Metadata = {
  title: "Contact Us | Today's Coimbatore Newsroom & Desk",
  description: "Contact Today's Coimbatore editorial bureau. Submit press releases, breaking news tips, event submissions, civic alerts, or advertising queries.",
  keywords: [
    "Contact Today's Coimbatore",
    "Coimbatore Newsroom Phone",
    "Submit News Tip Coimbatore",
    "Coimbatore Press Release",
    "Advertise Today's Coimbatore",
  ],
  alternates: {
    canonical: 'https://todayscoimbatore.com/contact-us',
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
    title: "Contact Us | Today's Coimbatore Newsroom & Desk",
    description: "Contact Today's Coimbatore editorial bureau. Submit press releases, breaking news tips, and advertising queries.",
    url: 'https://todayscoimbatore.com/contact-us',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Contact Today's Coimbatore",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact Us | Today's Coimbatore Newsroom & Desk",
    description: "Contact Today's Coimbatore editorial bureau. Submit press releases, breaking news tips, and advertising queries.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

export default function ContactUsPage() {
  return <ContactUsClient />;
}
