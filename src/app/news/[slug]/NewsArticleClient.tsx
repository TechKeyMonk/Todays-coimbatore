'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import AudioReader from '@/components/AudioReader';
import AiSummary from '@/components/AiSummary';
import VideoPlayer from '@/components/VideoPlayer';
import NewsCard from '@/components/NewsCard';
import NativeAdBanner from '@/components/ads/NativeAdBanner';
import MobileBottomBanner from '@/components/MobileBottomBanner';
import ShareModal from '@/components/ShareModal';
import UniversalSideLayout from '@/components/UniversalSideLayout';
import dbService, { Article, AdSlotRecord, INITIAL_ADS_DB } from '@/services/db';

interface NewsArticleClientProps {
  slug: string;
}

export default function NewsArticleClient({ slug }: NewsArticleClientProps) {
  const rawSlug = decodeURIComponent(slug || '').trim();

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [adSlots, setAdSlots] = useState<AdSlotRecord[]>(INITIAL_ADS_DB);

  // Scroll reset
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [rawSlug]);

  // Real-time Ad Synchronization
  useEffect(() => {
    let isMounted = true;
    const syncAds = async () => {
      try {
        if (typeof window !== 'undefined') {
          const rawAds =
            localStorage.getItem('t_covai_ads') ||
            localStorage.getItem('adSlots') ||
            localStorage.getItem('covai_db_ads');
          if (rawAds) {
            try {
              const parsed = JSON.parse(rawAds);
              if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
                setAdSlots(parsed);
              }
            } catch (e) {}
          }
        }
        const liveAds = await dbService.getAdSlots();
        if (isMounted && liveAds && liveAds.length > 0) {
          setAdSlots(liveAds);
        }
      } catch (e) {
        console.error('Error loading ads in news article page', e);
      }
    };

    syncAds();
    const unsubscribeAds = dbService.subscribe(syncAds);

    if (typeof window !== 'undefined') {
      window.addEventListener('adsStorageUpdate', syncAds);
      window.addEventListener('storage', syncAds);
      window.addEventListener('todayscoimbatore:db-updated', syncAds);
    }

    return () => {
      isMounted = false;
      unsubscribeAds();
      if (typeof window !== 'undefined') {
        window.removeEventListener('adsStorageUpdate', syncAds);
        window.removeEventListener('storage', syncAds);
        window.removeEventListener('todayscoimbatore:db-updated', syncAds);
      }
    };
  }, []);

  const getAd = (placementKey: string) => {
    const key = (placementKey || '').toUpperCase().trim();
    return adSlots.find(
      (a) =>
        (a.placementKey && a.placementKey.toUpperCase().trim() === key) ||
        (a.slotId && a.slotId.toUpperCase().trim() === key) ||
        (a.id && a.id.toUpperCase().trim() === key)
    );
  };

  // Fetch article from Supabase news table first, with local fallback
  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      setIsLoading(true);
      try {
        // 1. Try fetching from Supabase news table safely without UUID casting errors
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug);
        let query = supabase.from('news').select('*');
        if (isUUID) {
          query = query.or(`id.eq.${rawSlug},slug.eq.${rawSlug}`);
        } else {
          query = query.eq('slug', rawSlug);
        }
        const { data: supaRow } = await query.maybeSingle();

        if (supaRow && isMounted) {
          const mapped: Article = {
            id: supaRow.id,
            title: supaRow.title,
            slug: supaRow.slug,
            category: supaRow.category || 'NEWS',
            subCategory: supaRow.category || 'Local Updates',
            content: supaRow.content || '',
            excerpt: supaRow.content ? supaRow.content.slice(0, 180) + '...' : '',
            imageUrl: supaRow.image_url || undefined,
            author: supaRow.author || 'Editorial Team',
            publishedAt: supaRow.created_at || new Date().toISOString(),
            createdAt: supaRow.created_at || new Date().toISOString(),
            readTime: '3 min read',
            isExclusive: false,
            status: 'published',
            mediaType: 'image',
            commentsCount: 0,
          };
          setArticle(mapped);

          // Get related articles from dbService
          const all = await dbService.getArticles();
          setRelatedArticles(all.filter((a) => a.id !== supaRow.id).slice(0, 3));
          setIsLoading(false);
          return;
        }

        // 2. Fallback to local dbService articles
        const allArticles = await dbService.getArticles();
        let matched = allArticles.find(
          (a) =>
            a.id === rawSlug ||
            (a.slug && a.slug.toLowerCase() === rawSlug.toLowerCase()) ||
            a.title.toLowerCase().includes(rawSlug.toLowerCase())
        );

        if (!matched && allArticles.length > 0) {
          matched = allArticles[0];
        }

        if (isMounted) {
          setArticle(matched || null);
          if (matched) {
            setRelatedArticles(allArticles.filter((a) => a.id !== matched!.id).slice(0, 3));
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching news article:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadArticle();

    return () => {
      isMounted = false;
    };
  }, [rawSlug]);

  const handleOpenShare = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://todayscoimbatore.com/news/${rawSlug}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator
        .share({
          title: article?.title || "Today's Coimbatore",
          url: currentUrl,
        })
        .catch(() => {
          setIsShareModalOpen(true);
        });
    } else {
      setIsShareModalOpen(true);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://todayscoimbatore.com/news/${rawSlug}`;

  const fullArticleAudioText = article
    ? [article.title, article.excerpt, article.content].filter(Boolean).join('. ')
    : '';

  const articleImageUrl = (article?.imageUrl && article.imageUrl.trim() !== '') ? article.imageUrl.trim() : undefined;

  return (
    <div className="w-full bg-[#fcfbf7] dark:bg-slate-950 text-[#111111] dark:text-gray-100 font-sans antialiased selection:bg-red-600 selection:text-white transition-colors duration-200 pb-20 md:pb-0">
      <UniversalSideLayout pageType="article" className="mt-0 pt-0">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
          <Link href="/" className="hover:text-red-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/news" className="hover:text-red-600 transition-colors">
            News
          </Link>
          <span>/</span>
          <span className="text-red-600 truncate max-w-[200px]">{article?.category || 'Article'}</span>
        </nav>

        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-sm font-bold animate-pulse">
            Loading verified news article...
          </div>
        ) : article ? (
          <article className="space-y-6 max-w-3xl">
            {/* Category & Date Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-xs">
                  {article.category || 'COVAI NEWS'}
                </span>
                <span className="text-xs text-stone-400 font-bold">
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-xs text-stone-500 dark:text-gray-400 font-bold">
                  By {article.author || 'Staff Bureau'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 dark:text-white leading-tight">
                {article.title}
              </h1>
            </div>

            {/* Audio Voice Reader & AI Summarizer */}
            <div className="space-y-3 p-4 rounded-2xl bg-stone-100/80 dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
              <AudioReader
                title={article.title}
                textToRead={fullArticleAudioText}
                author={article.author}
              />
              <AiSummary
                title={article.title}
                excerpt={article.excerpt}
                content={article.content}
              />
            </div>

            {/* Featured Image - ONLY if genuine image exists */}
            {articleImageUrl ? (
              <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-md bg-stone-900">
                <img
                  src={articleImageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {/* Article Body Content */}
            <div className="prose dark:prose-invert max-w-none text-stone-800 dark:text-gray-200 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
              {(article.content || '').split('\n\n').map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Social Share Bar */}
            <div className="pt-6 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Share this verified Kovai story:
              </span>
              <button
                type="button"
                onClick={handleOpenShare}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Share Story
              </button>
            </div>

            {/* Related News Cards */}
            {relatedArticles.length > 0 && (
              <div className="pt-8 space-y-4 border-t border-stone-200 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white uppercase tracking-wide">
                  More Stories from Coimbatore
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.id}
                      href={rel.slug ? `/news/${rel.slug}` : `/article/${rel.id}`}
                      className="group bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 p-3 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="h-28 rounded-lg overflow-hidden bg-stone-900">
                          <img
                            src={rel.imageUrl || articleImageUrl || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80'}
                            alt={rel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h4 className="text-xs font-black text-stone-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-stone-400 font-bold mt-2">
                        {rel.category}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        ) : (
          <div className="py-20 text-center space-y-3">
            <h2 className="text-xl font-bold text-stone-800 dark:text-gray-200">Article not found</h2>
            <p className="text-xs text-stone-500">The requested story could not be found or has been moved.</p>
            <Link
              href="/news"
              className="inline-block px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider"
            >
              Browse Latest News
            </Link>
          </div>
        )}
      </UniversalSideLayout>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={article?.title || "Today's Coimbatore News"}
        url={currentUrl}
      />

      <MobileBottomBanner />
    </div>
  );
}
