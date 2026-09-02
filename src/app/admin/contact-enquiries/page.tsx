'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dbService, { ContactEnquiryRecord, INITIAL_CONTACT_ENQUIRIES_DB } from '@/services/db';

export default function AdminContactEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<ContactEnquiryRecord[]>(INITIAL_CONTACT_ENQUIRIES_DB);
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiryRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const syncEnquiries = async () => {
    try {
      const list = await dbService.getContactEnquiries();
      if (list) {
        setEnquiries(list);
      }
    } catch (e) {
      console.error('Error fetching enquiries in admin', e);
    }
  };

  useEffect(() => {
    syncEnquiries();
    const unsubscribe = dbService.subscribe(syncEnquiries);

    if (typeof window !== 'undefined') {
      window.addEventListener('enquiriesStorageUpdate', syncEnquiries);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('enquiriesStorageUpdate', syncEnquiries);
      }
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: ContactEnquiryRecord['status']) => {
    try {
      await dbService.updateContactEnquiryStatus(id, newStatus);
      setActionSuccess(`Enquiry marked as ${newStatus}`);
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handlePublishAsDirectoryListing = async (enquiry: ContactEnquiryRecord) => {
    try {
      let bizName = enquiry.name;
      let category = 'Services';
      let categorySlug = 'services';
      let area = 'Coimbatore';
      let description = enquiry.message;

      const nameMatch = enquiry.message.match(/Enquiry for:\s*([^\n]+)/i);
      const catMatch = enquiry.message.match(/Category:\s*([^\n]+)/i);
      const areaMatch = enquiry.message.match(/Area:\s*([^\n]+)/i);
      const detailsMatch = enquiry.message.match(/Details:\s*([\s\S]+)/i);

      if (nameMatch && nameMatch[1]?.trim() && !nameMatch[1].includes('General Business Directory')) {
        bizName = nameMatch[1].trim();
      }
      if (catMatch && catMatch[1]?.trim() && !catMatch[1].includes('General')) {
        category = catMatch[1].trim();
        categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      if (areaMatch && areaMatch[1]?.trim()) {
        area = areaMatch[1].trim();
      }
      if (detailsMatch && detailsMatch[1]?.trim()) {
        description = detailsMatch[1].trim();
      }

      await dbService.saveDirectoryCategory({
        name: category,
        slug: categorySlug,
      });

      await dbService.saveDirectoryListing({
        id: `dir-${Date.now()}`,
        name: bizName,
        ownerName: enquiry.name,
        category,
        categorySlug,
        icon: '🏢',
        rating: 5.0,
        reviewsCount: 1,
        area,
        address: `${area}, Coimbatore`,
        phone: enquiry.phone || '+91 422 200 0000',
        email: enquiry.email,
        timing: '09:00 AM – 08:00 PM',
        description: description || `Verified business in ${area}, Coimbatore.`,
        featured: false,
        popular: true,
        verified: true,
        tags: [category, area],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString(),
      });

      await dbService.updateContactEnquiryStatus(enquiry.id, 'replied');
      if (selectedEnquiry?.id === enquiry.id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: 'replied' });
      }
      setActionSuccess(`Successfully approved & published "${bizName}" to Live Directory!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error('Failed to publish directory listing from enquiry', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this contact enquiry?')) {
      try {
        await dbService.deleteContactEnquiry(id);
        if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
        setActionSuccess('Enquiry deleted successfully.');
        setTimeout(() => setActionSuccess(''), 3000);
      } catch (e) {
        console.error('Failed to delete enquiry', e);
      }
    }
  };

  const filteredEnquiries = enquiries.filter((item) => {
    const itemStatus = (item.status || '').toLowerCase().trim();
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'unread'
        ? itemStatus === 'unread' || itemStatus === 'pending'
        : itemStatus === filterStatus.toLowerCase();
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const unreadCount = enquiries.filter((e) => {
    const st = (e.status || '').toLowerCase().trim();
    return st === 'unread' || st === 'pending';
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans p-4 sm:p-8">
      <div className="w-full mx-auto space-y-6">
        
        {/* Top Navigation */}
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
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-3">
              <span>Contact Enquiries & News Tips</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-black">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and manage incoming community tips, business enquiries, and reader feedback submitted via the Contact Us page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/contact-us"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>View Contact Page</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold animate-in fade-in">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['all', 'unread', 'read', 'replied', 'archived'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-red-600 text-white font-black shadow-xs'
                    : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by sender, email, subject, or keywords..."
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 sm:w-80"
          />
        </div>

        {/* 2-Column List & Inspector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* List of Enquiries (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {filteredEnquiries.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-gray-500 space-y-2">
                <div className="text-3xl">📭</div>
                <div className="text-sm font-bold text-gray-400">No contact enquiries match your filters</div>
              </div>
            ) : (
              filteredEnquiries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedEnquiry(item);
                    if (item.status === 'unread') {
                      handleUpdateStatus(item.id, 'read');
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedEnquiry?.id === item.id
                      ? 'bg-slate-800/90 border-red-500 shadow-md ring-1 ring-red-500'
                      : item.status === 'unread'
                      ? 'bg-slate-900 border-red-600/40 hover:border-red-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {item.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                      )}
                      <span className="text-sm font-black text-white truncate">{item.name}</span>
                      <span className="text-xs text-gray-400 truncate">({item.email})</span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        item.status === 'unread'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : item.status === 'replied'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : item.status === 'read'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-gray-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-gray-300 line-clamp-1">
                    {item.subject}
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-slate-800/60">
                    <span>📞 {item.phone || 'No phone'}</span>
                    <span>{new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detailed Inspector Drawer (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-8 space-y-5">
            {selectedEnquiry ? (
              <div className="space-y-5">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    ENQUIRY DETAILS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(selectedEnquiry.id)}
                      className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800 transition-colors cursor-pointer"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block">Sender</label>
                    <div className="text-base font-black text-white">{selectedEnquiry.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 block">Email</label>
                      <a href={`mailto:${selectedEnquiry.email}`} className="text-red-400 hover:underline break-all">
                        {selectedEnquiry.email}
                      </a>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 block">Phone</label>
                      <div className="text-gray-300 font-bold">{selectedEnquiry.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block">Subject</label>
                    <div className="text-xs font-bold text-white bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                      {selectedEnquiry.subject}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block">Message Body</label>
                    <div className="text-xs text-gray-300 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {selectedEnquiry.message}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Status Workflow</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['unread', 'read', 'replied', 'archived'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedEnquiry.id, st)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                            selectedEnquiry.status === st
                              ? 'bg-red-600 text-white font-black'
                              : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Approve & Publish to Live Directory Action */}
                  <button
                    type="button"
                    onClick={() => handlePublishAsDirectoryListing(selectedEnquiry)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <span>✨ Approve &amp; Publish as Directory Listing</span>
                  </button>

                  {/* Reply via Email Button */}
                  <a
                    href={`mailto:${selectedEnquiry.email}?subject=Re: ${encodeURIComponent(selectedEnquiry.subject)}`}
                    onClick={() => handleUpdateStatus(selectedEnquiry.id, 'replied')}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 text-center cursor-pointer block"
                  >
                    <span>✉ Reply via Email Desk</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 space-y-2">
                <div className="text-3xl">🔍</div>
                <div className="text-xs font-bold text-gray-400">Select an enquiry from the list to inspect full message details and reply.</div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
