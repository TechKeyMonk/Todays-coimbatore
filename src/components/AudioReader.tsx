'use client';

import React from 'react';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { Mic, Headphones, Play, Pause, Square } from 'lucide-react';

export interface AudioReaderProps {
  textToRead?: string;
  title?: string;
  author?: string;
  lang?: string;
  compact?: boolean;
}

export const AudioReader: React.FC<AudioReaderProps> = ({
  textToRead,
  title,
  author,
  lang,
  compact = false,
}) => {
  const {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isEnglish,
  } = useTextToSpeech();

  // 1. CONDITIONAL VISIBILITY: Only render if English. If non-English, hide completely.
  if (!isEnglish) {
    return null;
  }

  const fullContentString = `${title ? title + '. ' : ''}${textToRead || ''}`.trim();
  const wordCount = fullContentString.split(/\s+/).filter(Boolean).length;
  const listenMinutes = Math.max(1, Math.ceil(wordCount / 120));

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak();
    }
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stop();
  };

  return (
    <div
      className={`relative z-10 rounded-2xl border transition-all duration-300 w-full max-w-full min-h-[2.5rem] h-auto box-border ${
        isPlaying
          ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800 shadow-sm'
          : 'bg-[#fcfbf7] dark:bg-slate-900/90 border-stone-300 dark:border-slate-800 hover:border-stone-400 dark:hover:border-slate-700'
      } ${compact ? 'p-3' : 'px-4 py-3 sm:px-5 sm:py-4'}`}
    >
      <div className="min-h-[2.5rem] h-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full break-words">
        
        {/* Left Side: Avatar, Title & AI Voice Meta */}
        <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isPlaying
                ? 'bg-red-600 text-white animate-pulse shadow-md'
                : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-gray-200'
            }`}
          >
            {isPlaying ? <Mic className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </div>

          <div className="min-w-0 flex-1 break-words">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                Voice AI Reader
              </span>
              
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-gray-200 border border-stone-300 dark:border-slate-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Female Voice (English)</span>
              </span>

              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-gray-400">
                {listenMinutes}m Listen
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-gray-100 break-words mt-0.5 leading-snug">
              {isPlaying
                ? 'AI voice reading story...'
                : isPaused
                ? 'Audio Paused'
                : 'Listen to Story'}
            </h4>
          </div>
        </div>

        {/* Right Side: Player Controls */}
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-center w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePlayToggle}
            aria-label={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Listen'}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-transform active:scale-95 cursor-pointer min-h-[38px] touch-manipulation"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>
              {isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Listen'}
            </span>
          </button>

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStopClick}
              aria-label="Stop"
              className="p-2 rounded-xl bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-800 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>

      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="mt-3 w-full bg-stone-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-red-600 h-full w-full animate-pulse rounded-full" />
        </div>
      )}
    </div>
  );
};

export default AudioReader;
