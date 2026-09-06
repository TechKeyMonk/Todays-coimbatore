'use client';

import React, { useState, useEffect } from 'react';
import { CloudSun, Droplets, Wind, Sparkles } from 'lucide-react';

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: string;
  wind: string;
  aqi: number;
  aqiStatus: string;
  pm25: number;
  lastUpdated?: string;
}

export default function CovaiWeatherWidget() {
  const [data, setData] = useState<WeatherData>({
    temp: 27,
    feelsLike: 30,
    condition: 'Light Rain',
    humidity: '73%',
    wind: '16 km/h',
    aqi: 48,
    aqiStatus: 'Good',
    pm25: 4.9,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLiveWeather = async () => {
      try {
        const res = await fetch('/api/widgets/weather');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.temp) {
            setData(json);
          }
        }
      } catch (e) {
        console.error('Weather widget fetch failed', e);
      }
    };

    fetchLiveWeather();
    const interval = setInterval(fetchLiveWeather, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2 shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold border-b border-stone-100 dark:border-slate-800 pb-1.5 gap-1">
        <span className="text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black flex items-center gap-1.5 truncate min-w-0">
          <CloudSun className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="truncate">COVAI WEATHER &amp; AQI</span>
        </span>
        <span className="text-emerald-600 font-black flex items-center gap-1 text-[9px] sm:text-[10px] shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
          LIVE
        </span>
      </div>

      {/* Temperature & Condition Row */}
      <div className="flex items-center justify-between bg-sky-50/80 dark:bg-sky-950/30 p-2 rounded-lg border border-sky-100 dark:border-sky-900/50 gap-1.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-black text-sky-900 dark:text-sky-200 shrink-0 whitespace-nowrap leading-none">
              {data.temp}°C
            </span>
            <span className="text-[9px] sm:text-[10px] text-sky-700 dark:text-sky-300 font-bold whitespace-nowrap">
              Feels {data.feelsLike}°
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-sky-800 dark:text-sky-300 block truncate mt-0.5 leading-tight">
            {data.condition}
          </span>
        </div>
        <div className="text-right text-[9px] sm:text-[10px] text-sky-800 dark:text-sky-300 font-semibold space-y-0.5 shrink-0 whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <Droplets className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-600 shrink-0" />
            <span>{data.humidity}</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <Wind className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-600 shrink-0" />
            <span>{data.wind}</span>
          </div>
        </div>
      </div>

      {/* AQI Badge Card */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 shrink-0 whitespace-nowrap leading-none font-mono tracking-tight">
            {data.aqi}
          </span>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 dark:text-emerald-300 block uppercase tracking-tight truncate leading-tight">
              AQI • {data.aqiStatus}
            </span>
            <span className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap block leading-tight">
              PM2.5: {data.pm25}
            </span>
          </div>
        </div>
        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap shadow-2xs">
          <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-600 shrink-0" />
          <span>Clean</span>
        </span>
      </div>
    </div>
  );
}

export { CovaiWeatherWidget };
