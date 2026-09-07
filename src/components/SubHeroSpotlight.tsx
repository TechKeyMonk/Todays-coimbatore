'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/services/db';
import { hasActualVideo } from '@/lib/videoUtils';

export interface SubHeroSpotlightArticle {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  author?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  imageUrl?: string | null;
  image?: string | null;
  image_url?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | string;
  videoUrl?: string;
  videoDuration?: string;
  highlightStat?: string;
  isExclusive?: boolean;
  trendingTitle?: string;
  trendingHref?: string;
  trendingTime?: string;
}

export interface SubHeroSpotlightProps {
  article: SubHeroSpotlightArticle;
  onOpenVideo?: (videoData: any) => void;
  className?: string;
}

export const SubHeroSpotlight: React.FC<SubHeroSpotlightProps> = ({
  article,
  onOpenVideo,
  className = '',
}) => {
  if (!article) return null;

  // Resolve valid image URL strictly without fallback placeholders
  const rawImage =
    article.imageUrl ||
    article.image ||
    article.image_url ||
    (article.mediaType !== 'video' ? article.mediaUrl : null);

  const cleanImageUrl =
    typeof rawImage === 'string' &&
    rawImage.trim() !== '' &&
    rawImage.trim() !== 'null' &&
    rawImage.trim() !== 'undefined'
      ? rawImage.trim()
      : null;

  const targetHref = article.slug
    ? `/article/${article.slug}`
    : `/article/${article.id}`;

  const hasVideo = hasActualVideo(article);

  const timeDisplay = formatRelativeTime(
    article.updatedAt || article.createdAt || article.publishedAt
  );

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition-shadow hover:shadow-md h-full min-w-0 group ${className}`}
    >
      <div>
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping inline-block" />
            Sub Hero Spotlight
          </span>
          {article.category && (
            <span className="rounded bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-200/60 dark:border-red-900">
              {article.isExclusive ? '★ SPOTLIGHT' : article.category}
            </span>
          )}
        </div>

        {/* CONDITIONAL IMAGE BLOCK: ONLY render if image URL actually exists in DB */}
        {cleanImageUrl && cleanImageUrl.trim() !== '' ? (
          <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-900">
            <Link href={targetHref} className="block w-full h-full">
              <Image
                src={cleanImageUrl}
                alt={article.title || 'Sub Hero Spotlight'}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={cleanImageUrl.startsWith('data:') || !cleanImageUrl.startsWith('http')}
              />
            </Link>
            {article.subCategory && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                {article.subCategory}
              </span>
            )}
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              {article.highlightStat || 'Verified Kovai News'}
            </span>
          </div>
        ) : null}

        {/* Text Content Block */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
              <span className="font-medium">By {article.author || 'Editorial Bureau'}</span>
              <span>{timeDisplay || 'Recently'}</span>
            </div>

            <Link href={targetHref} className="block">
              <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug min-w-0 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {article.title}
              </h3>
            </Link>

            {(article.excerpt || article.description || article.content) && (
              <p className="mt-2 line-clamp-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed min-w-0">
                {article.excerpt || article.description || article.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Also Trending & Action Link */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
        {article.trendingTitle && (
          <div className="text-xs text-gray-500 flex items-center justify-between gap-1 truncate min-w-0">
            <Link
              href={article.trendingHref || '#'}
              className="flex items-center gap-1 truncate hover:text-red-600 transition-colors flex-1 min-w-0"
            >
              <span className="text-red-600 font-bold shrink-0">• Also Trending:</span>
              <span className="truncate">{article.trendingTitle}</span>
            </Link>
            {article.trendingTime && (
              <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                {article.trendingTime}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <Link
            href={targetHref}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 self-start min-h-[36px] items-center"
          >
            <span>Read Full Story →</span>
          </Link>

          {hasVideo && onOpenVideo && (
            <button
              type="button"
              onClick={() =>
                onOpenVideo({
                  title: article.title,
                  category: article.category,
                  duration: article.videoDuration || '02:30',
                  quality: '1080p HD',
                  location: 'Coimbatore, Tamil Nadu',
                  caption: article.excerpt || article.title,
                  videoUrl: article.videoUrl || (article.mediaType === 'video' ? ((article.mediaUrl as string) || undefined) : undefined),
                })
              }
              className="min-h-[36px] inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#f3ede2] dark:bg-slate-800 text-[#111111] dark:text-gray-200 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white text-xs font-black transition-colors touch-manipulation cursor-pointer"
            >
              🎥 Watch Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubHeroSpotlight;
