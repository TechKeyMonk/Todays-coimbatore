'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DynamicHeader from '@/components/layout/DynamicHeader';
import Footer from '@/components/Footer';
import UniversalSideLayout from '@/components/UniversalSideLayout';
import EventCard from '@/components/EventCard';
import { supabase } from '@/lib/supabaseClient';
import dbService, { EventRecord, mapNewsRowToEvent, mapDedicatedEventToEvent } from '@/services/db';

export default function EventsClient({ initialEvents = [] }: { initialEvents?: EventRecord[] }) {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      // 1. Primary Query: Fetch records directly from Supabase `events` table
      let dedicatedEvents: any[] = [];
      try {
        let { data: dEvents, error: dErr } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (dErr) {
          const fallback = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false });
          if (!fallback.error && fallback.data) {
            dEvents = fallback.data;
            dErr = null;
          }
        }

        if (!dErr && dEvents && Array.isArray(dEvents) && dEvents.length > 0) {
          dedicatedEvents = dEvents;
        }
      } catch (e) {
        console.warn('Dedicated events query warning:', e);
      }

      let finalEvents: EventRecord[] = [];

      if (dedicatedEvents.length > 0) {
        finalEvents = dedicatedEvents.map(mapDedicatedEventToEvent);
      } else {
        // 2. Secondary Fallback: Fetch from `news` table where category ILIKE '%event%'
        let newsEvents: any[] = [];
        try {
          const { data: nEvents } = await supabase
            .from('news')
            .select('*')
            .ilike('category', '%event%')
            .order('created_at', { ascending: false });
          if (nEvents && Array.isArray(nEvents)) newsEvents = nEvents;
        } catch (e) {
          console.warn('News events query warning:', e);
        }

        if (newsEvents.length > 0) {
          finalEvents = newsEvents.map(mapNewsRowToEvent);
        } else {
          // 3. Fallback to local dbService
          try {
            finalEvents = await dbService.getEvents();
          } catch (e) {}
        }
      }

      // Unify object attributes cleanly
      const unified = (finalEvents || []).map((ev) => {
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
          description: ev.description || 'Public exhibition and community festival in Coimbatore.',
        };
      });

      setEvents(unified);
    } catch (e) {
      console.error('Failed to load events', e);
      if (initialEvents && initialEvents.length > 0) {
        setEvents(initialEvents);
      }
    }
  };

  useEffect(() => {
    loadEvents();

    const handleSync = () => {
      loadEvents();
    };

    window.addEventListener('eventsStorageUpdate', handleSync);
    window.addEventListener('newsStorageUpdate', handleSync);
    window.addEventListener('todayscoimbatore:db-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('eventsStorageUpdate', handleSync);
      window.removeEventListener('newsStorageUpdate', handleSync);
      window.removeEventListener('todayscoimbatore:db-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const featuredEvent = events.find((e) => e.featured) || events[0];

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="w-full bg-[#fcfbf7] dark:bg-slate-950 text-[#1a1a1a] dark:text-gray-100 font-sans antialiased transition-colors duration-200">
      {/* Universal Side Layout */}
      <UniversalSideLayout pageType="article" className="mt-0 pt-0">
        <div className="w-full max-w-full space-y-8">
        
        {/* Top Hero Section: Featured Event Highlight */}
        {featuredEvent && (
          <div className="bg-gradient-to-br from-[#153d3b] via-[#0f2e2d] to-[#0a1f1e] text-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/40 grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Info Column */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <span>⭐</span>
                    <span>Featured Event</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wide">
                    {featuredEvent.category}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  {featuredEvent.title}
                </h1>

                <p className="text-stone-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-3">
                  {featuredEvent.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                    <span className="text-emerald-300 font-bold uppercase text-[10px] block">Date &amp; Schedule</span>
                    <p className="font-bold text-white text-sm">📅 {featuredEvent.date}</p>
                    <p className="text-stone-300 text-xs font-mono">⏰ {featuredEvent.time}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1">
                    <span className="text-emerald-300 font-bold uppercase text-[10px] block">Venue &amp; Organizer</span>
                    <p className="font-bold text-white text-xs truncate">📍 {featuredEvent.venue}</p>
                    <p className="text-emerald-200 text-xs font-medium">By {featuredEvent.organizer || 'Coimbatore Event Bureau'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Link
                  href={featuredEvent.slug ? `/news/${featuredEvent.slug}` : `/article/${featuredEvent.id}`}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Read Event Story &rarr;</span>
                </Link>

                {featuredEvent.mapLink && (
                  <a
                    href={featuredEvent.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span>📍</span>
                    <span>Venue Directions</span>
                  </a>
                )}

                {featuredEvent.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveVideoModal(featuredEvent.videoUrl || null)}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>▶</span>
                    <span>Watch Promo Video</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Media Column */}
            <div className="lg:col-span-5 bg-black relative min-h-[260px] lg:min-h-full overflow-hidden group">
              {featuredEvent.posterUrl ? (
                <img
                  src={featuredEvent.posterUrl}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  🎟️
                </div>
              )}

              {featuredEvent.videoUrl && (
                <button
                  type="button"
                  onClick={() => setActiveVideoModal(featuredEvent.videoUrl || null)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors cursor-pointer"
                >
                  <span className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl shadow-2xl group-hover:scale-110 transition-transform">
                    ▶
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section Header: Direct Responsive Grid */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="text-red-600">📅</span>
              <span>All Upcoming Events &amp; Expos</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-gray-400 font-medium mt-0.5">
              Live calendar of trade fairs, conferences, marathons, cultural fests, and workshops across Coimbatore
            </p>
          </div>
          {events.length > 0 && (
            <div className="text-xs font-bold text-stone-500 dark:text-gray-400 shrink-0">
              <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-slate-700">
                {events.length} Live {events.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>
          )}
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                onOpenVideo={(url) => setActiveVideoModal(url)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3 shadow-xs">
            <span className="text-4xl block">🎟️</span>
            <h3 className="text-base font-black text-stone-900 dark:text-white">
              No Upcoming Events Listed
            </h3>
            <p className="text-xs text-stone-500 dark:text-gray-400 max-w-md mx-auto">
              Check back soon as new cultural carnivals, expos, and tech summits are announced weekly.
            </p>
          </div>
        )}

        </div>
      </UniversalSideLayout>

      {/* Embedded Video Player Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-stone-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-3 p-3">
            <div className="flex items-center justify-between text-white px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                ▶ Coimbatore Event Promo Reel
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="text-stone-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900">
              {activeVideoModal.includes('youtube') || activeVideoModal.includes('youtu.be') ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeVideoModal)}
                  title="Event Video Player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideoModal}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
