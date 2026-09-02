'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import dbService, { Article, OutageRecord, AdSlotRecord, INITIAL_ADS_DB } from '../../services/db';
import {
  MapPin,
  Sun,
  Moon,
  Search,
  Smartphone,
  Phone,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Building2,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export interface NavCategory {
  id: string;
  name: string;
  href: string;
  highlight?: boolean;
}

export const EDITORIAL_CATEGORIES: NavCategory[] = [
  { id: 'news', name: 'NEWS', href: '/news' },
  { id: 'our-city', name: 'OUR CITY', href: '/our-city' },
  { id: 'business', name: 'BUSINESS', href: '/business' },
  { id: 'tech', name: 'TECH', href: '/tech' },
  { id: 'infrastructure', name: 'INFRASTRUCTURE', href: '/infrastructure' },
  { id: 'ceos-of-coimbatore', name: 'CEO', href: '/ceos', highlight: true },
  { id: 'events', name: 'EVENTS', href: '/events' },
  { id: 'sports', name: 'SPORTS', href: '/sports' },
  { id: 'education', name: 'EDUCATION', href: '/education' },
];

export interface PopupStory {
  id: string;
  title: string;
  category: string;
  tag: string;
  readTime: string;
  imageUrl?: string;
  videoUrl?: string;
  excerpt?: string;
  href: string;
}

function getOutageTag(scheduledDateStr?: string, status?: string): string {
  if (status === 'active') return 'TNEB Maintenance TODAY';

  if (!scheduledDateStr) {
    return 'TNEB Shutdown TOMORROW';
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (scheduledDateStr === todayStr) {
    return 'TNEB Maintenance TODAY';
  }
  if (scheduledDateStr === tomorrowStr) {
    return 'TNEB Shutdown TOMORROW';
  }

  const targetDate = new Date(scheduledDateStr);
  if (!isNaN(targetDate.getTime())) {
    const formatted = targetDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    return `TNEB Shutdown ON ${formatted}`;
  }

  return 'TNEB Scheduled Outage';
}

function SubMenuDropdown({
  stories,
  categoryName,
  categoryHref,
  onClose,
}: {
  stories: PopupStory[];
  categoryName: string;
  categoryHref: string;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1));
  };

  const activeStory = stories[currentIndex] || stories[0];
  const hasMultiple = stories.length > 1;

  return (
    <div className="space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
      {/* Top Header Row inside Pop-up */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
            {categoryName} • {stories.length === 0 ? 'Live Updates' : stories.length === 1 ? 'Featured Story' : 'Featured Stories'}
          </span>
        </div>
        <Link
          href={categoryHref}
          prefetch={true}
          onClick={onClose}
          className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Post Card or Clean Empty State */}
      {stories.length === 0 ? (
        <div className="py-6 text-center text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No stories published under this category yet.</p>
          <p className="text-[11px] text-gray-400">Articles published via the Admin CMS will appear here automatically.</p>
        </div>
      ) : activeStory ? (
        <Link
          href={activeStory.href}
          prefetch={true}
          onClick={onClose}
          className="block group bg-gray-50 dark:bg-slate-800/80 hover:bg-red-50/50 dark:hover:bg-slate-800 rounded-xl p-2.5 border border-gray-100 dark:border-slate-700/60 transition-all"
        >
          <div className="flex gap-3 items-center">
            {activeStory.imageUrl ? (
              <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0 relative bg-slate-900 border border-gray-200 dark:border-slate-700">
                <img
                  src={activeStory.imageUrl}
                  alt={activeStory.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-xs">
                  {activeStory.tag}
                </span>
              </div>
            ) : null}

            <div className="flex-1 min-w-0 space-y-1.5 py-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  {activeStory.readTime}
                </span>
                {!activeStory.imageUrl && (
                  <span className="bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                    {activeStory.tag}
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {activeStory.title}
              </h4>
              {activeStory.excerpt && !activeStory.imageUrl && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium">
                  {activeStory.excerpt}
                </p>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-red-600 transition-colors pt-0.5">
                <span>Read full story</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      ) : null}

      {/* Carousel Controls only if multiple stories exist */}
      {hasMultiple && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {stories.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full cursor-pointer ${currentIndex === idx
                  ? 'w-6 h-1.5 bg-red-600'
                  : 'w-2 h-1.5 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
                  }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
            <span className="text-[10px] font-mono font-bold text-gray-400 ml-1.5">
              {currentIndex + 1} / {stories.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-gray-700 dark:text-gray-300 font-black text-xs flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous story"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-gray-700 dark:text-gray-300 font-black text-xs flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next story"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DynamicHeader() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [currentDateString, setCurrentDateString] = useState('Saturday, 29 Aug 2026');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [dbOutages, setDbOutages] = useState<OutageRecord[]>([]);
  const [topLeaderboardAd, setTopLeaderboardAd] = useState<AdSlotRecord | null>(INITIAL_ADS_DB[0] || null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [headerWeather, setHeaderWeather] = useState<{
    temp: number;
    aqi: number;
    aqiStatus: string;
  }>({
    temp: 28,
    aqi: 42,
    aqiStatus: 'Good',
  });
  const navRef = useRef<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterCategory = (catId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveCategory(catId);
  };

  const handleMouseLeaveCategory = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 200);
  };

  // Close popup when clicking outside the navbar
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // SSR Hydration & Initialization
  useEffect(() => {
    setMounted(true);

    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(now);
    setCurrentDateString(formatted);

    const storedLang = (localStorage.getItem('t_covai_site_lang') || 'en').toLowerCase();
    setSelectedLang(storedLang);

    // Initialize Google Translate non-blockingly during idle time
    const loadTranslate = () => {
      if (!document.getElementById('google-translate-script')) {
        window.googleTranslateElementInit = () => {
          if (window.google && window.google.translate) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'en,ta,ml,te,hi,kn',
                autoDisplay: false,
                layout: (window.google.translate.TranslateElement.InlineLayout || {}).SIMPLE,
              },
              'google_translate_element'
            );
          }
        };

        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(loadTranslate, { timeout: 2000 });
      } else {
        setTimeout(loadTranslate, 1000);
      }
    }

    let isMounted = true;
    const fetchHeaderData = async () => {
      try {
        const [articles, outages, ads] = await Promise.all([
          dbService.getArticles(),
          dbService.getPowerOutages(),
          dbService.getAds(),
        ]);
        if (isMounted) {
          if (articles && articles.length > 0) setDbArticles(articles);
          if (outages) setDbOutages(outages);
          if (ads && ads.length > 0) {
            const topAd = ads.find(
              (a) =>
                (a.slotId === 'TOP_HEADER_LEADERBOARD' ||
                  a.placementKey === 'TOP_HEADER_LEADERBOARD' ||
                  a.id === 'ad-slot-1') &&
                a.active !== false
            );
            if (topAd) setTopLeaderboardAd(topAd);
          }
        }
      } catch (e) {
        console.warn('Header data load warning:', e);
      }
    };

    fetchHeaderData();
    const unsubscribeHeader = dbService.subscribe(() => {
      fetchHeaderData();
    });

    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/widgets/weather');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.temp) {
            setHeaderWeather({
              temp: json.temp,
              aqi: json.aqi || 42,
              aqiStatus: json.aqiStatus || 'Good',
            });
          }
        }
      } catch (e) {
        console.error('Failed to load weather for header', e);
      }
    };

    fetchHeaderData();
    fetchWeather();

    const weatherInterval = setInterval(fetchWeather, 60000);

    const unsubscribeArticles = dbService.subscribe(() => {
      fetchHeaderData();
    });

    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
      unsubscribeArticles();
    };
  }, []);

  // Handle Dynamic Language Switcher
  const handleLanguageChange = (lang: string) => {
    const cleanLang = lang.toLowerCase();
    setSelectedLang(cleanLang);
    localStorage.setItem('t_covai_site_lang', cleanLang);

    const cookieDomain = window.location.hostname;
    document.cookie = `googtrans=/en/${cleanLang}; path=/;`;
    document.cookie = `googtrans=/en/${cleanLang}; path=/; domain=${cookieDomain};`;
    document.cookie = `googtrans=/auto/${cleanLang}; path=/;`;
    document.cookie = `googtrans=/auto/${cleanLang}; path=/; domain=${cookieDomain};`;

    window.dispatchEvent(
      new CustomEvent('languageChange', { detail: { lang: cleanLang } })
    );

    try {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo) {
        combo.value = cleanLang;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  // Functional Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Extract strictly live DB stories for a category (NO dummy mock data)
  const getCategoryStories = (catId: string): PopupStory[] => {
    const normId = catId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedDb = dbArticles.filter((art) => {
      const artCat = (art.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const artSub = (art.subCategory || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normId === 'events' || normId === 'event') {
        return (
          artCat.includes('event') ||
          artSub.includes('event') ||
          artCat === 'events' ||
          artSub === 'events'
        );
      }

      return (
        artCat === normId ||
        artSub === normId ||
        (normId === 'ourcity' && (artCat.includes('city') || artCat.includes('civic'))) ||
        (normId === 'ceosofcoimbatore' && (artCat.includes('ceo') || artSub.includes('ceo'))) ||
        (normId === 'infrastructure' && (artCat.includes('infra') || artSub.includes('infra'))) ||
        (normId === 'tech' && (artCat.includes('tech') || artSub.includes('tech') || artSub.includes('ev'))) ||
        (normId === 'business' && (artCat.includes('business') || artCat.includes('industry') || artSub.includes('business'))) ||
        (normId === 'sports' && (artCat.includes('sport') || artSub.includes('sport'))) ||
        (normId === 'education' && (artCat.includes('edu') || artSub.includes('edu'))) ||
        (normId === 'news' && (artCat.includes('news') || artCat.includes('trending') || artCat.includes('topstories')))
      );
    });

    return matchedDb.map((a) => {
      const rawImg = a.imageUrl || (a as any).image || (a.mediaType === 'image' ? (a as any).mediaUrl : undefined);
      const cleanImg = rawImg && typeof rawImg === 'string' && rawImg.trim() !== '' && rawImg.trim() !== 'null' && rawImg.trim() !== 'undefined'
        ? rawImg.trim()
        : undefined;

      return {
        id: a.id,
        title: a.title,
        category: a.category || catId.toUpperCase(),
        tag: a.subCategory || (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'LATEST'),
        readTime: a.readTime || (a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '3 min read'),
        imageUrl: cleanImg,
        videoUrl: a.videoUrl,
        excerpt: a.excerpt || a.content?.slice(0, 100),
        href: `/article/${a.id}`,
      };
    }).slice(0, 5);
  };

  const toggleCategoryMenu = (catId: string) => {
    setActiveCategory((prev) => (prev === catId ? null : catId));
  };

  // Filter active and scheduled TNEB outages from DB
  const activeOutages = dbOutages.filter((o) => o.status !== 'restored');

  const tickerAlerts = activeOutages.map((item) => {
    const tag = getOutageTag(item.scheduledDate || item.date, item.status);
    const areas = item.affectedStreets && item.affectedStreets.length > 0
      ? `${item.area.toUpperCase()}, ${item.affectedStreets.map((s) => s.toUpperCase()).join(', ')}`
      : item.area.toUpperCase();
    const time = item.timeWindow || item.time || '09:00 AM – 04:00 PM';
    const reason = item.reason || item.details || item.substation || 'Feeder Line Maintenance';

    return {
      id: item.id,
      tag,
      areas,
      time,
      reason,
    };
  });

  if (!mounted) return null;

  return (
    <header className="relative w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-50 font-sans overflow-visible">
      {/* Dynamic Google Translate CSS Injection & Container */}
      <style jsx global>{`
        .goog-te-banner-frame,
        .skiptranslate,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0px !important;
          position: static !important;
        }
        #google_translate_element {
          display: none !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <div id="google_translate_element" style={{ display: 'none' }} className="hidden" />

      {/* 1. TOP_HEADER_LEADERBOARD PROMINENT BANNER (ABSOLUTE TOP OF SITE) */}
      {topLeaderboardAd && topLeaderboardAd.active !== false && (
        <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2 px-2 md:px-4 lg:px-6">
          <div className="w-full max-w-[1400px] mx-auto min-h-[90px] md:min-h-[130px] max-h-[160px] flex items-center justify-between relative overflow-hidden rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-950 shadow-xs group">
            <a
              href={topLeaderboardAd.linkUrl || topLeaderboardAd.ctaUrl || 'https://todayscoimbatore.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full relative"
            >
              {/* Dynamic Banner Image */}
              <img
                src={topLeaderboardAd.imageUrl || topLeaderboardAd.bannerUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80'}
                alt={topLeaderboardAd.title || 'TIDEL Park Coimbatore'}
                className="w-full h-28 sm:h-32 md:h-36 max-h-[160px] object-cover group-hover:scale-105 transition-transform duration-500 block"
              />

              {/* High Contrast Gradient Overlay with Title, Description, and CTA */}
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/65 to-black/35 flex items-center justify-between p-3.5 sm:p-4 md:px-6 text-white">
                <div className="max-w-2xl space-y-0.5 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="bg-red-600 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase shadow-xs shrink-0">
                      {topLeaderboardAd.advertiser || 'SPONSORED'}
                    </span>
                    <span className="text-[10px] font-bold text-white/80 uppercase truncate hidden sm:inline">
                      Coimbatore Tech Corridor
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-lg font-black text-white leading-tight drop-shadow-sm truncate md:whitespace-normal line-clamp-1 md:line-clamp-2">
                    {topLeaderboardAd.title || 'TIDEL Park Coimbatore Phase-2 Office Suites Open for Booking'}
                  </h3>
                  <p className="text-[11px] md:text-xs text-stone-200 font-medium line-clamp-1 leading-normal hidden md:block">
                    {topLeaderboardAd.description || 'Grade-A tech park infrastructure along Avinashi Road with 100% power backup and direct metro access.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wide shadow-md transition-all whitespace-nowrap">
                    <span>{topLeaderboardAd.ctaText || 'Explore Floor Plans'}</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* 2. RED LIVE ALERT BANNER WITH DYNAMIC SHUTDOWN TICKER & HOVER-PAUSE */}
      <div className="w-full bg-red-600 text-white text-xs font-bold py-1.5 px-2 md:px-4 lg:px-6 flex items-center justify-between gap-3 select-none overflow-hidden relative">
        <div className="flex items-center gap-2 shrink-0 z-10 bg-red-600 pr-2">
          <span className="bg-white text-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase shrink-0 shadow-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            <span>LIVE ALERT</span>
          </span>
        </div>

        {/* Scrolling Ticker Track */}
        <div className="flex-1 overflow-hidden relative group">
          {tickerAlerts.length === 0 ? (
            <div className="text-white text-xs font-bold py-0.5 truncate">
              LIVE ALERT: No major TNEB power outages scheduled in Coimbatore today.
            </div>
          ) : (
            <div className="flex items-center whitespace-nowrap animate-ticker group-hover:[animation-play-state:paused] cursor-default text-xs">
              {tickerAlerts.concat(tickerAlerts).map((item, idx) => (
                <span key={`${item.id}-${idx}`} className="inline-flex items-center mx-4 gap-2 font-medium">
                  <span className="bg-red-800 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-red-400/40">
                    [{item.tag}]
                  </span>
                  <span className="font-black text-white uppercase tracking-wide underline decoration-amber-300 decoration-2 underline-offset-2">
                    {item.areas}
                  </span>
                  <span className="text-white/95 font-bold">
                    ({item.time})
                  </span>
                  <span className="text-white/80 text-[11px]">
                    • {item.reason}
                  </span>
                  <span className="text-red-300 ml-2">✦</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-3 text-xs font-bold shrink-0 z-10 bg-red-600 pl-2">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[11px]">HOVER TO PAUSE</span>
          <a
            href="tel:1912"
            className="inline-flex items-center gap-1 hover:text-red-100 transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>1912 Helpline</span>
          </a>
        </div>
      </div>

      {/* 3. BRANDING & CONTROLS ROW */}
      <div className="w-full min-h-[64px] h-[72px] sm:h-[80px] md:h-[96px] lg:h-[104px] px-3 sm:px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <Link href="/" aria-label="Today's Coimbatore Home" className="flex items-center shrink-0">
          <img 
            src="/logo.png" 
            alt="TODAY'S COIMBATORE" 
            className="h-10 sm:h-12 md:h-14 lg:h-16 xl:h-[68px] w-auto max-w-[190px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[360px] object-contain block dark:hidden" 
          />
          <img 
            src="/logo-dark.png" 
            alt="TODAY'S COIMBATORE" 
            className="h-10 sm:h-12 md:h-14 lg:h-16 xl:h-[68px] w-auto max-w-[190px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[360px] object-contain hidden dark:block" 
          />
        </Link>

        {/* RIGHT SLOT: CONTROLS (Desktop Full / Mobile Hamburger Only) */}
        <div className="flex items-center gap-1.5 md:gap-3.5 shrink-0 justify-end">
          {/* Location & Date (Desktop Only) */}
          <div className="text-xs text-gray-500 border-r border-gray-200 dark:border-slate-700 pr-3.5 hidden lg:block text-right shrink-0">
            <div className="flex items-center justify-end gap-1.5 font-bold text-gray-800 dark:text-gray-200 text-xs">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Coimbatore, Tamil Nadu</span>
            </div>
            <div className="text-[11px] font-medium text-gray-400 mt-0.5">{currentDateString}</div>
          </div>

          {/* Weather & AQI (Desktop Only) */}
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hidden md:flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              <span>{headerWeather.temp}°C</span>
            </span>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">AQI {headerWeather.aqi} ({headerWeather.aqiStatus})</span>
          </div>

          {/* Functional Search Input (Desktop Only) */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block shrink-0">
            <input
              type="text"
              placeholder="Search news, topics, areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 pl-8 w-44 lg:w-56 focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-800 dark:text-gray-200"
            />
            <button type="submit" className="absolute left-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer" aria-label="Submit Search">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Language Selection Dropdown (Desktop Only) */}
          <div className="notranslate shrink-0 hidden md:block" translate="no">
            <select
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="notranslate bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-black rounded-lg h-9 px-2 text-gray-800 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500 shrink-0"
              translate="no"
              aria-label="Select Site Language"
            >
              <option value="en" className="notranslate font-bold" translate="no">EN (English)</option>
              <option value="ta" className="notranslate font-bold" translate="no">TA (தமிழ்)</option>
              <option value="ml" className="notranslate font-bold" translate="no">ML (മലയാളം)</option>
              <option value="te" className="notranslate font-bold" translate="no">TE (తెలుగు)</option>
              <option value="hi" className="notranslate font-bold" translate="no">HI (हिन्दी)</option>
              <option value="kn" className="notranslate font-bold" translate="no">KN (ಕನ್ನಡ)</option>
            </select>
          </div>

          {/* Dark Mode Toggle (Desktop Only) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer transition-colors shrink-0 hidden md:flex items-center justify-center"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </button>

          {/* Mobile Hamburger Toggle Button (< md: only) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="h-10 w-10 md:hidden rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-600 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Mobile Navigation Drawer"
            aria-expanded={isMobileDrawerOpen}
          >
            {isMobileDrawerOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 4. PRIMARY NAVIGATION ROW - FULL WIDTH FLUSH (Desktop Only) */}
      <div className="hidden md:flex w-full px-2 md:px-4 lg:px-6 mx-auto py-2 items-center justify-between border-b border-gray-100 dark:border-slate-800 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide relative z-50 pointer-events-auto">
        <div className="flex items-center gap-6 sm:gap-7 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Link href="/" prefetch={true} className="text-red-600 hover:text-red-700 font-black shrink-0 cursor-pointer">
            HOME
          </Link>
          <a
            href="/directory"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-600 transition-colors shrink-0 cursor-pointer"
          >
            DIRECTORY
          </a>
          <Link
            href="/blood-donors"
            prefetch={true}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1.5 shrink-0 shadow-xs uppercase text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            <span>BLOOD DONORS</span>
            <span className="bg-white text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">24/7</span>
          </Link>
          <Link href="/about" prefetch={true} className="hover:text-red-600 transition-colors shrink-0 cursor-pointer">
            ABOUT US
          </Link>
        </div>

        <Link
          href="/epaper"
          prefetch={true}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-3.5 py-1 rounded flex items-center gap-1.5 shadow-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>E-PAPER</span>
        </Link>
      </div>

      {/* 5. SECONDARY CATEGORY NAVIGATION ROW (Desktop Only) */}
      <nav
        ref={navRef}
        className="hidden md:flex w-full px-2 md:px-4 lg:px-6 mx-auto py-2 flex-wrap lg:flex-nowrap items-center gap-3 sm:gap-5 md:gap-6 overflow-visible text-[12px] sm:text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide relative z-50 pointer-events-auto"
      >
        {EDITORIAL_CATEGORIES.map((cat, index) => {
          const isDropdownOpen = activeCategory === cat.id;
          const isLastItems = index >= EDITORIAL_CATEGORIES.length - 3;
          const isMiddleItems = index >= 3 && index < EDITORIAL_CATEGORIES.length - 3;
          const categoryStories = getCategoryStories(cat.id);

          return (
            <div
              key={cat.id}
              className="relative inline-flex items-center shrink-0"
              onMouseEnter={() => handleMouseEnterCategory(cat.id)}
              onMouseLeave={handleMouseLeaveCategory}
            >
              <div className="flex items-center">
                {/* Category Direct Page Link */}
                <Link
                  href={cat.href}
                  prefetch={true}
                  className={`flex items-center gap-1 transition-colors py-1 cursor-pointer ${cat.highlight
                    ? 'text-gray-900 dark:text-white hover:text-red-600'
                    : 'hover:text-red-600'
                    }`}
                >
                  <span>{cat.name}</span>
                  {cat.highlight && (
                    <span className="bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 text-[9px] px-1.5 py-0.5 rounded font-black border border-pink-200 dark:border-pink-800 inline-flex items-center gap-0.5 pointer-events-none">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>SPOTLIGHT</span>
                    </span>
                  )}
                </Link>

                {/* Sub-menu Dropdown Trigger Arrow Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCategoryMenu(cat.id);
                  }}
                  aria-label={`Toggle ${cat.name} preview popup`}
                  aria-expanded={isDropdownOpen}
                  className="ml-0.5 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 focus:outline-none transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transform transition-transform duration-200 pointer-events-none ${isDropdownOpen ? 'rotate-180 text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                  />
                </button>
              </div>

              {/* Floating Slide-Down Popup Modal */}
              {isDropdownOpen && (
                <div
                  className={`absolute top-full left-0 mt-2 z-[9999] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 w-[480px] max-w-[95vw] pointer-events-auto block text-left normal-case select-none animate-in fade-in zoom-in-95 duration-150 ${isLastItems
                    ? 'right-0 left-auto'
                    : isMiddleItems
                      ? '-left-16 sm:-left-8'
                      : 'left-0'
                    }`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  }}
                  onMouseLeave={handleMouseLeaveCategory}
                >
                  <SubMenuDropdown
                    stories={categoryStories}
                    categoryName={cat.name}
                    categoryHref={cat.href}
                    onClose={() => setActiveCategory(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 6. SLIDE-OUT MOBILE NAVIGATION DRAWER */}
      {isMobileDrawerOpen && (
        <>
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="fixed top-0 right-0 h-full w-[310px] max-w-[85vw] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl z-[9999] p-5 flex flex-col justify-between overflow-y-auto md:hidden animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <Link
                  href="/"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="block"
                >
                  <img
                    src="/logo.png"
                    alt="TODAY'S COIMBATORE"
                    className="h-10 w-auto max-w-[200px] object-contain block dark:hidden"
                  />
                  <img
                    src="/logo-dark.png"
                    alt="TODAY'S COIMBATORE"
                    className="h-10 w-auto max-w-[200px] object-contain hidden dark:block"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search Input */}
              <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileDrawerOpen(false); }} className="relative">
                <input
                  type="text"
                  placeholder="Search news, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-medium rounded-xl px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-800 dark:text-gray-200"
                />
                <button type="submit" className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" aria-label="Submit Search">
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Mobile Drawer Language & Theme Settings Bar */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 notranslate" translate="no">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Lang:</span>
                  <select
                    value={selectedLang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="notranslate bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-black rounded-lg h-8 px-2 text-gray-800 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500"
                    translate="no"
                    aria-label="Select Site Language"
                  >
                    <option value="en" className="notranslate font-bold" translate="no">EN (English)</option>
                    <option value="ta" className="notranslate font-bold" translate="no">TA (தமிழ்)</option>
                    <option value="ml" className="notranslate font-bold" translate="no">ML (മലയാളം)</option>
                    <option value="te" className="notranslate font-bold" translate="no">TE (తెలుగు)</option>
                    <option value="hi" className="notranslate font-bold" translate="no">HI (हिन्दी)</option>
                    <option value="kn" className="notranslate font-bold" translate="no">KN (ಕನ್ನಡ)</option>
                  </select>
                </div>

                {/* Theme Switcher Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-700" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons: Directory & Blood Donors */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="/directory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-900 dark:text-gray-100 font-black text-xs uppercase tracking-wider border border-stone-300 dark:border-slate-700 transition-all text-center cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Directory</span>
                </a>

                <Link
                  href="/blood-donors"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all text-center"
                >
                  <span>Blood 24/7</span>
                </Link>
              </div>

              {/* Primary Links */}
              <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block px-2 pt-1">
                  Main Navigation
                </span>
                <Link
                  href="/"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-600 transition-colors"
                >
                  <span>Home</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
                <Link
                  href="/epaper"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-600 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-red-600" />
                    <span>E-Paper</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-600 transition-colors"
                >
                  <span>About Us</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              </div>

              {/* News Categories Section */}
              <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block px-2 pt-1">
                  News Categories
                </span>
                <div className="grid grid-cols-1 gap-0.5">
                  {EDITORIAL_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={cat.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-600 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        {cat.highlight && (
                          <span className="bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 text-[9px] px-1 py-0.2 rounded font-black border border-pink-200 dark:border-pink-800">
                            ★
                          </span>
                        )}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Widget & Info */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/80 p-2.5 rounded-xl text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Sun className="w-3.5 h-3.5" />
                  <span>{headerWeather.temp}°C Coimbatore</span>
                </span>
                <span className="text-emerald-600 font-bold">
                  AQI {headerWeather.aqi}
                </span>
              </div>

              <a
                href="tel:1912"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px]"
              >
                <Phone className="w-3 h-3" />
                <span>TNEB 1912 Outage Helpline</span>
              </a>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

export { DynamicHeader };
