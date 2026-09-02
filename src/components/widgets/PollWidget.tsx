'use client';

import React, { useState, useEffect } from 'react';
import dbService from '../../services/db';
import { BarChart3, CheckCircle2 } from 'lucide-react';

interface PollData {
  id: string;
  question: string;
  category: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercent: number;
  noPercent: number;
}

export default function PollWidget() {
  const [poll, setPoll] = useState<PollData>({
    id: 'poll-daily-1',
    question: 'Will Coimbatore Metro Rail Phase-1 significantly ease Avinashi Road traffic?',
    category: 'INFRASTRUCTURE & CIVIC',
    yesVotes: 0,
    noVotes: 0,
    totalVotes: 0,
    yesPercent: 0,
    noPercent: 0,
  });

  const [hasVoted, setHasVoted] = useState(false);
  const [userChoice, setUserChoice] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check if user already voted in this session/device
    const storedVote = localStorage.getItem('covai_pulse_vote_active');
    if (storedVote) {
      setHasVoted(true);
      setUserChoice(storedVote as 'yes' | 'no');
    }

    const fetchLivePoll = async () => {
      try {
        const res = await fetch('/api/widgets/poll');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setPoll(json.data);
          }
        }
      } catch (e) {
        // Fallback: auto-generate poll question from latest published DB story
        try {
          const articles = await dbService.getArticles();
          if (articles && articles.length > 0) {
            const topStory = articles[0];
            if (isMounted && topStory.title) {
              setPoll((prev) => ({
                ...prev,
                question: `Do you support: "${topStory.title.slice(0, 65)}..."?`,
                category: topStory.category || 'COMMUNITY POLL',
              }));
            }
          }
        } catch {}
      }
    };

    fetchLivePoll();
    const interval = setInterval(fetchLivePoll, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleVote = async (choice: 'yes' | 'no') => {
    if (hasVoted) return;

    setUserChoice(choice);
    setHasVoted(true);
    localStorage.setItem('covai_pulse_vote_active', choice);

    try {
      const res = await fetch('/api/widgets/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: choice }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPoll(json.data);
        }
      }
    } catch (err) {
      // Local optimistic update
      setPoll((prev) => {
        const newYes = choice === 'yes' ? prev.yesVotes + 1 : prev.yesVotes;
        const newNo = choice === 'no' ? prev.noVotes + 1 : prev.noVotes;
        const total = newYes + newNo;
        return {
          ...prev,
          yesVotes: newYes,
          noVotes: newNo,
          totalVotes: total,
          yesPercent: total > 0 ? Math.round((newYes / total) * 100) : 0,
          noPercent: total > 0 ? Math.round((newNo / total) * 100) : 0,
        };
      });
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-2 shrink-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-extrabold border-b border-stone-100 dark:border-slate-800 pb-1.5">
        <span className="text-red-600 dark:text-red-500 uppercase tracking-wider font-black flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>COVAI PULSE</span>
        </span>
        <span className="text-[9px] text-stone-500 dark:text-gray-400 font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800">
          DAILY POLL
        </span>
      </div>

      {/* Question */}
      <p className="text-[11px] font-bold text-stone-800 dark:text-gray-200 leading-snug">
        {poll.question}
      </p>

      {/* Voting Actions or Results */}
      {hasVoted ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-600 dark:text-gray-400">
            <span className={userChoice === 'yes' ? 'text-emerald-600 font-black' : ''}>YES ({poll.yesPercent}%)</span>
            <span className={userChoice === 'no' ? 'text-red-600 font-black' : ''}>NO ({poll.noPercent}%)</span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden bg-stone-200 dark:bg-slate-700 flex">
            <div style={{ width: `${poll.yesPercent}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
            <div style={{ width: `${poll.noPercent}%` }} className="bg-red-500 h-full transition-all duration-500" />
          </div>

          <div className="flex items-center justify-between text-[9px] text-stone-400 font-bold pt-0.5">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Voted</span>
            </span>
            <span>{poll.totalVotes.toLocaleString()} {poll.totalVotes === 1 ? 'vote' : 'votes'} cast</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 text-xs font-bold pt-0.5">
          <button
            type="button"
            onClick={() => handleVote('yes')}
            className="py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 border border-emerald-200/60 dark:border-emerald-800 transition-colors cursor-pointer text-[11px] font-black text-center"
          >
            YES {poll.totalVotes > 0 ? `(${poll.yesPercent}%)` : ''}
          </button>
          <button
            type="button"
            onClick={() => handleVote('no')}
            className="py-1.5 rounded-lg bg-stone-100 text-stone-800 hover:bg-red-600 hover:text-white dark:bg-slate-800 dark:text-stone-300 dark:hover:bg-red-600 border border-stone-200 dark:border-slate-700 transition-colors cursor-pointer text-[11px] font-black text-center"
          >
            NO {poll.totalVotes > 0 ? `(${poll.noPercent}%)` : ''}
          </button>
        </div>
      )}
    </div>
  );
}

export { PollWidget };
