'use client';

import React, { useState, useEffect } from 'react';

export type AdBannerFormat = 'leaderboard' | 'medium-rectangle' | 'half-page' | 'in-feed';

export interface AdBannerProps {
  slotId?: string;
  format?: AdBannerFormat;
  title?: string;
  description?: string;
  advertiserName?: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  badgeText?: string;
  className?: string;
  enableAutoFetch?: boolean;
}

interface FetchedCampaign {
  id: string;
  title: string;
  description: string;
  advertiserName: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  bannerUrl?: string;
  badgeText?: string;
  isProgrammatic?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = 'slot-default',
  format = 'in-feed',
  title,
  description,
  advertiserName,
  ctaText,
  ctaUrl,
  imageUrl,
  bannerUrl,
  badgeText,
  className = '',
  enableAutoFetch = true,
}) => {
  const [adData, setAdData] = useState<FetchedCampaign | null>(null);
  const [isProgrammatic, setIsProgrammatic] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If all essential props are manually supplied, use them directly
    if (title && advertiserName) {
      setAdData({
        id: slotId,
        title,
        description: description || '',
        advertiserName,
        ctaText: ctaText || 'Learn More',
        ctaUrl: ctaUrl || 'https://todayscoimbatore.com',
        imageUrl,
        badgeText: badgeText || 'Sponsored',
        isProgrammatic: false,
      });
      return;
    }

    if (!enableAutoFetch) return;

    let isMounted = true;
    const fetchDynamicAd = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/ads?slot=${encodeURIComponent(slotId)}&format=${encodeURIComponent(format)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.campaign) {
            setAdData(json.campaign);
            setIsProgrammatic(json.type === 'programmatic' || json.campaign.isProgrammatic);
          }
        }
      } catch (err) {
        console.warn('Dynamic ad fetch error, using fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDynamicAd();

    return () => {
      isMounted = false;
    };
  }, [slotId, format, title, description, advertiserName, ctaText, ctaUrl, imageUrl, badgeText, enableAutoFetch]);

  // Active data fallback
  const displayTitle = adData?.title || title || 'Kongu Living Gated Villa Community in Saravanampatti';
  const displayDesc = adData?.description || description || 'DTCP & RERA approved luxury smart villas with clubhouse, EV points, and 24/7 security.';
  const displayAdvertiser = adData?.advertiserName || advertiserName || 'Kongu Living Developers';
  const displayCta = adData?.ctaText || ctaText || 'Schedule Site Visit';
  const displayUrl = adData?.ctaUrl || ctaUrl || 'https://todayscoimbatore.com';
  const rawImage = adData?.imageUrl || imageUrl;
  const displayImage = (rawImage && typeof rawImage === 'string' && rawImage.trim() !== '') ? rawImage.trim() : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
  const displayBadge = adData?.badgeText || badgeText || (isProgrammatic ? 'Google AdSense' : 'Advertisement');

  /* ------------------------------------------------------------------------ */
  /*                            Format: Leaderboard                           */
  /* ------------------------------------------------------------------------ */
  if (format === 'leaderboard') {
    const activeBanner = bannerUrl || adData?.bannerUrl || displayImage;
    return (
      <div className={`w-full max-w-[728px] h-[90px] min-h-[90px] max-h-[90px] mx-auto overflow-hidden rounded-md bg-stone-900 shrink-0 isolation-isolate ${className}`}>
        <aside
          role="region"
          aria-label="Advertisement Banner"
          data-ad-slot={slotId}
          className="group relative w-full h-[90px] overflow-hidden rounded-md border border-stone-300 dark:border-slate-800 bg-stone-900 shadow-xs transition-all duration-200"
        >
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="relative flex items-center justify-between w-full h-full px-3.5 sm:px-5 overflow-hidden cursor-pointer group select-none"
          >
            {/* Background Graphic Image */}
            {activeBanner && (
              <img
                src={activeBanner}
                alt={displayTitle || "Ad"}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            )}

            {/* Subtle Dark Gradient Overlay for optimal text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10 pointer-events-none" />

            {/* Text & Content Overlay (Truncated single-line to prevent overlap & bleed) */}
            <div className="relative z-20 flex flex-col justify-center min-w-0 max-w-[70%] sm:max-w-[75%] pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shrink-0">
                  {displayBadge}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-200 truncate drop-shadow-xs">
                  {displayAdvertiser}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white truncate drop-shadow-md leading-tight group-hover:text-red-300 transition-colors">
                {displayTitle}
              </h4>
              {displayDesc && (
                <p className="hidden sm:block text-[10px] font-medium text-gray-300 truncate drop-shadow-xs mt-0.5">
                  {displayDesc}
                </p>
              )}
            </div>

            {/* Right-aligned CTA Action Badge */}
            <div className="relative z-20 shrink-0 flex items-center pl-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-stone-900 text-xs font-black uppercase tracking-wider shadow-md transition-all group-hover:bg-red-600 group-hover:text-white">
                <span>{displayCta}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </span>
            </div>
          </a>
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*               Format: In-Feed / Standard Native Unit                     */
  /* ------------------------------------------------------------------------ */
  return (
    <div className={`my-4 overflow-hidden rounded-xl bg-white p-2 border border-gray-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center justify-center isolation-isolate w-full ${className}`}>
      <aside
        role="region"
        aria-label="Sponsored In-Feed Article"
        data-ad-slot={slotId}
        className="group relative w-full overflow-hidden rounded-xl border border-stone-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 text-[#111111] dark:text-white shadow-xs transition-all duration-200 hover:border-stone-400 dark:hover:border-slate-700"
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Thumbnail */}
          {displayImage && (
            <div className="relative sm:w-48 sm:h-32 w-full h-44 shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-slate-800 bg-slate-900">
              <img
                src={displayImage}
                alt={displayTitle}
                style={{ filter: 'none', mixBlendMode: 'normal', opacity: 1 }}
                className="!filter-none !mix-blend-normal !opacity-100 dark:!filter-none object-contain mx-auto block ad-banner-media h-full w-full transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-2 left-2 rounded bg-black/80 text-white px-2 py-0.5 text-[10px] font-black tracking-wider uppercase">
                {displayBadge}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between text-xs text-[#444444] dark:text-gray-400 mb-1 font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-[#111111] dark:text-gray-100 font-black">{displayAdvertiser}</span>
                  <span className="text-stone-300 dark:text-slate-700">•</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {isProgrammatic ? 'AdSense Automated Program' : 'Verified Partner'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Sponsored</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                {displayTitle}
              </h3>

              <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#222222] dark:text-gray-300 line-clamp-2 leading-relaxed">
                {displayDesc}
              </p>
            </div>

            <div className="mt-3 sm:mt-2 flex items-center justify-between pt-2 border-t border-stone-200 dark:border-slate-800">
              <span className="text-[11px] text-[#444444] dark:text-gray-400 font-bold">
                {isProgrammatic ? 'Ad Choices • Google Network' : 'Direct Advertiser Placement'}
              </span>
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-red-600 dark:text-red-400 hover:underline"
              >
                <span>{displayCta}</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AdBanner;
