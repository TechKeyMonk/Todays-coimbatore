'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dbService from '@/services/db';

export interface SponsoredAdItem {
  id: string;
  title: string;
  advertiser: string;
  subtitle: string;
  category?: string;
  description?: string;
  venue?: string;
  phone?: string;
  imageUrl: string;
  ctaUrl: string;
  ctaText: string;
}

const FALLBACK_ADS: SponsoredAdItem[] = [
  {
    id: 'ad-kongu-villas',
    title: 'Kongu Living Estates — Luxury Smart Villas',
    advertiser: 'Kongu Living',
    subtitle: 'Saravanampatti IT Hub · RERA Approved 3 & 4 BHK Smart Villas with Private Gardens',
    category: 'REAL ESTATE',
    description:
      'Experience next-generation ultra-luxury living situated directly in Coimbatore’s Saravanampatti IT Corridor. Offering 3 & 4 BHK smart automated villas with private landscaped gardens, 100% solar EV charging ports, clubhouse amenities, and round-the-clock gated security.',
    venue: 'Saravanampatti IT Corridor, Sathy Road, Coimbatore',
    phone: '+91 98420 54321',
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ctaUrl: '/directory?search=Kongu+Living',
    ctaText: 'Explore',
  },
  {
    id: 'ad-psg-tech',
    title: 'PSG College of Technology — Admissions 2026',
    advertiser: 'PSG Tech Coimbatore',
    subtitle: 'Autonomous & NIRF Ranked Engineering, AI & Robotics Programs',
    category: 'EDUCATION',
    description:
      'Admissions now open for academic session 2026-27 across advanced B.Tech, M.Tech, and Research programs in AI & Data Science, Robotics, Mechanical Engineering, and Computer Science. Ranked among India’s premier technical institutions.',
    venue: 'Peelamedu, Avinashi Road, Coimbatore - 641004',
    phone: '0422 434 4777',
    imageUrl:
      'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
    ctaUrl: '/directory?search=PSG+Tech',
    ctaText: 'Explore',
  },
  {
    id: 'ad-tidel-park',
    title: 'TIDEL Park Coimbatore Phase-2 Office Suites',
    advertiser: 'ELCOT / TIDEL',
    subtitle: 'Grade-A Sustainable Tech Infrastructure along Avinashi Road Express Corridor',
    category: 'TECH PARK',
    description:
      'Expanding Coimbatore’s premier IT hub with Phase-2 plug-and-play grade-A workspaces, high-speed fiber redundancy, LEED Gold green building certifications, multi-cuisine food courts, and seamless expressway connectivity.',
    venue: 'Civil Aerodrome Post, Avinashi Road, Coimbatore - 641014',
    phone: '0422 251 3333',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    ctaUrl: '/directory?search=TIDEL+Park',
    ctaText: 'Explore',
  },
  {
    id: 'ad-elgi-compressors',
    title: 'ELGi Industrial Smart Compressors & Automation',
    advertiser: 'ELGi Equipments Global',
    subtitle: 'Energy-Saving Rotary Compressors Engineered in Coimbatore for Global Industry',
    category: 'INDUSTRIAL',
    description:
      'World-class industrial air compressors engineered in Coimbatore powering manufacturing and healthcare across 120+ countries. Featuring lowest lifecycle costs, IoT uptime monitoring, and zero-oil medical grade air technologies.',
    venue: 'Singanallur, Trichy Road, Coimbatore',
    phone: '1800 425 3544',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    ctaUrl: '/directory?search=ELGi',
    ctaText: 'Explore',
  },
];

export interface FloatingSponsoredAdProps {
  customAds?: SponsoredAdItem[];
}

export const FloatingSponsoredAd: React.FC<FloatingSponsoredAdProps> = ({ customAds }) => {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ads, setAds] = useState<SponsoredAdItem[]>(customAds || FALLBACK_ADS);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Absolute Desktop Isolation & Initial Reading Delay
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkViewport = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) {
        setIsVisible(false);
        setIsModalOpen(false);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);

    // Strict desktop purge: If desktop viewport, never mount ad
    if (window.innerWidth >= 768) {
      return () => window.removeEventListener('resize', checkViewport);
    }

    // Check if dismissed during current browser session
    try {
      if (
        sessionStorage.getItem('mobile_ad_dismissed') === 'true' ||
        sessionStorage.getItem('mobile_banner_dismissed') === 'true' ||
        sessionStorage.getItem('ad_dismissed') === 'true'
      ) {
        setIsVisible(false);
        return () => window.removeEventListener('resize', checkViewport);
      }
    } catch {
      // sessionStorage unavailable
    }

    // Dynamic sync from database service if active ads exist
    let isMounted = true;
    const fetchLiveAds = async () => {
      try {
        const slots = await dbService.getAds();
        if (!isMounted || !Array.isArray(slots) || slots.length === 0) return;

        const liveList: SponsoredAdItem[] = [];
        slots.forEach((slot) => {
          if (slot.active && Array.isArray(slot.slides)) {
            slot.slides.forEach((slide) => {
              if (slide.active && slide.imageUrl) {
                liveList.push({
                  id: slide.id,
                  title: slide.title || 'Kongu Living Estates — Luxury Smart Villas',
                  advertiser: slide.advertiser || 'Kongu Living',
                  subtitle: slide.description || 'Saravanampatti IT Hub · RERA Approved 3 & 4 BHK Smart Villas',
                  category: 'FEATURED',
                  description:
                    slide.description ||
                    'Discover verified premium property and business opportunities in Coimbatore.',
                  venue: 'Coimbatore, Tamil Nadu',
                  imageUrl: slide.imageUrl,
                  ctaUrl: (slide as any).targetUrl || (slide as any).ctaUrl || '/directory',
                  ctaText: 'Explore',
                });
              }
            });
          }
        });

        if (liveList.length > 0 && isMounted) {
          setAds(liveList);
        }
      } catch (err) {
        console.warn('FloatingSponsoredAd live ad sync notice:', err);
      }
    };

    fetchLiveAds();

    // 1.5-second initial delay before displaying on mobile
    const timer = setTimeout(() => {
      if (isMounted && window.innerWidth < 768) {
        try {
          const dismissed =
            sessionStorage.getItem('mobile_ad_dismissed') === 'true' ||
            sessionStorage.getItem('mobile_banner_dismissed') === 'true' ||
            sessionStorage.getItem('ad_dismissed') === 'true';
          if (!dismissed) {
            setIsVisible(true);
          }
        } catch {
          setIsVisible(true);
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  // 2. Automatic Dynamic Slider Engine (Every 4 Seconds, Pauses on Touch, Hover, or Modal Open)
  useEffect(() => {
    if (isDesktop || !isVisible || isPaused || isModalOpen || ads.length <= 1) return;

    const slideTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 4000);

    return () => clearInterval(slideTimer);
  }, [isDesktop, isVisible, isPaused, isModalOpen, ads.length]);

  // Strict Isolation: Do not render on Desktop (≥ 768px) or Admin dashboards
  if (isDesktop || !isVisible) {
    return null;
  }

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/directory/admin')) {
    return null;
  }

  const currentAd = ads[currentIndex] || ads[0];
  if (!currentAd) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsModalOpen(false);
    try {
      sessionStorage.setItem('mobile_ad_dismissed', 'true');
      sessionStorage.setItem('mobile_banner_dismissed', 'true');
      sessionStorage.setItem('ad_dismissed', 'true');
    } catch (err) {
      console.warn('Unable to persist dismissal in sessionStorage:', err);
    }
  };

  return (
    <>
      {/* PART 2: TOP-BANNER STYLE FULL BACKGROUND IMAGE MOBILE CAROUSEL (< 768px ONLY) */}
      <aside
        aria-label="Mobile Floating Sponsored Banner"
        className="fixed bottom-16 left-3 right-3 z-40 block md:hidden animate-slide-up select-none pointer-events-auto"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/20 shadow-2xl group bg-slate-900">
          {/* Full Image Background: Fill container completely using active ad's image */}
          {ads.map((ad, idx) => {
            const isActive = idx === currentIndex;
            return (
              <img
                key={ad.id || idx}
                src={ad.imageUrl}
                alt={ad.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                }}
              />
            );
          })}

          {/* Text Readability Protection: Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30 z-10 pointer-events-none" />

          {/* Overlaid Banner Content (Inside Gradient Layer z-20) */}
          <div className="relative z-20 h-full w-full p-3.5 flex flex-col justify-between">
            {/* Top Bar: SPONSORED badge + category/advertiser + Close Button at top-right */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded shadow-sm shrink-0">
                  SPONSORED
                </span>
                {currentAd.category && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
                    {currentAd.category}
                  </span>
                )}
                {currentAd.advertiser && (
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[140px] drop-shadow-sm">
                    • {currentAd.advertiser}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss mobile ad banner"
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs flex items-center justify-center backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-90 cursor-pointer shrink-0"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Middle/Bottom Content: Bold white title, short subtext, Explore CTA & dots */}
            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                >
                  <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-1 drop-shadow-md">
                    {currentAd.title}
                  </h4>
                  {currentAd.subtitle && (
                    <p className="text-[11px] text-slate-300 line-clamp-1 leading-snug mt-0.5 drop-shadow-sm">
                      {currentAd.subtitle}
                    </p>
                  )}
                </div>

                {/* Prominent Action Button: Opens Detailed View Modal */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs shadow-lg transition-transform flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Explore</span>
                  <span className="text-sm">&rarr;</span>
                </button>
              </div>

              {/* Dynamic Carousel Indicators (Pagination Dots) */}
              {ads.length > 1 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {ads.map((ad, idx) => (
                    <button
                      key={ad.id || idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? 'w-5 bg-red-500 shadow-sm'
                          : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* PART 3: "EXPLORE" FULL-VIEW MODAL POP-UP (< 768px) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${currentAd.title} Details`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 text-white space-y-4 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2.5 py-0.5 rounded shadow-sm">
                  SPONSORED
                </span>
                {currentAd.category && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    {currentAd.category}
                  </span>
                )}
                {currentAd.advertiser && (
                  <span className="text-xs font-bold text-slate-300 truncate">
                    {currentAd.advertiser}
                  </span>
                )}
              </div>

              {/* Modal Top-Right Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close detailed view modal"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold shadow-md transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Full High-Resolution Poster Image */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-md bg-black">
              <img
                src={currentAd.imageUrl}
                alt={currentAd.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Category Details */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white leading-snug">
                {currentAd.title}
              </h3>
              {currentAd.subtitle && (
                <p className="text-xs font-semibold text-red-400">
                  {currentAd.subtitle}
                </p>
              )}
            </div>

            {/* Expanded Description */}
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
              <p>{currentAd.description || currentAd.subtitle}</p>
            </div>

            {/* Address & Venue Details */}
            {(currentAd.venue || currentAd.phone) && (
              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-3">
                {currentAd.venue && (
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="text-slate-300">{currentAd.venue}</span>
                  </p>
                )}
                {currentAd.phone && (
                  <p className="flex items-center gap-2">
                    <span>📞</span>
                    <span className="text-slate-300">{currentAd.phone}</span>
                  </p>
                )}
              </div>
            )}

            {/* Direct Link Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={currentAd.ctaUrl}
                target={currentAd.ctaUrl.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Visit Official Page / Enquire Now</span>
                <span>&rarr;</span>
              </a>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingSponsoredAd;
