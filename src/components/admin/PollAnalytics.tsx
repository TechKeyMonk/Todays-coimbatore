'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, RotateCcw, CheckCircle2, Edit2, AlertCircle, RefreshCw } from 'lucide-react';

interface PollData {
  id: string;
  question: string;
  category: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercent: number;
  noPercent: number;
  lastUpdated?: string;
}

export default function PollAnalytics() {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLivePoll = React.useCallback(async () => {
    try {
      const res = await fetch('/api/widgets/poll', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const yesVotes = Number(json.data.yesVotes) || 0;
          const noVotes = Number(json.data.noVotes) || 0;
          const totalVotes = yesVotes + noVotes;
          const yesPercent = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0;
          const noPercent = totalVotes > 0 ? 100 - yesPercent : 0;

          setPoll({
            ...json.data,
            yesVotes,
            noVotes,
            totalVotes,
            yesPercent,
            noPercent,
          });
          if (!isEditing) {
            setEditQuestion(json.data.question || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch poll analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isEditing]);

  useEffect(() => {
    fetchLivePoll();
    const interval = setInterval(fetchLivePoll, 10000);
    return () => clearInterval(interval);
  }, [fetchLivePoll]);

  const handleResetPoll = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    setIsResetting(true);
    setConfirmReset(false);

    try {
      const res = await fetch('/api/widgets/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPoll({
            ...json.data,
            yesVotes: 0,
            noVotes: 0,
            totalVotes: 0,
            yesPercent: 0,
            noPercent: 0,
          });
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('covai-poll-update', {
              detail: { counts: { yes: 0, no: 0 }, reset: true },
            })
          );
        }
        setFeedbackMessage({ type: 'success', text: 'Daily poll votes successfully reset to 0.' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        throw new Error('Server returned error');
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to reset poll votes. Try again.' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuestion.trim()) return;

    setIsSavingQuestion(true);
    try {
      const res = await fetch('/api/widgets/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editQuestion.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPoll({
            ...json.data,
            question: editQuestion.trim(),
            yesVotes: json.data.yesVotes || 0,
            noVotes: json.data.noVotes || 0,
          });
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('covai-poll-update', {
              detail: { counts: { yes: 0, no: 0 }, reset: true },
            })
          );
        }
        setIsEditing(false);
        setFeedbackMessage({ type: 'success', text: 'Poll question updated successfully with fresh vote counters.' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to update poll question.' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const total = poll ? poll.yesVotes + poll.noVotes : 0;
  const yesPct = total > 0 ? Math.round((poll!.yesVotes / total) * 100) : 0;
  const noPct = total > 0 ? 100 - yesPct : 0;

  return (
    <div className="w-full min-w-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with Live Sync Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                Covai Pulse • Daily Poll Analytics
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Real-time audience sentiment breakdown and vote distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchLivePoll}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
            title="Refresh poll data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Question'}</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Question or Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveQuestion} className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
            Update Active Poll Question
          </label>
          <textarea
            rows={2}
            value={editQuestion}
            onChange={(e) => setEditQuestion(e.target.value)}
            className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 dark:text-white"
            placeholder="Enter poll question..."
            required
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingQuestion}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {isSavingQuestion ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
              Active Question
            </span>
            <p className="text-sm font-black text-stone-900 dark:text-white leading-snug">
              &ldquo;{poll?.question || 'Loading active daily poll...'}&rdquo;
            </p>
          </div>

          <div className="shrink-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-3.5 py-2 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase text-stone-400 block tracking-wider">
              Total Responses
            </span>
            <span className="text-lg font-black text-stone-900 dark:text-white">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Live Percentage Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* YES Card */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
              YES Votes
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              YES: {yesPct}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {poll?.yesVotes ?? 0}
            </span>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              {total > 0 ? `${((poll?.yesVotes || 0) / total * 100).toFixed(1)}% of voters` : '0 responses'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${yesPct}%` }}
            />
          </div>
        </div>

        {/* NO Card */}
        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-red-700 dark:text-red-400 tracking-wider">
              NO Votes
            </span>
            <span className="text-base font-black text-red-600 dark:text-red-400">
              NO: {noPct}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-700 dark:text-red-300">
              {poll?.noVotes ?? 0}
            </span>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              {total > 0 ? `${((poll?.noVotes || 0) / total * 100).toFixed(1)}% of voters` : '0 responses'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-red-100 dark:bg-red-950/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{ width: `${noPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Action: Reset Poll Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
        <span className="text-stone-400 dark:text-stone-500 text-[11px] font-medium">
          Live percentages dynamically calculate from database vote counts (`(Votes / Total) * 100`).
        </span>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600">Are you sure?</span>
              <button
                type="button"
                onClick={handleResetPoll}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Now'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResetPoll}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Poll Votes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { PollAnalytics };
