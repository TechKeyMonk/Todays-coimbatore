import { NextResponse } from 'next/server';

export const revalidate = 60;

export interface TrafficAlertItem {
  id: string;
  corridor: string;
  status: string;
  severity: 'smooth' | 'moderate' | 'alert';
  speed: string;
  details: string;
  timeAgo: string;
}

let trafficAlerts: TrafficAlertItem[] = [];

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      city: 'Coimbatore City Traffic Police (CCTP)',
      alerts: trafficAlerts,
      lastUpdated: new Date().toISOString(),
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
    if (body.alerts && Array.isArray(body.alerts)) {
      trafficAlerts = body.alerts;
    }
    return NextResponse.json({ success: true, alerts: trafficAlerts });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
