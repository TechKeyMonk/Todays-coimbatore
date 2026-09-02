'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DynamicHeader from '@/components/layout/DynamicHeader';
import Footer from '@/components/Footer';
import UniversalSideLayout from '@/components/UniversalSideLayout';
import dbService, { EventRecord } from '@/services/db';

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const list = await dbService.getEvents();
      setEvents(list);
    } catch (e) {
      console.error('Failed to load events', e);
    }
  };

  useEffect(() => {
    loadEvents();

    const handleSync = () => {
      loadEvents();
    };

    window.addEventListener('eventsStorageUpdate', handleSync);
    window.addEventListener('todayscoimbatore:db-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('eventsStorageUpdate', handleSync);
      window.removeEventListener('todayscoimbatore:db-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory !== 'ALL' && ev.category.toUpperCase() !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.organizer.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

              {/* Action Buttons (Info Only) */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                {featuredEvent.mapLink && (
                  <a
                    href={featuredEvent.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span>📍</span>
                    <span>View Venue &amp; Directions &rarr;</span>
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

        {/* Filter and Search Section */}
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-stone-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search events by keyword, venue (e.g. CODISSIA, TIDEL Park), or organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total Results Count */}
            <div className="text-xs font-bold text-stone-500 dark:text-gray-400 shrink-0 text-right">
              Showing <strong className="text-stone-900 dark:text-white">{filteredEvents.length}</strong> events &amp; festivals
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            {['ALL', 'EXPO', 'TECH', 'CULTURAL', 'SPORTS', 'MUSIC', 'WORKSHOP'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#153d3b] text-white shadow-md scale-105 font-black'
                    : 'bg-[#f8f6f0] dark:bg-slate-800 text-stone-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#153d3b] dark:hover:border-emerald-600 transition-all group"
              >
                <div>
                  {/* Media Frame */}
                  <div className="w-full h-48 bg-slate-900 relative overflow-hidden">
                    {ev.posterUrl ? (
                      <img
                        src={ev.posterUrl}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-stone-600">
                        🎟️
                      </div>
                    )}

                    {/* Video Play Overlay */}
                    {ev.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveVideoModal(ev.videoUrl || null)}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors cursor-pointer"
                      >
                        <span className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-lg shadow-lg group-hover:scale-110 transition-transform">
                          ▶
                        </span>
                      </button>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#153d3b] text-emerald-200 text-[10px] font-black uppercase shadow-xs">
                        {ev.category}
                      </span>
                      {ev.featured && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-900 text-[10px] font-black uppercase shadow-xs">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400 font-bold">
                      <span>📅 {ev.date}</span>
                      <span>•</span>
                      <span>⏰ {ev.time}</span>
                    </div>

                    <h3 className="text-base font-black text-stone-900 dark:text-white leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                      {ev.title}
                    </h3>

                    <p className="text-xs text-stone-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="pt-2.5 border-t border-stone-100 dark:border-slate-800 text-xs space-y-1">
                      <p className="text-stone-700 dark:text-gray-300 font-medium truncate flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="truncate">{ev.venue}</span>
                      </p>
                      {ev.organizer && (
                        <p className="text-[11px] text-stone-400 dark:text-gray-500 truncate">
                          Organized by: <strong className="text-stone-600 dark:text-gray-300">{ev.organizer}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action (Directions / Info Only) */}
                <div className="p-5 pt-0 flex items-center justify-between gap-2">
                  {ev.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveVideoModal(ev.videoUrl || null)}
                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>▶ Promo Video</span>
                    </button>
                  )}

                  {ev.mapLink ? (
                    <a
                      href={ev.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 ml-auto"
                    >
                      <span>📍</span>
                      <span>Get Directions</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-stone-400 font-medium ml-auto">
                      📍 Coimbatore
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <span className="text-4xl block">🎟️</span>
            <h3 className="text-base font-black text-stone-900 dark:text-white">
              No matching events found for "{selectedCategory}" in "{searchQuery}"
            </h3>
            <p className="text-xs text-stone-500 dark:text-gray-400 max-w-md mx-auto">
              Check back soon as new cultural carnivals, expos, and tech summits are announced weekly.
            </p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
              className="inline-block px-4 py-2 rounded-xl bg-[#153d3b] text-white text-xs font-bold"
            >
              Reset Filters &amp; View All
            </button>
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
