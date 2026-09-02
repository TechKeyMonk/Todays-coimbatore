'use client';

import React, { useState } from 'react';
import { Sparkles, Zap, MapPin, BookOpen } from 'lucide-react';

interface AiSummaryProps {
  title: string;
  excerpt?: string;
  content?: string;
  compact?: boolean;
  category?: string;
}

export const AiSummary: React.FC<AiSummaryProps> = ({
  title,
  excerpt,
  content,
  compact = true,
  category = 'News',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryPoints, setSummaryPoints] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOpen && summaryPoints) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (summaryPoints) {
      return; // Already generated
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, content }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.points && Array.isArray(data.points)) {
          setSummaryPoints(data.points);
        } else {
          setSummaryPoints([
            `Fast Takeaway: ${title}`,
            `Local Context: ${excerpt || 'Coimbatore hyper-local editorial update.'}`,
            'Read the full story below for verified district details.',
          ]);
        }
      } else {
        throw new Error('Summary fetch failed');
      }
    } catch (err) {
      setSummaryPoints([
        `Fast Takeaway: ${title}`,
        `Local Context: ${excerpt || 'Coimbatore hyper-local editorial update.'}`,
        'Complete story verified by TodaysCoimbatore Editorial Desk.',
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full my-2 relative z-10">
      {/* On-Demand Trigger Button */}
      <button
        type="button"
        onClick={handleGenerateSummary}
        aria-label="Summarize article with AI"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 backdrop-blur-md shadow-xs touch-manipulation cursor-pointer ${
          isOpen
            ? 'bg-red-600 text-white shadow-sm'
            : 'bg-white/85 dark:bg-slate-800/85 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{isOpen ? 'Close AI Digest' : 'Summarize with AI'}</span>
        {isLoading && (
          <svg className="animate-spin h-3 w-3 text-current ml-1" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </button>

      {/* Sleek Collapsible Glassmorphism Summary Card */}
      {isOpen && (
        <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-[#f8f6f0]/95 dark:bg-slate-900/95 backdrop-blur-md border border-red-200 dark:border-red-900/60 shadow-md text-xs transition-all animate-in fade-in slide-in-from-top-1 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-200 dark:border-red-900/50 pb-2 mb-2">
            <div className="flex items-center gap-1.5 font-black text-red-600 dark:text-red-400 uppercase tracking-wider text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Covai AI Fast Digest</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
              30s Read
            </span>
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="py-3 flex items-center justify-center gap-2 text-stone-500 dark:text-gray-400 font-semibold">
              <svg className="animate-spin h-4 w-4 text-red-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Distilling key facts from report...</span>
            </div>
          ) : (
            <ul className="space-y-1.5 text-stone-800 dark:text-gray-200">
              {summaryPoints?.map((pt, index) => (
                <li key={index} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-red-600 dark:text-red-400 font-black shrink-0">•</span>
                  <span className="font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Footer note */}
          <div className="mt-2 pt-1.5 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-[9px] text-stone-400 dark:text-gray-500 font-medium">
            <span>Verified by TodaysCoimbatore AI Desk</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-red-600 dark:text-red-400 hover:underline font-bold"
            >
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSummary;
