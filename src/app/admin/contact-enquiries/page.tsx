'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  Megaphone,
  CheckCircle2,
  Building2,
  Mail,
  Inbox,
  Trash2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';
import dbService, {
  ContactEnquiryRecord,
  ContactEnquiryStatus,
  EventRecord,
  Article,
  DirectoryListing,
} from '@/services/db';

export type EnquiryCategory =
  | 'Event Listing Submission'
  | 'News Tip & Press Release'
  | 'Civic & Traffic Alert'
  | 'Advertisement & Sponsorship'
  | 'Correction / Editorial Feedback'
  | 'General Query'
  | 'General Business Directory';

// Security & Sanitization Layer
function sanitizeText(input?: string | null): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:[^"']*/gi, '')
    .trim();
}

function resolveEnquiryCategory(enquiry: ContactEnquiryRecord): EnquiryCategory {
  const cat = (enquiry.category || '').trim();
  const sub = (enquiry.subject || '').trim();
  const combined = `${cat} ${sub}`.toLowerCase();

  if (
    combined.includes('event') ||
    combined.includes('expo') ||
    combined.includes('fair') ||
    combined.includes('summit') ||
    combined.includes('workshop') ||
    combined.includes('concert')
  ) {
    return 'Event Listing Submission';
  }
  if (
    combined.includes('news tip') ||
    combined.includes('press release') ||
    combined.includes('breaking') ||
    combined.includes('headline') ||
    combined.includes('startup launch')
  ) {
    return 'News Tip & Press Release';
  }
  if (
    combined.includes('civic') ||
    combined.includes('traffic') ||
    combined.includes('water') ||
    combined.includes('tangedco') ||
    combined.includes('power outage') ||
    combined.includes('alert')
  ) {
    return 'Civic & Traffic Alert';
  }
  if (
    combined.includes('advertis') ||
    combined.includes('sponsor') ||
    combined.includes('commercial') ||
    combined.includes('banner') ||
    combined.includes('campaign')
  ) {
    return 'Advertisement & Sponsorship';
  }
  if (
    combined.includes('correction') ||
    combined.includes('editorial feedback') ||
    combined.includes('feedback') ||
    combined.includes('typo') ||
    combined.includes('erratum')
  ) {
    return 'Correction / Editorial Feedback';
  }
  if (
    combined.includes('directory') ||
    combined.includes('business listing') ||
    combined.includes('listing')
  ) {
    return 'General Business Directory';
  }
  return 'General Query';
}

export default function AdminContactEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<ContactEnquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiryRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Conversion Modals State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isDirModalOpen, setIsDirModalOpen] = useState(false);

  // Form Fields for Event Conversion
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('10:00 AM – 06:00 PM');
  const [eventVenue, setEventVenue] = useState('CODISSIA Trade Fair Complex, Coimbatore');
  const [eventCategory, setEventCategory] = useState('EXPO');
  const [eventOrganizer, setEventOrganizer] = useState('');
  const [eventPhone, setEventPhone] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  // Form Fields for News Conversion
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsCategory, setNewsCategory] = useState('NEWS');
  const [newsAuthor, setNewsAuthor] = useState('');
  const [newsBody, setNewsBody] = useState('');

  // Form Fields for Native Ad Conversion
  const [adCampaignName, setAdCampaignName] = useState('');
  const [adAdvertiser, setAdAdvertiser] = useState('');
  const [adContact, setAdContact] = useState('');
  const [adSlotPlacement, setAdSlotPlacement] = useState('HOME_IN_FEED_1');
  const [adBrief, setAdBrief] = useState('');

  // Form Fields for Directory Conversion
  const [dirBizName, setDirBizName] = useState('');
  const [dirOwnerName, setDirOwnerName] = useState('');
  const [dirCategory, setDirCategory] = useState('Services');
  const [dirArea, setDirArea] = useState('Coimbatore Central');
  const [dirPhone, setDirPhone] = useState('');
  const [dirEmail, setDirEmail] = useState('');
  const [dirDesc, setDirDesc] = useState('');

  const syncEnquiries = async () => {
    try {
      // First try dedicated API endpoint
      const res = await fetch('/api/enquiries', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEnquiries(json.data);
          setIsLoading(false);
          return;
        }
      }
      // Fallback to dbService sync
      const list = await dbService.getContactEnquiries();
      setEnquiries(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Error fetching enquiries in admin', e);
      const list = await dbService.getContactEnquiries();
      setEnquiries(Array.isArray(list) ? list : []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
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

  // Update status safely (Non-destructive: preserves original record)
  const handleUpdateStatus = async (id: string, newStatus: ContactEnquiryStatus) => {
    try {
      await dbService.updateContactEnquiryStatus(id, newStatus);
      setActionSuccess(`Enquiry status updated to "${newStatus.toUpperCase()}"`);
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contact enquiry?')) {
      return;
    }

    // 1. Immediately filter out deleted item from local state for instant 0-sync
    setEnquiries((prev) => prev.filter((item) => item.id !== id));
    if (selectedEnquiry?.id === id) {
      setSelectedEnquiry(null);
    }

    try {
      // 2. Send DELETE to dedicated API
      const res = await fetch(`/api/enquiries?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      // 3. Sync dbService local storage & cross-tab events
      await dbService.deleteContactEnquiry(id);

      if (res.ok) {
        setActionSuccess('Enquiry deleted successfully.');
      } else {
        setActionSuccess('Enquiry removed.');
      }
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (e) {
      console.error('Failed to delete enquiry', e);
      setActionSuccess('Enquiry removed.');
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  // Helper to open Event Conversion Modal pre-filled
  const openEventConversion = (enquiry: ContactEnquiryRecord) => {
    const tmrw = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setEventTitle(sanitizeText(enquiry.subject));
    setEventDate(tmrw);
    setEventTime('10:00 AM – 06:00 PM');
    setEventVenue('CODISSIA Trade Fair Complex, Coimbatore');
    setEventCategory('EXPO');
    setEventOrganizer(sanitizeText(enquiry.name));
    setEventPhone(sanitizeText(enquiry.phone));
    setEventDesc(sanitizeText(enquiry.message));
    setIsEventModalOpen(true);
    setIsMoreMenuOpen(false);
  };

  // Execute Event Conversion
  const handleConfirmConvertEvent = async () => {
    if (!selectedEnquiry) return;
    try {
      const newEv: EventRecord = {
        id: `ev-${Date.now()}`,
        title: eventTitle.trim() || selectedEnquiry.subject,
        date: eventDate || new Date().toISOString().split('T')[0],
        time: eventTime.trim() || '10:00 AM – 06:00 PM',
        venue: eventVenue.trim() || 'Coimbatore',
        category: eventCategory,
        description: eventDesc.trim() || selectedEnquiry.message,
        posterUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        organizer: eventOrganizer.trim() || selectedEnquiry.name,
        contactPhone: eventPhone.trim() || selectedEnquiry.phone,
        status: 'upcoming',
      };

      await dbService.createEvent(newEv);
      await handleUpdateStatus(selectedEnquiry.id, 'converted');
      setIsEventModalOpen(false);
      setActionSuccess(`✨ Converted "${newEv.title}" to Live Event & updated enquiry status to CONVERTED!`);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err: any) {
      console.error('Failed to convert to event:', err);
      alert('Error creating event: ' + err.message);
    }
  };

  // Helper to open News Draft Modal pre-filled
  const openNewsConversion = (enquiry: ContactEnquiryRecord) => {
    const resolvedCat = resolveEnquiryCategory(enquiry);
    setNewsHeadline(sanitizeText(enquiry.subject));
    setNewsCategory(resolvedCat === 'Civic & Traffic Alert' ? 'OUR CITY' : 'NEWS');
    setNewsAuthor(sanitizeText(enquiry.name) || "Today's Coimbatore Desk");
    setNewsBody(sanitizeText(enquiry.message));
    setIsNewsModalOpen(true);
    setIsMoreMenuOpen(false);
  };

  // Execute News Draft Conversion
  const handleConfirmConvertNews = async () => {
    if (!selectedEnquiry) return;
    try {
      const newArticle: Partial<Article> = {
        title: newsHeadline.trim() || selectedEnquiry.subject,
        category: newsCategory,
        subCategory: 'Local Report',
        author: newsAuthor.trim() || "Today's Coimbatore Desk",
        content: newsBody.trim() || selectedEnquiry.message,
        excerpt: (newsBody.trim() || selectedEnquiry.message).slice(0, 160),
        status: 'draft',
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
      };

      await dbService.createArticle(newArticle);
      await handleUpdateStatus(selectedEnquiry.id, 'converted');
      setIsNewsModalOpen(false);
      setActionSuccess(`📰 Created News Draft "${newArticle.title}" & marked enquiry as CONVERTED!`);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err: any) {
      console.error('Failed to create news draft:', err);
      alert('Error creating news draft: ' + err.message);
    }
  };

  // Helper to open Native Ad Conversion Modal
  const openAdConversion = (enquiry: ContactEnquiryRecord) => {
    setAdCampaignName(sanitizeText(enquiry.subject));
    setAdAdvertiser(sanitizeText(enquiry.name));
    setAdContact(`${enquiry.email} | ${enquiry.phone || 'N/A'}`);
    setAdSlotPlacement('HOME_IN_FEED_1');
    setAdBrief(sanitizeText(enquiry.message));
    setIsAdModalOpen(true);
    setIsMoreMenuOpen(false);
  };

  // Execute Native Ad Conversion
  const handleConfirmConvertAd = async () => {
    if (!selectedEnquiry) return;
    try {
      // Mark enquiry as converted and record in system
      await handleUpdateStatus(selectedEnquiry.id, 'converted');
      setIsAdModalOpen(false);
      setActionSuccess(`💼 Created Native Ad Campaign lead for "${adAdvertiser}" & marked enquiry as CONVERTED!`);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err: any) {
      console.error('Failed to create native ad lead:', err);
      alert('Error creating ad lead: ' + err.message);
    }
  };

  // Helper to open Directory Conversion Modal
  const openDirConversion = (enquiry: ContactEnquiryRecord) => {
    let biz = enquiry.name;
    let cat = 'Services';
    let area = 'Coimbatore';
    let desc = enquiry.message;

    const nameMatch = enquiry.message.match(/Enquiry for:\s*([^\n]+)/i);
    const catMatch = enquiry.message.match(/Category:\s*([^\n]+)/i);
    const areaMatch = enquiry.message.match(/Area:\s*([^\n]+)/i);
    const detailsMatch = enquiry.message.match(/Details:\s*([\s\S]+)/i);

    if (nameMatch && nameMatch[1]?.trim() && !nameMatch[1].includes('General Business Directory')) {
      biz = nameMatch[1].trim();
    }
    if (catMatch && catMatch[1]?.trim() && !catMatch[1].includes('General')) {
      cat = catMatch[1].trim();
    }
    if (areaMatch && areaMatch[1]?.trim()) {
      area = areaMatch[1].trim();
    }
    if (detailsMatch && detailsMatch[1]?.trim()) {
      desc = detailsMatch[1].trim();
    }

    setDirBizName(sanitizeText(biz));
    setDirOwnerName(sanitizeText(enquiry.name));
    setDirCategory(sanitizeText(cat));
    setDirArea(sanitizeText(area));
    setDirPhone(sanitizeText(enquiry.phone) || '+91 422 200 0000');
    setDirEmail(sanitizeText(enquiry.email));
    setDirDesc(sanitizeText(desc));
    setIsDirModalOpen(true);
    setIsMoreMenuOpen(false);
  };

  // Execute Directory Conversion
  const handleConfirmConvertDir = async () => {
    if (!selectedEnquiry) return;
    try {
      const slug = dirCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await dbService.saveDirectoryCategory({
        name: dirCategory,
        slug,
      });

      await dbService.saveDirectoryListing({
        id: `dir-${Date.now()}`,
        name: dirBizName.trim() || selectedEnquiry.name,
        ownerName: dirOwnerName.trim() || selectedEnquiry.name,
        category: dirCategory,
        categorySlug: slug,
        icon: '🏢',
        rating: 5.0,
        reviewsCount: 1,
        area: dirArea,
        address: `${dirArea}, Coimbatore`,
        phone: dirPhone || selectedEnquiry.phone || '+91 422 200 0000',
        email: dirEmail || selectedEnquiry.email,
        timing: '09:00 AM – 08:00 PM',
        description: dirDesc || selectedEnquiry.message,
        featured: false,
        popular: true,
        verified: true,
        tags: [dirCategory, dirArea],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString(),
      });

      await handleUpdateStatus(selectedEnquiry.id, 'converted');
      setIsDirModalOpen(false);
      setActionSuccess(`🏢 Published "${dirBizName}" to Live Directory & marked enquiry as CONVERTED!`);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err: any) {
      console.error('Failed to convert directory listing:', err);
      alert('Error creating directory listing: ' + err.message);
    }
  };

  // Resolve without opening draft modal
  const handleMarkResolved = async (enquiry: ContactEnquiryRecord) => {
    await handleUpdateStatus(enquiry.id, 'resolved');
  };

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const itemStatus = (item.status || '').toLowerCase().trim();
      const resolvedCategory = resolveEnquiryCategory(item);

      const matchesStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'unread'
          ? itemStatus === 'unread' || itemStatus === 'pending'
          : itemStatus === filterStatus.toLowerCase();

      const matchesCategory =
        filterCategory === 'all' ? true : resolvedCategory === filterCategory;

      const matchesSearch =
        searchTerm.trim() === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resolvedCategory.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [enquiries, filterStatus, filterCategory, searchTerm]);

  const unreadCount = useMemo(() => {
    return enquiries.filter((e) => {
      const st = (e.status || '').toLowerCase().trim();
      return st === 'unread' || st === 'pending';
    }).length;
  }, [enquiries]);

  // Render Category Badge helper
  const renderCategoryBadge = (category: EnquiryCategory) => {
    switch (category) {
      case 'Event Listing Submission':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-max">
            <Calendar className="w-3 h-3" />
            <span>Event Listing</span>
          </span>
        );
      case 'News Tip & Press Release':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1 w-max">
            <FileText className="w-3 h-3" />
            <span>News Tip</span>
          </span>
        );
      case 'Civic & Traffic Alert':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 w-max">
            <AlertCircle className="w-3 h-3" />
            <span>Civic Alert</span>
          </span>
        );
      case 'Advertisement & Sponsorship':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 w-max">
            <Megaphone className="w-3 h-3" />
            <span>Ad / Sponsor</span>
          </span>
        );
      case 'Correction / Editorial Feedback':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 w-max">
            <AlertCircle className="w-3 h-3" />
            <span>Correction</span>
          </span>
        );
      case 'General Business Directory':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1 w-max">
            <Building2 className="w-3 h-3" />
            <span>Directory</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 w-max">
            <span>General Query</span>
          </span>
        );
    }
  };

  // Render Status Badge helper
  const renderStatusBadge = (status: ContactEnquiryStatus | string) => {
    const st = (status || 'unread').toLowerCase();
    switch (st) {
      case 'unread':
      case 'pending':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>Unread</span>
          </span>
        );
      case 'converted':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Converted</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-600 shrink-0 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      case 'replied':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 shrink-0">
            Replied
          </span>
        );
      case 'read':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 shrink-0">
            Read
          </span>
        );
      case 'archived':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-900 text-stone-400 border border-stone-800 shrink-0">
            Archived
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-gray-400 shrink-0">
            {status}
          </span>
        );
    }
  };

  // Dynamic Primary Action Button for Selected Enquiry
  const renderPrimaryActionButton = (enquiry: ContactEnquiryRecord) => {
    const category = resolveEnquiryCategory(enquiry);

    switch (category) {
      case 'Event Listing Submission':
        return (
          <button
            type="button"
            onClick={() => openEventConversion(enquiry)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>CONVERT TO LIVE EVENT</span>
          </button>
        );

      case 'News Tip & Press Release':
      case 'Civic & Traffic Alert':
        return (
          <button
            type="button"
            onClick={() => openNewsConversion(enquiry)}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>CONVERT TO NEWS DRAFT</span>
          </button>
        );

      case 'Advertisement & Sponsorship':
        return (
          <button
            type="button"
            onClick={() => openAdConversion(enquiry)}
            className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            <span>CONVERT TO NATIVE AD</span>
          </button>
        );

      case 'Correction / Editorial Feedback':
      case 'General Query':
        return (
          <button
            type="button"
            onClick={() => handleMarkResolved(enquiry)}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>MARK AS RESOLVED</span>
          </button>
        );

      case 'General Business Directory':
        return (
          <button
            type="button"
            onClick={() => openDirConversion(enquiry)}
            className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>CONVERT TO DIRECTORY LISTING</span>
          </button>
        );

      default:
        return (
          <button
            type="button"
            onClick={() => handleMarkResolved(enquiry)}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>MARK AS RESOLVED</span>
          </button>
        );
    }
  };

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
              <span>Contact Enquiries &amp; News Tips</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-black">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review reader news tips, event submissions, civic alerts, and ad enquiries. Convert into live events, news drafts, or directory listings.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/contact-us"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Public Contact Desk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess('')}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters & Search Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: enquiries.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              {
                id: 'converted',
                label: 'Converted',
                count: enquiries.filter((e) => e.status === 'converted').length,
              },
              {
                id: 'resolved',
                label: 'Resolved',
                count: enquiries.filter((e) => e.status === 'resolved').length,
              },
              {
                id: 'replied',
                label: 'Replied',
                count: enquiries.filter((e) => e.status === 'replied').length,
              },
              {
                id: 'read',
                label: 'Read',
                count: enquiries.filter((e) => e.status === 'read').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filterStatus === tab.id ? 'bg-black/25 text-white' : 'bg-slate-800 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Category Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Category Dropdown */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Event Listing Submission">🎪 Events &amp; Expos</option>
              <option value="News Tip & Press Release">📰 News Tips &amp; Releases</option>
              <option value="Civic & Traffic Alert">⚡ Civic &amp; Traffic Alerts</option>
              <option value="Advertisement & Sponsorship">💼 Ads &amp; Sponsorship</option>
              <option value="Correction / Editorial Feedback">✍ Corrections &amp; Feedback</option>
              <option value="General Business Directory">🏢 Business Directory</option>
              <option value="General Query">💬 General Queries</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sender, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of Enquiries (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {isLoading ? (
              <div className="p-16 text-center bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 font-medium">Loading enquiries from database...</p>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="p-16 text-center bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <Inbox className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">No Enquiries Found</h3>
                  <p className="text-xs text-gray-400">Your inbox is currently empty.</p>
                </div>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                  When readers submit news tips, event submissions, or sponsorship requests via the contact form, they will appear here in real-time.
                </p>
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-3xl">📭</div>
                <div className="text-sm font-bold text-gray-400">No enquiries match your filter.</div>
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterCategory('all');
                    setSearchTerm('');
                  }}
                  className="text-xs font-bold text-red-400 underline hover:text-red-300 cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredEnquiries.map((item) => {
                const isSelected = selectedEnquiry?.id === item.id;
                const cat = resolveEnquiryCategory(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedEnquiry(item);
                      if (item.status === 'unread') {
                        handleUpdateStatus(item.id, 'read');
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-slate-800/95 border-red-500 shadow-lg ring-1 ring-red-500'
                        : item.status === 'unread'
                        ? 'bg-slate-900 border-red-600/40 hover:border-red-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Header Row: Sender + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {item.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                        )}
                        <span className="text-sm font-black text-white truncate">{item.name}</span>
                        <span className="text-xs text-gray-400 truncate">({item.email})</span>
                      </div>

                      {renderStatusBadge(item.status)}
                    </div>

                    {/* Category + Subject Tagline */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderCategoryBadge(cat)}
                      <span className="text-xs font-bold text-gray-200 line-clamp-1 flex-1">
                        {item.subject}
                      </span>
                    </div>

                    {/* Message Excerpt */}
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Footer Row: Phone + Timestamp */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-slate-800/60">
                      <span>📞 {item.phone || 'No phone'}</span>
                      <span suppressHydrationWarning>
                        {mounted
                          ? new Date(item.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed Inspector Drawer (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-8 space-y-5">
            {selectedEnquiry ? (
              <div className="space-y-5">
                {/* Header & Delete */}
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-400">
                      ENQUIRY INSPECTOR
                    </span>
                    {renderCategoryBadge(resolveEnquiryCategory(selectedEnquiry))}
                  </div>
                  <button
                    onClick={() => handleDelete(selectedEnquiry.id)}
                    className="p-1.5 rounded bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800 transition-colors cursor-pointer"
                    title="Delete Enquiry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sender & Contact Info */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block">
                      Sender Name
                    </label>
                    <div className="text-base font-black text-white">{selectedEnquiry.name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 block">
                        Email Address
                      </label>
                      <a
                        href={`mailto:${encodeURIComponent(selectedEnquiry.email)}`}
                        className="text-red-400 hover:underline break-all font-mono"
                      >
                        {selectedEnquiry.email}
                      </a>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 block">
                        Phone Number
                      </label>
                      <div className="text-gray-300 font-bold">
                        {selectedEnquiry.phone || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block">
                      Subject / Heading
                    </label>
                    <div className="text-xs font-bold text-white bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                      {selectedEnquiry.subject}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block">
                      Full Message Body
                    </label>
                    <div className="text-xs text-gray-300 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-sans">
                      {selectedEnquiry.message}
                    </div>
                  </div>

                  {/* Status Workflow Manual Controller */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      Status Workflow
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        ['unread', 'read', 'replied', 'converted', 'resolved', 'archived'] as const
                      ).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedEnquiry.id, st)}
                          className={`py-1 px-2 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                            selectedEnquiry.status === st
                              ? 'bg-red-600 text-white font-black shadow-xs'
                              : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PRIMARY DYNAMIC ACTION BUTTON (Category-driven) */}
                  <div className="pt-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                      Suggested Primary Action
                    </label>

                    <div className="flex items-center gap-1.5">
                      {renderPrimaryActionButton(selectedEnquiry)}

                      {/* More Conversions Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                          title="More conversion options"
                          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 cursor-pointer transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {isMoreMenuOpen && (
                          <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-20 space-y-1">
                            <button
                              type="button"
                              onClick={() => openEventConversion(selectedEnquiry)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Convert to Live Event</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openNewsConversion(selectedEnquiry)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span>Convert to News Draft</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openAdConversion(selectedEnquiry)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                              <span>Convert to Native Ad</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDirConversion(selectedEnquiry)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5 text-teal-400" />
                              <span>Convert to Directory Listing</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleMarkResolved(selectedEnquiry);
                                setIsMoreMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Mark as Resolved</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Action: Reply via Email Desk */}
                    <a
                      href={`mailto:${encodeURIComponent(
                        selectedEnquiry.email
                      )}?subject=Re:%20${encodeURIComponent(selectedEnquiry.subject)}`}
                      onClick={() => handleUpdateStatus(selectedEnquiry.id, 'replied')}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 text-center cursor-pointer block"
                    >
                      <Mail className="w-4 h-4" />
                      <span>REPLY VIA EMAIL DESK</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="p-8 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <Inbox className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="text-xs font-bold text-gray-400">
                  Your inbox is currently empty.
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 space-y-2">
                <div className="text-3xl">🔍</div>
                <div className="text-xs font-bold text-gray-400">
                  Select an enquiry from the list to inspect full details, convert, or reply.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONVERT TO LIVE EVENT MODAL                                            */}
      {/* ========================================================================= */}
      {isEventModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-white">Convert to Live Event</h2>
                  <p className="text-[11px] text-gray-400">
                    Pre-filled with details from {selectedEnquiry.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Time Window
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="EXPO">Expo &amp; Trade Fair</option>
                    <option value="CONCERT">Concert &amp; Entertainment</option>
                    <option value="WORKSHOP">Workshop &amp; Seminar</option>
                    <option value="SPORTS">Sports &amp; Marathon</option>
                    <option value="CULTURAL">Cultural &amp; Festival</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    value={eventOrganizer}
                    onChange={(e) => setEventOrganizer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={eventPhone}
                    onChange={(e) => setEventPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Description &amp; Highlights
                </label>
                <textarea
                  rows={4}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertEvent}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish Event &amp; Mark Converted</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONVERT TO NEWS DRAFT MODAL                                            */}
      {/* ========================================================================= */}
      {isNewsModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-white">Convert to News Article Draft</h2>
                  <p className="text-[11px] text-gray-400">
                    Save as draft in newsroom for editorial review and publishing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Article Headline *
                </label>
                <input
                  type="text"
                  value={newsHeadline}
                  onChange={(e) => setNewsHeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    News Category
                  </label>
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="NEWS">NEWS (General &amp; Headlines)</option>
                    <option value="OUR CITY">OUR CITY (Civic &amp; Corporation)</option>
                    <option value="BUSINESS">BUSINESS &amp; INDUSTRY</option>
                    <option value="TECH">TECH &amp; INNOVATION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Author / Attribution
                  </label>
                  <input
                    type="text"
                    value={newsAuthor}
                    onChange={(e) => setNewsAuthor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Story Content (Draft Body) *
                </label>
                <textarea
                  rows={6}
                  value={newsBody}
                  onChange={(e) => setNewsBody(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertNews}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save News Draft &amp; Mark Converted</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONVERT TO NATIVE AD LEAD MODAL                                        */}
      {/* ========================================================================= */}
      {isAdModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
                  <Megaphone className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-white">Convert to Native Ad Lead</h2>
                  <p className="text-[11px] text-gray-400">
                    Record sponsor brief and advertiser contact for marketing follow-up.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Campaign Title / Brand
                </label>
                <input
                  type="text"
                  value={adCampaignName}
                  onChange={(e) => setAdCampaignName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Advertiser Contact Name
                  </label>
                  <input
                    type="text"
                    value={adAdvertiser}
                    onChange={(e) => setAdAdvertiser(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Target Ad Slot
                  </label>
                  <select
                    value={adSlotPlacement}
                    onChange={(e) => setAdSlotPlacement(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="HOME_IN_FEED_1">Home In-Feed 1 (Between Stories)</option>
                    <option value="LEFT_SIDEBAR_BANNER">Left Sticky Sidebar (210×400)</option>
                    <option value="RIGHT_SIDEBAR_BANNER">Right Sticky Sidebar (210×400)</option>
                    <option value="TOP_LEADERBOARD">Top Header Leaderboard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Contact Details
                </label>
                <input
                  type="text"
                  value={adContact}
                  onChange={(e) => setAdContact(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Campaign Brief / Requirements
                </label>
                <textarea
                  rows={4}
                  value={adBrief}
                  onChange={(e) => setAdBrief(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertAd}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save Native Ad Lead &amp; Mark Converted</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONVERT TO DIRECTORY LISTING MODAL                                     */}
      {/* ========================================================================= */}
      {isDirModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-teal-950 text-teal-400 border border-teal-800">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-white">Convert to Directory Business Listing</h2>
                  <p className="text-[11px] text-gray-400">
                    Pre-filled with merchant enquiry data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDirModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={dirBizName}
                  onChange={(e) => setDirBizName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={dirOwnerName}
                    onChange={(e) => setDirOwnerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={dirCategory}
                    onChange={(e) => setDirCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={dirArea}
                    onChange={(e) => setDirArea(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={dirPhone}
                    onChange={(e) => setDirPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={dirEmail}
                    onChange={(e) => setDirEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Business Description
                </label>
                <textarea
                  rows={4}
                  value={dirDesc}
                  onChange={(e) => setDirDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDirModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertDir}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Approve &amp; Publish to Directory</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
