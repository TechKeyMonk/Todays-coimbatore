import { supabase } from '@/lib/supabaseClient';
import dbService from '@/services/db';

export interface SupabaseListing {
  id: string;
  title: string;
  category: string;
  phone?: string | null;
  address?: string | null;
  area?: string | null;
  pincode?: string | null;
  rating?: number | null;
  created_at?: string;
  images?: string[] | null;
  image_url?: string | null;
}

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface SupabaseBloodDonor {
  id: string;
  name: string;
  blood_group: string;
  area: string;
  phone: string;
  status?: string;
}

export interface SupabaseNews {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  image_url?: string | null;
  author: string;
  created_at?: string;
  seo_title?: string | null;
  meta_description?: string | null;
  keywords?: string | null;
  og_image_url?: string | null;
}

export interface SupabaseEnquiry {
  id: string;
  user_name: string;
  user_phone: string;
  service_requested?: string | null;
  message: string;
  status: string;
  created_at?: string;
}

export interface SupabaseEvent {
  id: string;
  event_name: string;
  location: string;
  event_date?: string | null;
  contact_phone?: string | null;
  description: string;
  image_url?: string | null;
}

async function callContentApi(action: string, data?: any, id?: string, entity?: string) {
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data, id, entity }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || `Failed to perform action: ${action}`);
  }
  return json.data;
}

function broadcastSync(domainEvent?: string) {
  if (typeof window !== 'undefined') {
    if (domainEvent) window.dispatchEvent(new Event(domainEvent));
    window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated'));
    window.dispatchEvent(new Event('storage'));
    dbService.syncWithServer(true);
  }
}

export const supabaseAdminService = {
  // ==========================================
  // 1. LISTINGS
  // ==========================================
  async getListings(): Promise<SupabaseListing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch listings fallback:', error);
      const local = await dbService.getDirectoryListings();
      return local.map((l) => ({
        id: l.id,
        title: l.name,
        category: l.category,
        phone: l.phone || null,
        address: l.address || null,
        area: l.area || null,
        pincode: (l as any).pincode || null,
        rating: l.rating || 4.5,
        created_at: l.createdAt,
        images: l.images || (l.imageUrl ? [l.imageUrl] : []),
        image_url: l.imageUrl || (l.images && l.images[0]) || null,
      }));
    }
    return data || [];
  },

  async addListing(item: Omit<SupabaseListing, 'id' | 'created_at'>): Promise<SupabaseListing | null> {
    const result = await callContentApi('create_listing', item);
    broadcastSync('directoryStorageUpdate');
    return result;
  },

  async updateListing(id: string, item: Partial<SupabaseListing>): Promise<SupabaseListing | null> {
    const result = await callContentApi('update_listing', item, id);
    broadcastSync('directoryStorageUpdate');
    return result;
  },

  async deleteListing(id: string): Promise<boolean> {
    await callContentApi('delete_listing', null, id);
    broadcastSync('directoryStorageUpdate');
    return true;
  },

  // ==========================================
  // 2. CATEGORIES
  // ==========================================
  async getCategories(): Promise<SupabaseCategory[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.warn('Supabase fetch categories fallback:', error);
      const local = await dbService.getDirectoryCategories();
      return local.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon || '🏢',
      }));
    }
    return data || [];
  },

  async addCategory(item: Omit<SupabaseCategory, 'id'>): Promise<SupabaseCategory | null> {
    const result = await callContentApi('create_category', item);
    broadcastSync('directoryCategoriesStorageUpdate');
    return result;
  },

  async updateCategory(id: string, item: Partial<SupabaseCategory>): Promise<SupabaseCategory | null> {
    const result = await callContentApi('update_category', item, id);
    broadcastSync('directoryCategoriesStorageUpdate');
    return result;
  },

  async deleteCategory(id: string): Promise<boolean> {
    await callContentApi('delete_category', null, id);
    broadcastSync('directoryCategoriesStorageUpdate');
    return true;
  },

  // ==========================================
  // 3. BLOOD DONORS
  // ==========================================
  async getBloodDonors(): Promise<SupabaseBloodDonor[]> {
    const { data, error } = await supabase
      .from('blood_donors')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.warn('Supabase fetch blood donors fallback:', error);
      const local = await dbService.getBloodDonors();
      return local.map((d) => ({
        id: d.id,
        name: d.name,
        blood_group: d.bloodGroup,
        area: d.area,
        phone: d.phone,
        status: d.isAvailable ? 'Available' : 'Unavailable',
      }));
    }
    return data || [];
  },

  async addBloodDonor(item: Omit<SupabaseBloodDonor, 'id'>): Promise<SupabaseBloodDonor | null> {
    const result = await callContentApi('create_blood_donor', item);
    broadcastSync('donorsStorageUpdate');
    return result;
  },

  async updateBloodDonor(id: string, item: Partial<SupabaseBloodDonor>): Promise<SupabaseBloodDonor | null> {
    const result = await callContentApi('update_blood_donor', item, id);
    broadcastSync('donorsStorageUpdate');
    return result;
  },

  async deleteBloodDonor(id: string): Promise<boolean> {
    await callContentApi('delete_blood_donor', null, id);
    broadcastSync('donorsStorageUpdate');
    return true;
  },

  // ==========================================
  // 4. NEWS / ARTICLES
  // ==========================================
  async getNews(): Promise<SupabaseNews[]> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch news fallback:', error);
      const local = await dbService.getArticles();
      return local.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug || a.id,
        category: a.category,
        content: a.content || a.excerpt,
        image_url: a.imageUrl || a.image || null,
        author: a.author,
        created_at: a.createdAt,
        seo_title: a.title,
        meta_description: a.excerpt,
        keywords: null,
        og_image_url: a.imageUrl || null,
      }));
    }
    return data || [];
  },

  async addNews(item: Omit<SupabaseNews, 'id' | 'created_at'>): Promise<SupabaseNews | null> {
    const result = await callContentApi('create_article', item);
    broadcastSync('newsStorageUpdate');
    return result;
  },

  async updateNews(id: string, item: Partial<SupabaseNews>): Promise<SupabaseNews | null> {
    const result = await callContentApi('update_article', item, id);
    broadcastSync('newsStorageUpdate');
    return result;
  },

  async deleteNews(id: string): Promise<boolean> {
    await callContentApi('delete_article', null, id);
    broadcastSync('newsStorageUpdate');
    return true;
  },

  // ==========================================
  // 5. ENQUIRIES
  // ==========================================
  async getEnquiries(): Promise<SupabaseEnquiry[]> {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .not('user_name', 'like', '__SYSTEM_CONFIG_%')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch enquiries error:', error);
      return [];
    }
    return data || [];
  },

  async addEnquiry(item: Omit<SupabaseEnquiry, 'id' | 'created_at'>): Promise<SupabaseEnquiry | null> {
    const result = await callContentApi('create_enquiry', item);
    broadcastSync('enquiriesStorageUpdate');
    return result;
  },

  async updateEnquiryStatus(id: string, status: string): Promise<SupabaseEnquiry | null> {
    const result = await callContentApi('update_enquiry_status', { status }, id);
    broadcastSync('enquiriesStorageUpdate');
    return result;
  },

  async deleteEnquiry(id: string): Promise<boolean> {
    await callContentApi('delete_enquiry', null, id);
    broadcastSync('enquiriesStorageUpdate');
    return true;
  },

  // ==========================================
  // 6. EVENTS
  // ==========================================
  async getEvents(): Promise<SupabaseEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (error) {
      console.warn('Supabase fetch events fallback:', error);
      const local = await dbService.getEvents();
      return local.map((e) => ({
        id: e.id,
        event_name: e.title,
        location: e.venue,
        event_date: e.date,
        contact_phone: (e as any).contactPhone || null,
        description: e.description,
        image_url: e.posterUrl || (e as any).imageUrl || null,
      }));
    }
    return data || [];
  },

  async addEvent(item: Omit<SupabaseEvent, 'id'>): Promise<SupabaseEvent | null> {
    const result = await callContentApi('create_event', item);
    broadcastSync('eventsStorageUpdate');
    return result;
  },

  async updateEvent(id: string, item: Partial<SupabaseEvent>): Promise<SupabaseEvent | null> {
    const result = await callContentApi('update_event', item, id);
    broadcastSync('eventsStorageUpdate');
    return result;
  },

  async deleteEvent(id: string): Promise<boolean> {
    await callContentApi('delete_event', null, id);
    broadcastSync('eventsStorageUpdate');
    return true;
  },
};

export default supabaseAdminService;
