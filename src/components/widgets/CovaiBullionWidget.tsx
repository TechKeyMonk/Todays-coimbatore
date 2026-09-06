'use client';

import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BullionData {
  gold22k: string;
  gold24k: string;
  silver1g: string;
  silver1kg: string;
  trend?: 'up' | 'down' | 'stable' | string;
  change?: string;
  source?: string;
}

export default function CovaiBullionWidget() {
  const [bullion, setBullion] = useState<BullionData>({
    gold22k: '12,546',
    gold24k: '13,686',
    silver1g: '204.15',
    silver1kg: '2,04,154',
    trend: 'up',
    change: '+₹15',
    source: 'MetalPriceAPI',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchBullion = async () => {
      try {
        const res = await fetch('/api/widgets/bullion');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setBullion(json.data);
          }
        }
      } catch (e) {
        console.error('Bullion widget fetch failed', e);
      }
    };

    fetchBullion();
    const interval = setInterval(fetchBullion, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isUp = bullion.trend === 'up' || (bullion.change && bullion.change.startsWith('+'));
  const isDown = bullion.trend === 'down' || (bullion.change && bullion.change.startsWith('-'));

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2 shrink-0 select-none overflow-hidden">
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold border-b border-stone-100 dark:border-slate-800 pb-1.5 gap-1">
        <span className="text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black flex items-center gap-1.5 truncate min-w-0">
          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">COVAI BULLION</span>
        </span>
        <span className="text-emerald-600 font-black flex items-center gap-1 text-[9px] sm:text-[10px] shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
          LIVE INR
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-1.5 text-xs font-black">
        {/* Gold 22k & 24k */}
        <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50 flex justify-between items-center gap-1">
          <div className="min-w-0">
            <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold block truncate">Gold (22K • 1g)</span>
            <span className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold block truncate">24K: ₹{bullion.gold24k}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-stone-900 dark:text-amber-200 font-black text-xs block whitespace-nowrap">₹{bullion.gold22k}</span>
            <span className={`text-[9px] font-bold inline-flex items-center gap-0.5 whitespace-nowrap ${
              isDown ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {isDown ? <TrendingDown className="w-2.5 h-2.5 shrink-0" /> : isUp ? <TrendingUp className="w-2.5 h-2.5 shrink-0" /> : <Minus className="w-2.5 h-2.5 shrink-0" />}
              <span>{bullion.change || '+₹15'}</span>
            </span>
          </div>
        </div>

        {/* Silver 1g & 1kg */}
        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-1">
          <div className="min-w-0">
            <span className="text-[10px] text-stone-700 dark:text-gray-300 font-bold block truncate">Silver (1g)</span>
            <span className="text-[9px] text-stone-500 dark:text-gray-400 font-semibold block truncate">1 Kg: ₹{bullion.silver1kg}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-stone-900 dark:text-gray-200 font-black text-xs block whitespace-nowrap">₹{bullion.silver1g}</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block whitespace-nowrap">Spot INR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CovaiBullionWidget };
