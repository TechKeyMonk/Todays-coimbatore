'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dbService, { SocialLinksRecord, INITIAL_SOCIAL_LINKS_DB } from '@/services/db';

export default function AdminAboutUsPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLinksRecord>(INITIAL_SOCIAL_LINKS_DB);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLinks = async () => {
      try {
        // 1. Initial immediate load from dbService
        const local = await dbService.getSocialLinks();
        if (isMounted && local) {
          setSocialLinks(local);
        }

        // 2. Direct fetch from backend to ensure latest Supabase data
        const res = await fetch('/api/content?entity=config&key=SOCIAL_LINKS', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setSocialLinks({
              instagram: json.data.instagram || local.instagram || INITIAL_SOCIAL_LINKS_DB.instagram,
              youtube: json.data.youtube || local.youtube || INITIAL_SOCIAL_LINKS_DB.youtube,
              facebook: json.data.facebook || local.facebook || INITIAL_SOCIAL_LINKS_DB.facebook,
              twitter: json.data.twitter || local.twitter || INITIAL_SOCIAL_LINKS_DB.twitter,
            });
          }
        }
      } catch (e) {
        console.error('Error fetching social links', e);
      }
    };
    fetchLinks();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);
    try {
      // 1. Persist directly to server backend
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'social_links', data: socialLinks }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server rejected social links update');
      }

      // 2. Persist locally and trigger client-wide notification
      await dbService.saveSocialLinks(socialLinks);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save social links', err);
      setErrorMessage(err.message || 'Failed to save social links to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
              >
                &larr; Back to Admin Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Social Media & About Us Management
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Update official social channels displayed dynamically across the Footer and About Us portal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/about-us"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>View About Us</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <span>✓</span>
            <span>Social media links updated successfully! Changes are live across Footer and About Us page.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Social Links Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white uppercase tracking-wide">
              Official Platform Social Profiles
            </h2>
            <p className="text-xs text-gray-400">
              Paste the full profile/channel URLs below:
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Instagram */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <span className="text-[#E4405F] font-black">📷</span>
                <span>Instagram Profile URL</span>
              </label>
              <input
                type="url"
                required
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://www.instagram.com/tech_key_monk/"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <span className="text-[#FF0000] font-black">▶</span>
                <span>YouTube Channel URL</span>
              </label>
              <input
                type="url"
                required
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                placeholder="https://www.youtube.com/@TechKeyMonk-CBE"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <span className="text-[#1877F2] font-black">👥</span>
                <span>Facebook Page URL</span>
              </label>
              <input
                type="url"
                required
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                placeholder="https://www.facebook.com/p/TechKey-Monk-61554380970425/"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono"
              />
            </div>

            {/* Twitter / X */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <span className="text-[#1DA1F2] font-black">✖</span>
                <span>Twitter / X Profile URL</span>
              </label>
              <input
                type="url"
                required
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                placeholder="https://x.com/TechKeyMonk"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Social Media Settings'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
