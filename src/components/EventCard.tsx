'use client';

import React from 'react';
import Link from 'next/link';
import { EventRecord } from '@/services/db';

export interface EventCardProps {
  event: EventRecord;
  onOpenVideo?: (videoUrl: string) => void;
}

export default function EventCard({ event: ev, onOpenVideo }: EventCardProps) {
  const fallbackImg =
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full justify-between hover:border-[#153d3b] dark:hover:border-emerald-600 transition-all group">
      <div className="flex flex-col flex-1">
        {/* Responsive 16:9 Image Container with Centered Fit & Fallback Protection */}
        <div className="relative w-full aspect-[16/9] bg-slate-900/90 overflow-hidden rounded-t-xl flex items-center justify-center">
          {ev.posterUrl ? (
            <>
              {/* Subtle ambient backdrop for portrait / square poster variations */}
              <img
                src={ev.posterUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
              />
              <img
                src={ev.posterUrl}
                alt={ev.title || 'Event poster'}
                className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-1"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallbackImg;
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-stone-600">
              🎟️
            </div>
          )}

          {/* Video Play Overlay */}
          {ev.videoUrl && onOpenVideo && (
            <button
              type="button"
              onClick={() => onOpenVideo(ev.videoUrl!)}
              className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors cursor-pointer"
              aria-label="Play promo video"
            >
              <span className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-lg shadow-lg group-hover:scale-110 transition-transform">
                ▶
              </span>
            </button>
          )}

          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-[#153d3b] text-emerald-200 text-[10px] font-black uppercase shadow-xs">
              {ev.category || 'EVENT'}
            </span>
            {ev.featured && (
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-900 text-[10px] font-black uppercase shadow-xs">
                ⭐ Featured
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400 font-bold">
              <span>📅 {ev.date || 'Upcoming'}</span>
              <span>•</span>
              <span>⏰ {ev.time || '10:00 AM – 06:00 PM'}</span>
            </div>

            <Link
              href={ev.slug ? `/news/${ev.slug}` : `/article/${ev.id}`}
              className="block group/title"
            >
              <h3 className="text-base font-black text-stone-900 dark:text-white leading-snug group-hover/title:text-red-600 transition-colors line-clamp-2 cursor-pointer">
                {ev.title || 'Coimbatore Event'}
              </h3>
            </Link>

            <p className="text-xs text-stone-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {ev.description || 'Public exhibition and community festival in Coimbatore.'}
            </p>
          </div>

          <div className="pt-2.5 border-t border-stone-100 dark:border-slate-800 text-xs space-y-1 mt-auto">
            <p className="text-stone-700 dark:text-gray-300 font-medium truncate flex items-center gap-1.5">
              <span>📍</span>
              <span className="truncate">{ev.venue || 'Coimbatore, Tamil Nadu'}</span>
            </p>
            {ev.organizer && (
              <p className="text-[11px] text-stone-400 dark:text-gray-500 truncate">
                Organized by: <strong className="text-stone-600 dark:text-gray-300">{ev.organizer}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-0 flex items-center justify-between gap-2">
        <Link
          href={ev.slug ? `/news/${ev.slug}` : `/article/${ev.id}`}
          className="text-xs font-black text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Read Details &rarr;</span>
        </Link>

        <div className="flex items-center gap-2 ml-auto">
          {ev.videoUrl && onOpenVideo && (
            <button
              type="button"
              onClick={() => onOpenVideo(ev.videoUrl!)}
              className="text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <span>▶ Promo</span>
            </button>
          )}

          {ev.mapLink && (
            <a
              href={ev.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>📍 Maps</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
