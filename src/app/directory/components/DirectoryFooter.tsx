'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
export const DirectoryFooter: React.FC = () => {
  const handleScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-16 sm:mt-24 clear-both w-full max-w-[100vw] mx-0 px-4 sm:px-8 py-12 bg-[#f8f6f0] dark:bg-slate-900 border-t border-stone-300 dark:border-slate-800 transition-colors duration-200 box-border overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Top Row: Prominent Logo & Slogan + Quick Directory Jump Links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-stone-200 dark:border-slate-800 pb-6">
          <div className="flex flex-row items-center gap-2 md:gap-3 sm:gap-6 md:gap-10 text-left max-md:my-2">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center cursor-pointer hover:opacity-90 transition-opacity w-fit h-fit overflow-hidden"
              aria-label="Today's Coimbatore News Home"
            >
              <Image
                src="/images/logo.png"
                alt="Today's Coimbatore Directory"
                width={240}
                height={60}
                className="w-[170px] sm:w-[200px] md:w-[230px] h-auto object-contain block dark:hidden"
              />
              <Image
                src="/images/logo-dark.png"
                alt="Today's Coimbatore Directory"
                width={240}
                height={60}
                className="w-[170px] sm:w-[200px] md:w-[230px] h-auto object-contain hidden dark:block"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center justify-center font-semibold text-xs tracking-wider text-red-600 dark:text-red-400 uppercase px-3 py-1 md:px-4 md:py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 shadow-2xs whitespace-nowrap">
              BUSINESS DIRECTORY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleScrollToTop}
              className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:underline px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 cursor-pointer shadow-2xs"
            >
              ↑ Back to Top
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-gray-400 font-medium">
          <span>
            &copy; {new Date().getFullYear()} TodaysCoimbatore.com Business Directory. All verified listings are property of respective business owners.
          </span>
          <div className="flex items-center gap-3 font-bold flex-wrap">
            <span>
              Designed and Developed by{' '}
              <a
                href="https://techkeymonk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline text-red-600 transition-colors"
              >
                techkeymonk
              </a>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default DirectoryFooter;
