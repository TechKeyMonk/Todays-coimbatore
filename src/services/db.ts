export interface Article {
  id: string;
  title: string;
  slug?: string;
  category: 'NEWS' | 'OUR CITY' | 'BUSINESS' | 'TECH' | 'EVENTS' | 'SPORTS' | 'CEO' | 'EDUCATION' | 'E-PAPER' | string;
  subCategory: string;
  subTag?: string;
  author: string;
  readTime: string;
  publishedAt: string;
  createdAt: string; // ISO 8601 string for created_at DESC sorting
  updatedAt?: string; // ISO 8601 string for updated_at
  isExclusive: boolean;
  status: 'published' | 'draft' | 'archived';
  sourceUrl?: string;
  source_url?: string;
  mediaType: 'image' | 'video';
  imageUrl?: string;
  image?: string;
  mediaUrl?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  excerpt: string;
  content?: string;
  highlightStat?: string;
  commentsCount?: number;
  articleHref?: string;
  tags?: string[];
  sectionId?: string;
  section?: string;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImageUrl?: string;
}

// Dynamic real-time relative time formatter (e.g. "1 sec ago", "12 secs ago", "2 mins ago", "3 hours ago", "2 days ago", "1 week ago")
export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '1 sec ago';
  const cleanStr = String(dateStr).trim();
  if (!cleanStr) return '1 sec ago';

  let parsedTime = new Date(cleanStr).getTime();

  // If not a standard ISO date, check if it's already a relative format or special keyword
  if (isNaN(parsedTime)) {
    if (/^(just now|today|recently)$/i.test(cleanStr)) {
      return '1 sec ago';
    }
    const relMatch = cleanStr.replace(/^[•\s]+/, '').trim().match(/^(\d+)\s*(s|sec|second|min|minute|m|hour|hr|h|day|d|week|w|month|yr|year)s?\s*ago$/i);
    if (relMatch) {
      const val = parseInt(relMatch[1], 10);
      const unit = relMatch[2].toLowerCase();
      let ms = 0;
      if (unit.startsWith('s')) ms = val * 1000;
      else if (unit.startsWith('m') && !unit.startsWith('mo')) ms = val * 60 * 1000;
      else if (unit.startsWith('h')) ms = val * 3600 * 1000;
      else if (unit.startsWith('d')) ms = val * 86400 * 1000;
      else if (unit.startsWith('w')) ms = val * 7 * 86400 * 1000;
      else if (unit.startsWith('mo')) ms = val * 30 * 86400 * 1000;
      else if (unit.startsWith('y')) ms = val * 365 * 86400 * 1000;
      parsedTime = Date.now() - ms;
    } else {
      return cleanStr;
    }
  }

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - parsedTime) / 1000));

  if (diffSec <= 1) return '1 sec ago';
  if (diffSec < 60) return `${diffSec} secs ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  totalArticles: number;
  status: 'active' | 'archived';
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'editor' | 'reporter' | 'subscriber';
  joinedDate: string;
  status: 'active' | 'suspended';
}

export interface OutageRecord {
  id: string;
  area: string;
  substation?: string;
  date?: string;
  scheduledDate?: string;
  time?: string;
  timeWindow?: string;
  status: 'scheduled' | 'active' | 'restored' | 'maintenance';
  reason?: string;
  details?: string;
  isTomorrow?: boolean;
  affectedStreets?: string[];
  isAutoSynced?: boolean;
}

export interface AdSlotRecord {
  id: string;
  slotId: string;
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
  startDate: string;
  endDate: string;
  fallbackAdSense: boolean;
}

export interface BloodDonorRecord {
  id: string;
  name: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | string;
  area: string;
  phone: string;
  whatsapp?: string;
  isAvailable: boolean;
  isVerified: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  lastDonated?: string;
  registeredDate: string;
}

export interface EmergencyBloodAlert {
  id: string;
  patientName: string;
  hospital: string;
  bloodGroup: string;
  unitsNeeded: number;
  contactNumber: string;
  urgency: 'critical' | 'immediate' | 'within_24h';
  postedAt: string;
  isActive: boolean;
}

export interface DonorContactRequest {
  id: string;
  donorId?: string;
  donorName?: string;
  donorPhone?: string;
  donorBloodGroup?: string;
  patientName: string;
  hospital: string;
  bloodGroup: string;
  units: number;
  contactPhone: string;
  urgency: 'Emergency' | 'Within 24 Hours' | string;
  notes?: string;
  status: 'Pending' | 'Verified' | 'Fulfilled';
  createdAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  category: 'CULTURAL' | 'BUSINESS' | 'TECH' | 'WORKSHOP' | 'SPORTS' | 'EXPO' | 'MUSIC' | string;
  date: string;
  time: string;
  venue: string;
  mapLink?: string;
  ticketPrice?: string;
  posterUrl?: string;
  videoUrl?: string;
  description: string;
  organizer: string;
  registrationLink?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialLinksRecord {
  instagram: string;
  youtube: string;
  facebook: string;
  twitter: string;
}

export const INITIAL_SOCIAL_LINKS_DB: SocialLinksRecord = {
  instagram: 'https://instagram.com/todayscoimbatore',
  youtube: 'https://youtube.com/@todayscoimbatore',
  facebook: 'https://facebook.com/todayscoimbatore',
  twitter: 'https://x.com/todayscoimbatore',
};

export interface ContactEnquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
}

export const INITIAL_CONTACT_ENQUIRIES_DB: ContactEnquiryRecord[] = [
  {
    id: 'enq-1',
    name: 'Karthik Sivakumar',
    email: 'karthik@covaisaas.com',
    phone: '+91 98422 12345',
    subject: 'Covering our DeepTech startup launch at Peelamedu',
    message: 'Hello Editorial Team, we are launching an AI-powered textile spindle monitoring system this month and would love to share a press release.',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'unread',
  },
  {
    id: 'enq-2',
    name: 'Dr. Meena Ramesh',
    email: 'm.ramesh@psghospitals.edu',
    phone: '+91 94433 67890',
    subject: 'Blood Donation Camp announcement for this weekend',
    message: 'We are organizing a city-wide voluntary blood donation drive at PSG IMS&R. Requesting coverage in TodaysCoimbatore.',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: 'read',
  },
];

export const INITIAL_DATABASE_ARTICLES: Article[] = [
  {
    id: 'art-race-course-1',
    slug: 'race-course-walkers-botanical-boulevard-smart-lighting',
    title: 'Race Course Walker’s Botanical Boulevard Upgraded with Sensor-Driven Smart Solar Illumination',
    category: 'NEWS',
    subCategory: 'Smart City',
    author: 'Urban Civic Desk',
    readTime: '3 min',
    publishedAt: '10 mins ago',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    videoTitle: 'Race Course Night View: Smart Solar Lighting Live',
    videoDuration: '01:50',
    excerpt: 'CCMC installs 120 motion-sensing LED pillars, emergency SOS kiosks, and heritage fountains across the iconic 2.5 km running loop.',
    content: 'Coimbatore City Municipal Corporation completes the smart botanical promenade modernization along Race Course Road, featuring intelligent solar-powered night lighting, dedicated pedestrian hydration stations, and continuous CCTV surveillance.',
    highlightStat: '120 Smart Solar Pillars',
    commentsCount: 52,
  },
  {
    id: 'art-hero-1',
    slug: 'the-quiet-revolution-in-covais-ev-corridor',
    title: 'The Quiet Revolution in Covai’s EV Corridor: How 400+ Local MSMEs Power India’s Electric Transition',
    category: 'TECH',
    subCategory: 'EV Mobility',
    author: 'Covai Urban Bureau',
    readTime: '5 min',
    publishedAt: '18 mins ago',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    isExclusive: true,
    status: 'published',
    mediaType: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c634a10?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    videoTitle: 'Coimbatore EV Component Park & Cleanroom Walkthrough',
    videoDuration: '03:20',
    excerpt: 'From precision motor stator windings in Peelamedu to smart battery thermal management modules in Sulur, Coimbatore’s deep-rooted precision engineering heritage is quietly positioning the city as India’s premier electric mobility hub.',
    content: 'Coimbatore MSMEs have successfully pivoted towards electric vehicle components with over 400 specialized manufacturing facilities supplying to major automotive OEMs across India.',
    highlightStat: '400+ EV MSMEs',
    commentsCount: 64,
  },
  {
    id: 'art-top-1',
    slug: 'avinashi-road-elevated-flyover-milestone',
    title: 'Avinashi Road 10.1 km Elevated Flyover Crosses 80% Milestone: Final Spans Launched',
    category: 'NEWS',
    subCategory: 'Trending Now',
    author: 'Infra Bureau',
    readTime: '3 min',
    publishedAt: '25 mins ago',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    videoTitle: 'Avinashi Road Elevated Corridor Drone Fly-Through',
    videoDuration: '02:15',
    excerpt: 'With 284 out of 306 spans successfully launched, the corridor from Uppilipalayam to Goldwins enters its final surfacing phase.',
    content: 'State highways engineers confirm completion of 80% deck construction along the 10.1 km elevated expressway.',
    highlightStat: '80% Deck Complete',
    commentsCount: 38,
  },
  {
    id: 'art-top-2',
    slug: 'siruvani-reservoir-storage-summer-water',
    title: 'Siruvani Reservoir Storage at 45.4 ft: Summer Water Rationing Prevented',
    category: 'OUR CITY',
    subCategory: 'Civic Watch',
    author: 'Water Resources Desk',
    readTime: '3 min',
    publishedAt: '35 mins ago',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    videoTitle: 'Siruvani Reservoir Water Level & Supply Inspection',
    videoDuration: '01:45',
    excerpt: 'Full supply capacity of 86 MLD maintained for West and Central zones as Pilloor-III distribution testing wraps up.',
    content: 'Coimbatore City Municipal Corporation confirms uninterrupted drinking water supply following robust seasonal storage levels.',
    highlightStat: '45.4 ft Storage',
    commentsCount: 22,
  },
  {
    id: 'art-top-3',
    slug: 'codissia-intec-2026-automation-robotics',
    title: 'CODISSIA Intec 2026: 450+ Global Automation & Robotics Exhibitors Finalize Arena',
    category: 'BUSINESS',
    subCategory: 'Industry Watch',
    author: 'Industrial Bureau',
    readTime: '4 min',
    publishedAt: '45 mins ago',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    videoTitle: 'Codissia Intec 2026 Arena Walkthrough & Setup',
    videoDuration: '03:45',
    excerpt: 'South India’s premier industrial expo introduces a dedicated pavilion for precision EV motor stamping and aerospace titanium tooling.',
    content: 'International trade delegations from Germany, Japan, and Taiwan arrive for the flagship biennial industrial trade fair.',
    highlightStat: '450+ Exhibitors',
    commentsCount: 29,
  },
  {
    id: 'art-top-4',
    slug: 'coimbatore-metro-rail-phase-1-approved',
    title: 'Coimbatore Metro Rail Phase-1 DPR Approved by Union Ministry with ₹10,740 Cr Outlay',
    category: 'NEWS',
    subCategory: 'Metro Transit',
    author: 'Transit Correspondent',
    readTime: '4 min',
    publishedAt: '1 hour ago',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    videoTitle: 'Coimbatore Metro Alignment Map & Corridor 1 & 2 Blueprint',
    videoDuration: '04:10',
    excerpt: 'Dual-corridor network spanning 44 km from Collectorate to Bilichi and Karanampettai gets center clearance.',
    content: 'Chennai Metro Rail Limited initiates preliminary land acquisition and utility diversion works along Avinashi Road.',
    highlightStat: '₹10,740 Cr Approved',
    commentsCount: 75,
  },
  {
    id: 'art-top-5',
    title: 'TIDEL Park Phase-2 at Avinashi Road Reaches 90% Pre-Lease Occupancy Across Tech Towers',
    category: 'TECH',
    subCategory: 'IT Corridor',
    author: 'Tech Bureau',
    readTime: '3 min',
    publishedAt: '2 hours ago',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    videoTitle: 'TIDEL Park Phase-2 Construction Aerial Tour',
    videoDuration: '03:30',
    excerpt: 'Five Fortune-500 SaaS and engineering R&D hubs book 8.5 lakh sq.ft of Grade-A office space adjacent to ELCOT IT SEZ.',
    content: 'State infrastructure corporation confirms on-schedule handover of IT tower suites in Q3 2026.',
    highlightStat: '90% Pre-Leased',
    commentsCount: 41,
  },
  {
    id: 'art-ceo-1',
    title: 'Sridhar Vembu: How Coimbatore & Rural Tech Hubs Power Global Enterprise SaaS',
    category: 'CEO',
    subCategory: 'Founder Spotlights',
    author: 'Executive Bureau',
    readTime: '6 min',
    publishedAt: '3 hours ago',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    isExclusive: true,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    videoTitle: 'Sridhar Vembu Keynote on Rural Technology Clusters',
    videoDuration: '05:30',
    excerpt: 'Coimbatore’s rich engineering DNA and grounding prove that global enterprise software can thrive sustainably without big-city burnout.',
    content: 'Zoho founder explores deep-tech decentralization and engineering talent retention in Tamil Nadu tier-2 centers.',
    highlightStat: 'Exclusive Interview',
    commentsCount: 52,
  },
  {
    id: 'art-sports-1',
    title: '14th Annual Coimbatore Marathon Crosses 18,000 Runners for Cancer Awareness',
    category: 'SPORTS',
    subCategory: 'Sports & Community',
    author: 'Sports Desk',
    readTime: '3 min',
    publishedAt: '4 hours ago',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Coimbatore Marathon Route Highlights & Registration',
    videoDuration: '03:15',
    excerpt: 'Coimbatore Cancer Foundation announces certified 5K, 10K, and 21K half-marathon circuits with medical support stations.',
    content: 'Over 18,000 participants register for the annual Covai marathon raising crucial awareness and community cancer care funds.',
    highlightStat: '18K+ Runners',
    commentsCount: 33,
  },
  {
    id: 'art-edu-1',
    title: 'PSG Tech & Coimbatore Innovation Hub Launch ₹25 Cr Deep-Tech Collegiate Accelerator Fund',
    category: 'EDUCATION',
    subCategory: 'Collegiate Innovation',
    author: 'Academic Cell',
    readTime: '4 min',
    publishedAt: '5 hours ago',
    createdAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'PSG Tech DeepTech Lab Demo Day',
    videoDuration: '04:15',
    excerpt: 'Collegiate entrepreneurs receive seed funding and lab infrastructure for precision agriculture robotics and healthcare AI diagnostics.',
    content: 'New innovation endowment supports 20 student-led research spin-offs across biomedical and robotics disciplines.',
    highlightStat: '₹25 Cr Seed Fund',
    commentsCount: 19,
  },
  {
    id: 'art-events-1',
    title: 'Covai Food Carnival 2026: 60+ Authentic Kongu Delicacies at VOC Grounds',
    category: 'EVENTS',
    subCategory: 'Weekend Happening',
    author: 'Culture Desk',
    readTime: '2 min',
    publishedAt: '6 hours ago',
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Covai Food Carnival Stalls & Kongu Cuisine Preview',
    videoDuration: '02:40',
    excerpt: 'Featuring traditional Kongu non-veg curries, Pallipalayam specialties, and traditional millet desserts across 60 curated stalls.',
    content: 'Three-day cultural festival attracts thousands of food enthusiasts celebrating indigenous Kongu culinary heritage.',
    highlightStat: '60+ Food Stalls',
    commentsCount: 47,
  },
  {
    id: 'art-epaper-1',
    title: 'Todays Coimbatore Daily e-Paper Edition: Full Digital Newspaper Replica',
    category: 'E-PAPER',
    subCategory: 'Daily Edition',
    author: 'Editorial Board',
    readTime: '8 min',
    publishedAt: 'Today 06:00 AM',
    createdAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    isExclusive: true,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Daily e-Paper Digital Reader Tour',
    videoDuration: '02:00',
    excerpt: 'Access high-resolution PDF pages, editorial columns, classifieds, and district pullouts in the official digital paper format.',
    content: 'Complete daily district edition covering civic infrastructure, textile markets, commerce, and civic announcements.',
    highlightStat: 'Daily 24-Page e-Paper',
    commentsCount: 15,
  },
  {
    id: 'art-news-3',
    title: 'Coimbatore International Airport Expansion: ₹2,000 Cr Runway & New Integrated Terminal Tender Awarded',
    category: 'NEWS',
    subCategory: 'Aviation & Transit',
    author: 'Aviation Desk',
    readTime: '4 min',
    publishedAt: '2 hours ago',
    createdAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    isExclusive: true,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Land acquisition for 627 acres wraps up as Airport Authority of India finalizes global EPC bids for the 12,500 ft wide-body runway extension.',
    content: 'The expansion will enable direct long-haul international flights connecting Coimbatore to Europe, Southeast Asia, and the Middle East.',
    highlightStat: '₹2,000 Cr Expansion',
    commentsCount: 54,
  },
  {
    id: 'art-news-4',
    title: 'Western Ring Road Phase-1 Crosses 65% Physical Progress: Kuniyamuthur to Madukkarai Stretch Nears Completion',
    category: 'NEWS',
    subCategory: 'Road Infrastructure',
    author: 'Highways Bureau',
    readTime: '3 min',
    publishedAt: '3 hours ago',
    createdAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    excerpt: 'The 32.4 km four-lane bypass corridor will divert over 25,000 heavy commercial vehicles daily away from Coimbatore core city roads.',
    content: 'State Highways Department confirms scheduled opening of Phase-1 before the upcoming monsoon season.',
    highlightStat: '32.4 km Bypass',
    commentsCount: 31,
  },
  {
    id: 'art-news-5',
    title: 'Coimbatore Corporation Smart City Lakefronts at Valankulam & Kurichi Draw Record 85,000 Weekend Visitors',
    category: 'NEWS',
    subCategory: 'City Life & Tourism',
    author: 'Civic Reporter',
    readTime: '3 min',
    publishedAt: '4 hours ago',
    createdAt: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Illuminated floating fountains, open-air food kiosks, and eco-cycling tracks transform Covai’s historic lake system into prime leisure hubs.',
    content: 'Municipal authorities announce expanded weekend cultural programming and battery-operated shuttle services around lake perimeters.',
    highlightStat: '85K+ Visitors',
    commentsCount: 42,
  },
  {
    id: 'art-news-6',
    title: 'Coimbatore Junction Railway Station Redevelopment to Feature Multi-Modal Transit Hub & Airport-Style Concourse',
    category: 'NEWS',
    subCategory: 'Railway Modernization',
    author: 'Transit Correspondent',
    readTime: '4 min',
    publishedAt: '5 hours ago',
    createdAt: new Date(Date.now() - 310 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Southern Railway finalizes ₹450 Cr world-class station revamp with elevated roof plaza, segregated arrival/departure gates, and 1,200-car multi-level parking.',
    content: 'Construction crews begin platform canopy modernization and passenger skywalk connections to the nearby central bus terminal.',
    highlightStat: '₹450 Cr Modernization',
    commentsCount: 39,
  },
  {
    id: 'art-news-7',
    title: 'VOC Park & Mini Zoo Modernization: ₹45 Cr Bio-Park & Botanical Conservatory DPR Finalized',
    category: 'NEWS',
    subCategory: 'Urban Green Spaces',
    author: 'Environment Desk',
    readTime: '3 min',
    publishedAt: '6 hours ago',
    createdAt: new Date(Date.now() - 370 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    excerpt: 'New eco-friendly masterplan introduces native Western Ghats flora pavilions, interactive science exhibits, and underground stormwater harvesting.',
    content: 'Coimbatore Corporation Council approves immediate execution of Phase-1 landscaping and heritage tree preservation.',
    highlightStat: '₹45 Cr Masterplan',
    commentsCount: 26,
  },
  {
    id: 'art-news-8',
    title: 'Coimbatore District Health Department Deploys 24 Mobile Medical Screening Vans Across Rural Kongu Panchayats',
    category: 'NEWS',
    subCategory: 'Public Health',
    author: 'Health Correspondent',
    readTime: '3 min',
    publishedAt: '7 hours ago',
    createdAt: new Date(Date.now() - 430 * 60 * 1000).toISOString(),
    isExclusive: false,
    status: 'published',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Equipped with digital ECG, ultrasound diagnostics, and tele-consultation suites, the fleet delivers primary healthcare to 120+ village centers.',
    content: 'District Collector flags off the state-of-the-art mobile medical units aimed at early non-communicable disease detection.',
    highlightStat: '24 Mobile Clinics',
    commentsCount: 18,
  },
];

export const INITIAL_CATEGORIES: CategoryRecord[] = [
  { id: 'cat-1', name: 'NEWS', slug: 'news', description: 'Hyper-local city and district headlines', totalArticles: 0, status: 'active' },
  { id: 'cat-2', name: 'OUR CITY', slug: 'our-city', description: 'Corporation, water, sanitation, and citizen alerts', totalArticles: 0, status: 'active' },
  { id: 'cat-3', name: 'BUSINESS', slug: 'business', description: 'MSME, textile, engineering, and commerce', totalArticles: 0, status: 'active' },
  { id: 'cat-4', name: 'TECH', slug: 'tech', description: 'IT corridor, EV startups, and SaaS hubs', totalArticles: 0, status: 'active' },
  { id: 'cat-5', name: 'INFRASTRUCTURE', slug: 'infrastructure', description: 'Flyovers, metro rail, bypass corridors, and civic works', totalArticles: 0, status: 'active' },
  { id: 'cat-6', name: 'EVENTS', slug: 'events', description: 'Cultural fests, exhibitions, and weekend events', totalArticles: 0, status: 'active' },
  { id: 'cat-7', name: 'SPORTS', slug: 'sports', description: 'Local tournaments, athletics, and marathons', totalArticles: 0, status: 'active' },
  { id: 'cat-8', name: 'CEO', slug: 'ceos', description: 'Founder interviews and enterprise spotlights', totalArticles: 0, status: 'active' },
  { id: 'cat-9', name: 'EDUCATION', slug: 'education', description: 'Colleges, research universities, and schools', totalArticles: 0, status: 'active' },
  { id: 'cat-10', name: 'E-PAPER', slug: 'e-paper', description: 'Daily print newspaper digital replica edition', totalArticles: 0, status: 'active' },
];

export const INITIAL_USERS: UserRecord[] = [
  { id: 'usr-1', name: 'Althaf Chief Editor', email: 'admin@todayscoimbatore.com', role: 'superadmin', joinedDate: '2025-01-10', status: 'active' },
  { id: 'usr-2', name: 'Covai Urban Bureau', email: 'editor@todayscoimbatore.com', role: 'editor', joinedDate: '2025-02-15', status: 'active' },
  { id: 'usr-3', name: 'Civic Reporter Desk', email: 'civic@todayscoimbatore.com', role: 'reporter', joinedDate: '2025-04-01', status: 'active' },
  { id: 'usr-4', name: 'Commercial Desk', email: 'ads@todayscoimbatore.com', role: 'editor', joinedDate: '2025-06-20', status: 'active' },
];

export const INITIAL_OUTAGES_DB: OutageRecord[] = [
  {
    id: 'out-1',
    area: 'Peelamedu & SITRA',
    substation: '110/22kV SITRA Substation',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeWindow: '09:00 AM – 04:00 PM',
    status: 'scheduled',
    reason: '110kV Substation Line Clearing & Feeder Upgrades',
    affectedStreets: ['Avinashi Rd', 'Hope College', 'PSG Tech Campus', 'SITRA Junction'],
  },
  {
    id: 'out-2',
    area: 'Thudiyalur & Vadavalli',
    substation: '110/33kV North Grid',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeWindow: '09:30 AM – 05:00 PM',
    status: 'scheduled',
    reason: 'Monthly Substation Feeder Maintenance & Tree Trimming',
    affectedStreets: ['Vellakinar', 'GN Mills', 'Udayampalayam', 'Pannimadai'],
  },
  {
    id: 'out-3',
    area: 'Gandhipuram & Saravanampatti',
    substation: '230/110kV Saravanampatti Grid',
    scheduledDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    timeWindow: '09:00 AM – 04:00 PM',
    status: 'scheduled',
    reason: 'HT Line Tree Trimming & Smart Grid Upgrades',
    affectedStreets: ['Cross Cut Road', '100 Feet Road', 'CHIL-SEZ', 'Keeranatham'],
  },
  {
    id: 'out-4',
    area: 'Singanallur & Ondipudur',
    substation: '110/11kV Central Substation',
    scheduledDate: new Date().toISOString().split('T')[0],
    timeWindow: '09:00 AM – 02:00 PM',
    status: 'active',
    reason: 'Transformer Replacement & Distribution Feeder Maintenance',
    affectedStreets: ['Ramanathapuram', 'Trichy Road', 'Nanjundapuram Rd'],
  },
  {
    id: 'out-5',
    area: 'RS Puram & DB Road',
    substation: '110kV West Grid',
    scheduledDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    timeWindow: '09:00 AM – 04:00 PM',
    status: 'scheduled',
    reason: 'Underground Smart Cable Laying',
    affectedStreets: ['TV Swamy Road', 'Cowley Brown Rd', 'Diwan Bahadur Rd'],
  },
];

export const INITIAL_ADS_DB: AdSlotRecord[] = [
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

export const INITIAL_BLOOD_DONORS_DB: BloodDonorRecord[] = [
  {
    id: 'donor-1',
    name: 'Dr. S. K. Vignesh',
    bloodGroup: 'O+',
    area: 'Peelamedu & PSG Tech',
    phone: '+91 98422 12345',
    whatsapp: '+91 98422 12345',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-06-10',
    registeredDate: '2025-01-15',
  },
  {
    id: 'donor-2',
    name: 'K. R. Anand Kumar',
    bloodGroup: 'A+',
    area: 'RS Puram & DB Road',
    phone: '+91 97890 23456',
    whatsapp: '+91 97890 23456',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-05-18',
    registeredDate: '2025-02-20',
  },
  {
    id: 'donor-3',
    name: 'P. Meena Soundararajan',
    bloodGroup: 'B+',
    area: 'Gandhipuram & Cross Cut',
    phone: '+91 98940 34567',
    whatsapp: '+91 98940 34567',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-07-02',
    registeredDate: '2025-03-12',
  },
  {
    id: 'donor-4',
    name: 'M. Naveen Prakash',
    bloodGroup: 'AB+',
    area: 'Saravanampatti IT Park',
    phone: '+91 99440 45678',
    whatsapp: '+91 99440 45678',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-06-25',
    registeredDate: '2025-04-05',
  },
  {
    id: 'donor-5',
    name: 'T. Karthikeyan',
    bloodGroup: 'O-',
    area: 'Thudiyalur & Vadavalli',
    phone: '+91 96290 56789',
    whatsapp: '+91 96290 56789',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-04-14',
    registeredDate: '2025-05-18',
  },
  {
    id: 'donor-6',
    name: 'R. Divya Bharathi',
    bloodGroup: 'A-',
    area: 'Singanallur & Ondipudur',
    phone: '+91 94430 67890',
    whatsapp: '+91 94430 67890',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-05-30',
    registeredDate: '2025-06-22',
  },
  {
    id: 'donor-7',
    name: 'S. Rajesh Kannan',
    bloodGroup: 'B-',
    area: 'Saibaba Colony & NSR Rd',
    phone: '+91 98430 78901',
    whatsapp: '+91 98430 78901',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-07-15',
    registeredDate: '2025-07-01',
  },
  {
    id: 'donor-8',
    name: 'V. Gokulnath',
    bloodGroup: 'AB-',
    area: 'Kuniyamuthur & Sundarapuram',
    phone: '+91 97500 89012',
    whatsapp: '+91 97500 89012',
    isAvailable: true,
    isVerified: true,
    lastDonated: '2026-06-01',
    registeredDate: '2025-08-10',
  },
];

export const INITIAL_EMERGENCY_ALERTS_DB: EmergencyBloodAlert[] = [
  {
    id: 'emg-1',
    patientName: 'Emergency Cardiac Patient ICU-4',
    hospital: 'KG Hospital, Arts College Road, Coimbatore',
    bloodGroup: 'O-',
    unitsNeeded: 2,
    contactNumber: '+91 98422 99999',
    urgency: 'critical',
    postedAt: '15 mins ago',
    isActive: true,
  },
  {
    id: 'emg-2',
    patientName: 'Trauma Care Unit #8',
    hospital: 'Ganga Medical Centre & Hospital, Ram Nagar',
    bloodGroup: 'AB-',
    unitsNeeded: 3,
    contactNumber: '+91 98940 88888',
    urgency: 'immediate',
    postedAt: '45 mins ago',
    isActive: true,
  },
];

export const INITIAL_EVENTS_DB: EventRecord[] = [
  {
    id: 'evt-1',
    title: 'CODISSIA INTEC 2026: International Industrial Machinery & Automation Expo',
    category: 'EXPO',
    date: '2026-09-04',
    time: '10:00 AM – 06:00 PM',
    venue: 'CODISSIA Trade Fair Complex, Halls A to E, Coimbatore',
    mapLink: 'https://maps.google.com/?q=CODISSIA+Trade+Fair+Complex+Coimbatore',
    ticketPrice: 'Free Delegate Entry',
    posterUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    description: 'South India’s largest international industrial machinery exposition showcasing smart robotics, precision manufacturing, EV drivetrains, and IoT automation.',
    organizer: 'CODISSIA Coimbatore',
    registrationLink: 'https://todayscoimbatore.com/events',
    status: 'upcoming',
    featured: true,
  },
  {
    id: 'evt-2',
    title: 'Covai DeepTech & AI Founders Summit 2026',
    category: 'TECH',
    date: '2026-09-12',
    time: '09:30 AM – 05:30 PM',
    venue: 'TIDEL Park Auditorium, Avinashi Road, Peelamedu, Coimbatore',
    mapLink: 'https://maps.google.com/?q=TIDEL+Park+Coimbatore',
    ticketPrice: '₹499 Early Bird',
    posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    description: 'Annual gathering of 500+ SaaS builders, venture capitalists, and tech leaders discussing generative AI workflows, aerospace tooling, and startup scaling.',
    organizer: 'Coimbatore Product Leaders Forum',
    registrationLink: 'https://todayscoimbatore.com/events',
    status: 'upcoming',
    featured: true,
  },
  {
    id: 'evt-3',
    title: 'Kongu Traditional Food & Organic Agri Carnival',
    category: 'CULTURAL',
    date: '2026-09-19',
    time: '11:00 AM – 10:00 PM',
    venue: 'VOC Grounds, Near Central Prison, Gandhipuram, Coimbatore',
    mapLink: 'https://maps.google.com/?q=VOC+Grounds+Coimbatore',
    ticketPrice: '₹50 Entry',
    posterUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    description: 'Over 80 authentic kongu heritage food stalls featuring Arisi Paruppu Sadam, Pallipalayam delicacies, native millet sweets, organic farm produce, and folk music.',
    organizer: 'Coimbatore Agri-Tourism Council',
    registrationLink: 'https://todayscoimbatore.com/events',
    status: 'upcoming',
    featured: false,
  },
  {
    id: 'evt-4',
    title: '14th Annual Coimbatore Half-Marathon for Cancer Care',
    category: 'SPORTS',
    date: '2026-10-04',
    time: '05:30 AM – 10:00 AM',
    venue: 'Race Course Promenade, Near Thomas Park, Coimbatore',
    mapLink: 'https://maps.google.com/?q=Race+Course+Coimbatore',
    ticketPrice: '₹600 Registration',
    posterUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=8V-2Z0m2c0s',
    description: 'Certified 5K, 10K, and 21.1K half-marathon supporting cancer care and hospice infrastructure with over 18,000 runners participating.',
    organizer: 'Coimbatore Cancer Foundation & CCMC',
    registrationLink: 'https://todayscoimbatore.com/events',
    status: 'upcoming',
    featured: true,
  },
  {
    id: 'evt-5',
    title: 'Covai Sangeetha Utsavam 2026: Carnatic & Western Fusion Concert',
    category: 'MUSIC',
    date: '2026-10-18',
    time: '06:00 PM – 09:30 PM',
    venue: 'PSG Tech Convention Centre, Peelamedu, Coimbatore',
    mapLink: 'https://maps.google.com/?q=PSG+Tech+Coimbatore',
    ticketPrice: '₹350 onwards',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    description: 'Enchanting evening of classical Carnatic recitals blended with Western string orchestrations featuring master vocalists and instrumentalists.',
    organizer: 'Rasika Fine Arts Covai',
    registrationLink: 'https://todayscoimbatore.com/events',
    status: 'upcoming',
    featured: false,
  },
];

export interface DirectoryCategoryRecord {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  createdAt?: string;
}

export const INITIAL_DIRECTORY_CATEGORIES: DirectoryCategoryRecord[] = [
  { id: 'cat-1', slug: 'hospitals-clinics', name: 'Hospitals & Clinics', icon: '🏥' },
  { id: 'cat-2', slug: 'textiles-garments', name: 'Textiles & Garments', icon: '🧵' },
  { id: 'cat-3', slug: 'restaurants-cafes', name: 'Restaurants & Cafes', icon: '🍽️' },
  { id: 'cat-4', slug: 'it-software', name: 'IT & Software', icon: '💻' },
  { id: 'cat-5', slug: 'colleges-universities', name: 'Colleges & Universities', icon: '🎓' },
  { id: 'cat-6', slug: 'real-estate', name: 'Real Estate', icon: '🏢' },
  { id: 'cat-7', slug: 'jewellery', name: 'Jewellery', icon: '💎' },
  { id: 'cat-8', slug: 'automobile', name: 'Automobile', icon: '🚗' },
  { id: 'cat-9', slug: 'supermarkets', name: 'Supermarkets', icon: '🛒' },
  { id: 'cat-10', slug: 'hotels', name: 'Hotels', icon: '🏨' },
  { id: 'cat-11', slug: 'salons-spas', name: 'Salons & Spas', icon: '✂️' },
  { id: 'cat-12', slug: 'gyms-fitness', name: 'Gyms & Fitness', icon: '💪' },
  { id: 'cat-13', slug: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'cat-14', slug: 'schools', name: 'Schools', icon: '📚' },
  { id: 'cat-15', slug: 'event-planners', name: 'Event Planners', icon: '🎉' },
  { id: 'cat-16', slug: 'logistics', name: 'Logistics', icon: '🚚' },
  { id: 'cat-17', slug: 'pharmacies', name: 'Pharmacies', icon: '💊' },
  { id: 'cat-18', slug: 'bakeries', name: 'Bakeries', icon: '🥐' },
  { id: 'cat-19', slug: 'furniture', name: 'Furniture', icon: '🛋️' },
  { id: 'cat-20', slug: 'travel-agencies', name: 'Travel Agencies', icon: '✈️' },
];

export interface DirectoryListing {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  icon: string;
  rating: number;
  reviewsCount: number;
  area: string;
  address: string;
  phone: string;
  ownerName?: string;
  email?: string;
  website?: string;
  timing?: string;
  description: string;
  featured?: boolean;
  popular?: boolean;
  verified?: boolean;
  tags?: string[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DirectoryVerificationRecord {
  id: string;
  phone?: string;
  email?: string;
  otpCode: string;
  verifiedAt: string;
  status: 'verified' | 'pending' | 'revoked';
  ipAddress?: string;
  userAgent?: string;
  sourceListingId?: string;
  sourceListingName?: string;
}

export const INITIAL_DIRECTORY_VERIFICATIONS: DirectoryVerificationRecord[] = [];

export interface DirectoryReview {
  id: string;
  listingId: string;
  listingName: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  status: 'approved' | 'pending' | 'rejected';
}

export const INITIAL_DIRECTORY_REVIEWS: DirectoryReview[] = [];

export const INITIAL_DIRECTORY_LISTINGS: DirectoryListing[] = [];

// Production Database Service with Local Persistence & Zero Auto-Deletion
class DatabaseService {
  private articles: Article[] = [...INITIAL_DATABASE_ARTICLES];
  private categories: CategoryRecord[] = [...INITIAL_CATEGORIES];
  private users: UserRecord[] = [...INITIAL_USERS];
  private outages: OutageRecord[] = [...INITIAL_OUTAGES_DB];
  private ads: AdSlotRecord[] = [...INITIAL_ADS_DB];
  private donors: BloodDonorRecord[] = [...INITIAL_BLOOD_DONORS_DB];
  private emergencyAlerts: EmergencyBloodAlert[] = [...INITIAL_EMERGENCY_ALERTS_DB];
  private events: EventRecord[] = [...INITIAL_EVENTS_DB];
  private socialLinks: SocialLinksRecord = { ...INITIAL_SOCIAL_LINKS_DB };
  private enquiries: ContactEnquiryRecord[] = [...INITIAL_CONTACT_ENQUIRIES_DB];
  private directoryListings: DirectoryListing[] = [...INITIAL_DIRECTORY_LISTINGS];
  private directoryCategories: DirectoryCategoryRecord[] = [...INITIAL_DIRECTORY_CATEGORIES];
  private verifications: DirectoryVerificationRecord[] = [...INITIAL_DIRECTORY_VERIFICATIONS];
  private reviews: DirectoryReview[] = [...INITIAL_DIRECTORY_REVIEWS];
  private donorEnquiries: DonorContactRequest[] = [];
  private listeners: Set<() => void> = new Set();
  private isClient = typeof window !== 'undefined';
  private isSyncing = false;
  private lastServerSyncTime = 0;
  private lastEnquiriesSyncTime = 0;

  constructor() {
    this.reloadFromStorage();

    if (this.isClient) {
      // 1. Instant cloud sync on boot for universal multi-device sync
      this.syncWithServer(true);

      // 2. Periodic background poll (every 20s) so common visitors automatically see admin posts
      setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.syncWithServer();
        }
      }, 20000);

      // 3. Fast sync when tab/window gains focus
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncWithServer(true);
        }
      });
      window.addEventListener('focus', () => {
        this.syncWithServer(true);
      });

      // 4. Cross-tab storage listeners
      window.addEventListener('storage', (e) => {
        if (
          e.key &&
          (e.key.startsWith('covai_db_') ||
            e.key.startsWith('tc_directory_') ||
            e.key === 't_covai_articles' ||
            e.key === 'admin_published_articles' ||
            e.key === 'publishedArticles' ||
            e.key === 'news_articles' ||
            e.key === 't_covai_ads' ||
            e.key === 't_covai_outages' ||
            e.key === 't_covai_donors' ||
            e.key === 't_covai_events' ||
            e.key === 't_covai_social_links')
        ) {
          this.reloadFromStorage();
          this.notify();
        }
      });

      window.addEventListener('todayscoimbatore:db-updated', () => {
        this.reloadFromStorage();
        this.notify();
      });
    }
  }

  // Universal cloud synchronization engine with Supabase backend
  public async syncWithServer(force = false): Promise<void> {
    if (!this.isClient) return;
    const now = Date.now();
    if (this.isSyncing) return;
    if (!force && now - this.lastServerSyncTime < 4000) return;

    this.isSyncing = true;
    try {
      const res = await fetch('/api/content?entity=all', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          let changed = false;

          if (Array.isArray(d.articles) && d.articles.length > 0) {
            this.articles = d.articles;
            const dataStr = JSON.stringify(d.articles);
            localStorage.setItem('t_covai_articles', dataStr);
            localStorage.setItem('admin_published_articles', dataStr);
            localStorage.setItem('publishedArticles', dataStr);
            localStorage.setItem('news_articles', dataStr);
            localStorage.setItem('covai_db_articles', dataStr);
            changed = true;
          }

          if (Array.isArray(d.listings) && d.listings.length > 0) {
            this.directoryListings = d.listings;
            const dataStr = JSON.stringify(d.listings);
            localStorage.setItem('tc_directory_listings_v2', dataStr);
            localStorage.setItem('t_covai_directory_v2', dataStr);
            changed = true;
          }

          if (Array.isArray(d.categories) && d.categories.length > 0) {
            this.directoryCategories = d.categories;
            localStorage.setItem('tc_directory_categories_v2', JSON.stringify(d.categories));
            changed = true;
          }

          if (Array.isArray(d.bloodDonors) && d.bloodDonors.length > 0) {
            this.donors = d.bloodDonors;
            const dataStr = JSON.stringify(d.bloodDonors);
            localStorage.setItem('t_covai_donors', dataStr);
            localStorage.setItem('blood_donors', dataStr);
            changed = true;
          }

          if (Array.isArray(d.events) && d.events.length > 0) {
            this.events = d.events;
            const dataStr = JSON.stringify(d.events);
            localStorage.setItem('t_covai_events', dataStr);
            localStorage.setItem('events_db', dataStr);
            changed = true;
          }

          if (Array.isArray(d.outages) && d.outages.length > 0) {
            this.outages = d.outages;
            const dataStr = JSON.stringify(d.outages);
            localStorage.setItem('t_covai_outages', dataStr);
            localStorage.setItem('power_outages', dataStr);
            changed = true;
          }

          if (Array.isArray(d.ads) && d.ads.length > 0) {
            this.ads = d.ads;
            const dataStr = JSON.stringify(d.ads);
            localStorage.setItem('t_covai_ads', dataStr);
            localStorage.setItem('adSlots', dataStr);
            changed = true;
          }

          if (d.socialLinks && typeof d.socialLinks === 'object') {
            this.socialLinks = { ...INITIAL_SOCIAL_LINKS_DB, ...d.socialLinks };
            localStorage.setItem('t_covai_social_links', JSON.stringify(this.socialLinks));
            changed = true;
          }

          if (Array.isArray(d.emergencyAlerts) && d.emergencyAlerts.length > 0) {
            this.emergencyAlerts = d.emergencyAlerts;
            localStorage.setItem('t_covai_emergency_blood', JSON.stringify(d.emergencyAlerts));
            changed = true;
          }

          if (Array.isArray(d.enquiries)) {
            const mappedEnquiries: ContactEnquiryRecord[] = d.enquiries.map((e: any) => ({
              id: e.id,
              name: e.name || e.user_name || 'Anonymous',
              email: e.email || (e.user_phone?.includes('@') ? e.user_phone : ''),
              phone: e.phone || (!e.user_phone?.includes('@') ? e.user_phone : ''),
              subject: e.subject || e.service_requested || 'General Enquiry',
              message: e.message || '',
              status: (e.status?.toLowerCase() === 'pending' ? 'unread' : (e.status?.toLowerCase() || 'unread')) as any,
              createdAt: e.createdAt || e.created_at || new Date().toISOString(),
            }));
            this.enquiries = mappedEnquiries;
            localStorage.setItem('t_covai_enquiries', JSON.stringify(mappedEnquiries));
            localStorage.setItem('covai_db_enquiries', JSON.stringify(mappedEnquiries));
            changed = true;
          }

          if (Array.isArray(d.verifications) && d.verifications.length > 0) {
            this.verifications = d.verifications;
            localStorage.setItem('tc_directory_verifications_v2', JSON.stringify(d.verifications));
          }

          if (Array.isArray(d.reviews) && d.reviews.length > 0) {
            this.reviews = d.reviews;
            localStorage.setItem('tc_directory_reviews_v2', JSON.stringify(d.reviews));
          }

          this.lastServerSyncTime = Date.now();
          if (changed) {
            this.notify();
          }
        }
      }
    } catch (err) {
      console.warn('DatabaseService syncWithServer warning:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  public reloadFromStorage() {
    if (!this.isClient) return;
    try {
      const storedArticles =
        localStorage.getItem('t_covai_articles') ||
        localStorage.getItem('admin_published_articles') ||
        localStorage.getItem('publishedArticles') ||
        localStorage.getItem('news_articles') ||
        localStorage.getItem('covai_db_articles');
      if (storedArticles) {
        const parsed = JSON.parse(storedArticles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.articles = parsed;
        }
      } else {
        localStorage.setItem('t_covai_articles', JSON.stringify(this.articles));
      }

      const storedCategories = localStorage.getItem('covai_db_categories');
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
        }
      }

      const storedUsers = localStorage.getItem('covai_db_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.users = parsed;
        }
      }

      const storedOutages =
        localStorage.getItem('t_covai_outages') ||
        localStorage.getItem('covai_db_outages') ||
        localStorage.getItem('power_outages');
      if (storedOutages) {
        const parsed = JSON.parse(storedOutages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.outages = parsed;
        }
      }

      const storedAds =
        localStorage.getItem('t_covai_ads') ||
        localStorage.getItem('adSlots') ||
        localStorage.getItem('covai_db_ads');
      if (storedAds) {
        const parsed = JSON.parse(storedAds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initial defaults to ensure all 6 placements exist
          const merged = INITIAL_ADS_DB.map((initial) => {
            const found = parsed.find((p: any) => p.id === initial.id || p.slotId === initial.slotId || p.placementKey === initial.placementKey);
            return found ? { ...initial, ...found } : initial;
          });
          this.ads = merged;
        }
      } else {
        localStorage.setItem('t_covai_ads', JSON.stringify(this.ads));
        localStorage.setItem('adSlots', JSON.stringify(this.ads));
      }

      const storedDonors =
        localStorage.getItem('t_covai_donors') ||
        localStorage.getItem('covai_db_donors') ||
        localStorage.getItem('blood_donors');
      if (storedDonors) {
        const parsed = JSON.parse(storedDonors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.donors = parsed;
        }
      }

      const storedEmergencyAlerts =
        localStorage.getItem('t_covai_emergency_blood') ||
        localStorage.getItem('emergency_blood_alerts');
      if (storedEmergencyAlerts) {
        const parsed = JSON.parse(storedEmergencyAlerts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.emergencyAlerts = parsed;
        }
      }

      const storedEvents =
        localStorage.getItem('t_covai_events') ||
        localStorage.getItem('covai_db_events') ||
        localStorage.getItem('events_db');
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.events = parsed;
        }
      }

      const storedSocialLinks =
        localStorage.getItem('t_covai_social_links') ||
        localStorage.getItem('covai_db_social_links');
      if (storedSocialLinks) {
        const parsed = JSON.parse(storedSocialLinks);
        if (parsed && typeof parsed === 'object') {
          this.socialLinks = { ...INITIAL_SOCIAL_LINKS_DB, ...parsed };
        }
      }

      const storedEnquiries =
        localStorage.getItem('t_covai_enquiries') ||
        localStorage.getItem('covai_db_enquiries');
      if (storedEnquiries) {
        const parsed = JSON.parse(storedEnquiries);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.enquiries = parsed;
        }
      }

      const storedDirectory =
        localStorage.getItem('tc_directory_listings_v2') ||
        localStorage.getItem('t_covai_directory_v2');
      if (storedDirectory) {
        try {
          const parsed = JSON.parse(storedDirectory);
          if (Array.isArray(parsed)) {
            const seenIds = new Set<string>();
            const seenKeys = new Set<string>();
            const deduplicated: DirectoryListing[] = [];
            for (const item of parsed) {
              if (item && item.id && !seenIds.has(item.id)) {
                const uniqueKey = `${(item.name || '').trim().toLowerCase()}_${(item.category || '').trim().toLowerCase()}`;
                if (!seenKeys.has(uniqueKey)) {
                  seenIds.add(item.id);
                  seenKeys.add(uniqueKey);
                  deduplicated.push(item);
                }
              }
            }
            this.directoryListings = deduplicated;
          } else {
            this.directoryListings = [];
          }
        } catch (e) {
          this.directoryListings = [];
        }
      } else {
        this.directoryListings = [];
      }

      const storedDirectoryCategories =
        localStorage.getItem('tc_directory_categories_v2') ||
        localStorage.getItem('t_covai_directory_categories_v2');
      if (storedDirectoryCategories) {
        try {
          const parsed = JSON.parse(storedDirectoryCategories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const parsedSlugs = new Set(parsed.map((c: DirectoryCategoryRecord) => c.slug.toLowerCase()));
            const missingInitials = INITIAL_DIRECTORY_CATEGORIES.filter(
              (c) => !parsedSlugs.has(c.slug.toLowerCase())
            );
            this.directoryCategories = [...parsed, ...missingInitials];
          } else {
            this.directoryCategories = [...INITIAL_DIRECTORY_CATEGORIES];
          }
        } catch (e) {
          this.directoryCategories = [...INITIAL_DIRECTORY_CATEGORIES];
        }
      } else {
        this.directoryCategories = [...INITIAL_DIRECTORY_CATEGORIES];
        localStorage.setItem('tc_directory_categories_v2', JSON.stringify(INITIAL_DIRECTORY_CATEGORIES));
      }

      const storedVerifications =
        localStorage.getItem('tc_directory_verifications_v2') ||
        localStorage.getItem('t_covai_directory_verifications_v2');
      if (storedVerifications) {
        const parsed = JSON.parse(storedVerifications);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.verifications = parsed;
        }
      } else {
        localStorage.setItem('tc_directory_verifications_v2', JSON.stringify(INITIAL_DIRECTORY_VERIFICATIONS));
      }

      const storedReviews =
        localStorage.getItem('tc_directory_reviews_v2') ||
        localStorage.getItem('t_covai_directory_reviews_v2');
      if (storedReviews) {
        const parsed = JSON.parse(storedReviews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.reviews = parsed;
        }
      } else {
        localStorage.setItem('tc_directory_reviews_v2', JSON.stringify(INITIAL_DIRECTORY_REVIEWS));
      }

      const storedDonorEnquiries =
        localStorage.getItem('tc_donor_enquiries_v1') ||
        localStorage.getItem('covai_db_donor_enquiries');
      if (storedDonorEnquiries) {
        const parsed = JSON.parse(storedDonorEnquiries);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.donorEnquiries = parsed;
        }
      }
    } catch (e) {
      console.error('Error reloading stored database', e);
    }
  }

  private notifyTimeout: any = null;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.notifyTimeout) clearTimeout(this.notifyTimeout);
    this.notifyTimeout = setTimeout(() => {
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (err) {
          console.error('Listener callback error', err);
        }
      });
    }, 20);
  }

  private persist(table: 'articles' | 'categories' | 'users' | 'outages' | 'ads' | 'donors' | 'emergency_blood' | 'events' | 'social_links' | 'enquiries' | 'directory' | 'directory_categories' | 'verifications' | 'reviews' | 'donor_enquiries') {
    if (!this.isClient) return;
    try {
      if (table === 'articles') {
        const data = JSON.stringify(this.articles);
        localStorage.setItem('t_covai_articles', data);
        localStorage.setItem('admin_published_articles', data);
        localStorage.setItem('publishedArticles', data);
        localStorage.setItem('news_articles', data);
        localStorage.setItem('covai_db_articles', data);
        window.dispatchEvent(new Event('newsStorageUpdate'));
      }
      if (table === 'categories') {
        localStorage.setItem('covai_db_categories', JSON.stringify(this.categories));
      }
      if (table === 'users') {
        localStorage.setItem('covai_db_users', JSON.stringify(this.users));
      }
      if (table === 'outages') {
        const data = JSON.stringify(this.outages);
        localStorage.setItem('t_covai_outages', data);
        localStorage.setItem('covai_db_outages', data);
        localStorage.setItem('power_outages', data);
        window.dispatchEvent(new Event('outagesStorageUpdate'));
      }
      if (table === 'ads') {
        const data = JSON.stringify(this.ads);
        localStorage.setItem('t_covai_ads', data);
        localStorage.setItem('covai_db_ads', data);
        localStorage.setItem('adSlots', data);
        window.dispatchEvent(new Event('adsStorageUpdate'));
      }
      if (table === 'donors') {
        const data = JSON.stringify(this.donors);
        localStorage.setItem('t_covai_donors', data);
        localStorage.setItem('covai_db_donors', data);
        localStorage.setItem('blood_donors', data);
        window.dispatchEvent(new Event('donorsStorageUpdate'));
      }
      if (table === 'emergency_blood') {
        const data = JSON.stringify(this.emergencyAlerts);
        localStorage.setItem('t_covai_emergency_blood', data);
        localStorage.setItem('emergency_blood_alerts', data);
      }
      if (table === 'events') {
        const data = JSON.stringify(this.events);
        localStorage.setItem('t_covai_events', data);
        localStorage.setItem('covai_db_events', data);
        localStorage.setItem('events_db', data);
        window.dispatchEvent(new Event('eventsStorageUpdate'));
      }
      if (table === 'social_links') {
        const data = JSON.stringify(this.socialLinks);
        localStorage.setItem('t_covai_social_links', data);
        localStorage.setItem('covai_db_social_links', data);
      }
      if (table === 'enquiries') {
        const data = JSON.stringify(this.enquiries);
        localStorage.setItem('t_covai_enquiries', data);
        localStorage.setItem('covai_db_enquiries', data);
        window.dispatchEvent(new Event('enquiriesStorageUpdate'));
      }
      if (table === 'directory') {
        const data = JSON.stringify(this.directoryListings);
        localStorage.setItem('tc_directory_listings_v2', data);
        localStorage.setItem('t_covai_directory_v2', data);
        window.dispatchEvent(new Event('directoryStorageUpdate'));
      }
      if (table === 'directory_categories') {
        const data = JSON.stringify(this.directoryCategories);
        localStorage.setItem('tc_directory_categories_v2', data);
        localStorage.setItem('t_covai_directory_categories_v2', data);
      }
      if (table === 'verifications') {
        const data = JSON.stringify(this.verifications);
        localStorage.setItem('tc_directory_verifications_v2', data);
        localStorage.setItem('t_covai_directory_verifications_v2', data);
      }
      if (table === 'reviews') {
        const data = JSON.stringify(this.reviews);
        localStorage.setItem('tc_directory_reviews_v2', data);
        localStorage.setItem('t_covai_directory_reviews_v2', data);
      }
      if (table === 'donor_enquiries') {
        const data = JSON.stringify(this.donorEnquiries);
        localStorage.setItem('tc_donor_enquiries_v1', data);
        localStorage.setItem('covai_db_donor_enquiries', data);
      }

      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table } }));
      this.notify();
    } catch (e) {
      console.error(`Error saving ${table}`, e);
    }
  }

  // Strictly sort: Exclusive stories first (newest to oldest), then non-exclusive stories (newest to oldest)
  public async getArticles(category?: string): Promise<Article[]> {
    this.reloadFromStorage();
    let list = this.articles.filter((a) => a.status !== 'draft');
    if (category && category !== 'ALL') {
      const normCat = category.toUpperCase().trim();
      list = list.filter((a) => a.category?.toUpperCase().trim() === normCat);
    }

    return list.sort((a, b) => {
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
  }

  public async getArticleById(id: string): Promise<Article | undefined> {
    this.reloadFromStorage();
    return this.articles.find((a) => a.id === id);
  }

  public async createArticle(data: Partial<Article>): Promise<Article> {
    const wordCount = ((data.content || '') + ' ' + (data.title || '')).trim().split(/\s+/).filter(Boolean).length;
    const computedReadTime = data.readTime || `${Math.max(1, Math.ceil(wordCount / 130))} min`;
    const resolvedImg = data.imageUrl || data.image || data.mediaUrl;
    const finalImg = resolvedImg && typeof resolvedImg === 'string' && resolvedImg.trim() !== '' && resolvedImg.trim() !== 'null' && resolvedImg.trim() !== 'undefined'
      ? resolvedImg.trim()
      : undefined;

    const slug = data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `news-${Date.now()}`);
    const nowIso = data.createdAt || data.updatedAt || new Date().toISOString();

    const newArticle: Article = {
      id: data.id || `art-${Date.now()}`,
      title: data.title || 'Untitled Coimbatore Story',
      slug: slug,
      category: data.category || 'NEWS',
      subCategory: data.subCategory || 'General',
      subTag: data.subTag || data.category || 'General',
      author: data.author || 'Editorial Bureau',
      readTime: computedReadTime,
      publishedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      isExclusive: !!data.isExclusive,
      status: data.status || 'published',
      mediaType: data.mediaType === 'video' ? 'video' : 'image',
      imageUrl: finalImg,
      image: finalImg,
      mediaUrl: data.mediaType === 'video' ? data.videoUrl : finalImg,
      videoUrl: data.mediaType === 'video' ? data.videoUrl : undefined,
      videoTitle: data.videoTitle || data.title,
      videoDuration: data.videoDuration || '03:00',
      excerpt: data.excerpt || data.content?.slice(0, 180) || 'Coimbatore hyper-local reporting.',
      content: data.content || '',
      highlightStat: data.highlightStat || (data.isExclusive ? 'Spotlight Exclusive' : 'Breaking Story'),
      commentsCount: 0,
      articleHref: `/article/${slug}`,
    };

    this.articles = [newArticle, ...this.articles.filter((a) => a.id !== newArticle.id && a.slug !== newArticle.slug)];
    this.persist('articles');

    // Cloud persistence to Supabase via server API
    if (this.isClient) {
      try {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_article', data: newArticle }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const canonical = json.data as Article;
            this.articles = [canonical, ...this.articles.filter((a) => a.id !== newArticle.id && a.slug !== newArticle.slug && a.id !== canonical.id)];
            this.persist('articles');
          }
        }
      } catch (e) {
        console.error('Failed to sync new article to Supabase:', e);
      }
    }

    return newArticle;
  }

  public async updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
    const idx = this.articles.findIndex((a) => a.id === id || a.slug === id);
    if (idx === -1) return null;

    const resolvedImg = updates.imageUrl !== undefined ? updates.imageUrl : updates.image !== undefined ? updates.image : updates.mediaUrl !== undefined ? updates.mediaUrl : this.articles[idx].imageUrl;
    const finalImg = resolvedImg && typeof resolvedImg === 'string' && resolvedImg.trim() !== '' && resolvedImg.trim() !== 'null' && resolvedImg.trim() !== 'undefined'
      ? resolvedImg.trim()
      : undefined;

    const nowIso = updates.updatedAt || new Date().toISOString();

    this.articles[idx] = {
      ...this.articles[idx],
      ...updates,
      updatedAt: nowIso,
      createdAt: updates.createdAt || this.articles[idx].createdAt || nowIso,
      publishedAt: nowIso,
      isExclusive: updates.isExclusive !== undefined ? !!updates.isExclusive : this.articles[idx].isExclusive,
      imageUrl: updates.mediaType === 'image' || updates.imageUrl !== undefined || updates.image !== undefined ? finalImg : this.articles[idx].imageUrl,
      image: updates.mediaType === 'image' || updates.imageUrl !== undefined || updates.image !== undefined ? finalImg : this.articles[idx].image,
      mediaUrl: updates.mediaType === 'video' ? (updates.videoUrl || this.articles[idx].videoUrl) : finalImg,
      videoUrl: updates.mediaType === 'video' ? (updates.videoUrl || this.articles[idx].videoUrl) : this.articles[idx].videoUrl,
      highlightStat: updates.isExclusive ? 'Spotlight Exclusive' : (updates.highlightStat || this.articles[idx].highlightStat),
    };
    this.persist('articles');

    // Cloud persistence to Supabase via server API
    if (this.isClient) {
      try {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_article', id, data: this.articles[idx] }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            this.articles[idx] = {
              ...this.articles[idx],
              ...json.data,
              updatedAt: nowIso,
              createdAt: this.articles[idx].createdAt || nowIso,
            };
            this.persist('articles');
          }
        }
      } catch (e) {
        console.error('Failed to sync updated article to Supabase:', e);
      }
    }

    return this.articles[idx];
  }

  public async deleteArticle(id: string): Promise<boolean> {
    const beforeCount = this.articles.length;
    this.articles = this.articles.filter((a) => a.id !== id && a.slug !== id);
    this.persist('articles');

    // Cloud persistence to Supabase via server API
    if (this.isClient) {
      try {
        await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_article', id }),
        });
      } catch (e) {
        console.error('Failed to sync deleted article to Supabase:', e);
      }
    }

    return this.articles.length < beforeCount;
  }

  public async getDraftArticles(): Promise<Article[]> {
    if (this.isClient) {
      try {
        const res = await fetch('/api/content?entity=articles&status=draft');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch draft articles from server:', e);
      }
    }
    this.reloadFromStorage();
    return this.articles.filter((a) => a.status === 'draft');
  }

  public async approveArticle(id: string): Promise<boolean> {
    if (this.isClient) {
      try {
        const res = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve_article', id }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const nowIso = new Date().toISOString();
            const idx = this.articles.findIndex((a) => a.id === id || a.slug === id);
            if (idx !== -1) {
              this.articles[idx].status = 'published';
              this.articles[idx].createdAt = nowIso;
              this.articles[idx].publishedAt = nowIso;
              this.articles[idx].updatedAt = nowIso;
              this.persist('articles');
            }
            return true;
          }
        }
      } catch (e) {
        console.error('Failed to approve article:', e);
      }
    }
    return false;
  }

  // Categories CRUD
  public async getCategories(): Promise<CategoryRecord[]> {
    this.reloadFromStorage();
    return this.categories.map((c) => {
      const targetName = (c.name || '').toLowerCase().trim();
      const targetSlug = (c.slug || '').toLowerCase().replace('/', '').trim();
      const cleanTargetSlug = targetSlug.replace(/-/g, ' ');
      const normCat = (cat: string) => cat.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normTargetName = normCat(targetName);
      const normTargetSlug = normCat(targetSlug);

      const count = this.articles.filter((a) => {
        const cat = (a.category || '').toLowerCase().trim();
        const subCat = (a.subCategory || '').toLowerCase().trim();
        const normA = normCat(cat);

        if (
          cat === targetName ||
          cat === targetSlug ||
          cat === cleanTargetSlug ||
          normA === normTargetName ||
          normA === normTargetSlug
        ) {
          return true;
        }
        if (targetSlug === 'infrastructure' || targetName === 'infrastructure') {
          return cat.includes('infra') || subCat.includes('infrastructure');
        }
        if (targetSlug === 'our-city' || targetName === 'our city') {
          return cat.includes('city') || cat.includes('civic');
        }
        if (targetSlug === 'ceos' || targetName === 'ceo') {
          return cat.includes('ceo') || cat.includes('founder');
        }
        return false;
      }).length;

      return {
        ...c,
        totalArticles: count,
      };
    });
  }

  public async deleteCategory(id: string): Promise<boolean> {
    this.categories = this.categories.filter((c) => c.id !== id);
    this.persist('categories');
    return true;
  }

  // Users CRUD
  public async getUsers(): Promise<UserRecord[]> {
    return [...this.users];
  }

  public async deleteUser(id: string): Promise<boolean> {
    this.users = this.users.filter((u) => u.id !== id);
    this.persist('users');
    return true;
  }

  // Outages CRUD
  public async getPowerOutages(): Promise<OutageRecord[]> {
    this.reloadFromStorage();
    return [...this.outages];
  }

  public async savePowerOutages(outages: OutageRecord[]): Promise<boolean> {
    this.outages = [...outages];
    this.persist('outages');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'outages', data: this.outages }),
      }).catch((e) => console.error('Failed to sync outages to server:', e));
    }
    return true;
  }

  public async createPowerOutage(outage: OutageRecord): Promise<OutageRecord> {
    this.reloadFromStorage();
    this.outages.unshift(outage);
    this.persist('outages');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'outages', data: this.outages }),
      }).catch((e) => console.error('Failed to sync outages to server:', e));
    }
    return outage;
  }

  public async updatePowerOutage(id: string, updates: Partial<OutageRecord>): Promise<OutageRecord | null> {
    this.reloadFromStorage();
    let updated: OutageRecord | null = null;
    this.outages = this.outages.map((o) => {
      if (o.id === id) {
        updated = { ...o, ...updates };
        return updated;
      }
      return o;
    });
    if (updated) {
      this.persist('outages');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', entity: 'outages', data: this.outages }),
        }).catch((e) => console.error('Failed to sync outages to server:', e));
      }
    }
    return updated;
  }

  public async deleteOutage(id: string): Promise<boolean> {
    this.reloadFromStorage();
    this.outages = this.outages.filter((o) => o.id !== id);
    this.persist('outages');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'outages', data: this.outages }),
      }).catch((e) => console.error('Failed to sync outages to server:', e));
    }
    return true;
  }

  // Ad Slots CRUD
  public async getAdSlots(): Promise<AdSlotRecord[]> {
    this.reloadFromStorage();
    return [...this.ads];
  }

  public async getAds(): Promise<AdSlotRecord[]> {
    return this.getAdSlots();
  }

  public async getAdSlotByPlacement(placementKey: string): Promise<AdSlotRecord | undefined> {
    this.reloadFromStorage();
    const keyNorm = (placementKey || '').toUpperCase().trim();
    return this.ads.find(
      (a) =>
        (a.placementKey && a.placementKey.toUpperCase().trim() === keyNorm) ||
        (a.slotId && a.slotId.toUpperCase().trim() === keyNorm) ||
        (a.id && a.id.toUpperCase().trim() === keyNorm)
    );
  }

  public async updateAdSlot(id: string, updates: Partial<AdSlotRecord>): Promise<AdSlotRecord | null> {
    this.reloadFromStorage();
    let updated: AdSlotRecord | null = null;
    this.ads = this.ads.map((ad) => {
      if (ad.id === id || ad.slotId === id || ad.placementKey === id) {
        updated = { ...ad, ...updates };
        return updated;
      }
      return ad;
    });

    if (updated) {
      this.persist('ads');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', entity: 'ads', data: this.ads }),
        }).catch((e) => console.error('Failed to sync ads to server:', e));
      }
    }
    return updated;
  }

  public async saveAdSlots(slots: AdSlotRecord[]): Promise<boolean> {
    this.ads = [...slots];
    this.persist('ads');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'ads', data: this.ads }),
      }).catch((e) => console.error('Failed to sync ads to server:', e));
    }
    return true;
  }

  public async deleteAdSlot(id: string): Promise<boolean> {
    this.ads = this.ads.filter((a) => a.id !== id);
    this.persist('ads');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'ads', data: this.ads }),
      }).catch((e) => console.error('Failed to sync ads to server:', e));
    }
    return true;
  }

  // Blood Donors CRUD
  public async getBloodDonors(): Promise<BloodDonorRecord[]> {
    this.reloadFromStorage();
    return [...this.donors];
  }

  public async saveBloodDonors(donors: BloodDonorRecord[]): Promise<boolean> {
    this.donors = [...donors];
    this.persist('donors');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'blood_donors', data: this.donors }),
      }).catch((e) => console.error('Failed to sync blood donors to server:', e));
    }
    return true;
  }

  public async createBloodDonor(donor: BloodDonorRecord): Promise<BloodDonorRecord> {
    this.reloadFromStorage();
    this.donors.unshift(donor);
    this.persist('donors');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_blood_donor', data: donor }),
      }).catch((e) => console.error('Failed to sync blood donor to server:', e));
    }
    return donor;
  }

  public async getApprovedBloodDonors(): Promise<BloodDonorRecord[]> {
    this.reloadFromStorage();
    return this.donors.filter((d) => d.status === 'approved' || (d.isVerified && d.status !== 'pending' && d.status !== 'rejected'));
  }

  public async approveBloodDonor(id: string): Promise<boolean> {
    this.reloadFromStorage();
    let found = false;
    this.donors = this.donors.map((d) => {
      if (d.id === id) {
        found = true;
        return { ...d, status: 'approved', isVerified: true };
      }
      return d;
    });
    if (found) {
      this.persist('donors');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_blood_donor', id, data: { status: 'Available' } }),
        }).catch((e) => console.error('Failed to approve donor on server:', e));
      }
    }
    return found;
  }

  public async rejectBloodDonor(id: string): Promise<boolean> {
    this.reloadFromStorage();
    let found = false;
    this.donors = this.donors.map((d) => {
      if (d.id === id) {
        found = true;
        return { ...d, status: 'rejected', isVerified: false };
      }
      return d;
    });
    if (found) {
      this.persist('donors');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_blood_donor', id, data: { status: 'Unavailable' } }),
        }).catch((e) => console.error('Failed to reject donor on server:', e));
      }
    }
    return found;
  }

  public async updateBloodDonor(id: string, updates: Partial<BloodDonorRecord>): Promise<BloodDonorRecord | null> {
    this.reloadFromStorage();
    let updated: BloodDonorRecord | null = null;
    this.donors = this.donors.map((d) => {
      if (d.id === id) {
        updated = { ...d, ...updates };
        return updated;
      }
      return d;
    });
    if (updated) {
      this.persist('donors');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_blood_donor', id, data: updates }),
        }).catch((e) => console.error('Failed to update donor on server:', e));
      }
    }
    return updated;
  }

  public async deleteBloodDonor(id: string): Promise<boolean> {
    this.reloadFromStorage();
    this.donors = this.donors.filter((d) => d.id !== id);
    this.persist('donors');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_blood_donor', id }),
      }).catch((e) => console.error('Failed to delete donor on server:', e));
    }
    return true;
  }

  // Emergency Blood Alerts CRUD
  public async getEmergencyBloodAlerts(): Promise<EmergencyBloodAlert[]> {
    this.reloadFromStorage();
    return [...this.emergencyAlerts];
  }

  public async saveEmergencyBloodAlerts(alerts: EmergencyBloodAlert[]): Promise<boolean> {
    this.emergencyAlerts = [...alerts];
    this.persist('emergency_blood');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'emergency_blood', data: this.emergencyAlerts }),
      }).catch((e) => console.error('Failed to sync emergency alerts to server:', e));
    }
    return true;
  }

  public async createEmergencyBloodAlert(alert: EmergencyBloodAlert): Promise<EmergencyBloodAlert> {
    this.reloadFromStorage();
    this.emergencyAlerts.unshift(alert);
    this.persist('emergency_blood');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'emergency_blood', data: this.emergencyAlerts }),
      }).catch((e) => console.error('Failed to sync emergency alerts to server:', e));
    }
    return alert;
  }

  public async updateEmergencyBloodAlert(id: string, updates: Partial<EmergencyBloodAlert>): Promise<EmergencyBloodAlert | null> {
    this.reloadFromStorage();
    let updated: EmergencyBloodAlert | null = null;
    this.emergencyAlerts = this.emergencyAlerts.map((a) => {
      if (a.id === id) {
        updated = { ...a, ...updates };
        return updated;
      }
      return a;
    });
    if (updated) {
      this.persist('emergency_blood');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', entity: 'emergency_blood', data: this.emergencyAlerts }),
        }).catch((e) => console.error('Failed to sync emergency alerts to server:', e));
      }
    }
    return updated;
  }

  public async deleteEmergencyBloodAlert(id: string): Promise<boolean> {
    this.reloadFromStorage();
    this.emergencyAlerts = this.emergencyAlerts.filter((a) => a.id !== id);
    this.persist('emergency_blood');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'emergency_blood', data: this.emergencyAlerts }),
      }).catch((e) => console.error('Failed to sync emergency alerts to server:', e));
    }
    return true;
  }

  // Donor Contact Enquiries CRUD
  public async getDonorContactRequests(): Promise<DonorContactRequest[]> {
    if (this.isClient) {
      try {
        const res = await fetch('/api/blood-donors/enquiry', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            this.donorEnquiries = data;
            return data;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from /api/blood-donors/enquiry, falling back to storage:', err);
      }
    }
    this.reloadFromStorage();
    return [...this.donorEnquiries];
  }

  public async saveDonorContactRequest(req: Partial<DonorContactRequest>): Promise<DonorContactRequest> {
    if (this.isClient) {
      try {
        const res = await fetch('/api/blood-donors/enquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.enquiry) {
            this.donorEnquiries.unshift(result.enquiry);
            this.persist('donor_enquiries');
            return result.enquiry;
          }
        }
      } catch (err) {
        console.warn('Failed to post to /api/blood-donors/enquiry, saving locally:', err);
      }
    }
    const newEnquiry: DonorContactRequest = {
      id: req.id || `req-${Date.now()}`,
      donorId: req.donorId,
      donorName: req.donorName,
      donorPhone: req.donorPhone,
      donorBloodGroup: req.donorBloodGroup,
      patientName: req.patientName || 'Anonymous',
      hospital: req.hospital || 'Coimbatore',
      bloodGroup: req.bloodGroup || 'O+',
      units: req.units || 1,
      contactPhone: req.contactPhone || '',
      urgency: req.urgency || 'Emergency',
      notes: req.notes,
      status: req.status || 'Pending',
      createdAt: new Date().toISOString(),
    };
    this.reloadFromStorage();
    this.donorEnquiries.unshift(newEnquiry);
    this.persist('donor_enquiries');
    return newEnquiry;
  }

  public async updateDonorContactRequestStatus(id: string, status: 'Pending' | 'Verified' | 'Fulfilled'): Promise<boolean> {
    if (this.isClient) {
      try {
        await fetch('/api/blood-donors/enquiry', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
      } catch (err) {
        console.warn('Failed to PUT to /api/blood-donors/enquiry:', err);
      }
    }
    this.reloadFromStorage();
    let updated = false;
    this.donorEnquiries = this.donorEnquiries.map((item) => {
      if (item.id === id) {
        updated = true;
        return { ...item, status };
      }
      return item;
    });
    if (updated) this.persist('donor_enquiries');
    return updated;
  }

  public async deleteDonorContactRequest(id: string): Promise<boolean> {
    if (this.isClient) {
      try {
        await fetch(`/api/blood-donors/enquiry?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Failed to DELETE from /api/blood-donors/enquiry:', err);
      }
    }
    this.reloadFromStorage();
    this.donorEnquiries = this.donorEnquiries.filter((item) => item.id !== id);
    this.persist('donor_enquiries');
    return true;
  }

  // Events CRUD
  public async getEvents(): Promise<EventRecord[]> {
    this.reloadFromStorage();
    return [...this.events];
  }

  public async saveEvents(events: EventRecord[]): Promise<boolean> {
    this.events = [...events];
    this.persist('events');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'events', data: this.events }),
      }).catch((e) => console.error('Failed to sync events to server:', e));
    }
    return true;
  }

  public async createEvent(event: EventRecord): Promise<EventRecord> {
    this.reloadFromStorage();
    this.events.unshift(event);
    this.persist('events');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_event', data: event }),
      }).catch((e) => console.error('Failed to sync event to server:', e));
    }
    return event;
  }

  public async updateEvent(id: string, updates: Partial<EventRecord>): Promise<EventRecord | null> {
    this.reloadFromStorage();
    let updated: EventRecord | null = null;
    this.events = this.events.map((e) => {
      if (e.id === id) {
        updated = { ...e, ...updates };
        return updated;
      }
      return e;
    });
    if (updated) {
      this.persist('events');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_event', id, data: updates }),
        }).catch((e) => console.error('Failed to update event on server:', e));
      }
    }
    return updated;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    this.reloadFromStorage();
    this.events = this.events.filter((e) => e.id !== id);
    this.persist('events');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_event', id }),
      }).catch((e) => console.error('Failed to delete event on server:', e));
    }
    return true;
  }

  // Social Links Methods
  public async getSocialLinks(): Promise<SocialLinksRecord> {
    this.reloadFromStorage();
    return { ...this.socialLinks };
  }

  public async saveSocialLinks(links: Partial<SocialLinksRecord>): Promise<SocialLinksRecord> {
    this.reloadFromStorage();
    this.socialLinks = { ...this.socialLinks, ...links };
    this.persist('social_links');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', entity: 'social_links', data: this.socialLinks }),
      }).catch((e) => console.error('Failed to sync social links to server:', e));
    }
    return { ...this.socialLinks };
  }

  public async getContactEnquiries(): Promise<ContactEnquiryRecord[]> {
    this.reloadFromStorage();
    const now = Date.now();
    if (this.isClient && now - this.lastEnquiriesSyncTime > 15000) {
      this.lastEnquiriesSyncTime = now;
      fetch('/api/content?entity=enquiries', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped: ContactEnquiryRecord[] = json.data.map((e: any) => ({
              id: e.id,
              name: e.name || e.user_name || 'Anonymous',
              email: e.email || (e.user_phone?.includes('@') ? e.user_phone : ''),
              phone: e.phone || (!e.user_phone?.includes('@') ? e.user_phone : ''),
              subject: e.subject || e.service_requested || 'General Enquiry',
              message: e.message || '',
              status: (e.status?.toLowerCase() === 'pending' ? 'unread' : (e.status?.toLowerCase() || 'unread')) as any,
              createdAt: e.createdAt || e.created_at || new Date().toISOString(),
            }));
            const currentStr = JSON.stringify(this.enquiries);
            const nextStr = JSON.stringify(mapped);
            if (currentStr !== nextStr) {
              this.enquiries = mapped;
              localStorage.setItem('t_covai_enquiries', nextStr);
              localStorage.setItem('covai_db_enquiries', nextStr);
              window.dispatchEvent(new Event('enquiriesStorageUpdate'));
            }
          }
        })
        .catch(() => {});
    }
    return [...this.enquiries];
  }

  public async saveContactEnquiry(data: Omit<ContactEnquiryRecord, 'id' | 'createdAt' | 'status'>): Promise<ContactEnquiryRecord> {
    this.reloadFromStorage();
    const newEnquiry: ContactEnquiryRecord = {
      ...data,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'unread',
    };
    this.enquiries = [newEnquiry, ...this.enquiries];
    this.persist('enquiries');

    if (this.isClient) {
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          subject: data.subject || 'Contact Form',
          message: data.message,
        }),
      }).catch((e) => console.error('Failed to sync enquiry to /api/contact:', e));
    }
    return newEnquiry;
  }

  public async updateContactEnquiryStatus(id: string, status: ContactEnquiryRecord['status']): Promise<ContactEnquiryRecord | null> {
    this.reloadFromStorage();
    let updated: ContactEnquiryRecord | null = null;
    this.enquiries = this.enquiries.map((e) => {
      if (e.id === id) {
        updated = { ...e, status };
        return updated;
      }
      return e;
    });
    if (updated) {
      this.persist('enquiries');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_enquiry_status', id, data: { status } }),
        }).catch((e) => console.error('Failed to update enquiry status on server:', e));
      }
    }
    return updated;
  }

  public async deleteContactEnquiry(id: string): Promise<boolean> {
    this.reloadFromStorage();
    const before = this.enquiries.length;
    this.enquiries = this.enquiries.filter((e) => e.id !== id);
    this.persist('enquiries');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_enquiry', id }),
      }).catch((e) => console.error('Failed to delete enquiry on server:', e));
    }
    return this.enquiries.length < before;
  }

  // Directory Listings CRUD
  public async getDirectoryListings(): Promise<DirectoryListing[]> {
    this.reloadFromStorage();
    if (this.isClient) {
      // Perform fast asynchronous background fetch without freezing UI
      fetch('/api/directory', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            const currentJson = JSON.stringify(this.directoryListings);
            const newJson = JSON.stringify(data);
            if (currentJson !== newJson) {
              this.directoryListings = data;
              this.persist('directory');
              this.notify();
            }
          }
        })
        .catch((err) => {
          console.warn('Background sync with /api/directory:', err);
        });
    }
    return [...this.directoryListings];
  }

  public async getDirectoryListingById(id: string): Promise<DirectoryListing | null> {
    this.reloadFromStorage();
    return this.directoryListings.find((d) => d.id === id) || null;
  }

  public async saveDirectoryListing(listing: DirectoryListing): Promise<DirectoryListing> {
    this.reloadFromStorage();
    const newRecord: DirectoryListing = {
      ...listing,
      id: listing.id || `dir-${Date.now()}`,
      createdAt: listing.createdAt || new Date().toISOString(),
    };

    // Deduplicate: replace existing if matching ID or (name + category)
    const normalizedKey = `${(newRecord.name || '').trim().toLowerCase()}_${(newRecord.category || '').trim().toLowerCase()}`;
    const existingIndex = this.directoryListings.findIndex(
      (d) =>
        d.id === newRecord.id ||
        `${(d.name || '').trim().toLowerCase()}_${(d.category || '').trim().toLowerCase()}` === normalizedKey
    );

    if (existingIndex >= 0) {
      this.directoryListings[existingIndex] = { ...this.directoryListings[existingIndex], ...newRecord };
    } else {
      this.directoryListings.unshift(newRecord);
    }

    if (newRecord.category) {
      const rawSlug = newRecord.categorySlug || newRecord.category;
      const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const exists = this.directoryCategories.some(
        (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === newRecord.category.toLowerCase()
      );
      if (!exists) {
        this.directoryCategories.push({
          id: `cat-${slug}`,
          name: newRecord.category,
          slug: slug,
          icon: newRecord.icon || '🏢',
          createdAt: new Date().toISOString(),
        });
        this.persist('directory_categories');
      }
    }

    this.persist('directory');

    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_listing', data: newRecord }),
      }).catch((e) => console.error('Failed to sync listing to server:', e));
    }

    return newRecord;
  }

  public async updateDirectoryListing(id: string, updates: Partial<DirectoryListing>): Promise<DirectoryListing | null> {
    this.reloadFromStorage();
    let updatedRecord: DirectoryListing | null = null;
    this.directoryListings = this.directoryListings.map((item) => {
      if (item.id === id) {
        updatedRecord = { ...item, ...updates };
        return updatedRecord;
      }
      return item;
    });
    if (updatedRecord) {
      this.persist('directory');
      if (this.isClient) {
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_listing', id, data: updates }),
        }).catch((e) => console.error('Failed to update listing on server:', e));
      }
    }
    return updatedRecord;
  }

  public async deleteDirectoryListing(id: string): Promise<boolean> {
    this.reloadFromStorage();
    const before = this.directoryListings.length;
    this.directoryListings = this.directoryListings.filter((d) => d.id !== id);
    this.persist('directory');
    if (this.isClient) {
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_listing', id }),
      }).catch((e) => console.error('Failed to delete listing on server:', e));
    }
    return this.directoryListings.length < before;
  }

  public async toggleFeaturedDirectory(id: string): Promise<boolean> {
    this.reloadFromStorage();
    let found = false;
    this.directoryListings = this.directoryListings.map((item) => {
      if (item.id === id) {
        found = true;
        return { ...item, featured: !item.featured };
      }
      return item;
    });
    if (found) {
      this.persist('directory');
      if (this.isClient) {
        try {
          await fetch('/api/directory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_featured', id }),
          });
        } catch (err) {
          console.error('Failed to toggle featured on /api/directory:', err);
        }
      }
    }
    return found;
  }

  public async togglePopularDirectory(id: string): Promise<boolean> {
    this.reloadFromStorage();
    let found = false;
    this.directoryListings = this.directoryListings.map((item) => {
      if (item.id === id) {
        found = true;
        return { ...item, popular: !item.popular };
      }
      return item;
    });
    if (found) {
      this.persist('directory');
      if (this.isClient) {
        try {
          await fetch('/api/directory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_popular', id }),
          });
        } catch (err) {
          console.error('Failed to toggle popular on /api/directory:', err);
        }
      }
    }
    return found;
  }

  // Directory Categories Master CRUD
  public async getDirectoryCategories(): Promise<DirectoryCategoryRecord[]> {
    this.reloadFromStorage();
    const existingSlugs = new Set(this.directoryCategories.map((c) => c.slug.toLowerCase()));
    const dynamicFromListings: DirectoryCategoryRecord[] = [];
    this.directoryListings.forEach((listing) => {
      const rawSlug = listing.categorySlug || listing.category || '';
      const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (slug && !existingSlugs.has(slug)) {
        existingSlugs.add(slug);
        dynamicFromListings.push({
          id: `cat-${slug}`,
          slug: slug,
          name: listing.category || rawSlug,
          icon: listing.icon || '🏢',
          createdAt: listing.createdAt || new Date().toISOString(),
        });
      }
    });

    return [...this.directoryCategories, ...dynamicFromListings];
  }

  public async saveDirectoryCategory(data: { name: string; slug?: string; icon?: string }): Promise<DirectoryCategoryRecord> {
    this.reloadFromStorage();
    const slug = data.slug || data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const existingIndex = this.directoryCategories.findIndex(
      (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === data.name.toLowerCase().trim()
    );
    if (existingIndex !== -1) {
      return this.directoryCategories[existingIndex];
    }
    const newCategory: DirectoryCategoryRecord = {
      id: `cat-${Date.now()}`,
      name: data.name.trim(),
      slug: slug,
      icon: data.icon || '🏢',
      createdAt: new Date().toISOString(),
    };
    this.directoryCategories.push(newCategory);
    this.persist('directory_categories');
    return newCategory;
  }

  public async deleteDirectoryCategory(id: string): Promise<boolean> {
    this.reloadFromStorage();
    const before = this.directoryCategories.length;
    this.directoryCategories = this.directoryCategories.filter((c) => c.id !== id && c.slug !== id);
    this.persist('directory_categories');
    return this.directoryCategories.length < before;
  }

  // Directory Verifications CRUD
  public async getDirectoryVerifications(): Promise<DirectoryVerificationRecord[]> {
    this.reloadFromStorage();
    return [...this.verifications];
  }

  public async saveDirectoryVerification(record: Partial<DirectoryVerificationRecord>): Promise<DirectoryVerificationRecord> {
    this.reloadFromStorage();
    const newRecord: DirectoryVerificationRecord = {
      id: record.id || `ver-${Date.now()}`,
      phone: record.phone,
      email: record.email,
      otpCode: record.otpCode || Math.floor(100000 + Math.random() * 900000).toString(),
      verifiedAt: record.verifiedAt || new Date().toISOString(),
      status: record.status || 'verified',
      ipAddress: record.ipAddress || '127.0.0.1 (Local Verified)',
      userAgent: record.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client'),
      sourceListingId: record.sourceListingId,
      sourceListingName: record.sourceListingName,
    };
    this.verifications.unshift(newRecord);
    this.persist('verifications');
    return newRecord;
  }

  public async deleteDirectoryVerification(id: string): Promise<boolean> {
    this.reloadFromStorage();
    const before = this.verifications.length;
    this.verifications = this.verifications.filter((v) => v.id !== id);
    this.persist('verifications');
    return this.verifications.length < before;
  }

  public async toggleDirectoryVerificationStatus(id: string): Promise<boolean> {
    this.reloadFromStorage();
    let found = false;
    this.verifications = this.verifications.map((item) => {
      if (item.id === id) {
        found = true;
        return {
          ...item,
          status: item.status === 'verified' ? 'revoked' : 'verified',
        };
      }
      return item;
    });
    if (found) this.persist('verifications');
    return found;
  }

  // Directory Reviews & Dynamic Rating Calculation CRUD
  public async getDirectoryReviews(): Promise<DirectoryReview[]> {
    this.reloadFromStorage();
    return [...this.reviews];
  }

  public async getReviewsForListing(listingId: string): Promise<DirectoryReview[]> {
    this.reloadFromStorage();
    return this.reviews.filter((r) => r.listingId === listingId && r.status === 'approved');
  }

  public async saveDirectoryReview(
    review: Omit<DirectoryReview, 'id' | 'createdAt' | 'status'> & {
      id?: string;
      createdAt?: string;
      status?: DirectoryReview['status'];
    }
  ): Promise<DirectoryReview> {
    this.reloadFromStorage();
    const newReview: DirectoryReview = {
      id: review.id || `rev-${Date.now()}`,
      listingId: review.listingId,
      listingName: review.listingName,
      userName: review.userName.trim(),
      userPhone: review.userPhone?.trim() || undefined,
      userEmail: review.userEmail?.trim() || undefined,
      rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
      comment: review.comment.trim(),
      createdAt: review.createdAt || new Date().toISOString(),
      status: review.status || 'approved',
    };

    this.reviews.unshift(newReview);
    this.persist('reviews');

    // Dynamic Real-Time Recalculation for target listing
    const targetListingIndex = this.directoryListings.findIndex((d) => d.id === review.listingId);
    if (targetListingIndex !== -1) {
      const listing = this.directoryListings[targetListingIndex];
      const prevRating = Number(listing.rating) || 4.8;
      const prevCount = Number(listing.reviewsCount) || 10;

      const newCount = prevCount + 1;
      const newRating = Number(((prevRating * prevCount + newReview.rating) / newCount).toFixed(1));

      this.directoryListings[targetListingIndex] = {
        ...listing,
        rating: newRating,
        reviewsCount: newCount,
      };
      this.persist('directory');
    }

    return newReview;
  }

  public async deleteDirectoryReview(id: string): Promise<boolean> {
    this.reloadFromStorage();
    const targetReview = this.reviews.find((r) => r.id === id);
    if (!targetReview) return false;

    this.reviews = this.reviews.filter((r) => r.id !== id);
    this.persist('reviews');

    // Adjust target listing rating backwards if review was approved
    if (targetReview.status === 'approved') {
      const targetListingIndex = this.directoryListings.findIndex((d) => d.id === targetReview.listingId);
      if (targetListingIndex !== -1) {
        const listing = this.directoryListings[targetListingIndex];
        const currentRating = Number(listing.rating) || 4.8;
        const currentCount = Number(listing.reviewsCount) || 1;

        if (currentCount > 1) {
          const newCount = currentCount - 1;
          const newRating = Math.max(
            1,
            Math.min(5, Number(((currentRating * currentCount - targetReview.rating) / newCount).toFixed(1)))
          );
          this.directoryListings[targetListingIndex] = {
            ...listing,
            rating: newRating,
            reviewsCount: newCount,
          };
        }
        this.persist('directory');
      }
    }

    return true;
  }

  public async toggleDirectoryReviewStatus(id: string): Promise<boolean> {
    this.reloadFromStorage();
    let found = false;
    this.reviews = this.reviews.map((r) => {
      if (r.id === id) {
        found = true;
        return {
          ...r,
          status: r.status === 'approved' ? 'rejected' : 'approved',
        };
      }
      return r;
    });
    if (found) this.persist('reviews');
    return found;
  }

  // CSV Export Helper
  public exportTableToCsv(
    tableName:
      | 'articles'
      | 'categories'
      | 'power_outages'
      | 'users'
      | 'ad_slots'
      | 'donors'
      | 'events'
      | 'enquiries'
      | 'directory'
      | 'verifications'
      | 'reviews'
  ): string {
    let data: any[] = [];
    if (tableName === 'articles') data = this.articles;
    if (tableName === 'categories') data = this.categories;
    if (tableName === 'power_outages') data = this.outages;
    if (tableName === 'users') data = this.users;
    if (tableName === 'ad_slots') data = this.ads;
    if (tableName === 'donors') data = this.donors;
    if (tableName === 'events') data = this.events;
    if (tableName === 'enquiries') data = this.enquiries;
    if (tableName === 'directory') data = this.directoryListings;
    if (tableName === 'verifications') data = this.verifications;
    if (tableName === 'reviews') data = this.reviews;

    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === undefined || val === null) return '""';
            const str = Array.isArray(val) ? val.join(';') : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }

}

export const dbService = new DatabaseService();
export default dbService;
