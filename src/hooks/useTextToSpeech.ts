'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Natural Speech Humanizer & Cleaner
 * Expands journalistic acronyms, units, and adds natural breathing pauses
 */
export function cleanSpeechText(text: string): string {
  if (!text) return '';

  let cleaned = text
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/https?:\/\/\S+/gi, '') // Strip URLs
    .replace(/[\w.-]+@[\w.-]+\.\w+/gi, '') // Strip Emails
    .replace(/[#*`_~|\\<>{}\[\]"«»“”]/g, ' ') // Strip Markdown/formatting
    .replace(/\s+/g, ' ')
    .trim();

  // Natural Acronym & Unit Expansion for Fluent Human Cadence
  cleaned = cleaned
    .replace(/\bTNEB\b/g, 'T N E B')
    .replace(/\bTANGEDCO\b/g, 'Tangedco')
    .replace(/\bAQI\b/g, 'A Q I')
    .replace(/\bCEO\b/g, 'C E O')
    .replace(/\bCEOs\b/g, 'C E Os')
    .replace(/\bIT\b(?=[ ,.])/g, 'I T')
    .replace(/\bAI\b/g, 'A I')
    .replace(/\bkm\/h\b/gi, ' kilometers per hour ')
    .replace(/\bkm\b/gi, ' kilometers ')
    .replace(/\bsq\.?\s?ft\b/gi, ' square feet ')
    .replace(/\bcr\.?\b/gi, ' crores ')
    .replace(/\blakhs?\b/gi, ' lakhs ')
    .replace(/\bmins?\b/gi, ' minutes ')
    .replace(/\bhrs?\b/gi, ' hours ')
    .replace(/\bapprox\.?\b/gi, ' approximately ')
    .replace(/\bgovt\.?\b/gi, ' government ')
    .replace(/\bdept\.?\b/gi, ' department ')
    .replace(/\bcorp\.?\b/gi, ' corporation ')
    .replace(/\bvs\.?\b/gi, ' versus ')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/–|—/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Clean DOM text extraction for speech reader
 */
export function fetchDomTextToRead(fallbackText = ''): string {
  if (typeof document === 'undefined') return fallbackText;

  try {
    const titleText = document.querySelector('h1')?.innerText || '';
    const bodyParagraphs = Array.from(
      document.querySelectorAll('article p, main p, .article-content p, .prose p')
    )
      .map((p) => (p as HTMLElement).innerText || '')
      .filter((text) => text.trim().length > 0)
      .join('. ');

    const textToRead = `${titleText}. ${bodyParagraphs}`.trim();
    if (textToRead.length > 5) {
      return cleanSpeechText(textToRead);
    }
  } catch (e) {}

  return cleanSpeechText(fallbackText);
}

/**
 * Checks if active language is strictly English
 */
export function isEnglishActive(): boolean {
  if (typeof document === 'undefined') return true;

  try {
    const htmlLang = (
      document.documentElement.lang ||
      document.querySelector('html')?.getAttribute('lang') ||
      ''
    ).toLowerCase();

    const cookieMatch = document.cookie.match(/googtrans=\/(?:auto|en)\/([a-zA-Z]+)/);
    const cookieLang = cookieMatch ? cookieMatch[1].toLowerCase() : '';
    const storageLang = (localStorage.getItem('t_covai_site_lang') || '').toLowerCase();

    if (
      (htmlLang && !htmlLang.startsWith('en')) ||
      (cookieLang && !cookieLang.startsWith('en')) ||
      (storageLang && !storageLang.startsWith('en'))
    ) {
      return false;
    }
  } catch (e) {}

  return true;
}

/**
 * Splits text into small sentence & phrase chunks for human-like breathing cadence
 */
function splitIntoSpokenChunks(text: string): string[] {
  if (!text) return [];

  // Split on sentence boundaries and major punctuation pauses
  const rawSentences = text.split(/(?<=[.!?\n\u0964\u0D79])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Split overly long sentences at clause boundaries (commas, semicolons)
    if (trimmed.length > 140) {
      const clauses = trimmed.split(/(?<=[,;:])\s+/);
      for (const clause of clauses) {
        const cTrimmed = clause.trim();
        if (!cTrimmed) continue;

        if ((currentChunk + ' ' + cTrimmed).length > 130) {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = cTrimmed;
        } else {
          currentChunk = currentChunk ? currentChunk + ' ' + cTrimmed : cTrimmed;
        }
      }
    } else {
      if ((currentChunk + ' ' + trimmed).length > 130) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

export interface UseTextToSpeechReturn {
  speak: (textOverride?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  isEnglish: boolean;
}

let globalActiveUtterance: SpeechSynthesisUtterance | null = null;

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnglish, setIsEnglish] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const chunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);

  const checkLanguage = useCallback(() => {
    const english = isEnglishActive();
    setIsEnglish(english);
    if (!english && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    checkLanguage();

    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        try {
          const v = window.speechSynthesis.getVoices();
          if (v && v.length > 0) {
            setAvailableVoices(v);
          }
        } catch (e) {}
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // MutationObserver to detect dynamic translation language changes
    const observer = new MutationObserver(() => {
      checkLanguage();
    });

    if (document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang', 'class'],
        subtree: false,
      });
    }

    window.addEventListener('languagechange', checkLanguage);
    window.addEventListener('storage', checkLanguage);

    return () => {
      observer.disconnect();
      window.removeEventListener('languagechange', checkLanguage);
      window.removeEventListener('storage', checkLanguage);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, [checkLanguage]);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    chunksRef.current = [];
    currentChunkIndexRef.current = 0;
    globalActiveUtterance = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {}
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {}
      setIsPaused(false);
      setIsPlaying(true);
    }
  }, []);

  /**
   * ADVANCED NEURAL & NATURAL VOICE SELECTION ENGINE
   * Ranks voices to choose warm, lifelike human tones and strictly filters out robotic SAPI 5 legacy voices.
   */
  const getBestHumanVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Voice Quality Scoring Function
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      const name = v.name.toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      let score = 0;

      // Must be English
      if (!lang.startsWith('en')) {
        return -1000;
      }

      // 1. Natural / Neural Tier (Highest Lifelike Quality)
      if (
        name.includes('natural') ||
        name.includes('neural') ||
        name.includes('online') ||
        name.includes('enhanced') ||
        name.includes('premium') ||
        name.includes('multilingual')
      ) {
        score += 120;
      }

      // 2. Preferred Human Female Voice Models
      if (
        name.includes('jenny') ||
        name.includes('aria') ||
        name.includes('ava') ||
        name.includes('sonia') ||
        name.includes('neerja') ||
        name.includes('samantha') ||
        name.includes('siri') ||
        name.includes('karen') ||
        name.includes('serena') ||
        name.includes('swara')
      ) {
        score += 80;
      }

      // 3. Google & Apple Neural Voices
      if (
        name.includes('google us english') ||
        name.includes('google uk english female') ||
        name.includes('google english')
      ) {
        score += 70;
      }

      // 4. Female preference
      if (name.includes('female')) {
        score += 20;
      }

      // 5. English dialect preference (US, UK, IN)
      if (lang.includes('us') || lang.includes('gb') || lang.includes('in')) {
        score += 15;
      }

      // 6. PENALIZE Old Robotic Legacy Desktop Voices (SAPI 5 / eSpeak / Zira / David)
      if (
        name.includes('desktop') ||
        name.includes('espeak') ||
        name.includes('zira') ||
        name.includes('david') ||
        name.includes('hazel') ||
        name.includes('sam') ||
        name.includes('mssdk')
      ) {
        score -= 100;
      }

      return score;
    };

    const sortedVoices = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return sortedVoices[0] || voices[0] || null;
  }, [availableVoices]);

  const speakChunk = useCallback(
    (index: number) => {
      if (isCancelledRef.current || index >= chunksRef.current.length) {
        setIsPlaying(false);
        setIsPaused(false);
        chunksRef.current = [];
        currentChunkIndexRef.current = 0;
        globalActiveUtterance = null;
        return;
      }

      const text = chunksRef.current[index];
      if (!text || !text.trim()) {
        speakChunk(index + 1);
        return;
      }

      currentChunkIndexRef.current = index;

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsPlaying(false);
        return;
      }

      const humanVoice = getBestHumanVoice();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = humanVoice?.lang || 'en-US';
      if (humanVoice) {
        utterance.voice = humanVoice;
      }

      // Natural Human Journalist Acoustic Parameters
      utterance.pitch = 1.03; // Warm, natural vocal inflection (avoids flat robotic drone)
      utterance.rate = 0.93; // Calibrated human newsreader pace (avoids rushed machine delivery)
      utterance.volume = 1.0;

      utterance.onstart = () => {
        if (!isCancelledRef.current) {
          setIsPlaying(true);
          setIsPaused(false);
        }
      };

      utterance.onend = () => {
        if (!isCancelledRef.current) {
          speakChunk(index + 1);
        }
      };

      utterance.onerror = (e) => {
        if (!isCancelledRef.current && e.error !== 'canceled' && e.error !== 'interrupted') {
          speakChunk(index + 1);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
        }
      };

      globalActiveUtterance = utterance;

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    },
    [getBestHumanVoice]
  );

  const speak = useCallback(
    (textOverride?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        alert('Speech synthesis is not supported on this browser.');
        return;
      }

      // If non-English, do not speak
      if (!isEnglishActive()) {
        window.speechSynthesis.cancel();
        return;
      }

      // Flush queue prior to speech
      isCancelledRef.current = false;
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      // Clean DOM text speech
      const textToRead = textOverride && textOverride.trim()
        ? cleanSpeechText(textOverride)
        : fetchDomTextToRead();

      if (!textToRead || !textToRead.trim()) {
        console.warn('No text found to read.');
        return;
      }

      const chunks = splitIntoSpokenChunks(textToRead);
      if (chunks.length === 0) return;

      chunksRef.current = chunks;
      currentChunkIndexRef.current = 0;

      setIsPlaying(true);
      setIsPaused(false);

      speakChunk(0);
    },
    [speakChunk]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isEnglish,
  };
}

export default useTextToSpeech;
