'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

export interface PollData {
  id?: string;
  question?: string;
  category?: string;
  yesVotes?: number;
  noVotes?: number;
  totalVotes?: number;
  yesPercent?: number;
  noPercent?: number;
  lastReset?: string;
}

export interface PollWidgetProps {
  pollData?: PollData;
}

export default function PollWidget({ pollData }: PollWidgetProps) {
  const [question, setQuestion] = useState(
    pollData?.question || 'Will Coimbatore Metro Rail Phase-1 significantly ease Avinashi Road traffic congestion?'
  );
  const [pollId, setPollId] = useState(pollData?.id || 'poll-coimbatore-metro-1');
  const [voted, setVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counts, setCounts] = useState({
    yes: pollData?.yesVotes ?? 0,
    no: pollData?.noVotes ?? 0,
  });

  const totalVotes = counts.yes + counts.no;
  const yesPercent = totalVotes > 0 ? Math.round((counts.yes / totalVotes) * 100) : 0;
  const noPercent = totalVotes > 0 ? Math.round((counts.no / totalVotes) * 100) : 0;

  const pollIdRef = React.useRef(pollId);
  useEffect(() => {
    pollIdRef.current = pollId;
  }, [pollId]);

  useEffect(() => {
    let isMounted = true;

    // Purge legacy fake vote key
    try {
      localStorage.removeItem('covai_pulse_vote_active');
    } catch {}

    const fetchLivePoll = async () => {
      try {
        const res = await fetch('/api/widgets/poll', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            const p = json.data;
            if (p.question) setQuestion(p.question);
            const activeId = p.id || 'poll-coimbatore-metro-1';
            pollIdRef.current = activeId;
            setPollId(activeId);

            const yes = typeof p.yesVotes === 'number' ? p.yesVotes : 0;
            const no = typeof p.noVotes === 'number' ? p.noVotes : 0;
            setCounts({ yes, no });

            // Check if current user has voted on THIS active poll
            const specificKey = `covai_pulse_vote_${activeId}`;
            const stored = localStorage.getItem(specificKey);

            if (yes === 0 && no === 0) {
              // Poll is completely fresh or reset by admin -> Unvote so buttons are active!
              try {
                localStorage.removeItem(specificKey);
                localStorage.removeItem('covai_pulse_vote_active');
              } catch {}
              setVoted(false);
              setSelectedOption(null);
            } else if (stored) {
              try {
                const parsed = JSON.parse(stored);
                const voteTime = parsed.votedAt ? new Date(parsed.votedAt).getTime() : 0;
                const resetTime = p.lastReset ? new Date(p.lastReset).getTime() : 0;

                if (resetTime > 0 && voteTime < resetTime) {
                  // Poll was reset after user voted
                  localStorage.removeItem(specificKey);
                  setVoted(false);
                  setSelectedOption(null);
                } else if (parsed.option === 'yes' || parsed.option === 'no') {
                  setVoted(true);
                  setSelectedOption(parsed.option);
                }
              } catch {
                setVoted(false);
                setSelectedOption(null);
              }
            } else {
              setVoted(false);
              setSelectedOption(null);
            }
          }
        }
      } catch (err) {
        console.warn('PollWidget fetch error:', err);
      }
    };

    fetchLivePoll();
    // 30s background poll interval, active only when tab is visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchLivePoll();
      }
    }, 30000);

    const handleVoteSync = (e: any) => {
      if (!isMounted) return;
      if (e.detail?.reset) {
        setCounts({ yes: 0, no: 0 });
        setVoted(false);
        setSelectedOption(null);
        try {
          localStorage.removeItem(`covai_pulse_vote_${pollIdRef.current}`);
          localStorage.removeItem('covai_pulse_vote_active');
        } catch {}
      } else if (e.detail?.counts) {
        setCounts(e.detail.counts);
      } else {
        fetchLivePoll();
      }
    };

    window.addEventListener('covai-poll-update', handleVoteSync as EventListener);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('covai-poll-update', handleVoteSync as EventListener);
    };
  }, []);

  const handleVote = async (option: 'yes' | 'no') => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    setSelectedOption(option);
    setVoted(true);

    const updatedCounts = {
      ...counts,
      [option]: (counts[option] || 0) + 1,
    };
    setCounts(updatedCounts);

    const specificKey = `covai_pulse_vote_${pollId}`;
    try {
      localStorage.setItem(
        specificKey,
        JSON.stringify({ option, votedAt: new Date().toISOString(), pollId })
      );
      localStorage.removeItem('covai_pulse_vote_active');
    } catch {}

    // Broadcast update event across all open widgets and tabs
    try {
      window.dispatchEvent(
        new CustomEvent('covai-poll-update', {
          detail: { option, counts: updatedCounts, pollId },
        })
      );
    } catch {}

    // API Call to register real live vote in Supabase backend
    try {
      const res = await fetch('/api/poll/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, option }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && typeof json.data.yesVotes === 'number') {
          setCounts({
            yes: json.data.yesVotes,
            no: json.data.noVotes,
          });
        }
      }
    } catch (e) {
      console.error('Failed to cast vote', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearVote = () => {
    try {
      localStorage.removeItem(`covai_pulse_vote_${pollId}`);
      localStorage.removeItem('covai_pulse_vote_active');
    } catch {}
    setVoted(false);
    setSelectedOption(null);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-2.5 shadow-xs dark:border-stone-800 dark:bg-slate-900 min-w-0 select-none overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-red-600 tracking-wider flex items-center gap-1.5 truncate min-w-0">
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">COVAI PULSE POLL</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      </div>

      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug mb-2.5 line-clamp-3">
        {question}
      </h4>

      {!voted ? (
        /* Interactive Voting Buttons (Visible for unvoted visitors) */
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleVote('yes')}
            className="flex items-center justify-center py-2 px-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <span>👍</span>
              <span>YES</span>
            </span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleVote('no')}
            className="flex items-center justify-center py-2 px-3 rounded-xl border-2 border-red-500 bg-red-50/50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-extrabold text-xs active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <span>👎</span>
              <span>NO</span>
            </span>
          </button>
        </div>
      ) : (
        /* Post-Vote Percentage Results Display */
        <div className="space-y-2.5 my-3">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className={`text-emerald-600 ${selectedOption === 'yes' ? 'font-black' : ''}`}>
                YES ({yesPercent}%)
              </span>
              <span className="text-gray-500 dark:text-gray-400">{counts.yes} {counts.yes === 1 ? 'vote' : 'votes'}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${yesPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className={`text-red-600 ${selectedOption === 'no' ? 'font-black' : ''}`}>
                NO ({noPercent}%)
              </span>
              <span className="text-gray-500 dark:text-gray-400">{counts.no} {counts.no === 1 ? 'vote' : 'votes'}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500 rounded-full"
                style={{ width: `${noPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <span>
            {voted ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Voted ({selectedOption?.toUpperCase()})
              </span>
            ) : (
              'Tap YES or NO to vote'
            )}
          </span>
          {voted && (
            <button
              type="button"
              onClick={handleClearVote}
              className="text-[10px] text-blue-500 hover:text-blue-700 underline cursor-pointer ml-1"
            >
              Change
            </button>
          )}
        </div>
        <span>{totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote cast' : 'votes cast'}</span>
      </div>
    </div>
  );
}

export { PollWidget, PollWidget as CovaiPulsePoll, PollWidget as DailyPoll };
