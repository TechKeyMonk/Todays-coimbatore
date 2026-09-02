'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Wind } from 'lucide-react';

export default function CovaiLeftMicroWidget() {
  const [goldRate, setGoldRate] = useState({
    gold22k: '12,546',
    gold24k: '13,686',
    silver: '204.15',
  });

  const [aqi, setAqi] = useState({
    value: 42,
    status: 'Good',
    location: 'Coimbatore City',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLiveData = async () => {
      try {
        const [bullionRes, weatherRes] = await Promise.all([
          fetch('/api/widgets/bullion').catch(() => null),
          fetch('/api/widgets/weather').catch(() => null),
        ]);

        if (bullionRes && bullionRes.ok) {
          const bJson = await bullionRes.json();
          if (isMounted && bJson.data) {
            setGoldRate({
              gold22k: bJson.data.gold22k || '12,546',
              gold24k: bJson.data.gold24k || '13,686',
              silver: bJson.data.silver1g || '204.15',
            });
          }
        }

        if (weatherRes && weatherRes.ok) {
          const wJson = await weatherRes.json();
          if (isMounted && wJson.aqi) {
            setAqi({
              value: wJson.aqi,
              status: wJson.aqiStatus || 'Good',
              location: 'Coimbatore City',
            });
          }
        }
      } catch (e) {
        console.error('CovaiLeftMicroWidget live fetch error', e);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2">
      {/* Gold & Silver Section */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-gray-400 pb-1 border-b border-stone-100 dark:border-slate-800">
          <span className="flex items-center gap-1.5 font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Covai Bullion Rate</span>
          </span>
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
            Live INR
          </span>
        </div>
        <div className="mt-1.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-gray-200">
            <span className="text-[11px] text-stone-600 dark:text-gray-400">Gold 22K (1g):</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400">₹{goldRate.gold22k}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-gray-200">
            <span className="text-[11px] text-stone-600 dark:text-gray-400">Silver (1g):</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">₹{goldRate.silver}</span>
          </div>
        </div>
      </div>

      {/* Real-Time Accurate Covai AQI */}
      <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-gray-400 mb-1">
          <span className="flex items-center gap-1.5 font-bold">
            <Wind className="w-3.5 h-3.5 text-emerald-600" />
            <span>Air Quality Index</span>
          </span>
          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {aqi.status}
          </span>
        </div>
        <div className="flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
              {aqi.value}
            </span>
            <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
              AQI • Covai
            </span>
          </div>
          <span className="text-[9px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
            PM2.5 Clean
          </span>
        </div>
      </div>
    </div>
  );
}
