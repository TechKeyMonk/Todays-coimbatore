'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import dbService, { Article } from '@/services/db';
import {
  minimizeArticlesForStorage,
  purgeLargeOutdatedStorageKeys,
  safeLocalStorageSet,
} from '@/utils/storage';

interface ArticleListProps {
  articles: Article[];
  onArticlesChange?: (updated: Article[]) => void;
  onEdit?: (article: Article) => void;
}

export default function ArticleList({
  articles,
  onArticlesChange,
  onEdit,
}: ArticleListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id).filter(Boolean)));
    }
  };

  /**
   * Delete single article with database-first priority and safe localStorage fallback
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this story?')) return;

    setIsDeleting(true);
    setStatusMsg(null);

    try {
      // 1. Database deletion FIRST via Supabase client & API
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('news').delete().eq('id', id);
        } else {
          await supabase.from('news').delete().or(`id.eq.${id},slug.eq.${id}`);
        }
      } catch (dbErr) {
        console.warn('Direct Supabase delete notice:', dbErr);
      }

      await dbService.deleteArticle(id);

      // 2. Update React state directly from memory
      const updatedArticles = articles.filter((a) => a.id !== id && a.slug !== id);
      if (onArticlesChange) {
        onArticlesChange(updatedArticles);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // 3. Safe LocalStorage sync wrapped in try-catch with minimal fields
      try {
        const minimalArticles = minimizeArticlesForStorage(updatedArticles);
        try {
          localStorage.setItem('admin_published_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        try {
          localStorage.setItem('t_covai_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        purgeLargeOutdatedStorageKeys();
      } catch (e) {
        console.warn('LocalStorage quota exceeded. Skipping local cache update.');
      }

      // 4. Dispatch sync events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('newsStorageUpdate'));
        window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'news' } }));
        window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles' }));
      }

      setStatusMsg({ text: 'Article permanently deleted from database.', type: 'success' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Delete article failed:', err);
      setStatusMsg({ text: err.message || 'Failed to delete article', type: 'error' });
      setTimeout(() => setStatusMsg(null), 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Bulk delete selected articles with database-first priority and safe storage fallback
   */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} selected story(ies)?`)) return;

    setIsDeleting(true);
    setStatusMsg(null);
    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;

    try {
      try {
        await supabase.from('news').delete().in('id', idsToDelete);
      } catch (dbErr) {
        console.warn('Direct bulk Supabase delete notice:', dbErr);
      }

      for (const id of idsToDelete) {
        try {
          await dbService.deleteArticle(id);
          successCount++;
        } catch (e) {
          console.error(`Failed to delete ${id}:`, e);
        }
      }

      // Update React state directly
      const updatedArticles = articles.filter((a) => !selectedIds.has(a.id) && (!a.slug || !selectedIds.has(a.slug)));
      if (onArticlesChange) {
        onArticlesChange(updatedArticles);
      }
      setSelectedIds(new Set());

      // Safe LocalStorage sync
      try {
        const minimalArticles = minimizeArticlesForStorage(updatedArticles);
        try {
          localStorage.setItem('admin_published_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        try {
          localStorage.setItem('t_covai_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        purgeLargeOutdatedStorageKeys();
      } catch (e) {
        console.warn('LocalStorage quota exceeded. Skipping local cache update.');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('newsStorageUpdate'));
        window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'news' } }));
        window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles' }));
      }

      setStatusMsg({ text: `Successfully deleted ${successCount} story(ies).`, type: 'success' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Bulk delete failed:', err);
      setStatusMsg({ text: err.message || 'Failed to bulk delete', type: 'error' });
      setTimeout(() => setStatusMsg(null), 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900">
          <span className="text-xs font-bold text-red-800 dark:text-red-300">
            {selectedIds.size} story(ies) selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
          </button>
        </div>
      )}

      <div className="divide-y divide-stone-200 dark:divide-slate-800">
        {articles.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const rawImg = item.imageUrl || (item as any).image;
          const hasImg = rawImg && typeof rawImg === 'string' && rawImg.trim() !== '' && rawImg !== 'null' && rawImg !== 'undefined';

          return (
            <div
              key={item.id}
              className={`py-3 flex items-center gap-3 transition-colors ${
                isSelected ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(item.id)}
                className="w-4 h-4 rounded text-blue-600 border-stone-300 focus:ring-blue-500 cursor-pointer"
              />

              {hasImg && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <Image src={rawImg} alt={item.title} fill className="object-cover" unoptimized />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <Link
                  href={`/article/${item.slug || item.id}`}
                  className="text-xs font-bold text-stone-900 dark:text-gray-100 hover:text-blue-600 line-clamp-1"
                >
                  {item.title}
                </Link>
                <div className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>{item.category || 'News'}</span>
                  <span>•</span>
                  <span>{item.author || 'Editorial Bureau'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-stone-800 dark:text-gray-200 text-xs font-bold transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Delete story"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
