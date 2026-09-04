import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import ScrollRestoration from '../components/ScrollRestoration';
import DisableDevTools from '../components/DisableDevTools';
import DynamicHeader from '../components/layout/DynamicHeader';
import MainLayoutWrapper from '../components/layout/MainLayoutWrapper';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://todayscoimbatore.com'),
  title: "Today's Coimbatore | Latest Breaking News, City Events & Live Alerts",
  description:
    "Get the latest Coimbatore breaking news, city events, TANGEDCO power cut alerts, local business updates, and 24/7 blood donor helpline on Today's Coimbatore.",
  keywords: [
    'Coimbatore News',
    'Breaking News Coimbatore',
    "Today's Coimbatore",
    'Coimbatore City Events',
    'TANGEDCO Power Cut Alert',
    'Covai News',
    'Coimbatore Business',
    'Coimbatore Metro',
    'Coimbatore Traffic Alerts',
    'Blood Donors Coimbatore',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
  alternates: {
    canonical: 'https://todayscoimbatore.com',
  },
  openGraph: {
    title: "Today's Coimbatore | Latest Breaking News, City Events & Live Alerts",
    description:
      "Get the latest Coimbatore breaking news, city events, TANGEDCO power cut alerts, local business updates, and 24/7 blood donor helpline on Today's Coimbatore.",
    url: 'https://todayscoimbatore.com',
    siteName: "Today's Coimbatore",
    type: 'website',
    images: [
      {
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 1200,
        height: 630,
        alt: "Today's Coimbatore News Portal",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today's Coimbatore | Latest Breaking News, City Events & Live Alerts",
    description:
      "Get the latest Coimbatore breaking news, city events, TANGEDCO power cut alerts, local business updates, and 24/7 blood donor helpline on Today's Coimbatore.",
    images: ['https://todayscoimbatore.com/images/logo.png'],
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'NewsMediaOrganization',
      '@id': 'https://todayscoimbatore.com/#organization',
      name: "Today's Coimbatore",
      url: 'https://todayscoimbatore.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://todayscoimbatore.com/images/logo.png',
        width: 600,
        height: 60,
      },
      description:
        "Independent hyper-local news and civic information publication covering breaking news, events, and community updates in Coimbatore, Tamil Nadu.",
      sameAs: [
        'https://www.facebook.com/p/TechKey-Monk-61554380970425/',
        'https://x.com/TechKeyMonk',
        'https://www.instagram.com/tech_key_monk/',
        'https://www.youtube.com/@TechKeyMonk-CBE',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://todayscoimbatore.com/#website',
      url: 'https://todayscoimbatore.com',
      name: "Today's Coimbatore",
      publisher: {
        '@id': 'https://todayscoimbatore.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://todayscoimbatore.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} w-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('tc_theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className="bg-[#fcfbf7] dark:bg-slate-950 text-[#1a1a1a] dark:text-gray-100 font-sans min-h-screen antialiased selection:bg-[#e54b3c] selection:text-white transition-colors duration-200 w-full"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <DisableDevTools />
          <ScrollRestoration />
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
