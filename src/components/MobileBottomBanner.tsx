'use client';

import React, { useState, useEffect } from 'react';
import dbService from '@/services/db';

interface MobileSlide {
  id: string;
  title: string;
  advertiser: string;
  description?: string;
  imageUrl: string;
}

const FALLBACK_MOBILE_SLIDES: MobileSlide[] = [
  {
    id: 'mobile-slide-1',
    title: 'Kongu Living Estates — Luxury Smart Villas',
    advertiser: 'Kongu Living',
    description: 'Saravanampatti IT Hub · RERA Approved 3 & 4 BHK Smart Villas',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'mobile-slide-2',
    title: 'PSG College of Technology — Admissions 2026',
    advertiser: 'PSG Tech Coimbatore',
    description: 'Autonomous & NIRF Ranked Engineering Programs',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'mobile-slide-3',
    title: 'TIDEL Park Coimbatore Phase-2 Office Suites',
    advertiser: 'ELCOT / TIDEL',
    description: 'Grade-A Tech Infrastructure along Avinashi Road',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'mobile-slide-4',
    title: 'ELGi Industrial Smart Compressors & Automation',
    advertiser: 'ELGi Equipments Global',
    description: 'Energy-Saving Rotary Compressors Engineered in Coimbatore',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
  },
];

interface MobileBottomBannerProps {
  onClose?: () => void;
}

export const MobileBottomBanner: React.FC<MobileBottomBannerProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [slides, setSlides] = useState<MobileSlide[]>(FALLBACK_MOBILE_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Fetch active ads from Supabase / DB Service and sync dynamically
  useEffect(() => {
    let isMounted = true;

    const loadAds = async () => {
      try {
        const slots = await dbService.getAds();
        if (!isMounted) return;

        const collected: MobileSlide[] = [];

        if (Array.isArray(slots) && slots.length > 0) {
          slots.forEach((slot) => {
            if (slot.active && Array.isArray(slot.slides)) {
              slot.slides.forEach((slide) => {
                if (slide.active && slide.imageUrl) {
                  collected.push({
                    id: slide.id,
                    title: slide.title || 'Sponsored Showcase',
                    advertiser: slide.advertiser || 'Featured Partner',
                    description: slide.description || '',
                    imageUrl: slide.imageUrl,
                  });
                }
              });
            }
          });
        }

        if (collected.length > 0 && isMounted) {
          setSlides(collected);
        }
      } catch (err) {
        console.warn('MobileBottomBanner ad fetch error, using fallbacks:', err);
      }
    };

    loadAds();

    const handleUpdate = () => {
      loadAds();
    };

    window.addEventListener('adsStorageUpdate', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('adsStorageUpdate', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto-slide carousel rotation every 4 seconds (3-5s requirement)
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (!isVisible || slides.length === 0) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <aside
      aria-label="Mobile Sponsored Display Banner"
      // SCOPE LOCK: block md:hidden ensures it ONLY renders on mobile screens (<768px) and NEVER on Desktop/PC
      className="block md:hidden z-40 fixed bottom-0 left-0 right-0 p-1.5 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-stone-200 dark:border-slate-800 shadow-2xl pointer-events-auto transition-all select-none"
    >
      {/* DISPLAY-ONLY CONTAINER: Strictly no <a> tag and no onClick redirection */}
      <div
        role="region"
        aria-label="Sponsored Display Showcase"
        className="relative w-full max-w-[440px] mx-auto h-[60px] flex items-center justify-between gap-2.5 overflow-hidden px-2.5 rounded-xl bg-[#f8f6f0] dark:bg-slate-800/95 border border-stone-300 dark:border-slate-700 shadow-inner cursor-default"
      >
        {/* Dynamic Carousel Slide Track */}
        <div className="relative flex-1 h-full overflow-hidden flex items-center min-w-0">
          {slides.map((slide, index) => {
            const isActive = index === currentSlideIndex;
            return (
              <div
                key={slide.id || index}
                className={`absolute inset-0 flex items-center gap-2.5 min-w-0 pr-1 transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-6 pointer-events-none'
                }`}
              >
                {/* Display-Only Image Thumbnail */}
                <div className="relative h-[44px] w-[54px] rounded-lg overflow-hidden shrink-0 border border-stone-300 dark:border-slate-600 bg-slate-900">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                </div>

                {/* Display-Only Content Info */}
                <div className="flex flex-col justify-center min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-1.5 leading-none mb-0.5">
                    <span className="text-[8px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                      Sponsored
                    </span>
                    <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase truncate max-w-[140px]">
                      • {slide.advertiser}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-extrabold text-[#111111] dark:text-white truncate leading-tight">
                    {slide.title}
                  </h4>
                  {slide.description && (
                    <p className="text-[9px] text-gray-600 dark:text-gray-300 truncate leading-snug">
                      {slide.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Area: Display-Only Badge & Functional Close ('X') Button */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Informative Display-Only Indicator (Non-clickable) */}
          <span className="hidden xs:inline-block text-[9px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-300 bg-stone-200/80 dark:bg-slate-700 px-2 py-0.5 rounded border border-stone-300/70 dark:border-slate-600 select-none">
            Ad Display
          </span>

          {/* Functional Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Dismiss mobile banner ad"
            className="w-6 h-6 rounded-full bg-black/60 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs shrink-0"
            title="Dismiss Ad"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
};

export default MobileBottomBanner;
