'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dbService, {
  Article,
  CategoryRecord,
  UserRecord,
  OutageRecord,
  AdSlotRecord,
  BloodDonorRecord,
  EmergencyBloodAlert,
  DonorContactRequest,
  EventRecord,
  DirectoryListing,
  DirectoryVerificationRecord,
  DirectoryReview,
  ContactEnquiryRecord,
  formatRelativeTime,
} from '@/services/db';
import { getCategoryMeta, getCategoryFallbackImage, slugify } from '@/app/directory/components/DirectoryIcons';
import { SupabaseTablesManager } from './components/SupabaseTablesManager';

/* -------------------------------------------------------------------------- */
/*                                Types & State                               */
/* -------------------------------------------------------------------------- */

interface OutageItem {
  id: string;
  area: string;
  substation?: string;
  date?: string;
  time: string;
  status: 'active' | 'maintenance' | 'restored' | 'scheduled';
  details: string;
  isTomorrow?: boolean;
  affectedStreets?: string[];
  isAutoSynced?: boolean;
}

interface AdSlotSetting {
  id: string;
  slotId?: string;
  placementKey?: 'TOP_HEADER_LEADERBOARD' | 'HOME_IN_FEED_1' | 'HOME_IN_FEED_2' | 'RIGHT_SIDEBAR_TOP' | 'RIGHT_SIDEBAR_BOTTOM' | 'ARTICLE_DETAIL_BOTTOM' | string;
  format: string;
  title: string;
  description?: string;
  advertiser: string;
  imageUrl?: string;
  bannerUrl?: string;
  linkUrl?: string;
  ctaUrl?: string;
  ctaText?: string;
  impressions: string;
  ctr: string;
  active: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  fallbackAdSense: boolean;
}

const INITIAL_OUTAGES: OutageItem[] = [
  {
    id: 'out-1',
    area: 'Peelamedu & SITRA',
    substation: '110/22kV SITRA Substation',
    date: '2026-08-23',
    time: '09:00 AM – 04:00 PM',
    status: 'scheduled',
    details: '110kV Substation Line Clearing & Feeder Upgrades',
    isTomorrow: true,
    isAutoSynced: true,
    affectedStreets: ['Avinashi Rd', 'Hope College', 'PSG Tech Campus', 'SITRA Junction'],
  },
  {
    id: 'out-2',
    area: 'Saravanampatti IT Corridor',
    substation: '230/110kV Saravanampatti Grid',
    date: '2026-08-23',
    time: '10:00 AM – 03:00 PM',
    status: 'scheduled',
    details: 'Substation Transformer Servicing & HT Cable Work',
    isTomorrow: true,
    isAutoSynced: true,
    affectedStreets: ['Sathy Road', 'Keeranatham IT Park', 'KGISL Campus'],
  },
  {
    id: 'out-3',
    area: 'Gandhipuram & Cross Cut Rd',
    substation: '110/11kV Central Substation',
    date: '2026-08-23',
    time: '09:30 AM – 02:30 PM',
    status: 'scheduled',
    details: 'Feeder RMU Replacement & Underground Cable Network Maintenance',
    isTomorrow: true,
    isAutoSynced: true,
    affectedStreets: ['Cross Cut Road', '100 Feet Road', 'Ram Nagar East'],
  },
];

const INITIAL_ADS: AdSlotSetting[] = [
  {
    id: 'ad-slot-1',
    slotId: 'TOP_HEADER_LEADERBOARD',
    placementKey: 'TOP_HEADER_LEADERBOARD',
    format: 'Top Header Leaderboard (728x90)',
    title: 'TIDEL Park Coimbatore Phase-2 Office Suites Open for Booking',
    description: 'Grade-A tech park infrastructure along Avinashi Road with 100% power backup and direct metro access.',
    advertiser: 'ELCOT / TIDEL Coimbatore',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'https://todayscoimbatore.com',
    ctaText: 'Explore Floor Plans',
    impressions: '24,580',
    ctr: '3.8%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
  },
  {
    id: 'ad-slot-2',
    slotId: 'HOME_IN_FEED_1',
    placementKey: 'HOME_IN_FEED_1',
    format: 'Home In-Feed 1 (Between Stories & Our City)',
    title: 'ELGi Industrial Air Compressors & Smart Automation Solutions',
    description: 'Upgrade factory floor efficiency with Industry 4.0 energy-saving rotary screw compressors manufactured in Coimbatore.',
    advertiser: 'ELGi Equipments Global',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'https://todayscoimbatore.com',
    ctaText: 'Book Free Plant Energy Audit',
    impressions: '18,950',
    ctr: '4.2%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
  },
  {
    id: 'ad-slot-3',
    slotId: 'HOME_IN_FEED_2',
    placementKey: 'HOME_IN_FEED_2',
    format: 'Home In-Feed 2 (Between Business & Tech)',
    title: 'Kongu Living Gated Villa Community in Saravanampatti IT Corridor',
    description: 'DTCP & RERA approved 3 & 4 BHK luxury smart villas with clubhouse, EV charging points, and 24/7 security.',
    advertiser: 'Kongu Living Developers',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'https://todayscoimbatore.com',
    ctaText: 'Schedule Site Visit & Brochure',
    impressions: '16,740',
    ctr: '3.9%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
  },
  {
    id: 'ad-slot-4',
    slotId: 'RIGHT_SIDEBAR_TOP',
    placementKey: 'RIGHT_SIDEBAR_TOP',
    format: 'Right Sidebar Top (300x250 Medium Rectangle)',
    title: 'Invest in Premium Villa Plots in Saravanampatti',
    description: 'DTCP & RERA approved gated layout with 40-ft roads and clubhouse amenities.',
    advertiser: 'Kongu Living Estates',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    linkUrl: 'https://todayscoimbatore.com',
    ctaText: 'View Layout Plan',
    impressions: '22,410',
    ctr: '3.8%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
  },
  {
    id: 'ad-slot-5',
    slotId: 'RIGHT_SIDEBAR_BOTTOM',
    placementKey: 'RIGHT_SIDEBAR_BOTTOM',
    format: 'Right Sidebar Bottom (300x380 / Half Page)',
    title: 'PSG Tech Executive Management & Industry 4.0 Programs',
    description: 'Weekend executive certifications and advanced engineering leadership degrees for professionals.',
    advertiser: 'PSG College of Technology',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
    linkUrl: 'https://todayscoimbatore.com',
    ctaText: 'Apply Online',
    impressions: '15,120',
    ctr: '3.5%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
  },
  {
    id: 'ad-slot-6',
    slotId: 'ARTICLE_DETAIL_BOTTOM',
    placementKey: 'ARTICLE_DETAIL_BOTTOM',
    format: 'Article Detail Bottom (In-Article Fluid)',
    title: 'Coimbatore Airport Runway Expansion & Modern Logistics Terminal',
    description: 'Direct air cargo handling facilities and multimodal connectivity across Kongu region.',
    advertiser: 'Coimbatore Aviation Infrastructure Forum',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'https://todayscoimbatore.com',
    ctaText: 'View Transit Report',
    impressions: '12,930',
    ctr: '4.5%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
  },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'supabase' | 'articles' | 'outages' | 'ads' | 'blood' | 'events' | 'directory' | 'verifications' | 'reviews' | 'explorer'>('supabase');
  
  // Articles state from DB Service
  const [articles, setArticles] = useState<Article[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('NEWS');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newAuthor, setNewAuthor] = useState('Editorial Bureau');
  const [newReadTime, setNewReadTime] = useState('3 min');
  const [newContent, setNewContent] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [articleSuccess, setArticleSuccess] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Live real-time ticker to tick relative time every second (1 sec ago, 2 secs ago...)
  const [, setLiveTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTicker((prev) => (prev + 1) % 1000000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Edit Article Modal State
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Category Filtering State in Admin Portal
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  const ADMIN_FILTER_CATEGORIES = [
    'All',
    'NEWS',
    'OUR CITY',
    'BUSINESS',
    'TECH',
    'INFRASTRUCTURE',
    'CEO',
    'EVENTS',
    'SPORTS',
    'EDUCATION',
    'E-PAPER',
  ];

  const getCategoryCount = (catName: string, catSlug?: string) => {
    if (catName === 'All') return articles.length;
    return articles.filter((article: any) => {
      const cat = (article.category || '').toLowerCase().trim();
      const targetName = (catName || '').toLowerCase().trim();
      const targetSlug = (catSlug || '').toLowerCase().replace('/', '').trim();
      return cat === targetName || (targetSlug && cat === targetSlug);
    }).length;
  };

  const filteredArticles = (selectedCategoryFilter === 'All'
    ? articles
    : articles.filter((item) => {
        const cat = (item.category || '').toLowerCase().trim();
        const target = selectedCategoryFilter.toLowerCase().trim();
        const cleanTarget = target.replace(/-/g, ' ');
        const normCat = cat.replace(/[^a-z0-9]/g, '');
        const normTarget = target.replace(/[^a-z0-9]/g, '');

        if (cat === target || cat === cleanTarget || normCat === normTarget) return true;
        if (target === 'infrastructure') return (item.subCategory || '').toLowerCase().includes('infrastructure') || cat.includes('infra');
        if (target === 'our city' || target === 'our-city') return cat.includes('city') || cat.includes('civic');
        if (target === 'ceo' || target === 'ceos') return cat.includes('ceo') || cat.includes('founder');
        return false;
      })
  ).sort((a, b) => {
    // Strictly latest activity first (newest published or edited story ALWAYS at the top)
    const timeA = Math.max(
      new Date(a.updatedAt || 0).getTime() || 0,
      new Date(a.createdAt || a.publishedAt || 0).getTime() || 0
    );
    const timeB = Math.max(
      new Date(b.updatedAt || 0).getTime() || 0,
      new Date(b.createdAt || b.publishedAt || 0).getTime() || 0
    );
    return timeB - timeA;
  });

  // Media state
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Database Explorer State
  const [selectedTable, setSelectedTable] = useState<'articles' | 'categories' | 'power_outages' | 'users' | 'ad_slots' | 'donors' | 'events' | 'verifications' | 'reviews'>('articles');
  const [explorerSearch, setExplorerSearch] = useState('');
  const [inspectingRow, setInspectingRow] = useState<any | null>(null);
  const [categoriesList, setCategoriesList] = useState<CategoryRecord[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [outagesDbList, setOutagesDbList] = useState<OutageRecord[]>([]);
  const [adsDbList, setAdsDbList] = useState<AdSlotRecord[]>([]);
  const [donorsDbList, setDonorsDbList] = useState<BloodDonorRecord[]>([]);
  const [eventsDbList, setEventsDbList] = useState<EventRecord[]>([]);

  // Helper: Tomorrow's Date String (YYYY-MM-DD)
  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Outages state & Automation Controls
  const [outages, setOutages] = useState<OutageItem[]>(INITIAL_OUTAGES);
  const [outageSuccess, setOutageSuccess] = useState('');
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [filterDate, setFilterDate] = useState(getTomorrowDateStr());
  const [editingOutage, setEditingOutage] = useState<OutageItem | null>(null);
  const [isAddingOutage, setIsAddingOutage] = useState(false);
  const [newOutageArea, setNewOutageArea] = useState('');
  const [newOutageSubstation, setNewOutageSubstation] = useState('');
  const [newOutageDate, setNewOutageDate] = useState(getTomorrowDateStr());
  const [newOutageTime, setNewOutageTime] = useState('09:30 AM – 02:30 PM');
  const [newOutageStatus, setNewOutageStatus] = useState<'scheduled' | 'active' | 'restored' | 'maintenance'>('scheduled');
  const [newOutageDetails, setNewOutageDetails] = useState('');
  const [newOutageStreets, setNewOutageStreets] = useState('');

  // Ads state
  const [ads, setAds] = useState<AdSlotSetting[]>(INITIAL_ADS);
  const [adSuccess, setAdSuccess] = useState('');
  const [editingAdSlot, setEditingAdSlot] = useState<AdSlotSetting | null>(null);

  // Blood Donors State
  const [donors, setDonors] = useState<BloodDonorRecord[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyBloodAlert[]>([]);
  const [donorEnquiries, setDonorEnquiries] = useState<DonorContactRequest[]>([]);
  const [enquiryFilterStatus, setEnquiryFilterStatus] = useState<string>('ALL');
  const [donorSuccess, setDonorSuccess] = useState('');
  const [donorBloodFilter, setDonorBloodFilter] = useState('ALL');
  const [donorAreaSearch, setDonorAreaSearch] = useState('');
  const [editingDonor, setEditingDonor] = useState<BloodDonorRecord | null>(null);
  const [isAddingDonor, setIsAddingDonor] = useState(false);
  const [isAddingEmergencyAlert, setIsAddingEmergencyAlert] = useState(false);

  // New Donor Form state
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorBloodGroup, setNewDonorBloodGroup] = useState('O+');
  const [newDonorArea, setNewDonorArea] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');
  const [newDonorWhatsapp, setNewDonorWhatsapp] = useState('');
  const [newDonorVerified, setNewDonorVerified] = useState(true);
  const [newDonorAvailable, setNewDonorAvailable] = useState(true);

  // New Emergency Alert Form state
  const [newEmgPatient, setNewEmgPatient] = useState('');
  const [newEmgHospital, setNewEmgHospital] = useState('');
  const [newEmgBloodGroup, setNewEmgBloodGroup] = useState('O-');
  const [newEmgUnits, setNewEmgUnits] = useState(2);
  const [newEmgPhone, setNewEmgPhone] = useState('');
  const [newEmgUrgency, setNewEmgUrgency] = useState<'critical' | 'immediate' | 'within_24h'>('critical');

  // Events State
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventSuccess, setEventSuccess] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('ALL');
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // New Event Form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('EXPO');
  const [newEventDate, setNewEventDate] = useState(getTomorrowDateStr());
  const [newEventTime, setNewEventTime] = useState('10:00 AM – 06:00 PM');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventMapLink, setNewEventMapLink] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('Free Entry');
  const [newEventPosterUrl, setNewEventPosterUrl] = useState('');
  const [newEventVideoUrl, setNewEventVideoUrl] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventOrganizer, setNewEventOrganizer] = useState('Today’s Coimbatore Events Bureau');
  const [newEventRegLink, setNewEventRegLink] = useState('');
  const [newEventStatus, setNewEventStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');
  const [newEventFeatured, setNewEventFeatured] = useState(false);

  // Directory Management State
  const [directoryListings, setDirectoryListings] = useState<DirectoryListing[]>([]);
  const [dirSuccess, setDirSuccess] = useState('');
  const [dirCategoryFilter, setDirCategoryFilter] = useState('ALL');
  const [dirSearchQuery, setDirSearchQuery] = useState('');
  const [editingDirectory, setEditingDirectory] = useState<DirectoryListing | null>(null);
  const [isAddingDirectory, setIsAddingDirectory] = useState(false);

  const uniqueDirectoryCategoriesCount = useMemo(() => {
    return Array.from(
      new Set(directoryListings.map((i) => (i.category || '').trim()).filter(Boolean))
    ).length;
  }, [directoryListings]);

  // Directory User Verifications State
  const [verificationsList, setVerificationsList] = useState<DirectoryVerificationRecord[]>([]);
  const [verSearchQuery, setVerSearchQuery] = useState('');
  const [verSuccess, setVerSuccess] = useState('');

  // Directory Reviews Moderation State
  const [reviewsList, setReviewsList] = useState<DirectoryReview[]>([]);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Contact Enquiries State for Admin Notification Badge
  const [contactEnquiriesList, setContactEnquiriesList] = useState<ContactEnquiryRecord[]>([]);

  const pendingEnquiriesCount = useMemo(() => {
    return contactEnquiriesList.filter((e) => {
      const st = (e.status || '').toLowerCase().trim();
      return st === 'unread' || st === 'pending';
    }).length;
  }, [contactEnquiriesList]);

  // New Directory Form state
  const [newDirName, setNewDirName] = useState('');
  const [newDirOwnerName, setNewDirOwnerName] = useState('');
  const [newDirCategorySlug, setNewDirCategorySlug] = useState('hospitals-clinics');
  const [newDirCustomCategory, setNewDirCustomCategory] = useState('');
  const [editingDirCustomCategory, setEditingDirCustomCategory] = useState('');
  const [newDirRating, setNewDirRating] = useState(4.8);
  const [newDirReviewsCount, setNewDirReviewsCount] = useState(120);
  const [newDirArea, setNewDirArea] = useState('');
  const [newDirAddress, setNewDirAddress] = useState('');
  const [newDirPhone, setNewDirPhone] = useState('');
  const [newDirEmail, setNewDirEmail] = useState('');
  const [newDirWebsite, setNewDirWebsite] = useState('');
  const [newDirTiming, setNewDirTiming] = useState('09:00 AM – 08:00 PM');
  const [newDirDescription, setNewDirDescription] = useState('');
  const [newDirFeatured, setNewDirFeatured] = useState(false);
  const [newDirPopular, setNewDirPopular] = useState(true);
  const [newDirVerified, setNewDirVerified] = useState(true);
  const [newDirTags, setNewDirTags] = useState('');
  const [newDirImageUrl, setNewDirImageUrl] = useState('');

  // Load all data from DB Service
  const refreshAllData = async () => {
    try {
      const artList = await dbService.getArticles();
      setArticles(artList);

      const catList = await dbService.getCategories();
      setCategoriesList(catList);

      const usrList = await dbService.getUsers();
      setUsersList(usrList);

      const outList = await dbService.getPowerOutages();
      setOutagesDbList(outList);
      if (outList && outList.length > 0) {
        setOutages(
          outList.map((o: any) => ({
            id: o.id,
            area: o.area,
            substation: o.substation,
            date: o.date || o.scheduledDate || getTomorrowDateStr(),
            time: o.time || o.timeWindow || '09:00 AM – 04:00 PM',
            status: o.status || 'scheduled',
            details: o.details || o.reason || 'Substation feeder maintenance',
            isTomorrow: o.isTomorrow,
            affectedStreets: o.affectedStreets || [],
            isAutoSynced: o.isAutoSynced,
          }))
        );
      }

      const adList = await dbService.getAdSlots();
      setAdsDbList(adList);
      if (adList && adList.length > 0) {
        setAds(adList as any);
      }

      const donorList = await dbService.getBloodDonors();
      setDonorsDbList(donorList);
      setDonors(donorList);

      const alertList = await dbService.getEmergencyBloodAlerts();
      setEmergencyAlerts(alertList);

      const eventList = await dbService.getEvents();
      setEventsDbList(eventList);
      setEvents(eventList);

      const dirList = await dbService.getDirectoryListings();
      setDirectoryListings(dirList);

      const verList = await dbService.getDirectoryVerifications();
      setVerificationsList(verList);

      const revList = await dbService.getDirectoryReviews();
      setReviewsList(revList);

      const enqList = await dbService.getDonorContactRequests();
      setDonorEnquiries(enqList);

      const contactList = await dbService.getContactEnquiries();
      setContactEnquiriesList(contactList);
    } catch (err) {
      console.error('Error loading DB records', err);
    }
  };

  useEffect(() => {
    refreshAllData();
    if (typeof window !== 'undefined') {
      window.addEventListener('directoryVerificationsUpdate', refreshAllData);
      window.addEventListener('directoryReviewsUpdate', refreshAllData);
      window.addEventListener('directoryStorageUpdate', refreshAllData);
      window.addEventListener('donorEnquiriesStorageUpdate', refreshAllData);
      window.addEventListener('donorsStorageUpdate', refreshAllData);
      window.addEventListener('enquiriesStorageUpdate', refreshAllData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('directoryVerificationsUpdate', refreshAllData);
        window.removeEventListener('directoryReviewsUpdate', refreshAllData);
        window.removeEventListener('directoryStorageUpdate', refreshAllData);
        window.removeEventListener('donorEnquiriesStorageUpdate', refreshAllData);
        window.removeEventListener('donorsStorageUpdate', refreshAllData);
        window.removeEventListener('enquiriesStorageUpdate', refreshAllData);
      }
    };
  }, []);

  // Check auth session
  useEffect(() => {
    const sessionAuth = localStorage.getItem('t_covai_admin_auth');
    const savedEmail = localStorage.getItem('t_covai_admin_email');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      if (savedEmail) setAdminEmail(savedEmail);
    }
  }, []);

  // Image Compression & Processing Handler
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1280;
          const maxHeight = 720;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Standard fallback to image/jpeg at 0.7 quality keeps payloads lightweight across all image formats
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Image Drag & Drop Handler with all standard format support
  const handleImageFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (.jpg, .jpeg, .png, .webp)');
      return;
    }
    setImageFileName(file.name);
    try {
      const compressedDataUrl = await compressImage(file);
      setImageUrl(compressedDataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileChange(e.dataTransfer.files[0]);
    }
  };

  // TANGEDCO Live Auto-Sync Handler
  const handleAutoSyncTangedco = async (dateParam?: string) => {
    try {
      setIsAutoSyncing(true);
      const targetDate = dateParam || filterDate || getTomorrowDateStr();
      const res = await fetch(`/api/tangedco?date=${encodeURIComponent(targetDate)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.outages && Array.isArray(json.outages)) {
          const syncedItems: OutageItem[] = json.outages.map((o: any) => ({
            id: o.id || `out-${Date.now()}-${Math.random()}`,
            area: o.area,
            substation: o.substation,
            date: o.scheduledDate,
            time: o.timeWindow,
            status: o.status || 'scheduled',
            details: o.reason,
            isTomorrow: o.isTomorrow,
            affectedStreets: o.affectedStreets,
            isAutoSynced: true,
          }));
          setOutages(syncedItems);
          syncOutagesToDb(syncedItems);
          setOutageSuccess(
            `⚡ Live Auto-Sync Success: Synchronized ${syncedItems.length} feeder shutdown schedules for ${json.summary?.scheduledDate || targetDate} from TANGEDCO Central Bureau!`
          );
          setTimeout(() => setOutageSuccess(''), 5000);
        }
      }
    } catch (err) {
      setOutageSuccess('⚠️ Auto-sync fallback active. Loaded latest Coimbatore TNEB schedule.');
      setTimeout(() => setOutageSuccess(''), 5000);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const syncOutagesToDb = async (updatedOutages: OutageItem[]) => {
    setOutages(updatedOutages);
    await dbService.savePowerOutages(
      updatedOutages.map((o) => ({
        id: o.id,
        area: o.area,
        substation: o.substation,
        date: o.date,
        scheduledDate: o.date,
        time: o.time,
        timeWindow: o.time,
        status: o.status,
        details: o.details,
        reason: o.details,
        isTomorrow: o.isTomorrow,
        affectedStreets: o.affectedStreets || [],
        isAutoSynced: o.isAutoSynced,
      }))
    );
    if (typeof window !== 'undefined') {
      const dataStr = JSON.stringify(updatedOutages);
      localStorage.setItem('t_covai_outages', dataStr);
      localStorage.setItem('power_outages', dataStr);
      window.dispatchEvent(new Event('outagesStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'outages' } }));
      window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_outages', newValue: dataStr }));
    }
  };

  const handleSaveOutage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutage) return;
    const updated = outages.map((o) => (o.id === editingOutage.id ? editingOutage : o));
    syncOutagesToDb(updated);
    setEditingOutage(null);
    setOutageSuccess(`⚡ Successfully updated power outage alert for ${editingOutage.area}!`);
    setTimeout(() => setOutageSuccess(''), 4000);
  };

  const handleCreateNewOutage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutageArea.trim()) return;
    const created: OutageItem = {
      id: `out-${Date.now()}`,
      area: newOutageArea.trim(),
      substation: newOutageSubstation.trim() || 'Coimbatore Grid Substation',
      date: newOutageDate || filterDate || getTomorrowDateStr(),
      time: newOutageTime.trim() || '09:30 AM – 02:30 PM',
      status: newOutageStatus,
      details: newOutageDetails.trim() || 'Feeder line clearing and substation inspection',
      affectedStreets: newOutageStreets ? newOutageStreets.split(',').map((s) => s.trim()).filter(Boolean) : [],
      isAutoSynced: false,
    };
    const updated = [created, ...outages];
    syncOutagesToDb(updated);
    setIsAddingOutage(false);
    // Reset inputs
    setNewOutageArea('');
    setNewOutageSubstation('');
    setNewOutageDetails('');
    setNewOutageStreets('');
    setOutageSuccess(`⚡ Successfully created and published new power outage ticker alert for ${created.area}!`);
    setTimeout(() => setOutageSuccess(''), 4000);
  };

  const handleDeleteOutage = (id: string, areaName: string) => {
    if (!confirm(`Are you sure you want to delete the power outage record for "${areaName}"?`)) return;
    const updated = outages.filter((o) => o.id !== id);
    syncOutagesToDb(updated);
    setOutageSuccess(`Deleted outage record for ${areaName}`);
    setTimeout(() => setOutageSuccess(''), 3000);
  };

  const syncAdsToDb = async (updatedAds: AdSlotSetting[]) => {
    setAds(updatedAds);
    await dbService.saveAdSlots(updatedAds as any);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('adsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'ads' } }));
      window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_ads', newValue: JSON.stringify(updatedAds) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'adSlots', newValue: JSON.stringify(updatedAds) }));
    }
  };

  const updateAdDate = (id: string, field: 'startDate' | 'endDate', value: string) => {
    const updated = ads.map((ad) => (ad.id === id ? { ...ad, [field]: value } : ad));
    syncAdsToDb(updated);
    setAdSuccess('Updated campaign flight dates!');
    setTimeout(() => setAdSuccess(''), 3000);
  };

  const toggleAdFallback = (id: string) => {
    const updated = ads.map((ad) =>
      ad.id === id ? { ...ad, fallbackAdSense: !ad.fallbackAdSense } : ad
    );
    syncAdsToDb(updated);
    setAdSuccess('Toggled Google AdSense auto-fallback behavior!');
    setTimeout(() => setAdSuccess(''), 3000);
  };

  const toggleAdStatus = (id: string) => {
    const updated = ads.map((ad) => (ad.id === id ? { ...ad, active: !ad.active } : ad));
    syncAdsToDb(updated);
    setAdSuccess(updated.find(a => a.id === id)?.active ? '✓ Campaign Resumed (Live)!' : 'Campaign Paused');
    setTimeout(() => setAdSuccess(''), 3000);
  };

  const handleSaveAdCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdSlot) return;

    const updated = ads.map((ad) =>
      ad.id === editingAdSlot.id ? { ...ad, ...editingAdSlot } : ad
    );
    await syncAdsToDb(updated);
    setEditingAdSlot(null);
    setAdSuccess('✓ Ad creative, media & destination link updated live across the site!');
    setTimeout(() => setAdSuccess(''), 4000);
  };

  const getAdScheduleStatus = (ad: AdSlotSetting) => {
    if (!ad.active) {
      return {
        label: '⚪ Campaign Paused',
        badgeClass: 'bg-stone-200 text-stone-700 border-stone-300',
        isLive: false,
        serving: 'Paused',
      };
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (ad.startDate && todayStr < ad.startDate) {
      return {
        label: '🟡 Scheduled Upcoming',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        isLive: false,
        serving: ad.fallbackAdSense ? 'AdSense Active (Pre-launch)' : 'Awaiting Flight',
      };
    }
    if (ad.endDate && todayStr > ad.endDate) {
      return {
        label: ad.fallbackAdSense ? '⌛ Fallback: AdSense Active' : '🔴 Campaign Expired',
        badgeClass: ad.fallbackAdSense ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-rose-100 text-rose-800 border-rose-300',
        isLive: false,
        serving: ad.fallbackAdSense ? 'Google AdSense Inventory' : 'Inactive',
      };
    }
    return {
      label: '🟢 Live Scheduled Campaign',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold shadow-2xs',
      isLive: true,
      serving: 'Local Partner Ad',
    };
  };

  // ---------------------------------------------------------------------------
  // Blood Donors Handlers
  // ---------------------------------------------------------------------------
  const syncDonorsToDb = async (updated: BloodDonorRecord[]) => {
    setDonors(updated);
    await dbService.saveBloodDonors(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('t_covai_donors', JSON.stringify(updated));
      localStorage.setItem('blood_donors', JSON.stringify(updated));
      window.dispatchEvent(new Event('donorsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'donors' } }));
    }
  };

  const syncEmergencyAlertsToDb = async (updated: EmergencyBloodAlert[]) => {
    setEmergencyAlerts(updated);
    await dbService.saveEmergencyBloodAlerts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('t_covai_emergency_blood', JSON.stringify(updated));
      localStorage.setItem('emergency_blood_alerts', JSON.stringify(updated));
      window.dispatchEvent(new Event('emergencyBloodStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'emergency_blood' } }));
    }
  };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName.trim() || !newDonorPhone.trim()) return;
    const newRec: BloodDonorRecord = {
      id: `donor-${Date.now()}`,
      name: newDonorName.trim(),
      bloodGroup: newDonorBloodGroup,
      area: newDonorArea.trim() || 'Coimbatore Central',
      phone: newDonorPhone.trim(),
      whatsapp: newDonorWhatsapp.trim() || newDonorPhone.trim(),
      isAvailable: newDonorAvailable,
      isVerified: newDonorVerified,
      lastDonated: '2026-08-01',
      registeredDate: new Date().toISOString().split('T')[0],
    };
    const updated = [newRec, ...donors];
    await syncDonorsToDb(updated);
    setIsAddingDonor(false);
    setNewDonorName('');
    setNewDonorArea('');
    setNewDonorPhone('');
    setNewDonorWhatsapp('');
    setDonorSuccess(`✓ Registered donor ${newRec.name} (${newRec.bloodGroup}) successfully!`);
    setTimeout(() => setDonorSuccess(''), 4000);
  };

  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonor) return;
    const updated = donors.map((d) => (d.id === editingDonor.id ? editingDonor : d));
    await syncDonorsToDb(updated);
    setEditingDonor(null);
    setDonorSuccess(`✓ Updated donor profile for ${editingDonor.name}!`);
    setTimeout(() => setDonorSuccess(''), 4000);
  };

  const handleDeleteDonor = async (id: string, name: string) => {
    if (!confirm(`Delete blood donor profile for "${name}"?`)) return;
    const updated = donors.filter((d) => d.id !== id);
    await syncDonorsToDb(updated);
    setDonorSuccess(`Deleted donor ${name}`);
    setTimeout(() => setDonorSuccess(''), 3000);
  };

  const handleApproveDonor = async (id: string) => {
    await dbService.approveBloodDonor(id);
    const updated = donors.map((d) => (d.id === id ? { ...d, status: 'approved' as const, isVerified: true } : d));
    setDonors(updated);
    setDonorSuccess('✓ Blood donor profile verified & approved for live public registry!');
    setTimeout(() => setDonorSuccess(''), 3500);
  };

  const handleRejectDonor = async (id: string) => {
    await dbService.rejectBloodDonor(id);
    const updated = donors.map((d) => (d.id === id ? { ...d, status: 'rejected' as const, isVerified: false } : d));
    setDonors(updated);
    setDonorSuccess('Donor profile rejected / unverified.');
    setTimeout(() => setDonorSuccess(''), 3000);
  };

  const toggleDonorVerified = async (id: string) => {
    const updated = donors.map((d) => {
      if (d.id === id) {
        const nextVerified = !d.isVerified;
        return {
          ...d,
          isVerified: nextVerified,
          status: (nextVerified ? 'approved' : 'pending') as 'approved' | 'pending' | 'rejected',
        };
      }
      return d;
    });
    await syncDonorsToDb(updated);
    setDonorSuccess('Updated donor verification status!');
    setTimeout(() => setDonorSuccess(''), 2000);
  };

  const toggleDonorAvailability = async (id: string) => {
    const updated = donors.map((d) => (d.id === id ? { ...d, isAvailable: !d.isAvailable } : d));
    await syncDonorsToDb(updated);
    setDonorSuccess('Updated donor availability status!');
    setTimeout(() => setDonorSuccess(''), 2000);
  };

  const handleCreateEmergencyAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmgHospital.trim() || !newEmgPhone.trim()) return;
    const newAlert: EmergencyBloodAlert = {
      id: `emg-${Date.now()}`,
      patientName: newEmgPatient.trim() || 'Emergency Patient',
      hospital: newEmgHospital.trim(),
      bloodGroup: newEmgBloodGroup,
      unitsNeeded: Number(newEmgUnits) || 2,
      contactNumber: newEmgPhone.trim(),
      urgency: newEmgUrgency,
      postedAt: 'Just now',
      isActive: true,
    };
    const updated = [newAlert, ...emergencyAlerts];
    await syncEmergencyAlertsToDb(updated);
    setIsAddingEmergencyAlert(false);
    setNewEmgPatient('');
    setNewEmgHospital('');
    setNewEmgPhone('');
    setDonorSuccess(`🚨 Broadcasted Emergency Need for ${newAlert.bloodGroup} at ${newAlert.hospital}!`);
    setTimeout(() => setDonorSuccess(''), 5000);
  };

  const handleDeleteEmergencyAlert = async (id: string) => {
    const updated = emergencyAlerts.filter((a) => a.id !== id);
    await syncEmergencyAlertsToDb(updated);
    setDonorSuccess('Removed emergency blood alert.');
    setTimeout(() => setDonorSuccess(''), 3000);
  };

  const toggleEmergencyAlertStatus = async (id: string) => {
    const updated = emergencyAlerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
    await syncEmergencyAlertsToDb(updated);
    setDonorSuccess('Toggled emergency blood alert status!');
    setTimeout(() => setDonorSuccess(''), 2000);
  };

  // ---------------------------------------------------------------------------
  // Donor Contact Enquiry Handlers
  // ---------------------------------------------------------------------------
  const handleUpdateEnquiryStatus = async (id: string, status: 'Pending' | 'Verified' | 'Fulfilled') => {
    await dbService.updateDonorContactRequestStatus(id, status);
    const updated = await dbService.getDonorContactRequests();
    setDonorEnquiries(updated);
    setDonorSuccess(`✓ Request status updated to "${status}"!`);
    setTimeout(() => setDonorSuccess(''), 4000);
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact request?')) return;
    await dbService.deleteDonorContactRequest(id);
    const updated = await dbService.getDonorContactRequests();
    setDonorEnquiries(updated);
    setDonorSuccess('Removed contact request.');
    setTimeout(() => setDonorSuccess(''), 3000);
  };

  // ---------------------------------------------------------------------------
  // Events Handlers
  // ---------------------------------------------------------------------------
  const syncEventsToDb = async (updated: EventRecord[]) => {
    setEvents(updated);
    await dbService.saveEvents(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('t_covai_events', JSON.stringify(updated));
      localStorage.setItem('events_db', JSON.stringify(updated));
      window.dispatchEvent(new Event('eventsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'events' } }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventVenue.trim()) return;
    const nowIso = new Date().toISOString();
    const created: EventRecord = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      category: newEventCategory,
      date: newEventDate || getTomorrowDateStr(),
      time: newEventTime.trim() || '10:00 AM – 06:00 PM',
      venue: newEventVenue.trim(),
      mapLink: newEventMapLink.trim() || `https://maps.google.com/?q=${encodeURIComponent(newEventVenue.trim() + ' Coimbatore')}`,
      posterUrl: newEventPosterUrl.trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      videoUrl: newEventVideoUrl.trim() || undefined,
      description: newEventDesc.trim() || 'Coimbatore public exhibition and community event.',
      organizer: newEventOrganizer.trim() || 'Coimbatore Event Bureau',
      status: newEventStatus,
      featured: newEventFeatured,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const updated = [created, ...events];
    await syncEventsToDb(updated);
    setIsAddingEvent(false);
    setNewEventTitle('');
    setNewEventVenue('');
    setNewEventMapLink('');
    setNewEventPosterUrl('');
    setNewEventVideoUrl('');
    setNewEventDesc('');
    setEventSuccess(`✓ Published event "${created.title}" successfully!`);
    setTimeout(() => setEventSuccess(''), 4000);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    const nowIso = new Date().toISOString();
    const updated = events.map((ev) => (ev.id === editingEvent.id ? { ...editingEvent, updatedAt: nowIso } : ev));
    await syncEventsToDb(updated);
    setEditingEvent(null);
    setEventSuccess(`✓ Updated event "${editingEvent.title}"!`);
    setTimeout(() => setEventSuccess(''), 4000);
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    const updated = events.filter((ev) => ev.id !== id);
    await syncEventsToDb(updated);
    setEventSuccess(`Deleted event "${title}"`);
    setTimeout(() => setEventSuccess(''), 3000);
  };

  const toggleEventFeatured = async (id: string) => {
    const updated = events.map((ev) => (ev.id === id ? { ...ev, featured: !ev.featured } : ev));
    await syncEventsToDb(updated);
    setEventSuccess('Updated event featured status!');
    setTimeout(() => setEventSuccess(''), 2000);
  };

  const DIR_CATEGORY_OPTIONS = [
    { name: 'Hospitals & Clinics', slug: 'hospitals-clinics', icon: '🏥' },
    { name: 'Textiles & Garments', slug: 'textiles-garments', icon: '🧵' },
    { name: 'Restaurants & Cafes', slug: 'restaurants-cafes', icon: '🍽️' },
    { name: 'IT & Software', slug: 'it-software', icon: '💻' },
    { name: 'Colleges & Universities', slug: 'colleges-universities', icon: '🎓' },
    { name: 'Real Estate', slug: 'real-estate', icon: '🏢' },
    { name: 'Jewellery', slug: 'jewellery', icon: '💎' },
    { name: 'Automobile', slug: 'automobile', icon: '🚗' },
    { name: 'Supermarkets', slug: 'supermarkets', icon: '🛒' },
    { name: 'Hotels', slug: 'hotels', icon: '🏨' },
    { name: 'Salons & Spas', slug: 'salons-spas', icon: '✂️' },
    { name: 'Gyms & Fitness', slug: 'gyms-fitness', icon: '💪' },
    { name: 'Electronics', slug: 'electronics', icon: '📱' },
    { name: 'Schools', slug: 'schools', icon: '📚' },
    { name: 'Event Planners', slug: 'event-planners', icon: '🎉' },
    { name: 'Logistics', slug: 'logistics', icon: '🚚' },
    { name: 'Pharmacies', slug: 'pharmacies', icon: '💊' },
    { name: 'Bakeries', slug: 'bakeries', icon: '🥐' },
    { name: 'Furniture', slug: 'furniture', icon: '🛋️' },
    { name: 'Travel Agencies', slug: 'travel-agencies', icon: '✈️' },
  ];

  const dynamicAdminCategoryOptions = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; icon: string }>();
    DIR_CATEGORY_OPTIONS.forEach((c) => {
      map.set(c.slug.toLowerCase(), c);
    });
    directoryListings.forEach((item) => {
      if (item.category?.trim()) {
        const slug = slugify(item.categorySlug || item.category);
        if (!map.has(slug)) {
          const meta = getCategoryMeta(item.category);
          map.set(slug, {
            name: item.category,
            slug,
            icon: item.icon || meta.fallbackEmoji || '🏢',
          });
        }
      }
    });
    return Array.from(map.values());
  }, [directoryListings]);

  const handleCreateDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    let finalCategoryName = '';
    let finalCategorySlug = '';
    let finalCategoryIcon = '🏢';

    if (newDirCategorySlug === '__custom__' && newDirCustomCategory.trim()) {
      finalCategoryName = newDirCustomCategory.trim();
      finalCategorySlug = slugify(newDirCustomCategory.trim());
      const meta = getCategoryMeta(finalCategoryName);
      finalCategoryIcon = meta.fallbackEmoji || '🏢';
    } else {
      const matchedCat =
        dynamicAdminCategoryOptions.find((c) => c.slug === newDirCategorySlug) ||
        DIR_CATEGORY_OPTIONS[0];
      finalCategoryName = matchedCat.name;
      finalCategorySlug = matchedCat.slug;
      finalCategoryIcon = matchedCat.icon;
    }

    const created: DirectoryListing = {
      id: `dir-${Date.now()}`,
      name: newDirName.trim(),
      ownerName: newDirOwnerName.trim() || undefined,
      category: finalCategoryName,
      categorySlug: finalCategorySlug,
      icon: finalCategoryIcon,
      rating: typeof newDirRating === 'number' ? newDirRating : parseFloat(newDirRating) || 4.8,
      reviewsCount: 0,
      area: newDirArea.trim() || 'Coimbatore',
      address: newDirAddress.trim() || `${newDirArea.trim()}, Coimbatore`,
      phone: newDirPhone.trim() || '+91 422 200 0000',
      email: newDirEmail.trim() || undefined,
      website: newDirWebsite.trim() || undefined,
      timing: newDirTiming.trim() || '09:00 AM – 08:00 PM',
      description: newDirDescription.trim() || `${newDirName.trim()} verified business in ${newDirArea.trim()}, Coimbatore.`,
      featured: newDirFeatured,
      popular: newDirPopular,
      verified: newDirVerified,
      tags: newDirTags ? newDirTags.split(',').map((t) => t.trim()).filter(Boolean) : [finalCategoryName],
      imageUrl: newDirImageUrl.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveDirectoryCategory({
      name: created.category,
      slug: created.categorySlug,
      icon: created.icon,
    });
    await dbService.saveDirectoryListing(created);
    setDirectoryListings((prev) => [created, ...prev]);
    setIsAddingDirectory(false);

    // Reset inputs
    setNewDirName('');
    setNewDirOwnerName('');
    setNewDirCategorySlug(DIR_CATEGORY_OPTIONS[0].slug);
    setNewDirCustomCategory('');
    setNewDirArea('');
    setNewDirAddress('');
    setNewDirPhone('');
    setNewDirEmail('');
    setNewDirWebsite('');
    setNewDirDescription('');
    setNewDirTags('');
    setNewDirImageUrl('');
    setDirSuccess(`✓ Added business "${created.name}" to directory!`);
    setTimeout(() => setDirSuccess(''), 4000);
  };

  const handleSaveDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDirectory) return;

    let finalCat = editingDirectory.category;
    let finalSlug = editingDirectory.categorySlug;
    let finalIcon = editingDirectory.icon;

    if (editingDirCustomCategory.trim()) {
      finalCat = editingDirCustomCategory.trim();
      finalSlug = slugify(finalCat);
      const meta = getCategoryMeta(finalCat);
      finalIcon = meta.fallbackEmoji || '🏢';
    }

    const nowIso = new Date().toISOString();
    const updated: DirectoryListing = {
      ...editingDirectory,
      category: finalCat,
      categorySlug: finalSlug,
      icon: finalIcon,
      updatedAt: nowIso,
    };

    await dbService.saveDirectoryCategory({
      name: updated.category,
      slug: updated.categorySlug,
      icon: updated.icon,
    });
    await dbService.updateDirectoryListing(updated.id, updated);
    setDirectoryListings((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    setEditingDirectory(null);
    setEditingDirCustomCategory('');
    setDirSuccess(`✓ Updated directory record for "${updated.name}"!`);
    setTimeout(() => setDirSuccess(''), 4000);
  };

  const handleDeleteDirectory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the business directory?`)) return;
    await dbService.deleteDirectoryListing(id);
    setDirectoryListings((prev) => prev.filter((d) => d.id !== id));
    setDirSuccess(`Deleted directory listing "${name}"`);
    setTimeout(() => setDirSuccess(''), 3000);
  };

  const handleToggleFeaturedDir = async (id: string) => {
    await dbService.toggleFeaturedDirectory(id);
    setDirectoryListings((prev) =>
      prev.map((d) => (d.id === id ? { ...d, featured: !d.featured } : d))
    );
    setDirSuccess('Toggled Featured status!');
    setTimeout(() => setDirSuccess(''), 2000);
  };

  const handleTogglePopularDir = async (id: string) => {
    await dbService.togglePopularDirectory(id);
    setDirectoryListings((prev) =>
      prev.map((d) => (d.id === id ? { ...d, popular: !d.popular } : d))
    );
    setDirSuccess('Toggled Popular status!');
    setTimeout(() => setDirSuccess(''), 2000);
  };

  // User Verification Actions
  const handleToggleVerificationStatus = async (id: string) => {
    await dbService.toggleDirectoryVerificationStatus(id);
    setVerificationsList((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status: v.status === 'verified' ? 'revoked' : 'verified' } : v
      )
    );
    setVerSuccess('Updated user verification status!');
    setTimeout(() => setVerSuccess(''), 2500);
  };

  const handleDeleteVerification = async (id: string, contact: string) => {
    if (!confirm(`Delete verification log for "${contact}"?`)) return;
    await dbService.deleteDirectoryVerification(id);
    setVerificationsList((prev) => prev.filter((v) => v.id !== id));
    setVerSuccess(`Deleted verification record for "${contact}"`);
    setTimeout(() => setVerSuccess(''), 2500);
  };

  // User Review Moderation Actions
  const handleToggleReviewStatus = async (id: string) => {
    await dbService.toggleDirectoryReviewStatus(id);
    setReviewsList((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'approved' ? 'rejected' : 'approved' } : r
      )
    );
    setReviewSuccess('Updated review moderation status!');
    setTimeout(() => setReviewSuccess(''), 2500);
  };

  const handleDeleteReview = async (id: string, userName: string) => {
    if (!confirm(`Delete review from "${userName}"? Business average rating will be recalculated.`)) return;
    await dbService.deleteDirectoryReview(id);
    setReviewsList((prev) => prev.filter((r) => r.id !== id));
    // Reload updated listings
    const updatedListings = await dbService.getDirectoryListings();
    setDirectoryListings(updatedListings);
    setReviewSuccess(`Deleted review from "${userName}"`);
    setTimeout(() => setReviewSuccess(''), 2500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    const cleanPassword = adminPassword.trim();

    if (!cleanPassword) {
      setAuthError('Please enter admin security key.');
      setIsAuthenticating(false);
      return;
    }

    if (cleanPassword === 'techkeymonk2026') {
      setIsAuthenticated(true);
      setAuthError('');
      localStorage.setItem('t_covai_admin_auth', 'true');
    } else {
      setAuthError('Invalid Admin Security Password');
    }
    setIsAuthenticating(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('t_covai_admin_auth');
    localStorage.removeItem('t_covai_admin_email');
    setAdminPassword('');
  };

  // Create article with bulletproof dual-publishing pipeline
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsPublishing(true);

      const finalImageUrl =
        mediaType === 'image' && imageUrl.trim()
          ? imageUrl.trim()
          : undefined;
      const finalVideoUrl =
        mediaType === 'video' && (videoUrl.trim() || videoFileName)
          ? videoUrl.trim() || (videoFileName ? `local-video://${videoFileName}` : undefined)
          : undefined;

      const wordCount = (newContent || newTitle).trim().split(/\s+/).filter(Boolean).length;
      const computedReadTime = newReadTime.trim() || `${Math.max(1, Math.ceil(wordCount / 130))} min`;
      const nowIso = new Date().toISOString();
      const articleId = Date.now().toString();

      const newArticle: Article = {
        id: articleId,
        title: newTitle.trim(),
        category: newCategory,
        subCategory: newSubCategory.trim() || newCategory,
        subTag: newSubCategory.trim() || newCategory,
        sectionId: newCategory.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        section: newCategory,
        author: newAuthor.trim() || 'Editorial Bureau',
        readTime: computedReadTime,
        publishedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        isExclusive: isExclusive,
        status: 'published',
        mediaType: mediaType,
        imageUrl: finalImageUrl,
        image: finalImageUrl,
        mediaUrl: mediaType === 'video' ? finalVideoUrl : finalImageUrl,
        videoUrl: finalVideoUrl,
        videoTitle: newTitle.trim(),
        videoDuration: '03:00',
        excerpt: newContent.trim().slice(0, 180) || `${newTitle.trim()} — Coimbatore hyper-local reporting.`,
        content: newContent.trim(),
        highlightStat: 'Breaking Story',
        commentsCount: 0,
        articleHref: `/article/${articleId}`,
      };

      // 1. Persist directly via universal DatabaseService to Supabase and LocalStorage
      await dbService.createArticle(newArticle);

      // 2. Dispatch custom global events for real-time UI refresh across all viewports & tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('newsStorageUpdate'));
        window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'articles' } }));
        window.dispatchEvent(new Event('storage'));
      }

      setArticles((prev) => [newArticle, ...prev.filter((a) => a.id !== newArticle.id)]);
      setNewTitle('');
      setNewSubCategory('');
      setNewContent('');
      setMediaType('image');
      setImageUrl('');
      setImageFileName('');
      setVideoUrl('');
      setVideoFileName('');

      setArticleSuccess('✓ Published successfully! Immediate real-time sync dispatched across all PC & Mobile viewports.');
      setTimeout(() => setArticleSuccess(''), 5000);
      refreshAllData();
    } catch (err) {
      console.error('Publishing error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story from the production database?')) return;

    // 1. LocalStorage immediate update
    const existing = JSON.parse(
      localStorage.getItem('t_covai_articles') ||
      localStorage.getItem('admin_published_articles') ||
      localStorage.getItem('publishedArticles') ||
      localStorage.getItem('news_articles') ||
      '[]'
    );
    const updated = existing.filter((a: any) => a.id !== id);
    localStorage.setItem('t_covai_articles', JSON.stringify(updated));
    localStorage.setItem('admin_published_articles', JSON.stringify(updated));
    localStorage.setItem('publishedArticles', JSON.stringify(updated));
    localStorage.setItem('news_articles', JSON.stringify(updated));
    localStorage.setItem('covai_db_articles', JSON.stringify(updated));

    // 2. Dispatch events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('newsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'articles' } }));
      window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles', newValue: JSON.stringify(updated) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'admin_published_articles', newValue: JSON.stringify(updated) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'publishedArticles', newValue: JSON.stringify(updated) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'news_articles', newValue: JSON.stringify(updated) }));
    }

    await dbService.deleteArticle(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));

    setArticleSuccess('Article deleted from database.');
    setTimeout(() => setArticleSuccess(''), 4000);
    refreshAllData();
  };

  // Save Edited Article
  const handleSaveEditArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    const editWordCount = (editingArticle.content || editingArticle.excerpt || editingArticle.title).trim().split(/\s+/).filter(Boolean).length;
    const editReadTime = editingArticle.readTime || `${Math.max(1, Math.ceil(editWordCount / 130))} min`;
    const resolvedImg = editingArticle.imageUrl || (editingArticle as any).image || (editingArticle as any).mediaUrl;
    const finalImg = resolvedImg && typeof resolvedImg === 'string' && resolvedImg.trim() !== '' ? resolvedImg.trim() : undefined;

    const nowIso = new Date().toISOString();
    const updated: Article = {
      ...editingArticle,
      updatedAt: nowIso,
      createdAt: editingArticle.createdAt || nowIso,
      publishedAt: nowIso,
      isExclusive: !!editingArticle.isExclusive,
      mediaType: editingArticle.mediaType === 'video' ? 'video' : 'image',
      imageUrl: editingArticle.mediaType === 'image' ? finalImg : editingArticle.imageUrl,
      image: editingArticle.mediaType === 'image' ? finalImg : (editingArticle as any).image,
      mediaUrl: editingArticle.mediaType === 'video' ? (editingArticle.videoUrl || (editingArticle as any).mediaUrl) : finalImg,
      videoUrl: editingArticle.mediaType === 'video' ? editingArticle.videoUrl : undefined,
      subTag: editingArticle.subCategory || editingArticle.category,
      readTime: editReadTime,
      highlightStat: editingArticle.isExclusive ? 'Spotlight Exclusive' : (editingArticle.highlightStat || 'Breaking Story'),
    };

    // 1. LocalStorage immediate update
    const existing = JSON.parse(
      localStorage.getItem('t_covai_articles') ||
      localStorage.getItem('admin_published_articles') ||
      localStorage.getItem('publishedArticles') ||
      localStorage.getItem('news_articles') ||
      '[]'
    );
    const updatedList = existing.map((a: any) => (a.id === updated.id ? updated : a));
    localStorage.setItem('t_covai_articles', JSON.stringify(updatedList));
    localStorage.setItem('admin_published_articles', JSON.stringify(updatedList));
    localStorage.setItem('publishedArticles', JSON.stringify(updatedList));
    localStorage.setItem('news_articles', JSON.stringify(updatedList));
    localStorage.setItem('covai_db_articles', JSON.stringify(updatedList));

    // 2. Dispatch events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('newsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'articles' } }));
      window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles', newValue: JSON.stringify(updatedList) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'admin_published_articles', newValue: JSON.stringify(updatedList) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'publishedArticles', newValue: JSON.stringify(updatedList) }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'news_articles', newValue: JSON.stringify(updatedList) }));
    }

    await dbService.updateArticle(editingArticle.id, updated);
    setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? updated : a)));
    setEditingArticle(null);

    setArticleSuccess('✓ Story changes updated in production database!');
    setTimeout(() => setArticleSuccess(''), 4000);
    refreshAllData();
  };

  // Export to CSV
  const handleExportCsv = () => {
    const csvData = dbService.exportTableToCsv(selectedTable);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `todayscoimbatore_${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  /* ------------------------------------------------------------------------ */
  /*               1. Strict Email + Password Auth Gate                       */
  /* ------------------------------------------------------------------------ */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfbf7] text-[#1a1a1a] flex flex-col justify-center items-center px-4 font-sans antialiased">
        <div className="w-full max-w-md bg-white border border-stone-300 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Image
                src="/logo.png"
                alt="Today's Coimbatore"
                width={220}
                height={60}
                priority
                className="h-11 w-auto object-contain"
              />
            </div>
            <h1 className="text-base sm:text-lg font-black text-[#1a1a1a] tracking-tight uppercase">
              TODAYS COIMBATORE ADMIN PORTAL
            </h1>
            <p className="text-xs text-stone-500 mt-1 font-medium">
              Enter security key to access CMS
            </p>
          </div>

          {/* Single-Field Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Security Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter security key"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAuthError('');
                  }}
                  autoFocus
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl pl-4 pr-16 py-2.5 text-sm font-mono text-[#1a1a1a] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 text-xs font-bold px-2 py-1 rounded bg-stone-200/60 hover:bg-stone-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {authError && (
                <div className="p-2.5 mt-2.5 rounded-xl bg-red-50 border border-red-200 text-[#e54b3c] text-xs font-bold animate-in fade-in flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-[#153d3b] hover:bg-[#0d4d4d] text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <span>{isAuthenticating ? 'Authenticating...' : 'Login to Dashboard'}</span>
              <span>&rarr;</span>
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#e54b3c] transition-colors flex items-center gap-1">
              <span>&larr;</span>
              <span>Back to Public Website</span>
            </Link>
            <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-600">
              Admin Access
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                    2. Admin CMS Dashboard Workspace                      */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#1a1a1a] font-sans antialiased">
      {/* Top Admin Navigation Header */}
      <header className="bg-[#153d3b] text-white border-b border-[#0d4d4d] sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo-dark.png"
                alt="Today's Coimbatore"
                width={200}
                height={55}
                className="h-10 md:h-11 w-auto object-contain"
              />
            </Link>
            <span className="bg-[#0f2e2d] text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-[#1f5956] uppercase tracking-wider">
              ADMIN CMS
            </span>
          </div>

          {/* User Controls & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-xs text-emerald-200 font-mono">
              Admin Session (Master Key)
            </span>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-200 hover:text-white transition-colors"
            >
              <span>View Live Site</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-[#0f2e2d] hover:bg-red-900/80 text-stone-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-[#1f5956] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: 2-Column Sidebar + Dynamic Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)]">
        
        {/* 1. Left Vertical Sidebar Navigation */}
        <aside className="w-full lg:w-80 bg-white border-r border-stone-200 p-4 space-y-4 flex-shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:overflow-y-auto shadow-2xs">
          
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-3 py-1.5 mb-1">
              CMS Modules
            </div>
            
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeTab === 'supabase'
                    ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500 font-black'
                    : 'text-emerald-950 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-emerald-400 font-black shrink-0 text-base">⚡</span>
                  <span className="whitespace-nowrap font-black truncate">Supabase SQL Studio</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  LIVE DB
                </span>
              </button>

              {/* AI Draft Review Portal Link */}
              <Link
                href="/admin/review"
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800 shadow-2xs group"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-amber-600 font-black shrink-0 text-base">✨</span>
                  <span className="whitespace-nowrap font-black truncate">AI Draft Review</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  PORTAL ↗
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab('articles')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'articles'
                    ? 'bg-[#153d3b] text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">📰</span>
                  <span className="whitespace-nowrap truncate">Stories &amp; Articles</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'articles' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {articles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('outages')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'outages'
                    ? 'bg-[#153d3b] text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">⚡</span>
                  <span className="whitespace-nowrap truncate">Power Outages</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'outages' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {outages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'ads'
                    ? 'bg-[#153d3b] text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">📢</span>
                  <span className="whitespace-nowrap truncate">Native Ads</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'ads' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {ads.filter((a) => a.active).length}/{ads.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('blood')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'blood'
                    ? 'bg-red-700 text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">🩸</span>
                  <span className="whitespace-nowrap truncate">Blood Donor 24/7</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'blood' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {donors.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'events'
                    ? 'bg-[#153d3b] text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">📅</span>
                  <span className="whitespace-nowrap truncate">Events &amp; Expos</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'events' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {events.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-[#153d3b] text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">📁</span>
                  <span className="whitespace-nowrap truncate">Directory</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {directoryListings.length} Listings
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('verifications')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'verifications'
                    ? 'bg-emerald-800 text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">🔑</span>
                  <span className="whitespace-nowrap truncate">User Verifications</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'verifications' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {verificationsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-[#153d3b] text-white shadow-md font-bold'
                    : 'text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">🗄️</span>
                  <span className="whitespace-nowrap truncate">DB Explorer</span>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  activeTab === 'explorer' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  9 Tables
                </span>
              </button>

              <Link
                href="/admin/widgets"
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border border-emerald-100/80 shadow-2xs"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0 text-base">⚙️</span>
                  <span className="whitespace-nowrap font-bold text-emerald-900 truncate">Widgets Manager</span>
                </span>
                <span className="shrink-0 text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-tight whitespace-nowrap">
                  4 Active
                </span>
              </Link>
            </nav>
          </div>

          <div className="pt-3 border-t border-stone-200">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-3 py-1.5 mb-1">
              Admin Shortcuts
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/contact-enquiries"
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b] transition-all"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">✉️</span>
                  <span className="whitespace-nowrap truncate">Contact Enquiries</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                      pendingEnquiriesCount > 0
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {pendingEnquiriesCount}
                  </span>
                  <span className="text-stone-400 text-xs">&rarr;</span>
                </div>
              </Link>

              <Link
                href="/admin/about-us"
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b] transition-all"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">⚙️</span>
                  <span className="whitespace-nowrap truncate">Social &amp; About Us</span>
                </span>
                <span className="text-stone-400 text-xs shrink-0">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* 2. Right Dynamic Content Panel */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 space-y-6 overflow-y-auto">
          
          {/* Top Summary Metric Cards (Compact single-row / responsive grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Articles
              </span>
              <div className="text-lg font-black text-[#1a1a1a] mt-0.5">
                {articles.length}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                ● Live Stories
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Outages
              </span>
              <div className="text-lg font-black text-[#e54b3c] mt-0.5">
                {outages.filter((o) => o.status !== 'restored').length}
              </div>
              <span className="text-[10px] text-stone-500 font-semibold block truncate">
                TNEB Feeders
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Native Ads
              </span>
              <div className="text-lg font-black text-[#d9a036] mt-0.5">
                {ads.filter((a) => a.active).length}/{ads.length}
              </div>
              <span className="text-[10px] text-stone-500 font-semibold block truncate">
                Active Slots
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Donors 24/7
              </span>
              <div className="text-lg font-black text-red-600 mt-0.5">
                {donors.filter((d) => d.isAvailable).length}/{donors.length}
              </div>
              <span className="text-[10px] text-rose-700 font-semibold block truncate">
                {emergencyAlerts.filter((a) => a.isActive).length} Alert(s)
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Events
              </span>
              <div className="text-lg font-black text-[#0d4d4d] mt-0.5">
                {events.filter((e) => e.status === 'upcoming').length}/{events.length}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                City Venues
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Directory
              </span>
              <div className="text-lg font-black text-amber-600 mt-0.5">
                {directoryListings.length} Listings
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                {uniqueDirectoryCategoriesCount} Categories
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Verifications
              </span>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                {verificationsList.filter((v) => v.status === 'verified').length}/{verificationsList.length}
              </div>
              <span className="text-[10px] text-stone-500 font-semibold block truncate">
                OTP Sessions
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                Reviews
              </span>
              <div className="text-lg font-black text-amber-500 mt-0.5">
                {reviewsList.length}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block truncate">
                ★ {reviewsList.filter((r) => r.status === 'approved').length} Live
              </span>
            </div>
          </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 0: SUPABASE SQL DATABASE STUDIO (FULL CRUD EXCEL / GRID VIEW)  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'supabase' && <SupabaseTablesManager />}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: ARTICLES & STORY PUBLISHING CMS (WITH EDIT/DELETE ACTIONS)  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Create New Story Form */}
            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-black text-[#1a1a1a] mb-1">
                Publish New Covai Story
              </h2>
              <p className="text-xs text-stone-500 mb-4 font-medium">
                Pushes live entries directly to the production database (sorted newest first).
              </p>

              {articleSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl mb-4 animate-in fade-in">
                  {articleSuccess}
                </div>
              )}

              <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[11px]">
                    Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coimbatore Western Bypass Phase-2 tenders opened..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-[#1a1a1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[11px]">
                      Category *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 font-bold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                    >
                      <option value="NEWS">NEWS</option>
                      <option value="OUR CITY">OUR CITY</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="TECH">TECH</option>
                      <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                      <option value="EVENTS">EVENTS</option>
                      <option value="SPORTS">SPORTS</option>
                      <option value="CEO">CEO</option>
                      <option value="EDUCATION">EDUCATION</option>
                      <option value="E-PAPER">E-PAPER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[11px]">
                      Sub-Tag / Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infrastructure, Avinashi Rd"
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[11px]">
                      Author / Desk
                    </label>
                    <input
                      type="text"
                      placeholder="Editorial Bureau"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[11px]">
                      Reading Time
                    </label>
                    <input
                      type="text"
                      placeholder="3 min"
                      value={newReadTime}
                      onChange={(e) => setNewReadTime(e.target.value)}
                      className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[11px]">
                    Article Content / Summary
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter detailed news report and bullet points..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-3 text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#153d3b]"
                  />
                </div>

                {/* MEDIA TYPE SELECTOR */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8f6f0] border border-stone-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                      Media Type *
                    </label>
                    <span className="text-[10px] text-stone-500 font-semibold">
                      Primary Story Visual Asset
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-stone-200/90 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMediaType('image')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mediaType === 'image'
                          ? 'bg-[#153d3b] text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
                      }`}
                    >
                      <span>📷 Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mediaType === 'video'
                          ? 'bg-[#153d3b] text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
                      }`}
                    >
                      <span>🎥 Video / YouTube</span>
                    </button>
                  </div>

                  {mediaType === 'image' && (
                    <div className="space-y-3 pt-1">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleImageDrop}
                        className="relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer bg-white border-stone-300 hover:border-stone-400"
                      >
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileChange(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <p className="text-xs font-bold text-stone-800">
                          Drag &amp; drop photo here, or <span className="text-[#e54b3c] underline">Browse (.jpg, .jpeg, .png, .webp)</span>
                        </p>
                      </div>

                      {imageUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-900 shadow-sm">
                          <img src={imageUrl} alt="Asset Preview" className="w-full h-32 object-cover" />
                        </div>
                      )}

                      <input
                        type="url"
                        placeholder="Or paste image URL (https://...)"
                        value={imageUrl.startsWith('data:') ? '' : imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImageFileName('');
                        }}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {mediaType === 'video' && (
                    <div className="space-y-2 pt-1">
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                        YouTube Video URL or Embed ID
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exclusiveCheck"
                    checked={isExclusive}
                    onChange={(e) => setIsExclusive(e.target.checked)}
                    className="rounded border-stone-300 text-[#e54b3c] focus:ring-[#e54b3c]"
                  />
                  <label htmlFor="exclusiveCheck" className="font-bold text-stone-700">
                    Mark as Breaking / Spotlight Hero Exclusive
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="w-full bg-[#e54b3c] hover:bg-[#d03e30] text-white py-2.5 rounded-xl font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-75"
                >
                  {isPublishing ? 'Publishing to DB...' : '+ Publish Story to Live Feed'}
                </button>
              </form>
            </div>

            {/* Published Stories Table with Explicit Category Filter, Metrics & Edit / Delete */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col space-y-4">
              
              {/* Header */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
                  <div>
                    <h2 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                      <span>Published Stories</span>
                      <span className="text-xs font-mono font-bold bg-[#153d3b] text-white px-2.5 py-0.5 rounded-full">
                        {filteredArticles.length} / {articles.length} Total
                      </span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Live database records synced dynamically across Home &amp; Category feeds.
                    </p>
                  </div>

                  {/* Dropdown Selector for Mobile / Quick Select */}
                  <div className="sm:hidden">
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      aria-label="Filter stories by category"
                      className="w-full bg-stone-100 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-800"
                    >
                      {ADMIN_FILTER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat} ({getCategoryCount(cat)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Horizontal Category Filter Button Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 border-b border-stone-200">
                {ADMIN_FILTER_CATEGORIES.map((cat) => {
                  const count = getCategoryCount(cat);
                  const isSelected = selectedCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#153d3b] text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Strict Dynamic List Filtering */}
              <div className="space-y-3 pt-1">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((item) => {
                    const hasVideo = Boolean(item.videoUrl && item.videoUrl.trim() !== '');
                    const hasImage = Boolean((item.imageUrl && item.imageUrl.trim() !== '') || ((item as any).image && (item as any).image.trim() !== ''));

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-[#fcfbf7] gap-3 hover:border-stone-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-extrabold">
                              {item.category}
                            </span>
                            {item.subCategory && (
                              <span className="text-[#e54b3c]">{item.subCategory}</span>
                            )}
                            {hasVideo ? (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-extrabold flex items-center gap-1">
                                <span>🎥 Video</span>
                              </span>
                            ) : hasImage ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1">
                                <span>📷 Image</span>
                              </span>
                            ) : null}
                            {item.isExclusive && (
                              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black flex items-center gap-1 shadow-xs">
                                <span>★ SPOTLIGHT EXCLUSIVE</span>
                              </span>
                            )}
                            {item.updatedAt && (!item.createdAt || Math.abs(new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()) > 3000) ? (
                              <span className="text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded font-black flex items-center gap-1 shadow-2xs">
                                <span>✏️ UPDATED {formatRelativeTime(item.updatedAt)}</span>
                              </span>
                            ) : (
                              <span className="text-stone-500 font-bold">• {formatRelativeTime(item.createdAt || item.publishedAt)}</span>
                            )}
                          </div>
                          <Link
                            href={`/article/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-bold text-[#1a1a1a] hover:text-[#e54b3c] hover:underline line-clamp-2 leading-snug block transition-colors"
                            title="Open live article in new tab"
                          >
                            {item.title} <span className="text-[10px] font-normal text-stone-400">↗</span>
                          </Link>
                          <div className="text-[11px] text-stone-500 mt-1">
                            By {item.author} • {item.readTime}
                          </div>
                        </div>

                        {/* Explicit Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setEditingArticle({ ...item })}
                            className="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit Article"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(item.id)}
                            className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Delete Article from DB"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-[#fcfbf7] rounded-xl border border-stone-200 space-y-2">
                    <span className="text-2xl">🔍</span>
                    <h4 className="text-sm font-bold text-stone-800">
                      No stories found in {selectedCategoryFilter}
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use the publish form on the left to publish articles into this category.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('All')}
                      className="px-3 py-1.5 rounded-lg bg-[#153d3b] text-white text-xs font-bold cursor-pointer"
                    >
                      View All Stories ({articles.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: TANGEDCO SCHEDULED FEEDER OUTAGES (FULL WIDTH 12 COLS)     */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'outages' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#1a1a1a]">
                    TANGEDCO Automated Outage Engine &amp; Live Ticker
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300">
                    Live Automated Feed
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Synchronizes official TNEB Coimbatore feeder shutdown notices for public ticker and alerts with full Date/Time selector.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAddingOutage(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>➕</span>
                  <span>Add Outage Ticker Alert</span>
                </button>

                <div className="flex items-center gap-2 bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs">
                  <span className="font-bold text-stone-600 text-[11px] uppercase">Filter Date:</span>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      handleAutoSyncTangedco(e.target.value);
                    }}
                    className="bg-transparent font-mono font-bold text-[#1a1a1a] focus:outline-none cursor-pointer text-xs"
                  />
                  {filterDate === getTomorrowDateStr() && (
                    <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                      Tomorrow
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAutoSyncTangedco()}
                  disabled={isAutoSyncing}
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 disabled:opacity-75 cursor-pointer active:scale-95"
                >
                  {isAutoSyncing ? 'Syncing TNEB...' : '🤖 Auto-Sync TNEB Outages (Live Fetch)'}
                </button>
              </div>
            </div>

            {outageSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3.5 rounded-xl animate-in fade-in">
                {outageSuccess}
              </div>
            )}

            <div className="w-full bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-stone-200 pb-3 gap-2">
                <div>
                  <h3 className="text-base font-black text-[#1a1a1a]">
                    Scheduled Feeder Outages ({outages.length} Active Alerts)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Live registry synchronized across website Top Marquee Ticker and Alerts.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#153d3b] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Hotline: 1912
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outages.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-stone-200 bg-[#fcfbf7] flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-black text-[#e54b3c]">
                          {item.area}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                            item.status === 'restored'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Date and Time Bar */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono font-bold mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px]">
                          <span>📅</span>
                          <span>{item.date || filterDate || '25 Aug 2026'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 border border-stone-300 px-2 py-0.5 rounded text-[10px]">
                          <span>🕒</span>
                          <span>{item.time}</span>
                        </span>
                        {item.isAutoSynced && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#153d3b] text-emerald-300">
                            🤖 Live TNEB
                          </span>
                        )}
                      </div>

                      {item.substation && (
                        <p className="text-[11px] font-bold text-stone-700 mt-1">
                          Substation: <span className="font-medium text-stone-600">{item.substation}</span>
                        </p>
                      )}

                      <p className="text-xs text-stone-700 mt-2 font-medium">
                        {item.details}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-stone-200">
                      {item.affectedStreets && item.affectedStreets.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap text-[10px] text-stone-500 font-medium">
                          <span className="font-bold text-stone-700">Streets:</span>
                          {item.affectedStreets.map((st) => (
                            <span key={st} className="bg-stone-200/80 px-1.5 py-0.5 rounded text-stone-700 font-semibold">
                              {st}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Edit and Delete Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingOutage(item)}
                          className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOutage(item.id, item.area)}
                          className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: NATIVE AD SLOTS & MONETIZATION                              */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'ads' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-4 gap-3">
              <div>
                <h2 className="text-base font-black text-[#1a1a1a]">
                  Native Advertisement Engine &amp; Campaign Scheduling
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage flight dates, impression limits, and auto-fallback to Google AdSense.
                </p>
              </div>

              {adSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg animate-in fade-in">
                  {adSuccess}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map((ad) => {
                const scheduleStatus = getAdScheduleStatus(ad);
                const mediaPreview = ad.bannerUrl || ad.imageUrl;
                return (
                  <div
                    key={ad.id}
                    className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-[#fcfbf7] flex flex-col justify-between space-y-4 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <span className="text-[#153d3b] uppercase tracking-wider text-[11px] font-extrabold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600"></span>
                          {ad.format}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${scheduleStatus.badgeClass}`}>
                          {scheduleStatus.label}
                        </span>
                      </div>

                      {/* Creative Thumbnail Preview */}
                      {mediaPreview && (
                        <div className="mb-3 w-full h-28 rounded-xl overflow-hidden border border-stone-300 bg-slate-900 relative group">
                          <img
                            src={mediaPreview}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold px-2 py-1 bg-black/60 rounded backdrop-blur-xs">
                              Live Ad Creative
                            </span>
                          </div>
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono uppercase">
                            {ad.slotId || ad.placementKey}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#1a1a1a] line-clamp-2 leading-snug">
                            {ad.title}
                          </h4>
                          {ad.description && (
                            <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                              {ad.description}
                            </p>
                          )}
                          <p className="text-xs text-stone-500 mt-1">
                            Advertiser: <strong className="text-stone-800">{ad.advertiser}</strong>
                          </p>
                          {ad.linkUrl && (
                            <p className="text-[11px] text-emerald-700 font-mono truncate mt-0.5">
                              🔗 {ad.linkUrl}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingAdSlot({ ...ad })}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                          title="Edit Ad Creative, Image & Link"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-stone-600 my-3 p-2 rounded-xl bg-white border border-stone-200">
                        <span>👁️ <strong>{ad.impressions}</strong> Impr</span>
                        <span>🎯 <strong>{ad.ctr}</strong> CTR</span>
                        <span className="text-emerald-700 font-bold ml-auto truncate">Serving: {scheduleStatus.serving}</span>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-stone-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                              Flight Start Date
                            </label>
                            <input
                              type="date"
                              value={ad.startDate}
                              onChange={(e) => updateAdDate(ad.id, 'startDate', e.target.value)}
                              className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                              Flight End Date
                            </label>
                            <input
                              type="date"
                              value={ad.endDate}
                              onChange={(e) => updateAdDate(ad.id, 'endDate', e.target.value)}
                              className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                          <div>
                            <span className="text-xs font-bold text-stone-800 block">
                              Auto-Fallback to Google AdSense
                            </span>
                            <span className="text-[10px] text-stone-500">
                              Serves programmatic ads when campaign date expires
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleAdFallback(ad.id)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              ad.fallbackAdSense ? 'bg-blue-600' : 'bg-stone-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                ad.fallbackAdSense ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 font-mono truncate max-w-[180px]">
                        Slot: {ad.slotId || ad.placementKey || ad.id}
                      </span>
                      <button
                        onClick={() => toggleAdStatus(ad.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          ad.active
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        }`}
                      >
                        {ad.active ? 'Pause Campaign' : 'Resume Campaign'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: BLOOD DONOR 24/7 MANAGEMENT & EMERGENCY BROADCAST CMS       */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'blood' && (() => {
          const pendingDonors = donors.filter((d) => d.status === 'pending' || (!d.isVerified && d.status !== 'rejected'));
          const approvedDonors = donors.filter((d) => d.status === 'approved' || (d.isVerified && d.status !== 'pending' && d.status !== 'rejected'));

          return (
            <div className="space-y-6">
              {/* Header & Quick Action Buttons */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] flex items-center gap-2">
                      <span className="text-red-600">🩸</span>
                      24/7 Blood Donor Network &amp; Verification Portal
                    </h2>
                    <span className="bg-red-100 text-red-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-red-300">
                      ADMIN CMS
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Review and verify public donor registrations, manage live database profiles, and broadcast urgent blood requirement alerts.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAddingEmergencyAlert(true)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>🚨</span>
                    <span>Post Urgent Requirement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingDonor(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>➕</span>
                    <span>Register Blood Donor</span>
                  </button>
                </div>
              </div>

              {donorSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
                  <span>{donorSuccess}</span>
                  <button onClick={() => setDonorSuccess('')} className="text-emerald-700 font-extrabold text-sm p-1">✕</button>
                </div>
              )}

              {/* 0. PATIENT CONTACT REQUESTS / ENQUIRIES SECTION */}
              <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
                        <span>🩸</span>
                        <span>Pending Contact Requests ({donorEnquiries.length} Total)</span>
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Patient enquiries submitted from the public Blood Donors page. Verify and connect volunteers.
                      </p>
                    </div>
                  </div>

                  {/* Status Filter Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['ALL', 'Pending', 'Verified', 'Fulfilled'].map((st) => {
                      const count = st === 'ALL' ? donorEnquiries.length : donorEnquiries.filter((r) => r.status === st).length;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEnquiryFilterStatus(st)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            enquiryFilterStatus === st
                              ? 'bg-red-600 text-white shadow-xs scale-105'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          {st} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(enquiryFilterStatus === 'ALL' ? donorEnquiries : donorEnquiries.filter((r) => r.status === enquiryFilterStatus)).length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs font-medium bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    No contact requests found under status "{enquiryFilterStatus}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(enquiryFilterStatus === 'ALL' ? donorEnquiries : donorEnquiries.filter((r) => r.status === enquiryFilterStatus)).map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                          req.status === 'Pending'
                            ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                            : req.status === 'Verified'
                            ? 'bg-blue-50/70 border-blue-300'
                            : 'bg-emerald-50/70 border-emerald-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                {req.bloodGroup}
                              </span>
                              <div>
                                <h4 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                                  {req.patientName}
                                </h4>
                                <span className="text-[10px] text-stone-500 font-bold block mt-0.5">
                                  {req.units} Unit(s) • <span className={req.urgency === 'Emergency' ? 'text-red-600 font-black' : 'text-amber-700 font-bold'}>{req.urgency}</span>
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                req.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : req.status === 'Verified'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs space-y-1.5 shadow-2xs">
                            <p className="text-stone-800 font-medium text-[11px] truncate">
                              🏥 <strong>Hospital:</strong> {req.hospital}
                            </p>
                            <p className="text-stone-800 font-medium text-[11px]">
                              📞 <strong>Requester Phone:</strong>{' '}
                              <a href={`tel:${req.contactPhone}`} className="font-mono font-bold text-red-600 hover:underline">
                                {req.contactPhone}
                              </a>
                            </p>
                            {req.donorName && (
                              <div className="pt-1.5 mt-1 border-t border-stone-100 text-[11px]">
                                <span className="text-stone-500 font-bold block text-[10px] uppercase tracking-wider">Requested Donor:</span>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  <span className="font-bold text-stone-900">{req.donorName} ({req.donorBloodGroup})</span>
                                  {req.donorPhone && (
                                    <a href={`tel:${req.donorPhone}`} className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100">
                                      📞 {req.donorPhone}
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            {req.notes && (
                              <p className="text-stone-500 text-[10px] italic pt-1 border-t border-stone-100">
                                📝 Notes: "{req.notes}"
                              </p>
                            )}
                            <div className="text-[10px] text-stone-400 font-mono pt-0.5">
                              Submitted: {new Date(req.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Status Update Actions */}
                        <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateEnquiryStatus(req.id, 'Pending')}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                req.status === 'Pending' ? 'bg-amber-600 text-white font-black' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateEnquiryStatus(req.id, 'Verified')}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                req.status === 'Verified' ? 'bg-blue-600 text-white font-black' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Verified
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateEnquiryStatus(req.id, 'Fulfilled')}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                req.status === 'Fulfilled' ? 'bg-emerald-600 text-white font-black' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Fulfilled
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteEnquiry(req.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                            title="Delete Request"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 1. PENDING DONOR VERIFICATION SECTION */}
              {pendingDonors.length > 0 && (
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                      <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                        Pending Donor Registrations ({pendingDonors.length} Awaiting Approval)
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-800 font-bold bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Hidden from public page until verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {pendingDonors.map((donor) => (
                      <div
                        key={donor.id}
                        className="bg-white border-2 border-amber-300 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-9 h-9 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                {donor.bloodGroup}
                              </span>
                              <div>
                                <h4 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                                  {donor.name}
                                </h4>
                                <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                                  📍 {donor.area}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black text-[9px] uppercase border border-amber-200">
                              Pending
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500 font-medium text-[11px]">Phone:</span>
                              <a href={`tel:${donor.phone}`} className="font-mono font-bold text-red-600 hover:underline">
                                {donor.phone}
                              </a>
                            </div>
                            {donor.whatsapp && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-stone-500 font-medium">WhatsApp:</span>
                                <span className="font-mono text-emerald-700 font-semibold">{donor.whatsapp}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-stone-400">
                              <span>Registered:</span>
                              <span>{donor.registeredDate || 'Today'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Approval Actions */}
                        <div className="pt-2 border-t border-amber-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveDonor(donor.id)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            <span>✓</span>
                            <span>Approve &amp; Publish</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectDonor(donor.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                            title="Reject / Mark Spam"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. EMERGENCY BLOOD ALERTS SECTION */}
              {emergencyAlerts.length > 0 && (
                <div className="bg-rose-50 border-2 border-red-300 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-red-900 flex items-center gap-2 uppercase tracking-wide">
                      <span className="animate-pulse text-base">⚠️</span>
                      Active Emergency Blood Alerts ({emergencyAlerts.filter(a => a.isActive).length} Live)
                    </h3>
                    <span className="text-[11px] text-red-700 font-bold">
                      Appears prominently on the Public Blood Donor Page
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {emergencyAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border transition-all ${
                          alert.isActive
                            ? 'bg-white border-red-400 shadow-xs'
                            : 'bg-stone-100 border-stone-300 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-xs">
                                {alert.bloodGroup}
                              </span>
                              <span className="font-extrabold text-xs text-stone-900">
                                {alert.unitsNeeded} Unit(s) Needed
                              </span>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                {alert.urgency}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-stone-800">
                              🏥 {alert.hospital}
                            </p>
                            <p className="text-xs text-stone-600 font-medium">
                              Patient / Case: {alert.patientName}
                            </p>
                            <p className="text-xs font-mono font-bold text-red-700">
                              📞 Emergency Contact: {alert.contactNumber}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleEmergencyAlertStatus(alert.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                alert.isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                              }`}
                            >
                              {alert.isActive ? '🟢 Active' : '⚪ Inactive'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEmergencyAlert(alert.id)}
                              className="p-1 text-stone-400 hover:text-red-600 text-xs font-bold cursor-pointer"
                              title="Delete Alert"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. VERIFIED LIVE DONORS REGISTRY */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-stone-800 uppercase tracking-wide flex items-center gap-2">
                    <span>👥</span>
                    Verified Blood Donors Registry ({approvedDonors.length} Live)
                  </h3>
                  <span className="text-xs text-emerald-700 font-semibold">
                    ● Synced with Public Directory
                  </span>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Blood Group Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {['ALL', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setDonorBloodFilter(grp)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer shrink-0 ${
                          donorBloodFilter === grp
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'bg-[#f8f6f0] text-stone-700 hover:bg-stone-200 border border-stone-200'
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>

                  {/* Area / Name Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter by locality or name..."
                      value={donorAreaSearch}
                      onChange={(e) => setDonorAreaSearch(e.target.value)}
                      className="w-full sm:w-64 bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {donorAreaSearch && (
                      <button
                        onClick={() => setDonorAreaSearch('')}
                        className="absolute right-2.5 top-1.5 text-stone-400 hover:text-stone-700 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Donors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedDonors
                    .filter((d) => {
                      if (donorBloodFilter !== 'ALL' && d.bloodGroup.toUpperCase() !== donorBloodFilter) return false;
                      if (donorAreaSearch.trim()) {
                        const q = donorAreaSearch.toLowerCase();
                        return d.name.toLowerCase().includes(q) || d.area.toLowerCase().includes(q) || d.phone.includes(q);
                      }
                      return true;
                    })
                    .map((donor) => (
                      <div
                        key={donor.id}
                        className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-red-300 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-2xs">
                                {donor.bloodGroup}
                              </span>
                              <div>
                                <h4 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                                  {donor.name}
                                </h4>
                                <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                                  📍 {donor.area}
                                </span>
                              </div>
                            </div>

                            {/* Verified Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleDonorVerified(donor.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-colors cursor-pointer border ${
                                donor.isVerified
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-stone-100 text-stone-500 border-stone-300'
                              }`}
                              title="Click to toggle verified badge"
                            >
                              {donor.isVerified ? '✓ Verified' : 'Unverified'}
                            </button>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#fcfbf7] border border-stone-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500 font-medium">Primary Phone:</span>
                              <a href={`tel:${donor.phone}`} className="font-mono font-bold text-red-600 hover:underline">
                                {donor.phone}
                              </a>
                            </div>
                            {donor.whatsapp && (
                              <div className="flex items-center justify-between">
                                <span className="text-stone-500 font-medium">WhatsApp:</span>
                                <span className="font-mono text-emerald-700 font-semibold">{donor.whatsapp}</span>
                              </div>
                            )}
                            {donor.lastDonated && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-stone-400">Last Donated:</span>
                                <span className="text-stone-600 font-medium">{donor.lastDonated}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => toggleDonorAvailability(donor.id)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                              donor.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {donor.isAvailable ? '🟢 Available' : '🔴 Busy'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingDonor(donor)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDonor(donor.id, donor.name)}
                              className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: EVENT & FESTIVALS MANAGEMENT CMS (INFO-ONLY MODE)           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Header & Quick Action */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] flex items-center gap-2">
                    <span>🎟️</span>
                    Coimbatore Expos, Summits &amp; Cultural Festivals
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300">
                    INFO PORTAL
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Publish informative event schedules, venue directions, organizer details, and promo video streams for Coimbatore exhibitions and summits.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(true)}
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>➕</span>
                  <span>Add New Event</span>
                </button>
              </div>
            </div>

            {eventSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
                <span>{eventSuccess}</span>
                <button onClick={() => setEventSuccess('')} className="text-emerald-700 font-extrabold text-sm p-1">✕</button>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['ALL', 'EXPO', 'TECH', 'CULTURAL', 'SPORTS', 'MUSIC', 'WORKSHOP'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEventCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer shrink-0 ${
                    eventCategoryFilter === cat
                      ? 'bg-[#153d3b] text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-[#f3ede2] border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events
                .filter((ev) => eventCategoryFilter === 'ALL' || ev.category.toUpperCase() === eventCategoryFilter)
                .map((ev) => {
                  return (
                    <div
                      key={ev.id}
                      className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#153d3b] transition-all"
                    >
                      <div>
                        {/* Media Preview (Conditional Video or Poster) */}
                        <div className="w-full h-44 bg-slate-900 relative overflow-hidden group">
                          {ev.posterUrl ? (
                            <img
                              src={ev.posterUrl}
                              alt={ev.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-stone-600">
                              🎟️
                            </div>
                          )}

                          {/* Conditional Video Badge */}
                          {ev.videoUrl && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center text-sm shadow-md">
                                ▶
                              </span>
                            </div>
                          )}

                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#153d3b] text-emerald-200 text-[10px] font-black uppercase shadow-xs">
                              {ev.category}
                            </span>
                            {ev.featured && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-900 text-[10px] font-black uppercase shadow-xs">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-red-600 font-bold">
                            <span>📅 {ev.date}</span>
                            <span>•</span>
                            <span>⏰ {ev.time}</span>
                          </div>

                          <h3 className="text-sm font-black text-stone-900 line-clamp-2 leading-snug">
                            {ev.title}
                          </h3>

                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>

                          <div className="pt-2 border-t border-stone-100 text-xs space-y-1">
                            <p className="text-stone-700 font-medium truncate flex items-center gap-1">
                              <span>📍</span>
                              <span className="truncate">{ev.venue}</span>
                            </p>
                            {ev.organizer && (
                              <p className="text-[11px] text-stone-400 truncate">
                                Organizer: <strong className="text-stone-600">{ev.organizer}</strong>
                              </p>
                            )}
                            {ev.mapLink && (
                              <a
                                href={ev.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-emerald-700 hover:underline inline-block pt-0.5"
                              >
                                View Location on Google Maps &rarr;
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleEventFeatured(ev.id)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                            ev.featured ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {ev.featured ? '⭐ Featured' : '☆ Set Featured'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingEvent(ev)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB: DIRECTORY MANAGEMENT 📂 (20 PREDEFINED CATEGORIES & CRUD)    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'directory' && (
          <div className="space-y-5">
            {dirSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold animate-in fade-in flex items-center justify-between">
                <span>{dirSuccess}</span>
                <button type="button" onClick={() => setDirSuccess('')} className="text-emerald-700 font-black">✕</button>
              </div>
            )}

            {/* Header & Controls */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>📂</span>
                  Coimbatore Business Directory Management
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage verified local listings across {uniqueDirectoryCategoriesCount} categories, ratings, contact numbers, and featured visibility.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/directory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <span>🌐</span>
                  <span>View Public Page</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsAddingDirectory(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Add Business Listing</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 uppercase">Category:</span>
                <select
                  value={dirCategoryFilter}
                  onChange={(e) => setDirCategoryFilter(e.target.value)}
                  className="bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <option value="ALL">All Categories ({uniqueDirectoryCategoriesCount})</option>
                  {dynamicAdminCategoryOptions.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Search by business name, area, phone, tag..."
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Directory Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directoryListings
                .filter((item) => {
                  const matchCat =
                    dirCategoryFilter === 'ALL' ||
                    (item.categorySlug && item.categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '') === dirCategoryFilter.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
                    (item.category && item.category.toLowerCase().replace(/[^a-z0-9]/g, '') === dirCategoryFilter.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  const matchQuery =
                    !dirSearchQuery ||
                    item.name.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
                    item.area.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
                    item.phone.includes(dirSearchQuery);
                  return matchCat && matchQuery;
                })
                .map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-red-400 transition-all space-y-3"
                  >
                    <div className="space-y-2.5">
                      {/* Image Thumbnail & Badges */}
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-900 border border-stone-200">
                        <img
                          src={listing.imageUrl || getCategoryFallbackImage(listing.category, listing.categorySlug)}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase shadow-xs">
                          {listing.category}
                        </span>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-black">
                          📍 {listing.area}
                        </span>
                      </div>

                      {/* Header Info */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-extrabold text-amber-500 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <span>⭐</span>
                            <span className="text-stone-900 font-black">{listing.rating ? Number(listing.rating).toFixed(1) : '4.8'}</span>
                            <span className="text-amber-800 font-bold text-[10px] uppercase tracking-tight">Rating</span>
                          </span>
                          <span className="text-[11px] font-bold text-stone-500">{listing.area}</span>
                        </div>

                        <h3 className="text-sm font-black text-stone-900 leading-snug">
                          {listing.name}
                        </h3>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>

                      <div className="pt-2 border-t border-stone-100 text-[11px] space-y-1 text-stone-600">
                        {listing.ownerName && (
                          <p className="truncate text-stone-800 font-bold flex items-center gap-1">
                            <span>👤</span>
                            <span>Owner: {listing.ownerName}</span>
                          </p>
                        )}
                        <p className="truncate">📞 {listing.phone}</p>
                        {listing.email && <p className="truncate">✉️ {listing.email}</p>}
                        {listing.website && <p className="truncate text-red-600 font-bold">🌐 {listing.website}</p>}
                        <p className="truncate">📍 {listing.address}</p>
                      </div>
                    </div>

                    {/* Controls & Actions */}
                    <div className="pt-3 border-t border-stone-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedDir(listing.id)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors ${
                            listing.featured
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {listing.featured ? '⭐ Featured: ON' : '☆ Featured: OFF'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePopularDir(listing.id)}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors ${
                            listing.popular
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {listing.popular ? '🔥 Popular: ON' : 'Popular: OFF'}
                        </button>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingDirectory(listing)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDirectory(listing.id, listing.name)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-red-700 text-xs font-bold cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB: DIRECTORY USER VERIFICATIONS 🔑 (OTP AUDIT LOG & CONTROLS)     */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'verifications' && (
          <div className="space-y-5">
            {verSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold animate-in fade-in flex items-center justify-between">
                <span>{verSuccess}</span>
                <button type="button" onClick={() => setVerSuccess('')} className="text-emerald-700 font-black">✕</button>
              </div>
            )}

            {/* Header & Export Controls */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>🔑</span>
                  Directory User Verifications &amp; OTP Access Logs
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Audit log of users who verified via OTP (Mobile / Email) to unlock direct owner contact numbers.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => dbService.exportTableToCsv('verifications')}
                  className="px-3.5 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>📥</span>
                  <span>Export Verifications CSV</span>
                </button>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                  Total Logged Verifications
                </span>
                <div className="text-xl font-black text-stone-900 mt-1">
                  {verificationsList.length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                  Active Verified Sessions
                </span>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {verificationsList.filter((v) => v.status === 'verified').length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                  Phone (SMS OTP)
                </span>
                <div className="text-xl font-black text-blue-700 mt-1">
                  {verificationsList.filter((v) => v.phone).length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap block truncate">
                  Email (OTP)
                </span>
                <div className="text-xl font-black text-purple-700 mt-1">
                  {verificationsList.filter((v) => v.email).length}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by phone, email, OTP code, business name..."
                  value={verSearchQuery}
                  onChange={(e) => setVerSearchQuery(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <span className="text-xs text-stone-500 font-medium">
                Showing {verificationsList.filter((v) => {
                  if (!verSearchQuery) return true;
                  const q = verSearchQuery.toLowerCase();
                  return (
                    (v.phone && v.phone.includes(q)) ||
                    (v.email && v.email.toLowerCase().includes(q)) ||
                    (v.otpCode && v.otpCode.includes(q)) ||
                    (v.sourceListingName && v.sourceListingName.toLowerCase().includes(q)) ||
                    v.id.toLowerCase().includes(q)
                  );
                }).length} of {verificationsList.length} records
              </span>
            </div>

            {/* Verifications Table */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f6f0] text-stone-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Record ID</th>
                      <th className="p-3">User Contact Details</th>
                      <th className="p-3">OTP Code</th>
                      <th className="p-3">Verified Date &amp; Time</th>
                      <th className="p-3">Target Business Ref</th>
                      <th className="p-3">Access Status</th>
                      <th className="p-3 text-right">Admin Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {verificationsList
                      .filter((v) => {
                        if (!verSearchQuery) return true;
                        const q = verSearchQuery.toLowerCase();
                        return (
                          (v.phone && v.phone.includes(q)) ||
                          (v.email && v.email.toLowerCase().includes(q)) ||
                          (v.otpCode && v.otpCode.includes(q)) ||
                          (v.sourceListingName && v.sourceListingName.toLowerCase().includes(q)) ||
                          v.id.toLowerCase().includes(q)
                        );
                      })
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-stone-500">
                            {record.id}
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              {record.phone && (
                                <div className="flex items-center gap-1 font-mono font-bold text-stone-900">
                                  <span>📱</span>
                                  <span>{record.phone}</span>
                                </div>
                              )}
                              {record.email && (
                                <div className="flex items-center gap-1 font-mono text-stone-600 text-[11px]">
                                  <span>✉️</span>
                                  <span>{record.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 border border-stone-300 rounded text-stone-800 tracking-widest text-xs">
                              {record.otpCode || '987654'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-stone-600">
                            {record.verifiedAt ? new Date(record.verifiedAt).toLocaleString('en-IN') : 'Recent'}
                          </td>
                          <td className="p-3 max-w-[200px] truncate text-stone-700 font-medium">
                            {record.sourceListingName || 'Directory View'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                record.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              <span>{record.status === 'verified' ? '✓' : '✕'}</span>
                              <span>{record.status === 'verified' ? 'Verified' : 'Revoked'}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleVerificationStatus(record.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  record.status === 'verified'
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                }`}
                                title={record.status === 'verified' ? 'Revoke User Access' : 'Restore User Access'}
                              >
                                {record.status === 'verified' ? 'Revoke' : 'Approve'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setInspectingRow(record)}
                                className="px-2 py-1 rounded bg-[#f3ede2] hover:bg-stone-300 text-[#1a1a1a] text-[11px] font-bold transition-colors cursor-pointer"
                                title="View Raw JSON Log"
                              >
                                👁️ JSON
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteVerification(record.id, record.phone || record.email || record.id)}
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete Log Record"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {verificationsList.length === 0 && (
                <div className="p-12 text-center text-stone-500 text-xs">
                  No directory user OTP verifications logged yet. Users will be recorded here when they verify on the public directory page.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB: DIRECTORY REVIEWS & MODERATION ⭐ (USER-DRIVEN RATINGS & SPAM) */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'reviews' && (
          <div className="space-y-5">
            {reviewSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold animate-in fade-in flex items-center justify-between">
                <span>{reviewSuccess}</span>
                <button type="button" onClick={() => setReviewSuccess('')} className="text-emerald-700 font-black cursor-pointer">✕</button>
              </div>
            )}

            {/* Header & Export Controls */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>⭐</span>
                  User Reviews Moderation &amp; Spam Protection
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Moderate customer reviews, inspect star ratings, reject spam, and monitor real-time business rating calculations.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => dbService.exportTableToCsv('reviews')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>📥</span>
                  <span>Export Reviews CSV</span>
                </button>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Total Reviews
                </span>
                <div className="text-xl font-black text-stone-900 mt-1">
                  {reviewsList.length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Approved &amp; Published
                </span>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {reviewsList.filter((r) => r.status === 'approved').length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Spam / Rejected
                </span>
                <div className="text-xl font-black text-rose-700 mt-1">
                  {reviewsList.filter((r) => r.status === 'rejected').length}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Average Rating Given
                </span>
                <div className="text-xl font-black text-amber-500 mt-1">
                  {reviewsList.length > 0
                    ? `${(reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)} ★`
                    : '5.0 ★'}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search reviews by user name, business name, comment..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <span className="text-xs text-stone-500 font-medium">
                Showing {reviewsList.filter((r) => {
                  if (!reviewSearchQuery) return true;
                  const q = reviewSearchQuery.toLowerCase();
                  return (
                    r.userName.toLowerCase().includes(q) ||
                    r.listingName.toLowerCase().includes(q) ||
                    r.comment.toLowerCase().includes(q) ||
                    r.id.toLowerCase().includes(q)
                  );
                }).length} of {reviewsList.length} reviews
              </span>
            </div>

            {/* Reviews Moderation Table */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f6f0] text-stone-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3">Review ID</th>
                      <th className="p-3">Customer / Reviewer</th>
                      <th className="p-3">Business Name</th>
                      <th className="p-3">Star Rating</th>
                      <th className="p-3">Review &amp; Feedback</th>
                      <th className="p-3">Submitted Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Moderation Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {reviewsList
                      .filter((r) => {
                        if (!reviewSearchQuery) return true;
                        const q = reviewSearchQuery.toLowerCase();
                        return (
                          r.userName.toLowerCase().includes(q) ||
                          r.listingName.toLowerCase().includes(q) ||
                          r.comment.toLowerCase().includes(q) ||
                          r.id.toLowerCase().includes(q)
                        );
                      })
                      .map((rev) => (
                        <tr key={rev.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-stone-500">
                            {rev.id}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-stone-900">{rev.userName}</div>
                            {rev.userPhone && (
                              <div className="text-[11px] font-mono text-stone-500">{rev.userPhone}</div>
                            )}
                            {rev.userEmail && (
                              <div className="text-[11px] font-mono text-stone-500">{rev.userEmail}</div>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-stone-800 max-w-[180px] truncate">
                            {rev.listingName}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 font-bold text-amber-500">
                              <span>{'★'.repeat(rev.rating)}</span>
                              <span className="text-stone-400 font-mono text-[11px]">({rev.rating}.0)</span>
                            </div>
                          </td>
                          <td className="p-3 max-w-[240px] text-stone-600">
                            <p className="line-clamp-2 leading-relaxed">{rev.comment}</p>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-stone-600">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleString('en-IN') : 'Recent'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                rev.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              <span>{rev.status === 'approved' ? '✓' : '✕'}</span>
                              <span>{rev.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleReviewStatus(rev.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  rev.status === 'approved'
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                }`}
                                title={rev.status === 'approved' ? 'Reject / Mark as Spam' : 'Approve Review'}
                              >
                                {rev.status === 'approved' ? 'Reject' : 'Approve'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setInspectingRow(rev)}
                                className="px-2 py-1 rounded bg-[#f3ede2] hover:bg-stone-300 text-[#1a1a1a] text-[11px] font-bold transition-colors cursor-pointer"
                                title="View Raw JSON Log"
                              >
                                👁️ JSON
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id, rev.userName)}
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete Review"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {reviewsList.length === 0 && (
                <div className="p-12 text-center text-stone-500 text-xs">
                  No directory reviews recorded yet. User reviews submitted from the public directory will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: DATABASE EXPLORER 🗄️ (DYNAMIC DATA TABLE, INSPECTOR & EXPORT)*/}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'explorer' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#1a1a1a]">
                    Live Database Explorer &amp; Schema Inspector
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300 font-mono">
                    PROD-DB
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Inspect raw JSON records, filter live datasets, and export complete table backups to CSV.
                </p>
              </div>

              {/* Table Selector & CSV Export */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold">
                  <span className="text-stone-500 uppercase text-[10px]">Table:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value as any)}
                    className="bg-transparent font-bold text-[#1a1a1a] focus:outline-none cursor-pointer"
                  >
                    <option value="articles">articles ({articles.length})</option>
                    <option value="categories">categories ({categoriesList.length})</option>
                    <option value="power_outages">power_outages ({outagesDbList.length})</option>
                    <option value="users">users ({usersList.length})</option>
                    <option value="ad_slots">ad_slots ({ads.length})</option>
                    <option value="donors">donors ({donors.length})</option>
                    <option value="events">events ({events.length})</option>
                    <option value="verifications">verifications ({verificationsList.length})</option>
                    <option value="reviews">reviews ({reviewsList.length})</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Filter records..."
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  className="bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#153d3b] w-36 sm:w-48 font-medium"
                />

                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-1.5 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>📥</span>
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            {/* Dynamic Data Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f6f0] text-stone-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3">ID</th>
                    {selectedTable === 'articles' && (
                      <>
                        <th className="p-3">Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Author</th>
                        <th className="p-3">Created At</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    {selectedTable === 'categories' && (
                      <>
                        <th className="p-3">Name</th>
                        <th className="p-3">Slug</th>
                        <th className="p-3">Articles</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    {selectedTable === 'power_outages' && (
                      <>
                        <th className="p-3">Area</th>
                        <th className="p-3">Substation</th>
                        <th className="p-3">Time Window</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    {selectedTable === 'users' && (
                      <>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    {selectedTable === 'ad_slots' && (
                      <>
                        <th className="p-3">Format</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Advertiser</th>
                        <th className="p-3">Impressions</th>
                        <th className="p-3">Active</th>
                      </>
                    )}
                    {selectedTable === 'donors' && (
                      <>
                        <th className="p-3">Group</th>
                        <th className="p-3">Donor Name</th>
                        <th className="p-3">Area / Locality</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    {selectedTable === 'events' && (
                      <>
                        <th className="p-3">Category</th>
                        <th className="p-3">Event Title</th>
                        <th className="p-3">Date &amp; Time</th>
                        <th className="p-3">Venue</th>
                        <th className="p-3">Price</th>
                      </>
                    )}
                    {selectedTable === 'verifications' && (
                      <>
                        <th className="p-3">Phone / Contact</th>
                        <th className="p-3">OTP</th>
                        <th className="p-3">Verified At</th>
                        <th className="p-3">Target Business</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    {selectedTable === 'reviews' && (
                      <>
                        <th className="p-3">Reviewer</th>
                        <th className="p-3">Business</th>
                        <th className="p-3">Rating</th>
                        <th className="p-3">Comment</th>
                        <th className="p-3">Status</th>
                      </>
                    )}
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {(selectedTable === 'articles' ? articles :
                    selectedTable === 'categories' ? categoriesList :
                    selectedTable === 'power_outages' ? outagesDbList :
                    selectedTable === 'users' ? usersList :
                    selectedTable === 'ad_slots' ? adsDbList :
                    selectedTable === 'donors' ? donors :
                    selectedTable === 'events' ? events :
                    selectedTable === 'verifications' ? verificationsList : reviewsList
                  )
                    .filter((row: any) => {
                      if (!explorerSearch.trim()) return true;
                      return JSON.stringify(row).toLowerCase().includes(explorerSearch.toLowerCase());
                    })
                    .map((row: any) => (
                      <tr key={row.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 font-mono text-stone-500 font-bold">{row.id}</td>

                        {selectedTable === 'articles' && (
                          <>
                            <td className="p-3 font-bold text-[#1a1a1a] max-w-[280px] truncate">
                              <Link
                                href={`/article/${row.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#e54b3c] hover:underline transition-colors block truncate"
                                title="Open live article in new tab"
                              >
                                {row.title} ↗
                              </Link>
                            </td>
                            <td className="p-3 font-extrabold text-[#e54b3c]">{row.category}</td>
                            <td className="p-3 text-stone-600">{row.author}</td>
                            <td className="p-3 font-mono text-stone-400 text-[11px]">
                              {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : 'Recent'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'categories' && (
                          <>
                            <td className="p-3 font-bold text-[#1a1a1a]">{row.name}</td>
                            <td className="p-3 font-mono text-stone-500">/{row.slug}</td>
                            <td className="p-3 font-bold">{getCategoryCount(row.name, row.slug)} stories</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'power_outages' && (
                          <>
                            <td className="p-3 font-bold text-[#e54b3c]">{row.area}</td>
                            <td className="p-3 text-stone-700">{row.substation}</td>
                            <td className="p-3 font-mono">{row.timeWindow}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold uppercase">
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'users' && (
                          <>
                            <td className="p-3 font-bold text-[#1a1a1a]">{row.name}</td>
                            <td className="p-3 font-mono text-stone-600">{row.email}</td>
                            <td className="p-3 font-bold uppercase text-[10px] text-emerald-700">{row.role}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'ad_slots' && (
                          <>
                            <td className="p-3 font-bold">{row.format}</td>
                            <td className="p-3 max-w-[200px] truncate">{row.title}</td>
                            <td className="p-3 text-stone-700 font-bold">{row.advertiser}</td>
                            <td className="p-3 font-mono">{row.impressions}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                                {row.active ? 'Active' : 'Paused'}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'donors' && (
                          <>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs">
                                {row.bloodGroup}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-stone-900">{row.name}</td>
                            <td className="p-3 text-stone-600">{row.area}</td>
                            <td className="p-3 font-mono text-red-700 font-bold">{row.phone}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                                {row.isAvailable ? 'Available' : 'Busy'}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'events' && (
                          <>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-[#153d3b] text-emerald-200 text-[10px] font-black uppercase">
                                {row.category}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-stone-900 max-w-[220px] truncate">{row.title}</td>
                            <td className="p-3 font-mono text-red-600 text-[11px]">{row.date} {row.time}</td>
                            <td className="p-3 text-stone-600 max-w-[180px] truncate">{row.venue}</td>
                            <td className="p-3 font-bold">{row.ticketPrice}</td>
                          </>
                        )}

                        {selectedTable === 'verifications' && (
                          <>
                            <td className="p-3 font-mono font-bold text-stone-900">{row.phone || row.email}</td>
                            <td className="p-3 font-mono text-xs">{row.otpCode || '987654'}</td>
                            <td className="p-3 font-mono text-[11px] text-stone-600">{row.verifiedAt ? new Date(row.verifiedAt).toLocaleTimeString() : 'Recent'}</td>
                            <td className="p-3 text-stone-700">{row.sourceListingName || 'Directory View'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}

                        {selectedTable === 'reviews' && (
                          <>
                            <td className="p-3 font-bold text-stone-900">{row.userName}</td>
                            <td className="p-3 text-stone-700 max-w-[180px] truncate">{row.listingName}</td>
                            <td className="p-3 font-bold text-amber-500">★ {row.rating}.0</td>
                            <td className="p-3 max-w-[200px] truncate text-stone-600">{row.comment}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {row.status}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectingRow(row)}
                              className="px-2 py-1 rounded bg-[#f3ede2] hover:bg-stone-300 text-[#1a1a1a] text-[11px] font-bold transition-colors cursor-pointer"
                              title="View Raw JSON"
                            >
                              👁️ JSON
                            </button>
                            {selectedTable === 'articles' && (
                              <button
                                onClick={() => handleDeleteArticle(row.id)}
                                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                            {selectedTable === 'donors' && (
                              <button
                                onClick={() => handleDeleteDonor(row.id, row.name)}
                                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                            {selectedTable === 'events' && (
                              <button
                                onClick={() => handleDeleteEvent(row.id, row.title)}
                                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                            {selectedTable === 'verifications' && (
                              <button
                                onClick={() => handleDeleteVerification(row.id, row.phone || row.email || row.id)}
                                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                            {selectedTable === 'reviews' && (
                              <button
                                onClick={() => handleDeleteReview(row.id, row.userName)}
                                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. ROW INSPECTOR JSON MODAL                                          */}
      {/* -------------------------------------------------------------------- */}
      {inspectingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-[#f8f6f0]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">Database Record Inspector:</span>
                <span className="font-mono font-bold text-[#153d3b] bg-emerald-100 px-2 py-0.5 rounded">
                  {inspectingRow.id}
                </span>
              </div>
              <button
                onClick={() => setInspectingRow(null)}
                className="text-stone-400 hover:text-stone-800 text-sm font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 text-emerald-300 font-mono overflow-auto max-h-[60vh] text-xs">
              <pre>{JSON.stringify(inspectingRow, null, 2)}</pre>
            </div>

            <div className="p-3 border-t border-stone-200 bg-white flex justify-end">
              <button
                onClick={() => setInspectingRow(null)}
                className="px-4 py-1.5 rounded-lg bg-[#153d3b] text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. EDIT ARTICLE MODAL                                                */}
      {/* -------------------------------------------------------------------- */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white border border-stone-300 rounded-2xl shadow-2xl overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-[#f8f6f0]">
              <h3 className="font-black text-sm text-stone-800">
                ✏️ Edit Article: {editingArticle.id}
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className="text-stone-400 hover:text-stone-800 text-sm font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditArticle} className="p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px]">Headline Title</label>
                <input
                  type="text"
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px]">Category</label>
                  <select
                    value={editingArticle.category}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as any })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="NEWS">NEWS</option>
                    <option value="OUR CITY">OUR CITY</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="TECH">TECH</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="EVENTS">EVENTS</option>
                    <option value="SPORTS">SPORTS</option>
                    <option value="CEO">CEO</option>
                    <option value="EDUCATION">EDUCATION</option>
                    <option value="E-PAPER">E-PAPER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px]">Author</label>
                  <input
                    type="text"
                    value={editingArticle.author}
                    onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px]">Excerpt / Summary</label>
                <textarea
                  rows={3}
                  value={editingArticle.excerpt}
                  onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-3 text-xs"
                />
              </div>

              {/* MEDIA TYPE SELECTOR IN EDIT MODAL */}
              <div className="p-3 rounded-xl bg-[#f8f6f0] border border-stone-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                    Media Type *
                  </label>
                  <span className="text-[9px] text-stone-500 font-semibold">
                    Primary Story Visual Asset
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-stone-200/90 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEditingArticle({ ...editingArticle, mediaType: 'image' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      editingArticle.mediaType !== 'video'
                        ? 'bg-[#153d3b] text-white shadow-xs'
                        : 'text-stone-700 hover:bg-stone-100/60'
                    }`}
                  >
                    <span>📷 Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingArticle({ ...editingArticle, mediaType: 'video' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      editingArticle.mediaType === 'video'
                        ? 'bg-[#153d3b] text-white shadow-xs'
                        : 'text-stone-700 hover:bg-stone-100/60'
                    }`}
                  >
                    <span>🎥 Video / YouTube</span>
                  </button>
                </div>

                {editingArticle.mediaType === 'video' ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1 uppercase text-[10px]">
                        YouTube or Direct Video URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                        value={editingArticle.videoUrl || (editingArticle.mediaUrl && !editingArticle.mediaUrl.startsWith('data:image') ? editingArticle.mediaUrl : '')}
                        onChange={(e) => setEditingArticle({ ...editingArticle, videoUrl: e.target.value, mediaUrl: e.target.value })}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                      />
                    </div>

                    <div className="relative border border-dashed rounded-xl p-3 text-center cursor-pointer bg-white border-stone-300 hover:border-stone-400">
                      <input
                        type="file"
                        accept="video/*,.mp4,.mov,.webm"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setEditingArticle({
                                  ...editingArticle,
                                  videoUrl: ev.target.result as string,
                                  mediaUrl: ev.target.result as string,
                                  videoTitle: file.name,
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <p className="text-xs font-bold text-stone-700">
                        Upload local video file (.mp4, .mov, .webm)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative border border-dashed rounded-xl p-3 text-center cursor-pointer bg-white border-stone-300 hover:border-stone-400">
                      <input
                        type="file"
                        accept="image/*,.png,.jpg,.jpeg,.webp"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.type.startsWith('image/')) {
                              try {
                                const compressed = await compressImage(file);
                                setEditingArticle({ ...editingArticle, imageUrl: compressed, image: compressed, mediaUrl: compressed });
                              } catch {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setEditingArticle({ ...editingArticle, imageUrl: ev.target.result as string, image: ev.target.result as string, mediaUrl: ev.target.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <p className="text-xs font-bold text-stone-700">
                        Upload new photo, or <span className="text-[#e54b3c] underline">Browse (.jpg, .jpeg, .png, .webp)</span>
                      </p>
                    </div>

                    <label className="block font-bold text-stone-700 uppercase text-[10px]">Or Image URL / Data URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or data:image/..."
                      value={editingArticle.imageUrl || (editingArticle as any).image || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, imageUrl: e.target.value, image: e.target.value, mediaUrl: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                    {(editingArticle.imageUrl || (editingArticle as any).image) && (
                      <div className="mt-2 relative rounded-lg overflow-hidden border border-stone-300 bg-stone-900 h-24">
                        <img
                          src={editingArticle.imageUrl || (editingArticle as any).image}
                          alt="Edit Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* EXCLUSIVE / SPOTLIGHT TOGGLE IN EDIT MODAL */}
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editingArticle.isExclusive}
                    onChange={(e) => setEditingArticle({ ...editingArticle, isExclusive: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded cursor-pointer accent-red-600"
                  />
                  <span className="font-bold text-xs text-stone-800">
                    ★ Mark as Breaking / Spotlight Exclusive (Main Hero Feature)
                  </span>
                </label>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  {editingArticle.isExclusive ? 'Hero Spotlight Active' : 'Standard Feed'}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. EDIT AD SLOT CREATIVE & LINK MODAL                                */}
      {/* -------------------------------------------------------------------- */}
      {editingAdSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block">
                  AD PLACEMENT CREATIVE STUDIO
                </span>
                <h3 className="text-base font-black text-stone-900">
                  {editingAdSlot.format}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdSlot(null)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdCreative} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Ad Headline / Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingAdSlot.title}
                  onChange={(e) => setEditingAdSlot({ ...editingAdSlot, title: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Advertiser / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingAdSlot.advertiser}
                  onChange={(e) => setEditingAdSlot({ ...editingAdSlot, advertiser: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Supporting Marketing Copy / Description
                </label>
                <textarea
                  rows={2}
                  value={editingAdSlot.description || ''}
                  onChange={(e) => setEditingAdSlot({ ...editingAdSlot, description: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Destination URL (Landing Page)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editingAdSlot.linkUrl || ''}
                    onChange={(e) => setEditingAdSlot({ ...editingAdSlot, linkUrl: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Call To Action (CTA) Button
                  </label>
                  <input
                    type="text"
                    placeholder="Learn More"
                    value={editingAdSlot.ctaText || ''}
                    onChange={(e) => setEditingAdSlot({ ...editingAdSlot, ctaText: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & PREVIEW */}
              <div className="p-3 rounded-xl bg-[#f8f6f0] border border-stone-300 space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  Ad Creative Media (Image / Banner)
                </label>

                <div className="relative border border-dashed rounded-xl p-3 text-center cursor-pointer bg-white border-stone-300 hover:border-stone-400">
                  <input
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.webp"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.type.startsWith('image/')) {
                          try {
                            const compressed = await compressImage(file);
                            setEditingAdSlot({ ...editingAdSlot, imageUrl: compressed, bannerUrl: compressed });
                          } catch {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setEditingAdSlot({ ...editingAdSlot, imageUrl: ev.target.result as string, bannerUrl: ev.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <p className="text-xs font-bold text-stone-700">
                    Upload new ad banner photo (.jpg, .jpeg, .png, .webp)
                  </p>
                </div>

                <label className="block font-bold text-stone-700 uppercase text-[10px]">Or Image URL / Data URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or data:image/..."
                  value={editingAdSlot.bannerUrl || editingAdSlot.imageUrl || ''}
                  onChange={(e) => setEditingAdSlot({ ...editingAdSlot, bannerUrl: e.target.value, imageUrl: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                />

                {(editingAdSlot.bannerUrl || editingAdSlot.imageUrl) && (
                  <div className="mt-2 relative rounded-lg overflow-hidden border border-stone-300 bg-stone-900 h-28">
                    <img
                      src={editingAdSlot.bannerUrl || editingAdSlot.imageUrl}
                      alt="Ad Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAdSlot(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs"
                >
                  Save &amp; Publish Creative Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD NEW OUTAGE TICKER ITEM                                  */}
      {/* ------------------------------------------------------------------ */}
      {isAddingOutage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span className="text-red-600">⚡</span>
                  Create Power Outage Ticker Alert
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publish a new scheduled outage announcement to the Live Alert Marquee.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingOutage(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewOutage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Area / Locality Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thudiyalur & Vadavalli"
                  value={newOutageArea}
                  onChange={(e) => setNewOutageArea(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DATE SELECTOR */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newOutageDate}
                    onChange={(e) => setNewOutageDate(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold cursor-pointer"
                  />
                </div>

                {/* TIME WINDOW SELECTOR */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time Window *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09:30 AM – 01:30 PM"
                    value={newOutageTime}
                    onChange={(e) => setNewOutageTime(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Substation Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 110/33kV Thudiyalur Grid"
                    value={newOutageSubstation}
                    onChange={(e) => setNewOutageSubstation(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Outage Status
                  </label>
                  <select
                    value={newOutageStatus}
                    onChange={(e) => setNewOutageStatus(e.target.value as any)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold cursor-pointer"
                  >
                    <option value="scheduled">Scheduled (Upcoming)</option>
                    <option value="active">Active (In Progress)</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="restored">Restored (Power Back)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Reason &amp; Technical Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 110kV Substation Line Clearing & Feeder Upgrades"
                  value={newOutageDetails}
                  onChange={(e) => setNewOutageDetails(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Affected Streets / Landmarks (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mettupalayam Rd, NSR Rd, Bus Stand"
                  value={newOutageStreets}
                  onChange={(e) => setNewOutageStreets(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOutage(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Publish Outage Alert Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT EXISTING OUTAGE ITEM                                   */}
      {/* ------------------------------------------------------------------ */}
      {editingOutage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span className="text-red-600">✏️</span>
                  Edit Power Outage Record
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update feeder details, dates, times, and restoration status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOutage(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOutage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Area / Locality Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingOutage.area}
                  onChange={(e) => setEditingOutage({ ...editingOutage, area: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DATE SELECTOR */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingOutage.date || filterDate}
                    onChange={(e) => setEditingOutage({ ...editingOutage, date: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold cursor-pointer"
                  />
                </div>

                {/* TIME WINDOW SELECTOR */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time Window *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOutage.time}
                    onChange={(e) => setEditingOutage({ ...editingOutage, time: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Substation Name
                  </label>
                  <input
                    type="text"
                    value={editingOutage.substation || ''}
                    onChange={(e) => setEditingOutage({ ...editingOutage, substation: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Outage Status
                  </label>
                  <select
                    value={editingOutage.status}
                    onChange={(e) => setEditingOutage({ ...editingOutage, status: e.target.value as any })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold cursor-pointer"
                  >
                    <option value="scheduled">Scheduled (Upcoming)</option>
                    <option value="active">Active (In Progress)</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="restored">Restored (Power Back)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Reason &amp; Technical Details
                </label>
                <textarea
                  rows={2}
                  value={editingOutage.details}
                  onChange={(e) => setEditingOutage({ ...editingOutage, details: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Affected Streets / Landmarks (Comma-separated)
                </label>
                <input
                  type="text"
                  value={editingOutage.affectedStreets ? editingOutage.affectedStreets.join(', ') : ''}
                  onChange={(e) =>
                    setEditingOutage({
                      ...editingOutage,
                      affectedStreets: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOutage(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTER BLOOD DONOR                                        */}
      {/* ------------------------------------------------------------------ */}
      {isAddingDonor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span className="text-red-600">🩸</span>
                  Register Blood Donor Profile
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Add a verified volunteer blood donor to the 24/7 Covai directory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingDonor(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDonor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. S. K. Vignesh"
                  value={newDonorName}
                  onChange={(e) => setNewDonorName(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={newDonorBloodGroup}
                    onChange={(e) => setNewDonorBloodGroup(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-red-600 cursor-pointer"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peelamedu & PSG Tech"
                    value={newDonorArea}
                    onChange={(e) => setNewDonorArea(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number (Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98422 12345"
                    value={newDonorPhone}
                    onChange={(e) => setNewDonorPhone(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98422 12345"
                    value={newDonorWhatsapp}
                    onChange={(e) => setNewDonorWhatsapp(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDonorVerified}
                    onChange={(e) => setNewDonorVerified(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span>✓ Verified Donor Badge</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDonorAvailable}
                    onChange={(e) => setNewDonorAvailable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>🟢 Available for Emergency Calls</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDonor(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Donor Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT BLOOD DONOR                                            */}
      {/* ------------------------------------------------------------------ */}
      {editingDonor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span className="text-red-600">✏️</span>
                  Edit Blood Donor Record
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update contact information, verification, and availability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDonor(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDonor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingDonor.name}
                  onChange={(e) => setEditingDonor({ ...editingDonor, name: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={editingDonor.bloodGroup}
                    onChange={(e) => setEditingDonor({ ...editingDonor, bloodGroup: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-red-600 cursor-pointer"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDonor.area}
                    onChange={(e) => setEditingDonor({ ...editingDonor, area: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number (Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingDonor.phone}
                    onChange={(e) => setEditingDonor({ ...editingDonor, phone: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={editingDonor.whatsapp || ''}
                    onChange={(e) => setEditingDonor({ ...editingDonor, whatsapp: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Last Donated Date
                  </label>
                  <input
                    type="date"
                    value={editingDonor.lastDonated || ''}
                    onChange={(e) => setEditingDonor({ ...editingDonor, lastDonated: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingDonor.isVerified}
                      onChange={(e) => setEditingDonor({ ...editingDonor, isVerified: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                    />
                    <span>✓ Verified Badge</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingDonor.isAvailable}
                      onChange={(e) => setEditingDonor({ ...editingDonor, isAvailable: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>🟢 Available Status</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Donor Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: BROADCAST EMERGENCY BLOOD ALERT                             */}
      {/* ------------------------------------------------------------------ */}
      {isAddingEmergencyAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-red-200 pb-3">
              <div>
                <h3 className="text-base font-black text-red-700 flex items-center gap-2">
                  <span>🚨</span>
                  Broadcast Urgent Blood Requirement
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publish an urgent blood alert to the public portal and hero alert ticker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingEmergencyAlert(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmergencyAlert} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Hospital / Medical Center Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KG Hospital, Arts College Road, Coimbatore"
                  value={newEmgHospital}
                  onChange={(e) => setNewEmgHospital(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={newEmgBloodGroup}
                    onChange={(e) => setNewEmgBloodGroup(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-red-600 cursor-pointer"
                  >
                    {['O-', 'O+', 'AB-', 'AB+', 'A-', 'A+', 'B-', 'B+'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Units Needed *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={newEmgUnits}
                    onChange={(e) => setNewEmgUnits(Number(e.target.value))}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={newEmgUrgency}
                    onChange={(e) => setNewEmgUrgency(e.target.value as any)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 cursor-pointer"
                  >
                    <option value="critical">Critical (Immediate)</option>
                    <option value="immediate">Immediate (&lt; 6 hrs)</option>
                    <option value="within_24h">Within 24 Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Patient / Ward Info
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ICU Bed #4 Cardiac Surgery"
                    value={newEmgPatient}
                    onChange={(e) => setNewEmgPatient(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98422 99999"
                    value={newEmgPhone}
                    onChange={(e) => setNewEmgPhone(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-red-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEmergencyAlert(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  🚨 Broadcast Emergency Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CREATE NEW EVENT                                            */}
      {/* ------------------------------------------------------------------ */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>🎟️</span>
                  Create Coimbatore Event / Festival
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publish a new expo, conference, cultural carnival or sports event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingEvent(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CODISSIA INTEC 2026 Machinery Expo"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Category *
                </label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 cursor-pointer"
                >
                  {['EXPO', 'TECH', 'CULTURAL', 'SPORTS', 'MUSIC', 'WORKSHOP', 'BUSINESS'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time Window *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM – 06:00 PM"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Venue &amp; Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CODISSIA Trade Fair Complex, Halls A to E, Coimbatore"
                  value={newEventVenue}
                  onChange={(e) => setNewEventVenue(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={newEventMapLink}
                    onChange={(e) => setNewEventMapLink(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    value={newEventOrganizer}
                    onChange={(e) => setNewEventOrganizer(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Poster Image URL (High-Res)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newEventPosterUrl}
                    onChange={(e) => setNewEventPosterUrl(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Promo Video URL (YouTube or MP4)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newEventVideoUrl}
                    onChange={(e) => setNewEventVideoUrl(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="Key highlights, exhibitors, agenda, and target audience..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEventFeatured}
                    onChange={(e) => setNewEventFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Mark as Featured Event on Homepage</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Publish Event Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT EVENT                                                  */}
      {/* ------------------------------------------------------------------ */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>✏️</span>
                  Edit Event Record
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update timings, media links, and ticketing info.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Category *
                </label>
                <select
                  value={editingEvent.category}
                  onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 cursor-pointer"
                >
                  {['EXPO', 'TECH', 'CULTURAL', 'SPORTS', 'MUSIC', 'WORKSHOP', 'BUSINESS'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time Window *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Venue &amp; Location *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.venue}
                  onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    value={editingEvent.posterUrl || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, posterUrl: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Promo Video URL
                  </label>
                  <input
                    type="url"
                    value={editingEvent.videoUrl || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, videoUrl: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEvent.featured}
                    onChange={(e) => setEditingEvent({ ...editingEvent, featured: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Featured Event</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Event Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ADD NEW DIRECTORY LISTING                                   */}
      {/* ------------------------------------------------------------------ */}
      {isAddingDirectory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>📂</span>
                  Add New Business Listing
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publish a verified commercial or service listing to the Coimbatore Directory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingDirectory(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirectory} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Business / Establishment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ganga Hospital & Orthopaedic Centre"
                    value={newDirName}
                    onChange={(e) => setNewDirName(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Business Owner / MD Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. S. Rajasekaran"
                    value={newDirOwnerName}
                    onChange={(e) => setNewDirOwnerName(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 uppercase">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (newDirCategorySlug === '__custom__') {
                          setNewDirCategorySlug(DIR_CATEGORY_OPTIONS[0].slug);
                          setNewDirCustomCategory('');
                        } else {
                          setNewDirCategorySlug('__custom__');
                        }
                      }}
                      className="text-[11px] font-black text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      {newDirCategorySlug === '__custom__' ? '← Choose Existing' : '+ Add Custom Category'}
                    </button>
                  </div>

                  {newDirCategorySlug !== '__custom__' ? (
                    <select
                      value={newDirCategorySlug}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setNewDirCategorySlug('__custom__');
                        } else {
                          setNewDirCategorySlug(e.target.value);
                          setNewDirCustomCategory('');
                        }
                      }}
                      className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 cursor-pointer"
                    >
                      {dynamicAdminCategoryOptions.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                      <option value="__custom__" className="font-bold text-red-600">
                        ➕ + Add Custom Category (e.g. Pet Clinic, Solar Energy...)
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-1.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <input
                        type="text"
                        required
                        placeholder="Enter custom category (e.g. Pet Clinic, Solar Energy)..."
                        value={newDirCustomCategory}
                        onChange={(e) => setNewDirCustomCategory(e.target.value)}
                        className="w-full bg-white border border-red-300 rounded-lg px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                        autoFocus
                      />
                      <p className="text-[10px] text-stone-500 font-medium">
                        ✨ Icon and badge will be automatically assigned from category keywords.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RS Puram, Peelamedu, Gandhipuram"
                    value={newDirArea}
                    onChange={(e) => setNewDirArea(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Full Postal Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 313 Mettupalayam Road, Saibaba Colony, Coimbatore - 641043"
                  value={newDirAddress}
                  onChange={(e) => setNewDirAddress(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number (Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 422 248 5000"
                    value={newDirPhone}
                    onChange={(e) => setNewDirPhone(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="info@business.com"
                    value={newDirEmail}
                    onChange={(e) => setNewDirEmail(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={newDirWebsite}
                    onChange={(e) => setNewDirWebsite(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Working Timings
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 AM – 08:30 PM (Daily)"
                    value={newDirTiming}
                    onChange={(e) => setNewDirTiming(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-amber-950 uppercase tracking-wide">
                    ⭐ Admin Business Rating (1.0 – 5.0) *
                  </label>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                    Admin Controlled Only
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    required
                    value={newDirRating}
                    onChange={(e) => setNewDirRating(parseFloat(e.target.value) || 4.8)}
                    className="w-32 bg-white border border-amber-400 rounded-xl px-3 py-2 text-sm font-black text-stone-900 shadow-2xs focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="text-xs text-amber-800 font-semibold leading-tight">
                    <span>Set initial rating for this business. Rates are solely controlled by admin.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Photo / Banner Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newDirImageUrl}
                  onChange={(e) => setNewDirImageUrl(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe specialty, key services, certifications, and amenities..."
                  value={newDirDescription}
                  onChange={(e) => setNewDirDescription(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Multispecialty, 24/7 ICU, Cardiology, NABH Accredited"
                  value={newDirTags}
                  onChange={(e) => setNewDirTags(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium"
                />
              </div>

              <div className="flex items-center gap-4 pt-1 flex-wrap">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDirFeatured}
                    onChange={(e) => setNewDirFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Mark as Featured</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDirPopular}
                    onChange={(e) => setNewDirPopular(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span>🔥 Mark as Popular</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDirVerified}
                    onChange={(e) => setNewDirVerified(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>✓ Verified Business</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDirectory(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT DIRECTORY LISTING                                      */}
      {/* ------------------------------------------------------------------ */}
      {editingDirectory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>✏️</span>
                  Edit Business Listing
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update contact numbers, address, rating, and description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDirectory(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDirectory} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Business / Establishment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDirectory.name}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, name: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Business Owner / MD Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. S. Rajasekaran"
                    value={editingDirectory.ownerName || ''}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, ownerName: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 uppercase">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingDirectory.categorySlug === '__custom__') {
                          setEditingDirectory({
                            ...editingDirectory,
                            categorySlug: DIR_CATEGORY_OPTIONS[0].slug,
                            category: DIR_CATEGORY_OPTIONS[0].name,
                            icon: DIR_CATEGORY_OPTIONS[0].icon,
                          });
                          setEditingDirCustomCategory('');
                        } else {
                          setEditingDirectory({
                            ...editingDirectory,
                            categorySlug: '__custom__',
                          });
                        }
                      }}
                      className="text-[11px] font-black text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      {editingDirectory.categorySlug === '__custom__' ? '← Choose Existing' : '+ Add Custom Category'}
                    </button>
                  </div>

                  {editingDirectory.categorySlug !== '__custom__' ? (
                    <select
                      value={editingDirectory.categorySlug}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setEditingDirectory({
                            ...editingDirectory,
                            categorySlug: '__custom__',
                          });
                        } else {
                          const matched = dynamicAdminCategoryOptions.find((c) => c.slug === e.target.value);
                          setEditingDirectory({
                            ...editingDirectory,
                            categorySlug: e.target.value,
                            category: matched ? matched.name : editingDirectory.category,
                            icon: matched ? matched.icon : editingDirectory.icon,
                          });
                          setEditingDirCustomCategory('');
                        }
                      }}
                      className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 cursor-pointer"
                    >
                      {dynamicAdminCategoryOptions.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                      <option value="__custom__" className="font-bold text-red-600">
                        ➕ + Add Custom Category (e.g. Pet Clinic, Solar Energy...)
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-1.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <input
                        type="text"
                        required
                        placeholder="Enter custom category name..."
                        value={editingDirCustomCategory}
                        onChange={(e) => setEditingDirCustomCategory(e.target.value)}
                        className="w-full bg-white border border-red-300 rounded-lg px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                        autoFocus
                      />
                      <p className="text-[10px] text-stone-500 font-medium">
                        ✨ Icon and badge will be automatically assigned from category keywords.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDirectory.area}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, area: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Full Postal Address *
                </label>
                <input
                  type="text"
                  required
                  value={editingDirectory.address}
                  onChange={(e) => setEditingDirectory({ ...editingDirectory, address: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number (Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingDirectory.phone}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, phone: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingDirectory.email || ''}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, email: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={editingDirectory.website || ''}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, website: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Working Timings
                  </label>
                  <input
                    type="text"
                    value={editingDirectory.timing || ''}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, timing: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-amber-950 uppercase tracking-wide">
                    ⭐ Admin Business Rating (1.0 – 5.0) *
                  </label>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                    Admin Controlled Only
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    required
                    value={editingDirectory.rating !== undefined ? editingDirectory.rating : 4.8}
                    onChange={(e) =>
                      setEditingDirectory({
                        ...editingDirectory,
                        rating: parseFloat(e.target.value) || 4.8,
                      })
                    }
                    className="w-32 bg-white border border-amber-400 rounded-xl px-3 py-2 text-sm font-black text-stone-900 shadow-2xs focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="text-xs text-amber-800 font-semibold leading-tight">
                    <span>Update business rating shown across public website directory cards. Rates are solely controlled by admin.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Photo / Banner Image URL
                </label>
                <input
                  type="url"
                  value={editingDirectory.imageUrl || ''}
                  onChange={(e) => setEditingDirectory({ ...editingDirectory, imageUrl: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  value={editingDirectory.description}
                  onChange={(e) => setEditingDirectory({ ...editingDirectory, description: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1 flex-wrap">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDirectory.featured}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, featured: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Featured Listing</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDirectory.popular}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, popular: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span>🔥 Popular Listing</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDirectory.verified}
                    onChange={(e) => setEditingDirectory({ ...editingDirectory, verified: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>✓ Verified Business</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDirectory(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Directory Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
