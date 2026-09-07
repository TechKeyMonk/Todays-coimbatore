'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DynamicHeader from './DynamicHeader';
import CovaiBullionWidget from '../widgets/CovaiBullionWidget';
import CovaiWeatherWidget from '../widgets/CovaiWeatherWidget';
import CovaiTrafficWidget from '../widgets/CovaiTrafficWidget';
import PollWidget from '../widgets/PollWidget';
import dbService, { AdSlotRecord, INITIAL_ADS_DB } from '@/services/db';
import AdSlider from '../AdSlider';

export default function MainLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const isHomePage = pathname === '/';

  // Dynamic Advertisement State
  const [adSlots, setAdSlots] = useState<AdSlotRecord[]>(INITIAL_ADS_DB);

  useEffect(() => {
    const loadAds = async () => {
      try {
        const liveAds = await dbService.getAds();
        if (liveAds && liveAds.length > 0) {
          setAdSlots(liveAds);
        }
      } catch (err) {
        console.error('Failed to load ads in MainLayoutWrapper:', err);
      }
    };

    loadAds();

    // Listen to real-time events when ads are updated in Admin CMS
    const handleAdsUpdate = () => {
      loadAds();
    };

    window.addEventListener('adsStorageUpdate', handleAdsUpdate);
    window.addEventListener('todayscoimbatore:db-updated', handleAdsUpdate as EventListener);
    window.addEventListener('storage', handleAdsUpdate);

    return () => {
      window.removeEventListener('adsStorageUpdate', handleAdsUpdate);
      window.removeEventListener('todayscoimbatore:db-updated', handleAdsUpdate as EventListener);
      window.removeEventListener('storage', handleAdsUpdate);
    };
  }, []);

  // Locate Left and Right sidebar ads
  const leftAd = adSlots.find(
    (a) =>
      a.slotId === 'LEFT_SIDEBAR_BANNER' ||
      a.placementKey === 'LEFT_SIDEBAR_BANNER' ||
      a.placementKey === 'left_sidebar' ||
      a.id === 'ad-slot-left'
  );

  const rightAd = adSlots.find(
    (a) =>
      a.slotId === 'RIGHT_SIDEBAR_BANNER' ||
      a.placementKey === 'RIGHT_SIDEBAR_BANNER' ||
      a.placementKey === 'right_sidebar' ||
      a.id === 'ad-slot-right' ||
      a.slotId === 'RIGHT_SIDEBAR_TOP' ||
      a.placementKey === 'RIGHT_SIDEBAR_TOP'
  );

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
      '/business',
      '/tech',
      '/infrastructure',
      '/sports',
      '/education',
      '/about',
      '/about-us',
      '/contact',
      '/contact-us',
      '/enquiry',
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

  // RULE 2: Home, Category, Article, Search (Locked Sidebar Proportions with Elastic Center Feed)
  return (
    <>
      <DynamicHeader />
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 md:pt-4 flex flex-col lg:flex-row items-start justify-between min-h-screen gap-4 lg:gap-5 relative">
        
        {/* LEFT UNIFIED STICKY SIDEBAR (210 x 400 Rail Width: w-[210px] shrink-0) */}
        <aside
          style={{
            position: 'sticky',
            top: '16px',
            alignSelf: 'flex-start',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 32px)',
            zIndex: 20,
            width: '210px',
          }}
          className="hidden lg:block w-[210px] shrink-0 space-y-4 no-scrollbar sticky top-4 self-start transition-all duration-300 min-w-0"
        >
          {/* Top Left Dynamic Micro Widget: HOME = Bullion Rate, INNER = Live Traffic Alerts */}
          {isHomePage ? <CovaiBullionWidget /> : <CovaiTrafficWidget />}

          {/* Dynamic Left Side Banner Ad (210 x 400) */}
          <AdSlider ad={leftAd} variant="sidebar" label="SPONSORED AD" />
        </aside>

        {/* CENTER MAIN FEED (Boundary Guarded: flex-1 w-full min-w-0 overflow-hidden) */}
        <main className="flex-1 w-full min-w-0 space-y-4 overflow-hidden">
          {children}
        </main>

        {/* RIGHT UNIFIED STICKY SIDEBAR (210 x 400 Rail Width: w-[210px] shrink-0) */}
        <aside
          style={{
            position: 'sticky',
            top: '16px',
            alignSelf: 'flex-start',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 32px)',
            zIndex: 20,
            width: '210px',
          }}
          className="hidden lg:block w-[210px] shrink-0 space-y-4 no-scrollbar sticky top-4 self-start transition-all duration-300 min-w-0"
        >
          {/* Top Right Dynamic Micro Widget: HOME = Weather & AQI, INNER = Covai Pulse Poll */}
          {isHomePage ? <CovaiWeatherWidget /> : <PollWidget />}

          {/* Dynamic Right Side Banner Ad (210 x 400) */}
          <AdSlider ad={rightAd} variant="sidebar" label="FEATURED AD" />
        </aside>

      </div>
    </>
  );
}
