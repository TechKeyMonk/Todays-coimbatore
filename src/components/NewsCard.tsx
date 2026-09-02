'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { saveCurrentScrollPosition } from './ScrollRestoration';
import ShareModal from './ShareModal';
import { Play, Video, Headphones, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../services/db';

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
    if (c === 'OUR CITY' || c.includes('CITY') || c.includes('CIVIC') || c.includes('INFRA')) return 'bg-blue-600 text-white';
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

  // Strict Video Detection: ONLY if mediaType is video and has a valid videoUrl
  const hasValidVideo = Boolean(
    mediaType === 'video' &&
    videoUrl &&
    typeof videoUrl === 'string' &&
    videoUrl.trim() !== '' &&
    (videoUrl.startsWith('http') || videoUrl.startsWith('local-video://') || videoUrl.includes('youtube') || videoUrl.includes('youtu.be'))
  );

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
      <article
        className={`group rounded-2xl bg-white dark:bg-slate-900 ${
          isSpotlightExclusive
            ? 'border-2 border-red-600 shadow-md ring-2 ring-red-600/20'
            : 'border border-stone-200 dark:border-slate-800 shadow-xs'
        } overflow-hidden hover:shadow-lg hover:border-red-500 transition-all duration-300 flex flex-col justify-between h-full w-full min-w-full max-w-full box-border ${className}`}
      >
        {/* ------------------------------------------------------------------ */}
        {/* 1. IMAGE CONTAINER (STRICTLY OPTIONAL - ONLY IF EXPLICIT IMAGE)    */}
        {/* ------------------------------------------------------------------ */}
        {hasImage && validImageUrl ? (
          <div className="relative h-[180px] sm:h-[200px] w-full min-w-full overflow-hidden bg-slate-950 shrink-0">
            <Link href={targetHref} onClick={scrollToTop} className="block w-full h-full">
              <img
                src={optimizedImgSrc}
                alt={title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Small Dynamic Category / Spotlight Badge (Floating top-3 left-3) */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 flex-wrap">
              {isSpotlightExclusive ? (
                <span className="font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-md bg-red-600 text-white flex items-center gap-1 border border-red-400">
                  <span>★</span>
                  <span>BREAKING SPOTLIGHT</span>
                </span>
              ) : (
                <span
                  className={`font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm ${getBadgeColor()}`}
                >
                  {normCategory}
                </span>
              )}
            </div>

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
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* 2. CONTENT CONTAINER (BOTTOM: Solid Background, p-3.5 sm:p-4, High Contrast) */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 w-full min-w-full flex flex-col justify-between flex-1 box-border break-words whitespace-normal">
          
          <div>
            {/* If no top image, show category badge inline with metadata */}
            {!hasImage && (
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                {isSpotlightExclusive ? (
                  <span className="font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs bg-red-600 text-white flex items-center gap-1 border border-red-400">
                    <span>★</span>
                    <span>BREAKING SPOTLIGHT</span>
                  </span>
                ) : (
                  <span
                    className={`font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs ${getBadgeColor()}`}
                  >
                    {normCategory}
                  </span>
                )}
              </div>
            )}

            {/* Metadata Row: Relative Time & Author */}
            <div className="flex items-center justify-between text-[11px] text-stone-700 dark:text-stone-300 font-bold uppercase tracking-wider mb-2">
              <span>{author || 'Covai Bureau'}</span>
              <span>{formatRelativeTime(timeAgo)}</span>
            </div>

            {/* Headline Title */}
            <Link href={targetHref} onClick={scrollToTop} className="block group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              <h3 className="font-bold text-base md:text-lg text-slate-950 dark:text-gray-100 line-clamp-2 break-words whitespace-normal leading-snug">
                {title}
              </h3>
            </Link>

            {/* Description */}
            {excerpt && (
              <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 line-clamp-3 break-words whitespace-normal mt-2 leading-relaxed font-medium">
                {excerpt}
              </p>
            )}
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* 3. FOOTER BAR: Read Article + Media Action + Modern Share Button   */}
          {/* ------------------------------------------------------------------ */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-stone-200 dark:border-slate-800">
            <Link
              href={targetHref}
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-xs md:text-sm font-black text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors min-h-[36px] touch-manipulation"
            >
              <span>Read Article</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Media Action: Watch Video OR Listen badge */}
              {hasValidVideo && onOpenVideo ? (
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 hover:bg-red-600 text-stone-900 hover:text-white dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-red-600 dark:hover:text-white text-[11px] font-extrabold border border-stone-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 min-h-[32px] touch-manipulation"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Watch</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <Headphones className="w-3 h-3 text-emerald-600" />
                  <span>{listenMinutes}m</span>
                </span>
              )}

              {/* Share Trigger Button */}
              <button
                type="button"
                onClick={handleShareClick}
                aria-label="Share article"
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-gray-300 transition-colors cursor-pointer shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>

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
