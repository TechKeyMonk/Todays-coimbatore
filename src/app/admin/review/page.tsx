'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  Tag,
  Check,
  Search,
} from 'lucide-react';
import dbService, { Article, formatRelativeTime } from '../../../services/db';

const VALID_CATEGORIES = [
  'News',
  'Our City',
  'CEO',
  'Events',
  'Education',
  'Tech',
  'Business',
] as const;

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function AdminReviewPage() {
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingRss, setIsFetchingRss] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingDraft, setEditingDraft] = useState<Article | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form state for editing modal
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('News');
  const [editAuthor, setEditAuthor] = useState('Editorial Bureau');
  const [editContent, setEditContent] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Fetch Drafts from DB / API
  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const items = await dbService.getDraftArticles();
      setDrafts(items);
    } catch (err) {
      console.error('Failed to load drafts:', err);
      addToast('Failed to fetch pending drafts from database.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // 2. Trigger RSS Ingestion via /api/cron/fetch-news
  const handleTriggerRss = async () => {
    setIsFetchingRss(true);
    try {
      const res = await fetch('/api/cron/fetch-news?secret=Todayscoimbatore@2026&sync=true', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'RSS ingestion failed');
      }

      const count = json.insertedCount ?? json.insertedDraftsCount ?? 0;
      if (count > 0) {
        addToast(
          `✓ Success: Ingested ${count} new AI English draft(s)!`,
          'success'
        );
      } else if (json.processingCandidatesCount > 0) {
        addToast(
          `✓ Ingestion started for ${json.processingCandidatesCount} candidates in background!`,
          'success'
        );
      } else {
        addToast(
          json.message || 'RSS scanned: All articles are already up-to-date.',
          'info'
        );
      }

      await loadDrafts();
    } catch (err: any) {
      console.error('RSS Fetch error:', err);
      addToast(`Error: ${err.message || 'Failed to trigger RSS ingestion.'}`, 'error');
    } finally {
      setIsFetchingRss(false);
    }
  };

  // 3. Approve and Publish Draft
  const handleApprove = async (draft: Article) => {
    setIsProcessingId(draft.id);
    try {
      const ok = await dbService.approveArticle(draft.id);
      if (ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        addToast(`✓ Published "${draft.title.slice(0, 45)}..." live to website!`, 'success');
        if (editingDraft?.id === draft.id) {
          setEditingDraft(null);
        }
      } else {
        throw new Error('Approval request failed');
      }
    } catch (err: any) {
      console.error('Approval error:', err);
      addToast(`Failed to approve article: ${err.message}`, 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // 4. Reject and Delete Draft
  const handleReject = async (draft: Article) => {
    if (!window.confirm(`Are you sure you want to reject and permanently delete:\n"${draft.title}"?`)) {
      return;
    }

    setIsProcessingId(draft.id);
    try {
      const ok = await dbService.deleteArticle(draft.id);
      if (ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        addToast(`Draft deleted successfully.`, 'info');
        if (editingDraft?.id === draft.id) {
          setEditingDraft(null);
        }
      } else {
        throw new Error('Deletion failed');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast(`Failed to delete draft: ${err.message}`, 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // 5. Open Edit Modal
  const openEditModal = (draft: Article) => {
    setEditingDraft(draft);
    setEditTitle(draft.title);
    setEditCategory(draft.category || 'News');
    setEditAuthor(draft.author || 'Editorial Bureau');
    setEditContent(draft.content || '');
    setEditExcerpt(draft.excerpt || '');
  };

  // 6. Save Edits (stays in draft)
  const handleSaveDraftEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;

    setIsProcessingId(editingDraft.id);
    try {
      const updated = await dbService.updateArticle(editingDraft.id, {
        title: editTitle.trim(),
        category: editCategory,
        author: editAuthor.trim(),
        content: editContent.trim(),
        excerpt: editExcerpt.trim() || editContent.slice(0, 180).trim(),
      });

      setDrafts((prev) =>
        prev.map((d) => (d.id === editingDraft.id ? { ...d, ...updated } : d))
      );
      addToast('✓ Draft changes saved.', 'success');
      setEditingDraft(null);
    } catch (err: any) {
      console.error('Save error:', err);
      addToast(`Failed to save edits: ${err.message}`, 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Filtered drafts list
  const filteredDrafts = useMemo(() => {
    return drafts.filter((item) => {
      const matchesCat =
        selectedCategory === 'All' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCat && matchesSearch;
    });
  }, [drafts, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fcfbf7] dark:bg-slate-950 text-[#111111] dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white transition-colors duration-200">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/90 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100'
                : 'bg-blue-50 dark:bg-blue-950/90 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 break-words">{toast.text}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 dark:text-gray-300 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Admin CMS</span>
            </Link>
            <span className="text-stone-300 dark:text-slate-700">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-white truncate">
                AI Draft Review Portal
              </h1>
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                {drafts.length} PENDING
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTriggerRss}
              disabled={isFetchingRss}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRss ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isFetchingRss ? 'Ingesting RSS...' : 'Fetch Latest RSS Now'}
              </span>
              <span className="sm:hidden">{isFetchingRss ? 'Ingesting...' : 'Fetch RSS'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Explaining Policy */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-black uppercase tracking-wider block sm:inline mr-2">
                Strict Draft-First Safeguard Active:
              </span>
              <span className="text-stone-700 dark:text-stone-300">
                Incoming AI-rewritten articles are isolated in <strong>draft mode</strong>. They will
                never appear on public feeds until you review and click <strong>Approve & Publish</strong>.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadDrafts}
            className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-300 hover:underline shrink-0"
          >
            ↻ Refresh Queue
          </button>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {['All', ...VALID_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white dark:bg-red-600 dark:text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headline or content..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>

        {/* Draft Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-red-600 animate-spin" />
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Loading pending drafts from database...
            </p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 space-y-4 p-8">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-stone-900 dark:text-white">
                Queue is Clear! Zero Pending Drafts
              </h3>
              <p className="text-xs text-stone-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                No articles are currently awaiting review. Click &quot;Fetch Latest RSS Now&quot; to ingest the
                latest Coimbatore stories from Google News in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTriggerRss}
              disabled={isFetchingRss}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRss ? 'animate-spin' : ''}`} />
              <span>Fetch Latest RSS Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrafts.map((draft) => {
              const isProcessing = isProcessingId === draft.id;
              const sourceDomain = draft.sourceUrl
                ? (() => {
                    try {
                      return new URL(draft.sourceUrl).hostname.replace('www.', '');
                    } catch {
                      return 'Google News RSS';
                    }
                  })()
                : 'External RSS';

              return (
                <div
                  key={draft.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-stone-400 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group min-w-0"
                >
                  <div className="p-5 space-y-3 flex-1 flex flex-col min-w-0">
                    {/* Meta Header */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider flex-wrap">
                      <span className="bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md">
                        {draft.category || 'News'}
                      </span>
                      <div className="flex items-center gap-1 text-stone-400 font-mono text-[9px]">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(draft.createdAt)}</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 className="text-sm font-black text-stone-900 dark:text-white leading-snug line-clamp-3 group-hover:text-red-600 transition-colors break-words">
                      {draft.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-stone-600 dark:text-gray-400 line-clamp-3 leading-relaxed flex-1 break-words">
                      {draft.excerpt || draft.content?.slice(0, 160) || 'No preview snippet available.'}
                    </p>

                    {/* Original Source Reference */}
                    {draft.sourceUrl && (
                      <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-stone-400 font-medium truncate max-w-[150px]">
                          Source: {sourceDomain}
                        </span>
                        <a
                          href={draft.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold hover:underline"
                        >
                          <span>Original</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 bg-stone-50 dark:bg-slate-800/50 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(draft)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(draft)}
                        disabled={isProcessing}
                        title="Reject & Delete draft"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(draft)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Review & Edit Full Modal */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white truncate">
                  Review &amp; Edit Ingested News Draft
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveDraftEdits} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                  Article Headline (English)
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-sm font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Category and Author Desk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                    Category Desk
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  >
                    {VALID_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                    Byline / Author Desk
                  </label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                  Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600 leading-relaxed"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                  Full Story Body (English Editorial Text)
                </label>
                <textarea
                  rows={8}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs sm:text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600 leading-relaxed font-normal"
                />
              </div>

              {/* Original Source Reference */}
              {editingDraft.sourceUrl && (
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-slate-800/60 text-xs text-stone-500 dark:text-gray-400 flex items-center justify-between gap-3">
                  <span className="truncate">Original: {editingDraft.sourceUrl}</span>
                  <a
                    href={editingDraft.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 font-bold hover:underline shrink-0 inline-flex items-center gap-1"
                  >
                    <span>View Article</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleReject(editingDraft)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reject &amp; Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-bold text-stone-700 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    Save Draft Edits
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(editingDraft)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve &amp; Publish Live</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
