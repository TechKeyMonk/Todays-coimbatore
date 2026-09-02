'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import DynamicHeader from './DynamicHeader';
import CovaiBullionWidget from '../widgets/CovaiBullionWidget';
import CovaiWeatherWidget from '../widgets/CovaiWeatherWidget';
import CovaiTrafficWidget from '../widgets/CovaiTrafficWidget';
import PollWidget from '../widgets/PollWidget';

export default function MainLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const isHomePage = pathname === '/';

  // RULE 0: Admin Portal & Dedicated Directory Isolation (NO DynamicHeader, NO ticker, NO sidebars)
  if (pathname.startsWith('/admin') || pathname.startsWith('/directory')) {
    return <>{children}</>;
  }

  // Helper to check valid site routes
  const isKnownRoute = (p: string): boolean => {
    if (p === '/') return true;
    const knownPrefixes = [
      '/news',
      '/category',
      '/article',
      '/search',
      '/ceos',
      '/our-city',
      '/business',
      '/tech',
      '/infrastructure',
      '/sports',
      '/education',
      '/about',
      '/about-us',
      '/contact',
      '/contact-us',
      '/tneb-updates',
      '/events',
      '/blood-donor',
      '/blood-donors',
      '/e-paper',
      '/epaper',
    ];
    return knownPrefixes.some((prefix) => p === prefix || p.startsWith(prefix + '/'));
  };

  // RULE 1: Unrecognized / 404 Error Routes -> Zero Header, Zero Extra Content, Pure Plain Children
  if (!isKnownRoute(pathname)) {
    return <>{children}</>;
  }

  // Known 3-Column Feed Pages
  const isFeedPage =
    pathname === '/' ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/category') ||
    pathname.startsWith('/article') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/ceos') ||
    pathname.startsWith('/our-city') ||
    pathname.startsWith('/business') ||
    pathname.startsWith('/tech') ||
    pathname.startsWith('/infrastructure') ||
    pathname.startsWith('/sports') ||
    pathname.startsWith('/education');

  // Known Utility Pages (Full-Width with DynamicHeader, NO sidebars)
  if (!isFeedPage) {
    return (
      <>
        <DynamicHeader />
        <div className="w-full px-2 md:px-4 lg:px-6 mx-auto py-6 flex-1 min-w-0 min-h-screen">
          {children}
        </div>
      </>
    );
  }

  // RULE 2: Home, Category, Article, Search (3-Column with DynamicHeader and Bound Sticky Sidebars)
  return (
    <>
      <DynamicHeader />
      <div className="w-full px-2 md:px-4 lg:px-6 mx-auto pt-3 md:pt-4 flex flex-row items-start justify-between min-h-screen gap-4 relative">
        
        {/* LEFT UNIFIED STICKY SIDEBAR (210px) */}
        <aside
          style={{
            position: 'sticky',
            top: '16px',
            alignSelf: 'flex-start',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 32px)',
            zIndex: 20,
            width: '210px',
            flexShrink: 0,
          }}
          className="hidden xl:block w-[210px] flex-shrink-0 space-y-3 no-scrollbar sticky top-4 self-start transition-all duration-300"
        >
          {/* Top Left Dynamic Micro Widget: HOME = Bullion Rate, INNER = Live Traffic Alerts */}
          {isHomePage ? <CovaiBullionWidget /> : <CovaiTrafficWidget />}

          {/* Left Side Banner Ad (400px height) */}
          <div className="w-full h-[400px] bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2 shadow-xs flex flex-col shrink-0 overflow-hidden relative group">
            <div className="flex items-center justify-between text-[9px] font-black text-stone-400 dark:text-gray-500 uppercase tracking-wider mb-1 px-0.5">
              <span>SPONSORED AD</span>
              <span className="text-red-600 dark:text-red-400 truncate max-w-[100px]">PSG Tech</span>
            </div>
            <a
              href="https://todayscoimbatore.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex-1 rounded-lg overflow-hidden relative block bg-stone-950"
            >
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80"
                alt="PSG College of Technology"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 text-white">
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 block mb-0.5">Admissions 2026</span>
                <h4 className="text-[11px] font-black leading-snug line-clamp-2">PSG College of Technology — Autonomous &amp; NIRF Ranked</h4>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wide">
                  Apply Now &rarr;
                </span>
              </div>
            </a>
          </div>
        </aside>

        {/* CENTER MAIN FEED */}
        <main className="flex-1 min-w-0 space-y-4">
          {children}
        </main>

        {/* RIGHT UNIFIED STICKY SIDEBAR (210px) */}
        <aside
          style={{
            position: 'sticky',
            top: '16px',
            alignSelf: 'flex-start',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 32px)',
            zIndex: 20,
            width: '210px',
            flexShrink: 0,
          }}
          className="hidden xl:block w-[210px] flex-shrink-0 space-y-3 no-scrollbar sticky top-4 self-start transition-all duration-300"
        >
          {/* Top Right Dynamic Micro Widget: HOME = Weather & AQI, INNER = Covai Pulse Poll */}
          {isHomePage ? <CovaiWeatherWidget /> : <PollWidget />}

          {/* Right Side Banner Ad (400px height) */}
          <div className="w-full h-[400px] bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2 shadow-xs flex flex-col shrink-0 overflow-hidden relative group">
            <div className="flex items-center justify-between text-[9px] font-black text-stone-400 dark:text-gray-500 uppercase tracking-wider mb-1 px-0.5">
              <span>FEATURED AD</span>
              <span className="text-red-600 dark:text-red-400 truncate max-w-[100px]">Kongu Living</span>
            </div>
            <a
              href="https://todayscoimbatore.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex-1 rounded-lg overflow-hidden relative block bg-stone-950"
            >
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
                alt="Kongu Living Luxury Villas"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 text-white">
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 block mb-0.5">Real Estate</span>
                <h4 className="text-[11px] font-black leading-snug line-clamp-2">Kongu Living Estates — Luxury Smart Villas in Saravanampatti</h4>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wide">
                  Book Site Visit &rarr;
                </span>
              </div>
            </a>
          </div>
        </aside>

      </div>
    </>
  );
}
