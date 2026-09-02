'use client';

import React from 'react';
import {
  Stethoscope,
  Shirt,
  Utensils,
  Laptop,
  GraduationCap,
  Building2,
  Gem,
  Car,
  ShoppingCart,
  Hotel,
  Scissors,
  Dumbbell,
  Smartphone,
  School,
  PartyPopper,
  Truck,
  Pill,
  Cake,
  Armchair,
  Plane,
  Sun,
  Zap,
  Dog,
  Coffee,
  Briefcase,
  Scale,
  Landmark,
  Shield,
  Heart,
  Leaf,
  Hammer,
  Camera,
  Sparkles,
  Store,
  Users,
  Factory,
  Coins,
  Fuel,
  Wrench,
  Music,
  Smile,
  LucideIcon,
} from 'lucide-react';

export interface CategoryTheme {
  icon: LucideIcon;
  emoji: string;
  colorClass: string;
  bgLightClass: string;
  borderLightClass: string;
}

export interface CategoryMeta {
  id: string;
  name: string;
  count?: string;
  color: string;
  bgLight: string;
  borderLight: string;
  glowColor: string;
  icon: LucideIcon;
  fallbackEmoji: string;
}

// Title Case Formatter for Clean Display
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => {
      const w = word.trim();
      if (!w) return '';
      if (w.toLowerCase() === 'and' || w === '&') return '&';
      if (w.toLowerCase() === 'it' || w.toLowerCase() === 'psg' || w.toLowerCase() === 'elcot') return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
};

// Curated Category High-Resolution Image Fallbacks
export const getCategoryFallbackImage = (category?: string, slug?: string): string => {
  const c = (category || slug || '').toLowerCase();
  if (c.includes('hospital') || c.includes('clinic') || c.includes('health') || c.includes('medical')) {
    return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('jewel') || c.includes('gold') || c.includes('diamond')) {
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('hotel') || c.includes('resort') || c.includes('stay') || c.includes('banquet')) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('it') || c.includes('software') || c.includes('tech') || c.includes('tidel')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('supermarket') || c.includes('grocery') || c.includes('mall') || c.includes('store')) {
    return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('college') || c.includes('school') || c.includes('university') || c.includes('education')) {
    return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('textile') || c.includes('clothing') || c.includes('handloom') || c.includes('silk')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('restaurant') || c.includes('food') || c.includes('cafe') || c.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
  }
  if (c.includes('auto') || c.includes('car') || c.includes('bike') || c.includes('garage')) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
};

// Global Standard Slugify Helper
export const slugify = (text: string): string => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Global String Normalization Helper
export const normalizeCategoryStr = (str: string): string => {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
};

// Single Dynamic Icon & Theme Resolver Utility
export const getCategoryIcon = (categoryNameOrSlug: string): CategoryTheme => {
  const norm = normalizeCategoryStr(categoryNameOrSlug);

  // 1. Jewellery & Precious Metals
  if (norm.includes('jewel') || norm.includes('gold') || norm.includes('diamond') || norm.includes('silver')) {
    return { icon: Gem, emoji: '💎', colorClass: 'text-amber-500 dark:text-amber-400', bgLightClass: 'bg-amber-50 dark:bg-amber-950/40', borderLightClass: 'border-amber-200 dark:border-amber-900/60' };
  }
  // 2. Hospitals & Healthcare
  if (norm.includes('hospital') || norm.includes('clinic') || norm.includes('health') || norm.includes('medic') || norm.includes('doctor') || norm.includes('dental')) {
    return { icon: Stethoscope, emoji: '🏥', colorClass: 'text-rose-600 dark:text-rose-400', bgLightClass: 'bg-rose-50 dark:bg-rose-950/40', borderLightClass: 'border-rose-200 dark:border-rose-900/60' };
  }
  // 3. Textiles & Garments
  if (norm.includes('textile') || norm.includes('garment') || norm.includes('fashion') || norm.includes('cloth') || norm.includes('boutique') || norm.includes('silk') || norm.includes('mill')) {
    return { icon: Shirt, emoji: '🧵', colorClass: 'text-indigo-600 dark:text-indigo-400', bgLightClass: 'bg-indigo-50 dark:bg-indigo-950/40', borderLightClass: 'border-indigo-200 dark:border-indigo-900/60' };
  }
  // 4. Restaurants & Food
  if (norm.includes('restaurant') || norm.includes('cafe') || norm.includes('food') || norm.includes('dine') || norm.includes('eat') || norm.includes('coffee') || norm.includes('bistro')) {
    return { icon: Utensils, emoji: '🍽️', colorClass: 'text-orange-600 dark:text-orange-400', bgLightClass: 'bg-orange-50 dark:bg-orange-950/40', borderLightClass: 'border-orange-200 dark:border-orange-900/60' };
  }
  // 5. IT & Software / Tech
  if (norm.includes('software') || norm.includes('tech') || norm.includes('code') || norm.includes('app') || norm.includes('cloud') || norm.includes('tidel') || norm.includes('itandsoftware') || (norm.startsWith('it') && !norm.includes('item'))) {
    return { icon: Laptop, emoji: '💻', colorClass: 'text-blue-600 dark:text-blue-400', bgLightClass: 'bg-blue-50 dark:bg-blue-950/40', borderLightClass: 'border-blue-200 dark:border-blue-900/60' };
  }
  // 6. Colleges & Universities
  if (norm.includes('college') || norm.includes('universit') || norm.includes('degree') || norm.includes('institute') || norm.includes('polytechnic')) {
    return { icon: GraduationCap, emoji: '🎓', colorClass: 'text-emerald-600 dark:text-emerald-400', bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderLightClass: 'border-emerald-200 dark:border-emerald-900/60' };
  }
  // 7. Schools & Academies
  if (norm.includes('school') || norm.includes('tuition') || norm.includes('academ') || norm.includes('class') || norm.includes('cbse')) {
    return { icon: School, emoji: '📚', colorClass: 'text-violet-600 dark:text-violet-400', bgLightClass: 'bg-violet-50 dark:bg-violet-950/40', borderLightClass: 'border-violet-200 dark:border-violet-900/60' };
  }
  // 8. Supermarkets & Retail
  if (norm.includes('supermarket') || norm.includes('grocer') || norm.includes('mart') || norm.includes('store') || norm.includes('shop') || norm.includes('provision')) {
    return { icon: ShoppingCart, emoji: '🛒', colorClass: 'text-green-600 dark:text-green-400', bgLightClass: 'bg-green-50 dark:bg-green-950/40', borderLightClass: 'border-green-200 dark:border-green-900/60' };
  }
  // 9. Hotels & Hospitality
  if (norm.includes('hotel') || norm.includes('resort') || norm.includes('lodge') || norm.includes('stay') || norm.includes('banquet') || norm.includes('suite')) {
    return { icon: Hotel, emoji: '🏨', colorClass: 'text-purple-600 dark:text-purple-400', bgLightClass: 'bg-purple-50 dark:bg-purple-950/40', borderLightClass: 'border-purple-200 dark:border-purple-900/60' };
  }
  // 10. Automobile & Vehicles
  if (norm.includes('auto') || norm.includes('car') || norm.includes('bike') || norm.includes('vehicle') || norm.includes('motor') || norm.includes('garage')) {
    return { icon: Car, emoji: '🚗', colorClass: 'text-red-600 dark:text-red-400', bgLightClass: 'bg-red-50 dark:bg-red-950/40', borderLightClass: 'border-red-200 dark:border-red-900/60' };
  }
  // 11. Real Estate & Builders
  if (norm.includes('realestate') || norm.includes('property') || norm.includes('builder') || norm.includes('flat') || norm.includes('housing') || norm.includes('villa')) {
    return { icon: Building2, emoji: '🏢', colorClass: 'text-teal-600 dark:text-teal-400', bgLightClass: 'bg-teal-50 dark:bg-teal-950/40', borderLightClass: 'border-teal-200 dark:border-teal-900/60' };
  }
  // 12. Gyms & Fitness
  if (norm.includes('gym') || norm.includes('fitness') || norm.includes('sport') || norm.includes('yoga') || norm.includes('workout')) {
    return { icon: Dumbbell, emoji: '💪', colorClass: 'text-orange-500 dark:text-orange-400', bgLightClass: 'bg-orange-50 dark:bg-orange-950/40', borderLightClass: 'border-orange-200 dark:border-orange-900/60' };
  }
  // 13. Salons & Spas
  if (norm.includes('salon') || norm.includes('spa') || norm.includes('beauty') || norm.includes('parlour') || norm.includes('hair') || norm.includes('makeover')) {
    return { icon: Scissors, emoji: '✂️', colorClass: 'text-pink-600 dark:text-pink-400', bgLightClass: 'bg-pink-50 dark:bg-pink-950/40', borderLightClass: 'border-pink-200 dark:border-pink-900/60' };
  }
  // 14. Electronics & Gadgets
  if (norm.includes('electronic') || norm.includes('appliance') || norm.includes('mobile') || norm.includes('tv') || norm.includes('gadget') || norm.includes('phone')) {
    return { icon: Smartphone, emoji: '📱', colorClass: 'text-cyan-600 dark:text-cyan-400', bgLightClass: 'bg-cyan-50 dark:bg-cyan-950/40', borderLightClass: 'border-cyan-200 dark:border-cyan-900/60' };
  }
  // 15. Event Planners
  if (norm.includes('event') || norm.includes('wedding') || norm.includes('decor') || norm.includes('party') || norm.includes('planner')) {
    return { icon: PartyPopper, emoji: '🎉', colorClass: 'text-fuchsia-600 dark:text-fuchsia-400', bgLightClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', borderLightClass: 'border-fuchsia-200 dark:border-fuchsia-900/60' };
  }
  // 16. Logistics & Courier
  if (norm.includes('logistics') || norm.includes('courier') || norm.includes('transport') || norm.includes('cargo') || norm.includes('pack')) {
    return { icon: Truck, emoji: '🚚', colorClass: 'text-sky-600 dark:text-sky-400', bgLightClass: 'bg-sky-50 dark:bg-sky-950/40', borderLightClass: 'border-sky-200 dark:border-sky-900/60' };
  }
  // 17. Pharmacies & Chemists
  if (norm.includes('pharmac') || norm.includes('chemist') || norm.includes('medicine') || norm.includes('drug')) {
    return { icon: Pill, emoji: '💊', colorClass: 'text-emerald-700 dark:text-emerald-400', bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderLightClass: 'border-emerald-200 dark:border-emerald-900/60' };
  }
  // 18. Bakeries & Sweets
  if (norm.includes('baker') || norm.includes('cake') || norm.includes('sweet') || norm.includes('pastry') || norm.includes('bread')) {
    return { icon: Cake, emoji: '🥐', colorClass: 'text-amber-700 dark:text-amber-400', bgLightClass: 'bg-amber-50 dark:bg-amber-950/40', borderLightClass: 'border-amber-200 dark:border-amber-900/60' };
  }
  // 19. Furniture & Interior
  if (norm.includes('furniture') || norm.includes('interior') || norm.includes('wood') || norm.includes('sofa') || norm.includes('decor')) {
    return { icon: Armchair, emoji: '🛋️', colorClass: 'text-stone-700 dark:text-stone-300', bgLightClass: 'bg-stone-100 dark:bg-slate-800', borderLightClass: 'border-stone-200 dark:border-slate-700' };
  }
  // 20. Travel & Tourism
  if (norm.includes('travel') || norm.includes('tour') || norm.includes('holiday') || norm.includes('flight') || norm.includes('visa')) {
    return { icon: Plane, emoji: '✈️', colorClass: 'text-blue-700 dark:text-blue-400', bgLightClass: 'bg-blue-50 dark:bg-blue-950/40', borderLightClass: 'border-blue-200 dark:border-blue-900/60' };
  }
  // 21. Banking & Finance
  if (norm.includes('bank') || norm.includes('finance') || norm.includes('tax') || norm.includes('account') || norm.includes('loan')) {
    return { icon: Landmark, emoji: '🏦', colorClass: 'text-emerald-800 dark:text-emerald-400', bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderLightClass: 'border-emerald-200 dark:border-emerald-900/60' };
  }
  // 22. Photography & Studio
  if (norm.includes('photo') || norm.includes('studio') || norm.includes('video') || norm.includes('camera')) {
    return { icon: Camera, emoji: '📷', colorClass: 'text-purple-700 dark:text-purple-400', bgLightClass: 'bg-purple-50 dark:bg-purple-950/40', borderLightClass: 'border-purple-200 dark:border-purple-900/60' };
  }
  // 23. Agriculture & Organic
  if (norm.includes('farm') || norm.includes('agri') || norm.includes('organic') || norm.includes('plant')) {
    return { icon: Leaf, emoji: '🌱', colorClass: 'text-green-700 dark:text-green-400', bgLightClass: 'bg-green-50 dark:bg-green-950/40', borderLightClass: 'border-green-200 dark:border-green-900/60' };
  }
  // 24. Manufacturing & Industry
  if (norm.includes('manufactur') || norm.includes('factory') || norm.includes('pump') || norm.includes('foundry') || norm.includes('machin')) {
    return { icon: Factory, emoji: '🏭', colorClass: 'text-slate-700 dark:text-slate-300', bgLightClass: 'bg-slate-100 dark:bg-slate-800', borderLightClass: 'border-slate-200 dark:border-slate-700' };
  }

  // Universal Fallback for any newly added category
  return {
    icon: Building2,
    emoji: '🏢',
    colorClass: 'text-red-600 dark:text-red-400',
    bgLightClass: 'bg-red-50 dark:bg-red-950/40',
    borderLightClass: 'border-red-200 dark:border-red-900/60',
  };
};

// Robust Case-Insensitive String Comparison (100% DB-to-Frontend Sync)
export const isListingInCategory = (
  listing: { category?: string; categorySlug?: string; title?: string },
  categoryIdentifier: string
): boolean => {
  if (!categoryIdentifier || categoryIdentifier === 'all' || categoryIdentifier === 'ALL') return true;

  const rawTarget = String(categoryIdentifier).trim().toLowerCase();
  const rawCat = String(listing.category || '').trim().toLowerCase();
  const rawSlug = String(listing.categorySlug || '').trim().toLowerCase();

  // Direct trimmed lowercase comparison
  if (rawTarget === rawCat || rawTarget === rawSlug) {
    return true;
  }

  const normTarget = normalizeCategoryStr(categoryIdentifier);
  const normCat = normalizeCategoryStr(listing.category || '');
  const normSlug = normalizeCategoryStr(listing.categorySlug || '');

  // Normalized comparison
  if (normTarget === normCat || normTarget === normSlug) {
    return true;
  }

  // Substring inclusion (e.g. "hospital" in "hospitalsandclinics")
  if (
    (normTarget.length >= 4 && normCat.includes(normTarget)) ||
    (normCat.length >= 4 && normTarget.includes(normCat))
  ) {
    return true;
  }

  return false;
};

// Backward-compatible getCategoryMeta wrapper
export const getCategoryMeta = (slugOrName: string): CategoryMeta => {
  const theme = getCategoryIcon(slugOrName);
  const targetSlug = slugify(slugOrName);

  let formattedName = toTitleCase(slugOrName) || 'General Directory';
  if (formattedName.includes('-') && !formattedName.includes(' ')) {
    formattedName = formattedName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return {
    id: targetSlug || 'category',
    name: formattedName,
    count: '1 Listing',
    color: theme.colorClass,
    bgLight: theme.bgLightClass,
    borderLight: theme.borderLightClass,
    glowColor: 'group-hover:shadow-red-200 dark:group-hover:shadow-red-950/50',
    icon: theme.icon,
    fallbackEmoji: theme.emoji,
  };
};

export const DIRECTORY_CATEGORIES_CONFIG: CategoryMeta[] = [
  'Hospitals & Clinics',
  'Textiles & Garments',
  'Restaurants & Cafes',
  'IT & Software',
  'Colleges & Universities',
  'Real Estate',
  'Jewellery',
  'Automobile',
  'Supermarkets',
  'Hotels',
  'Salons & Spas',
  'Gyms & Fitness',
  'Electronics',
  'Schools',
  'Event Planners',
  'Logistics',
  'Pharmacies',
  'Bakeries',
  'Furniture',
  'Travel Agencies',
].map((name) => getCategoryMeta(name));
