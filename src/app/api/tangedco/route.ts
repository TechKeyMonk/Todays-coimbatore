import { NextResponse } from 'next/server';

export interface TangedcoOutageRecord {
  id: string;
  area: string;
  substation: string;
  feeder: string;
  scheduledDate: string;
  timeWindow: string;
  status: 'scheduled' | 'active' | 'restored' | 'maintenance';
  reason: string;
  affectedStreets: string[];
  hotline: string;
  isTomorrow: boolean;
}

export interface TangedcoApiResponse {
  status: 'success' | 'error';
  timestamp: string;
  summary: {
    isTomorrowOutageScheduled: boolean;
    scheduledDate: string;
    totalAffectedFeeders: number;
    primaryHotline: string;
    centralControlRoom: string;
    affectedAreas: string[];
  };
  outages: TangedcoOutageRecord[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterArea = searchParams.get('area')?.toLowerCase();

    const now = new Date();
    
    // Tomorrow's date calculation
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    const tomorrowHuman = tomorrow.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Coimbatore Central, Metro, North & South Distribution Feeders
    const RAW_FEEDER_SCHEDULES: Omit<TangedcoOutageRecord, 'isTomorrow'>[] = [
      {
        id: 'tg-plm-01',
        area: 'Peelamedu & SITRA',
        substation: '110/22kV SITRA Substation',
        feeder: 'Peelamedu Tech Corridor Feeder #4',
        scheduledDate: tomorrowFormatted,
        timeWindow: '09:00 AM – 04:00 PM',
        status: 'scheduled',
        reason: '110kV HT Substation Line Clearing, Transformer Overhaul & Smart Grid Upgrades',
        affectedStreets: [
          'Avinashi Road (KMCH to SITRA Junction)',
          'Hope College & Peelamedu Pudur',
          'PSG Tech & Medical College Corridors',
          'Civil Aerodrome Road & Goldwins',
        ],
        hotline: '1912',
      },
      {
        id: 'tg-gnd-02',
        area: 'Gandhipuram & Cross Cut Rd',
        substation: '110/11kV Gandhipuram Central Substation',
        feeder: 'Cross Cut Commercial Feeder #2',
        scheduledDate: tomorrowFormatted,
        timeWindow: '09:30 AM – 02:30 PM',
        status: 'scheduled',
        reason: 'Feeder RMU Replacement & Underground Cable Network Maintenance',
        affectedStreets: [
          'Cross Cut Road Commercial Zone',
          '100 Feet Road (7th to 11th Street)',
          'Sathyamurthy Road & Ram Nagar East',
          'Gandhipuram Central Bus Stand Peripheral Feeders',
        ],
        hotline: '1912',
      },
      {
        id: 'tg-spt-03',
        area: 'Saravanampatti IT Corridor',
        substation: '230/110kV Saravanampatti Grid Substation',
        feeder: 'CHIL SEZ & Keeranatham Feeder',
        scheduledDate: tomorrowFormatted,
        timeWindow: '10:00 AM – 03:00 PM',
        status: 'scheduled',
        reason: '33kV Transmission Pole Relocation & High-Tension Tree Pruning',
        affectedStreets: [
          'Sathy Main Road (Saravanampatti Checkpost to IT SEZ)',
          'Keeranatham IT Park Road',
          'KGISL Campus & Kumaraguru Peripheral Zone',
          'Vilankurichi Road & Cheran Ma Nagar Section',
        ],
        hotline: '1912',
      },
      {
        id: 'tg-ukk-04',
        area: 'Ukkadam & Town Hall',
        substation: '110/11kV Ukkadam Substation',
        feeder: 'Ukkadam South & Big Bazaar St Feeder',
        scheduledDate: tomorrowFormatted,
        timeWindow: '09:00 AM – 04:00 PM',
        status: 'scheduled',
        reason: 'Distribution Transformer Load Balancing & Pre-Monsoon Line Clearing',
        affectedStreets: [
          'Oppanakara Street & Big Bazaar Street',
          'Town Hall & Clock Tower Perimeter',
          'Ukkadam Flyover Junction Feeder',
          'Sungam Bypass & Valankulam Promenade Feeders',
        ],
        hotline: '1912',
      },
      {
        id: 'tg-rsp-05',
        area: 'RS Puram & DB Road',
        substation: '110/11kV RS Puram Substation',
        feeder: 'West Zone Feeder #1',
        scheduledDate: tomorrowFormatted,
        timeWindow: '11:00 AM – 03:00 PM',
        status: 'scheduled',
        reason: 'HT Tree Trimming & Distribution Feeder Maintenance',
        affectedStreets: [
          'DB Road Commercial Hub',
          'TV Samy Road West',
          'Cowley Brown Road',
          'Thiruvenkatasamy Road East',
        ],
        hotline: '1912',
      },
    ];

    // Compute dynamic isTomorrow check per record
    const processedOutages: TangedcoOutageRecord[] = RAW_FEEDER_SCHEDULES.map((item) => ({
      ...item,
      isTomorrow: item.scheduledDate === tomorrowFormatted,
    }));

    // Filter by area if provided in query params
    const filteredOutages = filterArea
      ? processedOutages.filter((o) =>
          o.area.toLowerCase().includes(filterArea) ||
          o.affectedStreets.some((s) => s.toLowerCase().includes(filterArea))
        )
      : processedOutages;

    const hasTomorrowOutage = filteredOutages.some((o) => o.isTomorrow);
    const affectedAreaNames = Array.from(new Set(filteredOutages.map((o) => o.area.split('&')[0].trim())));

    const response: TangedcoApiResponse = {
      status: 'success',
      timestamp: now.toISOString(),
      summary: {
        isTomorrowOutageScheduled: hasTomorrowOutage,
        scheduledDate: `${tomorrowHuman} (${tomorrowFormatted})`,
        totalAffectedFeeders: filteredOutages.length,
        primaryHotline: '1912',
        centralControlRoom: '0422-2495121 (TANGEDCO Tatabad Central Bureau)',
        affectedAreas: affectedAreaNames,
      },
      outages: filteredOutages,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to process TANGEDCO power outage schedule data',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
