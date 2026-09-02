'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Phone,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import dbService, { OutageRecord } from '@/services/db';
import DynamicHeader from '@/components/layout/DynamicHeader';
import Footer from '@/components/Footer';

export default function TnebClient() {
  const [outages, setOutages] = useState<OutageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadOutages = async () => {
    try {
      setLoading(true);
      const list = await dbService.getPowerOutages();
      setOutages(list);
    } catch (e) {
      console.error('Failed to load TNEB outages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutages();

    const handleSync = () => loadOutages();
    window.addEventListener('outagesStorageUpdate', handleSync);
    window.addEventListener('todayscoimbatore:db-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('outagesStorageUpdate', handleSync);
      window.removeEventListener('todayscoimbatore:db-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const filtered = outages.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const areaMatch = item.area?.toLowerCase().includes(q);
    const subMatch = item.substation?.toLowerCase().includes(q);
    const streetMatch = item.affectedStreets?.some((s) => s.toLowerCase().includes(q));
    const reasonMatch = item.reason?.toLowerCase().includes(q);
    return Boolean(areaMatch || subMatch || streetMatch || reasonMatch);
  });

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-slate-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans">
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <section className="bg-gradient-to-br from-red-600 via-rose-600 to-amber-700 rounded-3xl p-6 sm:p-10 text-white shadow-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>TANGEDCO / TNEB LIVE POWER CUT TRACKER</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Coimbatore TNEB Power Cut &amp; Shutdown Schedule
          </h1>

          <p className="text-xs sm:text-sm text-white/90 max-w-2xl font-medium leading-relaxed">
            Live substation maintenance schedules, feeder outage alerts, affected street listings, and 24/7 electricity helpline contact across Coimbatore city and suburban circles.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="tel:1912"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 hover:bg-stone-100 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>1912 Helpline</span>
            </a>
            <span className="text-xs text-white/80 font-semibold">
              TANGEDCO Central Grievance Cell (Toll-Free 24/7)
            </span>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by area (e.g. RS Puram, Peelamedu, Gandhipuram)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'scheduled', 'active', 'maintenance'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={
                  filterStatus === status
                    ? 'px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap bg-red-600 text-white shadow-xs'
                    : 'px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-gray-300 hover:bg-stone-200'
                }
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Scheduled Outage Notices ({filtered.length})</span>
            </h2>
            <span className="text-xs text-stone-500 font-semibold">
              Updated via TANGEDCO Central Circle
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-stone-400 font-bold text-xs">
              Loading latest outage schedules...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-stone-800 dark:text-gray-200 text-sm">
                No active or scheduled power outages found
              </h3>
              <p className="text-xs text-stone-400">
                All feeders in this search filter are currently operating normally.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-[10px] font-black uppercase">
                        {item.status || 'SCHEDULED'}
                      </span>
                      <h3 className="text-base font-black text-stone-900 dark:text-white mt-1">
                        {item.area} Substation Area
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-red-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.timeWindow || item.time || '09:00 AM – 04:00 PM'}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {item.scheduledDate || item.date || 'Today'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 dark:text-gray-300 space-y-1 pt-2 border-t border-stone-100 dark:border-slate-800">
                    <p className="font-semibold text-stone-800 dark:text-gray-200">
                      <strong>Substation:</strong> {item.substation || item.area}
                    </p>
                    <p>
                      <strong>Reason:</strong> {item.reason || item.details || 'Monthly Substation & Feeder Maintenance'}
                    </p>
                    {item.affectedStreets && item.affectedStreets.length > 0 && (
                      <p className="text-[11px] text-stone-500 dark:text-gray-400">
                        <strong>Affected Streets:</strong> {item.affectedStreets.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
