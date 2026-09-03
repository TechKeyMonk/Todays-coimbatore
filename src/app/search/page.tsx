'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import dbService, { Article } from '@/services/db';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const allArticles = await dbService.getArticles();
        if (!isMounted) return;
        if (!query.trim()) {
          setArticles(allArticles);
        } else {
          const q = query.toLowerCase().trim();
          const filtered = allArticles.filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.excerpt?.toLowerCase().includes(q) ||
              a.content?.toLowerCase().includes(q) ||
              a.category?.toLowerCase().includes(q) ||
              a.subCategory?.toLowerCase().includes(q) ||
              a.author?.toLowerCase().includes(q) ||
              (a.tags && a.tags.some((t) => t.toLowerCase().includes(q)))
          );
          setArticles(filtered);
        }
      } catch (e) {
        console.error('Search query error', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="border-b border-stone-200 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-gray-100">
            Search Results {query ? `for "${query}"` : ''}
          </h1>
          <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5 font-bold">
            Found {articles.length} news stories and reports
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 bg-stone-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              id={article.id}
              title={article.title}
              category={article.category}
              timeAgo={article.publishedAt || 'Recently'}
              author={article.author}
              excerpt={article.excerpt}
              imageUrl={article.imageUrl || (article as any).image}
              videoUrl={article.videoUrl}
              articleHref={`/article/${article.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 space-y-3">
          <span className="text-4xl block">🔍</span>
          <h3 className="text-base font-black text-slate-800 dark:text-gray-200">
            No matching stories found
          </h3>
          <p className="text-xs text-stone-500 dark:text-gray-400 max-w-md mx-auto">
            Try checking for spelling errors or searching for different topics like &quot;Metro&quot;, &quot;TANGEDCO&quot;, or &quot;Avinashi Road&quot;.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider"
          >
            Back to Home Feed
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold">Loading search results...</div>}>
      <SearchResults />
    </Suspense>
  );
}
