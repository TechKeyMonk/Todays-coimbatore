import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Enquiries table stores blood donor requests as a service_requested = 'Blood Donor Request'
function mapRowToEnquiry(row: any): DonorContactRequest {
  let parsed: any = {};
  try { parsed = JSON.parse(row.message || '{}'); } catch {}
  return {
    id: row.id,
    donorId: parsed.donorId,
    donorName: parsed.donorName,
    donorPhone: parsed.donorPhone,
    donorBloodGroup: parsed.donorBloodGroup,
    patientName: parsed.patientName || row.user_name || 'Unknown Patient',
    hospital: parsed.hospital || '',
    bloodGroup: parsed.bloodGroup || 'O+',
    units: parsed.units || 1,
    contactPhone: parsed.contactPhone || row.user_phone || '',
    urgency: parsed.urgency || 'Within 24 Hours',
    notes: parsed.notes,
    status: (row.status === 'Verified' || row.status === 'Fulfilled') ? row.status : 'Pending',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('*')
      .eq('service_requested', 'Blood Donor Request')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[blood-donors/enquiry GET] Supabase error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch blood donor enquiries' }, { status: 500 });
    }

    return NextResponse.json((data || []).map(mapRowToEnquiry), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('[blood-donors/enquiry GET] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blood donor enquiries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientName, hospital, bloodGroup, units, contactPhone, urgency, donorId, donorName, donorPhone, donorBloodGroup, notes } = body;

    if (!patientName || !hospital || !bloodGroup || !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Patient Name, Hospital, Blood Group, and Contact Phone are required' },
        { status: 400 }
      );
    }

    const newId = crypto.randomUUID();
    const messagePayload = JSON.stringify({
      patientName: String(patientName).trim(),
      hospital: String(hospital).trim(),
      bloodGroup: String(bloodGroup).trim().toUpperCase(),
      units: Math.max(1, Number(units) || 1),
      contactPhone: String(contactPhone).trim(),
      urgency: urgency === 'Emergency' ? 'Emergency' : 'Within 24 Hours',
      notes: notes ? String(notes).trim() : undefined,
      donorId: donorId || undefined,
      donorName: donorName || undefined,
      donorPhone: donorPhone || undefined,
      donorBloodGroup: donorBloodGroup || undefined,
    });

    const { data: inserted, error } = await supabaseAdmin
      .from('enquiries')
      .insert([{
        id: newId,
        user_name: String(patientName).trim(),
        user_phone: String(contactPhone).trim(),
        service_requested: 'Blood Donor Request',
        message: messagePayload,
        status: 'Pending',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('[blood-donors/enquiry POST] Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Request submitted! Admin will verify and contact you shortly.',
      enquiry: mapRowToEnquiry(inserted),
    }, { status: 201 });
  } catch (error: any) {
    console.error('[blood-donors/enquiry POST] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit blood donor enquiry' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status are required' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('enquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[blood-donors/enquiry PUT] Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, enquiry: mapRowToEnquiry(updated) });
  } catch (error: any) {
    console.error('[blood-donors/enquiry PUT] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update blood donor enquiry' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) { try { const b = await request.json(); id = b.id; } catch {} }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Enquiry ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('enquiries').delete().eq('id', id);
    if (error) {
      console.error('[blood-donors/enquiry DELETE] Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[blood-donors/enquiry DELETE] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete blood donor enquiry' }, { status: 500 });
  }
}
