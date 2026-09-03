'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  Search,
  Copy,
  Check,
  Eye,
  Send,
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
  'Infrastructure',
  'TNEB',
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
  const [viewingDraft, setViewingDraft] = useState<Article | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Fetch Drafts from DB / API
  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const items = await dbService.getDraftArticles();
      setDrafts(items || []);
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

  // 3. Reject / Dismiss and Delete Draft
  const handleDismissDraft = async (draft: Article) => {
    if (!window.confirm(`Are you sure you want to dismiss and delete this draft:\n"${draft.title}"?`)) {
      return;
    }

    setIsProcessingId(draft.id);
    try {
      const ok = await dbService.deleteArticle(draft.id);
      if (ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
        addToast(`Draft dismissed successfully.`, 'info');
        if (viewingDraft?.id === draft.id) {
          setViewingDraft(null);
        }
      } else {
        throw new Error('Deletion failed');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast(`Failed to dismiss draft: ${err.message}`, 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Robust Cross-Browser Clipboard Helper
  const copyToClipboardSafe = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}

    try {
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (e) {}
    return false;
  };

  // 4. Copy Draft Text to Clipboard
  const handleCopyDraft = async (draft: Article, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const formattedText = `TITLE:
${draft.title}

CATEGORY:
${draft.category || 'NEWS'}

EXCERPT:
${draft.excerpt || draft.content?.slice(0, 180) || ''}

FULL CONTENT:
${draft.content || ''}

SOURCE:
${draft.sourceUrl || 'External RSS'}`;

    const ok = await copyToClipboardSafe(formattedText);
    if (ok) {
      setCopiedId(draft.id);
      addToast(`✓ Copied full draft for "${draft.title.slice(0, 35)}..." to clipboard!`, 'success');
      setTimeout(() => setCopiedId(null), 2500);
    } else {
      addToast('Failed to copy to clipboard. Please select and copy manually.', 'error');
    }
  };

  // 5. Copy Single Field
  const handleCopyField = async (text: string, label: string) => {
    const ok = await copyToClipboardSafe(text);
    if (ok) {
      addToast(`✓ Copied ${label} to clipboard!`, 'success');
    } else {
      addToast(`Failed to copy ${label}.`, 'error');
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
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-white truncate">
                AI Draft Review &amp; Copy Assistant
              </h1>
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                {drafts.length} DRAFTS READY
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
                {isFetchingRss ? 'Ingesting RSS...' : 'Fetch Latest RSS'}
              </span>
              <span className="sm:hidden">{isFetchingRss ? 'Ingesting...' : 'Fetch RSS'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Explaining Copy-to-Publish Workflow */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-black uppercase tracking-wider block sm:inline mr-2">
                Copy &amp; Manual Verification Workflow:
              </span>
              <span className="text-stone-700 dark:text-stone-300">
                AI extracts and translates Coimbatore reports into structured English text. Review drafts below, click <strong>&quot;Copy Draft&quot;</strong>, and paste into the respective manual creation forms in <Link href="/admin" className="underline font-bold text-red-600">Admin CMS</Link> with your custom image attachments.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadDrafts}
            className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-300 hover:underline shrink-0 cursor-pointer"
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headline or content..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-600 font-bold"
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
                No articles are currently awaiting review. Click &quot;Fetch Latest RSS&quot; to ingest the
                latest Coimbatore stories from verified feeds.
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
              const isCopied = copiedId === draft.id;
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

                  {/* Actions Bar: View Content, Copy Draft, Dismiss */}
                  <div className="p-3 bg-stone-50 dark:bg-slate-800/50 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingDraft(draft)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Content</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDismissDraft(draft)}
                        disabled={isProcessing}
                        title="Dismiss & Delete draft"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyDraft(draft, e)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 hover:bg-black dark:bg-red-600 dark:hover:bg-red-700 text-white'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Draft'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* View & Copy Full Content Modal */}
      {viewingDraft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white truncate">
                  AI Draft Inspector &amp; Content Exporter
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDraft(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Headline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                    Headline
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyField(viewingDraft.title, 'Headline')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Title</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-sm font-bold text-stone-900 dark:text-white break-words">
                  {viewingDraft.title}
                </div>
              </div>

              {/* Meta information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                    Suggested Category
                  </label>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 font-bold text-stone-900 dark:text-white">
                    {viewingDraft.category || 'News'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                    Suggested Desk / Byline
                  </label>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 font-bold text-stone-900 dark:text-white">
                    {viewingDraft.author || 'Editorial Bureau'}
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              {viewingDraft.excerpt && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                      Summary / Excerpt
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyField(viewingDraft.excerpt || '', 'Excerpt')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Excerpt</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-gray-200 leading-relaxed break-words">
                    {viewingDraft.excerpt}
                  </div>
                </div>
              )}

              {/* Full Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-black uppercase tracking-wider text-stone-600 dark:text-gray-300">
                    Full Article Content
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyField(viewingDraft.content || '', 'Content Body')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Content Body</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white whitespace-pre-wrap leading-relaxed font-normal text-xs sm:text-sm max-h-60 overflow-y-auto">
                  {viewingDraft.content || 'No detailed content body available.'}
                </div>
              </div>

              {/* Original Source Reference */}
              {viewingDraft.sourceUrl && (
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-slate-800/60 text-stone-500 dark:text-gray-400 flex items-center justify-between gap-3">
                  <span className="truncate">Source URL: {viewingDraft.sourceUrl}</span>
                  <a
                    href={viewingDraft.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 font-bold hover:underline shrink-0 inline-flex items-center gap-1"
                  >
                    <span>Open Original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-stone-50 dark:bg-slate-800/40 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleDismissDraft(viewingDraft)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Dismiss Draft</span>
              </button>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-bold text-stone-700 dark:text-gray-200 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Go to Admin Publishing</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleCopyDraft(viewingDraft)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Full Structured Draft</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
