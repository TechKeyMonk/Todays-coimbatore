import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('*')
      .not('user_name', 'like', '__SYSTEM_CONFIG_%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API Enquiries] Error querying Supabase enquiries:', error);
      return NextResponse.json({ success: true, data: [] });
    }

    const mapped = (data || []).map((e: any) => ({
      id: e.id,
      name: e.user_name || e.name || 'Anonymous',
      email: e.email || (e.user_phone?.includes('@') ? e.user_phone : ''),
      phone: e.phone || (!e.user_phone?.includes('@') ? e.user_phone : ''),
      subject: e.service_requested || e.subject || 'General Enquiry',
      category: e.service_requested || e.category || 'General Query',
      message: e.message || '',
      status: e.status?.toLowerCase() === 'pending' ? 'unread' : (e.status?.toLowerCase() || 'unread'),
      createdAt: e.created_at || e.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('[API Enquiries] Server exception:', err);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional if ID is provided via query param
    }

    const targetId = id || body.id;
    if (!targetId) {
      return NextResponse.json({ error: 'ID parameter required for deletion' }, { status: 400 });
    }

    // Guard against deleting system config rows
    const { data: targetRow } = await supabaseAdmin
      .from('enquiries')
      .select('id, user_name')
      .eq('id', targetId)
      .maybeSingle();

    if (targetRow && String(targetRow.user_name || '').startsWith('__SYSTEM_CONFIG_')) {
      return NextResponse.json({ error: 'Cannot delete system configuration records.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('enquiries')
      .delete()
      .eq('id', targetId)
      .not('user_name', 'like', '__SYSTEM_CONFIG_%');

    if (error) {
      console.error('[API Enquiries] Supabase DELETE error:', error);
      return NextResponse.json({ error: error.message, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err: any) {
    console.error('[API Enquiries] DELETE exception:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete enquiry', success: false }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('enquiries')
      .update({ status: status.toLowerCase() })
      .eq('id', id)
      .not('user_name', 'like', '__SYSTEM_CONFIG_%');

    if (error) {
      console.error('[API Enquiries] Supabase PATCH error:', error);
      return NextResponse.json({ error: error.message, success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (err: any) {
    console.error('[API Enquiries] PATCH exception:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update enquiry status', success: false }, { status: 500 });
  }
}
