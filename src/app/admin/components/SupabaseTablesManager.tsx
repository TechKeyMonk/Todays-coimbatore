'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Building2,
  HeartPulse,
  Newspaper,
  MessageSquare,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import {
  supabaseAdminService,
  SupabaseListing,
  SupabaseCategory,
  SupabaseBloodDonor,
  SupabaseNews,
  SupabaseEnquiry,
  SupabaseEvent,
} from '@/services/supabaseAdminService';
import { getCategoryFallbackImage } from '@/app/directory/components/DirectoryIcons';

type TableKey = 'listings' | 'categories' | 'blood_donors' | 'news' | 'enquiries' | 'events';

export const SupabaseTablesManager: React.FC = () => {
  const [activeTable, setActiveTable] = useState<TableKey>('listings');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [listings, setListings] = useState<SupabaseListing[]>([]);
  const [categories, setCategories] = useState<SupabaseCategory[]>([]);
  const [bloodDonors, setBloodDonors] = useState<SupabaseBloodDonor[]>([]);
  const [newsList, setNewsList] = useState<SupabaseNews[]>([]);
  const [enquiries, setEnquiries] = useState<SupabaseEnquiry[]>([]);
  const [eventsList, setEventsList] = useState<SupabaseEvent[]>([]);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState<boolean>(false);

  // Emergency Delete Modal State (Single row)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all tables from Supabase
  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [l, c, b, n, enq, ev] = await Promise.all([
        supabaseAdminService.getListings(),
        supabaseAdminService.getCategories(),
        supabaseAdminService.getBloodDonors(),
        supabaseAdminService.getNews(),
        supabaseAdminService.getEnquiries(),
        supabaseAdminService.getEvents(),
      ]);
      setListings(l || []);
      setCategories(c || []);
      setBloodDonors(b || []);
      setNewsList(n || []);
      setEnquiries(enq || []);
      setEventsList(ev || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Enquiries Status Update
  const handleUpdateEnquiryStatus = async (id: string, newStatus: string) => {
    try {
      await supabaseAdminService.updateEnquiryStatus(id, newStatus);
      notifySuccess(`Enquiry status changed to ${newStatus}`);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update enquiry status');
    }
  };

  // Single Row Emergency Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setErrorMsg('');
    try {
      if (activeTable === 'listings') await supabaseAdminService.deleteListing(deletingId);
      if (activeTable === 'categories') await supabaseAdminService.deleteCategory(deletingId);
      if (activeTable === 'blood_donors') await supabaseAdminService.deleteBloodDonor(deletingId);
      if (activeTable === 'news') await supabaseAdminService.deleteNews(deletingId);
      if (activeTable === 'enquiries') await supabaseAdminService.deleteEnquiry(deletingId);
      if (activeTable === 'events') await supabaseAdminService.deleteEvent(deletingId);

      notifySuccess('Record permanently deleted from Supabase PostgreSQL table!');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingId);
        return next;
      });
      setDeletingId(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete record from Supabase');
    }
  };

  // Multi-Selection: Toggle Single Row Selection
  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Multi-Selection: Toggle Select All Filtered Rows
  const handleToggleSelectAll = () => {
    if (filteredData.length === 0) return;
    const allSelected = filteredData.every((item) => selectedIds.has(item.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredData.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  // Multi-Selection: Bulk Delete Selected Rows
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    setErrorMsg('');
    const ids = Array.from(selectedIds);
    let successCount = 0;
    try {
      for (const id of ids) {
        try {
          if (activeTable === 'listings') await supabaseAdminService.deleteListing(id);
          else if (activeTable === 'categories') await supabaseAdminService.deleteCategory(id);
          else if (activeTable === 'blood_donors') await supabaseAdminService.deleteBloodDonor(id);
          else if (activeTable === 'news') await supabaseAdminService.deleteNews(id);
          else if (activeTable === 'enquiries') await supabaseAdminService.deleteEnquiry(id);
          else if (activeTable === 'events') await supabaseAdminService.deleteEvent(id);
          successCount++;
        } catch (err) {
          console.error(`Error deleting ${id} from ${activeTable}:`, err);
        }
      }
      notifySuccess(`Successfully deleted ${successCount} of ${ids.length} record(s) from Supabase ${activeTable}!`);
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete bulk deletion from Supabase');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Filter Data based on Search Query
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      if (activeTable === 'listings') return listings;
      if (activeTable === 'categories') return categories;
      if (activeTable === 'blood_donors') return bloodDonors;
      if (activeTable === 'news') return newsList;
      if (activeTable === 'enquiries') return enquiries;
      if (activeTable === 'events') return eventsList;
      return [];
    }

    if (activeTable === 'listings') {
      return listings.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.area?.toLowerCase().includes(q) ||
          item.phone?.includes(q) ||
          item.id?.toLowerCase().includes(q)
      );
    }
    if (activeTable === 'categories') {
      return categories.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q)
      );
    }
    if (activeTable === 'blood_donors') {
      return bloodDonors.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.blood_group?.toLowerCase().includes(q) ||
          item.area?.toLowerCase().includes(q) ||
          item.phone?.includes(q)
      );
    }
    if (activeTable === 'news') {
      return newsList.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.author?.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q)
      );
    }
    if (activeTable === 'enquiries') {
      return enquiries.filter(
        (item) =>
          item.user_name?.toLowerCase().includes(q) ||
          item.user_phone?.includes(q) ||
          item.service_requested?.toLowerCase().includes(q) ||
          item.status?.toLowerCase().includes(q) ||
          item.message?.toLowerCase().includes(q)
      );
    }
    if (activeTable === 'events') {
      return eventsList.filter(
        (item) =>
          item.event_name?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.contact_phone?.includes(q)
      );
    }
    return [];
  }, [activeTable, searchQuery, listings, categories, bloodDonors, newsList, enquiries, eventsList]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER BAR & CONTROLS */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                Supabase Master View &amp; Emergency Clean-up
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live PostgreSQL Connected
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
              Master audit view of live production tables: <code className="text-red-600 font-bold">listings</code>, <code className="text-red-600 font-bold">categories</code>, <code className="text-red-600 font-bold">blood_donors</code>, <code className="text-red-600 font-bold">news</code>, <code className="text-red-600 font-bold">enquiries</code>, <code className="text-red-600 font-bold">events</code>. Use this dashboard to audit live data and perform emergency cleanup of test/legacy records.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadAllData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Live Data</span>
            </button>
          </div>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. TABLE SELECTOR TABS & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Table Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-stone-100 dark:bg-slate-800/80 rounded-2xl border border-stone-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => { setActiveTable('listings'); setSearchQuery(''); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTable === 'listings'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Listings ({listings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTable('categories'); setSearchQuery(''); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTable === 'categories'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTable('blood_donors'); setSearchQuery(''); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTable === 'blood_donors'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Blood Donors ({bloodDonors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTable('news'); setSearchQuery(''); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTable === 'news'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>News ({newsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTable('enquiries'); setSearchQuery(''); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTable === 'enquiries'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Enquiries ({enquiries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTable('events'); setSearchQuery(''); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTable === 'events'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({eventsList.length})</span>
          </button>
        </div>

        {/* Live Search Filter */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder={`Filter ${activeTable.replace('_', ' ')} rows...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-red-600 text-stone-900 dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Selection Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-20 z-20 p-3.5 bg-stone-900 text-white dark:bg-slate-800 border border-stone-700 dark:border-slate-700 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black">
              {selectedIds.size} row{selectedIds.size > 1 ? 's' : ''} selected in{' '}
              <span className="font-mono text-red-400 capitalize">{activeTable.replace('_', ' ')}</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] font-bold text-stone-400 hover:text-white underline cursor-pointer ml-1"
            >
              Deselect All
            </button>
          </div>

          <button
            type="button"
            onClick={() => setBulkDeleteModalOpen(true)}
            disabled={isBulkDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedIds.size})</span>
          </button>
        </div>
      )}

      {/* 3. DATA TABLE DISPLAY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {/* TABLE: LISTINGS */}
          {activeTable === 'listings' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title="Select All Listings"
                    />
                  </th>
                  <th className="p-3.5 whitespace-nowrap min-w-[260px]">Business &amp; ID</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[140px]">Category</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">Area / Address</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Phone</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px]">Pincode</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px]">Rating</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px] text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      No listings found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseListing[]).map((row) => (
                    <tr key={row.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(row.id) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={`Select ${row.title}`}
                        />
                      </td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-stone-200 dark:border-slate-700 shrink-0 shadow-2xs">
                            <img
                              src={(Array.isArray(row.images) && row.images[0]) || (row as any).image_url || (row as any).imageUrl || getCategoryFallbackImage(row.category)}
                              alt={row.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-black text-stone-900 dark:text-white">{row.title}</div>
                            <div className="text-[10px] text-stone-400 font-mono truncate">{row.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-bold text-[10px]">
                          {row.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-gray-300">
                        <div className="font-bold text-stone-800 dark:text-gray-200 whitespace-nowrap">{row.area || 'Coimbatore'}</div>
                        <div className="text-[11px] text-stone-400 truncate max-w-xs">{row.address || '—'}</div>
                      </td>
                      <td className="p-3.5 font-mono whitespace-nowrap text-stone-700 dark:text-gray-300">{row.phone || '—'}</td>
                      <td className="p-3.5 font-mono whitespace-nowrap text-stone-700 dark:text-gray-300">{row.pincode || '—'}</td>
                      <td className="p-3.5 font-black whitespace-nowrap text-amber-500">★ {row.rating || 4.5}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Emergency Delete row from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABLE: CATEGORIES */}
          {activeTable === 'categories' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title="Select All Categories"
                    />
                  </th>
                  <th className="p-3.5 w-16 whitespace-nowrap">Icon</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[180px]">Category Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[140px]">URL Slug</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[180px]">UUID</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px] text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No categories found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseCategory[]).map((row) => (
                    <tr key={row.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(row.id) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={`Select ${row.name}`}
                        />
                      </td>
                      <td className="p-3.5 text-xl whitespace-nowrap">{row.icon || '📌'}</td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white whitespace-nowrap">{row.name}</td>
                      <td className="p-3.5 font-mono text-red-600 dark:text-red-400 font-bold whitespace-nowrap">{row.slug}</td>
                      <td className="p-3.5 font-mono text-[10px] text-stone-400 whitespace-nowrap">{row.id}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Emergency Delete category from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABLE: BLOOD DONORS */}
          {activeTable === 'blood_donors' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title="Select All Blood Donors"
                    />
                  </th>
                  <th className="p-3.5 whitespace-nowrap min-w-[200px]">Donor Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[100px]">Blood Group</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">Area &amp; Location</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Phone Number</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px] text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No blood donors found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseBloodDonor[]).map((row) => (
                    <tr key={row.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(row.id) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={`Select ${row.name}`}
                        />
                      </td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                        <div className="whitespace-nowrap">{row.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono truncate">{row.id}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-xs">
                          {row.blood_group}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-stone-800 dark:text-gray-200 whitespace-nowrap">{row.area}</td>
                      <td className="p-3.5 font-mono text-stone-700 dark:text-gray-300 font-bold whitespace-nowrap">{row.phone}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            row.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                              : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-slate-800 dark:text-gray-400'
                          }`}
                        >
                          {row.status || 'Available'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Emergency Delete blood donor from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABLE: NEWS */}
          {activeTable === 'news' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title="Select All News"
                    />
                  </th>
                  <th className="p-3.5 min-w-[280px]">Headline &amp; Content</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Category</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Author</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Published Date</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px] text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No news articles found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseNews[]).map((row) => (
                    <tr key={row.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(row.id) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={`Select ${row.title}`}
                        />
                      </td>
                      <td className="p-3.5 max-w-md">
                        <div className="font-bold text-stone-900 dark:text-white line-clamp-1">{row.title}</div>
                        <div className="text-[11px] text-stone-500 dark:text-gray-400 line-clamp-1 mt-0.5">{row.content}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-gray-200 font-bold text-[10px]">
                          {row.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-stone-700 dark:text-gray-300 whitespace-nowrap">{row.author || 'Admin'}</td>
                      <td className="p-3.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Emergency Delete article from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABLE: ENQUIRIES */}
          {activeTable === 'enquiries' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title="Select All Enquiries"
                    />
                  </th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">User Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Contact Phone</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[150px]">Service Requested</th>
                  <th className="p-3.5 min-w-[220px]">Message / Details</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px] text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No enquiries found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseEnquiry[]).map((row) => (
                    <tr key={row.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(row.id) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={`Select ${row.user_name}`}
                        />
                      </td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white whitespace-nowrap">{row.user_name}</td>
                      <td className="p-3.5 font-mono text-stone-800 dark:text-gray-200 font-bold whitespace-nowrap">{row.user_phone}</td>
                      <td className="p-3.5 font-bold text-red-600 whitespace-nowrap">{row.service_requested || 'General'}</td>
                      <td className="p-3.5 text-stone-600 dark:text-gray-300 max-w-xs truncate">{row.message}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <select
                          value={row.status || 'Pending'}
                          onChange={(e) => handleUpdateEnquiryStatus(row.id, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            row.status === 'Contacted' || row.status === 'Fulfilled'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Fulfilled">Fulfilled</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Emergency Delete enquiry from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABLE: EVENTS */}
          {activeTable === 'events' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title="Select All Events"
                    />
                  </th>
                  <th className="p-3.5 whitespace-nowrap min-w-[200px]">Event Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Event Date</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">Location / Venue</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Contact Phone</th>
                  <th className="p-3.5 min-w-[200px]">Description</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px] text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No events found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseEvent[]).map((row) => (
                    <tr key={row.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(row.id) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleToggleRow(row.id)}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={`Select ${row.event_name}`}
                        />
                      </td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white whitespace-nowrap">{row.event_name}</td>
                      <td className="p-3.5 font-mono text-stone-700 dark:text-gray-300 font-bold whitespace-nowrap">{row.event_date || 'TBD'}</td>
                      <td className="p-3.5 text-stone-800 dark:text-gray-200 whitespace-nowrap">{row.location}</td>
                      <td className="p-3.5 font-mono text-stone-600 dark:text-gray-400 whitespace-nowrap">{row.contact_phone || '—'}</td>
                      <td className="p-3.5 text-stone-500 dark:text-gray-400 max-w-xs truncate">{row.description}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Emergency Delete event from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. EMERGENCY DELETE CONFIRMATION MODAL (SINGLE ROW) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Confirm Emergency Deletion
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400">
                  PostgreSQL Table: <span className="font-mono font-bold text-red-600">{activeTable}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete this row (<code className="font-mono font-bold text-stone-900 dark:text-white">{deletingId}</code>) from Supabase? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Delete from Supabase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. BULK DELETE CONFIRMATION MODAL (MULTIPLE ROWS) */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Confirm Bulk Deletion
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400">
                  PostgreSQL Table: <span className="font-mono font-bold text-red-600 capitalize">{activeTable.replace('_', ' ')}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-red-600 font-black">{selectedIds.size}</strong> selected record{selectedIds.size > 1 ? 's' : ''} from the live Supabase PostgreSQL database? This action is immediate and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isBulkDeleting ? `Deleting (${selectedIds.size})...` : `Delete ${selectedIds.size} Records`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
