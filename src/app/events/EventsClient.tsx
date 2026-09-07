'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DynamicHeader from '@/components/layout/DynamicHeader';
import Footer from '@/components/Footer';
import UniversalSideLayout from '@/components/UniversalSideLayout';
import EventCard from '@/components/EventCard';
import { supabase } from '@/lib/supabaseClient';
import dbService, { EventRecord, mapNewsRowToEvent, mapDedicatedEventToEvent } from '@/services/db';

const DEFAULT_INITIAL_EVENTS: EventRecord[] = [];

export default function EventsClient({ initialEvents = DEFAULT_INITIAL_EVENTS }: { initialEvents?: EventRecord[] }) {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<EventRecord | null>(null);

  const loadEvents = useCallback(async () => {
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
        // Fallback to local dbService
        try {
          finalEvents = await dbService.getEvents();
        } catch (e) {}
      }

      // Unify object attributes cleanly without injecting default unsplash stock photos
      const unified = (finalEvents || [])
        .filter((ev) => (ev.category || '').toUpperCase().trim() !== 'NEWS')
        .map((ev) => {
        const rawImg = ev.posterUrl || (ev as any).image_url || (ev as any).poster_url;
        const cleanImg =
          rawImg &&
          typeof rawImg === 'string' &&
          rawImg.trim() !== '' &&
          rawImg.trim() !== 'null' &&
          rawImg.trim() !== 'undefined' &&
          !rawImg.includes('photo-1511578314322-379afb476865')
            ? rawImg.trim()
            : undefined;

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
  }, [initialEvents]);

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
  }, [loadEvents]);

  // Deep-linking: auto-open modal if ?id= is present in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && events.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      if (idParam) {
        const match = events.find((e) => e.id === idParam || (e.slug && e.slug === idParam));
        if (match) {
          setSelectedEventModal(match);
        }
      }
    }
  }, [events]);

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

  const handleOpenDetails = (ev: EventRecord) => {
    setSelectedEventModal(ev);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/events?id=${encodeURIComponent(ev.id)}`);
    }
  };

  const handleCloseDetails = () => {
    setSelectedEventModal(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/events');
    }
  };

  const handleShareEvent = (ev: EventRecord) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/events?id=${encodeURIComponent(ev.id)}` : '';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({
        title: ev.title,
        text: `Check out ${ev.title} in Coimbatore!`,
        url,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('Event link copied to clipboard!');
    }
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
                    <p className="text-emerald-200 text-xs font-medium truncate">By {featuredEvent.organizer || 'Coimbatore Event Bureau'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(featuredEvent)}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>Read Event Details &rarr;</span>
                </button>

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

            {/* Right Media Column: only shows poster if admin uploaded an image */}
            <div className="lg:col-span-5 bg-black/40 relative min-h-[260px] lg:min-h-full overflow-hidden group flex items-center justify-center">
              {featuredEvent.posterUrl && !featuredEvent.posterUrl.includes('photo-1511578314322-379afb476865') ? (
                <img
                  src={featuredEvent.posterUrl}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-6xl select-none">🎟️</span>
                  <span className="text-xs font-bold text-emerald-200/80 uppercase tracking-widest">Coimbatore Event</span>
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

        {/* Section Header */}
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
                onViewDetails={(e) => handleOpenDetails(e)}
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

      {/* Comprehensive Event Details Modal */}
      {selectedEventModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={handleCloseDetails}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 my-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Media (Only if image was uploaded by admin) */}
            {selectedEventModal.posterUrl && !selectedEventModal.posterUrl.includes('photo-1511578314322-379afb476865') ? (
              <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden">
                <img
                  src={selectedEventModal.posterUrl}
                  alt={selectedEventModal.title}
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold text-lg flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-[#153d3b] to-[#0a1f1e] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl select-none">🎟️</span>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-300 text-[10px] font-black uppercase">
                      {selectedEventModal.category || 'EVENT'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-[#153d3b] text-emerald-200 text-xs font-black uppercase">
                    {selectedEventModal.category || 'EVENT'}
                  </span>
                  {selectedEventModal.featured && (
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black uppercase">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                  {selectedEventModal.title}
                </h2>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-100 dark:border-slate-800 space-y-1">
                  <span className="text-stone-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Schedule</span>
                  <p className="font-bold text-stone-900 dark:text-white text-sm">📅 {selectedEventModal.date}</p>
                  <p className="text-red-600 dark:text-red-400 font-mono font-bold">⏰ {selectedEventModal.time}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-100 dark:border-slate-800 space-y-1">
                  <span className="text-stone-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Location &amp; Venue</span>
                  <p className="font-bold text-stone-900 dark:text-white text-xs truncate">📍 {selectedEventModal.venue}</p>
                  <p className="text-stone-500 dark:text-gray-400 text-[11px]">By {selectedEventModal.organizer || 'Coimbatore Event Bureau'}</p>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-400 dark:text-gray-500 uppercase tracking-wider">
                  Event Details &amp; Summary
                </h4>
                <div className="text-sm text-stone-700 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-slate-850 p-4 rounded-2xl border border-stone-100 dark:border-slate-800">
                  {selectedEventModal.description || 'Public exhibition and community festival happening in Coimbatore.'}
                </div>
              </div>

              {/* Promo Video Player if available */}
              {selectedEventModal.videoUrl && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>▶</span>
                    <span>Event Promo Video</span>
                  </h4>
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md">
                    {selectedEventModal.videoUrl.includes('youtube') || selectedEventModal.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={getYoutubeEmbedUrl(selectedEventModal.videoUrl)}
                        title="Event Video"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={selectedEventModal.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                {selectedEventModal.mapLink ? (
                  <a
                    href={selectedEventModal.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#153d3b] hover:bg-[#0f2e2d] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>📍</span>
                    <span>Open in Google Maps &rarr;</span>
                  </a>
                ) : (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedEventModal.venue + ' Coimbatore')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#153d3b] hover:bg-[#0f2e2d] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>📍</span>
                    <span>Open in Google Maps &rarr;</span>
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareEvent(selectedEventModal)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📤 Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-900 dark:text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
