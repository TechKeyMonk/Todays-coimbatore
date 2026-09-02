'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

interface DirectoryHeaderProps {
  activeView?: 'home' | 'directory';
  onViewChange?: (view: 'home' | 'directory') => void;
  categoriesRef?: React.RefObject<HTMLElement | null>;
}

export const DirectoryHeader: React.FC<DirectoryHeaderProps> = ({
  activeView = 'directory',
  onViewChange,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-20 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xs z-30 font-sans flex items-center">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center h-full">
        {/* 1. BRAND LOGO (BROAD & PROMINENT SCALE) */}
        <div className="flex items-center shrink-0">
          <Link href="/" aria-label="Today's Coimbatore Home" className="block cursor-pointer">
            <img
              src="/logo.png"
              alt="Today's Coimbatore"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain max-w-[180px] sm:max-w-[240px] md:max-w-[280px] block dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="Today's Coimbatore"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain max-w-[180px] sm:max-w-[240px] md:max-w-[280px] hidden dark:block"
            />
          </Link>
        </div>

        {/* 2. DIRECTORY BADGE & THEME TOGGLE */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-black text-[11px] uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>24/7 Verified Business Network</span>
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center justify-center"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default DirectoryHeader;
