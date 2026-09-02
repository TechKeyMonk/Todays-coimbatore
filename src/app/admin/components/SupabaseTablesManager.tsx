'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
  Layers,
  Building2,
  HeartPulse,
  Newspaper,
  MessageSquare,
  Calendar,
  Filter,
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
import { getCategoryFallbackImage, getCategoryIcon } from '@/app/directory/components/DirectoryIcons';

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

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form States for Listings
  const [listingForm, setListingForm] = useState({
    title: '',
    category: 'Hospitals & Clinics',
    phone: '',
    address: '',
    area: '',
    pincode: '',
    rating: 4.5,
  });

  // Form States for Categories
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    icon: '🏢',
  });

  // Form States for Blood Donors
  const [donorForm, setDonorForm] = useState({
    name: '',
    blood_group: 'O+',
    area: '',
    phone: '',
    status: 'Available',
  });

  // Form States for News
  const [newsForm, setNewsForm] = useState({
    title: '',
    slug: '',
    category: 'NEWS',
    content: '',
    image_url: '',
    author: 'Editorial Desk',
  });

  // Form States for Events
  const [eventForm, setEventForm] = useState({
    event_name: '',
    location: '',
    event_date: '',
    contact_phone: '',
    description: '',
    image_url: '',
  });

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
      setListings(l);
      setCategories(c);
      setBloodDonors(b);
      setNewsList(n);
      setEnquiries(enq);
      setEventsList(ev);
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

  // ==========================================
  // CRUD HANDLERS
  // ==========================================

  // 1. Listings
  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) {
        await supabaseAdminService.updateListing(editingItem.id, listingForm);
        notifySuccess('Listing updated successfully in Supabase!');
      } else {
        await supabaseAdminService.addListing(listingForm);
        notifySuccess('Listing created successfully in Supabase!');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving listing');
    }
  };

  // 2. Categories
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) {
        await supabaseAdminService.updateCategory(editingItem.id, categoryForm);
        notifySuccess('Category updated successfully in Supabase!');
      } else {
        await supabaseAdminService.addCategory(categoryForm);
        notifySuccess('Category created successfully in Supabase!');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving category');
    }
  };

  // 3. Blood Donors
  const handleSaveBloodDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) {
        await supabaseAdminService.updateBloodDonor(editingItem.id, donorForm);
        notifySuccess('Blood donor updated successfully in Supabase!');
      } else {
        await supabaseAdminService.addBloodDonor(donorForm);
        notifySuccess('Blood donor added successfully in Supabase!');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving blood donor');
    }
  };

  // 4. News
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) {
        await supabaseAdminService.updateNews(editingItem.id, newsForm);
        notifySuccess('News article updated successfully in Supabase!');
      } else {
        await supabaseAdminService.addNews(newsForm);
        notifySuccess('News article published successfully in Supabase!');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving news');
    }
  };

  // 5. Events
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) {
        await supabaseAdminService.updateEvent(editingItem.id, eventForm);
        notifySuccess('Event updated successfully in Supabase!');
      } else {
        await supabaseAdminService.addEvent(eventForm);
        notifySuccess('Event created successfully in Supabase!');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving event');
    }
  };

  // 6. Enquiries Status Update
  const handleUpdateEnquiryStatus = async (id: string, newStatus: string) => {
    try {
      await supabaseAdminService.updateEnquiryStatus(id, newStatus);
      notifySuccess(`Enquiry status changed to ${newStatus}`);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update enquiry status');
    }
  };

  // Generic Delete Handler
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

      notifySuccess('Record deleted from Supabase successfully!');
      setDeletingId(null);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete record');
    }
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTable === 'listings') {
      setListingForm({
        title: item.title || '',
        category: item.category || 'Hospitals & Clinics',
        phone: item.phone || '',
        address: item.address || '',
        area: item.area || '',
        pincode: item.pincode || '',
        rating: item.rating || 4.5,
      });
    } else if (activeTable === 'categories') {
      setCategoryForm({
        name: item.name || '',
        slug: item.slug || '',
        icon: item.icon || '🏢',
      });
    } else if (activeTable === 'blood_donors') {
      setDonorForm({
        name: item.name || '',
        blood_group: item.blood_group || 'O+',
        area: item.area || '',
        phone: item.phone || '',
        status: item.status || 'Available',
      });
    } else if (activeTable === 'news') {
      setNewsForm({
        title: item.title || '',
        slug: item.slug || '',
        category: item.category || 'NEWS',
        content: item.content || '',
        image_url: item.image_url || '',
        author: item.author || 'Editorial Desk',
      });
    } else if (activeTable === 'events') {
      setEventForm({
        event_name: item.event_name || '',
        location: item.location || '',
        event_date: item.event_date || '',
        contact_phone: item.contact_phone || '',
        description: item.description || '',
        image_url: item.image_url || '',
      });
    }
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    if (activeTable === 'listings') {
      setListingForm({
        title: '',
        category: categories[0]?.name || 'Hospitals & Clinics',
        phone: '',
        address: '',
        area: 'RS Puram',
        pincode: '641002',
        rating: 4.5,
      });
    } else if (activeTable === 'categories') {
      setCategoryForm({ name: '', slug: '', icon: '🏢' });
    } else if (activeTable === 'blood_donors') {
      setDonorForm({ name: '', blood_group: 'O+', area: 'Peelamedu', phone: '', status: 'Available' });
    } else if (activeTable === 'news') {
      setNewsForm({ title: '', slug: '', category: 'NEWS', content: '', image_url: '', author: 'Editorial Desk' });
    } else if (activeTable === 'events') {
      setEventForm({ event_name: '', location: 'Coimbatore', event_date: '', contact_phone: '', description: '', image_url: '' });
    }
    setIsAddModalOpen(true);
  };

  // Filtered rows for active table
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (activeTable === 'listings') {
      if (!q) return listings;
      return listings.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.area?.toLowerCase().includes(q) ||
          i.phone?.includes(q)
      );
    }
    if (activeTable === 'categories') {
      if (!q) return categories;
      return categories.filter((i) => i.name?.toLowerCase().includes(q) || i.slug?.toLowerCase().includes(q));
    }
    if (activeTable === 'blood_donors') {
      if (!q) return bloodDonors;
      return bloodDonors.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.blood_group?.toLowerCase().includes(q) ||
          i.area?.toLowerCase().includes(q) ||
          i.phone?.includes(q)
      );
    }
    if (activeTable === 'news') {
      if (!q) return newsList;
      return newsList.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.content?.toLowerCase().includes(q)
      );
    }
    if (activeTable === 'enquiries') {
      if (!q) return enquiries;
      return enquiries.filter(
        (i) =>
          i.user_name?.toLowerCase().includes(q) ||
          i.user_phone?.includes(q) ||
          i.service_requested?.toLowerCase().includes(q) ||
          i.message?.toLowerCase().includes(q) ||
          i.status?.toLowerCase().includes(q)
      );
    }
    if (activeTable === 'events') {
      if (!q) return eventsList;
      return eventsList.filter(
        (i) =>
          i.event_name?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeTable, searchQuery, listings, categories, bloodDonors, newsList, enquiries, eventsList]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & LIVE CONNECTION STATUS BANNER */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                Supabase SQL Database Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live PostgreSQL Connected
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
              Manage live production records directly in Supabase PostgreSQL tables: <code className="text-red-600 font-bold">listings</code>, <code className="text-red-600 font-bold">categories</code>, <code className="text-red-600 font-bold">blood_donors</code>, <code className="text-red-600 font-bold">news</code>, <code className="text-red-600 font-bold">enquiries</code>, <code className="text-red-600 font-bold">events</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadAllData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Live Data</span>
            </button>

            {activeTable !== 'enquiries' && (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add New {activeTable.replace('_', ' ').slice(0, -1)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Toasts */}
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
            onClick={() => { setActiveTable('listings'); setSearchQuery(''); }}
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
            onClick={() => { setActiveTable('categories'); setSearchQuery(''); }}
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
            onClick={() => { setActiveTable('blood_donors'); setSearchQuery(''); }}
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
            onClick={() => { setActiveTable('news'); setSearchQuery(''); }}
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
            onClick={() => { setActiveTable('enquiries'); setSearchQuery(''); }}
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
            onClick={() => { setActiveTable('events'); setSearchQuery(''); }}
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

        {/* Live Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder={`Filter ${activeTable.replace('_', ' ')} records...`}
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

      {/* 3. EXCEL / GRID DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {/* ======================================================= */}
          {/* TABLE: LISTINGS                                         */}
          {/* ======================================================= */}
          {activeTable === 'listings' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 whitespace-nowrap min-w-[260px]">Business / Title</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[140px]">Category</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[180px]">Area &amp; Address</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Phone</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[90px]">Pincode</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px]">Rating</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No listings found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseListing[]).map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-stone-200 dark:border-slate-700 shrink-0 shadow-2xs">
                            <img
                              src={(row as any).image_url || (row as any).imageUrl || getCategoryFallbackImage(row.category)}
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
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit row in Supabase"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Delete row from Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================= */}
          {/* TABLE: CATEGORIES                                       */}
          {/* ======================================================= */}
          {activeTable === 'categories' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 w-16 whitespace-nowrap">Icon</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[180px]">Category Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[140px]">URL Slug</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[180px]">UUID</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      No categories found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseCategory[]).map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 text-xl whitespace-nowrap">{row.icon || '📌'}</td>
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white whitespace-nowrap">{row.name}</td>
                      <td className="p-3.5 font-mono text-red-600 dark:text-red-400 font-bold whitespace-nowrap">{row.slug}</td>
                      <td className="p-3.5 font-mono text-[10px] text-stone-400 whitespace-nowrap">{row.id}</td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================= */}
          {/* TABLE: BLOOD DONORS                                     */}
          {/* ======================================================= */}
          {activeTable === 'blood_donors' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 whitespace-nowrap min-w-[200px]">Donor Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[100px]">Blood Group</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">Area &amp; Location</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Phone Number</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No blood donors found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseBloodDonor[]).map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors">
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
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================= */}
          {/* TABLE: NEWS                                             */}
          {/* ======================================================= */}
          {activeTable === 'news' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 min-w-[280px]">Headline &amp; Content</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Category</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Author</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Published Date</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      No news articles found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseNews[]).map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors">
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
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================= */}
          {/* TABLE: ENQUIRIES                                        */}
          {/* ======================================================= */}
          {activeTable === 'enquiries' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">User Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Contact Phone</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[150px]">Service Requested</th>
                  <th className="p-3.5 min-w-[220px]">Message / Details</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[70px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No enquiries found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseEnquiry[]).map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors">
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
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================= */}
          {/* TABLE: EVENTS                                           */}
          {/* ======================================================= */}
          {activeTable === 'events' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300 uppercase tracking-wider font-black text-[11px]">
                  <th className="p-3.5 whitespace-nowrap min-w-[200px]">Event Name</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[120px]">Event Date</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[160px]">Location / Venue</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[130px]">Contact Phone</th>
                  <th className="p-3.5 min-w-[200px]">Description</th>
                  <th className="p-3.5 whitespace-nowrap min-w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No events found in Supabase table.
                    </td>
                  </tr>
                ) : (
                  (filteredData as SupabaseEvent[]).map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-stone-900 dark:text-white whitespace-nowrap">{row.event_name}</td>
                      <td className="p-3.5 font-mono text-stone-700 dark:text-gray-300 font-bold whitespace-nowrap">{row.event_date || 'TBD'}</td>
                      <td className="p-3.5 text-stone-800 dark:text-gray-200 whitespace-nowrap">{row.location}</td>
                      <td className="p-3.5 font-mono text-stone-600 dark:text-gray-400 whitespace-nowrap">{row.contact_phone || '—'}</td>
                      <td className="p-3.5 text-stone-500 dark:text-gray-400 max-w-xs truncate">{row.description}</td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(row.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ======================================================= */}
      {/* ADD / EDIT MODAL                                        */}
      {/* ======================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-stone-900 dark:text-white">
                {editingItem ? 'Edit' : 'Add New'} {activeTable.replace('_', ' ').toUpperCase()} (Supabase SQL)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LISTINGS FORM */}
            {activeTable === 'listings' && (
              <form onSubmit={handleSaveListing} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Business Title *</label>
                  <input
                    type="text"
                    required
                    value={listingForm.title}
                    onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Category *</label>
                    <select
                      value={listingForm.category}
                      onChange={(e) => setListingForm({ ...listingForm, category: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={listingForm.phone}
                      onChange={(e) => setListingForm({ ...listingForm, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Area / Locality</label>
                    <input
                      type="text"
                      value={listingForm.area}
                      onChange={(e) => setListingForm({ ...listingForm, area: e.target.value })}
                      placeholder="e.g. RS Puram, Peelamedu"
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Admin Rating (1.0 – 5.0) ⭐</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      required
                      value={listingForm.rating}
                      onChange={(e) => setListingForm({ ...listingForm, rating: parseFloat(e.target.value) || 4.5 })}
                      placeholder="4.8"
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Full Address</label>
                  <input
                    type="text"
                    value={listingForm.address}
                    onChange={(e) => setListingForm({ ...listingForm, address: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border rounded-xl text-stone-600 dark:text-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-wider"
                  >
                    Save to Supabase
                  </button>
                </div>
              </form>
            )}

            {/* CATEGORIES FORM */}
            {activeTable === 'categories' && (
              <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Textiles & Handlooms"
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Slug *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      placeholder="textiles-handlooms"
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Icon (Emoji)</label>
                    <input
                      type="text"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white text-center text-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black">
                    Save Category
                  </button>
                </div>
              </form>
            )}

            {/* BLOOD DONORS FORM */}
            {activeTable === 'blood_donors' && (
              <form onSubmit={handleSaveBloodDonor} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Donor Name *</label>
                  <input
                    type="text"
                    required
                    value={donorForm.name}
                    onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Blood Group *</label>
                    <select
                      value={donorForm.blood_group}
                      onChange={(e) => setDonorForm({ ...donorForm, blood_group: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-black"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={donorForm.phone}
                      onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                      placeholder="+91 98422 12345"
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Area / Location *</label>
                  <input
                    type="text"
                    required
                    value={donorForm.area}
                    onChange={(e) => setDonorForm({ ...donorForm, area: e.target.value })}
                    placeholder="e.g. Peelamedu & PSG Tech"
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Availability Status</label>
                  <select
                    value={donorForm.status}
                    onChange={(e) => setDonorForm({ ...donorForm, status: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black">
                    Save Donor
                  </button>
                </div>
              </form>
            )}

            {/* NEWS FORM */}
            {activeTable === 'news' && (
              <form onSubmit={handleSaveNews} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Headline *</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Category *</label>
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    >
                      {['NEWS', 'OUR CITY', 'BUSINESS', 'TECH', 'INFRASTRUCTURE', 'CEO', 'EVENTS', 'SPORTS', 'EDUCATION'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Author</label>
                    <input
                      type="text"
                      value={newsForm.author}
                      onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Content / Body *</label>
                  <textarea
                    rows={4}
                    required
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newsForm.image_url}
                    onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black">
                    Save Article
                  </button>
                </div>
              </form>
            )}

            {/* EVENTS FORM */}
            {activeTable === 'events' && (
              <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.event_name}
                    onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Event Date</label>
                    <input
                      type="date"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={eventForm.contact_phone}
                      onChange={(e) => setEventForm({ ...eventForm, contact_phone: e.target.value })}
                      className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="e.g. CODISSIA Trade Fair Complex"
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-gray-300 mb-1">Poster Image URL</label>
                  <input
                    type="text"
                    value={eventForm.image_url}
                    onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                    className="w-full p-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-stone-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black">
                    Save Event
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* DELETE CONFIRMATION MODAL                               */}
      {/* ======================================================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-50 dark:bg-red-950/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-stone-900 dark:text-white">Confirm Supabase Deletion</h4>
                <p className="text-xs text-stone-500">This will permanently remove the record from PostgreSQL.</p>
              </div>
            </div>
            <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-stone-700 dark:text-gray-300 truncate">
              ID: {deletingId}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-stone-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider"
              >
                Delete from Supabase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseTablesManager;
