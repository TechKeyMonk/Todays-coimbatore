'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../components/Footer';
import AdSlider from '../components/AdSlider';
import AdBanner from './components/AdBanner';
import ELI5SummaryPlugin from '../components/news/ELI5SummaryPlugin';
import AiSummary from '../components/AiSummary';
import AudioReader from '../components/AudioReader';
import VideoPlayer from '../components/VideoPlayer';
import NewsCard from '../components/NewsCard';
import BreakingSpotlight, { SpotlightArticle } from '../components/BreakingSpotlight';
import SubHeroSpotlight from '../components/SubHeroSpotlight';
import ShareModal from '../components/ShareModal';
import UniversalSideLayout from '../components/UniversalSideLayout';
import { saveCurrentScrollPosition } from '../components/ScrollRestoration';
import { ArrowRight } from 'lucide-react';
import dbService, { Article, AdSlotRecord, INITIAL_ADS_DB, DirectoryListing, INITIAL_DIRECTORY_LISTINGS, INITIAL_DATABASE_ARTICLES, formatRelativeTime } from '../services/db';
import { hasActualVideo } from '@/lib/videoUtils';

/* -------------------------------------------------------------------------- */
/*                                Types & Models                              */
/* -------------------------------------------------------------------------- */

interface VideoModalData {
  title: string;
  category: string;
  duration?: string;
  quality?: string;
  location?: string;
  caption?: string;
  videoUrl?: string;
}

interface NewsCardItem {
  id: string;
  title: string;
  category: string;
  categoryBadgeClass?: string;
  timeAgo: string;
  readTime?: string;
  author: string;
  excerpt: string;
  imageUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  videoUrl?: string;
  mediaType?: string;
  articleHref: string;
  highlightStat?: string;
}

interface MyCityCardItem {
  id: string;
  tag: string;
  badgeClass: string;
  timeAgo: string;
  title: string;
  excerpt: string;
  footerLabel: string;
  footerValue: string;
  footerIsCall?: boolean;
  imageUrl?: string;
}

interface CeoProfileItem {
  id: string;
  name: string;
  company: string;
  role: string;
  title: string;
  quote: string;
  timeAgo: string;
  videoDuration?: string;
  videoUrl?: string;
  mediaType?: string;
  imageUrl?: string;
  articleHref: string;
}

/* -------------------------------------------------------------------------- */
/*                          Comprehensive News Datasets                       */
/* -------------------------------------------------------------------------- */

// 1. TOP STORIES (5 Cards)
const TOP_STORIES_CARDS: NewsCardItem[] = [
  {
    id: 'top-1',
    title: 'Avinashi Road 10.1 km Elevated Flyover: 80% Deck Spans Completed',
    category: 'Trending Now',
    categoryBadgeClass: 'bg-red-600/90 text-white',
    timeAgo: '15m ago',
    readTime: '3 min',
    author: 'Infra Bureau',
    excerpt: 'With 284 out of 306 spans successfully launched, the corridor from Uppilipalayam to Goldwins enters its final surfacing phase.',
    imageUrl: undefined,
    videoTitle: 'Avinashi Road Elevated Corridor Drone Fly-Through',
    videoDuration: '02:15',
    articleHref: '#trending-full',
  },
  {
    id: 'top-2',
    title: 'Siruvani Reservoir Storage at 45.4 ft: Summer Rationing Prevented',
    category: 'Civic Watch',
    categoryBadgeClass: 'bg-blue-600/90 text-white',
    timeAgo: '35m ago',
    readTime: '3 min',
    author: 'Water Resources Desk',
    excerpt: 'Full supply capacity of 86 MLD maintained for West and Central zones as Pilloor-III distribution testing wraps up.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    videoTitle: 'Siruvani Reservoir Water Level & Supply Inspection',
    videoDuration: '01:45',
    articleHref: '#siruvani-full',
  },
  {
    id: 'top-3',
    title: 'CODISSIA Intec 2026: 450+ Global Automation Exhibitors Finalize Arena',
    category: 'Industry Watch',
    categoryBadgeClass: 'bg-amber-600/90 text-white',
    timeAgo: '45m ago',
    readTime: '4 min',
    author: 'Industrial Bureau',
    excerpt: 'South India’s premier industrial expo introduces a dedicated pavilion for precision EV motor stamping and aerospace tooling.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    videoTitle: 'Codissia Intec 2026 Arena Walkthrough & Setup',
    videoDuration: '03:45',
    articleHref: '#codissia-full',
  },
  {
    id: 'top-4',
    title: 'Coimbatore Metro Rail Phase-1 Detailed Project Report Approved by Union Ministry',
    category: 'Metro Transit',
    categoryBadgeClass: 'bg-emerald-600/90 text-white',
    timeAgo: '1h ago',
    readTime: '4 min',
    author: 'Transit Correspondent',
    excerpt: 'Dual-corridor network spanning 44 km from Collectorate to Bilichi and Karanampettai gets center clearance with ₹10,740 Cr outlay.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    videoTitle: 'Coimbatore Metro Alignment Map & Corridor 1 & 2 Blueprint',
    videoDuration: '04:10',
    articleHref: '#metro-approval',
  },
  {
    id: 'top-5',
    title: 'TIDEL Park Phase-2 at Avinashi Road Reaches 90% Pre-Leasing Across Tech Towers',
    category: 'IT Corridor',
    categoryBadgeClass: 'bg-purple-600/90 text-white',
    timeAgo: '2h ago',
    readTime: '3 min',
    author: 'Tech Bureau',
    excerpt: 'Five Fortune-500 SaaS and engineering R&D hubs book 8.5 lakh sq.ft of Grade-A office space adjacent to ELCOT IT SEZ.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    videoTitle: 'TIDEL Park Phase-2 Construction Aerial Tour',
    videoDuration: '03:30',
    articleHref: '#tidel-park-full',
  },
];

// 2. MY CITY CIVIC CARDS (4 Cards)
const MY_CITY_CARDS: MyCityCardItem[] = [
  {
    id: 'mc-1',
    tag: 'TRAFFIC • UKKADAM',
    badgeClass: 'bg-red-600/90 text-white',
    timeAgo: '5m ago',
    title: 'Avinashi Road Elevated Corridor & KMCH Boring',
    excerpt: 'Geotechnical boring active near KMCH junction. Commuters advised to follow Civil Aerodrome bypass routes.',
    footerLabel: '✓ Gandhipuram',
    footerValue: 'Smooth',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mc-2',
    tag: 'CIVIC • SIRUVANI',
    badgeClass: 'bg-cyan-600/90 text-white',
    timeAgo: 'Today',
    title: 'Siruvani Storage at 45.4 ft: Full Supply',
    excerpt: '86 MLD maintained for West & Central zones. Pilloor-III distribution pipeline testing wraps up.',
    footerLabel: 'Grievance Camp',
    footerValue: 'Tuesdays',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mc-3',
    tag: 'POWER • TANGEDCO',
    badgeClass: 'bg-orange-600/90 text-white',
    timeAgo: 'Today',
    title: 'Peelamedu 110kV & Gandhipuram 33kV Line Modernization',
    excerpt: 'Line modernization works ongoing until 4 PM. Centralized fuse-off active across select feeders.',
    footerLabel: 'Fuse Hotline',
    footerValue: '1912',
    footerIsCall: true,
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mc-4',
    tag: 'SANITATION • CCMC',
    badgeClass: 'bg-emerald-600/90 text-white',
    timeAgo: '1h ago',
    title: 'Zero-Waste Micro Compost Centers Across 5 Zones Achieve 94% Efficiency',
    excerpt: 'CCMC deploys 85 battery-operated segregation trikes in RS Puram and Saibaba Colony for door-to-door green waste collection.',
    footerLabel: 'Ward Helpline',
    footerValue: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
  },
];

// 3. TRENDING NOW (6 Grid Cards)
const TRENDING_CARDS: NewsCardItem[] = [
  {
    id: 'tr-1',
    title: 'Coimbatore Metro Phase-1 Geotechnical Soil Boring Survey Active Near KMCH Junction',
    category: 'Metro & Rail',
    categoryBadgeClass: 'bg-red-50 text-red-600 border-red-200',
    timeAgo: '12m ago',
    readTime: '3 min',
    author: 'Metro Transit Desk',
    excerpt: 'CMRL engineers deploy automated soil testing rigs along Avinashi Road corridor. Commuters advised to follow civil aerodrome bypass routes.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Metro Soil Boring Survey Live Footage at KMCH',
    videoDuration: '02:10',
    articleHref: '#metro-geotechnical',
  },
  {
    id: 'tr-2',
    title: 'CODISSIA Intec 2026: Over 450 Global Automation & Robotics Exhibitors Finalize Stalls',
    category: 'Industry & Trade',
    categoryBadgeClass: 'bg-red-50 text-red-700 border-red-200',
    timeAgo: '45m ago',
    readTime: '4 min',
    author: 'Industrial Bureau',
    excerpt: 'South India’s premier industrial expo introduces a dedicated pavilion for precision EV motor stamping and aerospace titanium tooling.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Codissia Intec 2026 Arena Walkthrough & Setup',
    videoDuration: '03:45',
    articleHref: '#codissia-intec',
  },
  {
    id: 'tr-3',
    title: 'Race Course Walker’s Boulevard Upgraded with Sensor-Driven Smart Solar Illumination',
    category: 'Smart City',
    categoryBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    timeAgo: '1h ago',
    readTime: '2 min',
    author: 'Urban Civic Desk',
    excerpt: 'CCMC installs 120 motion-sensing LED pillars, emergency SOS kiosks, and heritage fountains across the iconic 2.5 km running loop.',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Race Course Night View: Smart Solar Lighting Live',
    videoDuration: '01:50',
    articleHref: '#racecourse-boulevard',
  },
  {
    id: 'tr-4',
    title: 'Valparai & Anamalai Tiger Reserve Eco-Tourism Passes Made 100% Digital via Covai EcoApp',
    category: 'Western Ghats',
    categoryBadgeClass: 'bg-[#0d4d4d]/10 text-[#0d4d4d] border-[#0d4d4d]/20',
    timeAgo: '2h ago',
    readTime: '3 min',
    author: 'Environment Desk',
    excerpt: 'Forest department eliminates highway checkpost bottlenecks for weekend travelers with QR-code permits and fast-track vehicle validation.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Valparai Ghat Road & Eco-App Digital Pass Walkthrough',
    videoDuration: '02:30',
    articleHref: '#valparai-ecoapp',
  },
  {
    id: 'tr-5',
    title: '14th Annual Coimbatore Marathon Crosses 18,000 Runners for Cancer Awareness',
    category: 'Sports & Community',
    categoryBadgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    timeAgo: '3h ago',
    readTime: '3 min',
    author: 'Sports Correspondent',
    excerpt: 'Coimbatore Cancer Foundation announces certified 5K, 10K, and 21K half-marathon circuits with hydration stations every 800 meters.',
    imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Coimbatore Marathon 2026 Route & Registration Guide',
    videoDuration: '03:15',
    articleHref: '#covai-marathon',
  },
  {
    id: 'tr-6',
    title: 'TIDEL Park Phase-2 at Avinashi Road Reaches 90% Pre-Leasing Across Tech Towers',
    category: 'IT Corridor',
    categoryBadgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    timeAgo: '4h ago',
    readTime: '4 min',
    author: 'Tech Business Desk',
    excerpt: 'Five Fortune-500 SaaS and engineering R&D hubs book 8.5 lakh sq.ft of Grade-A office space adjacent to ELCOT IT SEZ.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'TIDEL Park Phase-2 Tower Construction Aerial Tour',
    videoDuration: '04:00',
    articleHref: '#tidel-park-phase2',
  },
];

// 2. INFRASTRUCTURE & CIVIC (6 Grid Cards for 3-Column Uniform Rows)
const INFRA_CARDS: NewsCardItem[] = [
  {
    id: 'inf-1',
    title: 'TANGEDCO Peelamedu & SITRA 110kV Substation Modernization Nears Completion',
    category: 'Energy & Power',
    categoryBadgeClass: 'bg-red-50 text-red-600 border-red-200',
    timeAgo: '18m ago',
    readTime: '3 min',
    author: 'Civic Infrastructure Desk',
    excerpt: 'TANGEDCO replaces aged overhead power feeders with high-durability HT underground cabling, reducing monsoon outage risks by 85% across industrial belts.',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'TANGEDCO 110kV Substation Modernization Works',
    videoDuration: '02:25',
    articleHref: '#tangedco-upgrade',
    highlightStat: '85% Outage Reduction',
  },
  {
    id: 'inf-2',
    title: 'CCMC Smart City Multi-Storey Central Digital Library Opens in RS Puram',
    category: 'Civic Knowledge',
    categoryBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    timeAgo: '1h ago',
    readTime: '3 min',
    author: 'Municipal Affairs Bureau',
    excerpt: 'Featuring 50,000+ digital research journals, competitive exam coaching pods, and high-speed public fiber, the state-of-the-art facility accommodates 800 readers.',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Inside RS Puram Digital Library & Learning Labs',
    videoDuration: '03:10',
    articleHref: '#rs-puram-library',
    highlightStat: '50K+ Digital Books',
  },
  {
    id: 'inf-3',
    title: 'Western Bypass & L&T Ring Road Safety Audit: 12 Junctions Upgraded with Solar Signals',
    category: 'Road Safety',
    categoryBadgeClass: 'bg-red-50 text-red-700 border-red-200',
    timeAgo: '2h ago',
    readTime: '4 min',
    author: 'Traffic Engineering Cell',
    excerpt: 'High-visibility rumble strips, automated speed monitors, and median reflective beacons installed along the heavy container truck corridor between Madukkarai and Neelambur.',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Western Ring Road Safety Audit & Signal Automation',
    videoDuration: '02:40',
    articleHref: '#ring-road-safety',
    highlightStat: '12 Junctions Fitted',
  },
  {
    id: 'inf-4',
    title: 'Noyyal River Restoration: 8 Historic Check Dams Desilted Ahead of Monsoons',
    category: 'Water Conservation',
    categoryBadgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    timeAgo: '3h ago',
    readTime: '3 min',
    author: 'Water Resources Desk',
    excerpt: 'CCMC, PWD, and civic environmental trusts complete desilting of 42,000 metric tons of sediment across Chola-era check dams, bolstering aquifer levels in 14 revenue villages.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Noyyal Basin Check Dam Desilting & River Flow Inspection',
    videoDuration: '03:30',
    articleHref: '#noyyal-restoration',
    highlightStat: '42K Tons Cleared',
  },
  {
    id: 'inf-5',
    title: 'Kurichi Lakefront Eco-Promenade & Biodiversity Bird Sanctuary Phase-2 Opens',
    category: 'Lakefront & Ecology',
    categoryBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    timeAgo: '4h ago',
    readTime: '3 min',
    author: 'Environment Bureau',
    excerpt: 'CCMC Smart City completes 5.2 km lake-bund pathway, floating solar aeration fountains, and illuminated migratory bird viewing decks.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Kurichi Lakefront Walkway & Solar Aeration Aerators Tour',
    videoDuration: '02:55',
    articleHref: '#kurichi-lakefront',
    highlightStat: '5.2 km Lake Bund',
  },
  {
    id: 'inf-6',
    title: 'Coimbatore Integrated Bus Terminus (IBT) Vellalore Connectivity Flyover Fast-Tracked',
    category: 'Transit & Highways',
    categoryBadgeClass: 'bg-red-50 text-red-600 border-red-200',
    timeAgo: '5h ago',
    readTime: '4 min',
    author: 'Urban Transit Desk',
    excerpt: 'State Highways Department sanctions ₹180 Cr four-lane elevated arm connecting Chettipalayam Road with the Southern Ring Expressway.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Vellalore IBT Flyover Alignment & Expressway Link Walkthrough',
    videoDuration: '03:20',
    articleHref: '#vellalore-ibt-flyover',
    highlightStat: '₹180 Cr Sanctioned',
  },
];

// 3. BUSINESS & STARTUPS (6 Grid Cards for 3-Column Uniform Rows)
const BUSINESS_CARDS: NewsCardItem[] = [
  {
    id: 'biz-1',
    title: 'Kongu Cotton & Spinning Mills Report 24% Surge in Autumn Global Apparel Export Inflow',
    category: 'Textile Exports',
    categoryBadgeClass: 'bg-red-50 text-red-700 border-red-200',
    timeAgo: '1h ago',
    readTime: '4 min',
    author: 'Textile Industry Desk',
    excerpt: 'Resilient demand from European and US luxury sustainable apparel labels boosts high-count compact cotton yarn orders across Tirupur and Coimbatore spinning clusters.',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Covai High-Speed Spinning Mills Export Operations',
    videoDuration: '03:15',
    articleHref: '#cotton-exports',
    highlightStat: '+24% Export Growth',
  },
  {
    id: 'biz-2',
    title: 'Sulur EV Battery & Powertrain Startup Hub Raises ₹45 Cr Series-A for Cleanroom Expansion',
    category: 'EV Startups',
    categoryBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    timeAgo: '2h ago',
    readTime: '3 min',
    author: 'Startup Correspondent',
    excerpt: 'The deep-tech mobility firm develops high-density thermal cooling battery packs for heavy commercial logistics three-wheelers, scaling capacity to 10,000 packs/month.',
    imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c634a10?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Inside Sulur EV Battery Pack Automated Cleanrooms',
    videoDuration: '02:50',
    articleHref: '#ev-startup-funding',
    highlightStat: '₹45 Cr Series-A',
  },
  {
    id: 'biz-3',
    title: 'Coimbatore Pump & Foundry Cluster Achieves Zero-Defect Precision Export Certification',
    category: 'Foundry Hub',
    categoryBadgeClass: 'bg-red-50 text-red-600 border-red-200',
    timeAgo: '3h ago',
    readTime: '4 min',
    author: 'Engineering Desk',
    excerpt: 'Over 120 foundries adopt induction furnace solar microgrids and robotic sand-core tooling, delivering ultra-precise ductile iron castings for European aerospace clients.',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Robotic Sand Casting & Induction Foundry in Coimbatore',
    videoDuration: '03:40',
    articleHref: '#foundry-cluster',
    highlightStat: '120+ Foundries Certified',
  },
  {
    id: 'biz-4',
    title: 'Peelamedu DeepTech Collegiate Incubator Launches 20 Enterprise SaaS Spin-Offs',
    category: 'SaaS & AI',
    categoryBadgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    timeAgo: '5h ago',
    readTime: '3 min',
    author: 'Innovation Correspondent',
    excerpt: 'Collegiate entrepreneurs launch specialized AI platforms for textile supply chain predictability, hospital diagnostic radiology, and predictive agricultural irrigation.',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Demo Day 2026: Covai Student Founders Pitch Deep-Tech SaaS',
    videoDuration: '04:15',
    articleHref: '#deeptech-incubator',
    highlightStat: '20 New Startups',
  },
  {
    id: 'biz-5',
    title: 'Coimbatore Jewellery & Diamond Cluster Exports Cross ₹3,200 Cr Milestone',
    category: 'Gold & Diamond',
    categoryBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    timeAgo: '6h ago',
    readTime: '3 min',
    author: 'Covai Gold Guild Desk',
    excerpt: 'Artisanal hand-crafted lightweight gold ornaments and hallmarked casting jewellery from RS Puram secure record festive import orders across UAE and Southeast Asia.',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'RS Puram Precision Jewellery Manufacturing & Hallmarking Unit',
    videoDuration: '03:05',
    articleHref: '#jewellery-exports',
    highlightStat: '₹3,200 Cr Exports',
  },
  {
    id: 'biz-6',
    title: 'Covai Aerospace & Defence Precision Machining Hub Receives Tier-1 AS9100 Approvals',
    category: 'Defence & Aero',
    categoryBadgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    timeAgo: '7h ago',
    readTime: '4 min',
    author: 'Defence Corridor Cell',
    excerpt: 'Over 40 engineering machining centers in Sulur & Ganapathy bag global contracts for jet engine fuel manifolds and space launch composite brackets.',
    imageUrl: 'https://images.unsplash.com/photo-1517976487507-5b3b4b45f94c?auto=format&fit=crop&w=600&q=80',
    videoTitle: 'Inside Coimbatore Aerospace 5-Axis CNC Precision Machining Cell',
    videoDuration: '03:50',
    articleHref: '#aerospace-machining',
    highlightStat: '40+ Tier-1 Suppliers',
  },
];

// 4. CEO SPOTLIGHT (3 Profiles)
const CEO_PROFILES: CeoProfileItem[] = [
  {
    id: 'ceo-vembu',
    name: 'Sridhar Vembu',
    company: 'Zoho Corporation',
    role: 'Chief Executive Officer & Co-Founder',
    title: 'Why Covai & Tier-2 Rural Tech Clusters Outperform Metro Silos',
    quote: 'Coimbatore’s rich engineering DNA and grounding prove that global enterprise software can thrive sustainably without big-city burnout.',
    timeAgo: 'Exclusive Q&A',
    videoDuration: '05:30 HD',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    articleHref: '#ceo-vembu-interview',
  },
  {
    id: 'ceo-pricol',
    name: 'Vanitha Mohan & Leadership',
    company: 'Pricol Limited',
    role: 'Executive Leadership Board',
    title: 'Engineering Next-Gen Connected Vehicle Telematics & EV Sensor Clusters',
    quote: 'Our precision automotive instrument clusters engineered in Coimbatore now drive leading two-wheelers and electric fleets across 45 countries.',
    timeAgo: 'Industry Titan',
    videoDuration: '04:45 HD',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    articleHref: '#ceo-pricol-interview',
  },
  {
    id: 'ceo-covai',
    name: 'Saravana Kumar',
    company: 'Covai.co',
    role: 'Founder & Chief Executive Officer',
    title: 'Scaling Enterprise Cloud Products from Peelamedu to 3,000+ Global Clients',
    quote: 'Building our headquarters in Coimbatore gave us 95%+ talent retention and an extraordinary work culture that fuels global hyper-growth.',
    timeAgo: 'SaaS Leader',
    videoDuration: '06:15 HD',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    articleHref: '#ceo-covai-interview',
  },
];

/* -------------------------------------------------------------------------- */
/*                               Main Page View                               */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const [activeVideoModal, setActiveVideoModal] = useState<VideoModalData | null>(null);
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const [isHeroShareOpen, setIsHeroShareOpen] = useState(false);

  // Automated TANGEDCO Power Outage Alert Engine State
  const [tangedcoAlert, setTangedcoAlert] = useState<{
    isTomorrow: boolean;
    scheduledDate: string;
    affectedAreas: string[];
    hotline: string;
    totalFeeders: number;
  } | null>(null);
  const [dbArticles, setDbArticles] = useState<Article[]>(INITIAL_DATABASE_ARTICLES);
  const [adSlots, setAdSlots] = useState<AdSlotRecord[]>(INITIAL_ADS_DB);
  const [directoryListings, setDirectoryListings] = useState<DirectoryListing[]>(INITIAL_DIRECTORY_LISTINGS);

  useEffect(() => {
    let isMounted = true;

    // 1. Immediately read cached client storage without causing SSR hydration mismatch
    if (typeof window !== 'undefined') {
      try {
        const raw =
          localStorage.getItem('t_covai_articles') ||
          localStorage.getItem('admin_published_articles') ||
          localStorage.getItem('publishedArticles') ||
          localStorage.getItem('news_articles') ||
          localStorage.getItem('covai_db_articles');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && isMounted) {
            setDbArticles(parsed);
          }
        }

        const rawAds = localStorage.getItem('t_covai_ads') || localStorage.getItem('adSlots');
        if (rawAds) {
          const parsedAds = JSON.parse(rawAds);
          if (Array.isArray(parsedAds) && parsedAds.length > 0 && isMounted) {
            setAdSlots(parsedAds);
          }
        }

        const rawDirs = localStorage.getItem('tc_directory_listings_v2') || localStorage.getItem('t_covai_directory_v2');
        if (rawDirs) {
          const parsedDirs = JSON.parse(rawDirs);
          if (Array.isArray(parsedDirs) && parsedDirs.length > 0 && isMounted) {
            setDirectoryListings(parsedDirs);
          }
        }
      } catch (e) {}
    }

    // 2. Sync with database
    const syncAll = async () => {
      try {
        const [articles, ads, dirs] = await Promise.all([
          dbService.getArticles(),
          dbService.getAds(),
          dbService.getDirectoryListings(),
        ]);
        if (isMounted) {
          if (articles !== undefined && articles !== null) setDbArticles(articles);
          if (ads && ads.length > 0) setAdSlots(ads);
          if (dirs && dirs.length > 0) setDirectoryListings(dirs);
        }
      } catch (e) {
        console.warn('Home sync warning:', e);
      }
    };

    syncAll();
    const unsubscribe = dbService.subscribe(() => {
      syncAll();
    });

    const handleStorageChange = () => {
      syncAll();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adsStorageUpdate', handleStorageChange);
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('todayscoimbatore:db-updated', handleStorageChange);
    }

    return () => {
      isMounted = false;
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('adsStorageUpdate', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('todayscoimbatore:db-updated', handleStorageChange);
      }
    };
  }, []);

  const getAd = (placementKey: string) => {
    const key = (placementKey || '').toUpperCase().trim();
    return adSlots.find(
      (a) =>
        (a.placementKey && a.placementKey.toUpperCase().trim() === key) ||
        (a.slotId && a.slotId.toUpperCase().trim() === key) ||
        (a.id && a.id.toUpperCase().trim() === key)
    );
  };

  // Strict Dynamic Section Filtering from dbArticles
  const getArticlesByCategory = (categorySlug: string) => {
    const target = categorySlug.toLowerCase().trim();
    const cleanTarget = target.replace(/-/g, ' ');
    const normTarget = target.replace(/[^a-z0-9]/g, '');

    return dbArticles.filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      const normCat = cat.replace(/[^a-z0-9]/g, '');

      // 1. Direct exact equality check
      if (cat === target || cat === cleanTarget || normCat === normTarget) {
        return true;
      }

      // 2. Specific exact category aliases (without cross-polluting)
      if (target === 'infrastructure' || target === 'infrastructure-updates') {
        return cat === 'infrastructure' || (item.subCategory || '').toLowerCase().includes('infrastructure');
      }
      if (target === 'ceos' || target === 'ceos-of-coimbatore') {
        return cat === 'ceo' || cat === 'ceos';
      }
      if (target === 'news' || target === 'top-stories' || target === 'trending') {
        return cat === 'news' || cat === 'top stories' || cat === 'trending';
      }
      if (target === 'e-paper' || target === 'epaper') {
        return cat === 'e-paper' || cat === 'epaper';
      }

      return false;
    });
  };

  // Scroll Position Preservation: Restore exact scroll position on back navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPos = sessionStorage.getItem('homeScrollPos');
      if (savedPos) {
        const y = parseInt(savedPos, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.scrollTo({ top: y, left: 0, behavior: 'instant' });
            }, 60);
          });
        }
      }

      let scrollTimer: NodeJS.Timeout | null = null;
      const handleHomeScroll = () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          if (window.scrollY > 0) {
            sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
          }
        }, 100);
      };

      window.addEventListener('scroll', handleHomeScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleHomeScroll);
        if (scrollTimer) clearTimeout(scrollTimer);
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTangedco = async () => {
      try {
        const res = await fetch('/api/tangedco');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.summary) {
            setTangedcoAlert({
              isTomorrow: json.summary.isTomorrowOutageScheduled,
              scheduledDate: json.summary.scheduledDate,
              affectedAreas: json.summary.affectedAreas,
              hotline: json.summary.primaryHotline || '1912',
              totalFeeders: json.summary.totalAffectedFeeders || 4,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setTangedcoAlert({
            isTomorrow: true,
            scheduledDate: 'Tomorrow (09:00 AM – 04:00 PM)',
            affectedAreas: ['Peelamedu', 'Gandhipuram', 'Saravanampatti', 'Ukkadam'],
            hotline: '1912',
            totalFeeders: 4,
          });
        }
      }
    };

    fetchTangedco();
    return () => {
      isMounted = false;
    };
  }, []);

  // Strictly sort: Exclusive stories first (newest to oldest), then non-exclusive stories (newest to oldest)
  const sortedDbArticles = [...dbArticles].sort((a, b) => {
    if (a.isExclusive && !b.isExclusive) return -1;
    if (!a.isExclusive && b.isExclusive) return 1;
    const timeA = Math.max(new Date(a.updatedAt || 0).getTime() || 0, new Date(a.createdAt || a.publishedAt || 0).getTime() || 0);
    const timeB = Math.max(new Date(b.updatedAt || 0).getTime() || 0, new Date(b.createdAt || b.publishedAt || 0).getTime() || 0);
    return timeB - timeA;
  });

  const sanitizeArticleImageUrl = (url?: string | null): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (
      trimmed === '' ||
      trimmed === 'null' ||
      trimmed === 'undefined' ||
      trimmed.startsWith('local-video://') ||
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be')
    ) {
      return undefined;
    }
    return trimmed;
  };



  // Dynamic Breaking Spotlight Multi-Article Carousel Feed
  const allSpotlightArticles = sortedDbArticles.filter((a) =>
    Boolean(
      a.isExclusive ||
      a.isSpotlight ||
      a.is_spotlight ||
      a.highlightStat === 'Spotlight Exclusive' ||
      a.category?.toUpperCase() === 'BREAKING SPOTLIGHT' ||
      a.subCategory?.toUpperCase() === 'BREAKING SPOTLIGHT' ||
      (Array.isArray(a.tags) && a.tags.some((t) => t.toLowerCase().includes('spotlight'))) ||
      (typeof a.keywords === 'string' && (a.keywords.includes('__EXCLUSIVE__') || a.keywords.includes('__SPOTLIGHT__')))
    )
  );

  const spotlightCarouselArticles: SpotlightArticle[] = (allSpotlightArticles.length > 0
    ? allSpotlightArticles
    : sortedDbArticles.slice(0, 4)
  ).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug || a.id,
    imageUrl: sanitizeArticleImageUrl(a.imageUrl) || sanitizeArticleImageUrl((a as any).image) || sanitizeArticleImageUrl((a as any).mediaUrl),
    author: a.author || 'Editorial Bureau',
    publishedAt: a.publishedAt || a.createdAt || 'RECENT',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    category: a.category || 'COVAI SPOTLIGHTS',
    subCategory: a.subCategory,
    tags: a.tags || (a.isExclusive ? ['Spotlight Exclusive'] : undefined),
    videoUrl: a.videoUrl,
    mediaType: a.mediaType,
    excerpt: a.excerpt || a.content?.slice(0, 160),
  }));

  const latestHeroArticle = sortedDbArticles.find((a) => a.isExclusive) || sortedDbArticles[0];
  const allExclusiveStories = sortedDbArticles.filter((a) => a.isExclusive);
  const remainingExclusives = allExclusiveStories.filter((a) => a.id !== latestHeroArticle?.id);
  const nonExclusives = sortedDbArticles.filter((a) => !a.isExclusive && a.id !== latestHeroArticle?.id);
  
  // Dynamic Sub Hero Articles (Top featured secondary stories from Supabase)
  const remainingStories = [...remainingExclusives, ...nonExclusives];

  // 2nd latest active story from Supabase news array (news[1] or fallback to latest un-featured story)
  const secondarySpotlightArticle = (sortedDbArticles.length > 1 ? sortedDbArticles[1] : null) || nonExclusives[0] || remainingStories[0] || null;

  const FALLBACK_SECONDARY_ARTICLE: Partial<Article> = {
    id: 'kovai-tech-infra',
    slug: 'kovai-tech-infra-updates',
    title: 'Kovai Tech & Infra Updates: Flyover Corridors & SaaS Hub Expansions Accelerate',
    excerpt: 'District administration and civic engineering cells confirm on-schedule infrastructure works across Avinashi Road and Saravanampatti IT corridor.',
    category: 'INFRASTRUCTURE',
    createdAt: '2026-09-05T09:00:00.000Z',
    author: 'Civic Infrastructure Desk',
  };

  const activeSecondaryArticle = secondarySpotlightArticle || FALLBACK_SECONDARY_ARTICLE;
  const secondaryArticleHref = `/news/${activeSecondaryArticle.slug || activeSecondaryArticle.id || 'kovai-tech-infra-updates'}`;

  // For Right Column Sub Hero: pick first remaining story that isn't the secondary spotlight (if available)
  const subHeroCandidates = remainingStories.filter((s) => s.id !== activeSecondaryArticle?.id);
  const subHeroArticle = subHeroCandidates[0] || remainingStories[0] || null;
  const subHeroSecondary = subHeroCandidates[1] || remainingStories[1] || null;
  const dynamicChronicleStories = (subHeroCandidates.length > 0 ? subHeroCandidates : remainingStories).slice(2, 5);

  const subHeroImageUrl = (subHeroArticle?.imageUrl && typeof subHeroArticle.imageUrl === 'string' && subHeroArticle.imageUrl.trim() !== '' && subHeroArticle.imageUrl.trim() !== 'null' && subHeroArticle.imageUrl.trim() !== 'undefined')
    ? subHeroArticle.imageUrl.trim()
    : ((subHeroArticle as any)?.image && typeof (subHeroArticle as any).image === 'string' && (subHeroArticle as any).image.trim() !== '' && (subHeroArticle as any).image.trim() !== 'null' && (subHeroArticle as any).image.trim() !== 'undefined')
    ? (subHeroArticle as any).image.trim()
    : ((subHeroArticle as any)?.mediaUrl && typeof (subHeroArticle as any).mediaUrl === 'string' && (subHeroArticle as any).mediaUrl.trim() !== '' && !(subHeroArticle as any).mediaUrl.includes('youtube'))
    ? (subHeroArticle as any).mediaUrl.trim()
    : null;

  const isHeroVideo = Boolean(
    latestHeroArticle?.mediaType === 'video' &&
    latestHeroArticle?.videoUrl &&
    typeof latestHeroArticle.videoUrl === 'string' &&
    latestHeroArticle.videoUrl.trim() !== '' &&
    (latestHeroArticle.videoUrl.startsWith('http') ||
     latestHeroArticle.videoUrl.startsWith('local-video://') ||
     latestHeroArticle.videoUrl.includes('youtube') ||
     latestHeroArticle.videoUrl.includes('youtu.be'))
  );

  const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80';

  const heroImageUrl = (latestHeroArticle?.imageUrl && typeof latestHeroArticle.imageUrl === 'string' && latestHeroArticle.imageUrl.trim() !== '' && latestHeroArticle.imageUrl.trim() !== 'null' && latestHeroArticle.imageUrl.trim() !== 'undefined')
    ? latestHeroArticle.imageUrl.trim()
    : ((latestHeroArticle as any)?.image && typeof (latestHeroArticle as any).image === 'string' && (latestHeroArticle as any).image.trim() !== '' && (latestHeroArticle as any).image.trim() !== 'null' && (latestHeroArticle as any).image.trim() !== 'undefined')
    ? (latestHeroArticle as any).image.trim()
    : ((latestHeroArticle as any)?.mediaUrl && typeof (latestHeroArticle as any).mediaUrl === 'string' && (latestHeroArticle as any).mediaUrl.trim() !== '' && (latestHeroArticle as any).mediaUrl.trim() !== 'null' && (latestHeroArticle as any).mediaUrl.trim() !== 'undefined' && !(latestHeroArticle as any).mediaUrl.includes('youtube'))
    ? (latestHeroArticle as any).mediaUrl.trim()
    : DEFAULT_HERO_IMAGE;



  const infraArticles = getArticlesByCategory('infrastructure');
  const infraData: NewsCardItem[] = infraArticles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    categoryBadgeClass: 'bg-blue-600/90 text-white',
    timeAgo: a.publishedAt || 'Recently',
    readTime: a.readTime || '3 min',
    author: a.author || 'Infra Bureau',
    excerpt: a.excerpt || a.content?.slice(0, 180) || '',
    mediaType: a.mediaType || 'image',
    imageUrl:
      a.imageUrl && typeof a.imageUrl === 'string' && a.imageUrl.trim() !== '' && a.imageUrl.trim() !== 'null' && a.imageUrl.trim() !== 'undefined'
        ? a.imageUrl.trim()
        : (a as any).image && typeof (a as any).image === 'string' && (a as any).image.trim() !== '' && (a as any).image.trim() !== 'null' && (a as any).image.trim() !== 'undefined'
        ? (a as any).image.trim()
        : undefined,
    videoTitle: a.videoTitle,
    videoDuration: a.videoDuration,
    videoUrl: a.videoUrl || (a.mediaType === 'video' ? ((a as any).mediaUrl as string) : undefined),
    articleHref: `/article/${a.id}`,
    highlightStat: a.highlightStat,
  }));

  const businessArticles = getArticlesByCategory('business');
  const businessData: NewsCardItem[] = businessArticles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    categoryBadgeClass: 'bg-amber-600/90 text-white',
    timeAgo: a.publishedAt || 'Recently',
    readTime: a.readTime || '3 min',
    author: a.author || 'Industrial Bureau',
    excerpt: a.excerpt || a.content?.slice(0, 180) || '',
    mediaType: a.mediaType || 'image',
    imageUrl:
      a.imageUrl && typeof a.imageUrl === 'string' && a.imageUrl.trim() !== '' && a.imageUrl.trim() !== 'null' && a.imageUrl.trim() !== 'undefined'
        ? a.imageUrl.trim()
        : (a as any).image && typeof (a as any).image === 'string' && (a as any).image.trim() !== '' && (a as any).image.trim() !== 'null' && (a as any).image.trim() !== 'undefined'
        ? (a as any).image.trim()
        : undefined,
    videoTitle: a.videoTitle,
    videoDuration: a.videoDuration,
    videoUrl: a.videoUrl || (a.mediaType === 'video' ? ((a as any).mediaUrl as string) : undefined),
    articleHref: `/article/${a.id}`,
    highlightStat: a.highlightStat,
  }));

  const ceoArticles = getArticlesByCategory('ceos');
  const mappedCeoData = ceoArticles.map((a) => ({
    id: a.id,
    name: a.author || 'Coimbatore Leader',
    role: a.subCategory || 'Founder & CEO',
    company: 'Enterprise Leader',
    quote: a.excerpt || a.title,
    mediaType: a.mediaType || 'image',
    imageUrl:
      a.imageUrl && typeof a.imageUrl === 'string' && a.imageUrl.trim() !== '' && a.imageUrl.trim() !== 'null' && a.imageUrl.trim() !== 'undefined'
        ? a.imageUrl.trim()
        : (a as any).image && typeof (a as any).image === 'string' && (a as any).image.trim() !== '' && (a as any).image.trim() !== 'null' && (a as any).image.trim() !== 'undefined'
        ? (a as any).image.trim()
        : undefined,
    videoDuration: a.videoDuration,
    videoUrl: a.videoUrl || (a.mediaType === 'video' ? ((a as any).mediaUrl as string) : undefined),
    articleHref: `/article/${a.id}`,
    timeAgo: a.publishedAt || 'Exclusive',
    title: a.title,
  }));
  const ceoData = mappedCeoData.length > 0 ? mappedCeoData : CEO_PROFILES;

  const newsSectionArticles = getArticlesByCategory('news');
  const newsSectionData: NewsCardItem[] = newsSectionArticles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category || 'NEWS',
    categoryBadgeClass: 'bg-red-600/90 text-white',
    timeAgo: a.publishedAt || 'Recently',
    readTime: a.readTime || '3 min',
    author: a.author || 'Editorial Bureau',
    excerpt: a.excerpt || a.content?.slice(0, 180) || '',
    mediaType: a.mediaType || 'image',
    imageUrl: sanitizeArticleImageUrl(a.imageUrl) || sanitizeArticleImageUrl((a as any).image) || sanitizeArticleImageUrl((a as any).mediaUrl),
    videoTitle: a.videoTitle,
    videoDuration: a.videoDuration,
    videoUrl: a.videoUrl || (a.mediaType === 'video' ? ((a as any).mediaUrl as string) : undefined),
    articleHref: `/article/${a.id}`,
    highlightStat: a.highlightStat,
  }));

  const openVideoModal = (data: VideoModalData) => {
    setActiveVideoModal(data);
  };

  const closeVideoModal = () => {
    setActiveVideoModal(null);
  };

  const topLeaderboardAd = getAd('TOP_HEADER_LEADERBOARD') || getAd('slot-leaderboard-top');
  const homeInFeed1 = getAd('HOME_IN_FEED_1') || getAd('slot-between-stories-mycity');
  const homeInFeed2 = getAd('HOME_IN_FEED_2') || getAd('slot-news-infrastructure');
  const homeInFeed3 = getAd('HOME_IN_FEED_3') || getAd('slot-category-after-4th');
  const homeInFeed4 = getAd('HOME_IN_FEED_4') || getAd('slot-business-infeed');
  const sidebarTopAd = getAd('RIGHT_SIDEBAR_TOP') || getAd('slot-sidebar-rect-1');

  return (
    <div className="w-full max-w-full bg-[#fcfbf7] dark:bg-slate-950 text-[#111111] dark:text-gray-100 font-sans antialiased selection:bg-red-600 selection:text-white transition-colors duration-200 box-border relative pb-20 md:pb-0 min-w-0 overflow-hidden">
      {/* ==================================================================== */}
      {/* 2. UNIVERSAL SIDEBAR LAYOUT (STICKY LOCKED 3-COLUMN STRUCTURE)        */}
      {/* ==================================================================== */}
      <UniversalSideLayout pageType="home" className="mt-0 pt-0 border-t-0 space-y-0 w-full min-w-0 overflow-hidden" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        {/* ZERO-GAP EDITORIAL & ADVERTISEMENT ARCHITECTURE */}
        <div className="w-full max-w-full mx-auto space-y-6 box-border mt-0 pt-0 border-t-0 min-w-0 overflow-hidden" style={{ marginTop: 0, paddingTop: 0 }}>
        
        {/* ------------------------------------------------------------------ */}
        {/* SECTION 1: HERO & BREAKING SPOTLIGHT AUTO-SLIDING CAROUSEL          */}
        {/* ------------------------------------------------------------------ */}
        <BreakingSpotlight
          articles={spotlightCarouselArticles}
          onOpenVideo={openVideoModal}
        />

            {/* EDITORIAL TIMELINE & DYNAMIC SUB HERO SECTION GRID */}
            <div className={`grid grid-cols-1 ${subHeroArticle ? 'lg:grid-cols-2' : 'w-full'} gap-4 w-full max-w-full my-4 items-stretch min-w-0 overflow-hidden`}>
              {/* HERO LEFT COLUMN: VERTICAL FLEX STACK (TIMELINE + SECONDARY SPOTLIGHT) */}
              <div className="flex flex-col gap-3.5 h-full w-full min-w-0 overflow-hidden">
                {/* 1. COMPACT "THE TIMELINE" CARD */}
                <div className="p-3.5 bg-amber-50/60 dark:bg-slate-900/60 border border-amber-200/50 dark:border-slate-800 rounded-2xl shadow-xs w-full max-w-full box-border break-words flex flex-col justify-between">
                  <div>
                    <div className="border-b border-amber-200/60 dark:border-slate-800 pb-2 mb-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 block mb-0.5">
                        THE TIMELINE
                      </span>
                      <h3 className="text-base font-extrabold leading-tight text-[#111111] dark:text-gray-100 break-words">
                        How Covai became a maker city
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="border-b border-amber-200/40 dark:border-slate-800/80 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#333333] dark:text-gray-300 block mb-0.5">
                          1930s • TEXTILE REVOLUTION
                        </span>
                        <p className="text-xs font-medium text-[#333333] dark:text-gray-400 leading-relaxed break-words">
                          Stanes & G.D. Naidu pioneer indigenous textile machinery and motor manufacturing in Peelamedu.
                        </p>
                      </div>

                      <div className="border-b border-amber-200/40 dark:border-slate-800/80 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#333333] dark:text-gray-300 block mb-0.5">
                          1970s • PUMP & FOUNDRY CAPITAL
                        </span>
                        <p className="text-xs font-medium text-[#333333] dark:text-gray-400 leading-relaxed break-words">
                          Coimbatore supplies over 60% of India’s agricultural pumpsets and cast-iron subassemblies.
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#333333] dark:text-gray-300 block mb-0.5">
                          2026 • SAAS & EV HUB
                        </span>
                        <p className="text-xs font-medium text-[#333333] dark:text-gray-400 leading-relaxed break-words">
                          Over 140 DeepTech & EV startups scale globally from Coimbatore without shifting to metros.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DYNAMIC SECONDARY ARTICLE SLOT */}
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
                  <div>
                    {/* Badge Header: ⚡ KOVAI SPOTLIGHT + publication time/date */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900">
                        <span>⚡</span>
                        <span>KOVAI SPOTLIGHT</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        {formatRelativeTime(activeSecondaryArticle.updatedAt || activeSecondaryArticle.createdAt || activeSecondaryArticle.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      href={secondaryArticleHref}
                      className="block group"
                    >
                      <h4 className="text-sm font-bold text-slate-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-2 cursor-pointer transition-colors leading-snug">
                        {activeSecondaryArticle.title || 'Coimbatore Live Spotlight Updates'}
                      </h4>
                    </Link>

                    {/* Excerpt / Summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {activeSecondaryArticle.excerpt || 'Verified local updates, civic infrastructure reports, and industrial developments from Coimbatore.'}
                    </p>
                  </div>

                  {/* Footer CTA: Category tag + Read Story → link */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeSecondaryArticle.category || 'NEWS'}
                    </span>
                    <Link
                      href={secondaryArticleHref}
                      className="inline-flex items-center gap-1 font-black text-xs text-[#0d4d4d] dark:text-emerald-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    >
                      <span>Read Story</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* DYNAMIC SUB HERO SECTION (FETCHED DIRECTLY FROM SUPABASE DATABASE) */}
              {subHeroArticle && (
                <SubHeroSpotlight
                  article={{
                    ...subHeroArticle,
                    imageUrl: subHeroImageUrl,
                    trendingTitle: subHeroSecondary?.title,
                    trendingHref: subHeroSecondary ? `/article/${subHeroSecondary.id}` : undefined,
                    trendingTime: subHeroSecondary ? formatRelativeTime(subHeroSecondary.updatedAt || subHeroSecondary.createdAt || subHeroSecondary.publishedAt) : undefined,
                  }}
                  onOpenVideo={openVideoModal}
                />
              )}
            </div>




        {/* ================================================================== */}
        {/* DYNAMIC SLOT INJECTION: HOME IN-FEED 1 (BETWEEN STORIES & MY CITY) */}
        {/* ================================================================== */}
        <div className="w-full max-w-full my-6 box-border relative z-10">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#555555] dark:text-gray-400 mb-1.5 px-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              Advertisement • {homeInFeed1?.slides?.[0]?.advertiser || 'Featured Partner'}
            </span>
            <span className="text-[9px] font-mono text-stone-400">Featured Partner</span>
          </div>
          <AdSlider ad={homeInFeed1} variant="infeed" label="FEATURED PARTNER" />
        </div>

        {/* ================================================================== */}
        {/* HIGH-PRIORITY TANGEDCO POWER OUTAGE RED ALERT BANNER               */}
        {/* ================================================================== */}
        {tangedcoAlert?.isTomorrow && (
          <div className="w-full max-w-full my-6 px-0 box-border relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-600 bg-gradient-to-r from-red-700 via-red-600 to-rose-800 text-white p-4 sm:p-5 shadow-lg">
              {/* Subtle background glow */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white text-red-600 font-black text-lg sm:text-xl shrink-0 shadow-md flex items-center justify-center">
                    ⚡
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-white/30 backdrop-blur-xs">
                        HIGH PRIORITY CIVIC ALERT
                      </span>
                      <span className="text-xs font-extrabold text-red-100">
                        {tangedcoAlert.scheduledDate}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                      Scheduled TANGEDCO Maintenance Shutdown Across Coimbatore ({tangedcoAlert.totalFeeders} Feeder Zones)
                    </h3>

                    {/* Affected Area Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      <span className="text-xs font-bold text-red-100 shrink-0">Affected Sectors:</span>
                      {tangedcoAlert.affectedAreas.map((area) => (
                        <span
                          key={area}
                          className="bg-black/35 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md border border-white/20 shadow-2xs"
                        >
                          📍 {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 24/7 Hotline Quick Dial Button */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                  <a
                    href={`tel:${tangedcoAlert.hotline}`}
                    className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-700 text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 text-center"
                  >
                    <span>📞 Emergency Hotline:</span>
                    <span className="underline font-mono text-sm sm:text-base">{tangedcoAlert.hotline}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* FULL-WIDTH SECTION 2: "NEWS" (FULL 3-COLUMN GRID)                  */}
        {/* ================================================================== */}
        <section id="news-grid" className="w-full max-w-full space-y-3 pt-0 mt-0 box-border">
          <div className="border-b border-stone-300 dark:border-slate-800 pb-1 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#111111] dark:text-gray-100 flex items-center gap-1.5">
              <span className="text-red-600 dark:text-red-500 font-black">⚡</span>
              NEWS
            </h2>
          </div>

          {/* 3-COLUMN CONTENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 sm:gap-6 w-full max-w-full">
            {newsSectionData.map((card) => (
              <NewsCard
                key={card.id}
                id={card.id}
                title={card.title}
                category={card.category}
                author={card.author}
                timeAgo={card.timeAgo}
                excerpt={card.excerpt}
                mediaType={card.mediaType}
                imageUrl={card.imageUrl}
                videoUrl={card.videoUrl}
                videoTitle={card.videoTitle}
                videoDuration={card.videoDuration}
                articleHref={`/article/${card.id}`}
                onOpenVideo={openVideoModal}
              />
            ))}
          </div>

          {newsSectionData.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/news"
                prefetch={true}
                className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-lg bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs touch-manipulation"
              >
                <span>View More Stories</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* DYNAMIC IN-FEED AD BREAK 2 (HOME_IN_FEED_2)                   */}
        {/* ============================================================== */}
        <div className="w-full max-w-full py-1 box-border">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#555555] dark:text-gray-400 mb-1">
            Advertisement • {homeInFeed2?.slides?.[0]?.advertiser || 'Property Showcase'}
          </div>
          <AdSlider ad={homeInFeed2} variant="infeed" label="PROPERTY SHOWCASE" />
        </div>

        {/* SECTION 3: "INFRASTRUCTURE & CIVIC" (6 CARDS IN FULL-WIDTH 3-COLUMN GRID) */}
        <div id="infrastructure" className="w-full max-w-full space-y-3 pt-1 scroll-mt-28 box-border">
          <div className="border-b border-stone-300 dark:border-slate-800 pb-1 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#111111] dark:text-gray-100 flex items-center gap-1.5">
              <span className="text-red-600 dark:text-red-500 font-black">🏗️</span>
              INFRASTRUCTURE & CIVIC UPDATES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 sm:gap-6 w-full max-w-full box-border">
            {infraData.map((card) => {
              const cardWords = (card.excerpt + ' ' + card.title).trim().split(/\s+/).filter(Boolean).length;
              const cardListenMins = Math.max(1, Math.ceil(cardWords / 130));
              const cardTargetHref = card.articleHref || `/article/${card.id}`;
              const hasCardVideo = hasActualVideo(card);

              return (
                <article
                  key={card.id}
                  className="w-full max-w-full h-full flex flex-col justify-between group rounded-xl border border-stone-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-stone-400 dark:hover:border-slate-700 transition-all shadow-xs box-border break-words"
                >
                  <div>
                    {/* Thumbnail Image & Video Badge - ONLY if real image exists */}
                    {card.imageUrl && card.imageUrl.trim() !== '' ? (
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 mb-3 border border-gray-100 dark:border-gray-800">
                        <Link href={cardTargetHref} onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="block w-full h-full">
                          <img
                            src={card.imageUrl}
                            alt={card.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                          {card.category}
                        </span>
                        {card.highlightStat && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-black">
                            {card.highlightStat}
                          </span>
                        )}
                      </div>
                    ) : (
                      card.category && (
                        <div className="mb-2">
                          <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-700 dark:text-gray-300">
                            {card.category}
                          </span>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between text-xs text-[#444444] dark:text-gray-400 mb-1 font-bold">
                      <span className="text-[#111111] dark:text-gray-100 font-black">{card.author}</span>
                      <span>{card.timeAgo}</span>
                    </div>

                    <Link href={cardTargetHref} onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="block">
                      <h3 className="text-sm sm:text-base font-bold text-[#111111] dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug cursor-pointer line-clamp-2 break-words">
                        {card.title}
                      </h3>
                    </Link>

                    <p className="mt-1.5 text-xs font-medium text-[#222222] dark:text-gray-300 line-clamp-2 leading-relaxed break-words">
                      {card.excerpt}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold gap-2">
                    <Link
                      href={cardTargetHref}
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      className="min-h-[44px] inline-flex items-center text-[#0d4d4d] dark:text-emerald-400 hover:underline font-black touch-manipulation"
                    >
                      📖 Read Full
                    </Link>
                    {hasCardVideo && (
                      <button
                        onClick={() =>
                          openVideoModal({
                            title: card.videoTitle || card.title,
                            category: card.category,
                            duration: card.videoDuration || '02:00',
                            quality: '1080p HD',
                            location: 'Coimbatore Civic Zone',
                            caption: card.excerpt,
                            videoUrl: card.videoUrl,
                          })
                        }
                        className="min-h-[44px] inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#f3ede2] dark:bg-slate-800 text-[#111111] dark:text-gray-200 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-black transition-colors touch-manipulation cursor-pointer"
                      >
                        🎥 Watch Video
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {infraData.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/category/infrastructure-updates"
                prefetch={true}
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-lg bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs touch-manipulation"
              >
                <span>View More Stories</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* DYNAMIC IN-FEED AD BREAK 3 (HOME_IN_FEED_3 - AFTER INFRA)      */}
        {/* ============================================================== */}
        <div className="w-full max-w-full py-2 box-border">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#555555] dark:text-gray-400 mb-1">
            Advertisement • {homeInFeed3?.slides?.[0]?.advertiser || 'Category Spotlight'}
          </div>
          <AdSlider ad={homeInFeed3} variant="infeed" label="CAMPUS & EDUCATION" />
        </div>

        {/* SECTION 4: "BUSINESS & STARTUPS" (STAT COUNTERS + 6 CARDS IN 3-COLUMN GRID) */}
        <div id="business" className="w-full max-w-full space-y-3 pt-1 scroll-mt-28 box-border">
          <div className="border-b border-stone-300 dark:border-slate-800 pb-1 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#111111] dark:text-gray-100 flex items-center gap-1.5">
              <span className="text-emerald-800 dark:text-emerald-400 font-black">📈</span>
              BUSINESS & STARTUP PULSE
            </h2>
          </div>

          {/* High-Impact Stat Counters Strip */}
          <div className="w-full max-w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl bg-[#f3ede2] dark:bg-slate-900 border border-[#dcd5c7] dark:border-slate-800 box-border">
            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-2xs">
              <span className="block text-lg sm:text-xl font-black text-[#0d4d4d] dark:text-emerald-400">400+</span>
              <span className="text-[10px] font-bold text-[#444444] dark:text-gray-400 uppercase">EV MSME Units</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-2xs">
              <span className="block text-lg sm:text-xl font-black text-red-600 dark:text-red-400">₹12,800Cr</span>
              <span className="text-[10px] font-bold text-[#444444] dark:text-gray-400 uppercase">Textile Exports</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-2xs">
              <span className="block text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-400">140+</span>
              <span className="text-[10px] font-bold text-[#444444] dark:text-gray-400 uppercase">SaaS Startups</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-2xs">
              <span className="block text-lg sm:text-xl font-black text-red-700 dark:text-red-400">44 km</span>
              <span className="text-[10px] font-bold text-[#444444] dark:text-gray-400 uppercase">Metro Phase-1</span>
            </div>
          </div>

          {/* 6 Business News Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 sm:gap-6 w-full max-w-full box-border">
            {businessData.map((card) => {
              const cardWords = (card.excerpt + ' ' + card.title).trim().split(/\s+/).filter(Boolean).length;
              const cardListenMins = Math.max(1, Math.ceil(cardWords / 130));
              const cardTargetHref = card.articleHref || `/article/${card.id}`;
              const hasCardVideo = hasActualVideo(card);

              return (
                <article
                  key={card.id}
                  className="w-full max-w-full h-full flex flex-col justify-between group rounded-xl border border-stone-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-stone-400 dark:hover:border-slate-700 transition-all shadow-xs box-border break-words"
                >
                  <div>
                    {/* Thumbnail Image & Video Badge - ONLY if real image exists */}
                    {card.imageUrl && card.imageUrl.trim() !== '' ? (
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 mb-3 border border-gray-100 dark:border-gray-800">
                        <Link href={cardTargetHref} onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="block w-full h-full">
                          <img
                            src={card.imageUrl}
                            alt={card.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                          {card.category}
                        </span>
                        {card.highlightStat && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-black">
                            {card.highlightStat}
                          </span>
                        )}
                      </div>
                    ) : (
                      card.category && (
                        <div className="mb-2">
                          <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-700 dark:text-gray-300">
                            {card.category}
                          </span>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between text-xs mb-1 font-bold text-[#444444] dark:text-gray-400">
                      <span className="text-[#111111] dark:text-gray-100 font-black">{card.author}</span>
                      <span>{card.timeAgo}</span>
                    </div>

                    <Link href={cardTargetHref} onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="block">
                      <h3 className="text-sm sm:text-base font-bold text-[#111111] dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug cursor-pointer line-clamp-2 break-words">
                        {card.title}
                      </h3>
                    </Link>

                    <p className="mt-1.5 text-xs font-medium text-[#222222] dark:text-gray-300 line-clamp-2 leading-relaxed break-words">
                      {card.excerpt}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold gap-2">
                    <Link
                      href={cardTargetHref}
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      className="min-h-[44px] inline-flex items-center text-[#0d4d4d] dark:text-emerald-400 hover:underline font-black touch-manipulation"
                    >
                      📖 Read Full
                    </Link>
                    {hasCardVideo && (
                      <button
                        onClick={() =>
                          openVideoModal({
                            title: card.videoTitle || card.title,
                            category: card.category,
                            duration: card.videoDuration || '02:00',
                            quality: '1080p HD',
                            location: 'Industrial Corridor, Coimbatore',
                            caption: card.excerpt,
                            videoUrl: card.videoUrl,
                          })
                        }
                        className="min-h-[44px] inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#f3ede2] dark:bg-slate-800 text-[#111111] dark:text-gray-200 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-black transition-colors touch-manipulation cursor-pointer"
                      >
                        🎥 Watch Video
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {businessData.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/category/business"
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-lg bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs touch-manipulation"
              >
                <span>View More Stories</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* DYNAMIC IN-FEED AD BREAK 4 (HOME_IN_FEED_4 - AFTER BUSINESS)   */}
        {/* ============================================================== */}
        <div className="w-full max-w-full py-2 box-border">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#555555] dark:text-gray-400 mb-1">
            Advertisement • {homeInFeed4?.slides?.[0]?.advertiser || 'Enterprise Workspace'}
          </div>
          <AdSlider ad={homeInFeed4} variant="infeed" label="ENTERPRISE WORKSPACE" />
        </div>

        {/* SECTION 5: "CEO" SPOTLIGHT (3 FEATURED PROFILES - FULL 3-COLUMN GRID) */}
        <div id="ceos" className="w-full max-w-full space-y-3 pt-1 scroll-mt-28 box-border">
          <div className="border-b border-stone-300 dark:border-slate-800 pb-1 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#111111] dark:text-gray-100 flex items-center gap-1.5">
              <span className="text-red-600 dark:text-red-500 font-black">👑</span>
              CEO
            </h2>
          </div>

          <div className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 box-border">
            {ceoData.slice(0, 3).map((profile) => {
              const profileTargetHref = profile.articleHref || `/article/${profile.id}`;

              const hasProfileVideo = hasActualVideo(profile);

              return (
                <article
                  key={profile.id}
                  className="w-full max-w-full h-full flex flex-col justify-between group rounded-2xl border border-stone-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 hover:border-stone-400 dark:hover:border-slate-700 transition-all shadow-xs box-border break-words"
                >
                  <div>
                    {/* Profile Avatar / Video Thumbnail */}
                    {profile.imageUrl && profile.imageUrl.trim() !== '' ? (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-stone-300 dark:border-slate-700 bg-slate-900 mb-3">
                        <Link href={profileTargetHref} onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="block w-full h-full">
                          <img
                            src={profile.imageUrl}
                            alt={profile.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-red-400 text-[10px] font-black uppercase tracking-wider">
                          {profile.timeAgo}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <span className="inline-block rounded-md bg-stone-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase text-stone-700 dark:text-stone-300">
                          {profile.timeAgo || 'CEO Spotlight'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-black text-[#0d4d4d] dark:text-emerald-400 text-xs sm:text-sm">{profile.name}</span>
                      <span className="text-xs text-[#444444] dark:text-gray-400 font-bold">{profile.company}</span>
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-red-700 dark:text-red-400 block mb-1.5">
                      {profile.role}
                    </span>

                    <Link href={profileTargetHref} onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="block">
                      <h3 className="text-base font-bold text-[#111111] dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug break-words">
                        {profile.title}
                      </h3>
                    </Link>

                    <blockquote className="mt-2 p-2.5 rounded-lg bg-[#f8f6f0] dark:bg-slate-800/80 border-l-3 border-red-600 dark:border-red-500 text-xs font-medium text-[#222222] dark:text-gray-300 italic break-words">
                      &ldquo;{profile.quote}&rdquo;
                    </blockquote>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-4 pt-2.5 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold gap-2">
                    <Link
                      href={profileTargetHref}
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      className="min-h-[44px] inline-flex items-center text-[#0d4d4d] dark:text-emerald-400 hover:underline font-black touch-manipulation"
                    >
                      📖 Read Full
                    </Link>
                    {hasProfileVideo && (
                      <button
                        onClick={() =>
                          openVideoModal({
                            title: `${profile.name} — ${profile.company} Executive Interview`,
                            category: 'CEO',
                            duration: profile.videoDuration || '03:00',
                            quality: '4K Ultra HD',
                            location: 'Peelamedu Tech Park, Coimbatore',
                            caption: profile.quote,
                            videoUrl: profile.videoUrl,
                          })
                        }
                        className="min-h-[44px] inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-[#0d4d4d] dark:bg-emerald-700 hover:bg-[#153d3b] dark:hover:bg-emerald-600 text-white font-black transition-colors touch-manipulation cursor-pointer"
                      >
                        🎥 Watch ({profile.videoDuration || '03:00'})
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {ceoData.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/category/ceos"
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-lg bg-[#0d4d4d] hover:bg-[#153d3b] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs touch-manipulation"
              >
                <span>View More Stories</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      </UniversalSideLayout>

      {/* ------------------------------------------------------------------ */}
      {/* 4. FOOTER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Footer />

      {/* -------------------------------------------------------------------- */}
      {/* 5. INTERACTIVE VIDEO PLAYER POPUP MODAL                              */}
      {/* -------------------------------------------------------------------- */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-950 border border-white/20 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/15 bg-black/60">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-xs uppercase">
                  {activeVideoModal.category}
                </span>
                <span className="text-white text-xs font-bold hidden sm:inline">
                  • {activeVideoModal.location}
                </span>
              </div>
              <button
                onClick={closeVideoModal}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-colors touch-manipulation cursor-pointer"
                aria-label="Close Video Modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Player Body with Responsive YouTube Stream */}
            <div className="relative aspect-video w-full bg-black">
              <VideoPlayer
                url={activeVideoModal.videoUrl || "https://www.youtube.com/watch?v=8V-2Z0m2c0s"}
                title={activeVideoModal.title}
                autoplay={true}
                className="w-full h-full"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 bg-slate-900 border-t border-white/15">
              <h4 className="text-white font-bold text-sm sm:text-base">
                {activeVideoModal.title}
              </h4>
              <p className="text-stone-300 text-xs font-medium mt-1">
                {activeVideoModal.caption}
              </p>
            </div>
          </div>
        </div>
      )}



      {/* Hero Story Universal Share Modal */}
      <ShareModal
        isOpen={isHeroShareOpen}
        onClose={() => setIsHeroShareOpen(false)}
        title={latestHeroArticle?.title || "Today's Coimbatore"}
        url={typeof window !== 'undefined' ? `${window.location.origin}${latestHeroArticle ? `/article/${latestHeroArticle.id}` : ''}` : `https://todayscoimbatore.com${latestHeroArticle ? `/article/${latestHeroArticle.id}` : ''}`}
      />

    </div>
  );
}
