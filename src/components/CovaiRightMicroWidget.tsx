'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, RotateCw } from 'lucide-react';

const COVAI_FACTS = [
  'Siruvani River in Coimbatore is globally recognized as the 2nd tastiest natural drinking water in the world!',
  "Coimbatore manufactures over 75% of India's total domestic and agricultural water pumps and motors.",
  'Inventor G.D. Naidu from Coimbatore engineered India’s first indigenous electric motor in 1937.',
  "Known as the 'Manchester of South India', Coimbatore houses over 25,000 precision engineering and textile units.",
  'The 10.1 km Avinashi Road Elevated Corridor is one of Tamil Nadu’s longest 4-lane urban flyovers.',
];

const TRENDING_HASHTAGS = [
  '#CoimbatoreMetro',
  '#AvinashiFlyover',
  '#SmartCityCovai',
  '#CovaiTech',
  '#Siruvani',
];

export default function CovaiRightMicroWidget() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % COVAI_FACTS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const nextFact = () => {
    setFactIndex((prev) => (prev + 1) % COVAI_FACTS.length);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2">
      {/* Trivia Section */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-gray-400 pb-1 border-b border-stone-100 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Did You Know?</span>
          </span>
          <button
            type="button"
            onClick={nextFact}
            title="Next Fact"
            className="text-[9px] font-bold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer inline-flex items-center gap-1"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>Next</span>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug font-medium text-stone-700 dark:text-stone-300 min-h-[44px]">
          {COVAI_FACTS[factIndex]}
        </p>
      </div>

      {/* Trending Hashtags Section */}
      <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
        <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-red-600" />
          <span>Trending Covai</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {TRENDING_HASHTAGS.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
