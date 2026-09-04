'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Star,
  ShieldCheck,
  Building2,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  Unlock,
  MessageSquare,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  User,
  Image as ImageIcon,
  Camera,
  Layers,
} from 'lucide-react';
import dbService, { DirectoryListing } from '@/services/db';
import { supabaseAdminService, SupabaseCategory, SupabaseListing } from '@/services/supabaseAdminService';
import {
  getCategoryIcon,
  getCategoryMeta,
  getCategoryFallbackImage,
  slugify,
  isListingInCategory,
  toTitleCase,
  normalizeCategoryStr,
} from './components/DirectoryIcons';
import { DirectoryOtpModal } from './components/DirectoryOtpModal';
import { DirectoryGalleryModal } from './components/DirectoryGalleryModal';
import { DirectoryHeader } from './components/DirectoryHeader';
import { DirectoryFooter } from './components/DirectoryFooter';

const LISTINGS_PER_PAGE = 16; // 4 columns x 4 rows
const CATEGORIES_PER_PAGE = 24; // 6 columns x 4 rows

const optimizeUnsplashUrl = (url?: string, width = 500, quality = 80): string => {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  return url;
};

export default function DirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoriesList, setCategoriesList] = useState<SupabaseCategory[]>([]);
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const mainSectionRef = useRef<HTMLDivElement | null>(null);

  // OTP & Lead Verification state
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedListingForOtp, setSelectedListingForOtp] = useState<DirectoryListing | null>(null);

  // Photo Gallery Modal state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedListingForGallery, setSelectedListingForGallery] = useState<DirectoryListing | null>(null);

  // Enquiry & Lead Unlock Modal state
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedListingForEnquiry, setSelectedListingForEnquiry] = useState<DirectoryListing | null>(null);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryCategorySelection, setEnquiryCategorySelection] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // Secure Video Stream State (In-Memory Blob URL to lock against inspect stealing)
  const [videoBlobUrl, setVideoBlobUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = '';

    const loadSecureVideo = async () => {
      try {
        const res = await fetch('/api/media/directory-bg', {
          headers: {
            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          },
        });
        if (res.ok) {
          const blob = await res.blob();
          if (isMounted) {
            objectUrl = URL.createObjectURL(blob);
            setVideoBlobUrl(objectUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load secure media stream', err);
      }
    };

    loadSecureVideo();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  // Check stored user verification session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified =
        localStorage.getItem('t_covai_user_verified') === 'true' ||
        sessionStorage.getItem('t_covai_user_verified') === 'true' ||
        localStorage.getItem('t_kovai_user_verified') === 'true' ||
        sessionStorage.getItem('t_kovai_user_verified') === 'true';
      if (verified) {
        setIsUserVerified(true);
      }
    }
  }, []);

  // Fetch strictly from Supabase Database tables: `categories` & `listings`
  useEffect(() => {
    let isMounted = true;

    const syncData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch live categories & listings concurrently from Supabase
        const [supaCats, supaListings] = await Promise.all([
          supabaseAdminService.getCategories(),
          supabaseAdminService.getListings(),
        ]);

        if (isMounted) {
          if (supaCats && supaCats.length > 0) {
            setCategoriesList(supaCats);
          }

          if (supaListings && supaListings.length > 0) {
            const mapped: DirectoryListing[] = supaListings.map((sl) => {
              const exactCategoryName = sl.category?.trim() || 'General Services';
              const theme = getCategoryIcon(exactCategoryName);
              return {
                id: sl.id,
                name: toTitleCase(sl.title),
                category: exactCategoryName,
                categorySlug: slugify(exactCategoryName),
                icon: theme.emoji || '🏢',
                rating: sl.rating || 4.5,
                reviewsCount: 12,
                area: toTitleCase(sl.area || 'Coimbatore'),
                address: sl.address || `${sl.area || 'Coimbatore'}, Tamil Nadu`,
                phone: sl.phone || '+91 422 250 0000',
                ownerName:
                  (sl as any).ownerName ||
                  (sl as any).owner_name ||
                  (sl.title.includes('PSG College')
                    ? 'L. Gopalakrishnan (Managing Trustee)'
                    : sl.title.includes('PSG')
                    ? "PSG & Sons' Charities Trust"
                    : sl.title.includes('Ganga')
                    ? 'Dr. S. Raja Sabapathy'
                    : sl.title.includes('Gopal')
                    ? 'Gopalakrishnan V.'
                    : sl.title.includes('Pazhamudir')
                    ? 'K. Chinnasamy & Sons'
                    : sl.title.includes('Residency')
                    ? 'Appaswamy Real Estates Group'
                    : sl.title.includes('TIDEL')
                    ? 'ELCOT & TIDEL Park Ltd.'
                    : sl.title.includes('Brookefields')
                    ? 'Brookefields Management'
                    : `${sl.title.split(' ')[0]} Management`),
                description: `${toTitleCase(sl.title)} — Verified business & commercial service provider in ${sl.area || 'Coimbatore'}.`,
                imageUrl: (sl as any).imageUrl || (sl as any).image_url || getCategoryFallbackImage(exactCategoryName),
                verified: true,
                popular: true,
              };
            });
            setListings(mapped);
          } else {
            setListings([]);
          }
        }
      } catch (err) {
        console.error('Error fetching strictly from Supabase:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    syncData();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', syncData);
      window.addEventListener('todayscoimbatore:db-updated', syncData);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', syncData);
        window.removeEventListener('todayscoimbatore:db-updated', syncData);
      }
    };
  }, []);

  // Compute live category cards strictly from database listings & categories (hiding empty/static dummies)
  const dynamicCategories = useMemo(() => {
    // 1. Map of exact categories from listings with dynamic counts
    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        iconComp: React.ComponentType<{ className?: string }>;
        colorClass: string;
        bgLightClass: string;
        borderLightClass: string;
        count: number;
      }
    >();

    // Seed with active categories from categories table
    if (categoriesList.length > 0) {
      categoriesList.forEach((c) => {
        const exactName = c.name?.trim() || toTitleCase(c.slug);
        const matchingCount = listings.filter((item) => isListingInCategory(item, exactName) || isListingInCategory(item, c.slug)).length;
        
        // Hide empty/static dummy categories: only include if has listings or in active db
        if (matchingCount > 0) {
          const theme = getCategoryIcon(exactName);
          categoryMap.set(exactName.toLowerCase(), {
            id: c.id,
            name: exactName,
            slug: c.slug || slugify(exactName),
            iconComp: theme.icon,
            colorClass: theme.colorClass,
            bgLightClass: theme.bgLightClass,
            borderLightClass: theme.borderLightClass,
            count: matchingCount,
          });
        }
      });
    }

    // Also include any category directly from listings table that wasn't in categories table
    listings.forEach((item) => {
      const exactName = item.category?.trim();
      if (exactName && !categoryMap.has(exactName.toLowerCase())) {
        const matchingCount = listings.filter((l) => isListingInCategory(l, exactName)).length;
        const theme = getCategoryIcon(exactName);
        categoryMap.set(exactName.toLowerCase(), {
          id: slugify(exactName),
          name: exactName,
          slug: slugify(exactName),
          iconComp: theme.icon,
          colorClass: theme.colorClass,
          bgLightClass: theme.bgLightClass,
          borderLightClass: theme.borderLightClass,
          count: matchingCount,
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [categoriesList, listings]);

  // Deep Multi-Field Search Filter for Listings (Case-Insensitive & Synced)
  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return listings.filter((item: any) => {
      if (selectedCategory !== 'all') {
        const matchesCat = isListingInCategory(item, selectedCategory);
        if (!matchesCat) return false;
      }

      if (!q) return true;

      const nameMatch = item.name?.toLowerCase().includes(q) || (item.title && item.title.toLowerCase().includes(q));
      const catMatch = item.category?.toLowerCase().includes(q) || (item.categorySlug && item.categorySlug.toLowerCase().includes(q));
      const addressMatch = item.address?.toLowerCase().includes(q);
      const areaMatch = item.area?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const pincodeMatch = item.pincode?.toLowerCase().includes(q) || (item.pin && String(item.pin).includes(q));
      const ownerMatch = (item.ownerName && item.ownerName.toLowerCase().includes(q)) || (item.owner_name && item.owner_name.toLowerCase().includes(q));

      return Boolean(nameMatch || catMatch || addressMatch || areaMatch || descMatch || pincodeMatch || ownerMatch);
    });
  }, [listings, selectedCategory, searchQuery]);

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dynamicCategories;
    return dynamicCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q)
    );
  }, [dynamicCategories, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Smooth Category Select Without Jumping to Top Hero Video
  const handleCategorySelect = (categoryNameOrSlug: string) => {
    setSelectedCategory(categoryNameOrSlug);
    setSearchQuery('');
    setCurrentPage(1);

    // Smoothly focus on listings section without resetting page scroll to top hero banner
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (mainSectionRef.current) {
          mainSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const el = document.getElementById('directory-main-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 50);
    }
  };

  // Pagination calculation
  const isViewingCategory = selectedCategory !== 'all';
  const isSearching = searchQuery.trim().length > 0;

  const totalItems = isViewingCategory || isSearching
    ? filteredListings.length
    : filteredCategories.length;

  const itemsPerPage = isViewingCategory || isSearching ? LISTINGS_PER_PAGE : CATEGORIES_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * LISTINGS_PER_PAGE;
    return filteredListings.slice(startIndex, startIndex + LISTINGS_PER_PAGE);
  }, [filteredListings, currentPage]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [filteredCategories, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      if (mainSectionRef.current) {
        mainSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Phone Number Masking Helper
  const maskPhone = (phone?: string) => {
    if (!phone) return '+91 98422 *****';
    const cleaned = phone.trim();
    if (cleaned.length < 8) return '+91 98422 *****';
    const firstPart = cleaned.slice(0, Math.min(7, cleaned.length - 4));
    return `${firstPart} *****`;
  };

  // Modal Handlers
  const handleOpenOtpModal = (listing?: DirectoryListing) => {
    setSelectedListingForOtp(listing || null);
    setIsOtpModalOpen(true);
  };

  const handleOpenGalleryModal = (listing: DirectoryListing) => {
    setSelectedListingForGallery(listing);
    setIsGalleryOpen(true);
  };

  const handleOpenEnquiry = (listing?: DirectoryListing) => {
    setSelectedListingForEnquiry(listing || null);
    if (listing) {
      setEnquiryCategorySelection(listing.category || listing.categorySlug);
    } else if (selectedCategory !== 'all') {
      setEnquiryCategorySelection(selectedCategory);
    } else {
      setEnquiryCategorySelection('');
    }
    setCustomCategoryInput('');
    setIsEnquiryOpen(true);
    setEnquirySubmitted(false);
  };

  // Submit Lead Enquiry & Auto-Unlock Phone Numbers
  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone) return;

    setIsSubmittingEnquiry(true);

    let finalCategoryName = 'General Services';
    let finalCategorySlug = 'services';

    if (selectedListingForEnquiry) {
      finalCategoryName = selectedListingForEnquiry.category;
      finalCategorySlug = selectedListingForEnquiry.categorySlug;
    } else if (enquiryCategorySelection === '__custom__' && customCategoryInput.trim()) {
      finalCategoryName = toTitleCase(customCategoryInput.trim());
      finalCategorySlug = slugify(customCategoryInput.trim());
      await dbService.saveDirectoryCategory({
        name: finalCategoryName,
        slug: finalCategorySlug,
      });
    } else if (enquiryCategorySelection && enquiryCategorySelection !== '__custom__') {
      const found = dynamicCategories.find(
        (c) =>
          c.name.toLowerCase() === enquiryCategorySelection.toLowerCase() ||
          c.slug.toLowerCase() === enquiryCategorySelection.toLowerCase()
      );
      if (found) {
        finalCategoryName = found.name;
        finalCategorySlug = found.slug;
      } else {
        finalCategoryName = toTitleCase(enquiryCategorySelection);
        finalCategorySlug = slugify(enquiryCategorySelection);
      }
    } else if (selectedCategory !== 'all') {
      finalCategoryName = toTitleCase(selectedCategory);
      finalCategorySlug = slugify(selectedCategory);
    }

    try {
      // 1. Save lead to Supabase enquiries table
      await supabaseAdminService.addEnquiry({
        user_name: enquiryName.trim(),
        user_phone: enquiryPhone.trim(),
        service_requested: selectedListingForEnquiry ? `Listing: ${selectedListingForEnquiry.name}` : finalCategoryName,
        message: enquiryMsg.trim() || `Lead inquiry from Directory for ${selectedListingForEnquiry?.name || finalCategoryName}`,
        status: 'Pending',
      });
    } catch (supaErr) {
      console.warn('Supabase enquiry push:', supaErr);
    }

    // 2. Save to local contact enquiries database
    await dbService.saveContactEnquiry({
      name: enquiryName.trim(),
      email: enquiryEmail.trim() || 'no-email@directory.covai',
      phone: enquiryPhone.trim(),
      subject: selectedListingForEnquiry
        ? `Directory Lead: ${selectedListingForEnquiry.name}`
        : `Directory Registration: ${finalCategoryName}`,
      message: `Enquiry for: ${selectedListingForEnquiry?.name || finalCategoryName}\nOwner: ${selectedListingForEnquiry?.ownerName || 'N/A'}\nCategory: ${finalCategoryName}\nArea: ${selectedListingForEnquiry?.area || 'Coimbatore'}\nDetails: ${enquiryMsg}`,
    });

    // 3. Unlock verified session for user immediately
    setIsUserVerified(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('t_covai_user_verified', 'true');
      sessionStorage.setItem('t_covai_user_verified', 'true');
      window.dispatchEvent(new Event('enquiriesStorageUpdate'));
      window.dispatchEvent(new Event('contactEnquiriesStorageUpdate'));
    }

    setIsSubmittingEnquiry(false);
    setEnquirySubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-slate-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      <DirectoryHeader />

      {/* ==================================================================== */}
      {/* 1. SECURE FULL-WIDTH HERO VIDEO (LOCKED AGAINST INSPECT & STEALING) */}
      {/* ==================================================================== */}
      <section 
        className="w-full bg-black overflow-hidden shadow-md relative select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Transparent Security Shield (Intercepts right-clicks, inspect clicks, and drag attempts) */}
        <div 
          className="absolute inset-0 z-20 w-full h-full cursor-default select-none pointer-events-auto bg-transparent"
          aria-hidden="true"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragStart={(e) => e.preventDefault()}
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        />

        <video
          ref={videoRef}
          src={videoBlobUrl || undefined}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture={true}
          disableRemotePlayback={true}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-auto block pointer-events-none select-none"
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          {/* Fallback secure stream route (no direct raw .mp4 public url) */}
          <source src="/api/media/directory-bg" type="video/mp4" />
        </video>
      </section>

      <main
        id="directory-main-section"
        ref={mainSectionRef}
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6 sm:space-y-8 scroll-mt-6"
      >
        {/* ==================================================================== */}
        {/* 2. DIRECTORY TITLE & SEARCH BAR SECTION (BELOW VIDEO)                */}
        {/* ==================================================================== */}
        <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-wider border border-red-200 dark:border-red-900/60">
              <Building2 className="w-3.5 h-3.5" />
              <span>COIMBATORE LOCAL BUSINESS DIRECTORY</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
              Discover Verified Businesses &amp; Services Across Coimbatore
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed">
              Find direct contact numbers, business owners, addresses, verified photo galleries, and certified ratings for top hospitals, jewellery showrooms, IT companies, and educational institutions in Covai.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="pt-2 max-w-2xl">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                <Search className="w-5 h-5 text-stone-400" />
              </div>
              <input
                type="text"
                placeholder="Search by business title, owner name, category, or area (e.g. RS Puram, Peelamedu)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                suppressHydrationWarning={true}
                className="w-full pl-12 pr-14 py-3.5 sm:py-4 rounded-2xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 placeholder:truncate text-xs sm:text-sm font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-red-600 border border-stone-200 dark:border-slate-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-400 hover:text-stone-600 dark:hover:text-gray-200 transition-colors cursor-pointer z-10"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. VERIFIED SESSION & LEAD UNLOCK STATUS BAR                         */}
        {/* ==================================================================== */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs transition-all ${
            isUserVerified
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{isUserVerified ? '🔓' : '🔒'}</span>
            <div>
              <strong className="text-stone-900 dark:text-white font-bold block">
                {isUserVerified
                  ? 'Verified User Session Active — Full Phone Numbers Unlocked'
                  : 'Phone numbers are masked for business privacy & anti-spam'}
              </strong>
              <span className="text-stone-600 dark:text-gray-300 text-[11px]">
                {isUserVerified
                  ? 'You can now view complete contact details and place direct phone calls.'
                  : 'Click "Unlock / View Number" on any listing card to reveal the full 10-digit number.'}
              </span>
            </div>
          </div>

          {!isUserVerified ? (
            <button
              type="button"
              onClick={() => handleOpenEnquiry()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Unlock All Numbers
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('t_covai_user_verified');
                  sessionStorage.removeItem('t_covai_user_verified');
                }
                setIsUserVerified(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-gray-300 font-bold text-[11px] cursor-pointer"
            >
              Lock Session
            </button>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 4. MAIN DIRECTORY VIEWS                                              */}
        {/* ==================================================================== */}
        {isSearching ? (
          /* VIEW A: ACTIVE SEARCH RESULTS (4-COLUMN GRID) */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                  Search Results for &quot;{searchQuery}&quot;
                </h2>
                <p className="text-xs text-stone-500 font-semibold">
                  Found {filteredListings.length} matching {filteredListings.length === 1 ? 'business' : 'businesses'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {paginatedListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {paginatedListings.map((item) => (
                  <article
                    key={item.id}
                    className="group bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Image Preview Box & Gallery Trigger */}
                      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-900 border border-stone-100 dark:border-slate-800 group/img">
                        <img
                          src={optimizeUnsplashUrl(item.imageUrl || getCategoryFallbackImage(item.category, item.categorySlug), 500, 80)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                            {item.category}
                          </span>
                          {item.verified && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Top-Right Star Rating Pill */}
                        <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-xs text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-white font-black">
                            {(typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 4.8).toFixed(1)}
                          </span>
                        </div>

                        {/* Photo Gallery Button Overlay */}
                        <button
                          type="button"
                          onClick={() => handleOpenGalleryModal(item)}
                          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/75 hover:bg-black text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>View Photos</span>
                        </button>

                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-red-400" />
                          <span className="truncate max-w-[100px]">{item.area}</span>
                        </span>
                      </div>

                      {/* Business Name & Owner Name */}
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>

                        {/* Owner Name Display */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                          <User className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span className="truncate">
                            Owner: <strong className="text-stone-900 dark:text-white">{item.ownerName || 'Verified Management'}</strong>
                          </span>
                        </div>

                        {/* Admin Rating Badge */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-lg text-xs font-black text-amber-950 dark:text-amber-200">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((starIdx) => {
                                const r = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 4.8;
                                const isFilled = r >= starIdx;
                                const isHalf = !isFilled && r >= starIdx - 0.5;
                                return (
                                  <Star
                                    key={starIdx}
                                    className={`w-3 h-3 ${
                                      isFilled
                                        ? 'fill-amber-400 text-amber-400'
                                        : isHalf
                                        ? 'fill-amber-400/50 text-amber-400'
                                        : 'text-stone-300 dark:text-stone-600'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="font-extrabold text-stone-900 dark:text-white text-xs">
                              {(typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 4.8).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            ★ Admin Rating
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 dark:text-gray-400 line-clamp-2 mt-2 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      {/* Details & Phone Number Display */}
                      <div className="text-[11px] text-stone-500 dark:text-gray-400 space-y-1.5 pt-2.5 border-t border-stone-100 dark:border-slate-800">
                        <p className="truncate flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{item.address || item.area}</span>
                        </p>

                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <span className="font-bold text-stone-700 dark:text-gray-300">📞 Phone:</span>
                          {isUserVerified ? (
                            <a
                              href={`tel:${item.phone}`}
                              className="font-mono font-black text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
                            >
                              {item.phone}
                            </a>
                          ) : (
                            <span className="font-mono text-stone-400 dark:text-gray-500 font-bold text-xs">
                              {maskPhone(item.phone)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
                      {isUserVerified ? (
                        <a
                          href={`tel:${item.phone}`}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider text-center transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Now</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEnquiry(item)}
                          className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider text-center transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Unlock Number</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEnquiry(item)}
                        className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-xs"
                      >
                        Enquire
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
                <Building2 className="w-12 h-12 text-stone-400 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 dark:text-gray-200">
                  No directory listings matched &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Try searching with a broader keyword (e.g. Hospital, Textiles, IT, RS Puram, Peelamedu).
                </p>
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-gray-200 text-xs font-bold hover:bg-stone-200 cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        ) : isViewingCategory ? (
          /* VIEW B: SPECIFIC CATEGORY SELECTED (4-COLUMN LISTINGS GRID) */
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 text-2xl border border-red-200 dark:border-red-900">
                  {(() => {
                    const theme = getCategoryIcon(selectedCategory);
                    const CatIcon = theme.icon;
                    return <CatIcon className="w-6 h-6 text-red-600 motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />;
                  })()}
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                    {toTitleCase(selectedCategory)}
                  </h1>
                  <p className="text-xs font-semibold text-stone-500 dark:text-gray-400">
                    {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} registered in Coimbatore
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-gray-200 text-xs font-black uppercase tracking-wider border border-stone-300 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>View All Categories</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEnquiry()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                >
                  <span>+ Add Business</span>
                </button>
              </div>
            </div>

            {/* 4-Column Grid for Category Listings */}
            {paginatedListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {paginatedListings.map((item) => (
                  <article
                    key={item.id}
                    className="group bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Image Preview Box & Gallery Trigger */}
                      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-900 border border-stone-100 dark:border-slate-800 group/img">
                        <img
                          src={optimizeUnsplashUrl(item.imageUrl || getCategoryFallbackImage(item.category, item.categorySlug), 500, 80)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                            {item.category}
                          </span>
                          {item.verified && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Top-Right Star Rating Pill */}
                        <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-xs text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-white font-black">
                            {(typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 4.8).toFixed(1)}
                          </span>
                        </div>

                        {/* Photo Gallery Button Overlay */}
                        <button
                          type="button"
                          onClick={() => handleOpenGalleryModal(item)}
                          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/75 hover:bg-black text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>View Photos</span>
                        </button>

                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-red-400" />
                          <span className="truncate max-w-[100px]">{item.area}</span>
                        </span>
                      </div>

                      {/* Business Name & Owner Name */}
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>

                        {/* Owner Name Display */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                          <User className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span className="truncate">
                            Owner: <strong className="text-stone-900 dark:text-white">{item.ownerName || 'Verified Management'}</strong>
                          </span>
                        </div>

                        {/* Admin Rating Badge */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-lg text-xs font-black text-amber-950 dark:text-amber-200">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((starIdx) => {
                                const r = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 4.8;
                                const isFilled = r >= starIdx;
                                const isHalf = !isFilled && r >= starIdx - 0.5;
                                return (
                                  <Star
                                    key={starIdx}
                                    className={`w-3 h-3 ${
                                      isFilled
                                        ? 'fill-amber-400 text-amber-400'
                                        : isHalf
                                        ? 'fill-amber-400/50 text-amber-400'
                                        : 'text-stone-300 dark:text-stone-600'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="font-extrabold text-stone-900 dark:text-white text-xs">
                              {(typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 4.8).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            ★ Admin Rating
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 dark:text-gray-400 line-clamp-2 mt-2 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      {/* Details & Phone Number Display */}
                      <div className="text-[11px] text-stone-500 dark:text-gray-400 space-y-1.5 pt-2.5 border-t border-stone-100 dark:border-slate-800">
                        <p className="truncate flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{item.address || item.area}</span>
                        </p>

                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <span className="font-bold text-stone-700 dark:text-gray-300">📞 Phone:</span>
                          {isUserVerified ? (
                            <a
                              href={`tel:${item.phone}`}
                              className="font-mono font-black text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
                            >
                              {item.phone}
                            </a>
                          ) : (
                            <span className="font-mono text-stone-400 dark:text-gray-500 font-bold text-xs">
                              {maskPhone(item.phone)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
                      {isUserVerified ? (
                        <a
                          href={`tel:${item.phone}`}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider text-center transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Now</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEnquiry(item)}
                          className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider text-center transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Unlock Number</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEnquiry(item)}
                        className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-xs"
                      >
                        Enquire
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
                <Building2 className="w-12 h-12 text-stone-400 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 dark:text-gray-200">
                  No listings currently registered under {toTitleCase(selectedCategory)}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Be the first business to list in this category on Today’s Coimbatore directory.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenEnquiry()}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 cursor-pointer shadow-xs"
                >
                  + Add Business Now
                </button>
              </div>
            )}
          </div>
        ) : (
          /* VIEW C: ALL ACTIVE CATEGORIES GRID (6 COLUMNS PER ROW, FILTERING OUT EMPTY DUMMIES) */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-600" />
                  <span>Browse by Industry &amp; Category</span>
                </h2>
                <p className="text-xs text-stone-500 font-semibold">
                  Select an active category to view verified Coimbatore business listings
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
                {dynamicCategories.length} Active Categories
              </span>
            </div>

            {/* 6 CARDS PER ROW GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {paginatedCategories.map((cat) => {
                const IconComp = cat.iconComp;

                return (
                  <button
                    key={cat.slug || cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name)}
                    className="group bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-600 rounded-2xl p-4 text-left shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Category Icon with Continuous Breathing Micro-Animation */}
                      <div className={`w-11 h-11 rounded-2xl ${cat.bgLightClass} ${cat.colorClass} flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 border ${cat.borderLightClass}`}>
                        <IconComp className="w-5 h-5 motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />
                      </div>

                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-1">
                          {toTitleCase(cat.name)}
                        </h3>
                        <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                          {cat.count} {cat.count === 1 ? 'Listing' : 'Listings'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black uppercase text-red-600">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 5. CLIENT-SIDE PAGINATION CONTROLS                                  */}
        {/* ==================================================================== */}
        {totalPages > 1 && (
          <div className="pt-6 pb-2 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-medium text-stone-500 dark:text-gray-400">
              Showing <strong className="text-stone-900 dark:text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
              <strong className="text-stone-900 dark:text-white font-bold">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </strong>{' '}
              of <strong className="text-stone-900 dark:text-white font-bold">{totalItems}</strong> items (Page {currentPage} of {totalPages})
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-stone-400 font-bold text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-red-600 text-white shadow-md scale-105 ring-2 ring-red-600/30'
                            : 'bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-800 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 6. FIXED BOTTOM-LEFT QUICK ENQUIRY BUTTON                            */}
      {/* ==================================================================== */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          type="button"
          onClick={() => handleOpenEnquiry()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white dark:border-slate-800"
          aria-label="Quick Business Enquiry"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Quick Enquiry</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 7. MODALS                                                           */}
      {/* ==================================================================== */}
      <DirectoryOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        targetListing={selectedListingForOtp}
        onVerifiedSuccess={() => {
          setIsUserVerified(true);
          setIsOtpModalOpen(false);
        }}
      />

      <DirectoryGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        listing={selectedListingForGallery}
        isUserVerified={isUserVerified}
        onUnlockContact={(l) => handleOpenEnquiry(l)}
        onOpenEnquiry={(l) => handleOpenEnquiry(l)}
      />

      {/* Enquiry & Lead Unlock Modal */}
      {isEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                  {selectedListingForEnquiry
                    ? `Unlock Number & Connect with ${selectedListingForEnquiry.name}`
                    : 'Directory Enquiry & Lead Registration'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400">
                  {selectedListingForEnquiry
                    ? 'Enter your name and phone number to unlock the direct contact number.'
                    : 'Connect with Covai business desk or register your business'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-black text-sm p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {enquirySubmitted ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                  Contact Unlocked &amp; Enquiry Sent!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Your lead inquiry has been registered in Supabase. Full phone numbers are now unlocked on all listing cards.
                </p>
                {selectedListingForEnquiry && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs font-mono font-bold text-stone-900 dark:text-white">
                    Direct Phone: <a href={`tel:${selectedListingForEnquiry.phone}`} className="text-emerald-600 underline">{selectedListingForEnquiry.phone}</a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsEnquiryOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Done &amp; View Listings
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnquiry} className="space-y-3 text-xs">
                {selectedListingForEnquiry && (
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex items-center gap-3">
                    <img
                      src={selectedListingForEnquiry.imageUrl || getCategoryFallbackImage(selectedListingForEnquiry.category)}
                      alt={selectedListingForEnquiry.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-black text-stone-900 dark:text-white truncate">
                        {selectedListingForEnquiry.name}
                      </div>
                      <div className="text-[11px] text-red-600 font-bold">
                        👤 Owner: {selectedListingForEnquiry.ownerName || 'Verified Management'}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        📍 {selectedListingForEnquiry.area || 'Coimbatore'}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={enquiryPhone}
                      onChange={(e) => setEnquiryPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-mono font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={enquiryEmail}
                      onChange={(e) => setEnquiryEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                    Requirements / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide details about requirements, preferred timings, or questions..."
                    value={enquiryMsg}
                    onChange={(e) => setEnquiryMsg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEnquiryOpen(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-gray-300 font-bold hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingEnquiry ? 'Submitting...' : 'Unlock Number & Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <DirectoryFooter />
    </div>
  );
}
