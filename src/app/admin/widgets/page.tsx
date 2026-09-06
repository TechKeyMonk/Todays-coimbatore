'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  CloudSun,
  Coins,
  TrafficCone,
  BarChart3,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  PlusCircle,
} from 'lucide-react';

interface WeatherWidgetData {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: string;
  wind: string;
  aqi: number;
  aqiStatus: string;
  pm25: number;
  lastUpdated: string;
}

interface BullionWidgetData {
  gold22k: string;
  gold24k: string;
  silver1g: string;
  silver1kg: string;
  trend: string;
  change: string;
  lastUpdated: string;
  source?: string;
  currency?: string;
}

interface TrafficAlert {
  id: string;
  corridor: string;
  status: string;
  severity: 'smooth' | 'moderate' | 'alert';
  speed: string;
  details: string;
  timeAgo: string;
}

interface PollWidgetData {
  id: string;
  question: string;
  category: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercent: number;
  noPercent: number;
  lastUpdated: string;
}

export default function AdminWidgetsPage() {
  const [successMessage, setSuccessMessage] = useState('');

  // 4 Widget States
  const [weather, setWeather] = useState<WeatherWidgetData | null>(null);
  const [bullion, setBullion] = useState<BullionWidgetData | null>(null);
  const [traffic, setTraffic] = useState<TrafficAlert[]>([]);
  const [poll, setPoll] = useState<PollWidgetData | null>(null);

  const [loading, setLoading] = useState(false);

  // Form states for manual overrides
  const [editBullion, setEditBullion] = useState({
    gold22k: '12,546',
    gold24k: '13,686',
    silver1g: '204.15',
    silver1kg: '2,04,154',
    change: '+₹15',
  });

  const [editPollQuestion, setEditPollQuestion] = useState('');
  const [newTrafficCorridor, setNewTrafficCorridor] = useState('');
  const [newTrafficStatus, setNewTrafficStatus] = useState('Smooth');
  const [newTrafficDetails, setNewTrafficDetails] = useState('');
  const [newTrafficSpeed, setNewTrafficSpeed] = useState('40 km/h');

  // Fetch all 4 widget statuses
  const fetchAllWidgets = async () => {
    setLoading(true);
    try {
      // 1. Weather
      const wRes = await fetch('/api/widgets/weather');
      if (wRes.ok) {
        const wJson = await wRes.json();
        setWeather(wJson);
      }

      // 2. Bullion
      const bRes = await fetch('/api/widgets/bullion');
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (bJson.data) {
          setBullion(bJson.data);
          setEditBullion(bJson.data);
        }
      }

      // 3. Traffic
      const tRes = await fetch('/api/widgets/traffic');
      if (tRes.ok) {
        const tJson = await tRes.json();
        if (tJson.alerts) {
          setTraffic(tJson.alerts);
        }
      }

      // 4. Poll
      const pRes = await fetch('/api/widgets/poll');
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (pJson.data) {
          setPoll(pJson.data);
          setEditPollQuestion(pJson.data.question);
        }
      }
    } catch (e) {
      console.error('Failed to load widget states', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWidgets();
    const interval = setInterval(fetchAllWidgets, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Sync Live Bullion from MetalPrice API
  const handleSyncLiveBullion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/widgets/bullion?refresh=true');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setBullion(json.data);
          setEditBullion(json.data);
          triggerSuccess('✓ Synced live spot rates from MetalPrice API in INR!');
        }
      }
    } catch {
      triggerSuccess('Failed to sync live MetalPrice rates');
    } finally {
      setLoading(false);
    }
  };

  // Save Bullion Override
  const handleSaveBullion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/widgets/bullion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBullion),
      });
      if (res.ok) {
        const json = await res.json();
        setBullion(json.data);
        triggerSuccess('✓ Bullion rates updated and broadcast live!');
      }
    } catch {
      triggerSuccess('Failed to update bullion rates');
    }
  };

  // Save Poll Question Override
  const handleSavePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPollQuestion.trim()) return;
    try {
      const res = await fetch('/api/widgets/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editPollQuestion.trim(), yesVotes: 0, noVotes: 0 }),
      });
      if (res.ok) {
        const json = await res.json();
        setPoll(json.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('covai-poll-update', {
              detail: { counts: { yes: 0, no: 0 }, reset: true },
            })
          );
        }
        triggerSuccess('✓ New Daily Poll published with fresh vote counters!');
      }
    } catch {
      triggerSuccess('Failed to update poll question');
    }
  };

  const handleResetPoll = async () => {
    try {
      const res = await fetch('/api/widgets/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      if (res.ok) {
        const json = await res.json();
        setPoll(json.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('covai-poll-update', {
              detail: { counts: { yes: 0, no: 0 }, reset: true },
            })
          );
        }
        triggerSuccess('✓ Poll votes reset to 0!');
      }
    } catch {
      triggerSuccess('Failed to reset poll votes');
    }
  };

  // Add Traffic Alert
  const handleAddTraffic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrafficCorridor.trim()) return;

    const newAlert: TrafficAlert = {
      id: `tr-${Date.now()}`,
      corridor: newTrafficCorridor.trim(),
      status: newTrafficStatus,
      severity: newTrafficStatus === 'Smooth' ? 'smooth' : newTrafficStatus === 'Heavy' ? 'alert' : 'moderate',
      speed: newTrafficSpeed,
      details: newTrafficDetails.trim() || 'Traffic moving normally.',
      timeAgo: 'Just now',
    };

    const updated = [newAlert, ...traffic];
    try {
      const res = await fetch('/api/widgets/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts: updated }),
      });
      if (res.ok) {
        setTraffic(updated);
        setNewTrafficCorridor('');
        setNewTrafficDetails('');
        triggerSuccess('✓ Road alert added to live corridor feed!');
      }
    } catch {
      triggerSuccess('Failed to add traffic alert');
    }
  };

  const handleDeleteTraffic = async (id: string) => {
    const updated = traffic.filter((t) => t.id !== id);
    try {
      const res = await fetch('/api/widgets/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts: updated }),
      });
      if (res.ok) {
        setTraffic(updated);
        triggerSuccess('✓ Alert removed from live feed');
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-[#153d3b] text-white sticky top-0 z-50 px-4 lg:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <span className="font-black text-sm uppercase tracking-wide">CMS WIDGETS MANAGER</span>
            </Link>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
              LIVE AUTOMATION ENGINE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchAllWidgets}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync All Live</span>
            </button>
            <Link
              href="/admin"
              className="bg-[#0f2e2d] hover:bg-[#1a4a47] text-stone-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#1f5956] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Admin CMS</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors inline-flex items-center gap-1"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Success Notification */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Grid: 4 Dedicated Monitoring & Override Panels */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6 space-y-6">
        
        {/* System Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-400 font-extrabold uppercase block">HOME RIGHT</span>
            <span className="text-xs font-black text-stone-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Weather &amp; AQI API
            </span>
            <span className="text-[11px] text-stone-500 font-semibold block mt-1">Open-Meteo • {weather?.temp || 28}°C (AQI {weather?.aqi || 42})</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-400 font-extrabold uppercase block">HOME LEFT</span>
            <span className="text-xs font-black text-stone-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Covai Bullion Rates
            </span>
            <span className="text-[11px] text-stone-500 font-semibold block mt-1">Gold 22K: ₹{bullion?.gold22k || '12,546'} • Live INR</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-400 font-extrabold uppercase block">INNER LEFT</span>
            <span className="text-xs font-black text-stone-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              City Traffic Alerts
            </span>
            <span className="text-[11px] text-stone-500 font-semibold block mt-1">{traffic.length} Corridors Active</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-400 font-extrabold uppercase block">INNER RIGHT</span>
            <span className="text-xs font-black text-stone-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Covai Pulse Poll
            </span>
            <span className="text-[11px] text-stone-500 font-semibold block mt-1">{poll ? poll.totalVotes : 0} Total Votes Cast</span>
          </div>
        </div>

        {/* 2x2 Detailed Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CARD 1: HOME RIGHT - Weather & AQI */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-black uppercase text-stone-800">1. Home Right: Weather &amp; AQI</h3>
                  <p className="text-[11px] text-stone-500">Live Satellite Station • Coimbatore Lat/Lon 11.0168° N</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">
                AUTO-SYNC (60s)
              </span>
            </div>

            {weather && (
              <div className="grid grid-cols-3 gap-3 bg-sky-50/60 p-3.5 rounded-xl border border-sky-100 text-center">
                <div>
                  <span className="text-[10px] text-sky-800 font-bold uppercase block">Temperature</span>
                  <span className="text-lg font-black text-sky-950">{weather.temp}°C</span>
                  <span className="text-[10px] text-sky-600 block">{weather.condition}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-800 font-bold uppercase block">Air Quality</span>
                  <span className="text-lg font-black text-emerald-700">{weather.aqi}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">{weather.aqiStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-800 font-bold uppercase block">Humidity / Wind</span>
                  <span className="text-xs font-black text-stone-800 mt-1 block">{weather.humidity}</span>
                  <span className="text-[10px] text-stone-500 block">{weather.wind}</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: HOME LEFT - Covai Bullion */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black uppercase text-stone-800">2. Home Left: Covai Bullion</h3>
                  <p className="text-[11px] text-stone-500">Live Spot Rates via MetalPrice API • Indian Rupees (INR)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                  METALPRICE LIVE (INR)
                </span>
                <button
                  type="button"
                  onClick={handleSyncLiveBullion}
                  title="Fetch fresh rates from MetalPrice API"
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sync API</span>
                </button>
              </div>
            </div>

            {/* Current Live Rates Display */}
            {bullion && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-center">
                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <span className="text-[10px] text-amber-900 font-bold uppercase block">Gold 22K (1g)</span>
                  <span className="text-sm font-black text-amber-950">₹{bullion.gold22k}</span>
                  <span className="text-[9px] text-emerald-700 font-bold block">{bullion.change || '+₹15'}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <span className="text-[10px] text-amber-900 font-bold uppercase block">Gold 24K (1g)</span>
                  <span className="text-sm font-black text-amber-950">₹{bullion.gold24k}</span>
                  <span className="text-[9px] text-stone-500 font-medium block">Pure 99.9%</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-700 font-bold uppercase block">Silver (1g)</span>
                  <span className="text-sm font-black text-slate-900">₹{bullion.silver1g}</span>
                  <span className="text-[9px] text-slate-500 font-medium block">Per Gram</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-700 font-bold uppercase block">Silver (1kg)</span>
                  <span className="text-sm font-black text-slate-900">₹{bullion.silver1kg}</span>
                  <span className="text-[9px] text-slate-500 font-medium block">Per Bar</span>
                </div>
              </div>
            )}

            {/* Manual Override & Custom Broadcast */}
            <form onSubmit={handleSaveBullion} className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-stone-500 tracking-wider">
                  Manual Adjustments &amp; Spot Overrides
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Currency: INR (₹)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-bold">
                <div>
                  <label className="text-[10px] uppercase text-stone-500 block mb-1">Gold 22k (1g)</label>
                  <input
                    type="text"
                    value={editBullion.gold22k}
                    onChange={(e) => setEditBullion({ ...editBullion, gold22k: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-stone-500 block mb-1">Gold 24k (1g)</label>
                  <input
                    type="text"
                    value={editBullion.gold24k}
                    onChange={(e) => setEditBullion({ ...editBullion, gold24k: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-stone-500 block mb-1">Silver (1g)</label>
                  <input
                    type="text"
                    value={editBullion.silver1g}
                    onChange={(e) => setEditBullion({ ...editBullion, silver1g: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-stone-500 block mb-1">Daily Change</label>
                  <input
                    type="text"
                    value={editBullion.change}
                    onChange={(e) => setEditBullion({ ...editBullion, change: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-[#153d3b] hover:bg-[#0f2e2d] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Save &amp; Broadcast Rates
                </button>
              </div>
            </form>
          </div>

          {/* CARD 3: INNER LEFT - Covai Live Traffic */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <TrafficCone className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black uppercase text-stone-800">3. Inner Left: Live Traffic &amp; Roadwork</h3>
                  <p className="text-[11px] text-stone-500">Corridor alerts for Avinashi, Gandhipuram, Ukkadam &amp; Bypass</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded">
                AUTO-ROTATING
              </span>
            </div>

            {/* List of active alerts */}
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {traffic.length === 0 ? (
                <div className="text-center py-4 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-500 font-medium">
                  No active roadwork alerts reported. All corridors operating smoothly.
                </div>
              ) : (
                traffic.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{item.corridor}</span>
                        <span className="bg-stone-200 text-stone-700 text-[9px] font-bold px-1.5 py-0.5 rounded">{item.status}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">{item.details}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTraffic(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold p-1 cursor-pointer"
                      aria-label="Delete alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Alert Form */}
            <form onSubmit={handleAddTraffic} className="space-y-2 pt-2 border-t border-stone-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Corridor name (e.g., Trichy Road)"
                  value={newTrafficCorridor}
                  onChange={(e) => setNewTrafficCorridor(e.target.value)}
                  className="bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5"
                />
                <select
                  value={newTrafficStatus}
                  onChange={(e) => setNewTrafficStatus(e.target.value)}
                  className="bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold"
                >
                  <option value="Smooth">Smooth Flow</option>
                  <option value="Moderate">Moderate Traffic</option>
                  <option value="Heavy">Heavy Congestion</option>
                  <option value="Maintenance">Maintenance Work</option>
                  <option value="Diversion">Diversion Active</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Alert description details..."
                value={newTrafficDetails}
                onChange={(e) => setNewTrafficDetails(e.target.value)}
                className="w-full bg-[#f8f6f0] border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#153d3b] hover:bg-[#0f2e2d] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Road Alert</span>
                </button>
              </div>
            </form>
          </div>

          {/* CARD 4: INNER RIGHT - Covai Pulse Poll */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-black uppercase text-stone-800">4. Inner Right: Covai Pulse Poll</h3>
                  <p className="text-[11px] text-stone-500">Auto-Generated &amp; Interactive Community Question</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded">
                REAL VOTING
              </span>
            </div>

            {poll && (
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-stone-900">{poll.question}</p>
                  <button
                    type="button"
                    onClick={handleResetPoll}
                    className="shrink-0 text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Reset Votes
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-extrabold text-stone-700">
                  <span className="text-emerald-700">YES: {poll.yesPercent}% ({poll.yesVotes} votes)</span>
                  <span className="text-red-700">NO: {poll.noPercent}% ({poll.noVotes} votes)</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden flex">
                  <div style={{ width: `${poll.yesPercent}%` }} className="bg-emerald-500" />
                  <div style={{ width: `${poll.noPercent}%` }} className="bg-red-500" />
                </div>
              </div>
            )}

            {/* Change Poll Question */}
            <form onSubmit={handleSavePoll} className="space-y-2 pt-1 border-t border-stone-100">
              <label className="text-[10px] font-bold uppercase text-stone-500 block">Update Daily Poll Question</label>
              <textarea
                rows={2}
                value={editPollQuestion}
                onChange={(e) => setEditPollQuestion(e.target.value)}
                placeholder="Enter community question..."
                className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#153d3b] hover:bg-[#0f2e2d] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Publish New Poll
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
