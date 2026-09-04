'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NewsCard from '../../../components/NewsCard';
import Footer from '../../../components/Footer';
import VideoPlayer from '../../../components/VideoPlayer';
import MobileBottomBanner from '../../../components/MobileBottomBanner';
import UniversalSideLayout from '../../../components/UniversalSideLayout';
import dbService, { Article } from '../../../services/db';

interface VideoModalData {
  title: string;
  category: string;
  duration?: string;
  quality?: string;
  location?: string;
  caption?: string;
  videoUrl?: string;
}

export default function CategoryClient({ slug }: { slug: string }) {
  const rawSlug = slug || 'news';

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideoModal, setActiveVideoModal] = useState<VideoModalData | null>(null);

  // Clean formatted category title from route param
  const formatCategoryName = (sParam: string): string => {
    const s = (sParam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s === 'events' || s.includes('event')) return 'EVENTS';
    if (s.includes('infra')) return 'INFRASTRUCTURE & CIVIC';
    if (s.includes('civic') || s.includes('ourcity') || s.includes('mycity') || s === 'city') return 'OUR CITY';
    if (s.includes('topstories') || s.includes('trending') || s.includes('spotlight') || s === 'news') return 'NEWS';
    if (s.includes('business') || s.includes('startup') || s.includes('industry')) return 'BUSINESS';
    if (s.includes('tech') || s.includes('ev') || s.includes('saas')) return 'TECH';
    if (s.includes('sport')) return 'SPORTS';
    if (s.includes('ceo') || s.includes('founder')) return 'CEO';
    if (s.includes('edu')) return 'EDUCATION';
    if (s.includes('paper')) return 'E-PAPER';
    return (sParam || 'NEWS').toUpperCase().replace(/-/g, ' ');
  };

  const categoryName = formatCategoryName(rawSlug);

  // Scroll to top on category change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [rawSlug]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryFeed() {
      setIsLoading(true);
      try {
        const applyFilter = (publishedArticles: Article[]) => {
          const sorted = [...publishedArticles].sort((a, b) => {
            const timeA = Math.max(new Date(a.updatedAt || 0).getTime() || 0, new Date(a.createdAt || a.publishedAt || 0).getTime() || 0);
            const timeB = Math.max(new Date(b.updatedAt || 0).getTime() || 0, new Date(b.createdAt || b.publishedAt || 0).getTime() || 0);
            return timeB - timeA;
          });

          const routeSlug = (rawSlug || 'news').toLowerCase().trim();
          const routeSlugClean = routeSlug.replace(/[^a-z0-9]/g, '');

          return sorted.filter((art) => {
            const artCat = (art.category || '').toLowerCase().trim();
            const artCatClean = artCat.replace(/[^a-z0-9]/g, '');
            const artSub = (art.subCategory || '').toLowerCase().trim();
            const artSubClean = artSub.replace(/[^a-z0-9]/g, '');

            if (routeSlugClean === 'events' || routeSlugClean === 'event') {
              return (
                artCatClean.includes('event') ||
                artSubClean.includes('event') ||
                artCat.toUpperCase() === 'EVENTS' ||
                artSub.toUpperCase() === 'EVENTS'
              );
            }

            if (artCat === routeSlug || artCatClean === routeSlugClean) return true;
            if (artSub === routeSlug || artSubClean === routeSlugClean) return true;

            if (routeSlugClean.includes('infra') || routeSlugClean.includes('civic')) {
              return artCatClean.includes('infra') || artCatClean.includes('civic') || artSubClean.includes('infra');
            }
            if (routeSlugClean.includes('city') || routeSlugClean.includes('ourcity')) {
              return artCatClean.includes('city') || artCatClean.includes('civic') || artCatClean.includes('ourcity');
            }
            if (routeSlugClean.includes('ceo') || routeSlugClean.includes('founder')) {
              return artCatClean.includes('ceo') || artSubClean.includes('ceo') || artSubClean.includes('founder');
            }
            if (routeSlugClean.includes('tech') || routeSlugClean.includes('ev') || routeSlugClean.includes('saas')) {
              return artCatClean.includes('tech') || artCatClean.includes('ev') || artSubClean.includes('tech');
            }
            if (routeSlugClean.includes('sport')) {
              return artCatClean.includes('sport') || artSubClean.includes('sport');
            }
            if (routeSlugClean.includes('edu')) {
              return artCatClean.includes('edu') || artSubClean.includes('edu');
            }
            if (routeSlugClean.includes('business') || routeSlugClean.includes('startup')) {
              return artCatClean.includes('business') || artCatClean.includes('startup') || artSubClean.includes('business');
            }
            if (routeSlugClean.includes('paper') || routeSlugClean.includes('epaper')) {
              return artCatClean.includes('paper') || artSubClean.includes('paper');
            }

            return false;
          });
        };

        const liveArticles = await dbService.getArticles();
        if (isMounted) {
          const filtered = applyFilter(liveArticles);
          setArticles(filtered);
        }
      } catch (err) {
        console.error('Failed to load category feed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCategoryFeed();

    return () => {
      isMounted = false;
    };
  }, [rawSlug]);

  const handleOpenVideoModal = (videoData: VideoModalData) => {
    setActiveVideoModal(videoData);
  };

  const closeVideoModal = () => {
    setActiveVideoModal(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200 pb-20 md:pb-0">
      <UniversalSideLayout pageType="category">
        <div className="w-full space-y-6">

          {/* Section Breadcrumb & Header Banner */}
          <div className="border-b-2 border-stone-800 dark:border-slate-700 pb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#e54b3c] font-black mb-1">
                <Link href="/" className="hover:underline text-stone-500 dark:text-gray-400">Home</Link>
                <span>/</span>
                <span>Category</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1a1a1a] dark:text-gray-100 tracking-tight font-serif uppercase">
                {categoryName}
              </h1>
            </div>
            <span className="text-xs font-bold text-stone-600 dark:text-gray-400 bg-stone-200 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {articles.length} Stories
            </span>
          </div>

          {/* Articles Feed */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#e54b3c] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-gray-400">Loading {categoryName} Updates...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 p-8">
              <div className="text-4xl">📰</div>
              <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-gray-100">No Stories Published Yet</h3>
              <p className="text-xs text-stone-600 dark:text-gray-400 max-w-sm mx-auto">
                Check back soon! Our local bureau is constantly tracking new verified updates in Coimbatore.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-block text-xs font-black uppercase tracking-wider bg-[#153d3b] text-white px-4 py-2 rounded-lg hover:bg-[#1a4f4c] transition-colors"
                >
                  Return to Front Page
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {articles.map((art, idx) => {
                const isFirst = idx === 0;
                const linkHref = `/news/${art.slug || art.id}`;

                return (
                  <div
                    key={art.id}
                    className={isFirst ? "col-span-1 md:col-span-2 lg:col-span-3" : "col-span-1"}
                  >
                    <NewsCard
                      id={art.id}
                      title={art.title}
                      category={art.category || categoryName}
                      timeAgo={art.publishedAt || art.createdAt || 'Recent'}
                      author={art.author || 'Editorial Bureau'}
                      excerpt={art.excerpt || (art.content ? art.content.slice(0, 140) + '...' : '')}
                      imageUrl={art.imageUrl}
                      articleHref={linkHref}
                    />
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </UniversalSideLayout>

      {/* Footer */}
      <Footer />

      {/* Global Video Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={closeVideoModal}
        >
          <div
            className="relative w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-black/60 border-b border-white/10">
              <span className="text-xs font-black uppercase text-red-500 tracking-wider">
                {activeVideoModal.category} • {activeVideoModal.duration || '03:00'}
              </span>
              <button
                type="button"
                onClick={closeVideoModal}
                className="text-white hover:text-red-400 font-bold text-sm px-2 py-1 rounded-lg bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <VideoPlayer
                url={activeVideoModal.videoUrl || 'https://www.youtube.com/watch?v=8V-2Z0m2c0s'}
                title={activeVideoModal.title}
                autoplay={true}
                className="w-full h-full"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-white/15">
              <h4 className="text-white font-bold text-sm sm:text-base">
                {activeVideoModal.title}
              </h4>
              {activeVideoModal.caption && (
                <p className="text-stone-300 text-xs font-medium mt-1">
                  {activeVideoModal.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileBottomBanner />
    </div>
  );
}
