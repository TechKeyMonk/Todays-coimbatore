import React from 'react';

export interface ELI5SummaryPluginProps {
  title?: string;
  points?: string[];
  readingTime?: string;
  aiModel?: string;
}

export const ELI5SummaryPlugin: React.FC<ELI5SummaryPluginProps> = ({
  title = 'ELI5 AI Fast Digest: Coimbatore Metro Phase-1 Expansion',
  points = [
    '🚅 44 km Dual Corridors: Phase 1 connects Ukkadam to Coimbatore Airport via Avinashi Road and Sathyamangalam Highway.',
    '⏱️ Major Commute Relief: Travel time between Gandhipuram Central and Airport slashed from 50+ minutes to just 16 minutes.',
    '📍 Strategic Interchanges: Key multi-modal hubs at Ukkadam Bus Port, Lakshmi Mills, Hope College (TIDEL Park feeder), and Airport.',
    '💰 ₹9,424 Cr Investment: Jointly funded by Central & State governments with preliminary utility diversion starting next quarter.',
  ],
  readingTime = '45-sec read',
  aiModel = 'Covai AI Engine',
}) => {
  return (
    <div className="p-4 bg-red-50/40 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl shadow-xs my-4 relative overflow-hidden transition-colors duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-200 dark:border-red-900/60 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-[11px] font-black tracking-wider uppercase">
            <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14H8V9a2 2 0 114 0v5z" />
            </svg>
            ELI5 Summary
          </span>
          <span className="text-xs font-black text-[#111111] dark:text-gray-100">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#444444] dark:text-gray-400 font-bold">
          <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 font-extrabold text-[#111111] dark:text-gray-100">
            ⚡ {readingTime}
          </span>
          <span className="hidden sm:inline text-[#444444] dark:text-gray-400 font-bold">• {aiModel}</span>
        </div>
      </div>

      {/* Bullet Takeaways */}
      <ul className="space-y-2 text-xs sm:text-sm text-[#111111] dark:text-gray-200">
        {points.map((pt, idx) => (
          <li key={idx} className="flex items-start gap-2 leading-relaxed">
            <span className="text-red-600 dark:text-red-400 font-black mt-0.5">•</span>
            <span className="font-semibold text-[#111111] dark:text-gray-200">{pt}</span>
          </li>
        ))}
      </ul>

      {/* Footer Tag */}
      <div className="mt-3 pt-2.5 border-t border-red-200 dark:border-red-900/60 flex items-center justify-between text-[11px] text-[#333333] dark:text-gray-400 font-medium">
        <span className="font-semibold">
          💡 Simplified for quick reading by TodaysCoimbatore Editorial AI
        </span>
        <button
          aria-label="Listen to Audio Summary"
          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline font-black"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Audio Digest
        </button>
      </div>
    </div>
  );
};

export default ELI5SummaryPlugin;
