'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  safeSetItem,
} from '@/services/db';
import { getCategoryMeta, getCategoryFallbackImage, slugify } from '@/app/directory/components/DirectoryIcons';
import { SupabaseTablesManager } from './components/SupabaseTablesManager';
import { supabase } from '@/lib/supabaseClient';
import { DirectoryImageManager, ImageSlotItem, uploadDirectoryImages } from './components/DirectoryImageManager';
import PollAnalytics from '@/components/admin/PollAnalytics';
import {
  minimizeArticlesForStorage,
  purgeLargeOutdatedStorageKeys,
  safeLocalStorageSet,
} from '@/utils/storage';
import { compressImageFile, uploadImageWithFallback } from '@/lib/imageOptimization';

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
  placementKey?:
    | 'TOP_HEADER_LEADERBOARD'
    | 'HOME_IN_FEED_1'
    | 'HOME_IN_FEED_2'
    | 'LEFT_SIDEBAR_BANNER'
    | 'RIGHT_SIDEBAR_BANNER'
    | 'RIGHT_SIDEBAR_TOP'
    | 'RIGHT_SIDEBAR_BOTTOM'
    | 'ARTICLE_DETAIL_BOTTOM'
    | 'left_sidebar'
    | 'right_sidebar'
    | 'top_banner'
    | 'in_article'
    | string;
  format: string;
  impressions: string;
  ctr: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  fallbackAdSense?: boolean;
  dimensions?: string;
  orientation?: 'vertical' | 'horizontal';
  slides: {
    id: string;
    title: string;
    advertiser: string;
    description?: string;
    imageUrl: string;
    active: boolean;
    ctaText?: string;
    ctaUrl?: string;
  }[];
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
    impressions: '24,580',
    ctr: '3.8%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: '728x90',
    orientation: 'horizontal',
    slides: [
      {
        id: 'slide-1',
        title: 'TIDEL Park Coimbatore Phase-2 Office Suites Open for Booking',
        description: 'Grade-A tech park infrastructure along Avinashi Road with 100% power backup and direct metro access.',
        advertiser: 'ELCOT / TIDEL Coimbatore',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        active: true,
      },
      {
        id: 'slide-2',
        title: 'Coimbatore Metro Phase 1 Corridors Approved',
        description: 'Upcoming high-speed transit connecting major IT hubs and industrial zones.',
        advertiser: 'Covai Transit',
        imageUrl: '/logo.png',
        active: true,
      }
    ]
  },
  {
    id: 'ad-slot-left',
    slotId: 'LEFT_SIDEBAR_BANNER',
    placementKey: 'LEFT_SIDEBAR_BANNER',
    format: 'Left Sticky Sidebar Banner (210x400 Vertical)',
    impressions: '28,140',
    ctr: '4.6%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: '210x400',
    orientation: 'vertical',
    slides: [
      {
        id: 'slide-left-1',
        title: 'PSG College of Technology — Autonomous & NIRF Ranked Admissions 2026',
        description: 'Admissions 2026',
        advertiser: 'PSG Tech',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
        active: true,
      }
    ]
  },
  {
    id: 'ad-slot-right',
    slotId: 'RIGHT_SIDEBAR_BANNER',
    placementKey: 'RIGHT_SIDEBAR_BANNER',
    format: 'Right Sticky Sidebar Banner (210x400 Vertical)',
    impressions: '26,790',
    ctr: '4.3%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: '210x400',
    orientation: 'vertical',
    slides: [
      {
        id: 'slide-right-1',
        title: 'Kongu Living Estates — Luxury Smart Villas in Saravanampatti',
        description: 'Real Estate',
        advertiser: 'Kongu Living',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        active: true,
      }
    ]
  },
  {
    id: 'ad-slot-2',
    slotId: 'HOME_IN_FEED_1',
    placementKey: 'HOME_IN_FEED_1',
    format: 'Home In-Feed 1 (Between Top Stories & Our City)',
    impressions: '18,950',
    ctr: '4.2%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: 'fluid',
    orientation: 'horizontal',
    slides: [
      {
        id: 'slide-infeed1-1',
        title: 'ELGi Industrial Air Compressors & Smart Automation Solutions',
        description: 'Upgrade factory floor efficiency with Industry 4.0 energy-saving rotary screw compressors manufactured in Coimbatore.',
        advertiser: 'ELGi Equipments Global',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        active: true,
        ctaUrl: '/enquiry',
      }
    ]
  },
  {
    id: 'ad-slot-3',
    slotId: 'HOME_IN_FEED_2',
    placementKey: 'HOME_IN_FEED_2',
    format: 'Home In-Feed 2 (Between Stories & Infrastructure)',
    impressions: '16,740',
    ctr: '3.9%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: 'fluid',
    orientation: 'horizontal',
    slides: [
      {
        id: 'slide-infeed2-1',
        title: 'Kongu Living Gated Villa Community in Saravanampatti IT Corridor',
        description: 'DTCP & RERA approved 3 & 4 BHK luxury smart villas with clubhouse, EV charging points, and 24/7 security.',
        advertiser: 'Kongu Living Developers',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        active: true,
        ctaUrl: '/enquiry',
      }
    ]
  },
  {
    id: 'ad-slot-4',
    slotId: 'HOME_IN_FEED_3',
    placementKey: 'HOME_IN_FEED_3',
    format: 'Home In-Feed 3 (Between Infrastructure & Business)',
    impressions: '15,420',
    ctr: '4.1%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: 'fluid',
    orientation: 'horizontal',
    slides: [
      {
        id: 'slide-infeed3-1',
        title: 'PSG Tech, CIT & Kumaraguru Engineering Admissions Open 2026',
        description: 'Shape your future with premier AI, Robotics, and DeepTech engineering programs with top tier-1 placements.',
        advertiser: 'Covai Higher Education Guild',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
        active: true,
        ctaUrl: '/enquiry',
      }
    ]
  },
  {
    id: 'ad-slot-5',
    slotId: 'HOME_IN_FEED_4',
    placementKey: 'HOME_IN_FEED_4',
    format: 'Home In-Feed 4 (Between Business & CEO Spotlight)',
    impressions: '14,890',
    ctr: '4.3%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: 'fluid',
    orientation: 'horizontal',
    slides: [
      {
        id: 'slide-infeed4-1',
        title: 'Supercharge Your Startup with Coimbatore Co-Working Hubs',
        description: 'Flexible private cabins, enterprise-grade high-speed fiber, and 24x7 power redundancy at RS Puram & Peelamedu.',
        advertiser: 'Covai Workspaces',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        active: true,
        ctaUrl: '/enquiry',
      }
    ]
  },
  {
    id: 'ad-slot-6',
    slotId: 'ARTICLE_DETAIL_BOTTOM',
    placementKey: 'ARTICLE_DETAIL_BOTTOM',
    format: 'Article Detail Bottom (In-Article Fluid)',
    impressions: '12,930',
    ctr: '4.5%',
    active: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    fallbackAdSense: true,
    dimensions: 'fluid',
    orientation: 'horizontal',
    slides: [
      {
        id: 'slide-article-1',
        title: 'Coimbatore Airport Runway Expansion & Modern Logistics Terminal',
        description: 'Direct air cargo handling facilities and multimodal connectivity across Kongu region.',
        advertiser: 'Coimbatore Aviation Infrastructure Forum',
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
        active: true,
        ctaUrl: '/enquiry',
      }
    ]
  },
];

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'supabase' | 'articles' | 'outages' | 'ads' | 'blood' | 'events' | 'directory' | 'verifications' | 'reviews' | 'explorer'>('articles');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Articles state from DB Service
  const [articles, setArticles] = useState<Article[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('NEWS');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newAuthor, setNewAuthor] = useState('Editorial Bureau');
  const [newContent, setNewContent] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [articleSuccess, setArticleSuccess] = useState('');
  const [articleError, setArticleError] = useState('');
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

  // Bulk Selection State for Stories & Articles
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());
  const [isBulkDeletingArticles, setIsBulkDeletingArticles] = useState(false);
  const [bulkArticleDeleteModalOpen, setBulkArticleDeleteModalOpen] = useState(false);

  // Category Filtering State in Admin Portal
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Reset selected articles when filtering category changes
  useEffect(() => {
    setSelectedArticleIds(new Set());
  }, [selectedCategoryFilter]);

  const ADMIN_FILTER_CATEGORIES = [
    'All',
    'NEWS',
    'BUSINESS',
    'TECH',
    'INFRASTRUCTURE',
    'CEO',
    'SPORTS',
    'EDUCATION',
    'E-PAPER',
  ];

  // Category Scroll Ref & Controls for Horizontal Filter Bar
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 240;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getCategoryCount = (catName: string, catSlug?: string) => {
    if (catName === 'All') return articles.filter((a: any) => (a.category || '').toUpperCase().trim() !== 'EVENTS').length;
    return articles.filter((article: any) => {
      const cat = (article.category || '').toLowerCase().trim();
      if (cat === 'events') return false;
      const targetName = (catName || '').toLowerCase().trim();
      const targetSlug = (catSlug || '').toLowerCase().replace('/', '').trim();
      return cat === targetName || (targetSlug && cat === targetSlug);
    }).length;
  };

  const filteredArticles = (selectedCategoryFilter === 'All'
    ? articles.filter((item) => (item.category || '').toUpperCase().trim() !== 'EVENTS')
    : articles.filter((item) => {
        const cat = (item.category || '').toLowerCase().trim();
        if (cat === 'events') return false;
        const target = selectedCategoryFilter.toLowerCase().trim();
        const cleanTarget = target.replace(/-/g, ' ');
        const normCat = cat.replace(/[^a-z0-9]/g, '');
        const normTarget = target.replace(/[^a-z0-9]/g, '');

        if (cat === target || cat === cleanTarget || normCat === normTarget) return true;
        if (target === 'infrastructure') return (item.subCategory || '').toLowerCase().includes('infrastructure') || cat.includes('infra');
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
  const publishFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

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
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // New Event Form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('EVENT');
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
  const [supabaseCategories, setSupabaseCategories] = useState<{ id?: string; name: string; slug: string; icon?: string }[]>([]);
  const [isDirLoading, setIsDirLoading] = useState(false);
  const [isSubmittingDir, setIsSubmittingDir] = useState(false);
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

  // Contact Enquiries State for Admin Notification Badge & Sidebar Counter
  const [contactEnquiriesList, setContactEnquiriesList] = useState<ContactEnquiryRecord[]>([]);

  const unreadEnquiriesCount = useMemo(() => {
    if (!Array.isArray(contactEnquiriesList)) return 0;
    return contactEnquiriesList.filter((e) => {
      const st = (e.status || '').toLowerCase().trim();
      return st === 'unread' || st === 'pending';
    }).length;
  }, [contactEnquiriesList]);

  const totalActiveEnquiriesCount = useMemo(() => {
    if (!Array.isArray(contactEnquiriesList)) return 0;
    return contactEnquiriesList.filter((e) => {
      const st = (e.status || '').toLowerCase().trim();
      return st !== 'archived';
    }).length;
  }, [contactEnquiriesList]);

  const pendingEnquiriesCount = unreadEnquiriesCount;

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
  const [newDirImageSlots, setNewDirImageSlots] = useState<ImageSlotItem[]>([]);
  const [editingDirImageSlots, setEditingDirImageSlots] = useState<ImageSlotItem[]>([]);

  // Load all data from DB Service
  const refreshAllData = useCallback(async () => {
    try {
      const [
        artList,
        catList,
        usrList,
        outList,
        adList,
        donorList,
        alertList,
        eventList,
        verList,
        revList,
        enqList,
      ] = await Promise.all([
        dbService.getArticles(),
        dbService.getCategories(),
        dbService.getUsers(),
        dbService.getPowerOutages(),
        dbService.getAdSlots(),
        dbService.getBloodDonors(),
        dbService.getEmergencyBloodAlerts(),
        dbService.getEvents(),
        dbService.getDirectoryVerifications(),
        dbService.getDirectoryReviews(),
        dbService.getDonorContactRequests(),
      ]);

      setArticles(artList);
      setCategoriesList(catList);
      setUsersList(usrList);
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

      setAdsDbList(adList);
      if (adList && adList.length > 0) {
        const mergedAds: AdSlotSetting[] = [...adList] as any;
        INITIAL_ADS.forEach((initAd) => {
          const exists = mergedAds.some(
            (a) =>
              Boolean(a.slotId && initAd.slotId && a.slotId.toUpperCase() === initAd.slotId.toUpperCase()) ||
              Boolean(a.placementKey && initAd.placementKey && a.placementKey.toUpperCase() === initAd.placementKey.toUpperCase()) ||
              Boolean(a.id && initAd.id && a.id === initAd.id)
          );
          if (!exists) {
            mergedAds.push(initAd);
          }
        });
        setAds(mergedAds);
      } else {
        setAds(INITIAL_ADS);
      }

      setDonorsDbList(donorList);
      setDonors(donorList);

      setEmergencyAlerts(alertList);

      const cleanEvents = (eventList || []).filter((e) => (e.category || '').toUpperCase().trim() !== 'NEWS');
      setEventsDbList(cleanEvents);
      setEvents(cleanEvents);

      setVerificationsList(verList);
      setReviewsList(revList);
      setDonorEnquiries(enqList);

      // Fetch live directory categories from Supabase
      try {
        const { data: supaCats, error: supaCatsErr } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (!supaCatsErr && supaCats && supaCats.length > 0) {
          setSupabaseCategories(supaCats.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || slugify(c.name),
            icon: c.icon || getCategoryMeta(c.name).fallbackEmoji || '🏢',
          })));
        }
      } catch (catErr) {
        console.warn('Supabase categories load warning:', catErr);
      }

      // Fetch live directory listings directly from Supabase
      setIsDirLoading(true);
      try {
        const { data: supaListings, error: supaListingsErr } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!supaListingsErr && supaListings) {
          const mapped: DirectoryListing[] = supaListings.map((sl: any) => ({
            id: sl.id,
            name: sl.title || sl.name || 'Business Listing',
            category: sl.category || 'General',
            categorySlug: slugify(sl.category || 'general'),
            icon: getCategoryMeta(sl.category || '').fallbackEmoji || '🏢',
            phone: sl.phone || '',
            address: sl.address || '',
            area: sl.area || 'Coimbatore',
            rating: typeof sl.rating === 'number' ? sl.rating : 4.8,
            reviewsCount: 0,
            verified: true,
            featured: false,
            popular: false,
            description: sl.description || `${sl.title || sl.name} verified business in ${sl.area || 'Coimbatore'}.`,
            createdAt: sl.created_at || new Date().toISOString(),
            images: Array.isArray(sl.images) && sl.images.length > 0
              ? sl.images
              : (sl.image_url ? [sl.image_url] : (sl.photo_url ? [sl.photo_url] : [])),
            imageUrl: (Array.isArray(sl.images) && sl.images[0]) || sl.image_url || sl.photo_url || undefined,
            ownerName: sl.owner_name || sl.ownerName || undefined,
            email: sl.email || undefined,
            website: sl.website || undefined,
          }));
          setDirectoryListings(mapped);
        } else {
          const dirList = await dbService.getDirectoryListings();
          setDirectoryListings(dirList);
        }
      } catch (dirErr) {
        console.warn('Live listings load warning, using cache:', dirErr);
        const dirList = await dbService.getDirectoryListings();
        setDirectoryListings(dirList);
      } finally {
        setIsDirLoading(false);
      }



      // Live Supabase Enquiries Status Fetch
      try {
        const { data: enquiryRows, error: enqErr } = await supabase
          .from('enquiries')
          .select('id, status, user_name')
          .not('user_name', 'like', '__SYSTEM_CONFIG_%');

        if (!enqErr && Array.isArray(enquiryRows)) {
          const mapped: ContactEnquiryRecord[] = enquiryRows.map((e: any) => ({
            id: e.id,
            name: e.user_name || 'Anonymous',
            email: '',
            phone: '',
            subject: '',
            message: '',
            status: (e.status?.toLowerCase() === 'pending' ? 'unread' : (e.status?.toLowerCase() || 'unread')) as any,
            createdAt: new Date().toISOString(),
          }));
          setContactEnquiriesList(mapped);
        } else {
          const contactList = await dbService.getContactEnquiries();
          setContactEnquiriesList(Array.isArray(contactList) ? contactList : []);
        }
      } catch (enqErr) {
        console.warn('Live enquiries fetch warning, using dbService:', enqErr);
        try {
          const contactList = await dbService.getContactEnquiries();
          setContactEnquiriesList(Array.isArray(contactList) ? contactList : []);
        } catch {
          setContactEnquiriesList([]);
        }
      }
    } catch (err) {
      console.error('Error loading DB records', err);
    }
  }, []);

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
  }, [refreshAllData]);

  // Check auth session
  useEffect(() => {
    const sessionAuth = localStorage.getItem('t_covai_admin_auth');
    const savedEmail = localStorage.getItem('t_covai_admin_email');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      if (savedEmail) setAdminEmail(savedEmail);
    }
  }, []);

  // Handle URL navigation params (e.g. ?tab=articles#publish-article-form) and AI Draft Review prefill
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['articles', 'supabase', 'outages', 'ads', 'blood', 'events', 'directory', 'verifications', 'reviews', 'explorer'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      } else if (window.location.hash.includes('publish') || window.location.hash.includes('stories')) {
        setActiveTab('articles');
      }

      // Check if user navigated with prefill draft from AI Draft Review
      try {
        const prefillRaw = localStorage.getItem('tc_prefill_draft');
        if (prefillRaw) {
          const prefill = JSON.parse(prefillRaw);
          if (prefill?.title) setNewTitle(prefill.title);
          if (prefill?.content) setNewContent(prefill.content);
          if (prefill?.category) setNewCategory(prefill.category);
          if (prefill?.author) setNewAuthor(prefill.author);
          localStorage.removeItem('tc_prefill_draft');
          setActiveTab('articles');
          setTimeout(() => {
            const formEl = document.getElementById('publish-article-form');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 350);
        } else if (window.location.hash.includes('publish')) {
          setTimeout(() => {
            const formEl = document.getElementById('publish-article-form');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 350);
        }
      } catch (e) {}
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

  // Image Drag & Drop Handler with instant compression & background CDN upload
  const handleImageFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP, AVIF)');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the maximum allowed size of 12MB.`);
      return;
    }
    setImageFileName(file.name);
    try {
      // 1. Instant client-side compression (<50ms) for snappy preview
      const comp = await compressImageFile(file, 1600, 0.82);
      setImageUrl(comp.dataUrl);

      // 2. Fast background upload to Supabase Storage CDN
      uploadImageWithFallback(file, 'news').then((cdnUrl) => {
        if (cdnUrl) {
          setImageUrl(cdnUrl);
        }
      }).catch((uploadErr) => {
        console.warn('Background article image upload notice:', uploadErr);
      });
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

  const handleRemovePublishImage = () => {
    setImageUrl('');
    setImageFileName('');
    if (publishFileInputRef.current) {
      publishFileInputRef.current.value = '';
    }
  };

  const handleRemoveEditImage = () => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      imageUrl: '' as any,
      image: '' as any,
      image_url: null,
      mediaUrl: editingArticle.mediaType === 'video' ? editingArticle.videoUrl : undefined,
    });
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // TANGEDCO Automated Gemini AI Ingestion & Sync Handler
  const handleAutoSyncTangedco = async (dateParam?: string) => {
    try {
      setIsAutoSyncing(true);
      const targetDate = dateParam || filterDate || getTomorrowDateStr();
      const res = await fetch('/api/tangedco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-action': 'sync-tangedco',
        },
        body: JSON.stringify({ date: targetDate }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.outages && Array.isArray(json.outages)) {
          const fetchedItems: OutageItem[] = json.outages.map((o: any) => ({
            id: o.id || `out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            area: o.area,
            substation: o.substation,
            date: o.scheduledDate || targetDate,
            time: o.timeWindow || '09:00 AM – 04:00 PM',
            status: o.status || 'scheduled',
            details: o.reason || o.details || 'Substation line maintenance',
            isTomorrow: (o.scheduledDate || targetDate) === getTomorrowDateStr(),
            affectedStreets: o.affectedStreets || [],
            isAutoSynced: true,
          }));

          // Strict Deduplication based on Date and Substation / Area
          const existingMap = new Set(
            outages.map(
              (e) =>
                `${e.date || targetDate}::${(e.substation || e.area).toLowerCase().trim()}`
            )
          );

          const newUniqueItems = fetchedItems.filter(
            (item) =>
              !existingMap.has(
                `${item.date || targetDate}::${(item.substation || item.area).toLowerCase().trim()}`
              )
          );

          const updatedList = [...newUniqueItems, ...outages];
          setOutages(updatedList);
          await syncOutagesToDb(updatedList);

          if (newUniqueItems.length > 0) {
            setOutageSuccess(
              `⚡ Gemini AI Ingestion Success: Added ${newUniqueItems.length} new unique TNEB feeder shutdown schedules for ${json.summary?.scheduledDate || targetDate}!`
            );
          } else {
            setOutageSuccess(
              `⚡ TNEB Live Check Complete: All ${fetchedItems.length} feeder schedules for ${json.summary?.scheduledDate || targetDate} are already up to date (0 duplicates created).`
            );
          }
          setTimeout(() => setOutageSuccess(''), 5000);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `API sync error (${res.status})`);
      }
    } catch (err: any) {
      console.error('TNEB auto-sync error:', err);
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
      safeSetItem('t_covai_outages', dataStr);
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
      safeSetItem('t_covai_donors', JSON.stringify(updated));
      window.dispatchEvent(new Event('donorsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'donors' } }));
    }
  };

  const syncEmergencyAlertsToDb = async (updated: EmergencyBloodAlert[]) => {
    setEmergencyAlerts(updated);
    await dbService.saveEmergencyBloodAlerts(updated);
    if (typeof window !== 'undefined') {
      safeSetItem('t_covai_emergency_blood', JSON.stringify(updated));
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
      safeSetItem('t_covai_events', JSON.stringify(updated));
      window.dispatchEvent(new Event('eventsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'events' } }));
    }
  };

  const handleEventImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('Image size exceeds 12MB limit.');
      e.target.value = '';
      return;
    }

    const validMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
    ];
    if (!validMimes.includes(file.type.toLowerCase())) {
      alert('Unsupported image format. Allowed: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP');
      e.target.value = '';
      return;
    }

    try {
      // 1. Instant client-side compression (<50ms) for snappy preview
      const comp = await compressImageFile(file, 1600, 0.82);
      if (isEdit) {
        setEditingEvent((prev) => (prev ? { ...prev, posterUrl: comp.dataUrl } : null));
      } else {
        setNewEventPosterUrl(comp.dataUrl);
      }

      // 2. Fast background upload to Supabase Storage CDN
      uploadImageWithFallback(file, 'events').then((cdnUrl) => {
        if (cdnUrl) {
          if (isEdit) {
            setEditingEvent((prev) => (prev ? { ...prev, posterUrl: cdnUrl } : null));
          } else {
            setNewEventPosterUrl(cdnUrl);
          }
        }
      }).catch((uploadErr) => {
        console.warn('Background event poster upload notice:', uploadErr);
      });
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (isEdit) {
          setEditingEvent((prev) => (prev ? { ...prev, posterUrl: base64 } : null));
        } else {
          setNewEventPosterUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEvent) return;
    if (!newEventTitle.trim() || !newEventVenue.trim()) return;

    setIsSubmittingEvent(true);
    try {
      const nowIso = new Date().toISOString();
      const title = newEventTitle.trim();
      const venue = newEventVenue.trim() || 'Coimbatore';
      const description = newEventDesc.trim() || 'Coimbatore public exhibition and community event.';
      const imageUrl = newEventPosterUrl.trim();
      const date = newEventDate || getTomorrowDateStr();
      const time = newEventTime.trim() || '10:00 AM – 06:00 PM';
      const organizer = newEventOrganizer.trim() || 'Coimbatore Event Bureau';
      const mapLink = newEventMapLink.trim() || `https://maps.google.com/?q=${encodeURIComponent(venue + ' Coimbatore')}`;
      const videoUrl = newEventVideoUrl.trim() || undefined;

      const payload = {
        title,
        event_name: title,
        description,
        image_url: imageUrl || null,
        poster_url: imageUrl || null,
        posterUrl: imageUrl || undefined,
        venue,
        location: venue,
        event_date: date,
        event_time: time,
        date,
        time,
        contact_phone: '+91 98765 43210',
        category: 'EVENT',
        is_featured: newEventFeatured,
        featured: newEventFeatured,
        organizer,
        mapLink,
        videoUrl,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.success === false) {
        throw new Error(resJson.error || 'Server error inserting event.');
      }

      const serverRecord = resJson.data;
      const created: EventRecord = {
        id: serverRecord?.id || `evt-${Date.now()}`,
        title,
        category: 'EVENT',
        date,
        time,
        venue,
        mapLink,
        posterUrl: imageUrl,
        videoUrl,
        description,
        organizer,
        status: newEventStatus,
        featured: newEventFeatured,
        createdAt: serverRecord?.created_at || nowIso,
        updatedAt: serverRecord?.created_at || nowIso,
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
    } catch (err: any) {
      console.error('Failed to create event:', err);
      alert('Failed to publish event: ' + (err?.message || 'Unknown server error'));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || isSubmittingEvent) return;
    setIsSubmittingEvent(true);
    try {
      const nowIso = new Date().toISOString();
      const title = (editingEvent.title || '').trim();
      const venue = (editingEvent.venue || 'Coimbatore').trim();
      const description = (editingEvent.description || 'Coimbatore public event.').trim();
      const rawImg = (editingEvent.posterUrl || '').trim();
      const imageUrl = rawImg.includes('photo-1511578314322-379afb476865') ? '' : rawImg;
      const date = editingEvent.date || getTomorrowDateStr();
      const time = (editingEvent.time || '10:00 AM – 06:00 PM').trim();

      const payload = {
        id: editingEvent.id,
        title,
        event_name: title,
        description,
        image_url: imageUrl || null,
        poster_url: imageUrl || null,
        posterUrl: imageUrl || undefined,
        venue,
        location: venue,
        event_date: date,
        event_time: time,
        date,
        time,
        contact_phone: '+91 98765 43210',
        category: 'EVENT',
        is_featured: editingEvent.featured || false,
        featured: editingEvent.featured || false,
        organizer: editingEvent.organizer || 'Coimbatore Event Bureau',
        mapLink: editingEvent.mapLink || `https://maps.google.com/?q=${encodeURIComponent(venue + ' Coimbatore')}`,
        videoUrl: editingEvent.videoUrl || undefined,
      };

      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.success === false) {
        throw new Error(resJson.error || 'Server error updating event.');
      }

      const updatedRecord: EventRecord = {
        ...editingEvent,
        title,
        venue,
        description,
        posterUrl: imageUrl,
        category: 'EVENT',
        updatedAt: nowIso,
      };
      const updated = events.map((ev) => (ev.id === editingEvent.id ? updatedRecord : ev));
      await syncEventsToDb(updated);

      setEditingEvent(null);
      setEventSuccess(`✓ Updated event "${editingEvent.title}"!`);
      setTimeout(() => setEventSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      alert('Failed to update event: ' + (err?.message || 'Unknown server error'));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    const updated = events.filter((ev) => ev.id !== id);
    setEvents(updated);
    await dbService.deleteEvent(id);
    await syncEventsToDb(updated);
    try {
      await fetch(`/api/events?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (delErr) {
      console.warn('API /api/events DELETE notice:', delErr);
    }
    setEventSuccess(`Deleted event "${title}"`);
    setTimeout(() => setEventSuccess(''), 3000);
  };

  const toggleEventFeatured = async (id: string) => {
    const updated = events.map((ev) => (ev.id === id ? { ...ev, featured: !ev.featured } : ev));
    await syncEventsToDb(updated);
    setEventSuccess('Updated event featured status!');
    setTimeout(() => setEventSuccess(''), 2000);
  };

  const dynamicAdminCategoryOptions = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; icon: string }>();
    // 1. Live categories from Supabase categories table
    supabaseCategories.forEach((c) => {
      if (c && c.name?.trim()) {
        const slug = slugify(c.slug || c.name);
        map.set(slug, {
          name: c.name.trim(),
          slug,
          icon: c.icon || getCategoryMeta(c.name).fallbackEmoji || '🏢',
        });
      }
    });
    // 2. Add categories present in listings
    directoryListings.forEach((item) => {
      if (item.category?.trim()) {
        const slug = slugify(item.categorySlug || item.category);
        if (!map.has(slug)) {
          const meta = getCategoryMeta(item.category);
          map.set(slug, {
            name: item.category.trim(),
            slug,
            icon: item.icon || meta.fallbackEmoji || '🏢',
          });
        }
      }
    });
    // 3. Fallback default categories if empty
    if (map.size === 0) {
      DIR_CATEGORY_OPTIONS.forEach((c) => {
        map.set(c.slug.toLowerCase(), c);
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [supabaseCategories, directoryListings]);

  const handleCreateDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim()) return;
    setIsSubmittingDir(true);

    try {
      let finalCategoryName = '';
      let finalCategorySlug = '';
      let finalCategoryIcon = '🏢';

      if (newDirCategorySlug === '__custom__' && newDirCustomCategory.trim()) {
        // Step 2a: Trim spaces and auto-generate unique slug
        finalCategoryName = newDirCustomCategory.trim();
        finalCategorySlug = slugify(finalCategoryName);
        const meta = getCategoryMeta(finalCategoryName);
        finalCategoryIcon = meta.fallbackEmoji || '🏢';
      } else {
        const matchedCat =
          dynamicAdminCategoryOptions.find((c) => c.slug === newDirCategorySlug) ||
          dynamicAdminCategoryOptions[0] ||
          DIR_CATEGORY_OPTIONS[0];
        finalCategoryName = matchedCat.name.trim();
        finalCategorySlug = matchedCat.slug;
        finalCategoryIcon = matchedCat.icon;
      }

      // Step 2b: Safely check if category or slug already exists in categories (case-insensitive)
      let matchedCategoryInDb = false;
      try {
        const { data: existingCats } = await supabase
          .from('categories')
          .select('id, name, slug, icon')
          .or(`slug.ilike.${finalCategorySlug},name.ilike.${finalCategoryName}`)
          .limit(1);

        if (existingCats && existingCats.length > 0) {
          matchedCategoryInDb = true;
          finalCategoryName = existingCats[0].name;
          finalCategorySlug = existingCats[0].slug;
          finalCategoryIcon = existingCats[0].icon || finalCategoryIcon;
        }
      } catch (checkErr) {
        console.warn('Category existence check warning:', checkErr);
      }

      // Step 2c: If it does not exist, insert it into categories table
      if (!matchedCategoryInDb) {
        const newCatId = crypto.randomUUID();
        try {
          const { data: insertedCat, error: catInsertErr } = await supabase
            .from('categories')
            .insert([
              {
                id: newCatId,
                name: finalCategoryName,
                slug: finalCategorySlug,
                icon: finalCategoryIcon,
              },
            ])
            .select()
            .single();

          if (!catInsertErr && insertedCat) {
            setSupabaseCategories((prev) => [
              ...prev.filter((c) => c.slug !== finalCategorySlug),
              insertedCat,
            ].sort((a, b) => a.name.localeCompare(b.name)));
          }
        } catch (catInsertErr) {
          console.error('Error inserting category into Supabase:', catInsertErr);
        }
      }

      const newListingId = crypto.randomUUID();

      // Upload images to Supabase directory-gallery storage
      const finalImages = await uploadDirectoryImages(newDirImageSlots, newListingId);
      const coverImage = finalImages[0] || (newDirImageUrl.trim() ? newDirImageUrl.trim() : undefined);
      if (coverImage && !finalImages.includes(coverImage)) {
        finalImages.unshift(coverImage);
      }

      // Step 2d: Insert the business into listings linked with this category
      const ratingVal = typeof newDirRating === 'number' ? newDirRating : parseFloat(newDirRating) || 4.8;
      const listingPayload: any = {
        id: newListingId,
        title: newDirName.trim(),
        category: finalCategoryName,
        phone: newDirPhone.trim() || null,
        address: newDirAddress.trim() || `${newDirArea.trim()}, Coimbatore`,
        area: newDirArea.trim() || 'Coimbatore',
        pincode: null,
        rating: ratingVal,
        images: finalImages,
      };

      const { error: listingErr } = await supabase
        .from('listings')
        .insert([listingPayload]);

      if (listingErr) {
        console.error('Error inserting listing into Supabase:', listingErr);
      }

      const created: DirectoryListing = {
        id: newListingId,
        name: newDirName.trim(),
        ownerName: newDirOwnerName.trim() || undefined,
        category: finalCategoryName,
        categorySlug: finalCategorySlug,
        icon: finalCategoryIcon,
        rating: ratingVal,
        reviewsCount: 0,
        area: newDirArea.trim() || 'Coimbatore',
        address: newDirAddress.trim() || `${newDirArea.trim()}, Coimbatore`,
        phone: newDirPhone.trim() || '+91 422 200 0000',
        email: newDirEmail.trim() || undefined,
        website: newDirWebsite.trim() || undefined,
        timing: undefined,
        description: newDirDescription.trim() || `${newDirName.trim()} verified business in ${newDirArea.trim()}, Coimbatore.`,
        featured: newDirFeatured,
        popular: newDirPopular,
        verified: newDirVerified,
        tags: newDirTags ? newDirTags.split(',').map((t) => t.trim()).filter(Boolean) : [finalCategoryName],
        imageUrl: coverImage,
        images: finalImages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist to local cache for offline stability
      await dbService.saveDirectoryCategory({
        name: created.category,
        slug: created.categorySlug,
        icon: created.icon,
      });
      await dbService.saveDirectoryListing(created);

      // Re-fetch live listings from Supabase to guarantee real-time synchronization
      const { data: liveListings } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (liveListings && liveListings.length > 0) {
        setDirectoryListings(liveListings.map((sl: any) => ({
          id: sl.id,
          name: sl.title || sl.name || 'Business Listing',
          category: sl.category || 'General',
          categorySlug: slugify(sl.category || 'general'),
          icon: getCategoryMeta(sl.category || '').fallbackEmoji || '🏢',
          phone: sl.phone || '',
          address: sl.address || '',
          area: sl.area || 'Coimbatore',
          rating: typeof sl.rating === 'number' ? sl.rating : 4.8,
          reviewsCount: 0,
          verified: true,
          featured: false,
          popular: false,
          description: sl.description || `${sl.title || sl.name} verified business in ${sl.area || 'Coimbatore'}.`,
          createdAt: sl.created_at || new Date().toISOString(),
          images: Array.isArray(sl.images) && sl.images.length > 0
            ? sl.images
            : (sl.image_url ? [sl.image_url] : []),
          imageUrl: (Array.isArray(sl.images) && sl.images[0]) || sl.image_url || undefined,
          ownerName: sl.owner_name || sl.ownerName || undefined,
          email: sl.email || undefined,
          website: sl.website || undefined,
        })));
      } else {
        setDirectoryListings((prev) => [created, ...prev]);
      }

      setIsAddingDirectory(false);

      // Reset inputs
      setNewDirName('');
      setNewDirOwnerName('');
      setNewDirCategorySlug(dynamicAdminCategoryOptions[0]?.slug || 'hospitals-clinics');
      setNewDirCustomCategory('');
      setNewDirArea('');
      setNewDirAddress('');
      setNewDirPhone('');
      setNewDirEmail('');
      setNewDirWebsite('');
      setNewDirDescription('');
      setNewDirTags('');
      setNewDirImageUrl('');
      setNewDirImageSlots([]);
      setDirSuccess(`✓ Successfully added business "${created.name}" to category "${finalCategoryName}"!`);
      setTimeout(() => setDirSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to create directory listing:', err);
      alert('Error creating listing: ' + (err?.message || 'Please try again'));
    } finally {
      setIsSubmittingDir(false);
    }
  };

  const handleSaveDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDirectory) return;
    setIsSubmittingDir(true);

    try {
      let finalCat = editingDirectory.category;
      let finalSlug = editingDirectory.categorySlug;
      let finalIcon = editingDirectory.icon;

      if (editingDirCustomCategory.trim()) {
        finalCat = editingDirCustomCategory.trim();
        finalSlug = slugify(finalCat);
        const meta = getCategoryMeta(finalCat);
        finalIcon = meta.fallbackEmoji || '🏢';

        // Check if custom category exists in Supabase categories
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id, name, slug')
          .or(`slug.ilike.${finalSlug},name.ilike.${finalCat}`)
          .limit(1);

        if (!existingCat || existingCat.length === 0) {
          const newCatId = crypto.randomUUID();
          await supabase.from('categories').insert([{
            id: newCatId,
            name: finalCat,
            slug: finalSlug,
            icon: finalIcon,
          }]);
          setSupabaseCategories((prev) => [...prev, { id: newCatId, name: finalCat, slug: finalSlug, icon: finalIcon }]);
        }
      }

      // Upload newly added images to Supabase directory-gallery storage
      const finalImages = await uploadDirectoryImages(editingDirImageSlots, editingDirectory.id);
      const coverImage = finalImages[0] || editingDirectory.imageUrl || undefined;

      const nowIso = new Date().toISOString();
      const updated: DirectoryListing = {
        ...editingDirectory,
        category: finalCat,
        categorySlug: finalSlug,
        icon: finalIcon,
        images: finalImages,
        imageUrl: coverImage,
        updatedAt: nowIso,
      };

      // Update in Supabase listings table
      await supabase
        .from('listings')
        .update({
          title: updated.name,
          category: updated.category,
          phone: updated.phone || null,
          address: updated.address || null,
          area: updated.area || null,
          rating: typeof updated.rating === 'number' ? updated.rating : 4.8,
          images: finalImages,
        })
        .eq('id', updated.id);

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
    } catch (err: any) {
      console.error('Failed to update directory listing:', err);
    } finally {
      setIsSubmittingDir(false);
    }
  };

  const handleDeleteDirectory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the business directory?`)) return;
    try {
      await supabase.from('listings').delete().eq('id', id);
      await dbService.deleteDirectoryListing(id);
      setDirectoryListings((prev) => prev.filter((d) => d.id !== id));
      setDirSuccess(`Deleted directory listing "${name}"`);
      setTimeout(() => setDirSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to delete directory listing:', err);
    }
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
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      setArticleError('Headline title is required.');
      return;
    }

    setArticleError('');
    setArticleSuccess('');

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

      const wordCount = (newContent || trimmedTitle).trim().split(/\s+/).filter(Boolean).length;
      const computedReadTime = `${Math.max(1, Math.ceil(wordCount / 130))} min`;
      const nowIso = new Date().toISOString();
      const articleId = Date.now().toString();

      const baseSlug = trimmedTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90)
        .replace(/-+$/, '');
      const finalSlug = baseSlug || `story-${Date.now()}`;

      const safeExcerpt = newContent.trim()
        ? newContent.trim().slice(0, 200)
        : (trimmedTitle.length > 160 ? trimmedTitle.slice(0, 157) + '...' : trimmedTitle) + ' — Coimbatore hyper-local reporting.';
      const safeContent = newContent.trim() || safeExcerpt;

      const newArticle: Article = {
        id: articleId,
        title: trimmedTitle,
        slug: finalSlug,
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
        isSpotlight: isExclusive,
        is_spotlight: isExclusive,
        status: 'published',
        mediaType: mediaType,
        imageUrl: finalImageUrl,
        image: finalImageUrl,
        image_url: finalImageUrl || null,
        mediaUrl: mediaType === 'video' ? finalVideoUrl : finalImageUrl,
        videoUrl: finalVideoUrl,
        videoTitle: trimmedTitle,
        videoDuration: '03:00',
        excerpt: safeExcerpt,
        content: safeContent,
        highlightStat: isExclusive ? 'Spotlight Exclusive' : 'Breaking Story',
        commentsCount: 0,
        articleHref: `/article/${finalSlug}`,
        seoTitle: trimmedTitle.slice(0, 200),
        metaDescription: safeExcerpt.slice(0, 160),
      };

      // 1. Persist directly via universal DatabaseService to Supabase and LocalStorage
      const persisted = await dbService.createArticle(newArticle);

      // 2. Dispatch custom global events for real-time UI refresh across all viewports & tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('newsStorageUpdate'));
        window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'articles' } }));
        window.dispatchEvent(new Event('storage'));
      }

      const activeRecord = persisted || newArticle;
      setArticles((prev) => [activeRecord, ...prev.filter((a) => a.id !== activeRecord.id && a.slug !== activeRecord.slug && a.id !== articleId)]);
      setNewTitle('');
      setNewSubCategory('');
      setNewContent('');
      setMediaType('image');
      setImageUrl('');
      setImageFileName('');
      if (publishFileInputRef.current) {
        publishFileInputRef.current.value = '';
      }
      setVideoUrl('');
      setVideoFileName('');

      setArticleSuccess('✓ Published successfully! Immediate real-time sync dispatched across all PC & Mobile viewports.');
      setTimeout(() => setArticleSuccess(''), 5000);
      refreshAllData();
    } catch (err: any) {
      console.error('Publishing error:', err);
      setArticleError(err?.message || 'Failed to publish story to database. Please check title and fields.');
      setTimeout(() => setArticleError(''), 7000);
    } finally {
      setIsPublishing(false);
    }
  };

  // Article Selection Handlers
  const handleToggleArticle = (id: string) => {
    setSelectedArticleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllArticles = () => {
    const visibleIds = filteredArticles.map((a) => a.id).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedArticleIds.has(id));
    if (allSelected) {
      setSelectedArticleIds(new Set());
    } else {
      setSelectedArticleIds(new Set(visibleIds));
    }
  };

  // Bulk Delete Selected Articles
  const handleConfirmBulkDeleteArticles = async () => {
    if (selectedArticleIds.size === 0) return;
    setIsBulkDeletingArticles(true);
    setArticleError('');
    setArticleSuccess('');
    const idsToDelete = Array.from(selectedArticleIds);
    let successCount = 0;
    let failCount = 0;

    try {
      // 1. Database deletion FIRST
      try {
        await supabase.from('news').delete().in('id', idsToDelete);
      } catch (dbErr) {
        console.warn('Direct bulk Supabase delete notice:', dbErr);
      }

      for (const id of idsToDelete) {
        try {
          await dbService.deleteArticle(id);
          successCount++;
        } catch (err) {
          console.error(`Failed to delete article ${id}:`, err);
          failCount++;
        }
      }

      // 2. Update UI component React state directly from memory
      setArticles((prev) => prev.filter((a) => !selectedArticleIds.has(a.id) && (!a.slug || !selectedArticleIds.has(a.slug))));
      setSelectedArticleIds(new Set());
      setBulkArticleDeleteModalOpen(false);

      // 3. Safe LocalStorage Sync in Try-Catch
      try {
        const raw = localStorage.getItem('t_covai_articles');
        const existing = raw ? JSON.parse(raw) : null;
        const currentList = Array.isArray(existing) ? existing : articles;
        const updatedArticles = currentList.filter((a: any) => !selectedArticleIds.has(a.id) && (!a.slug || !selectedArticleIds.has(a.slug)));
        const minimalArticles = minimizeArticlesForStorage(updatedArticles);

        try {
          localStorage.setItem('admin_published_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        try {
          localStorage.setItem('t_covai_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        purgeLargeOutdatedStorageKeys();
      } catch (e) {
        console.warn('LocalStorage quota exceeded. Skipping local cache update.');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('newsStorageUpdate'));
        window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'news' } }));
        window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles' }));
      }

      if (failCount === 0) {
        setArticleSuccess(`✓ Successfully deleted ${successCount} ${successCount === 1 ? 'story' : 'stories'} permanently from the database.`);
      } else {
        setArticleSuccess(`Deleted ${successCount} stories. (${failCount} failed)`);
      }
      setTimeout(() => setArticleSuccess(''), 5000);
      refreshAllData();
    } catch (err: any) {
      console.error('Failed to bulk delete articles:', err);
      setArticleError(err.message || 'Failed to bulk delete articles from database');
      setTimeout(() => setArticleError(''), 6000);
    } finally {
      setIsBulkDeletingArticles(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story from the production database?')) return;

    setArticleError('');
    setArticleSuccess('');

    try {
      // 1. Database deletion FIRST via Supabase client & backend service
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('news').delete().eq('id', id);
        } else {
          await supabase.from('news').delete().or(`id.eq.${id},slug.eq.${id}`);
        }
      } catch (dbErr) {
        console.warn('Direct Supabase delete notice:', dbErr);
      }

      // Hard delete on Supabase 'news' table via backend service
      await dbService.deleteArticle(id);

      // 2. Update UI component React state directly from memory
      setArticles((prev) => prev.filter((a) => a.id !== id && a.slug !== id));
      setSelectedArticleIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // 3. Wrap LocalStorage Sync in Try-Catch with quota fallback
      try {
        const raw = localStorage.getItem('t_covai_articles');
        const existing = raw ? JSON.parse(raw) : null;
        const currentList = Array.isArray(existing) ? existing : articles;
        const updatedArticles = currentList.filter((a: any) => a.id !== id && a.slug !== id);
        const minimalArticles = minimizeArticlesForStorage(updatedArticles);

        try {
          localStorage.setItem('admin_published_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        try {
          localStorage.setItem('t_covai_articles', JSON.stringify(minimalArticles));
        } catch (e) {
          console.warn('LocalStorage quota exceeded. Skipping local cache update.');
        }

        purgeLargeOutdatedStorageKeys();
      } catch (e) {
        console.warn('LocalStorage quota exceeded. Skipping local cache update.');
      }

      // 4. Dispatch sync events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('newsStorageUpdate'));
        window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'news' } }));
        window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles' }));
      }

      setArticleSuccess('Article permanently deleted from Supabase database.');
      setTimeout(() => setArticleSuccess(''), 4000);
      refreshAllData();
    } catch (err: any) {
      console.error('Failed to delete article:', err);
      const errMsg = err.message || 'Failed to delete article from database';
      setArticleError(errMsg);
      alert(`Deletion Failed: ${errMsg}`);
      setTimeout(() => setArticleError(''), 6000);
    }
  };

  // Save Edited Article
  const handleSaveEditArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    const editWordCount = (editingArticle.content || editingArticle.excerpt || editingArticle.title).trim().split(/\s+/).filter(Boolean).length;
    const editReadTime = editingArticle.readTime || `${Math.max(1, Math.ceil(editWordCount / 130))} min`;
    const resolvedImg = editingArticle.imageUrl || (editingArticle as any).image || editingArticle.image_url;
    const finalImg = resolvedImg && typeof resolvedImg === 'string' && resolvedImg.trim() !== '' && resolvedImg.trim() !== 'null' && resolvedImg.trim() !== 'undefined'
      ? resolvedImg.trim()
      : undefined;

    const nowIso = new Date().toISOString();
    const updated: Article = {
      ...editingArticle,
      updatedAt: nowIso,
      createdAt: editingArticle.createdAt || nowIso,
      publishedAt: nowIso,
      isExclusive: !!(editingArticle.isExclusive || editingArticle.isSpotlight || editingArticle.is_spotlight),
      isSpotlight: !!(editingArticle.isExclusive || editingArticle.isSpotlight || editingArticle.is_spotlight),
      is_spotlight: !!(editingArticle.isExclusive || editingArticle.isSpotlight || editingArticle.is_spotlight),
      mediaType: editingArticle.mediaType === 'video' ? 'video' : 'image',
      imageUrl: editingArticle.mediaType === 'image' ? finalImg : undefined,
      image: editingArticle.mediaType === 'image' ? finalImg : undefined,
      image_url: editingArticle.mediaType === 'image' ? (finalImg || null) : null,
      mediaUrl: editingArticle.mediaType === 'video' ? (editingArticle.videoUrl || (editingArticle as any).mediaUrl) : finalImg,
      videoUrl: editingArticle.mediaType === 'video' ? editingArticle.videoUrl : undefined,
      subTag: editingArticle.subCategory || editingArticle.category,
      readTime: editReadTime,
      highlightStat: (editingArticle.isExclusive || editingArticle.isSpotlight || editingArticle.is_spotlight) ? 'Spotlight Exclusive' : (editingArticle.highlightStat || 'Breaking Story'),
    };

    // 1. Database-first update
    await dbService.updateArticle(editingArticle.id, updated);
    setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? updated : a)));
    setEditingArticle(null);

    // 2. Safe LocalStorage Sync in Try-Catch
    try {
      const raw = localStorage.getItem('t_covai_articles');
      const existing = raw ? JSON.parse(raw) : null;
      const currentList = Array.isArray(existing) ? existing : articles;
      const updatedList = currentList.map((a: any) => (a.id === updated.id ? updated : a));
      const minimalArticles = minimizeArticlesForStorage(updatedList);

      try {
        localStorage.setItem('admin_published_articles', JSON.stringify(minimalArticles));
      } catch (e) {
        console.warn('LocalStorage quota exceeded. Skipping local cache update.');
      }

      try {
        localStorage.setItem('t_covai_articles', JSON.stringify(minimalArticles));
      } catch (e) {
        console.warn('LocalStorage quota exceeded. Skipping local cache update.');
      }

      purgeLargeOutdatedStorageKeys();
    } catch (e) {
      console.warn('LocalStorage quota exceeded. Skipping local cache update.');
    }

    // 3. Dispatch events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('newsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'articles' } }));
      window.dispatchEvent(new StorageEvent('storage', { key: 't_covai_articles' }));
    }

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

  // ---------------------------------------------------------------------------
  // HANDLE SLIDE IMAGE UPLOADS (USES /api/ads/upload WITH ROBUST MULTI-TIER FALLBACKS)
  // ---------------------------------------------------------------------------
  const handleSlideImageUpload = async (file: File, slideIndex: number) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the maximum allowed size of 10MB.`);
      return;
    }

    setUploadingSlideIndex(slideIndex);
    try {
      // 1. Fast client-side compression (<50ms) to ensure lightweight <200KB upload payload
      let fileToUpload = file;
      let fastPreviewDataUrl: string | null = null;
      try {
        const comp = await compressImageFile(file, 1600, 0.85);
        fileToUpload = comp.file;
        fastPreviewDataUrl = comp.dataUrl;
      } catch (cErr) {
        console.warn('Pre-compression notice, uploading original:', cErr);
      }

      // Immediately set preview if available
      if (fastPreviewDataUrl && editingAdSlot) {
        const newSlides = [...editingAdSlot.slides];
        newSlides[slideIndex].imageUrl = fastPreviewDataUrl;
        setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('slotId', editingAdSlot?.id || 'native-ad');
      formData.append('slideIndex', String(slideIndex));

      const res = await fetch('/api/ads/upload', {
        method: 'POST',
        body: formData,
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success || !resJson.url) {
        throw new Error(resJson.error || 'Server upload failed');
      }

      // Update slide with the clean CDN uploaded URL
      if (editingAdSlot) {
        const newSlides = [...editingAdSlot.slides];
        newSlides[slideIndex].imageUrl = resJson.url;
        setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
      }
    } catch (err: any) {
      console.warn('API upload failed, attempting direct base64 fallback:', err);
      // Zero-fail client-side fallback
      try {
        const comp = await compressImageFile(file, 1600, 0.82);
        if (editingAdSlot) {
          const newSlides = [...editingAdSlot.slides];
          newSlides[slideIndex].imageUrl = comp.dataUrl;
          setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
        }
      } catch (fallbackErr) {
        alert('Failed to upload image: ' + (err?.message || 'Upload error'));
      }
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                    2. Admin CMS Dashboard Workspace                      */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#1a1a1a] font-sans antialiased">
      {/* Top Admin Navigation Header */}
      <header className="bg-[#153d3b] text-white border-b border-[#0d4d4d] sticky top-0 z-40 shadow-md">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Button (Only on Mobile) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 text-emerald-100 hover:text-white hover:bg-[#0f2e2d] active:bg-[#0d2827] rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? 'Close CMS Menu' : 'Open CMS Menu'}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="inline-flex items-center shrink-0">
              <Image
                src="/logo-dark.png"
                alt="Today's Coimbatore"
                width={180}
                height={50}
                className="h-8 sm:h-9 md:h-11 w-auto object-contain"
              />
            </Link>

            {/* Admin CMS Badge */}
            <span className="hidden xs:inline-block bg-[#0f2e2d] text-emerald-300 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded border border-[#1f5956] uppercase tracking-wider shrink-0">
              ADMIN CMS
            </span>
          </div>

          {/* User Controls & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Mobile "Publish" Button (Only on Mobile) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('articles');
                setMobileMenuOpen(false);
                setTimeout(() => {
                  const formEl = document.getElementById('publish-article-form');
                  if (formEl) {
                    formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white px-2.5 py-1.5 rounded-lg text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-all border border-emerald-400/40 shrink-0 whitespace-nowrap"
              title="Quick Publish Story"
            >
              <span className="text-sm leading-none font-bold">✍️</span>
              <span className="font-bold text-[11px] sm:text-xs">Publish</span>
            </button>

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

            {/* Logout Button (never wraps) */}
            <button
              onClick={handleLogout}
              className="bg-[#0f2e2d] hover:bg-red-900/80 text-stone-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border border-[#1f5956] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="whitespace-nowrap">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Navigation Drawer (Only on Mobile) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="p-4 bg-[#153d3b] text-white flex items-center justify-between border-b border-[#0d4d4d] shrink-0">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-dark.png"
              alt="Today's Coimbatore"
              width={140}
              height={38}
              className="h-8 w-auto object-contain"
            />
            <span className="bg-[#0f2e2d] text-emerald-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-[#1f5956] uppercase">
              CMS
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-[#0f2e2d] active:bg-[#0d2827] cursor-pointer"
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Prominent Quick "Publish Story" CTA inside drawer */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('articles');
              setMobileMenuOpen(false);
              setTimeout(() => {
                const formEl = document.getElementById('publish-article-form');
                if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white px-3.5 py-3 rounded-xl font-black text-xs sm:text-sm shadow-sm flex items-center justify-between gap-2 cursor-pointer transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">✍️</span>
              <span>Publish New Story</span>
            </span>
            <span className="text-[10px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Quick Post
            </span>
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-2 py-1 mb-1">
              CMS Modules
            </div>
            
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('supabase');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeTab === 'supabase'
                    ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500 font-black'
                    : 'text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
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

              <Link
                href="/admin/review"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs group"
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
                onClick={() => {
                  setActiveTab('articles');
                  setMobileMenuOpen(false);
                }}
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
                onClick={() => {
                  setActiveTab('outages');
                  setMobileMenuOpen(false);
                }}
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
                onClick={() => {
                  setActiveTab('ads');
                  setMobileMenuOpen(false);
                }}
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
                onClick={() => {
                  setActiveTab('blood');
                  setMobileMenuOpen(false);
                }}
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
                onClick={() => {
                  setActiveTab('events');
                  setMobileMenuOpen(false);
                }}
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
                onClick={() => {
                  setActiveTab('directory');
                  setMobileMenuOpen(false);
                }}
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
                onClick={() => {
                  setActiveTab('verifications');
                  setMobileMenuOpen(false);
                }}
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

              <Link
                href="/admin/widgets"
                onClick={() => setMobileMenuOpen(false)}
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
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-2 py-1 mb-1">
              Admin Shortcuts
            </div>
            <div className="space-y-1">
              <Link
                href="/admin/contact-enquiries"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium text-stone-700 hover:bg-[#f3ede2] hover:text-[#153d3b] transition-all"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0">✉️</span>
                  <span className="whitespace-nowrap truncate">Contact Enquiries</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {unreadEnquiriesCount > 0 ? (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap bg-rose-500 text-white shadow-2xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {unreadEnquiriesCount} New
                    </span>
                  ) : totalActiveEnquiriesCount > 0 ? (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap bg-stone-100 text-stone-600">
                      {totalActiveEnquiriesCount}
                    </span>
                  ) : null}
                  <span className="text-stone-400 text-xs">&rarr;</span>
                </div>
              </Link>

              <Link
                href="/admin/about-us"
                onClick={() => setMobileMenuOpen(false)}
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
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 shrink-0 flex items-center justify-between text-xs font-bold">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-stone-600 hover:text-emerald-700 flex items-center gap-1 py-1"
          >
            <span>&larr;</span>
            <span>Public Site</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 flex items-center gap-1 py-1 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: 2-Column Sidebar + Dynamic Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)]">
        
        {/* 1. Left Vertical Sidebar Navigation (Hidden on Mobile, Permanent on Desktop) */}
        <aside className="hidden lg:block w-80 bg-white border-r border-stone-200 p-4 space-y-4 shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:overflow-y-auto shadow-2xs">
          
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
                  {unreadEnquiriesCount > 0 ? (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap bg-rose-500 text-white shadow-2xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {unreadEnquiriesCount} New
                    </span>
                  ) : totalActiveEnquiriesCount > 0 ? (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap bg-stone-100 text-stone-600">
                      {totalActiveEnquiriesCount}
                    </span>
                  ) : null}
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
        <main className="flex-1 p-3.5 sm:p-4 md:p-6 lg:p-8 min-w-0 space-y-4 sm:space-y-6 overflow-y-auto">
          
          {/* Mobile Top Context & Fast Module Switcher (Only on Mobile) */}
          <div className="lg:hidden bg-white border border-stone-200 rounded-2xl p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 shrink-0">Managing:</span>
                <span className="text-xs sm:text-sm font-black text-[#153d3b] truncate">
                  {activeTab === 'supabase' && '⚡ Supabase SQL Studio'}
                  {activeTab === 'articles' && `📰 Stories & Articles (${articles.length})`}
                  {activeTab === 'outages' && `⚡ Power Outages (${outages.length})`}
                  {activeTab === 'ads' && `📢 Native Ads (${ads.length})`}
                  {activeTab === 'blood' && `🩸 Blood Donors (${donors.length})`}
                  {activeTab === 'events' && `📅 Events & Expos (${events.length})`}
                  {activeTab === 'directory' && `📁 Directory (${directoryListings.length})`}
                  {activeTab === 'verifications' && `🔑 Verifications (${verificationsList.length})`}
                  {activeTab === 'reviews' && `★ Reviews (${reviewsList.length})`}
                  {activeTab === 'explorer' && '🧭 DB Explorer'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1.5 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
              >
                <span>☰ Modules</span>
              </button>
            </div>

            {/* Fast 1-Tap Horizontal Module Switching Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs -mx-1 px-1">
              {[
                { id: 'articles', label: '📰 Stories', count: articles.length },
                { id: 'supabase', label: '⚡ Studio' },
                { id: 'outages', label: '⚡ Outages', count: outages.length },
                { id: 'ads', label: '📢 Ads', count: ads.length },
                { id: 'blood', label: '🩸 Blood', count: donors.length },
                { id: 'events', label: '📅 Events', count: events.length },
                { id: 'directory', label: '📁 Directory', count: directoryListings.length },
                { id: 'verifications', label: '🔑 Verifications', count: verificationsList.length },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#153d3b] text-white shadow-xs font-black'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === item.id ? 'bg-white/20 text-white font-black' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* If on articles tab, provide a prominent quick Jump button */}
            {activeTab === 'articles' && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const formEl = document.getElementById('publish-article-form');
                    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span>✍️ Jump to Publish Form</span>
                  <span>&darr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const listEl = document.getElementById('stories-table-view');
                    if (listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-800 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>View Stories ({articles.length})</span>
                  <span>&darr;</span>
                </button>
              </div>
            )}
          </div>

          {/* Top Summary Metric Cards (Compact single-row / responsive grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
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

          {/* Covai Pulse Daily Poll Analytics Live Card */}
          <PollAnalytics />

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
            <div id="publish-article-form" className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs scroll-mt-20">
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

              {articleError && (
                <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-bold p-3 rounded-xl mb-4 animate-in fade-in">
                  {articleError}
                </div>
              )}

              <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px]">
                      Headline Title *
                    </label>
                    <span className="text-[10px] text-stone-500 font-semibold">
                      {newTitle.trim() ? `${newTitle.trim().split(/\s+/).filter(Boolean).length} words • ${newTitle.length} chars` : 'Full news headline'}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Coimbatore Western Bypass Phase-2 tenders opened with ₹1,200 crore budget allocation across major junctions..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleCreateArticle(e as any);
                      }
                    }}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3.5 py-2.5 text-[#1a1a1a] font-semibold text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#153d3b] resize-y min-h-[76px] transition-all placeholder:text-stone-400"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Auto-wrapping headline box fits any title length comfortably. Press Ctrl+Enter to publish quickly.
                  </p>
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
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="TECH">TECH</option>
                      <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                      <option value="CEO">CEO</option>
                      <option value="SPORTS">SPORTS</option>
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
                          ref={publishFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileChange(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <p className="text-xs font-bold text-stone-800">
                          Drag &amp; drop photo here, or <span className="text-[#e54b3c] underline">Browse files</span>
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1 font-medium">
                          Supported: PNG, JPG, JPEG, WEBP, AVIF (Max Size: 5MB per image)
                        </p>
                      </div>

                      {imageUrl && (
                        <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-900 group">
                          <img 
                            src={imageUrl} 
                            alt="Preview" 
                            className="h-48 w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePublishImage}
                            className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
                          >
                            Remove Photo
                          </button>
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
                  <label htmlFor="exclusiveCheck" className="font-bold text-stone-700 cursor-pointer">
                    ★ Pin to Breaking Spotlight / Hero Carousel
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
            <div id="stories-table-view" className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col space-y-4 scroll-mt-20">
              
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

              {/* Responsive Horizontal Category Filter Bar */}
              <div className="relative flex items-center w-full border-b border-stone-200 pb-1 pt-0.5">
                {/* Left Scroll Button (Desktop) */}
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  aria-label="Scroll categories left"
                  className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-xs border border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900 shrink-0 mr-1.5 cursor-pointer transition-colors z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Filter bar container */}
                <div
                  ref={categoryScrollRef}
                  className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth py-1 px-1 max-w-full flex-1"
                >
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
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
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

                {/* Right Scroll Button (Desktop) */}
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  aria-label="Scroll categories right"
                  className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-xs border border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900 shrink-0 ml-1.5 cursor-pointer transition-colors z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Strict Dynamic List Filtering */}
              <div className="space-y-3 pt-1">
                {articleSuccess && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl animate-in fade-in">
                    {articleSuccess}
                  </div>
                )}
                {articleError && (
                  <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-bold p-3 rounded-xl animate-in fade-in">
                    {articleError}
                  </div>
                )}
                {/* Multi-Selection / Bulk Action Bar */}
                {filteredArticles.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 bg-stone-100 border border-stone-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2.5">
                      <label className="flex items-center gap-2 font-bold text-stone-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={
                            filteredArticles.length > 0 &&
                            filteredArticles.every((item) => selectedArticleIds.has(item.id))
                          }
                          onChange={handleToggleSelectAllArticles}
                          className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                        />
                        <span>
                          Select All{' '}
                          <span className="text-stone-400 font-normal">({filteredArticles.length})</span>
                        </span>
                      </label>

                      {selectedArticleIds.size > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-200">
                          {selectedArticleIds.size} selected
                        </span>
                      )}
                    </div>

                    {selectedArticleIds.size > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedArticleIds(new Set())}
                          className="px-2.5 py-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 cursor-pointer rounded hover:bg-stone-200/60 transition-colors"
                        >
                          Deselect All
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkArticleDeleteModalOpen(true)}
                          disabled={isBulkDeletingArticles}
                          className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <span>🗑️</span>
                          <span>Delete Selected ({selectedArticleIds.size})</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {filteredArticles.length > 0 ? (
                  filteredArticles.map((item) => {
                    const hasVideo = Boolean(item.videoUrl && item.videoUrl.trim() !== '');
                    const hasImage = Boolean((item.imageUrl && item.imageUrl.trim() !== '') || ((item as any).image && (item as any).image.trim() !== ''));
                    const isSelected = selectedArticleIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border gap-3 transition-colors ${
                          isSelected
                            ? 'bg-red-50/60 border-red-300 shadow-2xs'
                            : 'bg-[#fcfbf7] border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="pt-0.5 sm:pt-0 shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleArticle(item.id)}
                              aria-label={`Select article: ${item.title}`}
                              className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                            />
                          </div>

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
                              By {item.author || 'Editorial Bureau'}
                            </div>
                          </div>
                        </div>

                        {/* Explicit Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 disabled:opacity-75 cursor-pointer active:scale-95 shrink-0"
                >
                  {isAutoSyncing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      <span>Extracting with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      <span>Auto-Sync TNEB Outages (Gemini AI Extraction)</span>
                    </>
                  )}
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
                <h2 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>📢</span>
                  <span>Native Advertisement Engine &amp; Banner Management</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage live campaigns for <strong>Left &amp; Right Sticky Sidebars (210×400)</strong>, Top Header Leaderboard, and In-Feed slots. Upload creatives, assign click links, and toggle active status.
                </p>
              </div>

              {adSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg animate-in fade-in">
                  {adSuccess}
                </span>
              )}
            </div>

            {(() => {
              const isLeftSidebar = (ad: AdSlotSetting) =>
                ad.slotId === 'LEFT_SIDEBAR_BANNER' ||
                ad.slotId === 'LEFT_STICKY_SIDEBAR_BANNER' ||
                ad.placementKey === 'LEFT_SIDEBAR_BANNER' ||
                ad.placementKey === 'LEFT_STICKY_SIDEBAR_BANNER' ||
                ad.placementKey === 'left_sidebar' ||
                ad.id === 'ad-slot-left' ||
                (Boolean(ad.format) && ad.format.toLowerCase().includes('left') && ad.format.toLowerCase().includes('sidebar'));

              const isRightSidebar = (ad: AdSlotSetting) =>
                ad.slotId === 'RIGHT_SIDEBAR_BANNER' ||
                ad.slotId === 'RIGHT_STICKY_SIDEBAR_BANNER' ||
                ad.placementKey === 'RIGHT_SIDEBAR_BANNER' ||
                ad.placementKey === 'RIGHT_STICKY_SIDEBAR_BANNER' ||
                ad.placementKey === 'right_sidebar' ||
                ad.id === 'ad-slot-right' ||
                (Boolean(ad.format) && ad.format.toLowerCase().includes('right') && ad.format.toLowerCase().includes('sidebar'));

              const isTopHeader = (ad: AdSlotSetting) =>
                ad.slotId === 'TOP_HEADER_LEADERBOARD' ||
                ad.slotId === 'TOP_HEADER_BANNER' ||
                ad.placementKey === 'TOP_HEADER_LEADERBOARD' ||
                ad.placementKey === 'TOP_HEADER_BANNER' ||
                ad.placementKey === 'top_banner' ||
                ad.id === 'ad-slot-1' ||
                (Boolean(ad.format) && (ad.format.toLowerCase().includes('top header') || ad.format.toLowerCase().includes('leaderboard')));

              // Partition into structured rows
              const verticalSidebarAds = ads.filter((ad) => isLeftSidebar(ad) || isRightSidebar(ad));
              verticalSidebarAds.sort((a, b) => {
                if (isLeftSidebar(a) && !isLeftSidebar(b)) return -1;
                if (!isLeftSidebar(a) && isLeftSidebar(b)) return 1;
                return 0;
              });

              const topHeaderAds = ads.filter(isTopHeader);
              const inFeedAndArticleAds = ads.filter(
                (ad) => !isLeftSidebar(ad) && !isRightSidebar(ad) && !isTopHeader(ad)
              );

              const renderAdCard = (ad: AdSlotSetting) => {
                const scheduleStatus = getAdScheduleStatus(ad);
                const legacyAd = ad as any;
                const mediaPreview = ad.slides?.[0]?.imageUrl || legacyAd.bannerUrl || legacyAd.imageUrl;
                const isSidebarAd =
                  isLeftSidebar(ad) ||
                  isRightSidebar(ad) ||
                  ad.orientation === 'vertical' ||
                  ad.dimensions === '210x400';
                const isHeaderAd = isTopHeader(ad);

                return (
                  <div
                    key={ad.id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-2xs transition-all ${
                      isSidebarAd
                        ? 'border-red-200 bg-red-50/20 dark:bg-slate-900'
                        : isHeaderAd
                        ? 'border-blue-200 bg-blue-50/20 dark:bg-slate-900'
                        : 'border-stone-200 bg-[#fcfbf7]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <span className="text-[#153d3b] uppercase tracking-wider text-[11px] font-black flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSidebarAd ? 'bg-red-600' : isHeaderAd ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          />
                          {ad.format}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${scheduleStatus.badgeClass}`}
                        >
                          {scheduleStatus.label}
                        </span>
                      </div>

                      {/* Dimension and Placement Tag */}
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        {isSidebarAd ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider border border-red-200">
                            📐 210 × 400 Vertical Canvas (Homepage Rail)
                          </span>
                        ) : isHeaderAd ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                            📐 728 × 90 / Full-Bleed Leaderboard
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-black uppercase tracking-wider border border-stone-200">
                            📐 Fluid In-Feed Creative
                          </span>
                        )}
                      </div>

                      {/* Creative Thumbnail Preview */}
                      {mediaPreview &&
                        (isSidebarAd ? (
                          <div className="my-3 flex flex-col items-center justify-center p-3 rounded-xl bg-stone-100/90 border border-stone-200">
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider mb-2">
                              Sidebar Rail Preview (210 × 400 Match)
                            </span>
                            <div className="w-[210px] h-[400px] overflow-hidden rounded-lg mx-auto border border-stone-300 bg-slate-900 relative group shadow-sm shrink-0">
                              <img
                                src={mediaPreview}
                                alt={ad.slides?.[0]?.title || legacyAd.title}
                                className="w-full h-full object-cover object-center"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-2.5 py-1 bg-black/70 rounded-lg backdrop-blur-xs">
                                  Live Ad Creative
                                </span>
                              </div>
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono uppercase font-bold">
                                {ad.slotId || ad.placementKey}
                              </span>
                            </div>
                          </div>
                        ) : isHeaderAd ? (
                          <div className="mb-3 w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-blue-200 bg-slate-900 relative group">
                            <img
                              src={mediaPreview}
                              alt={ad.slides?.[0]?.title || legacyAd.title}
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold px-2.5 py-1 bg-black/70 rounded-lg backdrop-blur-xs">
                                Live Header Creative
                              </span>
                            </div>
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono uppercase font-bold">
                              {ad.slotId || ad.placementKey}
                            </span>
                          </div>
                        ) : (
                          <div className="mb-3 w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-stone-300 bg-slate-900 relative group">
                            <img
                              src={mediaPreview}
                              alt={ad.slides?.[0]?.title || legacyAd.title}
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold px-2.5 py-1 bg-black/70 rounded-lg backdrop-blur-xs">
                                Live Ad Creative
                              </span>
                            </div>
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono uppercase font-bold">
                              {ad.slotId || ad.placementKey}
                            </span>
                          </div>
                        ))}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#1a1a1a] line-clamp-2 leading-snug">
                            {ad.slides?.[0]?.title || legacyAd.title || 'No Slides Available'}
                          </h4>
                          {(ad.slides?.[0]?.description || legacyAd.description) && (
                            <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                              {ad.slides?.[0]?.description || legacyAd.description}
                            </p>
                          )}
                          <p className="text-xs text-stone-500 mt-1">
                            Sponsor / Advertiser:{' '}
                            <strong className="text-stone-800">
                              {ad.slides?.[0]?.advertiser || legacyAd.advertiser || 'N/A'}
                            </strong>
                          </p>
                          <p className="text-xs text-stone-500 mt-1 font-bold">
                            Total Slides: {ad.slides?.length || 0} / 10
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const legacyAd = ad as any;
                            const slides = ad.slides?.length
                              ? ad.slides
                              : [
                                  {
                                    id: `legacy-${Date.now()}`,
                                    title: legacyAd.title || '',
                                    advertiser: legacyAd.advertiser || '',
                                    description: legacyAd.description || '',
                                    imageUrl: legacyAd.imageUrl || legacyAd.bannerUrl || '',
                                    active: true,
                                  },
                                ];
                            setEditingAdSlot({ ...ad, slides });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                          title="Edit Ad Creative, Image & Link"
                        >
                          <span>✏️</span>
                          <span>Edit Creative</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-stone-600 my-3 p-2 rounded-xl bg-white border border-stone-200">
                        <span>
                          👁️ <strong>{ad.impressions}</strong> Impr
                        </span>
                        <span>
                          🎯 <strong>{ad.ctr}</strong> CTR
                        </span>
                        <span className="text-emerald-700 font-bold ml-auto truncate">
                          Serving: {scheduleStatus.serving}
                        </span>
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
              };

              return (
                <div className="space-y-8">
                  {/* ROW 1: VERTICAL SIDEBAR RAILS (SIDE-BY-SIDE 210x400) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider border border-red-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          Row 1: Sticky Sidebar Rails (Vertical 210 × 400)
                        </span>
                        <span className="text-xs text-stone-500 hidden sm:inline">
                          Primary Homepage &amp; Inner-Page Desktop Rails
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-stone-400">
                        {verticalSidebarAds.length} Slots
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {verticalSidebarAds.map(renderAdCard)}
                    </div>
                  </div>

                  {/* ROW 2: TOP HEADER LEADERBOARD BANNER (FULL WIDTH) */}
                  {topHeaderAds.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider border border-blue-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            Row 2: Top Header Leaderboard Banner
                          </span>
                          <span className="text-xs text-stone-500 hidden sm:inline">
                            Full-Bleed Responsive Header Placement
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-stone-400">
                          {topHeaderAds.length} Slots
                        </span>
                      </div>
                      <div className="w-full">
                        {topHeaderAds.map(renderAdCard)}
                      </div>
                    </div>
                  )}

                  {/* ROW 3 & BELOW: IN-FEED & ARTICLE AD SLOTS */}
                  {inFeedAndArticleAds.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 text-xs font-black uppercase tracking-wider border border-stone-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            Row 3 &amp; Below: In-Feed &amp; Article Ad Placements
                          </span>
                          <span className="text-xs text-stone-500 hidden sm:inline">
                            Between News Stories, Sections &amp; Article Details
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-stone-400">
                          {inFeedAndArticleAds.length} Slots
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {inFeedAndArticleAds.map(renderAdCard)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => {
                  return (
                    <div
                      key={ev.id}
                      className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full justify-between hover:border-[#153d3b] transition-all"
                    >
                      <div>
                        {/* Media Preview (Conditional Video or Poster) */}
                        <div className="relative w-full aspect-[16/9] bg-slate-900/90 overflow-hidden rounded-t-xl flex items-center justify-center group">
                          {ev.posterUrl && !ev.posterUrl.includes('photo-1511578314322-379afb476865') ? (
                            <>
                              <img
                                src={ev.posterUrl}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
                              />
                              <img
                                src={ev.posterUrl}
                                alt={ev.title}
                                className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-1"
                              />
                            </>
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
              {isDirLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`dir-skeleton-${i}`}
                    className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between animate-pulse space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="h-36 w-full rounded-xl bg-stone-200" />
                      <div className="h-4 w-3/4 bg-stone-200 rounded" />
                      <div className="h-3 w-1/2 bg-stone-200 rounded" />
                      <div className="h-3 w-full bg-stone-200 rounded" />
                    </div>
                    <div className="pt-3 border-t border-stone-200 h-8 bg-stone-100 rounded" />
                  </div>
                ))
              ) : (
                (() => {
                  const filtered = directoryListings.filter((item) => {
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
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-xs">
                        <div className="text-4xl mb-3">📂</div>
                        <h4 className="text-base font-black text-stone-800">No Business Listings Found</h4>
                        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                          {dirSearchQuery || dirCategoryFilter !== 'ALL'
                            ? 'No listings match your current search or category filter. Try clearing filters.'
                            : 'There are no listings in the Supabase database yet. Click "+ Add Business Listing" above to publish your first verified business.'}
                        </p>
                      </div>
                    );
                  }

                  return filtered.map((listing) => (
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
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase shadow-xs max-w-[70%] truncate">
                            {listing.category}
                          </span>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-black max-w-[50%] truncate">
                            📍 {listing.area}
                          </span>
                        </div>

                        {/* Header Info */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1 gap-2">
                            <span className="font-extrabold text-amber-500 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                              <span>⭐</span>
                              <span className="text-stone-900 font-black">{listing.rating ? Number(listing.rating).toFixed(1) : '4.8'}</span>
                              <span className="text-amber-800 font-bold text-[10px] uppercase tracking-tight">Rating</span>
                            </span>
                            <span className="text-[11px] font-bold text-stone-500 truncate text-right">{listing.area}</span>
                          </div>

                          <h3 className="text-sm font-black text-stone-900 leading-snug line-clamp-1 break-words">
                            {listing.name}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed break-words">
                          {listing.description}
                        </p>

                        <div className="pt-2 border-t border-stone-100 text-[11px] space-y-1 text-stone-600">
                          {listing.ownerName && (
                            <p className="truncate text-stone-800 font-bold flex items-center gap-1">
                              <span>👤</span>
                              <span className="truncate">Owner: {listing.ownerName}</span>
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
                            onClick={() => {
                              setEditingDirectory(listing);
                              const rawImgs = (Array.isArray(listing.images) && listing.images.length > 0)
                                ? listing.images
                                : (listing.imageUrl ? [listing.imageUrl] : []);
                              setEditingDirImageSlots(
                                rawImgs.slice(0, 5).map((url, idx) => ({
                                  id: `slot-${idx}-${url}`,
                                  type: 'url',
                                  previewUrl: url,
                                  urlValue: url,
                                }))
                              );
                            }}
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
                  ));
                })()
              )}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-700 uppercase text-[10px]">Headline Title *</label>
                  <span className="text-[10px] text-stone-500 font-semibold">
                    {editingArticle.title ? `${editingArticle.title.trim().split(/\s+/).filter(Boolean).length} words` : ''}
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold leading-relaxed resize-y min-h-[72px]"
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
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="TECH">TECH</option>
                    <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                    <option value="CEO">CEO</option>
                    <option value="SPORTS">SPORTS</option>
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
                    <div className="relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer bg-white border-stone-300 hover:border-stone-400">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 12 * 1024 * 1024) {
                              alert(`File "${file.name}" exceeds the maximum allowed size of 12MB.`);
                              return;
                            }
                            if (file.type.startsWith('image/')) {
                              try {
                                // 1. Instant client-side compression (<50ms) for snappy preview
                                const comp = await compressImageFile(file, 1600, 0.82);
                                setEditingArticle({ ...editingArticle, imageUrl: comp.dataUrl, image: comp.dataUrl, mediaUrl: comp.dataUrl, image_url: comp.dataUrl });

                                // 2. Fast background upload to Supabase Storage CDN
                                uploadImageWithFallback(file, 'news').then((cdnUrl) => {
                                  if (cdnUrl) {
                                    setEditingArticle((prev) => (prev ? { ...prev, imageUrl: cdnUrl, image: cdnUrl, mediaUrl: cdnUrl, image_url: cdnUrl } : null));
                                  }
                                }).catch((uploadErr) => {
                                  console.warn('Background edit article image upload notice:', uploadErr);
                                });
                              } catch {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setEditingArticle({ ...editingArticle, imageUrl: ev.target.result as string, image: ev.target.result as string, mediaUrl: ev.target.result as string, image_url: ev.target.result as string });
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
                        Upload new photo, or <span className="text-[#e54b3c] underline">Browse files</span>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 font-medium">
                        Supported: PNG, JPG, JPEG, WEBP, AVIF (Max Size: 12MB per image)
                      </p>
                    </div>

                    <label className="block font-bold text-stone-700 uppercase text-[10px]">Or Image URL / Data URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or data:image/..."
                      value={editingArticle.imageUrl || (editingArticle as any).image || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, imageUrl: e.target.value, image: e.target.value, mediaUrl: e.target.value, image_url: e.target.value || null })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                    {(editingArticle.imageUrl || (editingArticle as any).image || editingArticle.image_url) && (
                      <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-900 group">
                        <img
                          src={editingArticle.imageUrl || (editingArticle as any).image || editingArticle.image_url || ''}
                          alt="Preview"
                          className="h-48 w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveEditImage}
                          className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
                        >
                          Remove Photo
                        </button>
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
                    onChange={(e) => setEditingArticle({
                      ...editingArticle,
                      isExclusive: e.target.checked,
                      isSpotlight: e.target.checked,
                      is_spotlight: e.target.checked,
                    })}
                    className="w-4 h-4 text-red-600 rounded cursor-pointer accent-red-600"
                  />
                  <span className="font-bold text-xs text-stone-800">
                    ★ Pin to Breaking Spotlight / Hero Carousel
                  </span>
                </label>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  {editingArticle.isExclusive || editingArticle.isSpotlight ? 'Spotlight Carousel Active' : 'Standard Feed'}
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
      {/* 5. BULK ARTICLE DELETE CONFIRMATION MODAL                            */}
      {/* -------------------------------------------------------------------- */}
      {bulkArticleDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-black text-stone-900 text-center mb-2">
              Delete {selectedArticleIds.size} {selectedArticleIds.size === 1 ? 'Story' : 'Stories'}?
            </h3>
            <p className="text-sm text-stone-600 text-center mb-6 leading-relaxed">
              Are you sure you want to permanently delete these <span className="font-bold text-stone-900">{selectedArticleIds.size}</span> selected stories from the Supabase production database? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBulkArticleDeleteModalOpen(false)}
                disabled={isBulkDeletingArticles}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDeleteArticles}
                disabled={isBulkDeletingArticles}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {isBulkDeletingArticles ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  `Delete (${selectedArticleIds.size})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. EDIT AD SLOT CREATIVE & LINK MODAL                                */}
      {/* -------------------------------------------------------------------- */}
      {editingAdSlot && (() => {
        const isEditingSidebarAd =
          editingAdSlot.slotId === 'LEFT_SIDEBAR_BANNER' ||
          editingAdSlot.slotId === 'RIGHT_SIDEBAR_BANNER' ||
          editingAdSlot.placementKey === 'LEFT_SIDEBAR_BANNER' ||
          editingAdSlot.placementKey === 'RIGHT_SIDEBAR_BANNER' ||
          editingAdSlot.placementKey === 'left_sidebar' ||
          editingAdSlot.placementKey === 'right_sidebar' ||
          editingAdSlot.orientation === 'vertical' ||
          editingAdSlot.dimensions === '210x400';

        return (
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
                  <p className="text-[11px] text-stone-500 font-bold mt-0.5">
                    {isEditingSidebarAd
                      ? '📐 210 × 400 VERTICAL CANVAS (HOMEPAGE RAIL)'
                      : editingAdSlot.slotId === 'TOP_HEADER_LEADERBOARD'
                      ? '📐 728 × 90 / EXPANDED HORIZONTAL LEADERBOARD'
                      : '📐 FLUID IN-FEED CREATIVE'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAdSlot(null)}
                  className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAdCreative} className="space-y-3.5">
                {editingAdSlot.slides?.map((slide, index) => (
                  <div key={slide.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-black text-stone-700 uppercase tracking-wider">
                        Slide {index + 1}
                      </h4>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slide.active}
                            onChange={(e) => {
                              const newSlides = [...editingAdSlot.slides];
                              newSlides[index].active = e.target.checked;
                              setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                            }}
                            className="w-3.5 h-3.5 accent-red-600 rounded"
                          />
                          <span className="text-[10px] font-bold text-stone-600 uppercase">Active</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newSlides = editingAdSlot.slides.filter((_, i) => i !== index);
                            setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                          }}
                          className="text-red-600 hover:text-red-800 text-[10px] font-bold uppercase"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Ad Headline / Campaign Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={slide.title}
                        onChange={(e) => {
                          const newSlides = [...editingAdSlot.slides];
                          newSlides[index].title = e.target.value;
                          setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                        }}
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
                        value={slide.advertiser}
                        onChange={(e) => {
                          const newSlides = [...editingAdSlot.slides];
                          newSlides[index].advertiser = e.target.value;
                          setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                        }}
                        className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Supporting Marketing Copy / Description
                      </label>
                      <textarea
                        rows={2}
                        value={slide.description || ''}
                        onChange={(e) => {
                          const newSlides = [...editingAdSlot.slides];
                          newSlides[index].description = e.target.value;
                          setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                        }}
                        className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Destination Link / Click URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://example.com or /enquiry"
                        value={slide.ctaUrl || ''}
                        onChange={(e) => {
                          const newSlides = [...editingAdSlot.slides];
                          newSlides[index].ctaUrl = e.target.value;
                          setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                        }}
                        className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-[#f8f6f0] border border-stone-300 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="block text-xs font-bold text-stone-700 uppercase">
                          Ad Creative Media (Image Upload or URL) *
                        </label>
                        {isEditingSidebarAd && (
                          <span className="text-[10px] font-black text-red-700 uppercase bg-red-100 px-2 py-0.5 rounded border border-red-200">
                            📐 Required: 210 × 400 Vertical
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="relative w-full sm:w-1/2">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSlideImageUpload(file, index);
                              e.target.value = '';
                            }}
                            disabled={uploadingSlideIndex === index}
                            className="w-full bg-white border border-stone-300 rounded-xl px-2 py-1 text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer disabled:opacity-50"
                          />
                          {uploadingSlideIndex === index && (
                            <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center text-[10px] font-bold text-emerald-800 animate-pulse border border-emerald-300">
                              <span>⏳ Uploading...</span>
                            </div>
                          )}
                        </div>
                        <div className="w-full sm:w-1/2">
                          <input
                            type="text"
                            required
                            placeholder="Or Paste https:// URL..."
                            value={slide.imageUrl || ''}
                            onChange={(e) => {
                              const newSlides = [...editingAdSlot.slides];
                              newSlides[index].imageUrl = e.target.value;
                              setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Supported: PNG, JPG, JPEG, WEBP, AVIF, GIF (Max Size: 10MB per image)
                      </p>
                      {slide.imageUrl && (
                        <div className="mt-2 flex flex-col items-center justify-center p-3 bg-stone-100/90 rounded-xl border border-stone-200 space-y-2">
                          <div className="w-full flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                              {isEditingSidebarAd ? 'Preview (210 × 400 Vertical Rail Scale)' : 'Creative Preview'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSlides = [...editingAdSlot.slides];
                                newSlides[index].imageUrl = '';
                                setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                              }}
                              className="px-2.5 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-[10px] uppercase transition-colors flex items-center gap-1 cursor-pointer border border-red-200 shadow-2xs"
                              title="Remove this creative image"
                            >
                              <span>🗑️</span>
                              <span>Remove Image</span>
                            </button>
                          </div>
                          <div
                            className={`relative rounded-lg overflow-hidden border border-stone-300 bg-slate-900 ${
                              isEditingSidebarAd ? 'w-[210px] h-[400px] mx-auto shadow-sm' : 'w-full h-28'
                            }`}
                          >
                            <img
                              src={slide.imageUrl}
                              alt="Ad Preview"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {editingAdSlot.slides?.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newSlides = [
                        ...(editingAdSlot.slides || []),
                        {
                          id: `slide-${Date.now()}`,
                          title: '',
                          advertiser: '',
                          description: '',
                          imageUrl: '',
                          active: true,
                          ctaUrl: '/enquiry',
                        }
                      ];
                      setEditingAdSlot({ ...editingAdSlot, slides: newSlides });
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 font-bold text-[11px] uppercase tracking-wider hover:bg-stone-50 hover:border-stone-400 transition-colors"
                  >
                    + Add Slide ({10 - (editingAdSlot.slides?.length || 0)} remaining)
                  </button>
                )}

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
        );
      })()}

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

              {/* Enhanced All-Format Poster Image Upload & Validation */}
              <div className="space-y-2 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  Event Poster Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif, image/svg+xml, image/bmp"
                    onChange={(e) => handleEventImageFileChange(e, false)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#153d3b] file:text-white hover:file:bg-[#0d4d4d] cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase shrink-0">Or Image URL:</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or CDN link"
                      value={newEventPosterUrl}
                      onChange={(e) => setNewEventPosterUrl(e.target.value)}
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono text-stone-900"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Supported: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP (Max Size: 10MB per Image)
                  </p>
                  {newEventPosterUrl && (
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-stone-300 bg-stone-100 shadow-xs">
                      <img src={newEventPosterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewEventPosterUrl('')}
                        className="absolute top-1 right-1 bg-black/75 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
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
                  disabled={isSubmittingEvent}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className={`px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    isSubmittingEvent ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  {isSubmittingEvent ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing Event Live...</span>
                    </>
                  ) : (
                    <span>Publish Event Live</span>
                  )}
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

              {/* Enhanced All-Format Poster Image Upload & Validation */}
              <div className="space-y-2 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  Event Poster Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif, image/svg+xml, image/bmp"
                    onChange={(e) => handleEventImageFileChange(e, true)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#153d3b] file:text-white hover:file:bg-[#0d4d4d] cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase shrink-0">Or Image URL:</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or CDN link"
                      value={editingEvent.posterUrl || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, posterUrl: e.target.value })}
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono text-stone-900"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Supported: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP (Max Size: 10MB per Image)
                  </p>
                  {editingEvent.posterUrl && (
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-stone-300 bg-stone-100 shadow-xs">
                      <img src={editingEvent.posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingEvent({ ...editingEvent, posterUrl: '' })}
                        className="absolute top-1 right-1 bg-black/75 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={editingEvent.mapLink || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, mapLink: e.target.value })}
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
                  disabled={isSubmittingEvent}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className={`px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    isSubmittingEvent ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  {isSubmittingEvent ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Event Changes</span>
                  )}
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

              <DirectoryImageManager
                key="add-dir-images"
                initialImages={[]}
                onChange={setNewDirImageSlots}
                listingId="new"
                disabled={isSubmittingDir}
              />

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
                  disabled={isSubmittingDir}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDir}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingDir ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Listing</span>
                  )}
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

              <DirectoryImageManager
                key={`edit-dir-images-${editingDirectory.id}`}
                initialImages={
                  (Array.isArray(editingDirectory.images) && editingDirectory.images.length > 0)
                    ? editingDirectory.images
                    : (editingDirectory.imageUrl ? [editingDirectory.imageUrl] : [])
                }
                onChange={setEditingDirImageSlots}
                listingId={editingDirectory.id}
                disabled={isSubmittingDir}
              />

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
                  disabled={isSubmittingDir}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDir}
                  className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingDir ? (
                    <>
                      <span className="inline-block animate-spin">⏳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Directory Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
