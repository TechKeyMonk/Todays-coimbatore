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
    return (
      // TOP_HEADER full-bleed lock: w-full, max-w-none, mx-0 fitting edge-to-edge
      // Expanded height: h-[110px] sm:h-[140px] md:h-[170px] lg:h-[185px] xl:h-[200px]
      <div className="w-full max-w-none mx-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-none mx-0 h-[110px] sm:h-[140px] md:h-[170px] lg:h-[185px] xl:h-[200px] overflow-hidden relative bg-stone-950 group flex-shrink-0">
          <div className="block w-full h-full relative">
            {/* Dynamic Banner Image Slider */}
            <div className="w-full h-full relative overflow-hidden bg-black">
              {activeSlides.map((slide, index) => (
                <img
                  key={slide.id}
                  src={slide.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80'}
                  alt={slide.title}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 group-hover:scale-105 ${
                    currentSlideIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                />
              ))}
            </div>

            {/* High Contrast Gradient Overlay with Title, Description */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30 flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 text-white z-20 pointer-events-none">
              <div className="max-w-4xl space-y-1 sm:space-y-1.5 min-w-0 pr-4 transition-opacity duration-700 pointer-events-auto">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  <span className="bg-red-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded tracking-wide uppercase shadow-xs shrink-0">
                    {advertiser || 'SPONSORED'}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-white/80 uppercase truncate hidden sm:inline">
                    Coimbatore Tech Corridor
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black text-white leading-tight drop-shadow-sm line-clamp-2">
                  {title || 'TIDEL Park Coimbatore Phase-2 Office Suites Open for Booking'}
                </h3>
                {description && (
                  <p className="text-xs sm:text-sm text-stone-200 font-medium line-clamp-2 leading-relaxed hidden sm:block max-w-3xl">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'infeed') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-3 shadow-xs overflow-hidden relative group">
        <div className="flex items-center justify-between text-[9px] font-black text-stone-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-0.5">
          <span>{label}</span>
          <span className="text-red-600 dark:text-red-400 truncate max-w-[200px] transition-opacity duration-700">
            {advertiser || 'Sponsored'}
          </span>
        </div>
        <div className="w-full h-32 sm:h-36 md:h-40 rounded-lg overflow-hidden relative block bg-stone-950">
          <div className="w-full h-full relative">
            {activeSlides.map((slide, index) => (
              <img
                key={slide.id}
                src={slide.imageUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80'}
                alt={slide.title}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 group-hover:scale-105 block ${
                  currentSlideIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/65 to-transparent p-4 flex flex-col justify-end md:justify-center text-white z-20 transition-opacity duration-700">
            {description && (
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400 block mb-1 truncate">
                {description}
              </span>
            )}
            <h4 className="text-xs sm:text-sm md:text-base font-black leading-snug line-clamp-2 max-w-xl text-white">
              {title || 'Sponsored Advertisement'}
            </h4>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant:
  // LEFT_SIDEBAR / RIGHT_STICKY lock: w-[210px] max-w-[210px] h-[400px] overflow-hidden
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
