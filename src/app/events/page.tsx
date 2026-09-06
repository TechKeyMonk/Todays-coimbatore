import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { EventRecord, mapNewsRowToEvent, mapDedicatedEventToEvent } from '@/services/db';
import EventsClient from './EventsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Coimbatore Events Today | Expo Calendar & Kovai Shows",
  description: "Discover upcoming expos, marathon runs, cultural events, tech conferences, and workshops happening across Coimbatore today.",
  keywords: [
    "Coimbatore Events",
    "Kovai Expo",
    "Events in Coimbatore",
    "CODISSIA Events",
    "Coimbatore Trade Fairs",
    "Kovai Cultural Shows",
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

export default async function EventsPage() {
  let initialEvents: EventRecord[] = [];

  try {
    // 1. Primary Query: Fetch records directly from Supabase `events` table
    let { data: dedicatedEvents, error: eventsErr } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    // In case created_at column ordering fails on custom schemas
    if (eventsErr) {
      console.warn('[EventsPage SSR] events table query warning, trying event_date fallback:', eventsErr);
      const fallbackOrder = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      if (!fallbackOrder.error && fallbackOrder.data) {
        dedicatedEvents = fallbackOrder.data;
        eventsErr = null;
      }
    }

    if (!eventsErr && dedicatedEvents && dedicatedEvents.length > 0) {
      initialEvents = dedicatedEvents.map(mapDedicatedEventToEvent);
    } else {
      // 2. Secondary Fallback: If `events` table returns 0 items, fallback to fetching `news` where category ILIKE '%event%'
      const { data: newsEvents } = await supabase
        .from('news')
        .select('*')
        .ilike('category', '%event%')
        .order('created_at', { ascending: false });

      if (newsEvents && newsEvents.length > 0) {
        initialEvents = newsEvents.map(mapNewsRowToEvent);
      }
    }
  } catch (err) {
    console.warn('[EventsPage SSR] error fetching events:', err);
  }

  // 3. Unify object structure so attributes (title/event_name, image_url, venue/location, event_date)
  // render cleanly without broken image tags or empty cards
  initialEvents = initialEvents.map((ev) => {
    const rawImg = ev.posterUrl || (ev as any).image_url || (ev as any).poster_url;
    const cleanImg =
      rawImg && typeof rawImg === 'string' && rawImg.trim() !== '' && rawImg.trim() !== 'null' && rawImg.trim() !== 'undefined'
        ? rawImg.trim()
        : 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

    return {
      ...ev,
      title: ev.title || (ev as any).event_name || 'Coimbatore Event',
      venue: ev.venue || (ev as any).location || 'Coimbatore, Tamil Nadu',
      date: ev.date || (ev as any).event_date || 'Upcoming',
      time: ev.time || (ev as any).event_time || '10:00 AM – 06:00 PM',
      posterUrl: cleanImg,
      description: ev.description || 'Public exhibition, summit, or cultural festival happening in Coimbatore.',
    };
  });

  return <EventsClient initialEvents={initialEvents} />;
}
