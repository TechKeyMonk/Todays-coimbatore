'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

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
  const normalizedFormat =
    (format as string) === 'hero_banner' ||
    (format as string) === 'large_banner' ||
    (format as string) === 'in_feed_compact'
      ? 'in-feed'
      : format;

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
  if (normalizedFormat === 'leaderboard') {
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
  const enquiryTargetUrl =
    displayUrl && displayUrl !== 'https://todayscoimbatore.com' ? displayUrl : '/enquiry';

  return (
    <div
      className={`my-6 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-w-0">
        {/* Extended Thumbnail + Details Flex Group */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
          {/* Wider Image Area (Extended up to marked position) */}
          <div className="relative h-28 sm:h-24 w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            <Image
              src={
                displayImage ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
              }
              alt={displayTitle || 'Advertisement'}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover"
            />
            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              {displayBadge || 'PROPERTY SHOWCASE'}
            </span>
          </div>

          {/* Content Info Block */}
          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {displayAdvertiser || 'Kongu Living Developers'}
              </span>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Verified
              </span>
            </div>

            {/* Strict line-clamp prevents multi-line text from overflowing into button space */}
            <h4 className="line-clamp-1 text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight min-w-0">
              {displayTitle}
            </h4>
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400 leading-normal min-w-0">
              {displayDesc}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full sm:w-auto self-center">
          <a
            href={enquiryTargetUrl}
            target={enquiryTargetUrl.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer sponsored"
            className="flex sm:inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-95 text-center"
          >
            For Enquiry
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
