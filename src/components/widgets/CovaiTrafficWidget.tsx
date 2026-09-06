'use client';

import React, { useState, useEffect } from 'react';
import { TrafficCone, ArrowRight } from 'lucide-react';

interface TrafficAlert {
  id: string;
  corridor: string;
  status: string;
  severity: 'smooth' | 'moderate' | 'alert';
  speed: string;
  details: string;
  timeAgo: string;
}

export default function CovaiTrafficWidget() {
  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchTraffic = async () => {
      try {
        const res = await fetch('/api/widgets/traffic');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.alerts && Array.isArray(json.alerts)) {
            setAlerts(json.alerts);
          }
        }
      } catch (e) {
        console.error('Traffic widget fetch failed', e);
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentAlert = alerts.length > 0 ? alerts[activeIdx] || alerts[0] : null;

  const handleNext = () => {
    if (alerts.length > 1) {
      setActiveIdx((prev) => (prev + 1) % alerts.length);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2 shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold border-b border-stone-100 dark:border-slate-800 pb-1.5 gap-1">
        <span className="text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black flex items-center gap-1.5 truncate min-w-0">
          <TrafficCone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">COVAI TRAFFIC</span>
        </span>
        <span className="text-emerald-600 font-black flex items-center gap-1 text-[9px] sm:text-[10px] shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
          LIVE
        </span>
      </div>

      {/* Traffic Alert Card or Clean Clear State */}
      {alerts.length === 0 ? (
        <div className="space-y-1 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40 text-center">
          <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase block">
            All Major Corridors Clear
          </span>
          <p className="text-[11px] text-stone-600 dark:text-gray-400 font-medium leading-snug">
            Avinashi Rd, Gandhipuram &amp; Ukkadam routes operating with smooth traffic flow.
          </p>
        </div>
      ) : currentAlert ? (
        <div className="space-y-1.5 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 truncate max-w-[130px]">
              {currentAlert.corridor}
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
              currentAlert.severity === 'smooth'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                : currentAlert.severity === 'alert'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {currentAlert.status}
            </span>
          </div>

          <p className="text-[11px] text-stone-700 dark:text-gray-300 font-medium leading-snug line-clamp-2">
            {currentAlert.details}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 dark:border-amber-900/40 text-[9px] text-stone-500 dark:text-gray-400 font-bold">
            <span>Avg Speed: {currentAlert.speed}</span>
            <span>{currentAlert.timeAgo}</span>
          </div>
        </div>
      ) : null}

      {/* Corridor Switcher Controls if multiple alerts exist */}
      {alerts.length > 1 && (
        <div className="flex items-center justify-between pt-0.5 text-[9px] text-stone-400 font-bold">
          <span>Alert {activeIdx + 1} of {alerts.length}</span>
          <button
            type="button"
            onClick={handleNext}
            className="text-stone-600 dark:text-gray-300 hover:text-red-600 cursor-pointer inline-flex items-center gap-0.5"
          >
            <span>Next Alert</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export { CovaiTrafficWidget };
