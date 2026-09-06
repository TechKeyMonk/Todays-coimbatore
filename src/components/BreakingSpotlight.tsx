'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { formatRelativeTime } from '@/services/db';

export interface SpotlightArticle {
  id: string;
  title: string;
  slug?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  category?: string;
  subCategory?: string;
  videoUrl?: string;
  mediaType?: string;
  excerpt?: string;
}

interface BreakingSpotlightProps {
  articles?: SpotlightArticle[];
  onOpenVideo?: (videoData: any) => void;
}

export default function BreakingSpotlight({ articles = [], onOpenVideo }: BreakingSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = articles.length;

  const nextSlide = useCallback(() => {
    if (total > 1) {
      setCurrentIndex((prev) => (prev + 1) % total);
    }
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total > 1) {
      setCurrentIndex((prev) => (prev - 1 + total) % total);
    }
  }, [total]);

  // Keep currentIndex in bounds if articles array length changes dynamically
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  // 3-Second Automatic Slider Loop with Cleanup and Memory Leak Protection
  useEffect(() => {
    if (total <= 1 || isHovered) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 3000); // 3 seconds interval

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [total, isHovered, nextSlide]);

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div className="relative my-2 w-full min-w-0 max-w-full overflow-hidden">
      
      {/* Section Header (Exact Match to Reference Screenshot) */}
      <div className="flex items-center justify-between pb-2 mb-1 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-red-600 font-black text-sm sm:text-base">★</span>
          <h2 className="text-stone-900 dark:text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider">
            BREAKING SPOTLIGHT
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">
            Multi-Media Edition
          </span>
          {total > 1 && (
            <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
              {currentIndex + 1} / {total}
            </span>
          )}
        </div>
      </div>

      {/* Main Spotlight Container */}
      <div 
        className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/8] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-black shadow-sm group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slide Transition Wrapper */}
        {articles.map((article, index) => {
          const isActive = index === currentIndex;
          const articleHref = article.slug ? `/news/${article.slug}` : `/article/${article.id}`;
          const rawImageUrl = (article.imageUrl || '').trim();
          const hasImage = Boolean(rawImageUrl && rawImageUrl !== 'null' && rawImageUrl !== 'undefined');
          const hasVideo = Boolean(
            article.videoUrl &&
            article.videoUrl.trim() !== '' &&
            (article.mediaType === 'video' || article.videoUrl.startsWith('http') || article.videoUrl.includes('youtube'))
          );

          return (
            <div
              key={article.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {hasImage ? (
                <Image
                  src={rawImageUrl}
                  alt={article.title || 'Breaking Spotlight'}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 80vw, 1200px"
                  className="object-cover object-center transform transition-transform duration-1000 group-hover:scale-105"
                  unoptimized={!rawImageUrl.includes('unsplash.com') && !rawImageUrl.includes('supabase.co')}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
              )}

              {/* TOP LEFT BADGES (Floating in top-left as in reference screenshot) */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                  {article.category || 'COVAI SPOTLIGHTS'}
                </span>
                {article.subCategory && article.subCategory !== article.category ? (
                  <span className="bg-[#8b2323] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                    {article.subCategory}
                  </span>
                ) : (
                  <span className="bg-[#8b2323] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                    CEO
                  </span>
                )}
                {article.tags?.map((tag, idx) => (
                  <span key={idx} className="bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-md uppercase">
                    {tag}
                  </span>
                ))}
                {hasVideo && onOpenVideo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenVideo({
                        title: article.title,
                        category: article.category || 'COVAI SPOTLIGHTS',
                        duration: '03:00',
                        quality: '1080p HD',
                        location: 'Coimbatore District',
                        caption: article.excerpt || article.title,
                        videoUrl: article.videoUrl,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 hover:bg-red-600 text-white text-[10px] sm:text-xs font-bold backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Video</span>
                  </button>
                )}
              </div>

              {/* Gradient Overlay for Readable Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

              {/* Bottom Content Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 flex flex-col justify-end min-w-0 z-10">
                {/* Article Title */}
                <Link className="block group/title min-w-0" href={articleHref}>
                  <h2 className="text-white text-base sm:text-2xl lg:text-3xl font-black leading-tight sm:leading-snug line-clamp-2 drop-shadow-md transition-colors group-hover/title:text-red-400">
                    {article.title}
                  </h2>
                </Link>

                {/* Author & Timestamp */}
                <div className="mt-2 flex items-center gap-2 text-gray-300 text-[11px] sm:text-xs font-medium">
                  <span>BY {article.author?.toUpperCase() || 'EDITORIAL BUREAU'}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(article.publishedAt || article.updatedAt || article.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Arrow Navigation Controls (Only if > 1 Spotlight Article) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/50 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 cursor-pointer shadow-lg active:scale-95"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/50 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 cursor-pointer shadow-lg active:scale-95"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Pagination Dots Indicator */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
              {articles.map((_, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'w-5 bg-red-600' : 'w-2 bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
