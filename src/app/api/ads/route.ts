import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { sendAdInquiryNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export interface LocalAdCampaign {
  id: string;
  slotId: string;
  format: 'leaderboard' | 'medium-rectangle' | 'half-page' | 'in-feed';
  title: string;
  description: string;
  advertiserName: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  badgeText?: string;
  startDate: string; // ISO String or YYYY-MM-DD
  endDate: string;   // ISO String or YYYY-MM-DD
  priority: number;
  status: 'active' | 'paused' | 'archived';
  categoryContext?: string;
}

export interface AdEngineResponse {
  status: 'success' | 'fallback';
  type: 'local_partner' | 'programmatic';
  provider?: string;
  adClient?: string;
  slotId: string;
  format: string;
  campaign: {
    id: string;
    title: string;
    description: string;
    advertiserName: string;
    ctaText: string;
    ctaUrl: string;
    imageUrl?: string;
    badgeText?: string;
    isProgrammatic?: boolean;
  };
}

// Enterprise Local Partner Campaigns Catalog
const REGISTERED_CAMPAIGNS: LocalAdCampaign[] = [
  {
    id: 'camp-elgi-infeed',
    slotId: 'HOME_IN_FEED_1',
    format: 'in-feed',
    title: 'ELGi Industrial Air Compressors & Smart Automation Solutions',
    description: 'Upgrade factory floor efficiency with Industry 4.0 energy-saving rotary screw compressors made in Coimbatore.',
    advertiserName: 'ELGi Equipments Global',
    ctaText: 'Book Free Plant Energy Audit',
    ctaUrl: 'https://todayscoimbatore.com',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    badgeText: 'Featured Partner',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    priority: 10,
    status: 'active',
  },
  {
    id: 'camp-kongu-villas',
    slotId: 'HOME_IN_FEED_2',
    format: 'in-feed',
    title: 'Kongu Living Gated Villa Community in Saravanampatti IT Corridor',
    description: 'DTCP & RERA approved 3 & 4 BHK luxury smart villas with clubhouse, EV charging points, and 24/7 security.',
    advertiserName: 'Kongu Living Developers',
    ctaText: 'Schedule Site Visit & Brochure',
    ctaUrl: 'https://todayscoimbatore.com',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    badgeText: 'Property Showcase',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    priority: 9,
    status: 'active',
  },
  {
    id: 'camp-psg-admissions',
    slotId: 'HOME_IN_FEED_3',
    format: 'in-feed',
    title: 'PSG Tech, CIT & Kumaraguru Engineering Admissions Open 2026',
    description: 'Shape your future with premier AI, Robotics, and DeepTech engineering programs with top tier-1 placements.',
    advertiserName: 'Covai Higher Education Guild',
    ctaText: 'Check Cutoffs & Apply',
    ctaUrl: 'https://todayscoimbatore.com',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    badgeText: 'Campus & Education',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    priority: 8,
    status: 'active',
  },
  {
    id: 'camp-covai-workspaces',
    slotId: 'HOME_IN_FEED_4',
    format: 'in-feed',
    title: 'Supercharge Your Startup with Coimbatore Co-Working Hubs',
    description: 'Flexible private cabins, enterprise-grade high-speed fiber, and 24x7 power redundancy at RS Puram & Peelamedu.',
    advertiserName: 'Covai Workspaces',
    ctaText: 'Book Free Day Pass',
    ctaUrl: 'https://todayscoimbatore.com',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    badgeText: 'Enterprise Workspace',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    priority: 7,
    status: 'active',
  },
  {
    id: 'camp-elgi-industrial',
    slotId: 'TOP_HEADER_LEADERBOARD',
    format: 'leaderboard',
    title: 'ELGi Industrial Air Compressors & Smart Automation Solutions',
    description: 'Upgrade factory floor efficiency with Industry 4.0 energy-saving rotary screw compressors made in Coimbatore.',
    advertiserName: 'ELGi Equipments Global',
    ctaText: 'Book Free Plant Energy Audit',
    ctaUrl: 'https://todayscoimbatore.com',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    badgeText: 'Sponsored Feature',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    priority: 6,
    status: 'active',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slot') || searchParams.get('slotId') || 'slot-default';
    const format = searchParams.get('format') || 'in-feed';
    const listAll = searchParams.get('all') === 'true';

    const now = new Date();

    // If admin requests all campaigns list
    if (listAll) {
      const activeCount = REGISTERED_CAMPAIGNS.filter((c) => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        return start <= now && now <= end && c.status === 'active';
      }).length;

      return NextResponse.json({
        status: 'success',
        totalCampaigns: REGISTERED_CAMPAIGNS.length,
        activeCampaignsCount: activeCount,
        campaigns: REGISTERED_CAMPAIGNS,
      });
    }

    // Match active campaigns within valid date range (startDate <= now <= endDate)
    const validActiveCampaigns = REGISTERED_CAMPAIGNS.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      const isInDateRange = start <= now && now <= end;
      const isStatusActive = c.status === 'active';
      const isFormatMatch = !format || c.format === format;
      const isSlotMatch =
        !slotId ||
        slotId === 'slot-default' ||
        c.slotId.toLowerCase() === slotId.toLowerCase() ||
        (slotId === 'HOME_IN_FEED_1' && c.slotId === 'slot-between-stories-mycity') ||
        (slotId === 'HOME_IN_FEED_2' && c.slotId === 'slot-news-infrastructure') ||
        (slotId === 'HOME_IN_FEED_3' && c.slotId === 'slot-category-after-4th') ||
        (slotId === 'HOME_IN_FEED_4' && c.slotId === 'slot-business-infeed') ||
        (slotId === 'slot-between-stories-mycity' && c.slotId === 'HOME_IN_FEED_1') ||
        (slotId === 'slot-news-infrastructure' && c.slotId === 'HOME_IN_FEED_2') ||
        (slotId === 'slot-category-after-4th' && c.slotId === 'HOME_IN_FEED_3') ||
        (slotId === 'slot-business-infeed' && c.slotId === 'HOME_IN_FEED_4');

      return isInDateRange && isStatusActive && isSlotMatch && isFormatMatch;
    }).sort((a, b) => b.priority - a.priority);

    // If local campaign is active, serve it
    if (validActiveCampaigns.length > 0) {
      const selected = validActiveCampaigns[0];
      const response: AdEngineResponse = {
        status: 'success',
        type: 'local_partner',
        slotId: selected.slotId || slotId,
        format: selected.format,
        campaign: {
          id: selected.id,
          title: selected.title,
          description: selected.description,
          advertiserName: selected.advertiserName,
          ctaText: selected.ctaText,
          ctaUrl: selected.ctaUrl,
          imageUrl: selected.imageUrl,
          badgeText: selected.badgeText || 'Sponsored',
          isProgrammatic: false,
        },
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Fallback to Google AdSense programmatic ad slot when no local campaign is active
    const fallbackResponse: AdEngineResponse = {
      status: 'fallback',
      type: 'programmatic',
      provider: 'Google AdSense (Tamil Nadu High-CTR Inventory)',
      adClient: 'ca-pub-9842109482019482',
      slotId: slotId || 'adsense-auto-injected-slot',
      format: format,
      campaign: {
        id: 'adsense-dynamic-feed',
        title: 'Discover Top Business & Tech Opportunities Across Coimbatore',
        description: 'Explore verified regional offers, local enterprise solutions, and hyper-local commercial services.',
        advertiserName: 'AdSense Partner Network',
        ctaText: 'Explore Partner Deals',
        ctaUrl: 'https://todayscoimbatore.com',
        badgeText: 'Advertisement',
        isProgrammatic: true,
      },
    };

    return NextResponse.json(fallbackResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to evaluate dynamic ads delivery engine',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { advertiserName, companyName, email, phone, adFormat, budgetOrDuration, message } = body;

    if (!advertiserName || !email) {
      return NextResponse.json(
        { error: 'Advertiser name and email are required.' },
        { status: 400 }
      );
    }

    // 1. Save commercial ad inquiry to Supabase enquiries table
    try {
      await supabaseAdmin.from('enquiries').insert([
        {
          user_name: advertiserName.trim(),
          user_phone: phone?.trim() || email.trim(),
          service_requested: `Ad Inquiry: ${companyName ? `${companyName} (${adFormat || 'Banner'})` : adFormat || 'General Advertising'}`,
          message: `Budget/Duration: ${budgetOrDuration || 'N/A'}\n\nDetails: ${message || 'No additional notes'}`,
          status: 'unread',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbErr) {
      console.warn('[Ads API] Failed to save ad inquiry in Supabase:', dbErr);
    }

    // 2. Asynchronously fire email alert to todayscoimbatore@gmail.com
    sendAdInquiryNotification({
      data: {
        advertiserName: advertiserName.trim(),
        companyName: companyName?.trim(),
        email: email.trim(),
        phone: phone?.trim(),
        adFormat: adFormat?.trim(),
        budgetOrDuration: budgetOrDuration?.trim(),
        message: message?.trim(),
      },
    }).catch((emailErr) => {
      console.error('[Ads API] Background ad alert email failed:', emailErr);
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your advertising inquiry has been received by our commercial desk.',
    });
  } catch (err: any) {
    console.error('[Ads API] Error processing ad inquiry:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process advertising inquiry.' },
      { status: 500 }
    );
  }
}
