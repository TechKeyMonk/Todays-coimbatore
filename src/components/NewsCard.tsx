'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { saveCurrentScrollPosition } from './ScrollRestoration';
import ShareModal from './ShareModal';
import { Play, Video, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../services/db';
import { hasActualVideo } from '@/lib/videoUtils';

export interface NewsCardProps {
  id: string;
  title: string;
  category: string;
  categoryBadgeClass?: string;
  isExclusive?: boolean;
  highlightStat?: string;
  timeAgo?: string;
  author?: string;
  readTime?: string;
  excerpt?: string;
  mediaType?: 'image' | 'video' | 'text' | string;
  imageUrl?: string;
  mediaUrl?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  articleHref?: string;
  onOpenVideo?: (videoData: any) => void;
  className?: string;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  id,
  title,
  category,
  categoryBadgeClass,
  isExclusive = false,
  highlightStat,
  timeAgo = 'Recently',
  author,
  excerpt = '',
  mediaType,
  imageUrl,
  mediaUrl,
  videoUrl,
  videoTitle,
  videoDuration = '02:00',
  articleHref,
  onOpenVideo,
  className = '',
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Dynamic Category Badge from Admin Input
  const normCategory = (category || 'NEWS').toUpperCase();
  const isSpotlightExclusive = Boolean(isExclusive || highlightStat === 'Spotlight Exclusive');

  // Dynamic Listen Duration: ~130 words per minute
  const totalWords = (excerpt + ' ' + title).trim().split(/\s+/).filter(Boolean).length;
  const listenMinutes = Math.max(1, Math.ceil(totalWords / 130));

  // Determine Category Badge Color
  const getBadgeColor = () => {
    if (categoryBadgeClass) return categoryBadgeClass;
    const c = normCategory;
    if (c.includes('INFRA') || c.includes('CIVIC')) return 'bg-blue-600 text-white';
    if (c === 'TECH') return 'bg-emerald-600 text-white';
    if (c === 'BUSINESS' || c.includes('INDUSTRY') || c.includes('COMMERCE')) return 'bg-amber-600 text-white';
    if (c === 'EVENTS') return 'bg-purple-600 text-white';
    if (c === 'SPORTS') return 'bg-indigo-600 text-white';
    if (c.includes('CEO')) return 'bg-slate-800 text-white';
    if (c === 'EDUCATION') return 'bg-teal-600 text-white';
    return 'bg-red-600 text-white';
  };

  const targetHref = articleHref || `/article/${id}`;

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      saveCurrentScrollPosition();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  // Strict Video Detection: ONLY if the article actually has a genuine playable video
  const hasValidVideo = hasActualVideo({
    mediaType,
    videoUrl,
    mediaUrl,
  });

  // Strict Image Detection: ONLY if explicitly provided and non-empty/non-null
  const validImageUrl = (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '' && imageUrl.trim() !== 'null' && imageUrl.trim() !== 'undefined')
    ? imageUrl.trim()
    : '';

  const hasImage = Boolean(
    validImageUrl &&
    (validImageUrl.startsWith('http') || validImageUrl.startsWith('data:') || validImageUrl.startsWith('/'))
  );

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenVideo) {
      onOpenVideo({
        title: videoTitle || title,
        category: normCategory,
        duration: videoDuration,
        quality: '1080p HD',
        location: 'Coimbatore District',
        caption: excerpt,
        videoUrl: videoUrl,
      });
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareOpen(true);
  };

  const currentFullUrl = typeof window !== 'undefined' ? `${window.location.origin}${targetHref}` : `https://todayscoimbatore.com${targetHref}`;

  const optimizedImgSrc = validImageUrl.includes('images.unsplash.com')
    ? `${validImageUrl.split('?')[0]}?auto=format&fit=crop&w=600&q=75`
    : validImageUrl;

  return (
    <>
      <div
        className={`flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 h-full min-w-0 ${
          isSpotlightExclusive
            ? 'ring-2 ring-red-600/20 border-red-500'
            : ''
        } ${className}`}
      >
        {/* Conditional Image Rendering - ONLY show if real image exists */}
        {hasImage && validImageUrl ? (
          <div className="relative mb-3 aspect-[16/9] w-full overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-950 shrink-0">
            <Link href={targetHref} onClick={scrollToTop} className="block w-full h-full">
              <img
                src={optimizedImgSrc}
                alt={title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            {isSpotlightExclusive ? (
              <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                BREAKING SPOTLIGHT
              </span>
            ) : normCategory ? (
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                {normCategory}
              </span>
            ) : null}

            {/* Video Play Trigger Pill */}
            {hasValidVideo && onOpenVideo && (
              <button
                type="button"
                onClick={handleVideoClick}
                className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-red-600 text-white text-[11px] font-bold backdrop-blur-xs transition-colors cursor-pointer shadow-md"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Watch Video</span>
              </button>
            )}
          </div>
        ) : (
          /* Clean Category Badge Header when Image is Missing */
          normCategory && (
            <div className="mb-2">
              <span
                className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                  isSpotlightExclusive
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isSpotlightExclusive ? '★ BREAKING SPOTLIGHT' : normCategory}
              </span>
            </div>
          )
        )}

        {/* Article Text Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
              <span>{author || 'Editorial Bureau'}</span>
              <time>{formatRelativeTime(timeAgo)}</time>
            </div>

            <Link href={targetHref} onClick={scrollToTop} className="block group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              <h3 className="line-clamp-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug min-w-0">
                {title}
              </h3>
            </Link>

            {excerpt && (
              <p className="mt-1.5 line-clamp-3 text-xs text-gray-500 dark:text-gray-400 leading-normal min-w-0">
                {excerpt}
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <Link
              href={targetHref}
              onClick={scrollToTop}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>Read Full</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              {hasValidVideo && onOpenVideo && (
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className="text-[11px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <Video className="w-3 h-3 text-red-500" />
                  <span>Watch Video</span>
                </button>
              )}

              {/* Share Trigger Button */}
              <button
                type="button"
                onClick={handleShareClick}
                aria-label="Share story"
                className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={title}
        url={currentFullUrl}
      />
    </>
  );
};

export default NewsCard;
