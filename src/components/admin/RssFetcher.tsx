'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Trash2, ExternalLink, Clock, Sparkles, FileText, Check } from 'lucide-react';
import { clientNewsService, RssDraft } from '@/lib/supabase/news';

export default function RssFetcher() {
  const [drafts, setDrafts] = useState<RssDraft[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // 1. Fetch Drafts on Component Mount directly from Supabase `rss_drafts`
  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await clientNewsService.getRssDrafts();
      setDrafts(items);
    } catch (err: any) {
      console.error('Failed to load drafts from rss_drafts:', err);
      showMessage(err.message || 'Failed to load RSS drafts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // 2. Scan & Fetch RSS: Upserts into `rss_drafts` without inserting to `news`
  const handleFetchRss = async () => {
    setIsFetching(true);
    try {
      const result = await clientNewsService.triggerFetch();
      await loadDrafts();
      showMessage(`✓ Successfully scanned RSS! Found & persisted ${result.count} drafts in rss_drafts table.`, 'success');
    } catch (err: any) {
      console.error('Failed to fetch RSS:', err);
      showMessage(err.message || 'Failed to trigger RSS fetch', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  // 3. Move Draft to Main `news` Table on Publish
  const handlePublish = async (draft: RssDraft) => {
    setProcessingId(draft.id);
    try {
      await clientNewsService.publishDraft(draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      showMessage(`✓ Published "${draft.title.slice(0, 45)}..." to live News! Removed from rss_drafts.`, 'success');
    } catch (err: any) {
      console.error('Failed to publish draft:', err);
      showMessage(err.message || 'Failed to publish draft to news table', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // 4. Discard Draft Option: Remove from `rss_drafts` without publishing to `news`
  const handleDiscard = async (draft: RssDraft) => {
    if (!confirm(`Are you sure you want to discard this draft?\n\n"${draft.title}"`)) {
      return;
    }
    setProcessingId(draft.id);
    try {
      await clientNewsService.discardDraft(draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      showMessage('Draft discarded and deleted from rss_drafts.', 'info');
    } catch (err: any) {
      console.error('Failed to discard draft:', err);
      showMessage(err.message || 'Failed to discard draft', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#1a1a1a]">
              Automated RSS Feed Ingestion &amp; Review
            </h2>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded">
              rss_drafts table
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Fetched news is saved in <strong className="text-stone-700">rss_drafts</strong> and only published to <strong className="text-stone-700">news</strong> upon explicit click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDrafts}
            disabled={isLoading}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh drafts list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-stone-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleFetchRss}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {isFetching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Feeds...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Fetch RSS Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border transition-all animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : message.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Drafts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-stone-600">
          <span>Pending Review Drafts ({drafts.length})</span>
          <span className="text-[11px] text-stone-400 font-normal">
            Database-backed: persists across page refreshes
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-stone-400 mb-2" />
            <p className="text-xs text-stone-500 font-medium">Loading drafts from rss_drafts table...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="p-8 text-center bg-[#fcfbf7] rounded-xl border border-stone-200 space-y-2">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-xl">
              📰
            </div>
            <h4 className="text-sm font-bold text-stone-800">No Pending RSS Drafts</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              All RSS items have been reviewed or published. Click &quot;Fetch RSS Now&quot; above to scan for latest Coimbatore stories.
            </p>
          </div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="p-4 rounded-xl border border-stone-200 bg-[#fcfbf7] hover:border-stone-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold uppercase">
                  <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-extrabold">
                    {draft.category || 'News'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-black">
                    rss_drafts
                  </span>
                  {draft.created_at && (
                    <span className="text-stone-400 flex items-center gap-1 font-normal">
                      <Clock className="w-3 h-3" />
                      {new Date(draft.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                  {draft.title}
                </h4>

                <p className="text-xs text-stone-600 line-clamp-2">
                  {draft.content?.slice(0, 160)}...
                </p>

                {draft.source && (
                  <a
                    href={draft.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#153d3b] hover:underline"
                  >
                    <span>Source reference</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handlePublish(draft)}
                  disabled={processingId === draft.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                  title="Move to news table and publish live"
                >
                  {processingId === draft.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Publish</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDiscard(draft)}
                  disabled={processingId === draft.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  title="Discard draft from database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
