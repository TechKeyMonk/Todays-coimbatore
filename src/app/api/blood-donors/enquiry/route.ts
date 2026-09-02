import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const FILE_PATH = path.join(DATA_DIR, 'donor_enquiries.json');

let inMemoryCache: DonorContactRequest[] | null = null;
let lastDiskRead = 0;
const CACHE_TTL_MS = 5000;

async function ensureDataFile(): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      await fs.promises.writeFile(FILE_PATH, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Error ensuring donor_enquiries.json file:', err);
  }
}

async function readEnquiries(forceDisk = false): Promise<DonorContactRequest[]> {
  const now = Date.now();
  if (!forceDisk && inMemoryCache && now - lastDiskRead < CACHE_TTL_MS) {
    return inMemoryCache;
  }

  await ensureDataFile();
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = await fs.promises.readFile(FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryCache = parsed;
        lastDiskRead = now;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading donor_enquiries.json:', err);
  }
  inMemoryCache = inMemoryCache || [];
  return inMemoryCache;
}

async function writeEnquiries(enquiries: DonorContactRequest[]): Promise<boolean> {
  inMemoryCache = enquiries;
  lastDiskRead = Date.now();
  await ensureDataFile();
  try {
    await fs.promises.writeFile(FILE_PATH, JSON.stringify(enquiries, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing donor_enquiries.json:', err);
    return false;
  }
}

export async function GET() {
  try {
    const list = await readEnquiries();
    return NextResponse.json(list, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('GET /api/blood-donors/enquiry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blood donor enquiries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientName, hospital, bloodGroup, units, contactPhone, urgency, donorId, donorName, donorPhone, donorBloodGroup } = body;

    if (!patientName || !hospital || !bloodGroup || !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Patient Name, Hospital, Blood Group, and Contact Phone are required' },
        { status: 400 }
      );
    }

    const newEnquiry: DonorContactRequest = {
      id: body.id || `req-${Date.now()}`,
      donorId: donorId || undefined,
      donorName: donorName || undefined,
      donorPhone: donorPhone || undefined,
      donorBloodGroup: donorBloodGroup || undefined,
      patientName: String(patientName).trim(),
      hospital: String(hospital).trim(),
      bloodGroup: String(bloodGroup).trim().toUpperCase(),
      units: Math.max(1, Number(units) || 1),
      contactPhone: String(contactPhone).trim(),
      urgency: urgency === 'Emergency' ? 'Emergency' : 'Within 24 Hours',
      notes: body.notes ? String(body.notes).trim() : undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const list = await readEnquiries();
    list.unshift(newEnquiry);
    await writeEnquiries(list);

    return NextResponse.json({
      success: true,
      message: 'Request submitted! Admin will verify and contact you shortly.',
      enquiry: newEnquiry,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/blood-donors/enquiry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit blood donor enquiry' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID and status are required' },
        { status: 400 }
      );
    }

    let list = await readEnquiries();
    let updated: DonorContactRequest | null = null;
    list = list.map((item) => {
      if (item.id === id) {
        updated = { ...item, status };
        return updated;
      }
      return item;
    });

    if (updated) {
      await writeEnquiries(list);
      return NextResponse.json({ success: true, enquiry: updated });
    }

    return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT /api/blood-donors/enquiry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blood donor enquiry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Enquiry ID is required' }, { status: 400 });
    }

    let list = await readEnquiries();
    const before = list.length;
    list = list.filter((item) => item.id !== id);
    if (list.length < before) {
      await writeEnquiries(list);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE /api/blood-donors/enquiry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blood donor enquiry' },
      { status: 500 }
    );
  }
}
