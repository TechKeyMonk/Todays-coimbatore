import React, { useState, useEffect } from 'react';
import { AdSlotRecord } from '@/services/db';

export interface AdSliderProps {
  ad: AdSlotRecord | null | undefined;
  variant: 'header' | 'sidebar' | 'infeed';
  label?: string;
}

export default function AdSlider({ ad, variant, label = 'SPONSORED' }: AdSliderProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  let activeSlides = ad?.slides?.filter(slide => slide.active) || [];

  if (activeSlides.length === 0 && ad) {
    const legacyAd = ad as any;
    if (legacyAd.imageUrl || legacyAd.bannerUrl || legacyAd.title) {
      activeSlides = [{
        id: 'legacy-fallback',
        title: legacyAd.title || '',
        advertiser: legacyAd.advertiser || '',
        description: legacyAd.description || '',
        imageUrl: legacyAd.imageUrl || legacyAd.bannerUrl || '',
        active: true,
      }];
    } else {
      activeSlides = [{
        id: 'placeholder',
        title: 'Your Ad Here',
        advertiser: 'SPONSORED',
        description: 'Contact us to advertise in this premium slot.',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
        active: true,
      }];
    }
  }

  const hasMultipleSlides = activeSlides.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides) {
      setCurrentSlideIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasMultipleSlides, activeSlides.length]);

  if (!ad || activeSlides.length === 0) return null;

  const currentSlide = activeSlides[currentSlideIndex];
  if (!currentSlide) return null;

  const { title, description, advertiser, imageUrl } = currentSlide;

  if (variant === 'header') {
    const currentCta = (currentSlide as any)?.ctaUrl || (currentSlide as any)?.destinationUrl || (ad as any)?.enquiryUrl || '/enquiry';

    return (
      <div className="w-full max-w-none mx-0 bg-[#080c14] border-b border-stone-200/20 dark:border-slate-800">
        <div className="w-full max-w-none mx-0 h-[80px] sm:h-[110px] md:h-[140px] lg:h-[160px] xl:h-[180px] overflow-hidden relative group flex-shrink-0">
          <a
            href={currentCta}
            target={currentCta.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block w-full h-full relative cursor-pointer"
            title={title || advertiser || 'View Advertisement'}
          >
            {/* Ambient Blurred Background for letterbox filling without distortion */}
            <div className="absolute inset-0 overflow-hidden opacity-30 blur-2xl scale-110 pointer-events-none">
              <img
                src={imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80'}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            </div>

            {/* Dynamic Banner Image Slider - 100% Bright, Crisp, Fully Visible */}
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
              {activeSlides.map((slide, index) => (
                <img
                  key={slide.id}
                  src={slide.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80'}
                  alt={slide.title || 'Advertisement'}
                  className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-700 ${
                    currentSlideIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />
              ))}
            </div>

            {/* Discreet, Professional Badging */}
            <div className="absolute top-2 left-3 sm:left-6 z-20 flex items-center gap-1.5 pointer-events-none">
              <span className="bg-black/70 text-white/90 text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-xs">
                {label || 'ADVERTISEMENT'}
              </span>
              {advertiser && (
                <span className="bg-red-600/90 text-white text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded backdrop-blur-md shadow-xs hidden sm:inline-block">
                  {advertiser}
                </span>
              )}
            </div>

            {/* Multiple slides indicator */}
            {hasMultipleSlides && (
              <div className="absolute bottom-2 right-3 sm:right-6 z-20 flex items-center gap-1.5 pointer-events-none">
                <span className="bg-black/60 text-white/80 text-[9px] font-mono px-2 py-0.5 rounded-full backdrop-blur-md">
                  {currentSlideIndex + 1} / {activeSlides.length}
                </span>
              </div>
            )}
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'infeed') {
    if (ad && !ad.active) {
      if (ad.fallbackAdSense) {
        return (
          <div className="my-6 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 dark:bg-stone-900/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Programmatic Ad Network
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Google AdSense
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600 dark:text-stone-400">
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-200">
                  Explore Top Opportunities Across Coimbatore
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Targeted commercial and enterprise ads served automatically via Google AdSense network inventory.
                </p>
              </div>
              <a
                href="/contact"
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs shrink-0"
              >
                Advertise Here
              </a>
            </div>
          </div>
        );
      }
      return null;
    }

    const slide = activeSlides[currentSlideIndex] || activeSlides[0];
    const adTitle = slide?.title || title || 'Premium Sponsored Feature';
    const adDesc = slide?.description || description || 'Verified local business announcement and commercial showcase in Coimbatore.';
    const adSponsor = slide?.advertiser || advertiser || 'Local Partner Network';
    const adCategory = label || 'SPONSORED';
    const adImage = slide?.imageUrl || imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
    const adUrl = (slide as any)?.ctaUrl || (slide as any)?.destinationUrl || (ad as any)?.enquiryUrl || '/enquiry';
    const ctaLabel = (slide as any)?.ctaText || 'For Enquiry';

    return (
      <div className="my-6 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-w-0">
          {/* Extended Thumbnail + Details Flex Group */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Wider Image Area */}
            <div className="relative h-28 sm:h-24 w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <img
                src={adImage}
                alt={adTitle || 'Advertisement'}
                className="w-full h-full object-cover"
              />
              <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                {adCategory}
              </span>
            </div>

            {/* Content Info Block */}
            <div className="flex flex-col min-w-0 flex-1 gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {adSponsor}
                </span>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Verified
                </span>
              </div>

              <h4 className="line-clamp-1 text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight min-w-0">
                {adTitle}
              </h4>
              <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400 leading-normal min-w-0">
                {adDesc}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 w-full sm:w-auto self-center">
            <a
              href={adUrl}
              target={adUrl.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="flex sm:inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-95 text-center"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant:
  // LEFT_SIDEBAR / RIGHT_STICKY lock: strictly 210 x 400 dimension
  return (
    <div className="w-[210px] max-w-[210px] h-[400px] bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2 shadow-xs flex flex-col shrink-0 overflow-hidden relative group">
      <div className="flex items-center justify-between text-[9px] font-black text-stone-400 dark:text-gray-500 uppercase tracking-wider mb-1 px-0.5">
        <span>{label}</span>
        <span className="text-red-600 dark:text-red-400 truncate max-w-[100px] transition-opacity duration-700">
          {advertiser || 'Ad'}
        </span>
      </div>
      <div className="w-full flex-1 rounded-lg overflow-hidden relative block bg-stone-950">
        <div className="w-full h-full relative">
          {activeSlides.map((slide, index) => (
            <img
              key={slide.id}
              src={slide.imageUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80'}
              alt={slide.title}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 group-hover:scale-105 block ${
                currentSlideIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 text-white z-20 transition-opacity duration-700">
          {description && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 block mb-0.5 truncate">
              {description}
            </span>
          )}
          <h4 className="text-[11px] font-black leading-snug line-clamp-3">
            {title || 'Sponsored Advertisement'}
          </h4>
        </div>
      </div>
    </div>
  );
}
