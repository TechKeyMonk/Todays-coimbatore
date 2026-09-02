'use client';

import React, { useState } from 'react';

export interface SideRailProps {
  onClose?: () => void;
  className?: string;
}

export const LeftAdRail: React.FC<SideRailProps> = ({ onClose, className }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={className || "sticky top-24 self-start hidden xl:block h-fit z-10 w-[240px] shrink-0 mt-0 pt-0"}>
      {/* Flush Top Sponsored Label (Eliminating top gap) */}
      <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-stone-500 dark:text-gray-400 uppercase tracking-wider mb-1 px-1">
        <span>Advertisement</span>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-600 dark:text-emerald-400 font-black">SPONSORED</span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Ad"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-md p-3 flex flex-col justify-between overflow-hidden transition-all duration-300 isolation-isolate">
        {/* Top Section */}
        <div className="space-y-2">
          {/* Ad Visual */}
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-900 border border-stone-200 dark:border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"
              alt="Kongu Luxury Villas Saravanampatti"
              className="!filter-none !mix-blend-normal !opacity-100 dark:!filter-none object-cover mx-auto block ad-banner-media w-full h-full"
            />
            <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/80 text-white text-[7px] font-black uppercase tracking-wider">
              PREMIUM LIVING
            </span>
          </div>

          {/* Ad Copy */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wide block">
              Kongu Living
            </span>
            <h4 className="text-xs font-bold text-[#111111] dark:text-white leading-tight">
              Luxury Smart Villas in Saravanampatti
            </h4>
            <p className="text-[10px] leading-snug text-stone-600 dark:text-stone-300">
              DTCP &amp; RERA approved 3 &amp; 4 BHK gated community with clubhouse.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="pt-2 border-t border-stone-100 dark:border-slate-800 space-y-1 text-[9px] text-stone-700 dark:text-stone-300 font-medium">
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>Saravanampatti IT Hub</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>100% Vastu Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>Solar Microgrid &amp; EV</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>24x7 Security &amp; Water</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-1.5 mt-auto">
          <div className="text-[8px] text-stone-400 font-bold text-center uppercase tracking-wider">
            Verified Covai Partner
          </div>
          <a
            href="https://todayscoimbatore.com"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-center gap-1 w-full bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-[10px] font-black py-1.5 px-2 rounded-lg text-center transition-colors shadow-xs"
          >
            <span>Explore Villas</span>
            <span className="text-xs">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const RightAdRail: React.FC<SideRailProps> = ({ onClose, className }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={className || "sticky top-24 self-start hidden xl:block h-fit z-10 w-[240px] shrink-0 mt-0 pt-0"}>
      {/* Flush Top Sponsored Label (Eliminating top gap) */}
      <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-stone-500 dark:text-gray-400 uppercase tracking-wider mb-1 px-1">
        <span>Advertisement</span>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-600 dark:text-emerald-400 font-black">SPONSORED</span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Ad"
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-md p-3 flex flex-col justify-between overflow-hidden transition-all duration-300 isolation-isolate">
        {/* Top Section */}
        <div className="space-y-2">
          {/* Ad Visual */}
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-900 border border-stone-200 dark:border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"
              alt="ELGi Industrial Air Compressors"
              className="!filter-none !mix-blend-normal !opacity-100 dark:!filter-none object-cover mx-auto block ad-banner-media w-full h-full"
            />
            <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-emerald-800 text-white text-[7px] font-black uppercase tracking-wider">
              INDUSTRIAL TECH
            </span>
          </div>

          {/* Ad Copy */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wide block">
              ELGi Precision
            </span>
            <h4 className="text-xs font-bold text-[#111111] dark:text-white leading-tight">
              Rotary Air Compressors for Covai MSMEs
            </h4>
            <p className="text-[10px] leading-snug text-stone-600 dark:text-stone-300">
              Cut industrial power consumption by up to 28% with IoT smart monitors.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="pt-2 border-t border-stone-100 dark:border-slate-800 space-y-1 text-[9px] text-stone-700 dark:text-stone-300 font-medium">
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>Direct Factory Delivery</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>5-Year Extended Warranty</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>Covai 24/7 Mobile Service</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>Zero-Cost Energy Audit</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-1.5 mt-auto">
          <div className="text-[8px] text-stone-400 font-bold text-center uppercase tracking-wider">
            Verified Covai Partner
          </div>
          <a
            href="https://todayscoimbatore.com"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-center gap-1 w-full bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-[10px] font-black py-1.5 px-2 rounded-lg text-center transition-colors shadow-xs"
          >
            <span>Get Quotation</span>
            <span className="text-xs">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const SideAdRails: React.FC = () => {
  const [showBanners, setShowBanners] = useState(true);

  if (!showBanners) return null;

  return (
    <>
      <LeftAdRail onClose={() => setShowBanners(false)} />
      <RightAdRail onClose={() => setShowBanners(false)} />
    </>
  );
};

export default SideAdRails;
