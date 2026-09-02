'use client';

import React, { useState } from 'react';

interface MobileBottomBannerProps {
  onClose?: () => void;
}

export const MobileBottomBanner: React.FC<MobileBottomBannerProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <aside
      aria-label="Mobile Sponsored Banner"
      className="block lg:hidden z-[80] fixed bottom-0 left-0 right-0 p-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-2xl pointer-events-auto transition-all"
    >
      <div className="relative w-full max-w-[390px] mx-auto h-[55px] sm:h-[65px] flex items-center justify-between gap-2 overflow-hidden px-2 rounded-lg bg-[#f8f6f0] dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
        
        {/* Close Button ('X') pinned to top-right */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss mobile banner ad"
          className="absolute -top-0.5 right-1 z-30 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white text-[10px] flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
        >
          ✕
        </button>

        {/* Banner Ad Content Link */}
        <a
          href="https://todayscoimbatore.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-2.5 w-full h-full min-w-0 pr-4"
        >
          {/* Ad Thumbnail */}
          <div className="relative h-[42px] sm:h-[50px] w-[50px] sm:w-[60px] rounded-md overflow-hidden shrink-0 border border-stone-300 dark:border-slate-600 bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=150&q=80"
              alt="Kongu Luxury Villas"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Ad Details */}
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-none mb-0.5">
              <span className="text-[8px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                Sponsored
              </span>
              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                • Covai Living
              </span>
            </div>
            <h4 className="text-[11px] sm:text-xs font-bold text-[#111111] dark:text-white truncate leading-tight">
              Kongu Luxury Smart Villas
            </h4>
            <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-300 truncate">
              Saravanampatti IT Hub · RERA Approved
            </p>
          </div>

          {/* CTA Action */}
          <div className="shrink-0">
            <span className="inline-flex items-center gap-0.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] sm:text-[11px] px-2.5 py-1 rounded-md shadow-xs whitespace-nowrap">
              <span>Explore</span>
              <span>&rarr;</span>
            </span>
          </div>
        </a>

      </div>
    </aside>
  );
};

export default MobileBottomBanner;
