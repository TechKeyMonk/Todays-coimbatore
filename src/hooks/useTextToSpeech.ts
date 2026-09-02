'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function cleanSpeechText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[~@#$%^&*_+=\\<>|\[\]{}"«»“”–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
      .join(' ');

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
 * Splits text into small sentence chunks for uninterrupted browser speech synthesis
 */
function splitIntoSpokenChunks(text: string): string[] {
  if (!text) return [];
  const rawSentences = text.split(/(?<=[.!?\n\u0964\u0D79])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).length > 160) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
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

  // 2. BEST FEMALE VOICE ENGINE SELECTION (ENGLISH ONLY)
  const getBestFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const femaleVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Female') ||
            v.name.includes('Google US English') ||
            v.name.includes('Samantha') ||
            v.name.includes('Zira') ||
            v.name.includes('Victoria') ||
            v.name.includes('Natural') ||
            v.name.includes('Jenny') ||
            v.name.includes('Aria'))
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    return femaleVoice || null;
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

      const femaleVoice = getBestFemaleVoice();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = femaleVoice?.lang || 'en-US';
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      utterance.pitch = 1.0; // Smooth natural pitch
      utterance.rate = 0.95; // Clear natural reading speed

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
    [getBestFemaleVoice]
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
