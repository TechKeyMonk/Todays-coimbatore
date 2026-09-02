import { NextResponse } from 'next/server';

export const revalidate = 60;

const METAL_PRICE_API_KEY = 'c0a2a0a0050701fdd9eedf3f1d7668be';
const TROY_OUNCE_TO_GRAMS = 31.1034768;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute server-side cache

interface BullionState {
  gold22k: string;
  gold24k: string;
  silver1g: string;
  silver1kg: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
  rawGold24k?: number;
  rawGold22k?: number;
  rawSilver1g?: number;
  rawSilver1kg?: number;
  lastUpdated: string;
  source: string;
  currency: string;
}

let lastFetchTime = 0;
let previousGold22k = 0;

let bullionState: BullionState = {
  gold22k: '12,546',
  gold24k: '13,686',
  silver1g: '204.15',
  silver1kg: '2,04,154',
  trend: 'up',
  change: '+₹15',
  lastUpdated: new Date().toISOString(),
  source: 'MetalPriceAPI',
  currency: 'INR',
};

async function fetchLiveMetalPrice(force = false): Promise<BullionState> {
  const now = Date.now();
  if (!force && now - lastFetchTime < CACHE_TTL_MS && bullionState.lastUpdated) {
    return bullionState;
  }

  try {
    const url = `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_PRICE_API_KEY}&base=INR&currencies=XAU,XAG`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'TodaysCoimbatore-Bullion/1.0' },
    });

    if (!res.ok) {
      console.warn(`MetalPriceAPI responded with status: ${res.status}`);
      return bullionState;
    }

    const data = await res.json();
    if (data && data.rates) {
      // Rates in INR per Troy Ounce (oz t)
      let inrXau = data.rates.INRXAU;
      let inrXag = data.rates.INRXAG;

      // Fallback if base conversion is inverted (XAU/XAG directly)
      if (!inrXau && data.rates.XAU) {
        inrXau = 1 / data.rates.XAU;
      }
      if (!inrXag && data.rates.XAG) {
        inrXag = 1 / data.rates.XAG;
      }

      if (inrXau && inrXag) {
        // Calculations per gram in INR
        const gold24kPerGram = inrXau / TROY_OUNCE_TO_GRAMS;
        const gold22kPerGram = gold24kPerGram * (22 / 24); // Standard 22K (91.6% purity)
        const silver1g = inrXag / TROY_OUNCE_TO_GRAMS;
        const silver1kg = silver1g * 1000;

        // Calculate dynamic trend & change
        let changeText = '+₹15';
        let trendValue: 'up' | 'down' | 'stable' = 'up';
        if (previousGold22k > 0) {
          const diff = Math.round(gold22kPerGram - previousGold22k);
          if (diff > 0) {
            changeText = `+₹${diff}`;
            trendValue = 'up';
          } else if (diff < 0) {
            changeText = `-₹${Math.abs(diff)}`;
            trendValue = 'down';
          } else {
            changeText = '₹0';
            trendValue = 'stable';
          }
        }
        previousGold22k = gold22kPerGram;

        bullionState = {
          gold22k: Math.round(gold22kPerGram).toLocaleString('en-IN'),
          gold24k: Math.round(gold24kPerGram).toLocaleString('en-IN'),
          silver1g: silver1g.toFixed(2),
          silver1kg: Math.round(silver1kg).toLocaleString('en-IN'),
          rawGold22k: Math.round(gold22kPerGram),
          rawGold24k: Math.round(gold24kPerGram),
          rawSilver1g: Number(silver1g.toFixed(2)),
          rawSilver1kg: Math.round(silver1kg),
          trend: trendValue,
          change: changeText,
          lastUpdated: new Date().toISOString(),
          source: 'MetalPriceAPI (Live INR)',
          currency: 'INR',
        };

        lastFetchTime = now;
      }
    }
  } catch (error) {
    console.error('Failed to fetch from MetalPriceAPI:', error);
  }

  return bullionState;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isRefresh = searchParams.get('refresh') === 'true';

  const state = await fetchLiveMetalPrice(isRefresh);

  return NextResponse.json(
    {
      success: true,
      market: 'Coimbatore & National Spot Rates (MetalPrice API INR)',
      data: state,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    bullionState = {
      ...bullionState,
      ...body,
      source: body.source || 'Admin Manual Broadcast',
      lastUpdated: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: bullionState });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
