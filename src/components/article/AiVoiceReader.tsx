'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface AiVoiceReaderProps {
  text?: string;
  title?: string;
  author?: string;
  compact?: boolean;
}

export default function AiVoiceReader({
  text = '',
  title = '',
  author = '',
  compact = false,
}: AiVoiceReaderProps) {
  const [isEnglish, setIsEnglish] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check language condition (strictly English only)
  const checkIsEnglish = useCallback(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = (localStorage.getItem('t_covai_site_lang') || 'en').toLowerCase();
      const cookieMatch = document.cookie.match(/googtrans=\/(?:auto|en)\/([a-zA-Z]+)/);
      const cookieLang = cookieMatch ? cookieMatch[1].toLowerCase() : '';
      const htmlLang = (document.documentElement.lang || 'en').toLowerCase();

      if (
        (stored && !stored.startsWith('en')) ||
        (cookieLang && !cookieLang.startsWith('en')) ||
        (htmlLang && !htmlLang.startsWith('en'))
      ) {
        return false;
      }
    } catch (e) {}
    return true;
  }, []);

  // Language change listener & synthesis setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    synthRef.current = window.speechSynthesis;
    setIsEnglish(checkIsEnglish());

    const handleLanguageChangeEvent = (e: any) => {
      const lang = (e?.detail?.lang || '').toLowerCase();
      if (lang && !lang.startsWith('en')) {
        setIsEnglish(false);
        if (synthRef.current) {
          synthRef.current.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
      } else {
        setIsEnglish(true);
      }
    };

    window.addEventListener('languageChange', handleLanguageChangeEvent);
    window.addEventListener('storage', () => setIsEnglish(checkIsEnglish()));

    return () => {
      window.removeEventListener('languageChange', handleLanguageChangeEvent);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [checkIsEnglish]);

  // Clean and prepare spoken text
  const getFullSpokenText = useCallback(() => {
    const raw = `${title ? title + '. ' : ''}${text || ''}`.trim();
    return raw
      .replace(/<[^>]*>/g, '')
      .replace(/[~@#$%^&*_+=\\<>|\[\]{}"«»“”–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [title, text]);

  // Select optimal English Female Voice
  const getFemaleVoice = useCallback(() => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) return null;

    // Search specifically for high quality female voices
    const femaleVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB') || v.lang.includes('IN')) &&
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('google us english') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('ava') ||
          v.name.toLowerCase().includes('jenny') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('siri'))
    );

    return femaleVoice || voices.find((v) => v.lang.startsWith('en')) || voices[0];
  }, []);

  const handlePlay = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    synthRef.current.cancel();
    const spokenContent = getFullSpokenText();
    if (!spokenContent) return;

    const utterance = new SpeechSynthesisUtterance(spokenContent);
    utterance.lang = 'en-US';
    utterance.pitch = 1.0;
    utterance.rate = 0.95;

    const voice = getFemaleVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // IF NOT ENGLISH: DO NOT RENDER THIS COMPONENT
  if (!isEnglish) {
    return null;
  }

  const wordCount = getFullSpokenText().split(/\s+/).filter(Boolean).length;
  const listenMinutes = Math.max(1, Math.ceil(wordCount / 120));

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 w-full max-w-full box-border font-sans ${
        isPlaying
          ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 shadow-sm'
          : 'bg-[#fcfbf7] dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-stone-300'
      } ${compact ? 'p-3' : 'px-4 py-3 sm:px-5 sm:py-3.5'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Avatar & Meta */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
              isPlaying
                ? 'bg-red-600 text-white animate-pulse shadow-md'
                : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-gray-200'
            }`}
          >
            {isPlaying ? '🎙️' : '🎧'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                AI Voice Reader
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-gray-200 flex items-center gap-1 border border-stone-300 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Female Voice (EN)</span>
              </span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-gray-400">
                {listenMinutes} min listen
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate mt-0.5">
              {isPlaying
                ? 'Speaking article aloud...'
                : isPaused
                ? 'Audio playback paused'
                : 'Listen to this article with Natural AI Voice'}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span>⏸</span>
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span>▶</span>
              <span>{isPaused ? 'Resume' : 'Play Audio'}</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-gray-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              title="Stop playback"
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { AiVoiceReader };
