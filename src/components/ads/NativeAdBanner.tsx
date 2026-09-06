import React from 'react';
import Image from 'next/image';

export type AdFormat = 'leaderboard' | 'medium-rectangle' | 'half-page' | 'in-feed';

export interface NativeAdBannerProps {
  /**
   * The ad banner format / layout variant
   * @default 'leaderboard'
   */
  format?: AdFormat;
  /**
   * Alias for format
   */
  type?: AdFormat;
  /**
   * Main headline / brand name displayed on the ad
   */
  title?: string;
  /**
   * Supporting description / marketing copy
   */
  description?: string;
  /**
   * Call to action button text
   * @default 'Learn More'
   */
  ctaText?: string;
  /**
   * Destination URL when clicking the ad or CTA button
   */
  ctaUrl?: string;
  /**
   * Optional custom image or logo URL
   */
  imageUrl?: string;
  /**
   * Optional full banner graphic image URL
   */
  bannerUrl?: string;
  /**
   * Label tag displayed on the ad
   * @default 'Sponsored'
   */
  badgeText?: string;
  /**
   * Advertiser / brand name
   */
  advertiserName?: string;
  /**
   * Additional Tailwind or CSS class names for the outer container
   */
  className?: string;
  /**
   * Optional ad slot ID (e.g. for Google AdSense or Ad Manager integration)
   */
  slotId?: string;
  /**
   * Whether to show a fallback placeholder mockup when no real ad script is rendered
   * @default true
   */
  showPlaceholder?: boolean;
  /**
   * Custom children to render inside the banner (e.g. real ad network scripts or custom tags)
   */
  children?: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                                SVG Icon Set                                */
/* -------------------------------------------------------------------------- */

const ExternalLinkIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
    />
  </svg>
);

const SparklesIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

const InfoIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

const PhotoPlaceholderIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export const NativeAdBanner: React.FC<NativeAdBannerProps> = ({
  format,
  type,
  title,
  description,
  ctaText = 'Learn More',
  ctaUrl = '#',
  imageUrl,
  bannerUrl,
  badgeText = 'Sponsored',
  advertiserName = 'Featured Partner',
  className = '',
  slotId,
  showPlaceholder = true,
  children,
}) => {
  const rawFormat = (format || type || 'leaderboard') as string;
  const activeFormat: AdFormat =
    rawFormat === 'hero_banner' || rawFormat === 'large_banner' || rawFormat === 'in_feed_compact'
      ? 'in-feed'
      : (rawFormat as AdFormat);

  // If custom child ad script or node is provided, wrap in standardized container
  if (children) {
    return (
      <div className={`overflow-hidden rounded-xl bg-white p-2 border border-gray-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center justify-center isolation-isolate w-full ${className}`}>
        <aside
          role="region"
          aria-label="Advertisement"
          data-ad-slot={slotId}
          className="native-ad-wrapper relative w-full overflow-hidden rounded-xl border border-stone-300 dark:border-slate-800 bg-[#eeeef0] dark:bg-slate-900 text-[#1a1a1a] dark:text-white shadow-xs transition-colors duration-200"
        >
          <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 px-3 py-1 text-[11px] font-bold tracking-wider text-stone-500 dark:text-gray-400 uppercase">
            <span>{badgeText}</span>
            <span className="flex items-center gap-1 text-stone-400 dark:text-gray-400">
              <InfoIcon /> Ad
            </span>
          </div>
          <div className="flex items-center justify-center p-2">{children}</div>
        </aside>
      </div>
    );
  }

  // Fallback defaults tailored for each format if not explicitly passed
  const displayTitle =
    title ||
    (activeFormat === 'leaderboard'
      ? 'Discover Coimbatore’s Premier Local Business Directory'
      : activeFormat === 'half-page'
      ? 'Expand Your Reach Across Tamil Nadu'
      : activeFormat === 'medium-rectangle'
      ? 'Grow Your Brand in Coimbatore'
      : 'Special Feature: Local Tech & Startup Spotlight');

  const displayDescription =
    description ||
    (activeFormat === 'leaderboard'
      ? 'Connect with verified local services, real estate, education, and tech hubs in Coimbatore.'
      : activeFormat === 'half-page'
      ? 'Get maximum brand visibility with hyper-local targeting. Reach thousands of active daily readers and business owners.'
      : activeFormat === 'medium-rectangle'
      ? 'Targeted advertising solutions designed for growing enterprises and local businesses.'
      : 'Explore curated business updates, innovative ventures, and exclusive community events happening this week.');

  const validImageUrl = (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') ? imageUrl.trim() : null;
  const validBannerUrl = (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim() !== '') ? bannerUrl.trim() : null;
  const activeBanner = validBannerUrl || validImageUrl;

  /* ------------------------------------------------------------------------ */
  /*                            Format: Leaderboard                           */
  /*             (Fixed 728x90 Banner Container to Prevent CLS)               */
  /* ------------------------------------------------------------------------ */
  if (activeFormat === 'leaderboard') {
    return (
      <div className={`w-full max-w-[728px] h-[90px] min-h-[90px] max-h-[90px] mx-auto overflow-hidden rounded-md bg-stone-900 shrink-0 isolation-isolate ${className}`}>
        <aside
          role="region"
          aria-label="Sponsored Leaderboard Advertisement"
          data-ad-slot={slotId}
          className="group relative w-full h-[90px] overflow-hidden rounded-md border border-stone-300 dark:border-slate-800 bg-stone-900 shadow-xs transition-all duration-200"
        >
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="relative flex items-center justify-between w-full h-full px-3 sm:px-5 overflow-hidden cursor-pointer group select-none"
          >
            {/* Background Graphic Image */}
            {activeBanner && (
              <img
                src={activeBanner}
                alt={displayTitle || "Advertisement"}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            )}

            {/* Subtle Dark Gradient Overlay for optimal text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10 pointer-events-none" />

            {/* Text & Content Overlay (Truncated single-line to prevent overlap & bleed) */}
            <div className="relative z-20 flex flex-col justify-center min-w-0 max-w-[70%] sm:max-w-[75%] pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shrink-0">
                  {badgeText || 'Sponsored'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-200 truncate drop-shadow-xs">
                  {advertiserName || 'Featured Partner'}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white truncate drop-shadow-md leading-tight group-hover:text-red-300 transition-colors">
                {displayTitle}
              </h4>
              {displayDescription && (
                <p className="hidden sm:block text-[10px] font-medium text-gray-300 truncate drop-shadow-xs mt-0.5">
                  {displayDescription}
                </p>
              )}
            </div>

            {/* Right-aligned CTA Action Badge */}
            <div className="relative z-20 shrink-0 flex items-center pl-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-stone-900 text-xs font-black uppercase tracking-wider shadow-md transition-all group-hover:bg-red-600 group-hover:text-white">
                <span>{ctaText || 'Learn More'}</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </span>
            </div>
          </a>
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                        Format: Medium Rectangle                          */
  /*                       (Standard 300x250 / MPU)                           */
  /* ------------------------------------------------------------------------ */
  if (activeFormat === 'medium-rectangle') {
    return (
      <div className={`my-4 overflow-hidden rounded-xl bg-white p-2 border border-gray-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center justify-center isolation-isolate w-full ${className}`}>
        <aside
          role="region"
          aria-label="Sponsored Rectangle Advertisement"
          data-ad-slot={slotId}
          className="group relative flex flex-col justify-between w-full max-w-[300px] min-h-[250px] mx-auto overflow-hidden rounded-xl border border-stone-300 dark:border-slate-800 bg-[#f8f6f0] dark:bg-slate-900 p-4 text-[#111111] dark:text-white shadow-xs transition-all duration-200 hover:border-stone-400 dark:hover:border-slate-700"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-[#333333] dark:text-gray-300 uppercase border border-stone-300 dark:border-slate-700">
                {badgeText}
              </span>
              <span className="text-xs text-[#333333] dark:text-gray-300 font-bold truncate max-w-[120px]">
                {advertiserName}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#444444] dark:text-gray-400">
              <InfoIcon />
            </div>
          </div>

          {/* Media Placeholder or Image */}
          <div className="relative mb-3 overflow-hidden rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 aspect-[16/9] flex items-center justify-center">
            {validImageUrl ? (
              <img
                src={validImageUrl}
                alt={displayTitle}
                style={{ filter: 'none', mixBlendMode: 'normal', opacity: 1 }}
                className="!filter-none !mix-blend-normal !opacity-100 dark:!filter-none object-contain mx-auto block ad-banner-media h-full w-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-[#444444] dark:text-gray-400">
                <PhotoPlaceholderIcon className="w-8 h-8 text-stone-500 dark:text-stone-400" />
                <span className="text-[11px] font-black tracking-wide text-[#333333] dark:text-gray-300">
                  300 × 250 MPU
                </span>
              </div>
            )}
          </div>

          {/* Body Text */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#111111] dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {displayTitle}
            </h4>
            <p className="mt-1 text-xs font-medium text-[#222222] dark:text-gray-300 line-clamp-2">
              {displayDescription}
            </p>
          </div>

          {/* Footer CTA */}
          <div className="mt-3 pt-2 border-t border-stone-300 dark:border-slate-800">
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-[#111111] dark:text-white py-2 text-xs font-black border border-stone-300 dark:border-slate-700 shadow-xs transition-all"
            >
              <span>{ctaText}</span>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-[#333333] dark:text-gray-300" />
            </a>
          </div>
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                            Format: Half Page                             */
  /*                       (Standard 300x600 Skyscraper)                      */
  /* ------------------------------------------------------------------------ */
  if (activeFormat === 'half-page') {
    return (
      <div className={`my-4 overflow-hidden rounded-xl bg-white p-2 border border-gray-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center justify-center isolation-isolate w-full ${className}`}>
        <aside
          role="region"
          aria-label="Sponsored Half Page Skyscraper Advertisement"
          data-ad-slot={slotId}
          className="group relative flex flex-col justify-between w-full max-w-[300px] min-h-[580px] mx-auto overflow-hidden rounded-2xl border border-stone-300 dark:border-slate-800 bg-[#f3ede2] dark:bg-slate-900 p-4 text-[#111111] dark:text-white shadow-xs transition-all duration-200 hover:border-stone-400 dark:hover:border-slate-700"
        >
          {/* Top bar */}
          <div>
            <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-2 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black tracking-wider text-[#333333] dark:text-gray-300 uppercase border border-stone-300 dark:border-slate-700">
                  <SparklesIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                  {badgeText}
                </span>
              </div>
              <span className="text-xs text-[#333333] dark:text-gray-300 font-bold truncate max-w-[120px]">
                {advertiserName}
              </span>
            </div>

            {/* Hero Banner Visual */}
            <div className="relative mb-4 overflow-hidden rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 aspect-[4/3] flex items-center justify-center shadow-inner">
              {validImageUrl ? (
                <img
                  src={validImageUrl}
                  alt={displayTitle}
                  style={{ filter: 'none', mixBlendMode: 'normal', opacity: 1 }}
                  className="!filter-none !mix-blend-normal !opacity-100 dark:!filter-none object-contain mx-auto block ad-banner-media h-full w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-3 text-[#444444] dark:text-gray-400">
                  <PhotoPlaceholderIcon className="w-10 h-10 text-stone-500 dark:text-stone-400" />
                  <span className="text-xs font-black text-[#111111] dark:text-white">
                    300 × 600 Half-Page
                  </span>
                  <span className="text-[10px] font-bold text-[#444444] dark:text-gray-400">
                    High-Impact Display Slot
                  </span>
                </div>
              )}
            </div>

            {/* Headline & Story */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#111111] dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {displayTitle}
              </h3>

              <p className="text-xs leading-relaxed font-medium text-[#222222] dark:text-gray-300">
                {displayDescription}
              </p>

              {/* Feature Highlights Mockup */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#111111] dark:text-gray-200 font-semibold">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400" />
                  <span>Verified Coimbatore Business</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#111111] dark:text-gray-200 font-semibold">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                  <span>Exclusive Community Offers</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#111111] dark:text-gray-200 font-semibold">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0d4d4d] dark:bg-emerald-500" />
                  <span>Instant Consultation & Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Action Button */}
          <div className="mt-6 pt-4 border-t border-stone-300 dark:border-slate-800 space-y-2">
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white py-3 text-xs sm:text-sm font-black shadow-xs transition-all"
            >
              <span>{ctaText}</span>
              <ExternalLinkIcon className="w-4 h-4 text-white" />
            </a>
            <div className="flex items-center justify-between text-[10px] text-[#444444] dark:text-gray-400 font-bold px-1">
              <span>Ad Disclosure</span>
              <span className="flex items-center gap-0.5">
                <InfoIcon /> Privacy
              </span>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                            Format: In-Feed                               */
  /*                  (Blends seamlessly into article feeds)                  */
  const enquiryTargetUrl = ctaUrl && ctaUrl !== '#' ? ctaUrl : '/enquiry';

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
                validImageUrl ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
              }
              alt={displayTitle || 'Advertisement'}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover"
            />
            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              {badgeText || 'PROPERTY SHOWCASE'}
            </span>
          </div>

          {/* Content Info Block */}
          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {advertiserName || 'Kongu Living Developers'}
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
              {displayDescription}
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

export default NativeAdBanner;
