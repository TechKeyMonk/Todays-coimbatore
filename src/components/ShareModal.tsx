'use client';

import React, { useState, useEffect } from 'react';
import dbService, { Article } from '../services/db';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  author?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title: initialTitle,
  url: initialUrl,
  author: initialAuthor,
}) => {
  const [activeTitle, setActiveTitle] = useState(initialTitle);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [activeAuthor, setActiveAuthor] = useState(initialAuthor || 'Covai Bureau');
  const [copied, setCopied] = useState(false);
  const [otherArticles, setOtherArticles] = useState<Article[]>([]);

  // Keep state in sync with props whenever modal opens or props change
  useEffect(() => {
    setActiveTitle(initialTitle);
    setActiveUrl(initialUrl);
    setActiveAuthor(initialAuthor || 'Covai Bureau');
  }, [initialTitle, initialUrl, initialAuthor, isOpen]);

  // Load other articles dynamically for the "OTHER ARTICLES TO SHARE" section
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchOthers = async () => {
      try {
        const all = await dbService.getArticles();
        if (isMounted && all) {
          // Filter out current article and pick up to 3 other stories
          const filtered = all.filter(
            (a) => a.title.trim().toLowerCase() !== activeTitle.trim().toLowerCase()
          );
          setOtherArticles(filtered.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching other articles for share modal', err);
      }
    };

    fetchOthers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTitle]);

  if (!isOpen) return null;

  const encUrl = encodeURIComponent(activeUrl);
  const encTitle = encodeURIComponent(activeTitle);

  // Direct Social Media Web Intent Trigger
  const handleSocialClick = (platform: string) => {
    let targetIntent = '';

    switch (platform) {
      case 'whatsapp':
        targetIntent = `https://api.whatsapp.com/send?text=${encodeURIComponent(activeTitle + ' ' + activeUrl)}`;
        break;
      case 'twitter':
        targetIntent = `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`;
        break;
      case 'facebook':
        targetIntent = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
        break;
      case 'telegram':
        targetIntent = `https://t.me/share/url?url=${encUrl}&text=${encTitle}`;
        break;
      case 'instagram':
        // Instagram direct web share / profile flow
        targetIntent = `https://www.instagram.com/`;
        // Copy link to clipboard for convenience when opening Instagram
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(activeUrl).catch(() => {});
        }
        break;
      case 'mail':
        targetIntent = `mailto:?subject=${encTitle}&body=${encodeURIComponent(activeUrl || (typeof window !== 'undefined' ? window.location.href : ''))}`;
        break;
    }

    if (targetIntent) {
      window.open(targetIntent, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(activeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  // Connected Share icon handler for bottom other preview cards
  const handleOtherCardShareClick = async (article: Article) => {
    const storyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/article/${article.id}`
      : `https://todayscoimbatore.com/article/${article.id}`;

    // 1. Check if navigator.share is supported (Mobile / Modern Browsers)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: article.title,
          url: storyUrl,
        });
        return;
      } catch (err) {
        // User dismissed native share sheet; fallback to modal update
      }
    }

    // 2. Desktop Fallback: Instantly switch main Share Modal loaded with that specific article's title & URL
    setActiveTitle(article.title);
    setActiveUrl(storyUrl);
    setActiveAuthor(article.author || 'Covai Bureau');
    setCopied(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-gray-100 uppercase tracking-wide">
                SHARE THIS STORY
              </h3>
              <p className="text-[10px] sm:text-xs text-stone-500 dark:text-gray-400">
                Direct social media sharing &amp; mail intents
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Share Modal"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-stone-300 font-bold text-xs cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Title Box ("NOW SHARING: [Article Title / Author]") */}
        <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 block">
            NOW SHARING:
          </span>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {activeTitle}
          </p>
          <p className="text-[11px] font-semibold text-stone-500 dark:text-gray-400">
            By {activeAuthor}
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP SOCIAL MEDIA BRAND ICONS GRID                               */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-gray-400 block mb-2">
            Instant Social Share &amp; Mail
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleSocialClick('whatsapp')}
              title="Share via WhatsApp"
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all active:scale-95 shadow-xs font-bold text-[10px] sm:text-[11px] gap-1.5 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.54 1.761.815 2.796.815 3.183 0 5.768-2.586 5.769-5.766.001-3.182-2.585-5.769-5.769-5.769zm10.156 5.766c-.002 5.619-4.575 10.191-10.193 10.191-1.782 0-3.487-.464-4.992-1.309l-5.633 1.477 1.503-5.485c-.93-1.574-1.424-3.376-1.425-5.234.002-5.619 4.575-10.191 10.194-10.191 5.619.001 10.191 4.573 10.191 10.191z" />
              </svg>
              <span className="truncate max-w-full font-bold">WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={() => handleSocialClick('twitter')}
              title="Share on X / Twitter"
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-black hover:bg-zinc-800 text-white transition-all active:scale-95 shadow-xs font-bold text-[10px] sm:text-[11px] gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current my-0.5" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="truncate max-w-full font-bold">X (Twitter)</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleSocialClick('facebook')}
              title="Share on Facebook"
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all active:scale-95 shadow-xs font-bold text-[10px] sm:text-[11px] gap-1.5 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.82 0-1.604.227-2.025.688-.415.454-.537 1.171-.537 2.378v.923h4.482l-.634 3.667h-3.848v7.98z" />
              </svg>
              <span className="truncate max-w-full font-bold">Facebook</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => handleSocialClick('telegram')}
              title="Share on Telegram"
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-[#229ED9] hover:bg-[#1e8dbf] text-white transition-all active:scale-95 shadow-xs font-bold text-[10px] sm:text-[11px] gap-1.5 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <span className="truncate max-w-full font-bold">Telegram</span>
            </button>

            {/* Instagram (Official Gradient Logo) */}
            <button
              type="button"
              onClick={() => handleSocialClick('instagram')}
              title="Share on Instagram"
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white transition-all active:scale-95 shadow-xs font-bold text-[10px] sm:text-[11px] gap-1.5 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="truncate max-w-full font-bold">Instagram</span>
            </button>

            {/* Send via Mail (Official Open Envelope/Mail Icon) */}
            <button
              type="button"
              onClick={() => handleSocialClick('mail')}
              title="Send via Mail"
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 shadow-xs font-black text-[10px] sm:text-[11px] gap-1.5 cursor-pointer border border-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate max-w-full uppercase font-black text-[9px] sm:text-[10px]">Send Mail</span>
            </button>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="pt-2 border-t border-stone-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={activeUrl}
            className="flex-1 bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-stone-700 dark:text-stone-300 font-mono truncate focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#153d3b] hover:bg-[#0d4d4d] text-white shadow-xs'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. BOTTOM SECTION: 'OTHER ARTICLES TO SHARE' WITH CONNECTED SHARE  */}
        {/* ------------------------------------------------------------------ */}
        {otherArticles.length > 0 && (
          <div className="pt-3 border-t border-stone-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#111111] dark:text-gray-200 flex items-center gap-1.5">
                <span className="text-red-600">★</span>
                <span>OTHER ARTICLES TO SHARE</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                Click Share icon
              </span>
            </div>

            <div className="space-y-2">
              {otherArticles.map((item) => (
                <div
                  key={item.id}
                  className="relative group p-2.5 rounded-xl bg-[#fcfbf7] dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700/80 hover:border-stone-400 dark:hover:border-slate-600 transition-all flex items-start gap-3"
                >
                  {/* Thumbnail (ONLY if genuine image exists) */}
                  {item.imageUrl ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-stone-900">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Info */}
                  <div className="min-w-0 flex-1 pr-9">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-600 dark:text-red-400 mb-0.5">
                      <span>{item.category || 'News'}</span>
                      <span className="text-stone-400 font-normal">•</span>
                      <span className="text-stone-500 dark:text-gray-400 font-mono font-normal">
                        {item.publishedAt || 'Recently'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-gray-100 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  {/* BOTTOM-RIGHT CORNER MODERN CONNECTED-NODES SHARE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOtherCardShareClick(item)}
                    title="Share this story"
                    aria-label={`Share ${item.title}`}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-transform active:scale-90 flex items-center justify-center cursor-pointer min-h-[28px] min-w-[28px]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ShareModal;
